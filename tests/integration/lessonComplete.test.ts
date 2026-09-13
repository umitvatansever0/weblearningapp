import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { POST } from '@/app/api/lessons/[lessonId]/complete/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/lessons/test/complete', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/lessons/[lessonId]/complete', () => {
  let userId: string
  let unitId: string
  let lessonId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'lesson-complete-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Lesson Complete Test',
      },
    })
    userId = user.id

    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 999, titleDe: 'Test', titleEn: 'Complete Test Unit', titleTr: 'Test' },
    })
    unitId = unit.id
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Complete Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })
    lessonId = lesson.id
  })

  afterAll(async () => {
    await prisma.userProgress.deleteMany({ where: { userId } })
    await prisma.lesson.deleteMany({ where: { id: lessonId } })
    await prisma.unit.deleteMany({ where: { id: unitId } })
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(makeRequest({ score: 100 }), { params: Promise.resolve({ lessonId }) })
    expect(res.status).toBe(401)
  })

  it('upserts progress for an authenticated user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: userId } } as never)
    const res = await POST(makeRequest({ score: 80 }), { params: Promise.resolve({ lessonId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ completed: true, score: 80 })

    const stored = await prisma.userProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })
    expect(stored?.completed).toBe(true)
    expect(stored?.score).toBe(80)
  })

  it('returns 400 for malformed JSON body', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: userId } } as never)
    const badRequest = new Request('http://localhost/api/lessons/test/complete', {
      method: 'POST',
      body: '{not valid json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(badRequest, { params: Promise.resolve({ lessonId }) })
    expect(res.status).toBe(400)
  })
})
