import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import en from '../../messages/en.json'

function renderBanner() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CookieConsentBanner />
    </NextIntlClientProvider>
  )
}

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows the banner when no consent is stored', async () => {
    renderBanner()
    await waitFor(() => {
      expect(screen.getByText(en.cookieConsent.message)).toBeInTheDocument()
    })
  })

  it('hides the banner after accepting', async () => {
    renderBanner()
    await waitFor(() => screen.getByText(en.cookieConsent.accept))
    fireEvent.click(screen.getByText(en.cookieConsent.accept))
    await waitFor(() => {
      expect(screen.queryByText(en.cookieConsent.message)).not.toBeInTheDocument()
    })
  })

  it('does not show the banner when consent was already stored', () => {
    window.localStorage.setItem('cookie-consent', 'declined')
    renderBanner()
    expect(screen.queryByText(en.cookieConsent.message)).not.toBeInTheDocument()
  })
})
