import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Skip API and static asset paths.
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname === '/favicon.ico' || /\.[^/]+$/.test(pathname)) {
    return NextResponse.next()
  }

  const authToken = request.cookies.get('auth-token')?.value
  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (isAuthPage && authToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!isAuthPage && !authToken) {
    const loginUrl = new URL('/login', request.url)
    const nextPath = `${pathname}${search}`
    loginUrl.searchParams.set('next', nextPath)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}

