import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { GET, POST } from '@/app/api/admin/units/route'
import { PATCH, DELETE } from '@/app/api/admin/units/[unitId]/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/admin/units', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('admin units API', () => {
  vi.setConfig({ testTimeout: 30000 })
  let adminId: string
  const createdUnitIds: string[] = []

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: 'admin-units-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Admin User',
        role: 'ADMIN',
      },
    })
    adminId = admin.id
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: adminId, role: 'ADMIN' } } as never)
  })

  afterAll(async () => {
    if (createdUnitIds.length > 0) {
      await prisma.unit.deleteMany({ where: { id: { in: createdUnitIds } } })
    }
    if (adminId) {
      await prisma.user.deleteMany({ where: { id: adminId } })
    }
    await prisma.$disconnect()
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('creates a unit and returns it in the list', async () => {
    const createRes = await POST(
      makePostRequest({ levelCode: 'A1', order: 999, titleDe: 'Test DE', titleEn: 'Test EN', titleTr: 'Test TR' })
    )
    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    createdUnitIds.push(created.id)

    const listRes = await GET()
    const list = await listRes.json()
    const found = list.find((u: { id: string }) => u.id === created.id)
    expect(found).toMatchObject({ levelCode: 'A1', titleEn: 'Test EN', lessonCount: 0 })
  })

  it('rejects creation with an invalid level code', async () => {
    const res = await POST(
      makePostRequest({ levelCode: 'Z9', order: 1, titleDe: 'x', titleEn: 'x', titleTr: 'x' })
    )
    expect(res.status).toBe(400)
  })

  it('updates a unit', async () => {
    const createRes = await POST(
      makePostRequest({ levelCode: 'A1', order: 998, titleDe: 'Old', titleEn: 'Old', titleTr: 'Old' })
    )
    const created = await createRes.json()
    createdUnitIds.push(created.id)

    const patchRes = await PATCH(
      new Request('http://localhost/api/admin/units/x', {
        method: 'PATCH',
        body: JSON.stringify({ titleEn: 'Updated' }),
      }),
      { params: Promise.resolve({ unitId: created.id }) }
    )
    expect(patchRes.status).toBe(200)

    const stored = await prisma.unit.findUniqueOrThrow({ where: { id: created.id } })
    expect(stored.titleEn).toBe('Updated')
  })

  it('deletes a unit along with its lessons', async () => {
    const createRes = await POST(
      makePostRequest({ levelCode: 'A1', order: 997, titleDe: 'ToDelete', titleEn: 'ToDelete', titleTr: 'ToDelete' })
    )
    const created = await createRes.json()

    const lesson = await prisma.lesson.create({
      data: {
        unitId: created.id,
        order: 1,
        grammarTopic: 'x',
        explanationDe: 'x',
        explanationEn: 'x',
        explanationTr: 'x',
      },
    })

    const deleteRes = await DELETE(new Request('http://localhost/api/admin/units/x', { method: 'DELETE' }), {
      params: Promise.resolve({ unitId: created.id }),
    })
    expect(deleteRes.status).toBe(200)

    const storedUnit = await prisma.unit.findUnique({ where: { id: created.id } })
    expect(storedUnit).toBeNull()
    const storedLesson = await prisma.lesson.findUnique({ where: { id: lesson.id } })
    expect(storedLesson).toBeNull()
  })
})
