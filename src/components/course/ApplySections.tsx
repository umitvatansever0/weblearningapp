'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Exercise, L10n, VocabItem, WritingCheck } from '@/course/types'
import { checkExercise, pick } from '@/course/check'
import { analyseWriting, type WritingFeedback } from '@/course/writing'
import { useSpeech } from './speech'
import type { AnswerEvent } from './ExerciseCard'

const primary = 'rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-5 py-2.5 font-medium disabled:opacity-30'
const secondary = 'rounded-full border border-gray-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800'

/**
 * Speaking: the learner records themselves in the browser and compares with
 * a model answer. There is no automatic speech scoring, so none is faked –
 * the learner self-checks the points.
 */
export function SpeakingSection({
  prompt,
  points,
  model,
  locale,
  done,
  onDone,
}: {
  prompt: L10n
  points: L10n[]
  model: string[]
  locale: string
  done: boolean
  onDone: (selfScore: number) => void
}) {
  const t = useTranslations('course')
  const { supported, speak } = useSpeech()
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checked, setChecked] = useState<boolean[]>(() => points.map(() => false))
  const [showModel, setShowModel] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  async function start() {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(t('recordingUnsupported'))
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks: Blob[] = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => chunks.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })))
      }
      recorder.current = rec
      rec.start()
      setRecording(true)
    } catch {
      setError(t('microphoneDenied'))
    }
  }

  function stop() {
    recorder.current?.stop()
    setRecording(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 flex flex-col gap-3">
        <p className="text-lg font-semibold">🗣️ {pick(prompt, locale)}</p>
        <ul className="flex flex-col gap-1.5 text-gray-700 dark:text-gray-300">
          {points.map((point, i) => (
            <li key={i}>• {pick(point, locale)}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {recording ? (
          <button type="button" onClick={stop} className={`${primary} bg-rose-600 dark:bg-rose-500`}>
            ■ {t('stopRecording')}
          </button>
        ) : (
          <button type="button" onClick={start} className={primary}>
            ● {audioUrl ? t('recordAgain') : t('record')}
          </button>
        )}
        {recording && <span className="text-sm text-rose-600 animate-pulse">{t('recording')}</span>}
        {audioUrl && !recording && <audio controls src={audioUrl} className="h-10" />}
      </div>
      {error && <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>}
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('recordingPrivacy')}</p>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => setShowModel((v) => !v)} className={`${secondary} self-start`}>
          {showModel ? t('hideModel') : t('showModel')}
        </button>
        {showModel && (
          <div className="rounded-xl bg-gray-50 dark:bg-neutral-800 p-4 flex flex-col gap-1" lang="de">
            {model.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            {supported && (
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => speak(model.join(' '))} className={secondary}>
                  ▶ {t('play')}
                </button>
                <button type="button" onClick={() => speak(model.join(' '), true)} className={secondary}>
                  🐢 {t('slow')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold mb-1">{t('selfCheck')}</legend>
        {points.map((point, i) => (
          <label key={i} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={() => setChecked((prev) => prev.map((c, j) => (j === i ? !c : c)))}
              className="mt-0.5"
            />
            {pick(point, locale)}
          </label>
        ))}
      </fieldset>
      <div>
        <button
          type="button"
          onClick={() => onDone(Math.round((checked.filter(Boolean).length / points.length) * 100))}
          className={primary}
        >
          {done ? `✓ ${t('saved')}` : t('finishSpeaking')}
        </button>
      </div>
    </div>
  )
}

export function WritingSection({
  prompt,
  minSentences,
  checks,
  model,
  vocabulary,
  locale,
  initialText,
  onChecked,
}: {
  prompt: L10n
  minSentences: number
  checks: WritingCheck[]
  model: string[]
  vocabulary: VocabItem[]
  locale: string
  initialText: string
  onChecked: (text: string, feedback: WritingFeedback) => void
}) {
  const t = useTranslations('course')
  const [text, setText] = useState(initialText)
  const [feedback, setFeedback] = useState<WritingFeedback | null>(() =>
    initialText ? analyseWriting(initialText, { minSentences, checks, vocabulary }) : null
  )

  function check() {
    const result = analyseWriting(text, { minSentences, checks, vocabulary })
    setFeedback(result)
    onChecked(text, result)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-semibold">✍️ {pick(prompt, locale)}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        lang="de"
        spellCheck={false}
        placeholder={'Das ist …\nDer/Die/Das … ist …\nIch habe kein/keine …'}
        className="w-full rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
      />
      <div>
        <button type="button" onClick={check} disabled={text.trim().length < 3} className={primary}>
          {t('checkWriting')}
        </button>
      </div>

      {feedback && (
        <section aria-live="polite" className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 flex flex-col gap-4">
          <ul className="flex flex-col gap-1.5">
            <li className={feedback.enoughSentences ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500'}>
              {feedback.enoughSentences ? '✓' : '○'} {t('sentenceCount', { count: feedback.sentences, min: minSentences })}
            </li>
            {feedback.checks.map((c, i) => (
              <li key={i} className={c.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500'}>
                {c.passed ? '✓' : '○'} {pick(c.label, locale)}
              </li>
            ))}
          </ul>
          {feedback.issues.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('checkThese')}</h4>
              {feedback.issues.map((issue, i) => (
                <p key={i} className="text-sm" lang="de">
                  <span className="line-through decoration-rose-500">{issue.found}</span> →{' '}
                  <span className="font-semibold">
                    {issue.kind === 'gender' ? issue.correct : issue.found.replace(/\S+$/, issue.noun)}
                  </span>
                  <span className="text-gray-500" lang={locale}>
                    {' '}
                    · {issue.kind === 'gender' ? t('issueGender', { noun: issue.noun }) : t('issueCapital')}
                  </span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">{t('noArticleIssues')}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('writingLimits')}</p>
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('modelAnswer')}</h4>
            <div lang="de" className="text-gray-700 dark:text-gray-300">
              {model.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** 60-second article challenge built from the unit's generated drills. */
export function TimedSection({
  pool,
  seconds,
  locale,
  best,
  onAnswer,
  onFinished,
}: {
  pool: Exercise[]
  seconds: number
  locale: string
  best: number
  onAnswer: (event: AnswerEvent) => void
  onFinished: (score: number) => void
}) {
  const t = useTranslations('course')
  const [queue, setQueue] = useState<Exercise[] | null>(null)
  const [index, setIndex] = useState(0)
  const [left, setLeft] = useState(seconds)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<{ correct: boolean; expected: string } | null>(null)
  const [missed, setMissed] = useState<{ prompt: string; expected: string }[]>([])
  const running = queue !== null && left > 0
  const finishedRef = useRef(false)

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (queue && left <= 0 && !finishedRef.current) {
      finishedRef.current = true
      onFinished(score)
    }
  }, [left, queue, score, onFinished])

  function start() {
    finishedRef.current = false
    setQueue(shuffled(pool))
    setIndex(0)
    setLeft(seconds)
    setScore(0)
    setMissed([])
    setFlash(null)
  }

  function answer(option: number) {
    if (!queue || left <= 0) return
    const exercise = queue[index % queue.length] as Extract<Exercise, { type: 'multiple_choice' }>
    const result = checkExercise(exercise, option, locale)
    onAnswer({ exercise, answer: option, result })
    setFlash({ correct: result.correct, expected: result.expected })
    if (result.correct) setScore((s) => s + 1)
    else setMissed((m) => [...m, { prompt: exercise.prompt, expected: result.expected }])
    setIndex((i) => i + 1)
  }

  if (!queue) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 flex flex-col items-start gap-3">
        <p className="text-4xl font-bold tabular-nums">⏱ {seconds}s</p>
        {best > 0 && <p className="text-sm text-gray-500">{t('bestScore', { score: best })}</p>}
        <button type="button" onClick={start} className={primary}>
          {t('startChallenge')}
        </button>
      </div>
    )
  }

  if (left <= 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 flex flex-col gap-4">
        <p className="text-3xl font-bold">{t('timedResult', { score })}</p>
        {missed.length > 0 && (
          <div className="flex flex-col gap-1" lang="de">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('rememberThese')}</h4>
            {missed.map((m, i) => (
              <p key={i} className="font-semibold">
                {m.expected}
              </p>
            ))}
          </div>
        )}
        <button type="button" onClick={start} className={`${primary} self-start`}>
          ↻ {t('playAgain')}
        </button>
      </div>
    )
  }

  const current = queue[index % queue.length] as Extract<Exercise, { type: 'multiple_choice' }>
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <span className={`text-2xl font-bold tabular-nums ${left <= 10 ? 'text-rose-600' : ''}`}>⏱ {left}s</span>
        <span className="text-lg font-semibold tabular-nums">✓ {score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
        <div className="h-full bg-gray-900 dark:bg-gray-100 transition-all duration-1000 ease-linear" style={{ width: `${(left / seconds) * 100}%` }} />
      </div>
      <p className="text-4xl font-semibold text-center py-4" lang="de">
        {current.prompt.replace('___', '___ ')}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {current.options.map((option, i) => (
          <button
            key={i}
            type="button"
            onClick={() => answer(i)}
            className="rounded-xl border-2 border-gray-200 dark:border-neutral-700 py-4 text-xl font-semibold hover:border-gray-900 dark:hover:border-gray-100"
          >
            {option}
          </button>
        ))}
      </div>
      <p aria-live="polite" className={`text-center text-sm h-5 ${flash?.correct ? 'text-emerald-700' : 'text-rose-700'}`} lang="de">
        {flash && (flash.correct ? `✓ ${flash.expected}` : `✗ ${flash.expected}`)}
      </p>
    </div>
  )
}
