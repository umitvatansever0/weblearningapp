import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  absoluteUrl,
  buildAlternates,
  buildPublicMetadata,
  metaDescriptionFromMarkdown,
  getLevelCopy,
  organizationJsonLd,
  websiteJsonLd,
  breadcrumbJsonLd,
  courseJsonLd,
  NOINDEX_METADATA,
} from '@/lib/seo'

describe('seo helpers', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.deutschstep.com')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('builds absolute URLs on the canonical origin', () => {
    expect(absoluteUrl('/en/learn/A1')).toBe('https://www.deutschstep.com/en/learn/A1')
    expect(absoluteUrl('')).toBe('https://www.deutschstep.com')
  })

  it('strips a trailing slash from the configured site URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.deutschstep.com/')
    expect(absoluteUrl('/x')).toBe('https://www.deutschstep.com/x')
  })

  it('builds a single canonical plus every hreflang alternate incl. x-default', () => {
    const alternates = buildAlternates('en', '/learn/A1')
    expect(alternates.canonical).toBe('https://www.deutschstep.com/en/learn/A1')
    expect(alternates.languages).toEqual({
      en: 'https://www.deutschstep.com/en/learn/A1',
      de: 'https://www.deutschstep.com/de/learn/A1',
      tr: 'https://www.deutschstep.com/tr/learn/A1',
      'x-default': 'https://www.deutschstep.com/en/learn/A1',
    })
  })

  it('produces indexable public metadata with OG + canonical', () => {
    const meta = buildPublicMetadata({
      locale: 'en',
      path: '/learn/A1',
      title: 'German A1',
      description: 'Beginner German.',
    })
    expect(meta.title).toBe('German A1')
    expect(meta.alternates?.canonical).toBe('https://www.deutschstep.com/en/learn/A1')
    expect((meta.robots as { index: boolean }).index).toBe(true)
    expect(meta.openGraph?.url).toBe('https://www.deutschstep.com/en/learn/A1')
    expect(meta.twitter).toBeDefined()
  })

  it('exposes a reusable noindex object for private pages', () => {
    expect((NOINDEX_METADATA.robots as { index: boolean }).index).toBe(false)
  })

  it('turns markdown into a clean, bounded meta description', () => {
    const md = '# Heading\n\nThis is **bold** and a [link](https://x.com) with `code`.'
    const desc = metaDescriptionFromMarkdown(md, 60)
    expect(desc).not.toContain('#')
    expect(desc).not.toContain('**')
    expect(desc).not.toContain('](')
    expect(desc.length).toBeLessThanOrEqual(61)
  })

  it('provides per-level copy for A1–B2 and falls back to English', () => {
    expect(getLevelCopy('A1', 'en')?.title).toContain('German A1')
    expect(getLevelCopy('B2', 'de')?.h1).toContain('B2')
    expect(getLevelCopy('A1', 'xx')?.title).toContain('German A1') // unknown locale -> en
    expect(getLevelCopy('C1', 'en')).toBeNull()
  })

  it('builds valid JSON-LD graphs', () => {
    expect(organizationJsonLd()['@type']).toBe('Organization')
    expect(websiteJsonLd()['@type']).toBe('WebSite')
    const course = courseJsonLd({ name: 'A1', description: 'd', url: 'https://x' })
    expect(course['@type']).toBe('Course')
    expect(course.provider.name).toBe('DeutschStep')

    const crumbs = breadcrumbJsonLd('en', [
      { name: 'Home', path: '/' },
      { name: 'A1', path: '/learn/A1' },
    ])
    expect(crumbs.itemListElement).toHaveLength(2)
    expect(crumbs.itemListElement[0].position).toBe(1)
    expect(crumbs.itemListElement[1].item).toBe('https://www.deutschstep.com/en/learn/A1')
  })
})
