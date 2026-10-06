import { describe, it, expect } from 'vitest'
import {
  PASS_RATIO,
  PLACEMENT_LEVELS,
  PLACEMENT_QUESTIONS,
  publicPlacementQuestions,
  scorePlacement,
} from '@/lib/placementTest'

/** Answer every question of the given levels correctly, the rest wrong. */
function answersFor(correctLevels: string[]): number[] {
  return PLACEMENT_QUESTIONS.map((q) =>
    correctLevels.includes(q.level) ? q.correctIndex : (q.correctIndex + 1) % 4
  )
}

describe('placement test questions', () => {
  it('has 50 questions covering every level from A1 to C2 in order', () => {
    expect(PLACEMENT_QUESTIONS).toHaveLength(50)
    const levelIndexes = PLACEMENT_QUESTIONS.map((q) => PLACEMENT_LEVELS.indexOf(q.level))
    expect(levelIndexes).toEqual([...levelIndexes].sort((a, b) => a - b))
    for (const level of PLACEMENT_LEVELS) {
      expect(PLACEMENT_QUESTIONS.filter((q) => q.level === level).length).toBeGreaterThanOrEqual(8)
    }
  })

  it('has four distinct options and a valid answer per question', () => {
    for (const q of PLACEMENT_QUESTIONS) {
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
    }
    // The correct option is spread over all positions, not always the same one.
    expect(new Set(PLACEMENT_QUESTIONS.map((q) => q.correctIndex)).size).toBe(4)
  })

  it('never sends the correct answers to the client', () => {
    for (const q of publicPlacementQuestions()) {
      expect(q).not.toHaveProperty('correctIndex')
    }
  })
})

describe('scorePlacement', () => {
  it('rates an all-correct test as C2', () => {
    const result = scorePlacement(PLACEMENT_QUESTIONS.map((q) => q.correctIndex))
    expect(result.level).toBe('C2')
    expect(result.recommended).toBe('C2')
    expect(result.correct).toBe(50)
    expect(result.total).toBe(50)
  })

  it('rates an empty test as beginner and recommends A1', () => {
    const result = scorePlacement(PLACEMENT_QUESTIONS.map(() => -1))
    expect(result.level).toBeNull()
    expect(result.recommended).toBe('A1')
    expect(result.correct).toBe(0)
  })

  it('returns the last mastered level and recommends the next one', () => {
    const result = scorePlacement(answersFor(['A1', 'A2', 'B1']))
    expect(result.level).toBe('B1')
    expect(result.recommended).toBe('B2')
    expect(result.perLevel.find((s) => s.level === 'B2')).toMatchObject({ correct: 0 })
  })

  it('does not skip a gap in the basics because of correct hard answers', () => {
    const result = scorePlacement(answersFor(['A1', 'B1', 'B2', 'C1', 'C2']))
    expect(result.level).toBe('A1')
    expect(result.recommended).toBe('A2')
  })

  it('applies the pass ratio per level', () => {
    const a1 = PLACEMENT_QUESTIONS.filter((q) => q.level === 'A1')
    const needed = Math.ceil(a1.length * PASS_RATIO)
    let seen = 0
    const answers = PLACEMENT_QUESTIONS.map((q) => {
      if (q.level !== 'A1') return -1
      seen++
      return seen <= needed ? q.correctIndex : -1
    })
    expect(scorePlacement(answers).level).toBe('A1')

    let seenBelow = 0
    const below = PLACEMENT_QUESTIONS.map((q) => {
      if (q.level !== 'A1') return -1
      seenBelow++
      return seenBelow < needed ? q.correctIndex : -1
    })
    expect(scorePlacement(below).level).toBeNull()
  })
})
