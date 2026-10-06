'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { CourseUnit, Exercise, Section, Skill, UnitOutline } from '@/course/types'
import { SKILLS } from '@/course/types'
import { pick } from '@/course/check'
import { pickVariation } from '@/course/variation'
import type { WritingFeedback } from '@/course/writing'
import { ExerciseSet, type StoredResult } from './ExerciseSet'
import type { AnswerEvent } from './ExerciseCard'
import { ContextSection, DiscoverSection, UnderstandSection, VocabLabel } from './LearnSections'
import { SpeakingSection, TimedSection, WritingSection } from './ApplySections'
import { RichText } from './RichText'
import { MasteryBar } from './MasteryBar'

interface UnitState {
  /** First attempt per exercise – retries never inflate the score. */
  results: Record<string, StoredResult>
  completed: string[]
  timedBest: number
  writing: { text: string; score: number } | null
  speaking: number | null
}

const EMPTY: UnitState = { results: {}, completed: [], timedBest: 0, writing: null, speaking: null }

const SECTION_ICON: Record<Section['kind'], string> = {
  discover: '👀',
  understand: '💡',
  context: '💬',
  practice: '✏️',
  reading: '📖',
  listening: '🎧',
  speaking: '🗣️',
  writing: '✍️',
  timed: '⏱',
  review: '🔁',
  summary: '🏁',
}

function storageKey(unit: CourseUnit) {
  return `deutschstep:course:${unit.level}:${unit.slug}:v1`
}

function loadState(unit: CourseUnit): UnitState {
  try {
    const raw = window.localStorage.getItem(storageKey(unit))
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
  } catch {
    return EMPTY
  }
}

function saveState(unit: CourseUnit, state: UnitState) {
  try {
    window.localStorage.setItem(storageKey(unit), JSON.stringify(state))
  } catch {
    // Private mode or storage full: progress still works for this visit.
  }
}

function post(url: string, body: unknown) {
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {})
}

function percent(correct: number, total: number): number | null {
  return total === 0 ? null : Math.round((correct / total) * 100)
}

export interface LessonCanvasProps {
  unit: CourseUnit
  locale: string
  signedIn: boolean
  serverCompleted: string[]
  dueMistakes: number
  next?: UnitOutline
}

export function LessonCanvas({ unit, locale, signedIn, serverCompleted, dueMistakes, next }: LessonCanvasProps) {
  const t = useTranslations('course')
  const [state, setState] = useState<UnitState>(EMPTY)
  const [hydrated, setHydrated] = useState(false)
  const [active, setActive] = useState(0)
  const [reviewRun, setReviewRun] = useState<Exercise[] | null>(null)
  const [reviewResults, setReviewResults] = useState<Record<string, StoredResult>>({})
  const topRef = useRef<HTMLDivElement>(null)

  const byId = useMemo(() => new Map(unit.exercises.map((e) => [e.id, e])), [unit])
  const pool = useMemo(() => unit.exercises.map((exercise) => ({ unit, exercise, key: `${unit.slug}:${exercise.id}` })), [unit])
  const section = unit.sections[active]

  // Restore this browser's progress after hydration (server render has none).
  useEffect(() => {
    const saved = loadState(unit)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from localStorage
    setState({ ...saved, completed: [...new Set([...saved.completed, ...serverCompleted])] })
    setHydrated(true)
  }, [unit, serverCompleted])

  useEffect(() => {
    if (hydrated) saveState(unit, state)
  }, [hydrated, unit, state])

  const complete = useCallback(
    (key: string) => {
      setState((prev) => (prev.completed.includes(key) ? prev : { ...prev, completed: [...prev.completed, key] }))
      if (signedIn) post('/api/course/section', { level: unit.level, unitSlug: unit.slug, sectionKey: key })
    },
    [signedIn, unit]
  )

  const record = useCallback(
    (event: AnswerEvent, mode: 'lesson' | 'practice' | 'timed') => {
      if (mode === 'lesson') {
        setState((prev) =>
          prev.results[event.exercise.id]
            ? prev
            : { ...prev, results: { ...prev.results, [event.exercise.id]: { ...event.result, answer: event.answer } } }
        )
      }
      if (signedIn) {
        post('/api/course/attempt', { exerciseKey: `${unit.slug}:${event.exercise.id}`, answer: event.answer, mode })
      }
    },
    [signedIn, unit]
  )

  function go(index: number) {
    setActive(Math.max(0, Math.min(unit.sections.length - 1, index)))
    setReviewRun(null)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function continueFrom(key: string) {
    complete(key)
    go(active + 1)
  }

  // --- derived scores ------------------------------------------------------
  const practiceIds = unit.sections.flatMap((s) => (s.kind === 'practice' ? s.exercises : []))
  const answeredPractice = practiceIds.filter((id) => state.results[id]).length
  const correctPractice = practiceIds.filter((id) => state.results[id]?.correct).length
  const answeredShare = practiceIds.length ? answeredPractice / practiceIds.length : 0
  const accuracy = answeredPractice ? correctPractice / answeredPractice : 0
  const mastered = answeredShare >= unit.mastery.minAnswered && accuracy >= unit.mastery.minAccuracy

  const skillScores = useMemo(() => {
    const scores = {} as Record<Skill, number | null>
    for (const skill of SKILLS) {
      const entries = Object.entries(state.results).filter(([id]) => byId.get(id)?.skill === skill)
      scores[skill] = percent(entries.filter(([, r]) => r.correct).length, entries.length)
    }
    if (state.writing) {
      scores.writing = scores.writing === null ? state.writing.score : Math.round((scores.writing + state.writing.score) / 2)
    }
    scores.speaking = state.speaking
    return scores
  }, [state, byId])

  const topicScores = unit.topics.map((topic) => {
    const entries = Object.entries(state.results).filter(([id]) => byId.get(id)?.topic === topic.key)
    return { topic, value: percent(entries.filter(([, r]) => r.correct).length, entries.length) }
  })

  const trackable = unit.sections.filter((s) => s.kind !== 'summary')
  const progress = Math.round((trackable.filter((s) => state.completed.includes(s.key)).length / trackable.length) * 100)
  const wrongIds = Object.entries(state.results)
    .filter(([id, r]) => !r.correct && byId.get(id)?.skill !== 'reading')
    .map(([id]) => id)

  const relatedFor = (exercise: Exercise) => (exercise.practice ?? []).map((id) => byId.get(id)!).filter(Boolean)

  function startMistakePractice() {
    const items: Exercise[] = []
    const used = new Set<string>()
    wrongIds.forEach((id, turn) => {
      const original = byId.get(id)!
      const variation = pickVariation(pool, `${unit.slug}:${id}`, original.concept, turn)
      const exercise = variation?.exercise ?? original
      if (!used.has(exercise.id)) {
        used.add(exercise.id)
        items.push(exercise)
      }
    })
    setReviewResults({})
    setReviewRun(items)
  }

  function startWeakPractice() {
    const weakest = [...topicScores].filter((s) => s.value !== null).sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0]
    const topic = weakest?.topic.key
    const items = unit.exercises
      .filter((e) => (topic ? e.topic === topic : true) && e.skill !== 'reading' && !e.id.startsWith('art-'))
      .slice(0, 8)
    const review = unit.sections.findIndex((s) => s.kind === 'review')
    setActive(review)
    setReviewResults({})
    setReviewRun(items.length ? items : null)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // --- section bodies --------------------------------------------------------
  function body(s: Section) {
    switch (s.kind) {
      case 'discover':
        return <DiscoverSection cards={s.cards} locale={locale} />
      case 'understand':
        return <UnderstandSection rules={s.rules} locale={locale} />
      case 'context':
        return <ContextSection scene={pick(s.scene, locale)} dialogue={s.dialogue} examples={s.examples} locale={locale} />
      case 'practice':
      case 'listening':
        return (
          <ExerciseSet
            key={s.key}
            exercises={s.exercises.map((id) => byId.get(id)!)}
            locale={locale}
            results={state.results}
            relatedFor={relatedFor}
            onAnswer={(event, mode) => record(event, mode === 'main' ? 'lesson' : 'practice')}
            onFinished={() => continueFrom(s.key)}
            finishLabel={t('finishSection')}
          />
        )
      case 'reading':
        return (
          <div className="flex flex-col gap-6">
            <article className="rounded-2xl border border-gray-200 dark:border-neutral-700 bg-amber-50/40 dark:bg-neutral-900 p-6 text-xl leading-loose" lang="de">
              {s.passage.map((line, i) => (
                <span key={i}>
                  <RichText text={line} />{' '}
                </span>
              ))}
            </article>
            {s.glossary && (
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {s.glossary.map((g) => (
                  <div key={g.de} className="flex gap-2">
                    <dt className="font-semibold shrink-0" lang="de">
                      {g.de}
                    </dt>
                    <dd className="text-gray-600 dark:text-gray-400">{pick(g.note, locale)}</dd>
                  </div>
                ))}
              </dl>
            )}
            <ExerciseSet
              key={s.key}
              exercises={s.exercises.map((id) => byId.get(id)!)}
              locale={locale}
              results={state.results}
              relatedFor={() => []}
              onAnswer={(event) => record(event, 'lesson')}
              onFinished={() => continueFrom(s.key)}
              finishLabel={t('finishSection')}
            />
          </div>
        )
      case 'speaking':
        return (
          <SpeakingSection
            prompt={s.prompt}
            points={s.points}
            model={s.model}
            locale={locale}
            done={state.completed.includes(s.key)}
            onDone={(score) => {
              setState((prev) => ({ ...prev, speaking: score }))
              continueFrom(s.key)
            }}
          />
        )
      case 'writing':
        return (
          <WritingSection
            key={hydrated ? 'ready' : 'loading'}
            prompt={s.prompt}
            minSentences={s.minSentences}
            checks={s.checks}
            model={s.model}
            vocabulary={unit.vocabulary}
            locale={locale}
            initialText={state.writing?.text ?? ''}
            onChecked={(text, feedback: WritingFeedback) => {
              setState((prev) => ({ ...prev, writing: { text, score: feedback.score } }))
              complete(s.key)
            }}
          />
        )
      case 'timed':
        return (
          <TimedSection
            pool={s.pool.map((id) => byId.get(id)!)}
            seconds={s.seconds}
            locale={locale}
            best={state.timedBest}
            onAnswer={(event) => record(event, 'timed')}
            onFinished={(score) => {
              setState((prev) => ({ ...prev, timedBest: Math.max(prev.timedBest, score) }))
              complete(s.key)
            }}
          />
        )
      case 'review':
        return reviewRun ? (
          <div className="flex flex-col gap-4">
            <button type="button" onClick={() => setReviewRun(null)} className="self-start text-sm underline underline-offset-4 text-gray-500">
              ← {t('backToMistakes')}
            </button>
            <ExerciseSet
              exercises={reviewRun}
              locale={locale}
              results={reviewResults}
              relatedFor={() => []}
              onAnswer={(event) => {
                setReviewResults((prev) => ({ ...prev, [event.exercise.id]: { ...event.result, answer: event.answer } }))
                record(event, 'practice')
              }}
              onFinished={() => {
                setReviewRun(null)
                complete(s.key)
              }}
              finishLabel={t('done')}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {wrongIds.length === 0 ? (
              <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 p-5">
                {Object.keys(state.results).length === 0 ? t('noAnswersYet') : t('noMistakes')}
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-2">
                  {wrongIds.map((id) => {
                    const r = state.results[id]
                    const exercise = byId.get(id)!
                    return (
                      <li key={id} className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4 flex flex-col gap-1">
                        <p className="text-rose-700 dark:text-rose-400 line-through decoration-rose-400" lang="de">
                          ✗ {r.given || '—'}
                        </p>
                        <p className="font-medium" lang="de">
                          ✓ {r.expected}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('topic')}: {pick(unit.topics.find((tp) => tp.key === exercise.topic)?.label ?? { en: exercise.topic, tr: exercise.topic, de: exercise.topic }, locale)}
                        </p>
                      </li>
                    )
                  })}
                </ul>
                <button type="button" onClick={startMistakePractice} className="self-start rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-5 py-2.5 font-medium">
                  ↻ {t('practiceMyMistakes')}
                </button>
              </>
            )}
            <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 text-sm flex flex-col gap-2">
              <p className="font-semibold">{t('spacedTitle')}</p>
              <p className="text-gray-600 dark:text-gray-400">{t('spacedBody')}</p>
              {signedIn ? (
                <Link href={`/course/${unit.level}/review`} className="self-start underline underline-offset-4">
                  {t('openMistakeBank', { count: dueMistakes })}
                </Link>
              ) : (
                <Link href="/login" className="self-start underline underline-offset-4">
                  {t('loginToSave')}
                </Link>
              )}
            </div>
            <div>
              <button type="button" onClick={() => continueFrom(s.key)} className="rounded-full border border-gray-900 dark:border-gray-100 px-5 py-2 font-medium">
                {t('continue')} →
              </button>
            </div>
          </div>
        )
      case 'summary':
        return (
          <div className="flex flex-col gap-8">
            <div
              className={`rounded-2xl p-6 flex flex-col gap-2 ${
                mastered ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100' : 'bg-gray-50 dark:bg-neutral-900'
              }`}
            >
              <p className="text-2xl font-bold">{mastered ? `🏆 ${t('unitMastered')}` : t('notMasteredYet')}</p>
              <p className="text-sm">
                {t('masteryRule', {
                  answered: Math.round(unit.mastery.minAnswered * 100),
                  accuracy: Math.round(unit.mastery.minAccuracy * 100),
                })}
              </p>
              <p className="text-sm">
                {t('masteryStatus', { answered: Math.round(answeredShare * 100), accuracy: Math.round(accuracy * 100) })}
              </p>
            </div>

            <section className="grid sm:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('yourScore')}</h3>
                {SKILLS.map((skill) => (
                  <MasteryBar
                    key={skill}
                    label={`${t(`skill.${skill}`)}${skill === 'speaking' ? ` (${t('selfAssessed')})` : ''}`}
                    value={skillScores[skill]}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('topicMastery')}</h3>
                {topicScores.map(({ topic, value }) => (
                  <MasteryBar key={topic.key} label={pick(topic.label, locale)} value={value} />
                ))}
              </div>
            </section>

            {(() => {
              const scored = SKILLS.filter((sk) => skillScores[sk] !== null && sk !== 'speaking')
              const strongest = [...scored].sort((a, b) => (skillScores[b] ?? 0) - (skillScores[a] ?? 0))[0]
              const weakTopic = topicScores.filter((s) => s.value !== null).sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0]
              if (!strongest) return null
              return (
                <div className="grid sm:grid-cols-2 gap-3">
                  <p className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4">
                    <span className="block text-xs text-gray-500 uppercase tracking-wider">{t('strongestSkill')}</span>
                    <span className="text-lg font-semibold">{t(`skill.${strongest}`)}</span>
                  </p>
                  {weakTopic && (
                    <p className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4">
                      <span className="block text-xs text-gray-500 uppercase tracking-wider">{t('nextFocus')}</span>
                      <span className="text-lg font-semibold">{pick(weakTopic.topic.label, locale)}</span>
                    </p>
                  )}
                </div>
              )
            })()}

            <section className="grid sm:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('whatYouLearned')}</h3>
                <ul className="flex flex-col gap-1.5">
                  {unit.summary.learned.map((item, i) => (
                    <li key={i}>✓ {pick(item, locale)}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('commonMistakes')}</h3>
                <ul className="flex flex-col gap-2">
                  {unit.summary.mistakes.map((m, i) => (
                    <li key={i} className="text-sm">
                      <span lang="de">
                        ❌ <span className="line-through">{m.wrong}</span> → ✓ <span className="font-semibold">{m.right}</span>
                      </span>
                      <span className="block text-gray-500">{pick(m.note, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('newWords')}</h3>
              <ul className="flex flex-wrap gap-2" lang="de">
                {unit.vocabulary.map((v) => (
                  <li key={v.word} className="rounded-full border border-gray-200 dark:border-neutral-700 px-3 py-1 text-sm">
                    {v.emoji} <VocabLabel item={v} />
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={startWeakPractice} className="rounded-full border border-gray-900 dark:border-gray-100 px-5 py-2.5 font-medium">
                ↻ {t('practiceWeakAreas')}
              </button>
              {next && (
                <Link href={`/course/${unit.level}/${next.slug}`} className="rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-5 py-2.5 font-medium">
                  {t('continueToUnit', { number: String(next.number).padStart(2, '0') })} →
                </Link>
              )}
            </div>
            {!signedIn && (
              <p className="text-sm text-gray-500">
                <Link href="/login" className="underline underline-offset-4">
                  {t('loginToSave')}
                </Link>
              </p>
            )}
          </div>
        )
    }
  }

  const isDone = (s: Section) => state.completed.includes(s.key)
  const learnKinds: Section['kind'][] = ['discover', 'understand', 'context']

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pb-12">
      <div ref={topRef} className="scroll-mt-4" />
      <header className="flex flex-col gap-4 mb-6">
        <nav className="text-sm text-gray-500 dark:text-gray-400 flex gap-2">
          <Link href={`/course/${unit.level}`} className="hover:underline underline-offset-4">
            {t('courseName', { level: unit.level })}
          </Link>
          <span aria-hidden="true">/</span>
          <span>
            {unit.level} · {t('unit')} {String(unit.number).padStart(2, '0')}
          </span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" lang="de">
              {unit.titleDe}
            </h1>
            {pick(unit.title, locale) !== unit.titleDe && <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">{pick(unit.title, locale)}</p>}
          </div>
          <div className="sm:w-64 flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('progress')}</span>
              <span className="font-semibold tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gray-900 dark:bg-gray-100 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-gray-500">⏱ {t('minutes', { from: unit.minutes[0], to: unit.minutes[1] })}</span>
          </div>
        </div>
        <p className="rounded-2xl border-l-4 border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-neutral-900 px-5 py-4">
          <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">🎯 {t('goal')}</span>
          {pick(unit.goal, locale)}
        </p>
      </header>

      {/* Mobile: section pills */}
      <nav aria-label={t('lessonOverview')} className="lg:hidden -mx-4 px-4 mb-6 overflow-x-auto">
        <ol className="flex gap-2 w-max">
          {unit.sections.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === active ? 'step' : undefined}
                className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap border ${
                  i === active
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900'
                    : 'border-gray-200 dark:border-neutral-700'
                }`}
              >
                {isDone(s) ? '✓' : SECTION_ICON[s.kind]} {pick(s.title, locale)}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10">
        <div className="min-w-0 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('stepOf', { current: active + 1, total: unit.sections.length })}
            </p>
            <h2 className="text-2xl font-semibold">
              {SECTION_ICON[section.kind]} {pick(section.title, locale)}
            </h2>
            {section.intro && <p className="text-gray-600 dark:text-gray-400 max-w-2xl">{pick(section.intro, locale)}</p>}
          </div>

          {body(section)}

          {learnKinds.includes(section.kind) && (
            <div className="hidden lg:flex justify-between border-t border-gray-100 dark:border-neutral-800 pt-5">
              <button type="button" onClick={() => go(active - 1)} disabled={active === 0} className="text-sm text-gray-500 disabled:opacity-0">
                ← {t('back')}
              </button>
              <button type="button" onClick={() => continueFrom(section.key)} className="rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-6 py-2.5 font-medium">
                {t('continue')} →
              </button>
            </div>
          )}
        </div>

        <aside className="hidden lg:flex flex-col gap-6 sticky top-6 self-start">
          <nav aria-label={t('lessonOverview')} className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{t('lessonOverview')}</h3>
            <ol className="flex flex-col gap-0.5">
              {unit.sections.map((s, i) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === active ? 'step' : undefined}
                    className={`w-full text-left rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-2 ${
                      i === active ? 'bg-gray-100 dark:bg-neutral-800 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <span className={`w-5 text-center ${isDone(s) ? 'text-emerald-600' : 'text-gray-400'}`}>{isDone(s) ? '✓' : '○'}</span>
                    {pick(s.title, locale)}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('topicMastery')}</h3>
            {topicScores.map(({ topic, value }) => (
              <MasteryBar key={topic.key} label={pick(topic.label, locale)} value={value} compact />
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('wordList')}</h3>
            <ul className="grid grid-cols-1 gap-1 text-sm max-h-64 overflow-y-auto pr-1" lang="de">
              {unit.vocabulary.map((v) => (
                <li key={v.word} className="flex justify-between gap-2">
                  <VocabLabel item={v} />
                  <span className="text-gray-400 truncate" lang={locale}>
                    {pick(v.translation, locale === 'de' ? 'en' : locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Mobile: bottom navigation, sticky while the lesson is on screen */}
      <nav
        aria-label={t('lessonNavigation')}
        className="lg:hidden sticky bottom-0 z-30 -mx-4 sm:-mx-6 mt-8 border-t border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur px-4 py-3 flex items-center gap-3"
      >
        <button type="button" onClick={() => go(active - 1)} disabled={active === 0} className="rounded-full border border-gray-300 dark:border-neutral-700 px-4 py-2 text-sm disabled:opacity-30">
          ← {t('back')}
        </button>
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 tabular-nums">
            {active + 1} / {unit.sections.length} · {progress}%
          </span>
          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full bg-gray-900 dark:bg-gray-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => (learnKinds.includes(section.kind) ? continueFrom(section.key) : go(active + 1))}
          disabled={active === unit.sections.length - 1}
          className="rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-4 py-2 text-sm font-medium disabled:opacity-30"
        >
          {t('continue')} →
        </button>
      </nav>
    </main>
  )
}
