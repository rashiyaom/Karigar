import { NextRequest, NextResponse } from 'next/server'
import { loginUser, setAuthCookie } from '@/lib/auth'
import { setCsrfToken } from '@/lib/csrf'
import { hasDangerousPatterns } from '@/lib/input-sanitizer'
import { checkApiRateLimit } from '@/lib/api-rate-limit'
import { logSuccessfulLogin, logFailedLoginAttempt, logInjectionAttempt } from '@/lib/security-events'

const ROLE_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `login:${ip}`

    if (!checkApiRateLimit(rateLimitKey, 10, 15 * 60 * 1000)) {
      await logFailedLoginAttempt('unknown', request, 'RATE_LIMITED')
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const rawIdentifier = typeof body?.username === 'string' ? body.username : ''
    const rawPassword = typeof body?.password === 'string' ? body.password : ''

    if (!rawIdentifier || !rawPassword) {
      return NextResponse.json(
        { success: false, error: 'Username, mobile/email, and password are required.' },
        { status: 400 }
      )
    }

    const identifier = normalizeIdentifier(rawIdentifier)

    if (hasDangerousPatterns(rawIdentifier) || hasDangerousPatterns(rawPassword)) {
      await logInjectionAttempt(rawIdentifier || 'unknown', rawIdentifier, request)
      return NextResponse.json(
        { success: false, error: 'Invalid input detected.' },
        { status: 400 }
      )
    }

    const authResult = await loginUser(identifier, rawPassword)

    if (!authResult) {
      await logFailedLoginAttempt(identifier || 'unknown', request, 'INVALID_CREDENTIALS')
      return NextResponse.json(
        { success: false, error: 'Invalid username, mobile/email, or password.' },
        { status: 401 }
      )
    }

    await setAuthCookie(authResult.token)
    const csrfToken = await setCsrfToken()
    await logSuccessfulLogin(authResult.user.username, request)

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      csrfToken,
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
    console.error('Login route error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed due to a server error.' },
      { status: 500 }
    )
  }
}
