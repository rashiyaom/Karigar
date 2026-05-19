import { NextRequest, NextResponse } from 'next/server'
import { getCsrfToken, setCsrfToken } from '@/lib/csrf'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET endpoint to retrieve or initialize CSRF token
 * Can be called on initial page load or when token expires
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Try to get existing token
    let token = await getCsrfToken()

    // If no token exists, create a new one
    if (!token) {
      token = await setCsrfToken()
    }

    return NextResponse.json({
      success: true,
      csrfToken: token,
    })
  } catch (error) {
    console.error('CSRF token retrieval error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve CSRF token' },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint to refresh CSRF token
 * Useful when token expires or on sensitive operations
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate a new token
    const token = await setCsrfToken()

    return NextResponse.json({
      success: true,
      csrfToken: token,
    })
  } catch (error) {
    console.error('CSRF token refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to refresh CSRF token' },
      { status: 500 }
    )
  }
}
