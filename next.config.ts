import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Google AdSense and Analytics are loaded dynamically (only after cookie
// consent) from these first-party-adjacent Google domains; the CSP has to
// allow them or ads/analytics silently fail to load. Everything else stays
// locked down to 'self'.
const GOOGLE_AD_ANALYTICS_SOURCES = [
  'https://*.google.com',
  'https://*.googlesyndication.com',
  'https://*.googletagmanager.com',
  'https://*.google-analytics.com',
  'https://*.doubleclick.net',
  'https://*.gstatic.com',
]

const contentSecurityPolicy = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' ${GOOGLE_AD_ANALYTICS_SOURCES.join(' ')}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: ${GOOGLE_AD_ANALYTICS_SOURCES.join(' ')}`,
  `connect-src 'self' ${GOOGLE_AD_ANALYTICS_SOURCES.join(' ')}`,
  `frame-src 'self' ${GOOGLE_AD_ANALYTICS_SOURCES.join(' ')}`,
  `font-src 'self' data:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'self'`,
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default withNextIntl(nextConfig)
