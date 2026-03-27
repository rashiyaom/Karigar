import { NextRequest, NextResponse } from 'next/server'
import { loginUser, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const result = await loginUser(username, password)

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Set the auth cookie
    await setAuthCookie(result.token)

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        token: result.token,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
