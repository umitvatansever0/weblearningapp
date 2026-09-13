import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('gamification seed content', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('has all six badges seeded', async () => {
    const badges = await prisma.badge.findMany({ select: { code: true } })
    const codes = new Set(badges.map((badge) => badge.code))
    expect(codes).toEqual(
      new Set(['first_lesson', 'streak_3', 'streak_7', 'first_vocab_review', 'a1_complete', 'xp_100'])
    )
  })

  it('has at least one vocab word for every seeded lesson', async () => {
    const lessons = await prisma.lesson.findMany({ include: { vocabWords: true } })
    expect(lessons.length).toBeGreaterThan(0)
    for (const lesson of lessons) {
      expect(lesson.vocabWords.length).toBeGreaterThanOrEqual(2)
    }
  })
})
