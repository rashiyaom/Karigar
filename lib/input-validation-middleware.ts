import { NextRequest, NextResponse } from 'next/server'
import { detectParameterPollution, detectHeaderPollution, validateContentType } from './parameter-pollution-detector'

/**
 * Comprehensive input validation middleware
 * Runs all Phase 3 security checks
 */
export async function validateInputSecurity(
  request: NextRequest
): Promise<{ valid: boolean; response?: NextResponse }> {
  try {
    // Check for parameter pollution
    if (detectParameterPollution(request)) {
      console.warn('Parameter pollution detected')
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Invalid request parameters' },
          { status: 400 }
        ),
      }
    }

    // Check for header pollution
    if (detectHeaderPollution(request)) {
      console.warn('Header pollution detected')
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Invalid request headers' },
          { status: 400 }
        ),
      }
    }

    // Validate content-type
    if (!validateContentType(request)) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Invalid content-type' },
          { status: 400 }
        ),
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('Input security validation error:', error)
    return { valid: true } // Allow on error
  }
}
