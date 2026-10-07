'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Exercise } from '@/course/types'
import { checkExercise, pick, type CheckResult } from '@/course/check'
import { ExerciseInput, isReady, type InputValue } from './ExerciseInputs'
import { RichText, plainText } from './RichText'
import { useSpeech } from './speech'

export interface AnswerEvent {
  exercise: Exercise
  answer: InputValue
  result: CheckResult
}

function SpeakButton({ text, label }: { text: string; label: string }) {
  const { supported, speak } = useSpeech()
  if (!supported) return null
  return (
    <button
      type="button"
      onClick={() => speak(plainText(text))}
      aria-label={label}
      className="shrink-0 rounded-full w-8 h-8 inline-flex items-center justify-center text-sm hover:bg-gray-100 dark:hover:bg-neutral-800"
    >
      🔊
    </button>
  )
}

/** Renders a sentence with its `___` gap as a visible blank. */
function Gapped({ text }: { text: string }) {
  const [before, after] = text.split('___')
  if (after === undefined) return <>{text}</>
  return (
    <>
      {before}
      <span className="inline-block min-w-16 border-b-2 border-gray-900 dark:border-gray-100 mx-1 align-baseline">&nbsp;</span>
      {after}
    </>
  )
}

function Prompt({ exercise, locale }: { exercise: Exercise; locale: string }) {
  const t = useTranslations('course')
  const big = 'text-2xl sm:text-3xl font-semibold tracking-tight leading-snug'
  switch (exercise.type) {
    case 'multiple_choice':
      return (
        <div className="flex flex-col gap-1">
          {exercise.promptL10n && <p className="text-gray-600 dark:text-gray-400">{pick(exercise.promptL10n, locale)}</p>}
          <p className={big} lang="de">
            <Gapped text={exercise.prompt} />
          </p>
        </div>
      )
    case 'multiple_select':
      return <p className="text-xl font-semibold">{pick(exercise.promptL10n, locale)}</p>
    case 'true_false':
      return (
        <p className={big} lang="de">
          „{exercise.statement}“
        </p>
      )
    case 'fill_blank':
      return (
        <p className={big} lang="de">
          <Gapped text={exercise.sentence} />
          {exercise.base && <span className="ml-2 text-base font-normal text-gray-500">({exercise.base})</span>}
        </p>
      )
    case 'image_choice':
      return (
        <div className="flex items-center gap-2">
          <p className={big} lang="de">
            {exercise.prompt}
          </p>
          <SpeakButton text={exercise.prompt} label={t('listen')} />
        </div>
      )
    case 'listening_choice':
      return <p className="text-xl font-semibold">{pick(exercise.question, locale)}</p>
    case 'error_correction':
      return (
        <p className={`${big} decoration-rose-400 decoration-wavy underline underline-offset-8`} lang="de">
          {exercise.sentence}
        </p>
      )
    case 'translation':
      return <p className={big}>„{pick(exercise.source, locale === 'de' ? 'en' : locale)}“</p>
    case 'dialogue':
      return (
        <div className="flex flex-col gap-2" lang="de">
          {exercise.lines.map((line, i) => (
            <div key={i} className="flex items-end gap-2">
              <span className="text-xs font-semibold text-gray-500 w-10 shrink-0">{line.speaker}</span>
              <p className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-neutral-800 px-4 py-2 text-lg">{line.de}</p>
            </div>
          ))}
          <div className="flex items-end gap-2 justify-end">
            <p className="rounded-2xl rounded-br-sm border-2 border-dashed border-gray-300 dark:border-neutral-600 px-4 py-2 text-lg text-gray-400">…?</p>
            <span className="text-xs font-semibold text-gray-500">{t('you')}</span>
          </div>
        </div>
      )
    case 'sentence_builder':
      return exercise.translation ? (
        <p className="text-lg text-gray-600 dark:text-gray-400">„{pick(exercise.translation, locale === 'de' ? 'en' : locale)}“</p>
      ) : null
    case 'ordering':
      return exercise.promptL10n ? <p className="text-xl font-semibold">{pick(exercise.promptL10n, locale)}</p> : null
    case 'matching':
    case 'categorize':
      return null
  }
}

/** Emoji scene (map, floor plan, timeline) shown above a task. */
function Visual({ rows }: { rows: string[] }) {
  return (
    <div
      role="img"
      aria-hidden="true"
      className="self-start rounded-2xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 p-3 flex flex-col gap-1"
    >
      {rows.map((row, r) => (
        <div key={r} className="flex gap-1">
          {row.split(' ').map((cell, c) => (
            <span key={c} className="w-11 h-11 flex items-center justify-center text-2xl">
              {cell === '.' ? '' : cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * One exercise with the full learning loop. Never advances on its own:
 * answer → ✓/✗ → why → example → (try one more) → continue.
 */
export function ExerciseCard({
  exercise,
  locale,
  related = [],
  onAnswer,
  onContinue,
  continueLabel,
  initialResult,
  compact,
}: {
  exercise: Exercise
  locale: string
  /** "Try one more" exercises offered after answering. */
  related?: Exercise[]
  onAnswer: (event: AnswerEvent, mode: 'main' | 'practice') => void
  onContinue?: () => void
  continueLabel?: string
  /** Show an exercise that was answered earlier (when revisiting a section). */
  initialResult?: CheckResult & { answer: InputValue }
  compact?: boolean
}) {
  const t = useTranslations('course')
  const [value, setValue] = useState<InputValue>(initialResult?.answer)
  const [result, setResult] = useState<CheckResult | null>(initialResult ?? null)
  const [showHint, setShowHint] = useState(false)
  const [practiceIndex, setPracticeIndex] = useState<number | null>(null)
  const ready = isReady(exercise, value)

  function check() {
    if (!ready || result) return
    const outcome = checkExercise(exercise, value, locale)
    setResult(outcome)
    onAnswer({ exercise, answer: value, result: outcome }, 'main')
  }

  const instructions = exercise.instructions ? pick(exercise.instructions, locale) : t(`instructions.${exercise.type}`)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{instructions}</p>
        {exercise.visual && <Visual rows={exercise.visual} />}
        <Prompt exercise={exercise} locale={locale} />
      </div>

      <ExerciseInput
        exercise={exercise}
        value={value}
        onChange={setValue}
        locked={result !== null}
        correct={result?.correct}
        locale={locale}
        onSubmit={check}
      />

      {!result && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={check}
            disabled={!ready}
            className="rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-6 py-2.5 font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t('check')}
          </button>
          {exercise.hint && !showHint && (
            <button type="button" onClick={() => setShowHint(true)} className="text-sm text-gray-500 underline underline-offset-4">
              💡 {t('showHint')}
            </button>
          )}
          {exercise.hint && showHint && (
            <p className="text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 rounded-lg px-3 py-1.5">
              💡 {pick(exercise.hint, locale)}
            </p>
          )}
        </div>
      )}

      {result && (
        <section
          aria-live="polite"
          className={`rounded-2xl border p-5 flex flex-col gap-4 ${
            result.correct
              ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/40'
              : 'border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/40'
          }`}
        >
          <div className="flex flex-col gap-1.5" lang="de">
            {result.correct ? (
              <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                ✓ {t('correct')} <span className="font-normal text-gray-800 dark:text-gray-200">{result.expected}</span>
              </p>
            ) : (
              <>
                <p className="text-lg font-semibold text-rose-800 dark:text-rose-300">✗ {t('notQuite')}</p>
                {result.given && (
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="line-through decoration-rose-500">{result.given}</span>
                  </p>
                )}
                <p className="font-medium text-gray-900 dark:text-gray-100">✓ {result.expected}</p>
              </>
            )}
            {result.correct && result.caseHint && <p className="text-sm text-amber-800 dark:text-amber-300">{t('caseHint')}</p>}
          </div>

          {(!compact || !result.correct) && (
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('why')}</h4>
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{pick(exercise.explanation, locale)}</p>
            </div>
          )}

          {!compact && exercise.examples && exercise.examples.length > 0 && (
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('example')}</h4>
              {exercise.examples.map((example, i) => (
                <p key={i} className="flex items-center gap-1 text-lg" lang="de">
                  <span>
                    <RichText text={example} />
                  </span>
                  <SpeakButton text={example} label={t('listen')} />
                </p>
              ))}
            </div>
          )}

          {!compact && related.length > 0 && practiceIndex === null && (
            <div>
              <button
                type="button"
                onClick={() => setPracticeIndex(0)}
                className="rounded-full border border-gray-900 dark:border-gray-100 px-4 py-2 text-sm font-medium hover:bg-white dark:hover:bg-neutral-900"
              >
                ↻ {result.correct ? t('tryOneMore') : t('practiceSimilar', { count: related.length })}
              </button>
            </div>
          )}

          {practiceIndex !== null && practiceIndex < related.length && (
            <div className="rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                {t('similarExercise', { current: practiceIndex + 1, total: related.length })}
              </p>
              <ExerciseCard
                key={related[practiceIndex].id}
                exercise={related[practiceIndex]}
                locale={locale}
                compact
                onAnswer={(event) => onAnswer(event, 'practice')}
                onContinue={() => setPracticeIndex(practiceIndex + 1)}
                continueLabel={practiceIndex + 1 < related.length ? t('next') : t('done')}
              />
            </div>
          )}

          {onContinue && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onContinue}
                className="rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-6 py-2.5 font-medium"
              >
                {continueLabel ?? t('continue')} →
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
