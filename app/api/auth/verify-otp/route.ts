import { NextRequest, NextResponse } from 'next/server'
import { checkApiRateLimit } from '@/lib/api-rate-limit'
import { sanitizeObjectKeys, hasDangerousPatterns } from '@/lib/input-sanitizer'
import { RegistrationOtpChallengeModel } from '@/lib/mongodb-models'
import { connectToDatabase } from '@/lib/mongodb'
import {
  normalizeMobile,
  isValidMobile,
  hashOtp,
  generateVerificationToken,
  getVerificationTokenExpiryDate,
} from '@/lib/mobile-verification'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (!checkApiRateLimit(`register-otp-verify:${ip}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Too many OTP attempts. Try again later.' }, { status: 429 })
    }

    const body = sanitizeObjectKeys(await request.json()) as { mobile?: string; otp?: string }
    const rawMobile = typeof body?.mobile === 'string' ? body.mobile : ''
    const rawOtp = typeof body?.otp === 'string' ? body.otp.trim() : ''

    if (!rawMobile || !rawOtp || hasDangerousPatterns(rawMobile) || hasDangerousPatterns(rawOtp)) {
      return NextResponse.json({ success: false, error: 'Invalid OTP verification request.' }, { status: 400 })
    }

    if (!/^\d{4,8}$/.test(rawOtp)) {
      return NextResponse.json({ success: false, error: 'Enter a valid OTP code.' }, { status: 400 })
    }

    const mobile = normalizeMobile(rawMobile)
    if (!isValidMobile(mobile)) {
      return NextResponse.json({ success: false, error: 'Enter a valid mobile number.' }, { status: 400 })
    }

    await connectToDatabase()

    const challenge = await RegistrationOtpChallengeModel.findOne({ mobile })
    if (!challenge) {
      return NextResponse.json({ success: false, error: 'OTP not requested for this mobile number.' }, { status: 400 })
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      await RegistrationOtpChallengeModel.deleteOne({ mobile })
      return NextResponse.json({ success: false, error: 'OTP expired. Please request a new one.' }, { status: 400 })
    }

    if (challenge.attemptCount >= 5) {
      return NextResponse.json({ success: false, error: 'Too many invalid attempts. Request a new OTP.' }, { status: 429 })
    }

    const providedHash = hashOtp(rawOtp)
    if (challenge.otpHash !== providedHash) {
      challenge.attemptCount += 1
      await challenge.save()
      return NextResponse.json({ success: false, error: 'Invalid OTP code.' }, { status: 401 })
    }

    const verificationToken = generateVerificationToken()
    const verificationExpiresAt = getVerificationTokenExpiryDate()

    challenge.isVerified = true
    challenge.verificationToken = verificationToken
    challenge.verificationExpiresAt = verificationExpiresAt
    challenge.attemptCount = 0
    await challenge.save()

    return NextResponse.json({
      success: true,
      data: {
        verificationToken,
        verificationExpiresAt: verificationExpiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Verify OTP route error:', error)
    return NextResponse.json({ success: false, error: 'Failed to verify OTP.' }, { status: 500 })
  }
}
