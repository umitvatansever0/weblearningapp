'use client'

import { useState } from 'react'
import type { ShortAnswerData, ShortAnswerUserAnswer } from '@/types/exercise'
import { PronounceButton } from './PronounceButton'

export function ShortAnswerExercise({
  data,
  submitLabel,
  onAnswer,
}: {
  data: ShortAnswerData
  submitLabel: string
  onAnswer: (answer: ShortAnswerUserAnswer) => void
}) {
  const [text, setText] = useState('')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="font-medium">{data.prompt}</p>
        <PronounceButton text={data.prompt} />
      </div>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="border rounded px-3 py-2"
      />
      <button
        type="button"
        disabled={text.trim().length === 0}
        onClick={() => onAnswer({ text })}
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
