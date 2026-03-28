import crypto from 'crypto'
import { cookies } from 'next/headers'

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_LENGTH = 32

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Set CSRF token in HTTP-only cookie
 * Store token in memory for comparison
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  const cookieStore = await cookies()
  
  // Set HTTP-only, Secure, SameSite=Strict cookie
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return token
}

/**
 * Verify CSRF token from request
 * Compare token from header with cookie
 */
export async function verifyCsrfToken(token: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

    if (!cookieToken || !token) {
      return false
    }

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(token)
    )
  } catch (error) {
    // Timing safe equal throws on length mismatch, return false
    return false
  }
}

/**
 * Get CSRF token from cookie (read-only)
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null
}

/**
 * Clear CSRF token
 */
export async function clearCsrfToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_COOKIE_NAME)
}
