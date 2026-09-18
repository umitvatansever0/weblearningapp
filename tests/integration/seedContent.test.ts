import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('seed content', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('has all six CEFR levels in order', async () => {
    const levels = await prisma.level.findMany({ orderBy: { order: 'asc' } })
    expect(levels.map((level) => level.code)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  })

  it('has 12 A1 units with four lessons each', async () => {
    const a1 = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const units = await prisma.unit.findMany({ where: { levelId: a1.id }, include: { lessons: true } })
    expect(units).toHaveLength(12)
    units.forEach((unit) => expect(unit.lessons).toHaveLength(4))
    const totalLessons = units.reduce((sum, unit) => sum + unit.lessons.length, 0)
    expect(totalLessons).toBe(48)
  })

  it('has 12 A2 units with four lessons each', async () => {
    const a2 = await prisma.level.findUniqueOrThrow({ where: { code: 'A2' } })
    const units = await prisma.unit.findMany({ where: { levelId: a2.id }, include: { lessons: true } })
    expect(units).toHaveLength(12)
    units.forEach((unit) => expect(unit.lessons).toHaveLength(4))
    const totalLessons = units.reduce((sum, unit) => sum + unit.lessons.length, 0)
    expect(totalLessons).toBe(48)
  })

  it('has at least one lesson for every level above A1', async () => {
    const codes = ['A2', 'B1', 'B2', 'C1', 'C2'] as const
    for (const code of codes) {
      const level = await prisma.level.findUniqueOrThrow({ where: { code } })
      const units = await prisma.unit.findMany({ where: { levelId: level.id }, include: { lessons: true } })
      const lessonCount = units.reduce((sum, unit) => sum + unit.lessons.length, 0)
      expect(lessonCount).toBeGreaterThanOrEqual(1)
    }
  })

  it('uses all five exercise types across the seeded content', async () => {
    const exercises = await prisma.exercise.findMany({ select: { type: true } })
    const types = new Set(exercises.map((exercise) => exercise.type))
    expect(types).toEqual(
      new Set(['MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'MATCHING', 'SENTENCE_ORDER', 'SHORT_ANSWER'])
    )
  })
})
