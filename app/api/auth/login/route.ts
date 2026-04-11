import { NextRequest, NextResponse } from 'next/server'
import { loginUser, setAuthCookie } from '@/lib/auth'
import { setCsrfToken } from '@/lib/csrf'
import { sanitizeString, hasDangerousPatterns } from '@/lib/input-sanitizer'
import { checkApiRateLimit } from '@/lib/api-rate-limit'
import { logSuccessfulLogin, logFailedLoginAttempt, logInjectionAttempt } from '@/lib/security-events'

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
    const rawUsername = typeof body?.username === 'string' ? body.username : ''
    const rawPassword = typeof body?.password === 'string' ? body.password : ''

    if (!rawUsername || !rawPassword) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required.' },
        { status: 400 }
      )
    }

    const username = sanitizeString(rawUsername)

    if (hasDangerousPatterns(rawUsername) || hasDangerousPatterns(rawPassword)) {
      await logInjectionAttempt(rawUsername || 'unknown', `${rawUsername}:${rawPassword}`, request)
      return NextResponse.json(
        { success: false, error: 'Invalid input detected.' },
        { status: 400 }
      )
    }

    const authResult = await loginUser(username, rawPassword)

    if (!authResult) {
      await logFailedLoginAttempt(username || 'unknown', request, 'INVALID_CREDENTIALS')
      return NextResponse.json(
        { success: false, error: 'Invalid username or password.' },
        { status: 401 }
      )
    }

    await setAuthCookie(authResult.token)
    const csrfToken = await setCsrfToken()
    await logSuccessfulLogin(authResult.user.username, request)

    return NextResponse.json({
      success: true,
      user: authResult.user,
      csrfToken,
    })
  } catch (error) {
    console.error('Login route error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed due to a server error.' },
      { status: 500 }
    )
  }
}
