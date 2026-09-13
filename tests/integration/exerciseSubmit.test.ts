import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { POST } from '@/app/api/exercises/[exerciseId]/submit/route'
import { prisma } from '@/lib/prisma'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/exercises/test/submit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/exercises/[exerciseId]/submit', () => {
  let unitId: string
  let lessonId: string
  let exerciseId: string

  beforeAll(async () => {
    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 998, titleDe: 'Test', titleEn: 'Submit Test Unit', titleTr: 'Test' },
    })
    unitId = unit.id
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Submit Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })
    lessonId = lesson.id
    const exercise = await prisma.exercise.create({
      data: {
        lessonId: lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Test?', options: ['A', 'B'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'B is correct.',
      },
    })
    exerciseId = exercise.id
  })

  afterAll(async () => {
    await prisma.exercise.deleteMany({ where: { lessonId } })
    await prisma.lesson.deleteMany({ where: { id: lessonId } })
    await prisma.unit.deleteMany({ where: { id: unitId } })
    await prisma.$disconnect()
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(makeRequest({ answer: { selectedIndex: 1 } }), {
      params: Promise.resolve({ exerciseId }),
    })
    expect(res.status).toBe(401)
  })

  it('returns correct: true for the right answer', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'someone' } } as never)
    const res = await POST(makeRequest({ answer: { selectedIndex: 1 } }), {
      params: Promise.resolve({ exerciseId }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.correct).toBe(true)
    expect(json.correctAnswer).toEqual({ correctIndex: 1 })
    expect(json.explanation).toBe('B is correct.')
  })

  it('returns correct: false for the wrong answer', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'someone' } } as never)
    const res = await POST(makeRequest({ answer: { selectedIndex: 0 } }), {
      params: Promise.resolve({ exerciseId }),
    })
    const json = await res.json()
    expect(json.correct).toBe(false)
  })

  it('returns 404 for an unknown exercise', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'someone' } } as never)
    const res = await POST(makeRequest({ answer: {} }), {
      params: Promise.resolve({ exerciseId: 'does-not-exist' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 400 for a malformed JSON body', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'someone' } } as never)
    const req = new Request('http://localhost/api/exercises/test/submit', {
      method: 'POST',
      body: '{not valid json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, {
      params: Promise.resolve({ exerciseId }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid JSON body')
  })

  it('returns 400 when the answer field is missing entirely', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'someone' } } as never)
    const res = await POST(makeRequest({}), {
      params: Promise.resolve({ exerciseId }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid answer format')
  })
})
