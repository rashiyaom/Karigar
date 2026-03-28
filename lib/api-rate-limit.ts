/**
 * General API Rate Limiting
 * Tracks requests per user/IP across all endpoints
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitStore {
  [key: string]: RateLimitEntry
}

// In-memory rate limit store
const apiRateLimitStore: RateLimitStore = {}

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
const API_RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const API_RATE_LIMIT_MAX_REQUESTS = 100 // requests per minute per user/IP

// Start cleanup interval
if (typeof global !== 'undefined') {
  if (!(global as any).rateLimitCleanupStarted) {
    (global as any).rateLimitCleanupStarted = true
    
    setInterval(() => {
      const now = Date.now()
      for (const key in apiRateLimitStore) {
        if (apiRateLimitStore[key].resetTime < now) {
          delete apiRateLimitStore[key]
        }
      }
    }, CLEANUP_INTERVAL)
  }
}

/**
 * Check API rate limit for a user/IP
 * Returns true if request is allowed, false if rate limited
 */
export function checkApiRateLimit(
  key: string,
  maxRequests = API_RATE_LIMIT_MAX_REQUESTS,
  windowMs = API_RATE_LIMIT_WINDOW
): boolean {
  try {
    const now = Date.now()
    const entry = apiRateLimitStore[key]

    if (!entry || entry.resetTime < now) {
      // Create new entry
      apiRateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      }
      return true
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return false
    }

    // Increment count
    entry.count++
    return true
  } catch (error) {
    console.error('API rate limit check error:', error)
    return true // Allow on error
  }
}

/**
 * Get current rate limit status
 */
export function getApiRateLimitStatus(key: string): {
  remaining: number
  resetTime: number
  isLimited: boolean
} {
  try {
    const entry = apiRateLimitStore[key]
    const now = Date.now()

    if (!entry || entry.resetTime < now) {
      return {
        remaining: API_RATE_LIMIT_MAX_REQUESTS,
        resetTime: now + API_RATE_LIMIT_WINDOW,
        isLimited: false,
      }
    }

    return {
      remaining: Math.max(0, API_RATE_LIMIT_MAX_REQUESTS - entry.count),
      resetTime: entry.resetTime,
      isLimited: entry.count >= API_RATE_LIMIT_MAX_REQUESTS,
    }
  } catch (error) {
    console.error('Get rate limit status error:', error)
    return {
      remaining: API_RATE_LIMIT_MAX_REQUESTS,
      resetTime: Date.now() + API_RATE_LIMIT_WINDOW,
      isLimited: false,
    }
  }
}

/**
 * Clear rate limit for a key (useful for cleanup)
 */
export function clearApiRateLimit(key: string): void {
  delete apiRateLimitStore[key]
}

/**
 * Reset all rate limits (useful for testing)
 */
export function resetAllApiRateLimits(): void {
  for (const key in apiRateLimitStore) {
    delete apiRateLimitStore[key]
  }
}
