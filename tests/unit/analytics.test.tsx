import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { Analytics } from '@/components/Analytics'

describe('Analytics', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST123')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.querySelectorAll('script[data-ga-script]').forEach((node) => node.remove())
  })

  it('injects nothing when consent has not been given', () => {
    render(<Analytics />)
    expect(document.querySelectorAll('script[data-ga-script]').length).toBe(0)
  })

  it('falls back to the site’s default measurement id when the env value is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '')
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<Analytics />)
    const loader = document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
    expect(loader?.getAttribute('src')).toContain('G-55D87THF1M')
  })

  it('injects the gtag loader and inline config script when consent is accepted and the id is set', () => {
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<Analytics />)
    const scripts = document.querySelectorAll('script[data-ga-script]')
    expect(scripts.length).toBe(2)
    const loader = document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
    expect(loader).not.toBeNull()
    expect(loader?.getAttribute('src')).toContain('G-TEST123')
  })
})
