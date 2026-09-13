import { describe, it, expect } from 'vitest'
import { applySM2Grade } from '@/lib/spacedRepetition'

const newCard = { easeFactor: 2.5, interval: 0, repetitions: 0 }

describe('applySM2Grade', () => {
  it('resets repetitions and sets a 1-day interval on "again"', () => {
    const result = applySM2Grade({ easeFactor: 2.5, interval: 6, repetitions: 2 }, 'again')
    expect(result.repetitions).toBe(0)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBeCloseTo(2.3)
  })

  it('never lowers easeFactor below 1.3', () => {
    const result = applySM2Grade({ easeFactor: 1.35, interval: 1, repetitions: 0 }, 'again')
    expect(result.easeFactor).toBe(1.3)
  })

  it('sets interval to 1 day on first "good" grade', () => {
    const result = applySM2Grade(newCard, 'good')
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBe(2.5)
  })

  it('sets interval to 6 days on second "good" grade', () => {
    const result = applySM2Grade({ easeFactor: 2.5, interval: 1, repetitions: 1 }, 'good')
    expect(result.repetitions).toBe(2)
    expect(result.interval).toBe(6)
  })

  it('multiplies interval by easeFactor on third+ "good" grade', () => {
    const result = applySM2Grade({ easeFactor: 2.0, interval: 6, repetitions: 2 }, 'good')
    expect(result.repetitions).toBe(3)
    expect(result.interval).toBe(12)
  })

  it('sets interval to 4 days on first "easy" grade and raises easeFactor', () => {
    const result = applySM2Grade(newCard, 'easy')
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBe(4)
    expect(result.easeFactor).toBeCloseTo(2.65)
  })

  it('applies a 1.3x bonus on third+ "easy" grade', () => {
    const result = applySM2Grade({ easeFactor: 2.0, interval: 6, repetitions: 2 }, 'easy')
    expect(result.repetitions).toBe(3)
    expect(result.interval).toBe(16) // ceil(6 * 2.0 * 1.3) = ceil(15.6) = 16
  })

  it('sets interval to 1 day on first "hard" grade and lowers easeFactor', () => {
    const result = applySM2Grade(newCard, 'hard')
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBeCloseTo(2.35)
  })

  it('multiplies interval by 1.2 on third+ "hard" grade', () => {
    const result = applySM2Grade({ easeFactor: 2.0, interval: 6, repetitions: 2 }, 'hard')
    expect(result.repetitions).toBe(3)
    expect(result.interval).toBe(8) // ceil(6 * 1.2) = ceil(7.2) = 8
  })

  it('sets dueDate to now plus interval days', () => {
    const before = Date.now()
    const result = applySM2Grade(newCard, 'good')
    const expectedMs = before + 1 * 24 * 60 * 60 * 1000
    expect(result.dueDate.getTime()).toBeGreaterThanOrEqual(expectedMs - 1000)
    expect(result.dueDate.getTime()).toBeLessThanOrEqual(expectedMs + 5000)
  })
})
