import { NextRequest, NextResponse } from 'next/server'
import { registerUser, setAuthCookie } from '@/lib/auth'
import { sanitizeObjectKeys, hasDangerousPatterns } from '@/lib/input-sanitizer'
import { checkApiRateLimit } from '@/lib/api-rate-limit'
import { settingsSchema } from '@/lib/validation'
import { mongoStore } from '@/lib/mongo-store'
import { ZodError } from 'zod'

const ROLE_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeMobile(value: string): string {
  return value.trim().replace(/\s+/g, '')
}

function isEmailIdentifier(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isMobileIdentifier(value: string): boolean {
  return /^\+?[0-9]{10,15}$/.test(value)
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `register:${ip}`

    if (!checkApiRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Too many registration attempts. Try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const rawUsername = typeof body?.username === 'string' ? body.username : ''
    const rawPassword = typeof body?.password === 'string' ? body.password : ''
    const rawSettings = body?.settings && typeof body.settings === 'object' ? sanitizeObjectKeys(body.settings) : null

    if (!rawUsername || !rawPassword) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required.' },
        { status: 400 }
      )
    }

    if (rawPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    if (hasDangerousPatterns(rawUsername) || hasDangerousPatterns(rawPassword)) {
      return NextResponse.json(
        { success: false, error: 'Invalid input detected.' },
        { status: 400 }
      )
    }

    const username = normalizeIdentifier(rawUsername)

    let settingsPayload: ReturnType<typeof settingsSchema.parse> | null = null
    if (rawSettings) {
      const parsed = settingsSchema.safeParse(rawSettings)
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: parsed.error.issues[0]?.message || 'Invalid settings payload.',
          },
          { status: 400 }
        )
      }
      settingsPayload = parsed.data
    }
    const emailFromSettings = settingsPayload?.companyEmail ? normalizeIdentifier(settingsPayload.companyEmail) : undefined
    const mobileFromSettings = settingsPayload?.companyPhone ? normalizeMobile(settingsPayload.companyPhone) : undefined

    const derivedEmail = isEmailIdentifier(username) ? username : emailFromSettings
    const derivedMobile = isMobileIdentifier(username) ? normalizeMobile(username) : mobileFromSettings

    const authResult = await registerUser({
      username,
      password: rawPassword,
      email: derivedEmail,
      mobile: derivedMobile,
    })

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unable to create account. Username may already exist.' },
        { status: 409 }
      )
    }

    if (settingsPayload) {
      await mongoStore.updateSettings(settingsPayload, authResult.user.id)
    }

    await setAuthCookie(authResult.token)

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
    })

    response.cookies.set('user-role', authResult.user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ROLE_COOKIE_MAX_AGE_SECONDS,
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message || 'Invalid request payload.',
        },
        { status: 400 }
      )
    }
    console.error('Register route error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed due to a server error.' },
      { status: 500 }
    )
  }
}
