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
  })

  it('produces exactly 15 entries (3 locales x 5 static paths)', () => {
    expect(sitemap().length).toBe(15)
  })
})
