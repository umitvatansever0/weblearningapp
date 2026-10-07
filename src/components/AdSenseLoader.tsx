'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { getStoredConsent, subscribeToConsent } from '@/lib/cookieConsent'
import { getAdSenseClientId, loadAdSenseScript } from '@/lib/adsense'

function getServerSnapshot() {
  return null
}

/** Loads AdSense site-wide (enables Auto ads) once the visitor has accepted cookies. */
export function AdSenseLoader() {
  const consent = useSyncExternalStore(subscribeToConsent, getStoredConsent, getServerSnapshot)
  const clientId = getAdSenseClientId()
  const enabled = consent === 'accepted' && Boolean(clientId)

  useEffect(() => {
    if (enabled) loadAdSenseScript(clientId)
  }, [enabled, clientId])

  return null
}
