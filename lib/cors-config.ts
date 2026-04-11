/**
 * CORS Configuration
 * Implements strict Cross-Origin Resource Sharing policy
 * GDPR Compliance: Prevents unauthorized cross-origin access
 */

import { NextRequest, NextResponse } from 'next/server'

// Allowed origins - configure based on environment
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
]

// Allowed methods for CORS
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']

// Allowed headers
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-CSRF-Token',
  'Accept',
  'Accept-Language',
  'Cache-Control',
]

// Headers that can be exposed to the client
const EXPOSED_HEADERS = ['Content-Length', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false

  // In production, enforce strict CORS
  if (process.env.NODE_ENV === 'production') {
    return ALLOWED_ORIGINS.includes(origin)
  }

  // In development, allow localhost variants
  return (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1')
  )
}

/**
 * Get CORS headers for a response
 */
export function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    'Access-Control-Expose-Headers': EXPOSED_HEADERS.join(', '),
    'Access-Control-Max-Age': '3600',
    'Access-Control-Allow-Credentials': 'true',
  }

  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin || ''
  }

  return headers
}

/**
 * Handle CORS preflight requests (OPTIONS)
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin') || undefined

  if (!isOriginAllowed(origin)) {
    return new NextResponse('CORS origin not allowed', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  const headers = getCorsHeaders(origin)

  return new NextResponse(null, {
    status: 204,
    headers,
  })
}

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(
  response: NextResponse,
  origin: string | undefined
): NextResponse {
  const corsHeaders = getCorsHeaders(origin)

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Middleware for applying CORS to all responses
 */
export function corsMiddleware(request: NextRequest, _origin: string | undefined) {
  void _origin
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request)
  }

  return null // Continue to route handler
}

/**
 * Validate CORS request
 */
export function validateCorsRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin')

  // No origin header means not a CORS request
  if (!origin) return true

  // Check if origin is allowed
  return isOriginAllowed(origin)
}

/**
 * Get safe CORS configuration object
 */
export function getCorsConfig() {
  return {
    allowedOrigins: ALLOWED_ORIGINS,
    allowedMethods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: EXPOSED_HEADERS,
    credentials: true,
    maxAge: 3600,
  }
}
