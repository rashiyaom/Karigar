import { NextRequest } from 'next/server'

/**
 * Detect and prevent HTTP Parameter Pollution (HPP) attacks
 * Checks for duplicate parameters which could be exploited
 */
export function detectParameterPollution(request: NextRequest): boolean {
  try {
    const url = new URL(request.url)
    const params = url.searchParams

    // Get all parameter names
    const paramNames = new Set<string>()
    const seenParams = new Set<string>()

    for (const [key] of params) {
      if (paramNames.has(key)) {
        // Duplicate parameter detected
        return true
      }
      paramNames.add(key)
    }

    return false
  } catch (error) {
    console.error('Parameter pollution detection error:', error)
    return false
  }
}

/**
 * Prevent common header pollution attacks
 */
export function detectHeaderPollution(request: NextRequest): boolean {
  try {
    const dangerousHeaders = [
      'x-forwarded-for',
      'x-forwarded-proto',
      'x-forwarded-host',
      'x-original-url',
      'x-original-method',
    ]

    for (const header of dangerousHeaders) {
      const value = request.headers.get(header)
      
      // Check if header appears multiple times (potential HPP)
      if (value && value.includes(',') && value.split(',').length > 2) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Header pollution detection error:', error)
    return false
  }
}

/**
 * Check for content-type mismatches (could indicate attack)
 */
export function validateContentType(request: NextRequest): boolean {
  try {
    const method = request.method.toUpperCase()
    const contentType = request.headers.get('content-type')

    // For POST/PUT/PATCH, require content-type
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (!contentType) {
        return false
      }

      // Ensure valid content-type
      const validTypes = [
        'application/json',
        'multipart/form-data',
        'application/x-www-form-urlencoded',
      ]

      return validTypes.some(type => contentType.includes(type))
    }

    return true
  } catch (error) {
    console.error('Content-type validation error:', error)
    return true
  }
}
