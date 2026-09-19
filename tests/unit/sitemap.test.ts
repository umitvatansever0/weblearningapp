import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import sitemap from '@/app/sitemap'

describe('sitemap', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('includes every static path for every locale', () => {
    const entries = sitemap()
    const urls = entries.map((entry) => entry.url)
    expect(urls).toContain('https://example.com/en')
    expect(urls).toContain('https://example.com/de/privacy')
    expect(urls).toContain('https://example.com/tr/terms')
    expect(urls).toContain('https://example.com/en/login')
    expect(urls).toContain('https://example.com/en/register')
    expect(urls).toContain('https://example.com/en/contact')
  })

  it('produces exactly 18 entries (3 locales x 6 static paths)', () => {
    expect(sitemap().length).toBe(18)
  })
})
