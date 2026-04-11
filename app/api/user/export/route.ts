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
import { getCurrentUser } from '@/lib/auth'
import { guardWriteRequest, getClientIp } from '@/lib/api-write-guard'

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  const origin = request.headers.get('origin') || undefined
  return applyCorsHeaders(response, origin)
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const origin = request.headers.get('origin') || undefined
    const { ipAddress } = extractRequestMetadata(request)

    const ip = getClientIp(request)
    const guard = await guardWriteRequest(request, {
      rateLimitKey: `user-export:${ip}`,
      maxRequests: 5,
      windowMs: 60 * 60 * 1000,
      requireCsrf: true,
      parseJsonBody: true,
    })

    if (!guard.ok) {
      return applyCorsHeaders(guard.response, origin)
    }

    const body = (guard.body ?? {}) as { format?: string }
    const { format = 'json' } = body
    const userId = currentUser.id
    const username = currentUser.username

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
        ...guard.rateLimitHeaders,
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
