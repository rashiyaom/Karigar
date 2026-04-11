import { NextRequest, NextResponse } from 'next/server'
import { checkApiRateLimit } from '@/lib/api-rate-limit'
import { sanitizeObjectKeys, hasDangerousPatterns } from '@/lib/input-sanitizer'
import { RegistrationOtpChallengeModel, UserModel } from '@/lib/mongodb-models'
import { connectToDatabase } from '@/lib/mongodb'
import {
  normalizeMobile,
  isValidMobile,
  generateOtpCode,
  hashOtp,
  getOtpExpiryDate,
  sendOtpViaMsg91,
} from '@/lib/mobile-verification'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (!checkApiRateLimit(`register-otp-send:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Too many OTP requests. Try again later.' }, { status: 429 })
    }

    const body = sanitizeObjectKeys(await request.json()) as { mobile?: string }
    const rawMobile = typeof body?.mobile === 'string' ? body.mobile : ''

    if (!rawMobile || hasDangerousPatterns(rawMobile)) {
      return NextResponse.json({ success: false, error: 'Invalid mobile number.' }, { status: 400 })
    }

    const mobile = normalizeMobile(rawMobile)
    if (!isValidMobile(mobile)) {
      return NextResponse.json({ success: false, error: 'Enter a valid mobile number.' }, { status: 400 })
    }

    await connectToDatabase()

    const existingUser = await UserModel.findOne({ mobile }).select('_id').lean()
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Mobile number already exists.' }, { status: 409 })
    }

    const otp = generateOtpCode()
    const otpHash = hashOtp(otp)
    const expiresAt = getOtpExpiryDate()

    const sendResult = await sendOtpViaMsg91(mobile, otp)

    await RegistrationOtpChallengeModel.findOneAndUpdate(
      { mobile },
      {
        mobile,
        otpHash,
        expiresAt,
        attemptCount: 0,
        lastSentAt: new Date(),
        isVerified: false,
        verificationToken: null,
        verificationExpiresAt: null,
        providerRequestId: sendResult.providerRequestId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return NextResponse.json({
      success: true,
      data: {
        expiresAt: expiresAt.toISOString(),
        // Useful for local/dev testing when MSG91 creds are not configured.
        debugOtp: sendResult.isMock ? otp : undefined,
      },
    })
  } catch (error) {
    console.error('Send OTP route error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send OTP.' },
      { status: 500 }
    )
  }
}
