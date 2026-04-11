import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserAuditLogs,
  getUserFailedLogins,
  getSecurityEvents,
  getAuditStats,
  getIpFailedLogins,
} from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'stats' // stats, user, security, failed-logins, ip-logins
    const userId = searchParams.get('userId')
    const username = searchParams.get('username')
    const ipAddress = searchParams.get('ipAddress')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = parseInt(searchParams.get('skip') || '0')

    let data: unknown = null

    switch (type) {
      case 'stats':
        // Get audit statistics
        data = await getAuditStats()
        break

      case 'user':
        // Get user's own audit logs
        if (userId || user.id) {
          const targetUserId = userId || user.id
          data = await getUserAuditLogs(targetUserId, limit, skip)
        }
        break

      case 'security':
        // Get security events (warnings and errors)
        data = await getSecurityEvents(limit, skip)
        break

      case 'failed-logins':
        // Get failed login attempts
        if (username) {
          data = await getUserFailedLogins(username, limit)
        } else {
          return NextResponse.json(
            { error: 'Username parameter required for failed-logins' },
            { status: 400 }
          )
        }
        break

      case 'ip-logins':
        // Get failed logins by IP
        if (ipAddress) {
          data = await getIpFailedLogins(ipAddress, limit)
        } else {
          return NextResponse.json(
            { error: 'IP address parameter required for ip-logins' },
            { status: 400 }
          )
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      type,
      data,
    })
  } catch (error) {
    console.error('Audit logs endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
