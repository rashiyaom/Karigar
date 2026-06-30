import crypto from 'crypto'
import { cookies } from 'next/headers'

const CSRF_COOKIE_NAME = 'csrf-token'
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
  
  // Set non-httpOnly cookie so client JS can read it for the double-submit pattern.
  // The CSRF protection comes from matching the cookie value against the header value,
  // not from hiding the token — that's what the same-site cookie already handles.
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
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
  } catch {
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

/**
 * Reset CSRF token - generate and set a new one
 * Useful for re-initializing CSRF protection in middleware
 */
export async function resetCsrfToken(): Promise<string> {
  await clearCsrfToken()
  return await setCsrfToken()
}
