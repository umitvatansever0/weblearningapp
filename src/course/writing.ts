import type { Gender, VocabItem, WritingCheck } from './types'

/**
 * Rule-based feedback for short A1–A2 writing tasks. Deliberately honest: it only
 * reports what it can check reliably (sentence count, required structures,
 * article/gender of the unit's known nouns, noun capitalisation) and never
 * pretends to grade free text like a teacher.
 */

/** Articles that can stand before a singular noun of each gender (any case). */
const ALLOWED: Record<Gender, string[]> = {
  m: ['der', 'den', 'dem', 'des', 'ein', 'einen', 'einem', 'eines', 'kein', 'keinen', 'keinem', 'keines'],
  f: ['die', 'der', 'eine', 'einer', 'keine', 'keiner'],
  n: ['das', 'dem', 'des', 'ein', 'einem', 'eines', 'kein', 'keinem', 'keines'],
}

const ARTICLE = /\b(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|kein|keine|keinen|keinem|keiner|keines)\s+(\p{L}+)/giu

export type WritingIssue =
  | { kind: 'gender'; found: string; noun: string; correct: string }
  | { kind: 'capital'; found: string; noun: string }

export interface WritingFeedback {
  sentences: number
  enoughSentences: boolean
  checks: { label: WritingCheck['label']; passed: boolean }[]
  issues: WritingIssue[]
  /** 0–100: share of requirements met, minus known mistakes. */
  score: number
}

const BASE: Record<Gender, string> = { m: 'der', f: 'die', n: 'das' }
const INDEFINITE: Record<Gender, string> = { m: 'ein', f: 'eine', n: 'ein' }

/** The right article of the same kind the learner used: der/die/das, ein/eine or kein/keine. */
function correctArticle(used: string, gender: Gender): string {
  const lower = used.toLowerCase()
  const base = lower.startsWith('kein')
    ? `k${INDEFINITE[gender]}`
    : lower.startsWith('ein')
      ? INDEFINITE[gender]
      : BASE[gender]
  return used[0] === used[0].toUpperCase() ? base[0].toUpperCase() + base.slice(1) : base
}

export function countSentences(text: string): number {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 2).length
}

export function analyseWriting(
  text: string,
  options: { minSentences: number; checks: WritingCheck[]; vocabulary: VocabItem[] }
): WritingFeedback {
  const nouns = new Map(
    options.vocabulary.filter((v) => v.gender).map((v) => [v.word.toLowerCase(), v])
  )
  const plurals = new Set(
    options.vocabulary.map((v) => v.plural?.replace(/^die\s+/, '').toLowerCase()).filter(Boolean)
  )

  const issues: WritingIssue[] = []
  for (const match of text.matchAll(ARTICLE)) {
    const [found, article, word] = match
    const vocab = nouns.get(word.toLowerCase())
    if (!vocab?.gender) continue
    if (word[0] !== word[0].toUpperCase()) {
      issues.push({ kind: 'capital', found, noun: vocab.word })
      continue
    }
    const lower = article.toLowerCase()
    const isPlural = lower === 'die' && plurals.has(word.toLowerCase())
    if (!isPlural && !ALLOWED[vocab.gender].includes(lower)) {
      issues.push({ kind: 'gender', found, noun: vocab.word, correct: `${correctArticle(article, vocab.gender)} ${vocab.word}` })
    }
  }

  const sentences = countSentences(text)
  const checks = options.checks.map((check) => ({
    label: check.label,
    passed: new RegExp(check.pattern, 'u').test(text),
  }))
  const requirements = checks.length + 1
  const met = checks.filter((c) => c.passed).length + (sentences >= options.minSentences ? 1 : 0)
  const score = Math.max(0, Math.round((met / requirements) * 100) - issues.length * 10)

  return { sentences, enoughSentences: sentences >= options.minSentences, checks, issues, score }
}
