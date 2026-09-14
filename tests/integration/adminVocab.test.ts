import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { GET, POST } from '@/app/api/admin/lessons/[lessonId]/vocab/route'
import { PATCH, DELETE } from '@/app/api/admin/vocab/[wordId]/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/admin/lessons/x/vocab', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validWord = {
  word: 'Testwort',
  translationEn: 'test word',
  translationTr: 'test kelime',
  exampleSentence: 'Das ist ein Testwort.',
}

describe('admin vocab API', () => {
  vi.setConfig({ testTimeout: 30000 })
  let adminId: string
  let lessonId: string
  let unitId: string
  const createdWordIds: string[] = []

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: 'admin-vocab-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Admin User',
        role: 'ADMIN',
      },
    })
    adminId = admin.id
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: adminId, role: 'ADMIN' } } as never)

    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 994, titleDe: 'x', titleEn: 'x', titleTr: 'x' },
    })
    unitId = unit.id
    const lesson = await prisma.lesson.create({
      data: { unitId, order: 1, grammarTopic: 'x', explanationDe: 'x', explanationEn: 'x', explanationTr: 'x' },
    })
    lessonId = lesson.id
  })

  afterAll(async () => {
    if (createdWordIds.length > 0) {
      await prisma.userVocabCard.deleteMany({ where: { vocabWordId: { in: createdWordIds } } })
      await prisma.vocabWord.deleteMany({ where: { id: { in: createdWordIds } } })
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

  it('creates a vocab word and lists it', async () => {
    const createRes = await POST(makePostRequest(validWord), { params: Promise.resolve({ lessonId }) })
    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    createdWordIds.push(created.id)

    const listRes = await GET(new Request('http://localhost'), { params: Promise.resolve({ lessonId }) })
    const list = await listRes.json()
    const found = list.find((w: { id: string }) => w.id === created.id)
    expect(found).toMatchObject(validWord)
  })

  it('updates a vocab word', async () => {
    const createRes = await POST(makePostRequest(validWord), { params: Promise.resolve({ lessonId }) })
    const created = await createRes.json()
    createdWordIds.push(created.id)

    const patchRes = await PATCH(
      new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ translationEn: 'updated' }) }),
      { params: Promise.resolve({ wordId: created.id }) }
    )
    expect(patchRes.status).toBe(200)
    const stored = await prisma.vocabWord.findUniqueOrThrow({ where: { id: created.id } })
    expect(stored.translationEn).toBe('updated')
  })

  it('deletes a vocab word along with dependent review cards', async () => {
    const createRes = await POST(makePostRequest(validWord), { params: Promise.resolve({ lessonId }) })
    const created = await createRes.json()

    await prisma.userVocabCard.create({ data: { userId: adminId, vocabWordId: created.id } })

    const deleteRes = await DELETE(new Request('http://localhost', { method: 'DELETE' }), {
      params: Promise.resolve({ wordId: created.id }),
    })
    expect(deleteRes.status).toBe(200)
    const stored = await prisma.vocabWord.findUnique({ where: { id: created.id } })
    expect(stored).toBeNull()
  })
})
