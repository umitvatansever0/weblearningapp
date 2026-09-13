'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export function PronounceButton({ text }: { text: string }) {
  const t = useTranslations('learn')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)
  }, [])

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
