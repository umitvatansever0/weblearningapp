'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Exercise } from '@/course/types'
import type { CheckResult } from '@/course/check'
import { ExerciseCard, type AnswerEvent } from './ExerciseCard'
import type { InputValue } from './ExerciseInputs'

export type StoredResult = CheckResult & { answer: InputValue }

/**
 * A set of exercises with a step indicator. Learners can jump between items
 * (nothing forces a fixed order) and come back to answered ones.
 */
export function ExerciseSet({
  exercises,
  locale,
  results,
  relatedFor,
  onAnswer,
  onFinished,
  finishLabel,
}: {
  exercises: Exercise[]
  locale: string
  results: Record<string, StoredResult | undefined>
  relatedFor: (exercise: Exercise) => Exercise[]
  onAnswer: (event: AnswerEvent, mode: 'main' | 'practice') => void
  onFinished: () => void
  finishLabel: string
}) {
  const t = useTranslations('course')
  const firstOpen = exercises.findIndex((e) => !results[e.id])
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen)
  const current = exercises[index]
  const answered = exercises.filter((e) => results[e.id]).length

  function next() {
    const after = exercises.findIndex((e, i) => i > index && !results[e.id])
    const before = exercises.findIndex((e) => !results[e.id] && e.id !== current.id)
    const target = after !== -1 ? after : before
    if (target === -1) onFinished()
    else setIndex(target)
  }

  const remaining = exercises.filter((e) => !results[e.id] && e.id !== current.id).length

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label={t('exerciseSteps')} className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{t('exerciseOf', { current: index + 1, total: exercises.length })}</span>
          <span>{t('answeredCount', { answered, total: exercises.length })}</span>
        </div>
        <ol className="flex flex-wrap gap-1.5">
          {exercises.map((exercise, i) => {
            const result = results[exercise.id]
            const state = result ? (result.correct ? 'right' : 'wrong') : 'open'
            return (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={t('goToExercise', { n: i + 1, state: t(`state.${state}`) })}
                  className={`h-2.5 rounded-full transition-all ${i === index ? 'w-8' : 'w-2.5'} ${
                    state === 'right'
                      ? 'bg-emerald-500'
                      : state === 'wrong'
                        ? 'bg-rose-400'
                        : i === index
                          ? 'bg-gray-900 dark:bg-gray-100'
                          : 'bg-gray-200 dark:bg-neutral-700'
                  }`}
                />
              </li>
            )
          })}
        </ol>
      </nav>

      <ExerciseCard
        key={current.id}
        exercise={current}
        locale={locale}
        related={relatedFor(current)}
        initialResult={results[current.id]}
        onAnswer={onAnswer}
        onContinue={next}
        continueLabel={remaining === 0 ? finishLabel : t('next')}
      />
    </div>
  )
}
