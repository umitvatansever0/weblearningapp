export type ConsentStatus = 'accepted' | 'declined'

const STORAGE_KEY = 'cookie-consent'

export function getStoredConsent(): ConsentStatus | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'accepted' || value === 'declined' ? value : null
}

export function storeConsent(status: ConsentStatus): void {
  window.localStorage.setItem(STORAGE_KEY, status)
}
