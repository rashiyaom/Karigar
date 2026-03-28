import { NextRequest, NextResponse } from 'next/server'

// Maximum request body size (1MB default)
const MAX_REQUEST_SIZE = parseInt(process.env.MAX_REQUEST_SIZE || '1048576')

/**
 * Middleware to enforce request size limits
 * Prevents denial of service attacks through large payloads
 */
export async function checkRequestSize(request: NextRequest): Promise<boolean> {
  try {
    // Only check for methods that typically have request bodies
    const method = request.method.toUpperCase()
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return true
    }

    // Get content-length header
    const contentLength = request.headers.get('content-length')
    
    if (!contentLength) {
      return true // Allow if no content-length header
    }

    const size = parseInt(contentLength)
    
    if (size > MAX_REQUEST_SIZE) {
      return false
    }

    return true
  } catch (error) {
    console.error('Request size check error:', error)
    return true // Allow on error
  }
}

/**
 * Error response for oversized requests
 */
export function requestSizeErrorResponse(): NextResponse {
  return NextResponse.json(
    { 
      error: 'Request payload too large',
      maxSize: MAX_REQUEST_SIZE,
    },
    { status: 413 }
  )
}
