'use client'

import { useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

function getServerSnapshot() {
  return false
}

export function PronounceButton({ text }: { text: string }) {
  const t = useTranslations('learn')
  const supported = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!supported) return null

  function handleClick() {
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button type="button" onClick={handleClick} aria-label={t('pronounce')} className="text-lg">
      🔊
    </button>
  )
}
