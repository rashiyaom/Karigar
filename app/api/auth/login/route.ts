import { NextRequest, NextResponse } from 'next/server'
import { loginUser, setAuthCookie, regenerateSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { setCsrfToken } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `login:${ip}`

    // Check rate limit (5 attempts per 15 minutes)
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Validate input lengths to prevent abuse
    if (username.length > 100 || password.length > 255) {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      )
    }

    const result = await loginUser(username, password)

    if (!result) {
      // Return generic error message to prevent username enumeration
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Regenerate session to prevent session fixation attacks
    const newToken = await regenerateSession(result.token)

    // Set the new auth cookie
    await setAuthCookie(newToken)

    // Generate and set CSRF token
    const csrfToken = await setCsrfToken()

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        csrfToken, // Send to client to be included in subsequent requests
      },
      { status: 200 }
    )
  } catch (error) {
    // Log error for debugging but don't expose to client
    console.error('Login endpoint error:', error)
    
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    )
  }
}
