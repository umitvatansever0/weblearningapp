'use client'

import { useState } from 'react'
import type { SentenceOrderData, SentenceOrderUserAnswer } from '@/types/exercise'

export function SentenceOrderExercise({
  data,
  submitLabel,
  onAnswer,
}: {
  data: SentenceOrderData
  submitLabel: string
  onAnswer: (answer: SentenceOrderUserAnswer) => void
}) {
  const [chosen, setChosen] = useState<string[]>([])
  const remaining = data.words.filter((word) => !chosen.includes(word))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 min-h-[2.5rem] border rounded px-3 py-2">
        {chosen.map((word) => (
          <span key={word} className="px-2 py-1 bg-gray-100 rounded">
            {word}
          </span>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {remaining.map((word) => (
          <button
            key={word}
            type="button"
            onClick={() => setChosen((prev) => [...prev, word])}
            className="border rounded px-3 py-1"
          >
            {word}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={chosen.length !== data.words.length}
        onClick={() => onAnswer({ order: chosen })}
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
