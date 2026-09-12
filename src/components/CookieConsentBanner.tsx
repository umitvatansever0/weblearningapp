'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { getStoredConsent, storeConsent, type ConsentStatus } from '@/lib/cookieConsent'

export function CookieConsentBanner() {
  const t = useTranslations('cookieConsent')
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<ConsentStatus | null>(null)

  useEffect(() => {
    setStatus(getStoredConsent())
    setMounted(true)
  }, [])

  if (!mounted || status !== null) return null

  function handleChoice(choice: ConsentStatus) {
    storeConsent(choice)
    setStatus(choice)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm">{t('message')}</p>
      <div className="flex gap-2">
        <button
          onClick={() => handleChoice('declined')}
          className="px-3 py-1 border border-white rounded text-sm"
        >
          {t('decline')}
        </button>
        <button
          onClick={() => handleChoice('accepted')}
          className="px-3 py-1 bg-white text-gray-900 rounded text-sm"
        >
          {t('accept')}
        </button>
      </div>
    </div>
  )
}
