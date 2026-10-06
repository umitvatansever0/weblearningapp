import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { POST as attempt } from '@/app/api/course/attempt/route'
import { POST as section } from '@/app/api/course/section/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { buildReviewSession } from '@/course/review'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

const EMAIL = 'course-test@example.com'
const DAY = 24 * 60 * 60 * 1000

function json(url: string, body: unknown) {
  return new Request(`http://localhost${url}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function signIn(userId: string | null) {
  vi.mocked(getServerSession).mockResolvedValue(
    userId ? { user: { id: userId, role: 'USER', name: 'Test', email: EMAIL }, expires: '' } : null
  )
}

describe('course progress API', () => {
  vi.setConfig({ testTimeout: 30000 })
  let userId: string

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } })
    const user = await prisma.user.create({
      data: { email: EMAIL, passwordHash: await hashPassword('Sup3rSecret!'), name: 'Course Test' },
    })
    userId = user.id
  })

  afterAll(async () => {
    // Progress rows cascade with the user.
    await prisma.user.deleteMany({ where: { email: EMAIL } })
    await prisma.$disconnect()
  })

  it('requires login', async () => {
    signIn(null)
    const res = await attempt(json('/api/course/attempt', { exerciseKey: 'articles:mc-hund', answer: 0, mode: 'lesson' }))
    expect(res.status).toBe(401)
  })

  it('rejects unknown exercises and malformed answers', async () => {
    signIn(userId)
    expect((await attempt(json('/api/course/attempt', { exerciseKey: 'articles:nope', answer: 0, mode: 'lesson' }))).status).toBe(404)
    expect((await attempt(json('/api/course/attempt', { exerciseKey: 'articles:mc-hund', answer: 9, mode: 'lesson' }))).status).toBe(400)
    expect((await attempt(json('/api/course/attempt', { exerciseKey: 'articles:mc-hund', answer: 0, mode: 'hack' }))).status).toBe(400)
  })

  it('checks the answer on the server and tracks topic and skill mastery', async () => {
    signIn(userId)
    const res = await attempt(json('/api/course/attempt', { exerciseKey: 'articles:mc-hund', answer: 0, mode: 'lesson' }))
    expect(await res.json()).toEqual({ correct: true })

    const mastery = await prisma.topicMastery.findMany({ where: { userId }, orderBy: { topic: 'asc' } })
    expect(mastery.map((m) => [m.topic, m.score, m.attempts])).toEqual([
      ['articles', 100, 1],
      ['skill:grammar', 100, 1],
    ])
    expect(await prisma.courseMistake.count({ where: { userId } })).toBe(0)
  })

  it('puts a wrong answer into the mistake bank, due tomorrow', async () => {
    signIn(userId)
    const before = Date.now()
    const res = await attempt(json('/api/course/attempt', { exerciseKey: 'articles:mc-banane', answer: 0, mode: 'lesson' }))
    expect(await res.json()).toEqual({ correct: false })

    const mistake = await prisma.courseMistake.findUniqueOrThrow({
      where: { userId_exerciseKey: { userId, exerciseKey: 'articles:mc-banane' } },
    })
    expect(mistake).toMatchObject({ topic: 'articles', concept: 'gender-f', stage: 0, wrongAnswer: 'Der Banane ist gelb.' })
    expect(mistake.dueAt.getTime() - before).toBeGreaterThan(DAY - 60_000)

    const articles = await prisma.topicMastery.findUniqueOrThrow({
      where: { userId_level_topic: { userId, level: 'A1', topic: 'articles' } },
    })
    expect(articles.score).toBe(75)
  })

  it('reviews a due mistake with a variation and advances its schedule', async () => {
    signIn(userId)
    const mistake = await prisma.courseMistake.findFirstOrThrow({ where: { userId } })
    await prisma.courseMistake.update({ where: { id: mistake.id }, data: { dueAt: new Date(Date.now() - 1000) } })

    const session = await buildReviewSession(userId, 'A1', 'due')
    const item = session.find((i) => i.mistakeId === mistake.id)
    expect(item).toBeDefined()
    expect(item!.exerciseKey).not.toBe('articles:mc-banane')

    // Answer the variation (another feminine-noun exercise) correctly.
    const { findExercise } = await import('@/course/registry')
    const variation = findExercise(item!.exerciseKey)!.exercise as { answer?: number; type: string }
    const answer = variation.answer
    expect(typeof answer).toBe('number')
    const res = await attempt(json('/api/course/attempt', { exerciseKey: item!.exerciseKey, answer, mode: 'review', mistakeId: mistake.id }))
    expect(await res.json()).toEqual({ correct: true })
    const updated = await prisma.courseMistake.findUniqueOrThrow({ where: { id: mistake.id } })
    expect(updated.stage).toBe(1)
    expect(updated.dueAt.getTime() - Date.now()).toBeGreaterThan(3 * DAY - 60_000)
    expect(updated.resolvedAt).toBeNull()
  })

  it('does not advance a mistake that is not due yet', async () => {
    signIn(userId)
    const mistake = await prisma.courseMistake.findFirstOrThrow({ where: { userId } })
    await attempt(json('/api/course/attempt', { exerciseKey: 'articles:mc-lampe', answer: 1, mode: 'review', mistakeId: mistake.id }))
    const after = await prisma.courseMistake.findUniqueOrThrow({ where: { id: mistake.id } })
    expect(after.stage).toBe(mistake.stage)
    expect(after.dueAt.getTime()).toBe(mistake.dueAt.getTime())
  })

  it('records completed sections and rejects unknown ones', async () => {
    signIn(userId)
    const ok = await section(json('/api/course/section', { level: 'A1', unitSlug: 'articles', sectionKey: 'discover' }))
    expect(ok.status).toBe(200)
    await section(json('/api/course/section', { level: 'A1', unitSlug: 'articles', sectionKey: 'discover' }))
    expect(await prisma.courseSectionProgress.count({ where: { userId } })).toBe(1)
    expect((await section(json('/api/course/section', { level: 'A1', unitSlug: 'articles', sectionKey: 'summary' }))).status).toBe(404)
    expect((await section(json('/api/course/section', { level: 'A1', unitSlug: 'nope', sectionKey: 'discover' }))).status).toBe(404)
  })
})
