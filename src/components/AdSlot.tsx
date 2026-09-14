'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { getStoredConsent, subscribeToConsent } from '@/lib/cookieConsent'

export type AdPlacement = 'home' | 'lessonList' | 'exerciseResult' | 'sidebar' | 'vocabReview'

function getServerSnapshot() {
  return null
}

export function AdSlot({ placement }: { placement: AdPlacement }) {
  const consent = useSyncExternalStore(subscribeToConsent, getStoredConsent, getServerSnapshot)
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID
  const enabled = consent === 'accepted' && Boolean(clientId) && Boolean(slotId)

  useEffect(() => {
    if (!enabled) return
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return
    const script = document.createElement('script')
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
    script.async = true
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)
  }, [enabled, clientId])

  useEffect(() => {
    if (!enabled) return
    const win = window as unknown as { adsbygoogle?: unknown[] }
    try {
      win.adsbygoogle = win.adsbygoogle ?? []
      win.adsbygoogle.push({})
    } catch {
      // adsbygoogle script may not have finished loading yet; safe to skip
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <ins
      className="adsbygoogle block"
      data-testid={`ad-slot-${placement}`}
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
      style={{ display: 'block' }}
    />
  )
}
