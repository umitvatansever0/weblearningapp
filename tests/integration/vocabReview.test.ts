import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { POST } from '@/app/api/vocab/[cardId]/review/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/vocab/test/review', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/vocab/[cardId]/review', () => {
  vi.setConfig({ testTimeout: 30000 })
  let ownerId: string
  let otherUserId: string
  let cardId: string
  let lessonId: string
  let unitId: string

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'vocab-review-owner@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Vocab Review Owner',
      },
    })
    ownerId = owner.id
    const other = await prisma.user.create({
      data: {
        email: 'vocab-review-other@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Vocab Review Other',
      },
    })
    otherUserId = other.id

    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 995, titleDe: 'Test', titleEn: 'Vocab Review Test Unit', titleTr: 'Test' },
    })
    unitId = unit.id
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Vocab Review Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })
    lessonId = lesson.id
    const word = await prisma.vocabWord.create({
      data: {
        lessonId,
        word: 'Testwort',
        translationEn: 'test word',
        translationTr: 'test kelimesi',
        exampleSentence: 'Das ist ein Testwort.',
      },
    })
    const card = await prisma.userVocabCard.create({ data: { userId: ownerId, vocabWordId: word.id } })
    cardId = card.id
  })

  afterAll(async () => {
    // Guard against beforeAll having thrown before these were assigned —
    // an unfiltered deleteMany({ where: { lessonId: undefined } }) would
    // wipe every row in the table (Prisma drops undefined filter keys).
    if (ownerId && otherUserId && cardId && lessonId && unitId) {
      await prisma.userBadge.deleteMany({ where: { userId: { in: [ownerId, otherUserId] } } })
      await prisma.userVocabCard.deleteMany({ where: { userId: { in: [ownerId, otherUserId] } } })
      await prisma.vocabWord.deleteMany({ where: { lessonId } })
      await prisma.lesson.deleteMany({ where: { id: lessonId } })
      await prisma.unit.deleteMany({ where: { id: unitId } })
      await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherUserId] } } })
    }
    await prisma.$disconnect()
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(makeRequest({ grade: 'good' }), { params: Promise.resolve({ cardId }) })
    expect(res.status).toBe(401)
  })

  it('rejects a card belonging to another user with 404', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: otherUserId } } as never)
    const res = await POST(makeRequest({ grade: 'good' }), { params: Promise.resolve({ cardId }) })
    expect(res.status).toBe(404)
  })

  it('returns 404 for an unknown card id', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: ownerId } } as never)
    const res = await POST(makeRequest({ grade: 'good' }), { params: Promise.resolve({ cardId: 'does-not-exist' }) })
    expect(res.status).toBe(404)
  })

  it('applies the SM-2 grade, returns the new interval/dueDate, and awards the first_vocab_review badge', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: ownerId } } as never)
    const res = await POST(makeRequest({ grade: 'good' }), { params: Promise.resolve({ cardId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.interval).toBe(1)
    expect(typeof json.dueDate).toBe('string')

    const stored = await prisma.userVocabCard.findUniqueOrThrow({ where: { id: cardId } })
    expect(stored.repetitions).toBe(1)
    expect(stored.lastReviewedAt).not.toBeNull()

    const badges = await prisma.userBadge.findMany({ where: { userId: ownerId }, include: { badge: true } })
    expect(badges.map((entry) => entry.badge.code)).toContain('first_vocab_review')
  })

  it('returns 400 for an invalid grade value', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: ownerId } } as never)
    const res = await POST(makeRequest({ grade: 'excellent' }), { params: Promise.resolve({ cardId }) })
    expect(res.status).toBe(400)
  })
})
