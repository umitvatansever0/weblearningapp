import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/password'
import { generateResetToken, hashResetToken } from '@/lib/passwordResetToken'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/password-reset/confirm', () => {
  const email = 'reset-confirm-test@example.com'
  let userId: string

  beforeEach(async () => {
    await prisma.passwordResetToken.deleteMany({
      where: { user: { email } },
    })
    await prisma.user.deleteMany({ where: { email } })
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword('OldPassword1!'), name: 'Confirm Test' },
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId } })
    await prisma.user.deleteMany({ where: { email } })
    await prisma.$disconnect()
  })

  it('resets the password with a valid token and returns 200', async () => {
    const { token, tokenHash, expiresAt } = generateResetToken()
    await prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } })

    const { POST } = await import('@/app/api/password-reset/confirm/route')
    const res = await POST(makeRequest({ token, password: 'NewPassword1!' }))

    expect(res.status).toBe(200)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(await verifyPassword('NewPassword1!', user.passwordHash)).toBe(true)
  })

  it('marks the token as used after a successful reset', async () => {
    const { token, tokenHash, expiresAt } = generateResetToken()
    await prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } })

    const { POST } = await import('@/app/api/password-reset/confirm/route')
    await POST(makeRequest({ token, password: 'NewPassword1!' }))

    const record = await prisma.passwordResetToken.findUniqueOrThrow({ where: { tokenHash } })
    expect(record.usedAt).not.toBeNull()
  })

  it('rejects a reused token with 400', async () => {
    const { token, tokenHash, expiresAt } = generateResetToken()
    await prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } })

    const { POST } = await import('@/app/api/password-reset/confirm/route')
    await POST(makeRequest({ token, password: 'NewPassword1!' }))
    const res = await POST(makeRequest({ token, password: 'AnotherPassword1!' }))

    expect(res.status).toBe(400)
  })

  it('rejects an expired token with 400', async () => {
    const tokenHash = hashResetToken('expired-token-value')
    await prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt: new Date(Date.now() - 1000) },
    })

    const { POST } = await import('@/app/api/password-reset/confirm/route')
    const res = await POST(makeRequest({ token: 'expired-token-value', password: 'NewPassword1!' }))

    expect(res.status).toBe(400)
  })

  it('rejects an unknown token with 400', async () => {
    const { POST } = await import('@/app/api/password-reset/confirm/route')
    const res = await POST(makeRequest({ token: 'never-issued', password: 'NewPassword1!' }))
    expect(res.status).toBe(400)
  })

  it('rejects a short new password with 400', async () => {
    const { token, tokenHash, expiresAt } = generateResetToken()
    await prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } })

    const { POST } = await import('@/app/api/password-reset/confirm/route')
    const res = await POST(makeRequest({ token, password: 'short' }))

    expect(res.status).toBe(400)
  })
})
