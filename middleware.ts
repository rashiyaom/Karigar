import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Skip API and static asset paths.
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname === '/favicon.ico' || /\.[^/]+$/.test(pathname)) {
    return NextResponse.next()
  }

  const authToken = request.cookies.get('auth-token')?.value
  const roleCookie = request.cookies.get('user-role')?.value
  const isAdmin = roleCookie === 'admin'
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isPublicLanding = pathname === '/' || pathname === '/landing.html'

  if (isAuthPage && authToken) {
    return NextResponse.redirect(new URL(isAdmin ? '/admin/users' : '/dashboard', request.url))
  }

  if (!isAuthPage && !isPublicLanding && !authToken) {
    const loginUrl = new URL('/login', request.url)
    const nextPath = `${pathname}${search}`
    loginUrl.searchParams.set('next', nextPath)
    return NextResponse.redirect(loginUrl)
  }

  // Admin users should only access user-review pages.
  if (authToken && isAdmin && !isAuthPage && !isPublicLanding && !pathname.startsWith('/admin/users')) {
    return NextResponse.redirect(new URL('/admin/users', request.url))
  }

  // Non-admin users are not allowed on admin routes.
  if (authToken && !isAdmin && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}

