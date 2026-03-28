// Simple in-memory rate limiting for demo purposes
// In production, use Redis for distributed rate limiting

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (record.count >= maxAttempts) {
    return false
  }

  record.count++
  return true
}

export function getRateLimitStatus(key: string): { remaining: number; resetTime: number | null } {
  const record = rateLimitStore.get(key)

  if (!record || Date.now() > record.resetTime) {
    return { remaining: 5, resetTime: null }
  }

  return {
    remaining: Math.max(0, 5 - record.count),
    resetTime: record.resetTime,
  }
}

// Clean up expired records every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

