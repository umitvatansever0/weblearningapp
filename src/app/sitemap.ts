import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

const STATIC_PATHS = ['', '/login', '/register', '/privacy', '/terms', '/contact']

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({ url: `${baseUrl}/${locale}${path}`, lastModified: new Date() })
    }
  }

  return entries
}
