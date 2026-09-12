import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

describe('exercise engine schema', () => {
  afterAll(async () => {
    await prisma.userProgress.deleteMany({ where: { user: { email: 'schema-exercise-test@example.com' } } })
    await prisma.exercise.deleteMany({ where: { lesson: { grammarTopic: 'Schema Test Topic' } } })
    await prisma.lesson.deleteMany({ where: { grammarTopic: 'Schema Test Topic' } })
    await prisma.unit.deleteMany({ where: { titleEn: 'Schema Test Unit' } })
    await prisma.user.deleteMany({ where: { email: 'schema-exercise-test@example.com' } })
    await prisma.$disconnect()
  })

  it('creates a full Level -> Unit -> Lesson -> Exercise -> UserProgress chain', async () => {
    const level = await prisma.level.upsert({
      where: { code: 'A1' },
      update: {},
      create: { code: 'A1', order: 1 },
    })

    const unit = await prisma.unit.create({
      data: {
        levelId: level.id,
        order: 1,
        titleDe: 'Test',
        titleEn: 'Schema Test Unit',
        titleTr: 'Test',
      },
    })

    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Schema Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })

    const exercise = await prisma.exercise.create({
      data: {
        lessonId: lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Test?', options: ['A', 'B'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Test explanation',
      },
    })

    const user = await prisma.user.create({
      data: {
        email: 'schema-exercise-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Schema Exercise Test',
      },
    })

    const progress = await prisma.userProgress.create({
      data: { userId: user.id, lessonId: lesson.id, completed: true, score: 100 },
    })

    expect(exercise.type).toBe('MULTIPLE_CHOICE')
    expect(progress.completed).toBe(true)

    const found = await prisma.level.findUnique({
      where: { id: level.id },
      include: { units: { include: { lessons: { include: { exercises: true } } } } },
    })
    const foundUnit = found?.units.find((u) => u.id === unit.id)
    expect(foundUnit?.lessons[0].exercises[0].id).toBe(exercise.id)
  })
})
