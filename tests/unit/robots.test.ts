import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import robots from '@/app/robots'

describe('robots', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.deutschstep.com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('references the sitemap and allows crawling by default', () => {
    const result = robots()
    expect(result.sitemap).toBe('https://www.deutschstep.com/sitemap.xml')
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules
    expect(rules.allow).toBe('/')
  })

  it('blocks private app areas but NOT the public /learn content', () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules
    const disallow = (rules.disallow ?? []) as string[]

    expect(disallow).toContain('/api/')
    expect(disallow).toContain('/*/admin')
    expect(disallow).toContain('/*/dashboard')
    expect(disallow).toContain('/*/vocab')
    // Public educational content must remain crawlable.
    expect(disallow.some((rule) => rule.includes('learn'))).toBe(false)
  })
})
