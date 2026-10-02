import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Block private / authenticated application areas and the API. Public
      // educational content under /learn stays crawlable. Patterns are
      // duplicated with a locale wildcard because every route is prefixed
      // with a locale (/en, /de, /tr).
      disallow: [
        '/api/',
        '/admin',
        '/*/admin',
        '/dashboard',
        '/*/dashboard',
        '/vocab',
        '/*/vocab',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
