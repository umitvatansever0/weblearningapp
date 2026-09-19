import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/password-reset/request', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/password-reset/request', () => {
  const email = 'reset-request-test@example.com'

  beforeAll(async () => {
    await prisma.user.create({
      data: { email, passwordHash: await hashPassword('OldPassword1!'), name: 'Reset Test' },
    })
  })

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { email } })
    }
    await prisma.$disconnect()
  })

  it('returns 200 with a generic message for an existing email', async () => {
    const { POST } = await import('@/app/api/password-reset/request/route')
    const res = await POST(makeRequest({ email }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe('If that email is registered, a reset link has been sent.')
  })

  it('returns the identical 200 message for a non-existent email', async () => {
    const { POST } = await import('@/app/api/password-reset/request/route')
    const res = await POST(makeRequest({ email: 'nobody-here@example.com' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe('If that email is registered, a reset link has been sent.')
  })

  it('creates a PasswordResetToken row for an existing email', async () => {
    const { POST } = await import('@/app/api/password-reset/request/route')
    await POST(makeRequest({ email }))
    const user = await prisma.user.findUniqueOrThrow({ where: { email } })
    const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id } })
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('rejects an invalid email with 400', async () => {
    const { POST } = await import('@/app/api/password-reset/request/route')
    const res = await POST(makeRequest({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })
})
