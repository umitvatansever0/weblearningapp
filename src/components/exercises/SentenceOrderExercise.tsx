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
  const [chosenIndices, setChosenIndices] = useState<number[]>([])
  const remainingIndices = data.words
    .map((_, index) => index)
    .filter((index) => !chosenIndices.includes(index))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 min-h-[2.5rem] border rounded px-3 py-2">
        {chosenIndices.map((index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 rounded">
            {data.words[index]}
          </span>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {remainingIndices.map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => setChosenIndices((prev) => [...prev, index])}
            className="border rounded px-3 py-1"
          >
            {data.words[index]}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={chosenIndices.length !== data.words.length}
        onClick={() => onAnswer({ order: chosenIndices.map((index) => data.words[index]) })}
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
