import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { POST as submit } from '@/app/api/placement-test/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { sendPlacementResultEmail } from '@/lib/email'
import { LIMITS, limitKey } from '@/lib/rateLimit'
import { PLACEMENT_QUESTIONS } from '@/lib/placementTest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendPlacementResultEmail: vi.fn().mockResolvedValue(true) }))

const EMAIL = 'placement-test@example.com'

function request(body: unknown) {
  return new Request('http://localhost/api/placement-test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function signIn(userId: string | null) {
  vi.mocked(getServerSession).mockResolvedValue(
    userId ? { user: { id: userId, role: 'USER', name: 'Test', email: 'session@example.com' }, expires: '' } : null
  )
}

const allCorrect = () => PLACEMENT_QUESTIONS.map((q) => q.correctIndex)

describe('placement test API', () => {
  vi.setConfig({ testTimeout: 30000 })
  let userId: string

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } })
    const user = await prisma.user.create({
      data: { email: EMAIL, passwordHash: await hashPassword('Sup3rSecret!'), name: 'Placement <b>Tester</b>' },
    })
    userId = user.id
  })

  beforeEach(async () => {
    vi.mocked(sendPlacementResultEmail).mockClear()
    await prisma.rateLimitHit.deleteMany({ where: { key: limitKey('placementTest', userId) } })
  })

  afterAll(async () => {
    await prisma.rateLimitHit.deleteMany({ where: { key: limitKey('placementTest', userId) } })
    await prisma.user.deleteMany({ where: { email: EMAIL } })
    await prisma.$disconnect()
  })

  it('rejects anonymous submissions', async () => {
    signIn(null)
    const res = await submit(request({ answers: allCorrect(), locale: 'tr' }))
    expect(res.status).toBe(401)
    expect(sendPlacementResultEmail).not.toHaveBeenCalled()
  })

  it('rejects malformed answers', async () => {
    signIn(userId)
    expect((await submit(request({ answers: [0, 1], locale: 'tr' }))).status).toBe(400)
    expect((await submit(request({ answers: allCorrect().map(() => 7), locale: 'tr' }))).status).toBe(400)
    expect((await submit(request({ answers: allCorrect(), locale: 'fr' }))).status).toBe(400)
  })

  it('scores on the server and e-mails the result to the account address', async () => {
    signIn(userId)
    const res = await submit(request({ answers: allCorrect(), locale: 'de' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ level: 'C2', correct: 50, total: 50, emailSent: true })

    // The address comes from the database, never from the request or session.
    expect(sendPlacementResultEmail).toHaveBeenCalledWith(
      EMAIL,
      'Placement <b>Tester</b>',
      'de',
      expect.objectContaining({ level: 'C2' }),
      expect.any(String)
    )
  })

  it('still returns the result when the e-mail fails', async () => {
    signIn(userId)
    vi.mocked(sendPlacementResultEmail).mockRejectedValueOnce(new Error('mail down'))
    const res = await submit(request({ answers: PLACEMENT_QUESTIONS.map(() => -1), locale: 'en' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ level: null, recommended: 'A1', emailSent: false })
  })

  it('limits submissions per member so it cannot be used to flood an inbox', async () => {
    signIn(userId)
    for (let i = 0; i < LIMITS.placementTest.max; i++) {
      expect((await submit(request({ answers: allCorrect(), locale: 'tr' }))).status).toBe(200)
    }
    expect((await submit(request({ answers: allCorrect(), locale: 'tr' }))).status).toBe(429)
    expect(sendPlacementResultEmail).toHaveBeenCalledTimes(LIMITS.placementTest.max)
  })
})
