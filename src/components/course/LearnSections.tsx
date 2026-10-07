'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { DialogueLine, RuleBlock, VocabItem, WorkedExample } from '@/course/types'
import { pick } from '@/course/check'
import { ARTICLE_OF, GENDER_CHIP, GENDER_TEXT, RichText, plainText } from './RichText'
import { useSpeech } from './speech'

export function VocabLabel({ item }: { item: VocabItem }) {
  if (!item.gender) return <span>{item.word}</span>
  return (
    <span>
      <span className={`font-semibold ${GENDER_TEXT[item.gender]}`}>{ARTICLE_OF[item.gender]}</span> {item.word}
    </span>
  )
}

/** Visual vocabulary cards; selecting one opens article, plural, meaning and audio. */
export function DiscoverSection({ cards, locale }: { cards: VocabItem[]; locale: string }) {
  const t = useTranslations('course')
  const { supported, speak } = useSpeech()
  const [open, setOpen] = useState<number | null>(null)
  const [seen, setSeen] = useState<Set<number>>(new Set())
  const item = open !== null ? cards[open] : null

  function select(i: number) {
    setOpen(i)
    setSeen((prev) => new Set(prev).add(i))
    const card = cards[i]
    if (supported) speak(card.gender ? `${ARTICLE_OF[card.gender]} ${card.word}` : card.word)
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <li key={card.word}>
            <button
              type="button"
              onClick={() => select(i)}
              aria-pressed={open === i}
              className={`w-full rounded-2xl border p-4 flex flex-col items-center gap-2 transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
                open === i
                  ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-neutral-800'
                  : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
              }`}
            >
              <span className="text-4xl" aria-hidden="true">
                {card.emoji}
              </span>
              <span className="text-base" lang="de">
                <VocabLabel item={card} />
              </span>
              {seen.has(i) && <span className="text-xs text-gray-400">✓ {t('explored')}</span>}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('exploredCount', { seen: seen.size, total: cards.length })}</p>

      {item && (
        <div
          aria-live="polite"
          className={`rounded-2xl border p-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 items-center ${item.gender ? GENDER_CHIP[item.gender] : ''}`}
        >
          <span className="text-6xl row-span-4" aria-hidden="true">
            {item.emoji}
          </span>
          <p className="text-2xl font-semibold" lang="de">
            <VocabLabel item={item} />
          </p>
          {item.plural && (
            <p className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('plural')}:</span> <span lang="de">{item.plural}</span>
            </p>
          )}
          <p className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t('meaning')}:</span> {pick(item.translation, locale === 'de' ? 'en' : locale)}
          </p>
          {item.example && (
            <p className="text-sm flex items-center gap-2" lang="de">
              <span className="italic">{item.example}</span>
              {supported && (
                <button type="button" onClick={() => speak(item.example!)} aria-label={t('listen')}>
                  🔊
                </button>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ExampleList({ examples, locale }: { examples: WorkedExample[]; locale: string }) {
  const t = useTranslations('course')
  const { supported, speak } = useSpeech()
  return (
    <ul className="flex flex-col divide-y divide-gray-100 dark:divide-neutral-800">
      {examples.map((example, i) => (
        <li key={i} className="py-2.5 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-lg" lang="de">
              <RichText text={example.de} />
            </p>
            {pick(example.translation, locale) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{pick(example.translation, locale)}</p>
            )}
          </div>
          {supported && (
            <button type="button" onClick={() => speak(plainText(example.de))} aria-label={t('listen')} className="mt-1">
              🔊
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Rules as compact cards: short statement, small table, examples, one tip. */
export function UnderstandSection({ rules, locale }: { rules: RuleBlock[]; locale: string }) {
  const t = useTranslations('course')
  return (
    <div className="flex flex-col gap-4">
      {rules.map((rule, i) => (
        <article key={i} className="rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 sm:p-6 flex flex-col gap-4">
          <header className="flex items-baseline gap-3">
            <span className="text-xs font-bold text-gray-400">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="text-lg font-semibold">{pick(rule.title, locale)}</h3>
          </header>
          <p className="leading-relaxed text-gray-700 dark:text-gray-300">{pick(rule.body, locale)}</p>
          {rule.table && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    {rule.table.head.map((h, c) => (
                      <th key={c} className="text-xs uppercase tracking-wider text-gray-500 font-semibold pb-2 pr-4">
                        {pick(h, locale)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody lang="de">
                  {rule.table.rows.map((row, r) => (
                    <tr key={r} className="border-t border-gray-100 dark:border-neutral-800">
                      {row.map((cell, c) => {
                        const gender = (['m', 'f', 'n'] as const).find((g) => cell.startsWith(`${ARTICLE_OF[g]} `) || cell === ARTICLE_OF[g])
                        const indefinite = rule.table!.rows.length === 1 ? (['m', 'f', 'n'] as const)[c] : undefined
                        const color = gender ?? indefinite
                        return (
                          <td key={c} className={`py-2 pr-4 text-lg ${color ? `font-semibold ${GENDER_TEXT[color]}` : ''}`}>
                            {cell}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rule.examples && <ExampleList examples={rule.examples} locale={locale} />}
          {rule.tip && (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 px-4 py-3 text-sm">
              <span className="font-semibold">{t('tip')}:</span> {pick(rule.tip, locale)}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}

/** A short dialogue with highlighted article groups, then worked examples. */
export function ContextSection({
  scene,
  dialogue,
  examples,
  locale,
}: {
  scene: string
  dialogue: DialogueLine[]
  examples: WorkedExample[]
  locale: string
}) {
  const t = useTranslations('course')
  const { supported, speak } = useSpeech()
  const [showTranslation, setShowTranslation] = useState(false)
  const speakers = [...new Set(dialogue.map((l) => l.speaker))]

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">🎬 {scene}</p>
          <div className="flex gap-2">
            {supported && (
              <button
                type="button"
                onClick={() => speak(dialogue.map((l) => plainText(l.de)).join(' '))}
                className="rounded-full border border-gray-300 dark:border-neutral-600 px-3 py-1 text-sm"
              >
                ▶ {t('playDialogue')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowTranslation((v) => !v)}
              aria-pressed={showTranslation}
              className="rounded-full border border-gray-300 dark:border-neutral-600 px-3 py-1 text-sm"
            >
              {showTranslation ? t('hideTranslation') : t('showTranslation')}
            </button>
          </div>
        </div>
        <ol className="flex flex-col gap-3">
          {dialogue.map((line, i) => {
            const right = speakers.indexOf(line.speaker) % 2 === 1
            return (
              <li key={i} className={`flex gap-2 items-end ${right ? 'flex-row-reverse' : ''}`}>
                <span className="text-xs font-semibold text-gray-500 w-10 shrink-0 text-center">{line.speaker}</span>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    right ? 'rounded-br-sm bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'rounded-bl-sm bg-gray-100 dark:bg-neutral-800'
                  }`}
                >
                  <p className="text-lg" lang="de">
                    <RichText text={line.de} />
                  </p>
                  {showTranslation && pick(line.translation, locale) && (
                    <p className={`text-sm ${right ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500'}`}>{pick(line.translation, locale)}</p>
                  )}
                </div>
                {supported && (
                  <button type="button" onClick={() => speak(plainText(line.de))} aria-label={t('listen')} className="text-sm">
                    🔊
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('workedExamples')}</h3>
        <ExampleList examples={examples} locale={locale} />
      </div>
    </div>
  )
}
