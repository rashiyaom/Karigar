import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { employeeSchema } from "@/lib/validation"
import { verifyCsrfMiddleware, csrfErrorResponse } from "@/lib/csrf-middleware"
import { checkRequestSize, requestSizeErrorResponse } from "@/lib/request-size-limit"
import { checkApiRateLimit, getApiRateLimitStatus } from "@/lib/api-rate-limit"
import { sanitizeObjectKeys, hasDangerousPatterns } from "@/lib/input-sanitizer"
import type { ApiResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `api:${ip}`

    // Check API rate limit
    if (!checkApiRateLimit(rateLimitKey)) {
      const status = getApiRateLimitStatus(rateLimitKey)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((status.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': status.resetTime.toString(),
          },
        }
      )
    }

    const employees = await mongoStore.getAllEmployees(user.id)
    const status = getApiRateLimitStatus(rateLimitKey)
    
    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: employees,
    })
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', status.remaining.toString())
    response.headers.set('X-RateLimit-Reset', status.resetTime.toString())
    
    return response
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch employees",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `api:${ip}`

    // Check API rate limit
    if (!checkApiRateLimit(rateLimitKey)) {
      const status = getApiRateLimitStatus(rateLimitKey)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((status.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': status.resetTime.toString(),
          },
        }
      )
    }

    // Check request size
    const isValidSize = await checkRequestSize(request)
    if (!isValidSize) {
      return requestSizeErrorResponse()
    }

    // Verify CSRF token for state-changing operation
    const isCsrfValid = await verifyCsrfMiddleware(request)
    if (!isCsrfValid) {
      return csrfErrorResponse()
    }

    const body = await request.json()
    
    // Check for dangerous patterns in request
    if (hasDangerousPatterns(JSON.stringify(body))) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid input detected",
        },
        { status: 400 },
      )
    }

    // Sanitize object keys to prevent NoSQL injection
    const sanitizedBody = sanitizeObjectKeys(body)
    
    const validatedData = employeeSchema.parse(sanitizedBody)

    const employee = await mongoStore.createEmployee(validatedData, user.id)
    const status = getApiRateLimitStatus(rateLimitKey)

    const response = NextResponse.json<ApiResponse>(
      {
        success: true,
        data: employee,
      },
      { status: 201 },
    )
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', status.remaining.toString())
    response.headers.set('X-RateLimit-Reset', status.resetTime.toString())

    return response
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: error.message,
        },
        { status: 400 },
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to create employee",
      },
      { status: 500 },
    )
  }
}
