'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { getStoredConsent, subscribeToConsent } from '@/lib/cookieConsent'
import { getAdSenseClientId, loadAdSenseScript } from '@/lib/adsense'

export type AdPlacement = 'home' | 'lessonList' | 'exerciseResult' | 'sidebar' | 'vocabReview'

function getServerSnapshot() {
  return null
}

export function AdSlot({ placement }: { placement: AdPlacement }) {
  const consent = useSyncExternalStore(subscribeToConsent, getStoredConsent, getServerSnapshot)
  const clientId = getAdSenseClientId()
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID
  const enabled = consent === 'accepted' && Boolean(clientId) && Boolean(slotId)

  useEffect(() => {
    if (enabled) loadAdSenseScript(clientId)
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
