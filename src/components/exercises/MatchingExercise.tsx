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
  const [selections, setSelections] = useState<Record<string, string>>({})
  const rightOptions = data.pairs.map((pair) => pair.right)
  const canSubmit = data.pairs.every((pair) => selections[pair.left])

  return (
    <div className="flex flex-col gap-3">
      {data.pairs.map((pair) => (
        <div key={pair.left} className="flex items-center gap-2">
          <span className="w-24">{pair.left}</span>
          <select
            aria-label={pair.left}
            value={selections[pair.left] ?? ''}
            onChange={(event) => setSelections((prev) => ({ ...prev, [pair.left]: event.target.value }))}
            className="border rounded px-2 py-1"
          >
            <option value="" disabled>
              --
            </option>
            {rightOptions.map((right) => (
              <option key={right} value={right}>
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
            pairs: data.pairs.map((pair) => ({ left: pair.left, right: selections[pair.left] })),
          })
        }
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
