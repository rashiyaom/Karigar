import { NextRequest, NextResponse } from 'next/server'
import { registerUser, setAuthCookie } from '@/lib/auth'
import { setCsrfToken } from '@/lib/csrf'
import { sanitizeString, hasDangerousPatterns } from '@/lib/input-sanitizer'
import { checkApiRateLimit } from '@/lib/api-rate-limit'

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

    const username = sanitizeString(rawUsername)

    const authResult = await registerUser(username, rawPassword)

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unable to create account. Username may already exist.' },
        { status: 409 }
      )
    }

    await setAuthCookie(authResult.token)
    const csrfToken = await setCsrfToken()

    return NextResponse.json({
      success: true,
      user: authResult.user,
      csrfToken,
    })
  } catch (error) {
    console.error('Register route error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed due to a server error.' },
      { status: 500 }
    )
  }
}
