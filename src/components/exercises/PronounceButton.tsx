'use client'

export function PronounceButton({ text }: { text: string }) {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  if (!supported) return null

  function handleClick() {
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button type="button" onClick={handleClick} aria-label="Pronounce" className="text-lg">
      🔊
    </button>
  )
}
