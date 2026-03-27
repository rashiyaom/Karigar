import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow login page and auth endpoints without authentication
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Check if user has auth token cookie
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // Redirect to login if accessing protected route
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protect all routes except:
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

