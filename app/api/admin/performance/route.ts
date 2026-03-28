/**
 * Performance Monitoring Endpoint
 * GET /api/admin/performance
 *
 * Provides system performance metrics and health information
 * Admin only endpoint for monitoring system health
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPerformanceReport,
  getHealthCheck,
  getEndpointMetrics,
  getRecentMetrics,
  checkPerformanceAlerts,
} from '@/lib/performance-monitor'
import { applyCorsHeaders } from '@/lib/cors-config'
import { checkApiRateLimit } from '@/lib/api-rate-limit'

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  const origin = request.headers.get('origin') || undefined
  return applyCorsHeaders(response, origin)
}

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || undefined
    const ipAddress =
      (request.headers.get('x-forwarded-for') as string)?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // Rate limiting - max 20 requests per minute
    const rateLimitKey = `performance-api:${ipAddress}`
    if (!checkApiRateLimit(rateLimitKey, 20, 60 * 1000)) {
      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // Parse query parameters
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') || 'report' // report, health, endpoint, recent, alerts
    const endpoint = searchParams.get('endpoint') || ''
    const minutes = parseInt(searchParams.get('minutes') || '5')

    let responseData: any

    switch (type) {
      case 'health':
        responseData = getHealthCheck()
        break

      case 'endpoint':
        if (!endpoint) {
          return applyCorsHeaders(
            new NextResponse(
              JSON.stringify({
                success: false,
                error: 'endpoint parameter required for type=endpoint',
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ),
            origin
          )
        }
        responseData = getEndpointMetrics(endpoint)
        if (!responseData) {
          return applyCorsHeaders(
            new NextResponse(
              JSON.stringify({
                success: false,
                error: `No metrics found for endpoint: ${endpoint}`,
              }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            ),
            origin
          )
        }
        break

      case 'recent':
        responseData = getRecentMetrics(minutes)
        break

      case 'alerts':
        responseData = {
          alerts: checkPerformanceAlerts(),
          timestamp: new Date().toISOString(),
        }
        break

      case 'report':
      default:
        responseData = getPerformanceReport()
        break
    }

    const response = new NextResponse(
      JSON.stringify({
        success: true,
        type,
        data: responseData,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    return applyCorsHeaders(response, origin)
  } catch (error) {
    console.error('Performance monitoring error:', error)

    const response = new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Failed to retrieve performance metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const origin = request.headers.get('origin') || undefined
    return applyCorsHeaders(response, origin)
  }
}
