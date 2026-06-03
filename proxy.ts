import { NextResponse, type NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getAllowedOrigins } from '@/lib/config'

/**
 * Proxy (formerly "middleware", renamed in Next.js 16; Node runtime only).
 *
 * Responsibilities:
 *  1. Credential-aware CORS for /api/* (preflight + response headers).
 *  2. OPTIMISTIC UI auth redirects (cookie-only check). This is a UX
 *     convenience — NOT the security boundary. Route handlers and pages
 *     independently re-verify via verifySession().
 */

// Cookie name kept in sync with lib/auth/session.ts (inlined to keep the proxy
// bundle free of the db/client module graph).
const ACCESS_COOKIE = 'access_token'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/extinguishers',
  '/inspections',
  '/maintenance',
  '/reports',
  '/users',
  '/profile',
]
const PUBLIC_AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl

  // 1) CORS for the API
  if (pathname.startsWith('/api')) {
    const origin = req.headers.get('origin')
    const allowed = !!origin && getAllowedOrigins().includes(origin)
    if (req.method === 'OPTIONS') {
      const res = new NextResponse(null, { status: 204 })
      if (allowed) setCors(res, origin!)
      return res
    }
    const res = NextResponse.next()
    if (allowed) setCors(res, origin!)
    return res
  }

  // 2) Optimistic auth guard for UI pages
  const token = req.cookies.get(ACCESS_COOKIE)?.value
  let authed = false
  if (token) {
    try {
      await verifyAccessToken(token)
      authed = true
    } catch {
      authed = false
    }
  }

  // '/' is the public landing page (rendered for everyone).
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  if (isProtected && !authed) {
    const url = new URL('/login', req.nextUrl)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }
  if (PUBLIC_AUTH_PATHS.includes(pathname) && authed) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
}

function setCors(res: NextResponse, origin: string): void {
  res.headers.set('Access-Control-Allow-Origin', origin)
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.headers.set('Access-Control-Max-Age', '86400')
  res.headers.append('Vary', 'Origin')
}

export const config = {
  // Run on everything except Next internals/static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
