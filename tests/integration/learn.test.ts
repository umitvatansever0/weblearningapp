import { describe, it, expect } from 'vitest'
import { getLevels, getUnitsForLevel, getLessonWithExercises, pickByLocale } from '@/lib/learn'

describe('getLevels', () => {
  it('returns all six levels in order with unit counts', async () => {
    const levels = await getLevels()
    expect(levels.map((level) => level.code)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    const a1 = levels.find((level) => level.code === 'A1')
    expect(a1?.unitCount).toBe(12)
  })
})

describe('getUnitsForLevel', () => {
  it('returns the A1 unit with four lessons and no progress for a new user', async () => {
    const units = await getUnitsForLevel('A1', 'nonexistent-user-id')
    expect(units).toHaveLength(12)
    expect(units[0].lessons).toHaveLength(4)
    expect(units[0].lessons.every((lesson) => lesson.completed === false)).toBe(true)
  })
})

describe('getUnitsForLevel (B1)', () => {
  it('returns the B1 unit 1 with four lessons for a new user', async () => {
    const units = await getUnitsForLevel('B1', 'nonexistent-user-id')
    expect(units.length).toBeGreaterThanOrEqual(1)
    expect(units[0].lessons).toHaveLength(4)
  })
})

describe('getLessonWithExercises', () => {
  it('returns lesson exercises without leaking correctAnswer', async () => {
    const units = await getUnitsForLevel('A1', 'nonexistent-user-id')
    const firstLessonId = units[0].lessons[0].id
    const lesson = await getLessonWithExercises(firstLessonId)
    expect(lesson).not.toBeNull()
    expect(lesson!.exercises.length).toBeGreaterThan(0)
    for (const exercise of lesson!.exercises) {
      expect('correctAnswer' in exercise).toBe(false)
    }
  })

  it('returns null for an unknown lesson id', async () => {
    const lesson = await getLessonWithExercises('does-not-exist')
    expect(lesson).toBeNull()
  })

  it('does not leak the MATCHING answer key via the `data` payload', async () => {
    const units = await getUnitsForLevel('A1', 'nonexistent-user-id')
    // Seeded A1 lesson 2 ("Verb 'sein' im Präsens") contains a MATCHING exercise.
    const lessonWithMatching = units[0].lessons[1]
    const lesson = await getLessonWithExercises(lessonWithMatching.id)
    expect(lesson).not.toBeNull()

    const matchingExercise = lesson!.exercises.find((exercise) => exercise.type === 'MATCHING')
    expect(matchingExercise).toBeDefined()

    const data = matchingExercise!.data as Record<string, unknown>
    // Structural proof the old leak vector is gone: the client-visible `data`
    // must not carry a `pairs` key (which would encode the correct left→right
    // mapping). Instead it must be the shuffled `{ lefts, rights }` shape.
    expect('pairs' in data).toBe(false)
    expect(Array.isArray(data.lefts)).toBe(true)
    expect(Array.isArray(data.rights)).toBe(true)
    expect(JSON.stringify(data)).not.toContain('"pairs"')
  })
})

describe('pickByLocale', () => {
  it('returns the German field for locale "de"', () => {
    expect(pickByLocale('de', { de: 'Hallo', en: 'Hello', tr: 'Merhaba' })).toBe('Hallo')
  })

  it('returns the Turkish field for locale "tr"', () => {
    expect(pickByLocale('tr', { de: 'Hallo', en: 'Hello', tr: 'Merhaba' })).toBe('Merhaba')
  })

  it('falls back to English for any other locale', () => {
    expect(pickByLocale('en', { de: 'Hallo', en: 'Hello', tr: 'Merhaba' })).toBe('Hello')
    expect(pickByLocale('fr', { de: 'Hallo', en: 'Hello', tr: 'Merhaba' })).toBe('Hello')
  })
})
