import crypto from 'crypto'

/**
 * Timing-safe string comparison
 * Prevents timing attacks by always comparing all characters
 * regardless of when a mismatch is found
 */
export function timingSafeEqual(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch (error) {
    // Length mismatch or invalid input
    return false
  }
}

/**
 * Timing-safe comparison for buffer data
 */
export function timingSafeBufferEqual(a: Buffer, b: Buffer): boolean {
  try {
    return crypto.timingSafeEqual(a, b)
  } catch (error) {
    return false
  }
}

/**
 * Hash comparison with timing-safe protection
 * Useful for comparing stored hashes with computed hashes
 */
export async function timingSafeHashCompare(
  plaintext: string,
  hash: string,
  hashFunction: (text: string) => Promise<string>
): Promise<boolean> {
  try {
    const computedHash = await hashFunction(plaintext)
    return timingSafeEqual(computedHash, hash)
  } catch (error) {
    console.error('Hash comparison error:', error)
    return false
  }
}

/**
 * Constant time string comparison for general use
 * More robust than simple === operator
 */
export function constantTimeStringCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false
  }

  // Ensure we have buffers of the same length
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')

  if (aBuf.length !== bBuf.length) {
    return false
  }

  return timingSafeBufferEqual(aBuf, bBuf)
}
