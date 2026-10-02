import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const findMany = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: { level: { findMany: () => findMany() } },
}))

import sitemap from '@/app/sitemap'

describe('sitemap', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.deutschstep.com')
    findMany.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('includes public static paths for every locale and excludes private/auth paths', async () => {
    findMany.mockResolvedValue([])
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)

    expect(urls).toContain('https://www.deutschstep.com/en')
    expect(urls).toContain('https://www.deutschstep.com/en/learn')
    expect(urls).toContain('https://www.deutschstep.com/de/privacy')
    expect(urls).toContain('https://www.deutschstep.com/tr/terms')
    expect(urls).toContain('https://www.deutschstep.com/en/contact')

    // Private / auth URLs must never appear in the sitemap.
    expect(urls.some((u) => u.includes('/login'))).toBe(false)
    expect(urls.some((u) => u.includes('/register'))).toBe(false)
    expect(urls.some((u) => u.includes('/dashboard'))).toBe(false)
    expect(urls.some((u) => u.includes('/vocab'))).toBe(false)
    expect(urls.some((u) => u.includes('/admin'))).toBe(false)
  })

  it('includes every hreflang alternate and uses absolute HTTPS URLs', async () => {
    findMany.mockResolvedValue([])
    const entries = await sitemap()
    for (const entry of entries) {
      expect(entry.url.startsWith('https://')).toBe(true)
      expect(entry.alternates?.languages).toMatchObject({
        en: expect.stringContaining('/en'),
        de: expect.stringContaining('/de'),
        tr: expect.stringContaining('/tr'),
      })
    }
  })

  it('emits human-readable slug URLs — never raw database/cuid ids', async () => {
    findMany.mockResolvedValue([
      {
        code: 'A1',
        order: 1,
        units: [
          {
            id: 'ckv9c0z1a0000qwer',
            slug: 'greetings',
            lessons: [
              { id: 'ckv9c0z1a0001qwer', slug: 'der-die-das' },
              { id: 'ckv9c0z1a0002qwer', slug: 'personal-pronouns' },
            ],
          },
        ],
      },
    ])
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)

    expect(urls).toContain('https://www.deutschstep.com/en/learn/A1')
    expect(urls).toContain('https://www.deutschstep.com/en/learn/A1/greetings/der-die-das')
    expect(urls).toContain('https://www.deutschstep.com/de/learn/A1/greetings/personal-pronouns')

    // No sitemap URL may contain a raw cuid id.
    expect(urls.some((u) => u.includes('ckv9c0z1a'))).toBe(false)
  })

  it('degrades gracefully to static paths if the database is unavailable', async () => {
    findMany.mockRejectedValue(new Error('no database'))
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)

    expect(urls).toContain('https://www.deutschstep.com/en')
    expect(urls.some((u) => u.includes('/learn/A1/'))).toBe(false)
  })
})
