'use client'

import { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Exercise } from '@/course/types'
import { pick } from '@/course/check'
import { useSpeech } from './speech'

/** Deterministic shuffle (same order on server and client) seeded by a string. */
export function seededOrder(length: number, seed: string): number[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const order = Array.from({ length }, (_, i) => i)
  for (let i = length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  // Never present a matching/ordering task already solved.
  if (length > 1 && order.every((v, i) => v === i)) order.push(order.shift()!)
  return order
}

export type InputValue = unknown

export function isReady(exercise: Exercise, value: InputValue): boolean {
  switch (exercise.type) {
    case 'multiple_choice':
    case 'listening_choice':
    case 'dialogue':
    case 'image_choice':
      return typeof value === 'number'
    case 'true_false':
      return typeof value === 'boolean'
    case 'multiple_select':
      return Array.isArray(value) && value.length > 0
    case 'fill_blank':
    case 'error_correction':
    case 'translation':
      return typeof value === 'string' && value.trim().length > 0
    case 'matching':
      return Array.isArray(value) && value.length === exercise.pairs.length && value.every((v) => typeof v === 'number')
    case 'categorize':
      return Array.isArray(value) && value.length === exercise.items.length && value.every((v) => typeof v === 'number')
    case 'sentence_builder':
      return Array.isArray(value) && value.length === exercise.chips.length
  }
}

interface InputProps<E extends Exercise> {
  exercise: E
  value: InputValue
  onChange: (value: InputValue) => void
  locked: boolean
  /** After checking: which parts were right, for colouring. */
  correct?: boolean
  locale: string
  onSubmit?: () => void
}

const optionBase =
  'w-full text-left rounded-xl border px-4 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-100 disabled:cursor-default'
const optionIdle = 'border-gray-200 hover:border-gray-400 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-500'
const optionSelected = 'border-gray-900 bg-gray-50 ring-1 ring-gray-900 dark:border-gray-100 dark:bg-neutral-800 dark:ring-gray-100'
const optionRight = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600'
const optionWrong = 'border-rose-400 bg-rose-50 dark:bg-rose-950 dark:border-rose-700'

function optionClass(index: number, selected: boolean, locked: boolean, answer?: number | number[]) {
  if (locked && answer !== undefined) {
    const isRight = Array.isArray(answer) ? answer.includes(index) : answer === index
    if (isRight) return optionRight
    if (selected) return optionWrong
    return `${optionIdle} opacity-60`
  }
  return selected ? optionSelected : optionIdle
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function ChoiceList({
  options,
  value,
  onChange,
  locked,
  answer,
  render,
  columns,
}: {
  options: string[]
  value: InputValue
  onChange: (v: number) => void
  locked: boolean
  answer: number
  render?: (option: string, index: number) => React.ReactNode
  columns?: boolean
}) {
  return (
    <div role="radiogroup" className={columns ? 'grid grid-cols-2 sm:grid-cols-4 gap-3' : 'flex flex-col gap-2'}>
      {options.map((option, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          disabled={locked}
          onClick={() => onChange(i)}
          className={`${optionBase} ${optionClass(i, value === i, locked, answer)}`}
        >
          {render ? (
            render(option, i)
          ) : (
            <span className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-400 w-4">{LETTERS[i]}</span>
              <span>{option}</span>
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

const UMLAUTS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü']

function TextAnswer({
  value,
  onChange,
  locked,
  onSubmit,
  placeholder,
  multiline,
}: {
  value: InputValue
  onChange: (v: string) => void
  locked: boolean
  onSubmit?: () => void
  placeholder: string
  multiline?: boolean
}) {
  const t = useTranslations('course')
  const ref = useRef<HTMLInputElement>(null)
  const text = typeof value === 'string' ? value : ''

  function insert(char: string) {
    const el = ref.current
    if (!el) return onChange(text + char)
    const start = el.selectionStart ?? text.length
    const end = el.selectionEnd ?? text.length
    onChange(text.slice(0, start) + char + text.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + 1, start + 1)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={ref}
        type="text"
        value={text}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit) {
            e.preventDefault()
            onSubmit()
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        lang="de"
        className={`w-full rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 ${multiline ? '' : ''}`}
      />
      {!locked && (
        <div className="flex gap-1.5" aria-label={t('specialCharacters')}>
          {UMLAUTS.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => insert(char)}
              className="min-w-9 h-9 rounded-lg border border-gray-200 dark:border-neutral-700 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              {char}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MatchingInput({ exercise, value, onChange, locked, locale }: InputProps<Extract<Exercise, { type: 'matching' }>>) {
  const t = useTranslations('course')
  const rightOrder = useMemo(() => seededOrder(exercise.pairs.length, exercise.id), [exercise])
  const chosen: (number | undefined)[] = Array.isArray(value) ? (value as (number | undefined)[]) : []
  const [activeLeft, setActiveLeft] = useState<number | null>(null)
  const label = (i: number) => {
    const r = exercise.pairs[i].right
    return typeof r === 'string' ? r : pick(r, locale)
  }

  function choose(rightIndex: number) {
    if (locked || activeLeft === null) return
    const next = exercise.pairs.map((_, i) => (chosen[i] === rightIndex ? undefined : chosen[i]))
    next[activeLeft] = rightIndex
    onChange(next)
    const nextEmpty = exercise.pairs.findIndex((_, i) => next[i] === undefined)
    setActiveLeft(nextEmpty === -1 ? null : nextEmpty)
  }

  const usedBy = (rightIndex: number) => chosen.findIndex((c) => c === rightIndex)

  return (
    <div className="grid grid-cols-2 gap-3">
      <p className="col-span-2 text-sm text-gray-500 dark:text-gray-400">{t('matchingHelp')}</p>
      <div className="flex flex-col gap-2">
        {exercise.pairs.map((pair, i) => {
          const done = chosen[i] !== undefined
          const right = locked ? chosen[i] === i : undefined
          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              aria-pressed={activeLeft === i}
              onClick={() => setActiveLeft(i)}
              className={`${optionBase} ${
                locked ? (right ? optionRight : optionWrong) : activeLeft === i ? optionSelected : optionIdle
              }`}
            >
              <span className="font-medium">{pair.left}</span>
              {done && (
                <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">→ {label(chosen[i]!)}</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-2">
        {rightOrder.map((r) => {
          const owner = usedBy(r)
          return (
            <button
              key={r}
              type="button"
              disabled={locked || activeLeft === null}
              onClick={() => choose(r)}
              className={`${optionBase} ${owner >= 0 ? 'border-gray-300 bg-gray-50 text-gray-500 dark:bg-neutral-800 dark:border-neutral-700' : optionIdle} ${
                /\p{Extended_Pictographic}/u.test(label(r)) ? 'text-2xl text-center' : ''
              }`}
            >
              {label(r)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const CATEGORY_STYLE: Record<string, string> = {
  der: 'border-blue-300 bg-blue-50/60 dark:bg-blue-950/40 dark:border-blue-900',
  die: 'border-rose-300 bg-rose-50/60 dark:bg-rose-950/40 dark:border-rose-900',
  das: 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 dark:border-emerald-900',
}

function CategorizeInput({ exercise, value, onChange, locked }: InputProps<Extract<Exercise, { type: 'categorize' }>>) {
  const t = useTranslations('course')
  const placed: (number | undefined)[] = Array.isArray(value) ? (value as (number | undefined)[]) : []
  const [held, setHeld] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const order = useMemo(() => seededOrder(exercise.items.length, exercise.id), [exercise])

  function place(item: number, category: number | undefined) {
    if (locked) return
    const next = exercise.items.map((_, i) => placed[i])
    next[item] = category
    onChange(next)
    setHeld(null)
  }

  const card = (i: number) => {
    const status = locked ? (placed[i] === exercise.items[i].category ? 'right' : 'wrong') : null
    return (
      <button
        key={i}
        type="button"
        draggable={!locked}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', String(i))
          setHeld(i)
        }}
        onClick={() => {
          if (locked) return
          if (placed[i] !== undefined) place(i, undefined)
          else setHeld(held === i ? null : i)
        }}
        aria-pressed={held === i}
        className={`rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition ${
          status === 'right'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
            : status === 'wrong'
              ? 'border-rose-400 bg-rose-50 line-through dark:bg-rose-950'
              : held === i
                ? 'border-gray-900 ring-2 ring-gray-900 bg-white dark:bg-neutral-800 dark:ring-gray-100'
                : 'border-gray-300 bg-white hover:border-gray-500 dark:bg-neutral-900 dark:border-neutral-600'
        } ${locked ? '' : 'cursor-grab active:cursor-grabbing'}`}
      >
        {exercise.items[i].text}
      </button>
    )
  }

  const unplaced = order.filter((i) => placed[i] === undefined)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('categorizeHelp')}</p>
      <div className="flex flex-wrap gap-2 min-h-11 rounded-xl border border-dashed border-gray-300 dark:border-neutral-700 p-2">
        {unplaced.length === 0 ? <span className="text-sm text-gray-400 px-1 py-1.5">{t('allPlaced')}</span> : unplaced.map(card)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {exercise.categories.map((category, c) => (
          <div
            key={c}
            role="button"
            tabIndex={locked ? -1 : 0}
            aria-label={t('placeIn', { category })}
            onClick={() => held !== null && place(held, c)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && held !== null) {
                e.preventDefault()
                place(held, c)
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(c)
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(null)
              place(Number(e.dataTransfer.getData('text/plain')), c)
            }}
            className={`rounded-xl border-2 p-3 min-h-28 flex flex-col gap-2 transition ${CATEGORY_STYLE[category] ?? 'border-gray-200'} ${
              over === c || (held !== null && !locked) ? 'border-solid' : 'border-dashed'
            } ${over === c ? 'scale-[1.02]' : ''}`}
          >
            <span className="font-bold tracking-wide uppercase text-sm">{category}</span>
            <div className="flex flex-wrap gap-2">{order.filter((i) => placed[i] === c).map(card)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SentenceBuilderInput({
  exercise,
  value,
  onChange,
  locked,
  correct,
}: InputProps<Extract<Exercise, { type: 'sentence_builder' }>>) {
  const t = useTranslations('course')
  const built: number[] = Array.isArray(value) ? (value as number[]) : []
  const [dragFrom, setDragFrom] = useState<number | null>(null)

  function move(from: number, to: number) {
    const next = [...built]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        aria-label={t('yourSentence')}
        className={`min-h-16 rounded-xl border-2 px-3 py-3 flex flex-wrap items-center gap-2 ${
          locked
            ? correct
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
              : 'border-rose-400 bg-rose-50 dark:bg-rose-950'
            : 'border-dashed border-gray-300 dark:border-neutral-700'
        }`}
      >
        {built.length === 0 && <span className="text-sm text-gray-400">{t('builderEmpty')}</span>}
        {built.map((chip, position) => (
          <button
            key={`${chip}-${position}`}
            type="button"
            disabled={locked}
            draggable={!locked}
            onDragStart={() => setDragFrom(position)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom !== null && dragFrom !== position) move(dragFrom, position)
              setDragFrom(null)
            }}
            onClick={() => onChange(built.filter((_, i) => i !== position))}
            className="relative rounded-lg border border-gray-900 dark:border-gray-100 bg-white dark:bg-neutral-900 px-3 py-1.5 font-medium"
            aria-label={t('removeWord', { word: exercise.chips[chip] })}
          >
            <span className="absolute -top-2 -left-1.5 text-[10px] leading-none rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-1 py-0.5">
              {position + 1}
            </span>
            {exercise.chips[chip]}
          </button>
        ))}
        {built.length > 0 && <span className="font-medium">.</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {exercise.chips.map((chip, i) =>
          built.includes(i) ? (
            <span key={i} className="rounded-lg border border-dashed border-gray-200 dark:border-neutral-800 px-3 py-1.5 text-transparent select-none">
              {chip}
            </span>
          ) : (
            <button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => onChange([...built, i])}
              className="rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-1.5 font-medium shadow-sm hover:border-gray-900 dark:hover:border-gray-100"
            >
              {chip}
            </button>
          )
        )}
      </div>
    </div>
  )
}

function ListeningPlayer({ text }: { text: string }) {
  const t = useTranslations('course')
  const { supported, speak } = useSpeech()
  const [played, setPlayed] = useState(false)
  if (!supported) {
    return <p className="rounded-xl bg-gray-50 dark:bg-neutral-800 p-3 text-sm">{t('noAudio')} „{text}“</p>
  }
  const button = 'rounded-full border border-gray-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800'
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => {
          speak(text)
          setPlayed(true)
        }}
        className="rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-5 py-2 text-sm font-medium"
      >
        {played ? `🔁 ${t('replay')}` : `▶ ${t('play')}`}
      </button>
      <button type="button" onClick={() => speak(text, true)} className={button}>
        🐢 {t('slow')}
      </button>
    </div>
  )
}

export function ExerciseInput(props: InputProps<Exercise>) {
  const t = useTranslations('course')
  const { exercise, value, onChange, locked, onSubmit } = props
  switch (exercise.type) {
    case 'multiple_choice':
    case 'dialogue':
      return <ChoiceList options={exercise.options} value={value} onChange={onChange} locked={locked} answer={exercise.answer} />
    case 'listening_choice':
      return (
        <div className="flex flex-col gap-4">
          <ListeningPlayer text={exercise.audio} />
          <ChoiceList options={exercise.options} value={value} onChange={onChange} locked={locked} answer={exercise.answer} />
        </div>
      )
    case 'image_choice':
      return (
        <ChoiceList
          columns
          options={exercise.options.map((o) => o.label)}
          value={value}
          onChange={onChange}
          locked={locked}
          answer={exercise.answer}
          render={(_label, i) => (
            <span className="flex flex-col items-center gap-1 py-2">
              <span className="text-5xl" aria-hidden="true">
                {exercise.options[i].emoji}
              </span>
              {locked && <span className="text-sm">{exercise.options[i].label}</span>}
              {!locked && <span className="sr-only">{t('pictureOption', { n: i + 1 })}</span>}
            </span>
          )}
        />
      )
    case 'multiple_select': {
      const selected: number[] = Array.isArray(value) ? (value as number[]) : []
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('selectAll')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {exercise.options.map((option, i) => {
              const isSelected = selected.includes(i)
              return (
                <button
                  key={i}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  disabled={locked}
                  onClick={() => onChange(isSelected ? selected.filter((s) => s !== i) : [...selected, i])}
                  className={`${optionBase} ${optionClass(i, isSelected, locked, exercise.answers)}`}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{isSelected ? '☑' : '☐'}</span>
                    {option}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )
    }
    case 'true_false':
      return (
        <ChoiceList
          columns
          options={[t('true'), t('false')]}
          value={value === true ? 0 : value === false ? 1 : undefined}
          onChange={(i) => onChange(i === 0)}
          locked={locked}
          answer={exercise.answer ? 0 : 1}
          render={(label, i) => (
            <span className="flex items-center justify-center gap-2 font-medium">
              <span aria-hidden="true">{i === 0 ? '✓' : '✗'}</span>
              {label}
            </span>
          )}
        />
      )
    case 'fill_blank':
      return <TextAnswer value={value} onChange={onChange} locked={locked} onSubmit={onSubmit} placeholder={t('typeAnswer')} />
    case 'error_correction':
    case 'translation':
      return <TextAnswer value={value} onChange={onChange} locked={locked} onSubmit={onSubmit} placeholder={t('typeSentence')} multiline />
    case 'matching':
      return <MatchingInput {...props} exercise={exercise} />
    case 'categorize':
      return <CategorizeInput {...props} exercise={exercise} />
    case 'sentence_builder':
      return <SentenceBuilderInput {...props} exercise={exercise} />
  }
}
