'use client'

import { useState } from 'react'
import type { MatchingData, MatchingUserAnswer } from '@/types/exercise'

export function MatchingExercise({
  data,
  submitLabel,
  onAnswer,
}: {
  data: MatchingData
  submitLabel: string
  onAnswer: (answer: MatchingUserAnswer) => void
}) {
  const [selections, setSelections] = useState<Record<number, string>>({})
  const canSubmit = data.lefts.every((_, index) => selections[index] !== undefined)

  return (
    <div className="flex flex-col gap-3">
      {data.lefts.map((left, leftIndex) => (
        <div key={leftIndex} className="flex items-center gap-2">
          <span className="w-24">{left}</span>
          <select
            aria-label={left}
            data-testid={`matching-select-${leftIndex}`}
            value={selections[leftIndex] ?? ''}
            onChange={(event) =>
              setSelections((prev) => ({ ...prev, [leftIndex]: event.target.value }))
            }
            className="border rounded px-2 py-1"
          >
            <option value="" disabled>
              --
            </option>
            {data.rights.map((right, rightIndex) => (
              <option key={rightIndex} value={right}>
                {right}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() =>
          onAnswer({
            pairs: data.lefts.map((left, index) => ({ left, right: selections[index] })),
          })
        }
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
