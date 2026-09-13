import { describe, it, expect } from 'vitest'
import { getLevels, getUnitsForLevel, getLessonWithExercises, pickByLocale } from '@/lib/learn'

describe('getLevels', () => {
  it('returns all six levels in order with unit counts', async () => {
    const levels = await getLevels()
    expect(levels.map((level) => level.code)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    const a1 = levels.find((level) => level.code === 'A1')
    expect(a1?.unitCount).toBe(1)
  })
})

describe('getUnitsForLevel', () => {
  it('returns the A1 unit with three lessons and no progress for a new user', async () => {
    const units = await getUnitsForLevel('A1', 'nonexistent-user-id')
    expect(units).toHaveLength(1)
    expect(units[0].lessons).toHaveLength(3)
    expect(units[0].lessons.every((lesson) => lesson.completed === false)).toBe(true)
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
