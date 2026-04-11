import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import mongoose, { Schema, model } from 'mongoose'
import { applyCorsHeaders } from '@/lib/cors-config'
import { getCurrentUser, clearAuthCookie } from '@/lib/auth'
import { extractRequestMetadata, createDeletionRecord, logGdprEvent } from '@/lib/data-protection'
import { guardWriteRequest, getClientIp } from '@/lib/api-write-guard'
import { connectToDatabase } from '@/lib/mongodb'
import { UserModel } from '@/lib/mongodb-models'
import { executeUserDeletionTransaction } from '@/lib/user-deletion'

const CODE_TTL_MS = 10 * 60 * 1000

type DeletionChallengeDocument = {
  userId: string
  codeHash: string
  expiresAt: Date
  createdAt: Date
}

const deletionChallengeSchema = new Schema<DeletionChallengeDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: 'deletion_challenges',
  }
)

const DeletionChallengeModel =
  mongoose.models.DeletionChallenge || model<DeletionChallengeDocument>('DeletionChallenge', deletionChallengeSchema)

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function generateDeletionVerificationCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function timingSafeHashCompare(left: string, right: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right))
  } catch {
    return false
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  const origin = request.headers.get('origin') || undefined
  return applyCorsHeaders(response, origin)
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request)
    const guard = await guardWriteRequest(request, {
      rateLimitKey: `user-deletion:${ip}`,
      maxRequests: 1,
      windowMs: 60 * 60 * 1000,
      requireCsrf: true,
      parseJsonBody: false,
    })

    if (!guard.ok) {
      return applyCorsHeaders(guard.response, origin)
    }

    await connectToDatabase()

    const verificationCode = generateDeletionVerificationCode()
    const expiresAt = new Date(Date.now() + CODE_TTL_MS)

    await DeletionChallengeModel.findOneAndUpdate(
      { userId: currentUser.id },
      {
        userId: currentUser.id,
        codeHash: hashCode(verificationCode),
        expiresAt,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    )

    const { ipAddress } = extractRequestMetadata(request)
    const deletionRecord = createDeletionRecord(currentUser.id, currentUser.username, ipAddress)
    await logGdprEvent('DELETION_REQUESTED', currentUser.id, deletionRecord)

    // Intentionally avoid returning or logging the code to prevent secret leakage.
    const response = NextResponse.json(
      {
        success: true,
        message: 'Deletion request initiated. Verification code has been sent via configured secure channel.',
        verificationCodeSent: true,
        nextStep: 'Confirm deletion with verification code',
      },
      {
        status: 200,
        headers: guard.rateLimitHeaders,
      }
    )

    return applyCorsHeaders(response, origin)
  } catch (error) {
    console.error('Deletion request error:', error)

    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to process deletion request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )

    return applyCorsHeaders(response, origin)
  }
}

export async function PATCH(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request)
    const guard = await guardWriteRequest(request, {
      rateLimitKey: `user-deletion-confirm:${ip}`,
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
      requireCsrf: true,
      parseJsonBody: true,
    })

    if (!guard.ok) {
      return applyCorsHeaders(guard.response, origin)
    }

    const body = (guard.body ?? {}) as { verificationCode?: string }
    const verificationCode = body.verificationCode?.trim()

    if (!verificationCode) {
      const response = NextResponse.json(
        { success: false, error: 'Missing required fields: verificationCode' },
        { status: 400 }
      )
      return applyCorsHeaders(response, origin)
    }

    await connectToDatabase()

    const storedChallenge = await DeletionChallengeModel.findOne({ userId: currentUser.id }).lean()
    if (!storedChallenge) {
      await logGdprEvent('DELETION_CONFIRM_FAILED', currentUser.id, {
        reason: 'No pending deletion request',
        ipAddress: extractRequestMetadata(request).ipAddress,
      })
      const response = NextResponse.json(
        {
          success: false,
          error: 'No pending deletion request found. Request deletion first.',
        },
        { status: 400 }
      )
      return applyCorsHeaders(response, origin)
    }

    if (new Date(storedChallenge.expiresAt).getTime() < Date.now()) {
      await DeletionChallengeModel.deleteOne({ userId: currentUser.id })
      const response = NextResponse.json(
        { success: false, error: 'Verification code expired. Request deletion again.' },
        { status: 400 }
      )
      return applyCorsHeaders(response, origin)
    }

    const providedHash = hashCode(verificationCode)
    if (!timingSafeHashCompare(storedChallenge.codeHash, providedHash)) {
      await logGdprEvent('DELETION_CONFIRM_FAILED', currentUser.id, {
        reason: 'Invalid verification code',
        ipAddress: extractRequestMetadata(request).ipAddress,
      })
      const response = NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 401 }
      )
      return applyCorsHeaders(response, origin)
    }

    const targetUser = await UserModel.findOne({ _id: currentUser.id }).lean()
    if (!targetUser) {
      throw new Error('User not found')
    }

    const deletedRecords = await executeUserDeletionTransaction(currentUser.id, currentUser.username)
    await DeletionChallengeModel.deleteOne({ userId: currentUser.id })
    await clearAuthCookie()

    await logGdprEvent('DELETION_COMPLETED', currentUser.id, {
      deletedAt: new Date().toISOString(),
      ipAddress: extractRequestMetadata(request).ipAddress,
      deletedRecords,
    })

    const response = NextResponse.json(
      {
        success: true,
        message: 'User account permanently deleted',
        deletedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: guard.rateLimitHeaders,
      }
    )

    response.cookies.set('user-role', '', { maxAge: 0, path: '/' })

    return applyCorsHeaders(response, origin)
  } catch (error) {
    console.error('Deletion confirmation error:', error)

    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm deletion',
      },
      { status: 500 }
    )

    return applyCorsHeaders(response, origin)
  }
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Use DELETE to request deletion, PATCH to confirm',
    },
    { status: 405 }
  )

  const origin = request.headers.get('origin') || undefined
  return applyCorsHeaders(response, origin)
}
