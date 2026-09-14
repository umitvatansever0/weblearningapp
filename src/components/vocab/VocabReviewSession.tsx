'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AdSlot } from '@/components/AdSlot'

interface ReviewCard {
  id: string
  word: string
  translation: string
  exampleSentence: string
}

type Grade = 'again' | 'hard' | 'good' | 'easy'

export function VocabReviewSession({ cards }: { cards: ReviewCard[] }) {
  const t = useTranslations('vocab')
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(cards.length === 0)
  const [error, setError] = useState<string | null>(null)

  const current = cards[index]

  async function handleGrade(grade: Grade) {
    setError(null)
    try {
      const res = await fetch(`/api/vocab/${current.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade }),
      })
      if (res.ok === false) {
        setError(t('submitError'))
        return
      }
    } catch {
      setError(t('submitError'))
      return
    }

    setRevealed(false)
    if (index + 1 < cards.length) {
      setIndex(index + 1)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg font-medium">{t('reviewComplete')}</p>
        <AdSlot placement="vocabReview" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="border rounded p-6 text-center">
        <p className="text-2xl font-bold">{current.word}</p>
        {revealed && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-lg">{current.translation}</p>
            <p className="text-sm text-gray-600 italic">{current.exampleSentence}</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-700 text-sm">{error}</p>}

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="bg-gray-900 text-white rounded px-4 py-2"
        >
          {t('showAnswer')}
        </button>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={() => handleGrade('again')} className="flex-1 border rounded px-3 py-2">
            {t('again')}
          </button>
          <button type="button" onClick={() => handleGrade('hard')} className="flex-1 border rounded px-3 py-2">
            {t('hard')}
          </button>
          <button type="button" onClick={() => handleGrade('good')} className="flex-1 border rounded px-3 py-2">
            {t('good')}
          </button>
          <button type="button" onClick={() => handleGrade('easy')} className="flex-1 border rounded px-3 py-2">
            {t('easy')}
          </button>
        </div>
      )}
    </div>
  )
}
