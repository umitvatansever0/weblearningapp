import { describe, it, expect, vi } from 'vitest'

vi.mock('next-intl/middleware', () => ({ default: () => () => new Response('intl') }))

import { isCrossSiteWrite } from '@/proxy'

const OWN = 'https://www.deutschstep.com'

describe('isCrossSiteWrite', () => {
  it('blocks state-changing requests from other sites', () => {
    for (const method of ['POST', 'PATCH', 'DELETE', 'PUT']) {
      expect(isCrossSiteWrite(method, 'https://evil.example', OWN)).toBe(true)
    }
  })

  it('allows same-origin writes', () => {
    expect(isCrossSiteWrite('POST', OWN, OWN)).toBe(false)
  })

  it('allows reads and requests without Origin (server-to-server, cron)', () => {
    expect(isCrossSiteWrite('GET', 'https://evil.example', OWN)).toBe(false)
    expect(isCrossSiteWrite('POST', null, OWN)).toBe(false)
  })
})
