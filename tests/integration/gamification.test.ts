import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { applyLessonCompletionRewards, checkAndAwardBadges } from '@/lib/gamification'

describe('applyLessonCompletionRewards', () => {
  vi.setConfig({ testTimeout: 30000 })
  let userId: string
  let lessonId: string
  let unitId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'gamification-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Gamification Test',
      },
    })
    userId = user.id

    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 996, titleDe: 'Test', titleEn: 'Gamification Test Unit', titleTr: 'Test' },
    })
    unitId = unit.id
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Gamification Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })
    lessonId = lesson.id
    await prisma.vocabWord.create({
      data: {
        lessonId,
        word: 'Testwort',
        translationEn: 'test word',
        translationTr: 'test kelimesi',
        exampleSentence: 'Das ist ein Testwort.',
      },
    })
  })

  afterAll(async () => {
    await prisma.userBadge.deleteMany({ where: { userId } })
    await prisma.userVocabCard.deleteMany({ where: { userId } })
    await prisma.userProgress.deleteMany({ where: { userId } })
    await prisma.vocabWord.deleteMany({ where: { lessonId } })
    await prisma.lesson.deleteMany({ where: { id: lessonId } })
    await prisma.unit.deleteMany({ where: { id: unitId } })
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  })

  it('increments streak, awards XP, creates vocab cards, and awards the first_lesson badge', async () => {
    await applyLessonCompletionRewards(userId, lessonId, 2)

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(user.streak).toBe(1)
    expect(user.xp).toBe(20)
    expect(user.lastActivityDate).not.toBeNull()

    const cards = await prisma.userVocabCard.findMany({ where: { userId } })
    expect(cards).toHaveLength(1)
    expect(cards[0].easeFactor).toBe(2.5)

    const badges = await prisma.userBadge.findMany({ where: { userId }, include: { badge: true } })
    expect(badges.map((entry) => entry.badge.code)).toContain('first_lesson')
  })

  it('does not create duplicate vocab cards or duplicate badges on a second completion', async () => {
    await applyLessonCompletionRewards(userId, lessonId, 1)

    const cards = await prisma.userVocabCard.findMany({ where: { userId } })
    expect(cards).toHaveLength(1)

    const badges = await prisma.userBadge.findMany({ where: { userId } })
    const firstLessonCount = badges.filter((b) => b.badgeId).length
    expect(new Set(badges.map((b) => b.badgeId)).size).toBe(badges.length)
    expect(firstLessonCount).toBeGreaterThanOrEqual(1)
  })
})

describe('checkAndAwardBadges', () => {
  vi.setConfig({ testTimeout: 30000 })
  it('is idempotent — awarding the same badge twice does not throw or duplicate', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'badge-idempotent-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Badge Idempotent Test',
        xp: 150,
      },
    })
    try {
      await checkAndAwardBadges(user.id)
      await checkAndAwardBadges(user.id)
      const badges = await prisma.userBadge.findMany({ where: { userId: user.id } })
      const xp100Count = badges.length
      expect(xp100Count).toBeGreaterThanOrEqual(1)
      const uniqueBadgeIds = new Set(badges.map((b) => b.badgeId))
      expect(uniqueBadgeIds.size).toBe(badges.length)
    } finally {
      await prisma.userBadge.deleteMany({ where: { userId: user.id } })
      await prisma.user.deleteMany({ where: { id: user.id } })
      await prisma.$disconnect()
    }
  })
})
