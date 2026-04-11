import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie, getAuthToken, logoutUser } from '@/lib/auth'
import { clearCsrfToken } from '@/lib/csrf'
import { guardWriteRequest, getClientIp } from '@/lib/api-write-guard'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const guard = await guardWriteRequest(request, {
      rateLimitKey: `auth-logout:${ip}`,
      maxRequests: 60,
      windowMs: 60 * 1000,
      requireCsrf: true,
      parseJsonBody: false,
    })

    if (!guard.ok) {
      return guard.response
    }

    const token = await getAuthToken()
    if (token) {
      await logoutUser(token)
    }

    await clearAuthCookie()
    await clearCsrfToken()

    const response = NextResponse.json({ success: true })
    Object.entries(guard.rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error('Logout route error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed.' },
      { status: 500 }
    )
  }
}
