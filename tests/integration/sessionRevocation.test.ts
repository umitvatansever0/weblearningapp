import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { JWT } from 'next-auth/jwt'
import { authOptions, authorizeUser, SessionRevokedError } from '@/lib/auth'
import { POST as confirmReset } from '@/app/api/password-reset/confirm/route'
import { generateResetToken } from '@/lib/passwordResetToken'
import { hashPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'

const EMAIL = 'session-revocation@example.com'
const jwt = authOptions.callbacks!.jwt!

async function signIn(password: string): Promise<JWT> {
  const user = await authorizeUser(EMAIL, password, `198.51.100.${Date.now()}`)
  expect(user).not.toBeNull()
  return jwt({ token: {} as JWT, user: user as never, account: null } as never) as Promise<JWT>
}

function refresh(token: JWT) {
  return jwt({ token, account: null } as never)
}

describe('session revocation', () => {
  let userId: string

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } })
    await prisma.rateLimitHit.deleteMany({ where: { key: { contains: EMAIL } } })
    const user = await prisma.user.create({
      data: { email: EMAIL, passwordHash: await hashPassword('OldPassw0rd!'), name: 'Session Test' },
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId } })
    await prisma.user.deleteMany({ where: { email: EMAIL } })
    await prisma.$disconnect()
  })

  it('keeps a valid session working and refreshes the role from the database', async () => {
    const token = await signIn('OldPassw0rd!')
    await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } })
    expect((await refresh(token)).role).toBe('ADMIN')
    await prisma.user.update({ where: { id: userId }, data: { role: 'USER' } })
    expect((await refresh(token)).role).toBe('USER')
  })

  it('treats tokens issued before session versions existed as version 0', async () => {
    const token = await signIn('OldPassw0rd!')
    delete token.sv
    await expect(refresh(token)).resolves.toBeTruthy()
  })

  it('ends every existing session when the password is reset', async () => {
    const laptop = await signIn('OldPassw0rd!')
    const phone = await signIn('OldPassw0rd!')

    const { token, tokenHash, expiresAt } = generateResetToken()
    await prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } })
    const res = await confirmReset(
      new Request('http://localhost/api/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `198.51.100.reset-${Date.now()}` },
        body: JSON.stringify({ token, password: 'NewPassw0rd!' }),
      })
    )
    expect(res.status).toBe(200)

    await expect(refresh(laptop)).rejects.toBeInstanceOf(SessionRevokedError)
    await expect(refresh(phone)).rejects.toBeInstanceOf(SessionRevokedError)

    // Signing in again with the new password gives a working session.
    const fresh = await signIn('NewPassw0rd!')
    await expect(refresh(fresh)).resolves.toBeTruthy()
  })

  it('ends the session of a deleted account', async () => {
    const token = await signIn('NewPassw0rd!')
    await prisma.passwordResetToken.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    await expect(refresh(token)).rejects.toBeInstanceOf(SessionRevokedError)
  })
})
