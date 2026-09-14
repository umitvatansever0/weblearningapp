import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdSlot } from '@/components/AdSlot'

describe('AdSlot', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT_ID', 'ca-pub-123')
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ID', 'slot-456')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.querySelectorAll('script[src*="adsbygoogle.js"]').forEach((node) => node.remove())
  })

  it('renders nothing when consent has not been given', () => {
    render(<AdSlot placement="home" />)
    expect(screen.queryByTestId('ad-slot-home')).not.toBeInTheDocument()
  })

  it('renders nothing when consent was declined', () => {
    window.localStorage.setItem('cookie-consent', 'declined')
    render(<AdSlot placement="home" />)
    expect(screen.queryByTestId('ad-slot-home')).not.toBeInTheDocument()
  })

  it('renders nothing when consent is accepted but the AdSense client id is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT_ID', '')
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<AdSlot placement="home" />)
    expect(screen.queryByTestId('ad-slot-home')).not.toBeInTheDocument()
  })

  it('renders the ad unit with the placement-specific test id when consent is accepted and env vars are set', () => {
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<AdSlot placement="sidebar" />)
    const ins = screen.getByTestId('ad-slot-sidebar')
    expect(ins).toHaveAttribute('data-ad-client', 'ca-pub-123')
    expect(ins).toHaveAttribute('data-ad-slot', 'slot-456')
  })

  it('injects the adsbygoogle loader script once when enabled', () => {
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<AdSlot placement="home" />)
    const scripts = document.querySelectorAll('script[src*="adsbygoogle.js"]')
    expect(scripts.length).toBe(1)
  })
})
