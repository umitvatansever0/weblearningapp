'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Exercise } from '@/course/types'
import { ExerciseCard } from './ExerciseCard'

interface Item {
  exerciseKey: string
  mistakeId?: string
  previousAnswer?: string
  exercise: Exercise
}

/**
 * Mixed review / mistake bank session. Topics are not labelled, so the
 * learner has to recognise the structure on their own.
 */
export function ReviewSession({ level, locale, items }: { level: string; locale: string; items: Item[] }) {
  const t = useTranslations('course')
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)

  if (items.length === 0) {
    return <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 p-5">{t('nothingDue')}</p>
  }

  if (index >= items.length) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 flex flex-col gap-3">
        <p className="text-2xl font-bold">{t('reviewDone', { correct, total: items.length })}</p>
        <p className="text-gray-600 dark:text-gray-400">{t('reviewDoneBody')}</p>
        <Link
          href={`/course/${level}`}
          className="self-start rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-5 py-2 font-medium"
        >
          {t('backToCourse')}
        </Link>
      </div>
    )
  }

  const item = items[index]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
          <div className="h-full bg-gray-900 dark:bg-gray-100 transition-all" style={{ width: `${(index / items.length) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-gray-500">
          {index + 1} / {items.length}
        </span>
      </div>
      {item.mistakeId && <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">{t('fromMistakeBank')}</p>}
      <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 sm:p-6">
        <ExerciseCard
          key={`${item.exerciseKey}-${index}`}
          exercise={item.exercise}
          locale={locale}
          onAnswer={(event) => {
            if (event.result.correct) setCorrect((c) => c + 1)
            void fetch('/api/course/attempt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                exerciseKey: item.exerciseKey,
                answer: event.answer,
                mode: 'review',
                mistakeId: item.mistakeId,
              }),
              keepalive: true,
            }).catch(() => {})
          }}
          onContinue={() => setIndex(index + 1)}
          continueLabel={index + 1 < items.length ? t('next') : t('done')}
        />
        {item.previousAnswer && (
          <p className="mt-4 text-xs text-gray-500" lang="de">
            {t('previouslyWrong')}: <span className="line-through">{item.previousAnswer}</span>
          </p>
        )}
      </div>
    </div>
  )
}
