import type { CourseLocale, Exercise, L10n } from './types'

/**
 * Answer checking shared by the lesson UI (instant feedback) and the API
 * (which re-checks before saving progress, so stored mastery never depends on
 * what the browser claims).
 */

export type ExerciseAnswer = number | number[] | boolean | string

export interface CheckResult {
  correct: boolean
  /** The learner's answer, readable (e.g. "Das Tisch ist groß."). */
  given: string
  /** The correct answer, readable. */
  expected: string
  /** Right apart from upper/lower case – accepted, but worth a nudge. */
  caseHint?: boolean
}

export function pick(text: L10n, locale: string): string {
  return text[(locale as CourseLocale)] ?? text.en
}

/** Lowercase, unify umlaut spellings, collapse spaces, drop final punctuation. */
export function normalizeSentence(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[’']/g, "'")
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([,.!?])\s*/g, '$1 ')
    .trim()
    .replace(/[.!?]+$/, '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

function trimForCase(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '')
}

function matchTyped(input: string, accepted: string[]): { correct: boolean; caseHint: boolean } {
  const normalized = normalizeSentence(input)
  const match = accepted.find((a) => normalizeSentence(a) === normalized)
  if (!match) return { correct: false, caseHint: false }
  const exactCase = accepted.some((a) => trimForCase(a) === trimForCase(input))
  return { correct: true, caseHint: !exactCase && /[A-ZÄÖÜa-zäöüß]/.test(input) }
}

function sameSet(a: number[], b: number[]): boolean {
  return a.length === b.length && [...a].sort().every((value, i) => value === [...b].sort()[i])
}

function isIndexArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => Number.isInteger(v))
}

export function checkExercise(exercise: Exercise, answer: unknown, locale = 'en'): CheckResult {
  switch (exercise.type) {
    case 'multiple_choice': {
      // Gap sentences show the whole sentence: "✓ Der Hund ist klein."
      const fill = (option: string) => (exercise.prompt.includes('___') ? exercise.prompt.replace('___', option) : option)
      const option = typeof answer === 'number' ? exercise.options[answer] : undefined
      return {
        correct: answer === exercise.answer,
        given: option === undefined ? '' : fill(option),
        expected: fill(exercise.options[exercise.answer]),
      }
    }
    case 'listening_choice':
    case 'dialogue': {
      const given = typeof answer === 'number' ? exercise.options[answer] ?? '' : ''
      return { correct: answer === exercise.answer, given, expected: exercise.options[exercise.answer] }
    }
    case 'image_choice': {
      const option = typeof answer === 'number' ? exercise.options[answer] : undefined
      const right = exercise.options[exercise.answer]
      return {
        correct: answer === exercise.answer,
        given: option ? `${option.emoji} ${option.label}` : '',
        expected: `${right.emoji} ${right.label}`,
      }
    }
    case 'multiple_select': {
      const chosen = isIndexArray(answer) ? answer : []
      return {
        correct: sameSet(chosen, exercise.answers),
        given: chosen.map((i) => exercise.options[i]).join(', '),
        expected: exercise.answers.map((i) => exercise.options[i]).join(', '),
      }
    }
    case 'true_false':
      return {
        correct: answer === exercise.answer,
        given: answer === true ? 'richtig' : answer === false ? 'falsch' : '',
        expected: exercise.answer ? 'richtig' : 'falsch',
      }
    case 'fill_blank': {
      const text = typeof answer === 'string' ? answer : ''
      const { correct, caseHint } = matchTyped(text, exercise.accepted)
      return {
        correct,
        caseHint,
        given: exercise.sentence.replace('___', text.trim() || '…'),
        expected: exercise.sentence.replace('___', exercise.accepted[0]),
      }
    }
    case 'error_correction':
    case 'translation': {
      const text = typeof answer === 'string' ? answer : ''
      const { correct, caseHint } = matchTyped(text, exercise.accepted)
      return { correct, caseHint, given: text.trim(), expected: exercise.accepted[0] }
    }
    case 'matching': {
      // answer[i] = index of the right-hand item chosen for left item i.
      const chosen = isIndexArray(answer) ? answer : []
      const right = (i: number) => {
        const value = exercise.pairs[i]?.right
        return typeof value === 'string' ? value : value ? pick(value, locale) : '?'
      }
      return {
        correct: chosen.length === exercise.pairs.length && chosen.every((r, i) => r === i),
        given: exercise.pairs.map((p, i) => `${p.left} → ${chosen[i] === undefined ? '?' : right(chosen[i])}`).join(' · '),
        expected: exercise.pairs.map((p, i) => `${p.left} → ${right(i)}`).join(' · '),
      }
    }
    case 'categorize': {
      const chosen = isIndexArray(answer) ? answer : []
      const wrong = exercise.items.filter((item, i) => chosen[i] !== item.category)
      return {
        correct: chosen.length === exercise.items.length && wrong.length === 0,
        given: wrong.map((item) => `${item.text} ✗`).join(', '),
        expected: exercise.categories
          .map((cat, c) => `${cat}: ${exercise.items.filter((item) => item.category === c).map((item) => item.text).join(', ')}`)
          .join(' · '),
      }
    }
    case 'ordering': {
      const order = isIndexArray(answer) ? answer : []
      const given = order.map((i) => exercise.items[i] ?? '?')
      return {
        correct: given.length === exercise.answer.length && given.every((item, i) => item === exercise.answer[i]),
        given: given.join(' → '),
        expected: exercise.answer.join(' → '),
      }
    }
    case 'sentence_builder': {
      const order = isIndexArray(answer) ? answer : []
      const words = order.map((i) => exercise.chips[i] ?? '')
      const sentence = words.join(' ')
      const correct =
        order.length === exercise.chips.length &&
        exercise.answers.some((a) => normalizeSentence(a.join(' ')) === normalizeSentence(sentence))
      return { correct, given: sentence, expected: `${exercise.answers[0].join(' ')}${exercise.end ?? '.'}` }
    }
  }
}

/** Shape check for API input, before `checkExercise`. */
export function isValidAnswer(exercise: Exercise, answer: unknown): answer is ExerciseAnswer {
  switch (exercise.type) {
    case 'multiple_choice':
    case 'listening_choice':
    case 'dialogue':
    case 'image_choice':
      return Number.isInteger(answer) && (answer as number) >= 0 && (answer as number) < exercise.options.length
    case 'true_false':
      return typeof answer === 'boolean'
    case 'fill_blank':
    case 'error_correction':
    case 'translation':
      return typeof answer === 'string' && answer.length <= 300
    case 'multiple_select':
      return isIndexArray(answer) && answer.length <= exercise.options.length
    case 'matching':
      return isIndexArray(answer) && answer.length === exercise.pairs.length
    case 'categorize':
      return isIndexArray(answer) && answer.length === exercise.items.length
    case 'sentence_builder':
      return isIndexArray(answer) && answer.length <= exercise.chips.length
    case 'ordering':
      return isIndexArray(answer) && answer.length <= exercise.items.length
  }
}
