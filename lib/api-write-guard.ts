import { NextRequest, NextResponse } from 'next/server'
import { checkApiRateLimit, getApiRateLimitStatus } from './api-rate-limit'
import { verifyCsrfMiddleware, csrfErrorResponse } from './csrf-middleware'
import { checkRequestSize, requestSizeErrorResponse } from './request-size-limit'
import { sanitizeObjectKeys, hasDangerousPatterns } from './input-sanitizer'

type GuardOptions = {
  rateLimitKey: string
  maxRequests?: number
  windowMs?: number
  requireCsrf?: boolean
  parseJsonBody?: boolean
}

type GuardSuccess = {
  ok: true
  body: unknown
  rateLimitHeaders: Record<string, string>
}

type GuardFailure = {
  ok: false
  response: NextResponse
}

export type GuardResult = GuardSuccess | GuardFailure

export async function guardWriteRequest(
  request: NextRequest,
  options: GuardOptions
): Promise<GuardResult> {
  const {
    rateLimitKey,
    maxRequests = 100,
    windowMs = 60 * 1000,
    requireCsrf = false,
    parseJsonBody = true,
  } = options

  if (!checkApiRateLimit(rateLimitKey, maxRequests, windowMs)) {
    const status = getApiRateLimitStatus(rateLimitKey)
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((status.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(status.resetTime),
          },
        }
      ),
    }
  }

  const isValidSize = await checkRequestSize(request)
  if (!isValidSize) {
    return { ok: false, response: requestSizeErrorResponse() }
  }

  if (requireCsrf) {
    const isCsrfValid = await verifyCsrfMiddleware(request)
    if (!isCsrfValid) {
      return { ok: false, response: csrfErrorResponse() }
    }
  }

  let sanitizedBody: unknown = null
  if (parseJsonBody) {
    const body = await request.json()
    sanitizedBody = sanitizeObjectKeys(body)

    if (hasDangerousPatterns(JSON.stringify(sanitizedBody))) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: 'Invalid input detected.' },
          { status: 400 }
        ),
      }
    }
  }

  const currentStatus = getApiRateLimitStatus(rateLimitKey)

  return {
    ok: true,
    body: sanitizedBody,
    rateLimitHeaders: {
      'X-RateLimit-Limit': String(maxRequests),
      'X-RateLimit-Remaining': String(currentStatus.remaining),
      'X-RateLimit-Reset': String(currentStatus.resetTime),
    },
  }
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
}
