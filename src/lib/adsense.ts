/** Public AdSense publisher ID of deutschstep.com; an env value overrides it. */
const DEFAULT_ADSENSE_CLIENT_ID = 'ca-pub-1871274232514582'

export function getAdSenseClientId(): string {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || DEFAULT_ADSENSE_CLIENT_ID
}

/**
 * Loads the AdSense script once. Only call this after the visitor has accepted
 * cookies. With the script on the page, Google can also place Auto ads.
 */
export function loadAdSenseScript(clientId: string): void {
  if (document.querySelector('script[src*="adsbygoogle.js"]')) return
  const script = document.createElement('script')
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
  script.async = true
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}
