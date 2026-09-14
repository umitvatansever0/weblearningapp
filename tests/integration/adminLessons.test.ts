import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { GET, POST } from '@/app/api/admin/units/[unitId]/lessons/route'
import { PATCH, DELETE } from '@/app/api/admin/lessons/[lessonId]/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/admin/units/x/lessons', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('admin lessons API', () => {
  vi.setConfig({ testTimeout: 30000 })
  let adminId: string
  let unitId: string
  const createdLessonIds: string[] = []

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: 'admin-lessons-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Admin User',
        role: 'ADMIN',
      },
    })
    adminId = admin.id
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: adminId, role: 'ADMIN' } } as never)

    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 996, titleDe: 'x', titleEn: 'x', titleTr: 'x' },
    })
    unitId = unit.id
  })

  afterAll(async () => {
    if (createdLessonIds.length > 0) {
      await prisma.lesson.deleteMany({ where: { id: { in: createdLessonIds } } })
    }
    if (unitId) {
      await prisma.unit.deleteMany({ where: { id: unitId } })
    }
    if (adminId) {
      await prisma.user.deleteMany({ where: { id: adminId } })
    }
    await prisma.$disconnect()
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    const res = await GET(new Request('http://localhost'), { params: Promise.resolve({ unitId }) })
    expect(res.status).toBe(401)
  })

  it('creates a lesson under a unit and lists it', async () => {
    const createRes = await POST(
      makePostRequest({
        order: 1,
        grammarTopic: 'Topic',
        explanationDe: 'DE',
        explanationEn: 'EN',
        explanationTr: 'TR',
      }),
      { params: Promise.resolve({ unitId }) }
    )
    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    createdLessonIds.push(created.id)

    const listRes = await GET(new Request('http://localhost'), { params: Promise.resolve({ unitId }) })
    const list = await listRes.json()
    const found = list.find((l: { id: string }) => l.id === created.id)
    expect(found).toMatchObject({ grammarTopic: 'Topic', exerciseCount: 0, vocabWordCount: 0 })
  })

  it('returns 404 when the parent unit does not exist', async () => {
    const res = await POST(
      makePostRequest({ order: 1, grammarTopic: 'x', explanationDe: 'x', explanationEn: 'x', explanationTr: 'x' }),
      { params: Promise.resolve({ unitId: 'does-not-exist' }) }
    )
    expect(res.status).toBe(404)
  })

  it('updates a lesson', async () => {
    const createRes = await POST(
      makePostRequest({ order: 2, grammarTopic: 'Old', explanationDe: 'x', explanationEn: 'x', explanationTr: 'x' }),
      { params: Promise.resolve({ unitId }) }
    )
    const created = await createRes.json()
    createdLessonIds.push(created.id)

    const patchRes = await PATCH(
      new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ grammarTopic: 'New' }) }),
      { params: Promise.resolve({ lessonId: created.id }) }
    )
    expect(patchRes.status).toBe(200)
    const stored = await prisma.lesson.findUniqueOrThrow({ where: { id: created.id } })
    expect(stored.grammarTopic).toBe('New')
  })

  it('deletes a lesson', async () => {
    const createRes = await POST(
      makePostRequest({ order: 3, grammarTopic: 'ToDelete', explanationDe: 'x', explanationEn: 'x', explanationTr: 'x' }),
      { params: Promise.resolve({ unitId }) }
    )
    const created = await createRes.json()

    const deleteRes = await DELETE(new Request('http://localhost', { method: 'DELETE' }), {
      params: Promise.resolve({ lessonId: created.id }),
    })
    expect(deleteRes.status).toBe(200)
    const stored = await prisma.lesson.findUnique({ where: { id: created.id } })
    expect(stored).toBeNull()
  })
})
