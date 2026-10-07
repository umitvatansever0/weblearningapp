import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { AdSenseLoader } from '@/components/AdSenseLoader'

describe('AdSenseLoader', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.querySelectorAll('script[src*="adsbygoogle.js"]').forEach((node) => node.remove())
  })

  it('loads nothing without cookie consent', () => {
    render(<AdSenseLoader />)
    expect(document.querySelectorAll('script[src*="adsbygoogle.js"]').length).toBe(0)
  })

  it('loads the AdSense script with the default publisher id after consent', () => {
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<AdSenseLoader />)
    const script = document.querySelector('script[src*="adsbygoogle.js"]')
    expect(script?.getAttribute('src')).toContain('client=ca-pub-1871274232514582')
  })
})
