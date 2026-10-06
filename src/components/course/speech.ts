'use client'

import { useCallback, useSyncExternalStore } from 'react'

function subscribe() {
  return () => {}
}
function getSnapshot() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}
function getServerSnapshot() {
  return false
}

function germanVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  return voices.find((v) => v.lang === 'de-DE') ?? voices.find((v) => v.lang.startsWith('de'))
}

/**
 * German text-to-speech through the browser (no audio files needed).
 * `supported` is false during SSR and in browsers without speech synthesis,
 * so callers can show the transcript instead.
 */
export function useSpeech() {
  const supported = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const speak = useCallback((text: string, slow = false) => {
    if (!getSnapshot()) return
    window.speechSynthesis.cancel()
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = slow ? 0.6 : 0.95
    const voice = germanVoice()
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }, [])

  return { supported, speak }
}
