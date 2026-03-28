/**
 * User Data Export Endpoint
 * GDPR Compliance: Right to Access - "Right to Know" (Article 15)
 * POST /api/user/export
 *
 * Exports all personal data associated with authenticated user
 * Available formats: JSON, CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractRequestMetadata, prepareUserDataExport, exportToJSON, exportToCSV, logGdprEvent } from '@/lib/data-protection'
import { applyCorsHeaders } from '@/lib/cors-config'
import { checkApiRateLimit } from '@/lib/api-rate-limit'

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  const origin = request.headers.get('origin') || undefined
  return applyCorsHeaders(response, origin)
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || undefined
    const { ipAddress } = extractRequestMetadata(request)

    // Rate limiting
    const rateLimitKey = `user-export:${ipAddress}`
    if (!checkApiRateLimit(rateLimitKey, 5, 60 * 60 * 1000)) {
      // 5 exports per hour
      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Too many export requests. Maximum 5 per hour.',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // Parse request body
    const body = await request.json()
    const { userId, username, format = 'json' } = body

    // Validate required fields
    if (!userId || !username) {
      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Missing required fields: userId, username',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // Validate format
    if (!['json', 'csv'].includes(format)) {
      return applyCorsHeaders(
        new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Invalid format. Supported: json, csv',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // In production: Verify user authentication and authorization
    // Currently: Accept any authenticated request

    // Prepare data export
    const exportData = await prepareUserDataExport(userId, username)

    // Log GDPR event
    await logGdprEvent('DATA_EXPORT_REQUEST', userId, {
      format,
      timestamp: new Date().toISOString(),
      ipAddress,
    })

    // Format response based on requested format
    let contentType = 'application/json'
    let exportContent: string

    if (format === 'csv') {
      exportContent = exportToCSV(exportData)
      contentType = 'text/csv'
    } else {
      exportContent = exportToJSON(exportData)
      contentType = 'application/json'
    }

    // Create response with appropriate headers
    const response = new NextResponse(exportContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="user-data-${username}-${new Date().toISOString().split('T')[0]}.${format}"`,
      },
    })

    return applyCorsHeaders(response, origin)
  } catch (error) {
    console.error('User data export error:', error)

    const response = new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Failed to export user data',
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

export async function GET(request: NextRequest) {
  const response = new NextResponse(
    JSON.stringify({
      success: false,
      error: 'Use POST method to request data export',
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const origin = request.headers.get('origin') || undefined
  return applyCorsHeaders(response, origin)
}
