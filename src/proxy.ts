import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * True for a browser request that changes state and was sent from another
 * site. Browsers always attach `Origin` to cross-origin POST/PATCH/DELETE, so
 * comparing it with our own origin blocks cross-site request forgery in
 * addition to the SameSite session cookie. Requests without `Origin`
 * (server-to-server, Vercel Cron) are not browser CSRF and pass through.
 */
export function isCrossSiteWrite(method: string, origin: string | null, ownOrigin: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return false
  if (!origin) return false
  return origin !== ownOrigin
}

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (isCrossSiteWrite(request.method, request.headers.get('origin'), request.nextUrl.origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.next()
  }
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/api/:path*', '/((?!api|_next|.*\\..*).*)'],
}
