import { describe, it, expect } from 'vitest'
import { A1_OUTLINE } from '@/course/a1/curriculum'
import { getUnits, trackableSections } from '@/course/registry'
import { checkExercise } from '@/course/check'
import { analyseWriting } from '@/course/writing'
import type { Exercise } from '@/course/types'

/** The answer an exercise expects, in the shape the UI submits. */
function correctAnswer(exercise: Exercise): unknown {
  switch (exercise.type) {
    case 'multiple_choice':
    case 'listening_choice':
    case 'dialogue':
    case 'image_choice':
    case 'true_false':
      return exercise.answer
    case 'multiple_select':
      return exercise.answers
    case 'fill_blank':
    case 'error_correction':
    case 'translation':
      return exercise.accepted[0]
    case 'matching':
      return exercise.pairs.map((_, i) => i)
    case 'categorize':
      return exercise.items.map((item) => item.category)
    case 'sentence_builder':
      return exercise.answers[0].map((word) => exercise.chips.indexOf(word))
    case 'ordering':
      return exercise.answer.map((item) => exercise.items.indexOf(item))
  }
}

describe('A1 curriculum outline', () => {
  it('has 25 units with unique slugs in order', () => {
    expect(A1_OUTLINE).toHaveLength(25)
    expect(new Set(A1_OUTLINE.map((u) => u.slug)).size).toBe(25)
    expect(A1_OUTLINE.map((u) => u.number)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
  })

  it('lists every built unit in the outline under the same number', () => {
    for (const unit of getUnits('A1')) {
      expect(A1_OUTLINE.find((o) => o.slug === unit.slug)?.number).toBe(unit.number)
    }
  })
})

describe.each(getUnits('A1').map((unit) => [unit.slug, unit] as const))('course unit %s', (_slug, unit) => {
  const ids = unit.exercises.map((e) => e.id)
  const byId = new Map(unit.exercises.map((e) => [e.id, e]))

  it('has unique exercise ids', () => {
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only references existing exercises from sections and "try one more"', () => {
    for (const section of unit.sections) {
      const refs = 'exercises' in section ? section.exercises : 'pool' in section ? section.pool : []
      for (const ref of refs) expect(byId.has(ref), `${section.key} → ${ref}`).toBe(true)
    }
    for (const exercise of unit.exercises) {
      for (const ref of exercise.practice ?? []) expect(byId.has(ref), `${exercise.id} → ${ref}`).toBe(true)
    }
  })

  it('has unique section keys and ends with review and summary', () => {
    const keys = unit.sections.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(unit.sections.slice(-2).map((s) => s.kind)).toEqual(['review', 'summary'])
    expect(trackableSections(unit)).not.toContain('summary')
  })

  it('accepts its own correct answer for every exercise', () => {
    for (const exercise of unit.exercises) {
      expect(checkExercise(exercise, correctAnswer(exercise)).correct, exercise.id).toBe(true)
    }
  })

  it('has well-formed options', () => {
    for (const exercise of unit.exercises) {
      if ('options' in exercise) {
        const labels = exercise.options.map((o) => (typeof o === 'string' ? o : o.label))
        expect(new Set(labels).size, exercise.id).toBe(labels.length)
      }
      // Choice questions need real alternatives (two-way choices are deliberate: mein/meine, Singular/Plural, du/Sie).
      if (exercise.type === 'multiple_choice' || exercise.type === 'listening_choice' || exercise.type === 'dialogue') {
        expect(exercise.options.length, exercise.id).toBeGreaterThanOrEqual(2)
        if (exercise.id.startsWith('pl-')) expect(exercise.options.length, exercise.id).toBe(3)
      }
      if (exercise.type === 'sentence_builder') {
        for (const answer of exercise.answers) {
          expect([...answer].sort(), exercise.id).toEqual([...exercise.chips].sort())
        }
      }
      if (exercise.type === 'fill_blank') {
        expect(exercise.sentence.split('___'), exercise.id).toHaveLength(2)
      }
    }
  })

  it('provides content volume for a full lesson', () => {
    const practice = unit.sections
      .filter((s) => s.kind === 'practice')
      .flatMap((s) => ('exercises' in s ? s.exercises : []))
    expect(practice.length).toBeGreaterThanOrEqual(15)
    expect(unit.vocabulary.every((v) => !v.gender || v.word[0] === v.word[0].toUpperCase())).toBe(true)
    expect(new Set(unit.exercises.map((e) => e.type)).size).toBeGreaterThanOrEqual(10)
    for (const kind of ['discover', 'understand', 'context', 'reading', 'listening', 'speaking', 'writing']) {
      expect(unit.sections.some((s) => s.kind === kind), kind).toBe(true)
    }
  })

  it('compiles every writing check, and the model answer passes all of them', () => {
    for (const section of unit.sections) {
      if (section.kind !== 'writing') continue
      for (const check of section.checks) expect(() => new RegExp(check.pattern, 'u')).not.toThrow()
      const feedback = analyseWriting(section.model.join(' '), {
        minSentences: section.minSentences,
        checks: section.checks,
        vocabulary: unit.vocabulary,
      })
      expect(feedback.checks.filter((c) => !c.passed).map((c) => c.label.en)).toEqual([])
      expect(feedback.enoughSentences).toBe(true)
      expect(feedback.issues).toEqual([])
    }
  })

  it('uses only known topics and every topic has exercises', () => {
    const known = new Set([...unit.topics.map((t) => t.key), 'reading'])
    for (const exercise of unit.exercises) expect(known.has(exercise.topic), `${exercise.id}: ${exercise.topic}`).toBe(true)
    for (const topic of unit.topics) expect(unit.exercises.some((e) => e.topic === topic.key), topic.key).toBe(true)
  })
})
