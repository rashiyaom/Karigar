import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/lib/mongodb-models'
import { connectToDatabase } from '@/lib/mongodb'
import { sanitizeObjectKeys, hasDangerousPatterns } from '@/lib/input-sanitizer'
import { normalizeMobile, isValidMobile } from '@/lib/mobile-verification'

type IdentifierType = 'username' | 'email' | 'mobile'

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase()
}

function inferIdentifierType(value: string): IdentifierType {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'email'
  }
  if (isValidMobile(value)) {
    return 'mobile'
  }
  return 'username'
}

export async function POST(request: NextRequest) {
  try {
    const body = sanitizeObjectKeys(await request.json()) as { identifier?: string; mobile?: string }
    const identifierRaw = typeof body?.identifier === 'string' ? body.identifier : ''
    const mobileRaw = typeof body?.mobile === 'string' ? body.mobile : ''

    if (identifierRaw && hasDangerousPatterns(identifierRaw)) {
      return NextResponse.json({ success: false, error: 'Invalid identifier.' }, { status: 400 })
    }

    if (mobileRaw && hasDangerousPatterns(mobileRaw)) {
      return NextResponse.json({ success: false, error: 'Invalid mobile number.' }, { status: 400 })
    }

    await connectToDatabase()

    const result: {
      identifierType?: IdentifierType
      identifierExists?: boolean
      mobileExists?: boolean
    } = {}

    if (identifierRaw) {
      const identifier = normalizeIdentifier(identifierRaw)
      const identifierType = inferIdentifierType(identifier)
      result.identifierType = identifierType

      if (identifierType === 'mobile') {
        const normalized = normalizeMobile(identifier)
        result.identifierExists = !!(await UserModel.findOne({ mobile: normalized }).select('_id').lean())
      } else if (identifierType === 'email') {
        result.identifierExists = !!(await UserModel.findOne({ email: identifier }).select('_id').lean())
      } else {
        result.identifierExists = !!(await UserModel.findOne({ username: identifier }).select('_id').lean())
      }
    }

    if (mobileRaw) {
      const normalizedMobile = normalizeMobile(mobileRaw)
      if (!isValidMobile(normalizedMobile)) {
        return NextResponse.json({ success: false, error: 'Enter a valid mobile number.' }, { status: 400 })
      }
      result.mobileExists = !!(await UserModel.findOne({ mobile: normalizedMobile }).select('_id').lean())
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Check availability route error:', error)
    return NextResponse.json({ success: false, error: 'Failed to check availability.' }, { status: 500 })
  }
}
