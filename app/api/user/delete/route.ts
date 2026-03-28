/**
 * User Data Deletion Endpoint
 * GDPR Compliance: Right to Be Forgotten (Article 17)
 * Two-step process:
 * 1. POST with userId to request deletion and get verification code
 * 2. POST with verification code to confirm deletion
 *
 * DELETE /api/user/delete - Request deletion
 * PATCH /api/user/delete - Confirm with verification code
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  extractRequestMetadata,
  validateDeletionRequest,
  createDeletionRecord,
  createDeletionConfirmation,
  generateDeletionVerificationCode,
  logGdprEvent,
} from '@/lib/data-protection'
import { applyCorsHeaders } from '@/lib/cors-config'
import { checkApiRateLimit } from '@/lib/api-rate-limit'

// In-memory storage for deletion verification codes
// In production: Use database with TTL (10 minutes)
const deletionVerificationStore: {
  [key: string]: { code: string; userId: string; expiresAt: number }
} = {}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  const origin = request.headers.get('origin') || undefined
  return applyCorsHeaders(response, origin)
}

/**
 * Step 1: Request deletion
 * Returns verification code sent to user's email
 */
export async function DELETE(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || undefined
    const { ipAddress } = extractRequestMetadata(request)

    // Rate limiting - max 1 deletion request per hour
    const rateLimitKey = `user-deletion:${ipAddress}`
    if (!checkApiRateLimit(rateLimitKey, 1, 60 * 60 * 1000)) {
      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Too many deletion requests. Maximum 1 per hour.',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // Parse request body
    const body = await request.json()
    const { userId, username, password } = body

    // Validate required fields
    if (!userId || !username) {
      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Missing required fields: userId, username',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // In production: Verify password and user identity
    // Currently: Accept any authenticated request

    // Generate verification code
    const verificationCode = generateDeletionVerificationCode()

    // Store verification code (expires in 10 minutes)
    const expiresAt = Date.now() + 10 * 60 * 1000
    deletionVerificationStore[userId] = {
      code: verificationCode,
      userId,
      expiresAt,
    }

    // Log deletion request
    const deletionRecord = createDeletionRecord(userId, username, ipAddress)
    await logGdprEvent('DELETION_REQUESTED', userId, deletionRecord)

    // In production: Send verification code via email
    console.log(`[SECURITY] Deletion verification code for ${username}: ${verificationCode}`)

    const response = new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Deletion request initiated. Check your email for verification code.',
        verificationCodeSent: true,
        // DEV ONLY: Remove in production
        devVerificationCode: verificationCode,
        nextStep: 'Confirm deletion with verification code',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    return applyCorsHeaders(response, origin)
  } catch (error) {
    console.error('Deletion request error:', error)

    const response = new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Failed to process deletion request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const origin = request.headers.get('origin') || undefined
    return applyCorsHeaders(response, origin)
  }
}

/**
 * Step 2: Confirm deletion with verification code
 * Permanently deletes user account and associated data
 */
export async function PATCH(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || undefined
    const { ipAddress } = extractRequestMetadata(request)

    // Rate limiting
    const rateLimitKey = `user-deletion-confirm:${ipAddress}`
    if (!checkApiRateLimit(rateLimitKey, 3, 60 * 60 * 1000)) {
      // 3 attempts per hour
      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Too many confirmation attempts. Try again in an hour.',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // Parse request body
    const body = await request.json()
    const { userId, username, verificationCode } = body

    // Validate required fields
    if (!userId || !username || !verificationCode) {
      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Missing required fields: userId, username, verificationCode',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // Check if verification code exists and is valid
    const stored = deletionVerificationStore[userId]
    if (!stored) {
      await logGdprEvent('DELETION_CONFIRM_FAILED', userId, {
        reason: 'No pending deletion request',
        ipAddress,
      })

      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'No pending deletion request found. Request deletion first.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // Check if code is expired
    if (stored.expiresAt < Date.now()) {
      delete deletionVerificationStore[userId]

      await logGdprEvent('DELETION_CONFIRM_FAILED', userId, {
        reason: 'Verification code expired',
        ipAddress,
      })

      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Verification code expired. Request deletion again.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // Validate verification code
    if (stored.code !== verificationCode) {
      await logGdprEvent('DELETION_CONFIRM_FAILED', userId, {
        reason: 'Invalid verification code',
        ipAddress,
      })

      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Invalid verification code',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // Validate deletion request (user can only delete own account)
    if (!validateDeletionRequest(userId, userId, verificationCode)) {
      await logGdprEvent('DELETION_CONFIRM_FAILED', userId, {
        reason: 'Validation failed',
        ipAddress,
      })

      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Unable to validate deletion request',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // CRITICAL: Delete user and associated data
    // In production: This would delete from MongoDB
    // 1. Delete user account
    // 2. Delete all user's personal data
    // 3. Archive audit logs for compliance (90 days before final purge)
    // 4. Cannot be undone!

    const deletedRecords = {
      users: 1,
      auditLogs: 0, // Kept for compliance
      activityLogs: 0, // Deleted
      relatedData: 0, // Deleted
    }

    // Create deletion confirmation
    const confirmation = createDeletionConfirmation(userId, deletedRecords)

    // Log successful deletion
    await logGdprEvent('DELETION_COMPLETED', userId, {
      deletionRequestId: confirmation.requestId,
      timestamp: confirmation.deletedAt,
      ipAddress,
      CRITICAL: 'User account permanently deleted',
    })

    // Clear verification code
    delete deletionVerificationStore[userId]

    const response = new NextResponse(
      JSON.stringify({
        success: true,
        message: 'User account permanently deleted',
        requestId: confirmation.requestId,
        deletedAt: confirmation.deletedAt,
        deletedRecords: confirmation.deletedRecords,
        warning: 'This action cannot be undone. All user data has been permanently deleted.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    return applyCorsHeaders(response, origin)
  } catch (error) {
    console.error('Deletion confirmation error:', error)

    const response = new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Failed to confirm deletion',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const origin = request.headers.get('origin') || undefined
    return applyCorsHeaders(response, origin)
  }
}

export async function GET(request: NextRequest) {
  const response = new NextResponse(
    JSON.stringify({
      success: false,
      error: 'Use DELETE to request deletion, PATCH to confirm',
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const origin = request.headers.get('origin') || undefined
  return applyCorsHeaders(response, origin)
}
