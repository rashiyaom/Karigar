import { NextRequest, NextResponse } from 'next/server'

async function resolveUserRole(request: NextRequest): Promise<'admin' | 'user' | null> {
  const roleCookie = request.cookies.get('user-role')?.value
  if (roleCookie === 'admin' || roleCookie === 'user') {
    return roleCookie
  }

  const authToken = request.cookies.get('auth-token')?.value
  if (!authToken) {
    return null
  }

  try {
    const response = await fetch(new URL('/api/auth/me', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    const role = result?.user?.role
    return role === 'admin' || role === 'user' ? role : null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Skip API and static asset paths.
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname === '/favicon.ico' || /\.[^/]+$/.test(pathname)) {
    return NextResponse.next()
  }

  const authToken = request.cookies.get('auth-token')?.value
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isPublicLanding = pathname === '/' || pathname === '/landing.html'
  const isAdminRoute = pathname.startsWith('/admin')

  const role = authToken ? await resolveUserRole(request) : null

  if (isAuthPage && authToken) {
    const destination = role === 'admin' ? '/admin/users' : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (!isAuthPage && !isPublicLanding && !authToken) {
    const loginUrl = new URL('/login', request.url)
    const nextPath = `${pathname}${search}`
    loginUrl.searchParams.set('next', nextPath)
    return NextResponse.redirect(loginUrl)
  }

  if (authToken && role === 'admin' && !isAdminRoute) {
    return NextResponse.redirect(new URL('/admin/users', request.url))
  }

  if (authToken && role === 'user' && isAdminRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}

