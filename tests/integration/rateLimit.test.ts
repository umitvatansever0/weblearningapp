import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { authorizeUser } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'
import { LIMITS } from '@/lib/rateLimit'
import { POST as register } from '@/app/api/register/route'
import { POST as resetRequest } from '@/app/api/password-reset/request/route'

vi.mock('@/lib/email', () => ({ sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined) }))

const EMAIL = 'ratelimit-test@example.com'
const PASSWORD = 'Sup3rSecret!'
// Unique per run so counters from other runs/tests never interfere.
const RUN = Date.now().toString(36)
const ip = (name: string) => `203.0.113.${name}-${RUN}`

function jsonRequest(url: string, body: unknown, forwardedFor: string) {
  return new Request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': forwardedFor },
  })
}

describe('abuse protection (rate limits)', () => {
  vi.setConfig({ testTimeout: 60000 })
  let userId: string

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } })
    await prisma.rateLimitHit.deleteMany({ where: { key: { contains: EMAIL } } })
    const user = await prisma.user.create({
      data: { email: EMAIL, passwordHash: await hashPassword(PASSWORD), name: 'Rate Limit Test' },
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.rateLimitHit.deleteMany({ where: { OR: [{ key: { contains: RUN } }, { key: { contains: EMAIL } }] } })
    await prisma.passwordResetToken.deleteMany({ where: { userId } })
    await prisma.user.deleteMany({ where: { email: EMAIL } })
    await prisma.$disconnect()
  })

  it('locks an account after too many wrong passwords, even for the right one', async () => {
    const attacker = ip('1')
    for (let i = 0; i < LIMITS.loginEmail.max; i++) {
      expect(await authorizeUser(EMAIL, `wrong-${i}`, attacker)).toBeNull()
    }
    // Correct password from another IP is still refused during the lockout.
    expect(await authorizeUser(EMAIL, PASSWORD, ip('2'))).toBeNull()

    await prisma.rateLimitHit.deleteMany({ where: { key: { contains: EMAIL } } })
    expect(await authorizeUser(EMAIL, PASSWORD, ip('2'))).not.toBeNull()
  })

  it('caps sign-ups per IP', async () => {
    const signupIp = ip('3')
    for (let i = 0; i < LIMITS.registerIp.max; i++) {
      // Invalid bodies still count as attempts but create no accounts.
      const res = await register(jsonRequest('http://localhost/api/register', {}, signupIp))
      expect(res.status).toBe(400)
    }
    const blocked = await register(jsonRequest('http://localhost/api/register', {}, signupIp))
    expect(blocked.status).toBe(429)
  })

  it('stops mail-bombing one address without revealing anything', async () => {
    const statuses: number[] = []
    for (let i = 0; i < LIMITS.resetEmail.max + 2; i++) {
      const res = await resetRequest(
        jsonRequest('http://localhost/api/password-reset/request', { email: EMAIL }, ip(`r${i}`))
      )
      statuses.push(res.status)
    }
    // Every response looks identical…
    expect(new Set(statuses)).toEqual(new Set([200]))
    // …but only the allowed number of reset e-mails/tokens was created.
    expect(await prisma.passwordResetToken.count({ where: { userId } })).toBe(LIMITS.resetEmail.max)
  })
})
