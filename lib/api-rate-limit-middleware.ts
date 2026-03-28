import { NextRequest, NextResponse } from 'next/server'
import { checkApiRateLimit, getApiRateLimitStatus } from './api-rate-limit'
import { getCurrentUser } from './auth'

/**
 * Middleware to apply API rate limiting
 * Prioritizes user ID, falls back to IP address
 */
export async function enforceApiRateLimit(request: NextRequest): Promise<{ allowed: boolean; response?: NextResponse }> {
  try {
    // Get user or IP for rate limit key
    let rateLimitKey: string

    // Try to get authenticated user first
    const user = await getCurrentUser()
    if (user?.id) {
      rateLimitKey = `user:${user.id}`
    } else {
      // Fall back to IP-based limiting
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      rateLimitKey = `ip:${ip}`
    }

    // Check rate limit
    const allowed = checkApiRateLimit(rateLimitKey, 100, 60 * 1000) // 100 requests per minute

    if (!allowed) {
      const status = getApiRateLimitStatus(rateLimitKey)
      
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((status.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((status.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': status.resetTime.toString(),
            },
          }
        ),
      }
    }

    const status = getApiRateLimitStatus(rateLimitKey)
    
    // Return rate limit headers to include in response
    return {
      allowed: true,
      response: NextResponse.json({
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': status.remaining.toString(),
          'X-RateLimit-Reset': status.resetTime.toString(),
        },
      }),
    }
  } catch (error) {
    console.error('API rate limit middleware error:', error)
    // Allow request on error
    return { allowed: true }
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())
  return response
}
