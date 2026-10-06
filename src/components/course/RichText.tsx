import { Fragment } from 'react'
import type { Gender } from '@/course/types'

/** Article colours used across the course: der blue, die red, das green. */
export const GENDER_TEXT: Record<Gender, string> = {
  m: 'text-blue-700 dark:text-blue-400',
  f: 'text-rose-700 dark:text-rose-400',
  n: 'text-emerald-700 dark:text-emerald-400',
}

export const GENDER_CHIP: Record<Gender, string> = {
  m: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900',
  f: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
  n: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
}

export const ARTICLE_OF: Record<Gender, string> = { m: 'der', f: 'die', n: 'das' }

const TOKEN = /\{([mfn]):([^}]+)\}|\*\*([^*]+)\*\*/g

/** Text without markup, e.g. for speech synthesis. */
export function plainText(text: string): string {
  return text.replace(TOKEN, (_m, _g, gendered, bold) => gendered ?? bold ?? '')
}

/**
 * Renders course markup: `{m:der Hund}` coloured by gender, `**ist**`
 * highlighted. Plain strings render unchanged.
 */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(TOKEN)) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[1]) {
      parts.push(
        <strong key={match.index} className={`font-semibold ${GENDER_TEXT[match[1] as Gender]}`}>
          {match[2]}
        </strong>
      )
    } else {
      parts.push(
        <mark key={match.index} className="bg-amber-100 dark:bg-amber-900/60 text-inherit rounded px-0.5">
          {match[3]}
        </mark>
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>
}
