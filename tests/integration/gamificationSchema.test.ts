import { describe, it, expect, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

describe('gamification schema', () => {
  vi.setConfig({ testTimeout: 30000 })
  afterAll(async () => {
    await prisma.userBadge.deleteMany({ where: { user: { email: 'schema-gamification-test@example.com' } } })
    await prisma.userVocabCard.deleteMany({ where: { user: { email: 'schema-gamification-test@example.com' } } })
    await prisma.badge.deleteMany({ where: { code: 'schema_test_badge' } })
    await prisma.vocabWord.deleteMany({ where: { word: 'SchemaTestWort' } })
    await prisma.user.deleteMany({ where: { email: 'schema-gamification-test@example.com' } })
    await prisma.$disconnect()
  })

  it('adds streak/xp fields to User with correct defaults', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'schema-gamification-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Schema Gamification Test',
      },
    })
    expect(user.streak).toBe(0)
    expect(user.xp).toBe(0)
    expect(user.lastActivityDate).toBeNull()
  })

  it('creates a VocabWord tied to a Lesson, a UserVocabCard, a Badge, and a UserBadge', async () => {
    const level = await prisma.level.upsert({
      where: { code: 'A1' },
      update: {},
      create: { code: 'A1', order: 1 },
    })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 997, titleDe: 'Test', titleEn: 'Schema Vocab Test Unit', titleTr: 'Test' },
    })
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Schema Vocab Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })
    const word = await prisma.vocabWord.create({
      data: {
        lessonId: lesson.id,
        word: 'SchemaTestWort',
        translationEn: 'schema test word',
        translationTr: 'şema test kelimesi',
        exampleSentence: 'Das ist ein SchemaTestWort.',
      },
    })

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'schema-gamification-test@example.com' } })

    const card = await prisma.userVocabCard.create({
      data: { userId: user.id, vocabWordId: word.id },
    })
    expect(card.easeFactor).toBe(2.5)
    expect(card.interval).toBe(0)
    expect(card.repetitions).toBe(0)

    const badge = await prisma.badge.create({
      data: { code: 'schema_test_badge', titleDe: 'Test', titleEn: 'Test', titleTr: 'Test' },
    })
    const userBadge = await prisma.userBadge.create({
      data: { userId: user.id, badgeId: badge.id },
    })
    expect(userBadge.earnedAt).toBeInstanceOf(Date)

    await prisma.userVocabCard.deleteMany({ where: { userId: user.id } })
    await prisma.userBadge.deleteMany({ where: { userId: user.id } })
    await prisma.badge.deleteMany({ where: { code: 'schema_test_badge' } })
    await prisma.vocabWord.deleteMany({ where: { id: word.id } })
    await prisma.lesson.deleteMany({ where: { id: lesson.id } })
    await prisma.unit.deleteMany({ where: { id: unit.id } })
  })
})
