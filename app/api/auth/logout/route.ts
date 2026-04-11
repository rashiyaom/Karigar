import { NextResponse } from 'next/server'
import { clearAuthCookie, getAuthToken, logoutUser } from '@/lib/auth'
import { clearCsrfToken } from '@/lib/csrf'

export async function POST() {
  try {
    const token = await getAuthToken()
    if (token) {
      await logoutUser(token)
    }

    await clearAuthCookie()
    await clearCsrfToken()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout route error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed.' },
      { status: 500 }
    )
  }
}
