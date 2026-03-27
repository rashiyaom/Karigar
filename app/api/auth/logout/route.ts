import { NextRequest, NextResponse } from 'next/server'
import { logoutUser, getAuthToken, clearAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken()

    if (token) {
      await logoutUser(token)
    }

    await clearAuthCookie()

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
