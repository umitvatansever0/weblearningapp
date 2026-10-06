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

// Community blog uploads: the browser PUTs files to the Vercel Blob API and
// the resulting public blobs are displayed from the store's subdomain.
const BLOB_UPLOAD_SOURCES = ['https://vercel.com', 'https://*.blob.vercel-storage.com']
const BLOB_IMAGE_SOURCES = ['https://*.public.blob.vercel-storage.com']

const contentSecurityPolicy = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' ${GOOGLE_AD_ANALYTICS_SOURCES.join(' ')}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: ${GOOGLE_AD_ANALYTICS_SOURCES.join(' ')} ${BLOB_IMAGE_SOURCES.join(' ')}`,
  `connect-src 'self' ${GOOGLE_AD_ANALYTICS_SOURCES.join(' ')} ${BLOB_UPLOAD_SOURCES.join(' ')}`,
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
  // Isolate the browsing context from cross-origin windows (popups opened by
  // ads/Google sign-in flows keep working) and forbid legacy Flash/PDF
  // cross-domain policy files.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  // Enforce a single canonical host: permanently redirect the bare apex
  // domain to the preferred www host. Only matches that exact host, so local
  // development and preview deployments are unaffected.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'deutschstep.com' }],
        destination: 'https://www.deutschstep.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
