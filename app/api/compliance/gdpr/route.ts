/**
 * GDPR Compliance Information Endpoint
 * GET /api/compliance/gdpr
 *
 * Provides information about data protection policies and procedures
 * Useful for transparency and compliance audits
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateGdprComplianceReport } from '@/lib/data-protection'
import { applyCorsHeaders } from '@/lib/cors-config'

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  const origin = request.headers.get('origin') || undefined
  return applyCorsHeaders(response, origin)
}

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || undefined

    const complianceReport = generateGdprComplianceReport()

    const response = new NextResponse(
      JSON.stringify({
        success: true,
        data: complianceReport,
        information: {
          privacyPolicy: '/privacy',
          termsOfService: '/terms',
          contactDPO: 'privacy@example.com',
          dataExportEndpoint: '/api/user/export (POST)',
          dataDeletionEndpoint: '/api/user/delete (DELETE/PATCH)',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    return applyCorsHeaders(response, origin)
  } catch (error) {
    console.error('GDPR compliance report error:', error)

    const response = new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Failed to generate compliance report',
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
