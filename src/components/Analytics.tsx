'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { getStoredConsent, subscribeToConsent } from '@/lib/cookieConsent'

function getServerSnapshot() {
  return null
}

export function Analytics() {
  const consent = useSyncExternalStore(subscribeToConsent, getStoredConsent, getServerSnapshot)
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const enabled = consent === 'accepted' && Boolean(measurementId)

  useEffect(() => {
    if (!enabled) return
    if (document.querySelector('script[data-ga-script]')) return

    const loader = document.createElement('script')
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    loader.async = true
    loader.setAttribute('data-ga-script', 'loader')
    document.head.appendChild(loader)

    const inline = document.createElement('script')
    inline.setAttribute('data-ga-script', 'inline')
    inline.textContent = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${measurementId}');`
    document.head.appendChild(inline)
  }, [enabled, measurementId])

  return null
}
