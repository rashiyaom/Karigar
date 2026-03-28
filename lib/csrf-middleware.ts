import { NextRequest, NextResponse } from 'next/server'
import { verifyCsrfToken } from './csrf'

/**
 * Middleware to verify CSRF token for state-changing operations
 * Should be used on POST, PUT, PATCH, DELETE endpoints
 */
export async function verifyCsrfMiddleware(request: NextRequest): Promise<boolean> {
  try {
    const method = request.method.toUpperCase()

    // Only verify for state-changing methods
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
    if (!stateChangingMethods.includes(method)) {
      return true
    }

    // Get CSRF token from request header
    const csrfToken = request.headers.get('x-csrf-token')

    if (!csrfToken) {
      return false
    }

    // Verify token
    return await verifyCsrfToken(csrfToken)
  } catch (error) {
    console.error('CSRF verification error:', error)
    return false
  }
}

/**
 * Middleware response for failed CSRF verification
 */
export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: 'CSRF token invalid or expired' },
    { status: 403 }
  )
}
