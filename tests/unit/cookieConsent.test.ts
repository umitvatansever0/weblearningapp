import { describe, it, expect, beforeEach } from 'vitest'
import { getStoredConsent, storeConsent } from '@/lib/cookieConsent'

describe('cookie consent storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns null when no consent has been stored', () => {
    expect(getStoredConsent()).toBeNull()
  })

  it('stores and retrieves an accepted consent', () => {
    storeConsent('accepted')
    expect(getStoredConsent()).toBe('accepted')
  })

  it('stores and retrieves a declined consent', () => {
    storeConsent('declined')
    expect(getStoredConsent()).toBe('declined')
  })
})
