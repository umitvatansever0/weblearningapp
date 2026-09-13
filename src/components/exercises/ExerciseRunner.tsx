'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { MultipleChoiceExercise } from './MultipleChoiceExercise'
import { FillInBlankExercise } from './FillInBlankExercise'
import { MatchingExercise } from './MatchingExercise'
import { SentenceOrderExercise } from './SentenceOrderExercise'
import { ShortAnswerExercise } from './ShortAnswerExercise'
import type { SanitizedExercise } from '@/types/exercise'

interface SubmitResult {
  correct: boolean
  correctAnswer: unknown
  explanation: string
}

export function ExerciseRunner({
  exercises,
  lessonId,
}: {
  exercises: SanitizedExercise[]
  lessonId: string
}) {
  const t = useTranslations('learn')
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [finished, setFinished] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = exercises[index]

  async function handleAnswer(answer: unknown) {
    setError(null)
    try {
      const res = await fetch(`/api/exercises/${current.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      })
      if (res.ok === false) {
        setError(t('submitError'))
        return
      }
      const data: SubmitResult = await res.json()
      setResult(data)
      if (data.correct) setScore((previous) => previous + 1)
    } catch {
      setError(t('submitError'))
    }
  }

  async function handleNext() {
    setError(null)
    setResult(null)
    if (index + 1 < exercises.length) {
      setIndex(index + 1)
      return
    }
    setCompleting(true)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      })
      if (res.ok === false) {
        setError(t('submitError'))
        setCompleting(false)
        return
      }
      setFinished(true)
    } catch {
      setError(t('submitError'))
      setCompleting(false)
    }
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t('lessonComplete')}</h2>
        <p>
          {t('score')}: {score} / {exercises.length}
        </p>
        <button
          type="button"
          onClick={() => router.push('/learn')}
          className="bg-gray-900 text-white rounded px-4 py-2 self-start"
        >
          {t('backToLevels')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-red-700 text-sm">{error}</p>}
      {!result && !completing && current.type === 'MULTIPLE_CHOICE' && (
        <MultipleChoiceExercise data={current.data as never} submitLabel={t('checkAnswer')} onAnswer={handleAnswer} />
      )}
      {!result && !completing && current.type === 'FILL_IN_BLANK' && (
        <FillInBlankExercise data={current.data as never} submitLabel={t('checkAnswer')} onAnswer={handleAnswer} />
      )}
      {!result && !completing && current.type === 'MATCHING' && (
        <MatchingExercise data={current.data as never} submitLabel={t('checkAnswer')} onAnswer={handleAnswer} />
      )}
      {!result && !completing && current.type === 'SENTENCE_ORDER' && (
        <SentenceOrderExercise data={current.data as never} submitLabel={t('checkAnswer')} onAnswer={handleAnswer} />
      )}
      {!result && !completing && current.type === 'SHORT_ANSWER' && (
        <ShortAnswerExercise data={current.data as never} submitLabel={t('checkAnswer')} onAnswer={handleAnswer} />
      )}
      {result && (
        <div className="flex flex-col gap-2">
          <p className={result.correct ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
            {result.correct ? t('correct') : t('incorrect')}
          </p>
          <p className="text-sm text-gray-700">{result.explanation}</p>
          <button
            type="button"
            onClick={handleNext}
            className="bg-gray-900 text-white rounded px-4 py-2 self-start"
          >
            {t('nextExercise')}
          </button>
        </div>
      )}
    </div>
  )
}
