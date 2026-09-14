import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import robots from '@/app/robots'

describe('robots', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('disallows authenticated-only sections and points to the sitemap', () => {
    const result = robots()
    expect(result.sitemap).toBe('https://example.com/sitemap.xml')
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules
    expect(rules.disallow).toEqual(['/admin', '/dashboard', '/learn', '/vocab'])
    expect(rules.allow).toBe('/')
  })
})
