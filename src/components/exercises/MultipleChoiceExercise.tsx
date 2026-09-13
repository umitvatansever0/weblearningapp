'use client'

import { useState } from 'react'
import type { MultipleChoiceData, MultipleChoiceUserAnswer } from '@/types/exercise'
import { PronounceButton } from './PronounceButton'

export function MultipleChoiceExercise({
  data,
  submitLabel,
  onAnswer,
}: {
  data: MultipleChoiceData
  submitLabel: string
  onAnswer: (answer: MultipleChoiceUserAnswer) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="font-medium">{data.prompt}</p>
        <PronounceButton text={data.prompt} />
      </div>
      <div className="flex flex-col gap-2">
        {data.options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setSelected(index)}
            className={`text-left border rounded px-3 py-2 ${selected === index ? 'border-gray-900 bg-gray-100' : ''}`}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={selected === null}
        onClick={() => selected !== null && onAnswer({ selectedIndex: selected })}
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
