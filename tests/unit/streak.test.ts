import { describe, it, expect } from 'vitest'
import { computeNextStreak, computeXpGain } from '@/lib/streak'

const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`)

describe('computeNextStreak', () => {
  it('starts a streak of 1 for a user with no prior activity', () => {
    const result = computeNextStreak(0, null, day('2026-01-10'))
    expect(result).toEqual({ streak: 1, activityChanged: true })
  })

  it('does not change the streak for a second activity on the same UTC day', () => {
    const result = computeNextStreak(3, day('2026-01-10'), day('2026-01-10'))
    expect(result).toEqual({ streak: 3, activityChanged: false })
  })

  it('increments the streak for activity on the consecutive UTC day', () => {
    const result = computeNextStreak(3, day('2026-01-10'), day('2026-01-11'))
    expect(result).toEqual({ streak: 4, activityChanged: true })
  })

  it('resets the streak to 1 after a gap of more than one day', () => {
    const result = computeNextStreak(5, day('2026-01-08'), day('2026-01-11'))
    expect(result).toEqual({ streak: 1, activityChanged: true })
  })
})

describe('computeXpGain', () => {
  it('awards 10 XP per correct answer', () => {
    expect(computeXpGain(0)).toBe(0)
    expect(computeXpGain(1)).toBe(10)
    expect(computeXpGain(3)).toBe(30)
  })
})
