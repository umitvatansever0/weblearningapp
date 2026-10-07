import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))

import { checkExercise, normalizeSentence } from '@/course/check'
import { analyseWriting, countSentences } from '@/course/writing'
import { nextMastery, scheduleReview, FINAL_STAGE } from '@/course/progress'
import { pickVariation } from '@/course/review'
import { allExercises, findExercise, getUnit } from '@/course/registry'
import type { Exercise } from '@/course/types'
import { numberToGerman } from '@/course/a1/unit03-zahlen-zeit'
import { conjugate } from '@/course/a1/unit07-alltag-verben'
import { regularParticiple } from '@/course/a1/unit24-perfekt'

const unit = getUnit('A1', 'articles')!
const byId = (id: string) => unit.exercises.find((e) => e.id === id) as Exercise

describe('checkExercise', () => {
  it('accepts typed answers regardless of final punctuation, spacing and umlaut spelling', () => {
    const fix = byId('fix-tisch')
    expect(checkExercise(fix, '  der tisch ist gross ').correct).toBe(true)
    expect(checkExercise(fix, 'Der Tisch ist groß').caseHint).toBe(false)
    expect(checkExercise(fix, 'der tisch ist groß.').caseHint).toBe(true)
    expect(checkExercise(fix, 'Das Tisch ist groß.').correct).toBe(false)
  })

  it('reports the readable given and expected answers', () => {
    const result = checkExercise(byId('mc-hund'), 2)
    expect(result).toMatchObject({ correct: false, given: 'Das Hund ist klein.', expected: 'Der Hund ist klein.' })
    expect(checkExercise(byId('fill-tasche'), 'Das').given).toBe('Das Tasche ist neu.')
  })

  it('checks matching, categorising and sentence building', () => {
    const match = byId('match-pictures') as Extract<Exercise, { type: 'matching' }>
    expect(checkExercise(match, [0, 1, 2, 3]).correct).toBe(true)
    expect(checkExercise(match, [1, 0, 2, 3]).correct).toBe(false)

    const sort = byId('sort-articles') as Extract<Exercise, { type: 'categorize' }>
    const right = sort.items.map((i) => i.category)
    expect(checkExercise(sort, right).correct).toBe(true)
    expect(checkExercise(sort, right.map(() => 2)).correct).toBe(false)

    const build = byId('build-hund') as Extract<Exercise, { type: 'sentence_builder' }>
    const order = ['Der Hund', 'ist', 'klein'].map((w) => build.chips.indexOf(w))
    expect(checkExercise(build, order).correct).toBe(true)
    expect(checkExercise(build, [...order].reverse()).correct).toBe(false)
  })

  it('treats multiple select as a set', () => {
    const select = byId('select-feminine')
    expect(checkExercise(select, [4, 0, 2]).correct).toBe(true)
    expect(checkExercise(select, [0, 2]).correct).toBe(false)
  })

  it('normalises sentences', () => {
    expect(normalizeSentence('Ich  habe kein Auto!')).toBe(normalizeSentence('ich habe kein auto'))
  })
})

describe('analyseWriting', () => {
  const options = {
    minSentences: 3,
    checks: [{ label: { en: 'ein/eine', tr: '', de: '' }, pattern: '\\b[Ee]ine?\\s+\\p{Lu}' }],
    vocabulary: unit.vocabulary,
  }

  it('finds wrong articles and lowercase nouns from the unit vocabulary', () => {
    const feedback = analyseWriting('Das Tisch ist groß. Das ist ein Lampe. Ich habe eine katze.', options)
    expect(feedback.issues).toEqual([
      { kind: 'gender', found: 'Das Tisch', noun: 'Tisch', correct: 'Der Tisch' },
      { kind: 'gender', found: 'ein Lampe', noun: 'Lampe', correct: 'eine Lampe' },
      { kind: 'capital', found: 'eine katze', noun: 'Katze' },
    ])
  })

  it('accepts other cases and plurals without false alarms', () => {
    const feedback = analyseWriting(
      'In der Tasche ist ein Handy. Ich habe einen Hund. Die Fenster sind offen. Das Buch ist neu.',
      options
    )
    expect(feedback.issues).toEqual([])
    expect(feedback.sentences).toBe(4)
    expect(feedback.score).toBe(100)
  })

  it('scores missing requirements', () => {
    const feedback = analyseWriting('Hallo.', options)
    expect(feedback.enoughSentences).toBe(false)
    expect(feedback.score).toBe(0)
    expect(countSentences('Das ist gut. Ja! Wirklich?')).toBe(1)
  })
})

describe('mastery and spaced repetition', () => {
  it('moves topic mastery towards recent answers', () => {
    expect(nextMastery(0, 0, true)).toBe(100)
    expect(nextMastery(100, 1, false)).toBe(75)
    expect(nextMastery(75, 2, true)).toBeCloseTo(81.25)
  })

  it('schedules reviews on day 1, 2, 5 and 10, and restarts after a lapse', () => {
    const day = 24 * 60 * 60 * 1000
    const now = new Date('2026-10-07T10:00:00Z')
    const first = scheduleReview(0, true, now)
    expect(first).toMatchObject({ stage: 1, resolved: false })
    expect(first.dueAt.getTime() - now.getTime()).toBe(3 * day)
    const second = scheduleReview(1, true, now)
    expect(second.dueAt.getTime() - now.getTime()).toBe(5 * day)
    expect(scheduleReview(FINAL_STAGE - 1, true, now).resolved).toBe(true)
    const lapse = scheduleReview(2, false, now)
    expect(lapse).toMatchObject({ stage: 0, resolved: false })
    expect(lapse.dueAt.getTime() - now.getTime()).toBe(day)
  })
})

describe('review variations', () => {
  it('picks a different exercise of the same concept, rotating per review', () => {
    const pool = allExercises('A1')
    const original = 'articles:mc-hund'
    const first = pickVariation(pool, original, 'gender-m', 0)
    const second = pickVariation(pool, original, 'gender-m', 1)
    expect(first?.key).not.toBe(original)
    expect(first?.exercise.concept).toBe('gender-m')
    expect(second?.key).not.toBe(first?.key)
  })

  it('resolves exercise keys', () => {
    expect(findExercise('articles:mc-hund')?.exercise.id).toBe('mc-hund')
    expect(findExercise('articles:nope')).toBeUndefined()
    expect(findExercise('nope')).toBeUndefined()
  })
})

describe('numberToGerman', () => {
  it('spells German numbers 0–100', () => {
    const cases: [number, string][] = [
      [0, 'null'], [1, 'eins'], [12, 'zwölf'], [16, 'sechzehn'], [17, 'siebzehn'], [20, 'zwanzig'],
      [21, 'einundzwanzig'], [30, 'dreißig'], [34, 'vierunddreißig'], [46, 'sechsundvierzig'],
      [67, 'siebenundsechzig'], [71, 'einundsiebzig'], [99, 'neunundneunzig'], [100, 'hundert'],
    ]
    for (const [n, word] of cases) expect(numberToGerman(n), String(n)).toBe(word)
    expect(() => numberToGerman(101)).toThrow()
  })
})

describe('conjugate', () => {
  it('conjugates regular verbs, adding -e- after -t/-d stems', () => {
    expect(['ich', 'du', 'er', 'wir', 'ihr', 'sie'].map((p) => conjugate('lernen', p as 'ich'))).toEqual([
      'lerne', 'lernst', 'lernt', 'lernen', 'lernt', 'lernen',
    ])
    expect(['ich', 'du', 'er', 'wir', 'ihr', 'sie'].map((p) => conjugate('arbeiten', p as 'ich'))).toEqual([
      'arbeite', 'arbeitest', 'arbeitet', 'arbeiten', 'arbeitet', 'arbeiten',
    ])
  })
})

describe('regularParticiple', () => {
  it('builds ge- … -t and ge- … -et after -t/-d stems', () => {
    expect(['machen', 'kaufen', 'lernen', 'arbeiten', 'hören'].map(regularParticiple)).toEqual([
      'gemacht', 'gekauft', 'gelernt', 'gearbeitet', 'gehört',
    ])
  })
})
