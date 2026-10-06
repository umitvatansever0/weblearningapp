'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { PlacementResult, PublicPlacementQuestion } from '@/lib/placementTest'

type Result = PlacementResult & { emailSent: boolean }

const SKIPPED = -1

export function PlacementTest({ questions, email }: { questions: PublicPlacementQuestion[]; email: string }) {
  const t = useTranslations('placement')
  const locale = useLocale()
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => SKIPPED))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const question = questions[current]
  const isLast = current === questions.length - 1
  const answeredCount = answers.filter((a) => a !== SKIPPED).length

  function choose(optionIndex: number) {
    setAnswers((prev) => prev.map((a, i) => (i === current ? optionIndex : a)))
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/placement-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, locale }),
      })
      if (res.status === 429) {
        setError(t('errorTooMany'))
        return
      }
      if (!res.ok) {
        setError(t('errorGeneric'))
        return
      }
      setResult(await res.json())
      window.scrollTo({ top: 0 })
    } catch {
      setError(t('errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  function restart() {
    setAnswers(questions.map(() => SKIPPED))
    setCurrent(0)
    setResult(null)
    setStarted(true)
  }

  if (result) {
    return (
      <section className="border rounded p-6 flex flex-col gap-4" aria-live="polite">
        <h2 className="text-xl font-semibold">{t('resultTitle')}</h2>
        <p className="text-3xl font-bold">{result.level ?? t('beginner')}</p>
        <p>{t('score', { correct: result.correct, total: result.total })}</p>
        <table className="text-sm border-collapse w-full max-w-sm">
          <thead>
            <tr>
              <th className="border px-3 py-1 text-left">{t('levelColumn')}</th>
              <th className="border px-3 py-1 text-left">{t('correctColumn')}</th>
            </tr>
          </thead>
          <tbody>
            {result.perLevel.map((s) => (
              <tr key={s.level}>
                <td className="border px-3 py-1">{s.level}</td>
                <td className="border px-3 py-1">
                  {s.correct} / {s.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>{t('recommendation', { level: result.recommended })}</p>
        <p className="text-sm text-gray-600">
          {result.emailSent ? t('emailSent', { email }) : t('emailFailed')}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/learn/${result.recommended}`}
            className="bg-gray-900 text-white rounded px-5 py-2 text-sm"
          >
            {t('goToLessons', { level: result.recommended })}
          </Link>
          <button type="button" onClick={restart} className="border rounded px-5 py-2 text-sm">
            {t('retake')}
          </button>
        </div>
      </section>
    )
  }

  if (!started) {
    return (
      <section className="border rounded p-6 flex flex-col gap-3">
        <p className="text-sm text-gray-600">{t('emailNotice', { email })}</p>
        <div>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="bg-gray-900 text-white rounded px-5 py-2"
          >
            {t('start')}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="border rounded p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{t('progress', { current: current + 1, total: questions.length })}</span>
          <span>{question.level}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded" role="presentation">
          <div
            className="h-2 bg-gray-900 rounded transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-medium mb-3">{question.prompt}</legend>
        {question.options.map((option, index) => (
          <label
            key={index}
            className={`border rounded px-4 py-3 cursor-pointer flex gap-3 items-center ${
              answers[current] === index ? 'border-gray-900 bg-gray-50' : ''
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              checked={answers[current] === index}
              onChange={() => choose(index)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 justify-between">
        <button
          type="button"
          onClick={() => setCurrent((c) => c - 1)}
          disabled={current === 0}
          className="border rounded px-4 py-2 text-sm disabled:opacity-40"
        >
          {t('previous')}
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="bg-gray-900 text-white rounded px-5 py-2 text-sm disabled:opacity-60"
          >
            {submitting ? t('submitting') : t('finish', { answered: answeredCount, total: questions.length })}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrent((c) => c + 1)}
            className="bg-gray-900 text-white rounded px-5 py-2 text-sm"
          >
            {answers[current] === SKIPPED ? t('skip') : t('next')}
          </button>
        )}
      </div>
    </section>
  )
}
