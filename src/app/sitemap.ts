import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { prisma } from '@/lib/prisma'
import { absoluteUrl } from '@/lib/seo'

// Revalidate hourly so lessons added/removed via the admin panel are picked up
// without a redeploy (unpublished/deleted lessons drop out of the sitemap).
export const revalidate = 3600

// Locale-agnostic public paths that always exist.
const STATIC_PATHS = ['', '/learn', '/blog', '/privacy', '/terms', '/contact']

/** Build the hreflang alternates map for a locale-agnostic path. */
function languagesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(`/${locale}${path}`)
  }
  return languages
}

/** Emit one entry per locale for a locale-agnostic path, each with hreflang. */
function entriesForPath(path: string, lastModified: Date): MetadataRoute.Sitemap {
  const languages = languagesFor(path)
  return routing.locales.map((locale) => ({
    url: absoluteUrl(`/${locale}${path}`),
    lastModified,
    alternates: { languages },
  }))
}

/**
 * Discover every published lesson path from the database. Wrapped in a
 * try/catch so a missing/unreachable database at build time degrades to the
 * static paths instead of failing the whole build.
 */
async function lessonPaths(): Promise<string[]> {
  try {
    const levels = await prisma.level.findMany({
      orderBy: { order: 'asc' },
      include: {
        units: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            slug: true,
            lessons: { orderBy: { order: 'asc' }, select: { id: true, slug: true } },
          },
        },
      },
    })

    const paths: string[] = []
    for (const level of levels) {
      paths.push(`/learn/${level.code}`)
      for (const unit of level.units) {
        const unitSlug = unit.slug ?? unit.id
        for (const lesson of unit.lessons) {
          paths.push(`/learn/${level.code}/${unitSlug}/${lesson.slug ?? lesson.id}`)
        }
      }
    }
    return paths
  } catch (error) {
    console.error('[sitemap] failed to load lessons from the database:', error)
    return []
  }
}

/** Visible community blog posts (hidden/moderated posts are excluded). */
async function blogPaths(): Promise<string[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { hidden: false },
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: { id: true },
    })
    return posts.map((post) => `/blog/${post.id}`)
  } catch (error) {
    console.error('[sitemap] failed to load blog posts from the database:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const paths = [...STATIC_PATHS, ...(await lessonPaths()), ...(await blogPaths())]
  // De-duplicate (e.g. a level page could appear via both static and dynamic).
  const uniquePaths = Array.from(new Set(paths))

  return uniquePaths.flatMap((path) => entriesForPath(path, now))
}
