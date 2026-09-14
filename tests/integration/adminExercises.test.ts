import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { GET, POST } from '@/app/api/admin/lessons/[lessonId]/exercises/route'
import { PATCH, DELETE } from '@/app/api/admin/exercises/[exerciseId]/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/admin/lessons/x/exercises', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validExercise = {
  order: 1,
  type: 'MULTIPLE_CHOICE',
  data: { prompt: 'Q?', options: ['a', 'b'] },
  correctAnswer: { correctIndex: 0 },
  explanation: 'Because a.',
}

describe('admin exercises API', () => {
  vi.setConfig({ testTimeout: 30000 })
  let adminId: string
  let lessonId: string
  let unitId: string
  const createdExerciseIds: string[] = []

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: 'admin-exercises-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Admin User',
        role: 'ADMIN',
      },
    })
    adminId = admin.id
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: adminId, role: 'ADMIN' } } as never)

    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 995, titleDe: 'x', titleEn: 'x', titleTr: 'x' },
    })
    unitId = unit.id
    const lesson = await prisma.lesson.create({
      data: { unitId, order: 1, grammarTopic: 'x', explanationDe: 'x', explanationEn: 'x', explanationTr: 'x' },
    })
    lessonId = lesson.id
  })

  afterAll(async () => {
    if (createdExerciseIds.length > 0) {
      await prisma.exercise.deleteMany({ where: { id: { in: createdExerciseIds } } })
    }
    if (lessonId) await prisma.lesson.deleteMany({ where: { id: lessonId } })
    if (unitId) await prisma.unit.deleteMany({ where: { id: unitId } })
    if (adminId) await prisma.user.deleteMany({ where: { id: adminId } })
    await prisma.$disconnect()
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    const res = await GET(new Request('http://localhost'), { params: Promise.resolve({ lessonId }) })
    expect(res.status).toBe(401)
  })

  it('creates an exercise with JSON data/correctAnswer and lists it', async () => {
    const createRes = await POST(makePostRequest(validExercise), { params: Promise.resolve({ lessonId }) })
    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    createdExerciseIds.push(created.id)

    const listRes = await GET(new Request('http://localhost'), { params: Promise.resolve({ lessonId }) })
    const list = await listRes.json()
    const found = list.find((e: { id: string }) => e.id === created.id)
    expect(found.data).toEqual(validExercise.data)
    expect(found.correctAnswer).toEqual(validExercise.correctAnswer)
  })

  it('rejects a non-object data field', async () => {
    const res = await POST(makePostRequest({ ...validExercise, data: 'not-an-object' }), {
      params: Promise.resolve({ lessonId }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects an unknown exercise type', async () => {
    const res = await POST(makePostRequest({ ...validExercise, type: 'DRAG_AND_DROP' }), {
      params: Promise.resolve({ lessonId }),
    })
    expect(res.status).toBe(400)
  })

  it('updates an exercise', async () => {
    const createRes = await POST(makePostRequest(validExercise), { params: Promise.resolve({ lessonId }) })
    const created = await createRes.json()
    createdExerciseIds.push(created.id)

    const patchRes = await PATCH(
      new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ explanation: 'Updated' }) }),
      { params: Promise.resolve({ exerciseId: created.id }) }
    )
    expect(patchRes.status).toBe(200)
    const stored = await prisma.exercise.findUniqueOrThrow({ where: { id: created.id } })
    expect(stored.explanation).toBe('Updated')
  })

  it('deletes an exercise', async () => {
    const createRes = await POST(makePostRequest(validExercise), { params: Promise.resolve({ lessonId }) })
    const created = await createRes.json()

    const deleteRes = await DELETE(new Request('http://localhost', { method: 'DELETE' }), {
      params: Promise.resolve({ exerciseId: created.id }),
    })
    expect(deleteRes.status).toBe(200)
    const stored = await prisma.exercise.findUnique({ where: { id: created.id } })
    expect(stored).toBeNull()
  })
})
