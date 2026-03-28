import { NextRequest, NextResponse } from 'next/server'
import { logoutUser, getAuthToken, clearAuthCookie } from '@/lib/auth'
import { clearCsrfToken } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken()

    if (token) {
      await logoutUser(token)
    }

    // Clear both auth and CSRF tokens
    await clearAuthCookie()
    await clearCsrfToken()

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
