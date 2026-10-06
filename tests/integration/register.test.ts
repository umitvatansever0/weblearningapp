import { beforeAll, describe, it, expect, afterAll, vi } from 'vitest'
import { POST } from '@/app/api/register/route'
import { prisma } from '@/lib/prisma'
import { sendAccountExistsEmail, sendWelcomeEmail } from '@/lib/email'

vi.mock('@/lib/email', () => ({
  sendAccountExistsEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}))

// Each request comes from its own IP so the per-IP sign-up limit (tested in
// rateLimit.test.ts) doesn't interfere with these functional checks.
let requestCount = 0
const RUN = Date.now().toString(36)
function testIp() {
  return `192.0.2.${++requestCount}-${RUN}`
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp() },
  })
}

describe('POST /api/register', () => {
  beforeAll(async () => {
    // Rate-limit counters left by earlier runs (no IP header → "unknown",
    // test e-mails @example.com) must not throttle this run.
    await prisma.rateLimitHit.deleteMany({
      where: { OR: [{ key: { endsWith: ':unknown' } }, { key: { contains: '@example.com' } }] },
    })
    await prisma.user.deleteMany({ where: { email: { in: ['register-test@example.com', 'register-other-new@example.com', 'register-tr@example.com'] } } })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: ['register-test@example.com', 'register-other-new@example.com', 'register-tr@example.com'] } } })
    await prisma.rateLimitHit.deleteMany({ where: { key: { contains: RUN } } })
    await prisma.$disconnect()
  })

  it('creates a new user and returns 201', async () => {
    const res = await POST(makeRequest({
      email: 'register-test@example.com',
      password: 'Sup3rSecret!',
      name: 'Register Test',
    }))

    expect(res.status).toBe(201)
    expect(await prisma.user.count({ where: { email: 'register-test@example.com' } })).toBe(1)
    expect(vi.mocked(sendWelcomeEmail)).toHaveBeenCalledWith('register-test@example.com', 'Register Test', 'en', expect.any(String))
  })

  it('stores the sign-up language and welcomes the member in it', async () => {
    vi.mocked(sendWelcomeEmail).mockClear()
    const res = await POST(makeRequest({
      email: 'register-tr@example.com',
      password: 'Sup3rSecret!',
      name: 'Türkçe Üye',
      locale: 'tr',
    }))

    expect(res.status).toBe(201)
    const user = await prisma.user.findUnique({ where: { email: 'register-tr@example.com' } })
    expect(user?.uiLanguage).toBe('TR')
    expect(vi.mocked(sendWelcomeEmail)).toHaveBeenCalledWith('register-tr@example.com', 'Türkçe Üye', 'tr', expect.any(String))
  })

  it('answers a duplicate email exactly like a new sign-up and e-mails the owner instead', async () => {
    const fresh = await POST(makeRequest({
      email: 'register-other-new@example.com',
      password: 'Sup3rSecret!',
      name: 'Another New',
    }))
    vi.mocked(sendWelcomeEmail).mockClear()
    const duplicate = await POST(makeRequest({
      email: 'register-test@example.com',
      password: 'Different1!',
      name: 'Imposter',
    }))

    // Same status and same body – nothing reveals that the address exists.
    expect(duplicate.status).toBe(fresh.status)
    expect(await duplicate.json()).toEqual(await fresh.json())

    // No second account, the original password is untouched, the owner is told.
    expect(await prisma.user.count({ where: { email: 'register-test@example.com' } })).toBe(1)
    expect(vi.mocked(sendAccountExistsEmail)).toHaveBeenCalledWith('register-test@example.com', 'en', expect.any(String))
    // An existing address never gets a second welcome e-mail.
    expect(vi.mocked(sendWelcomeEmail)).not.toHaveBeenCalledWith('register-test@example.com', expect.anything(), expect.anything(), expect.anything())
  })

  it('rejects a short password with 400', async () => {
    const res = await POST(makeRequest({
      email: 'another@example.com',
      password: 'short',
      name: 'Someone',
    }))

    expect(res.status).toBe(400)
  })

  it('treats a duplicate email that differs only in casing as the same address', async () => {
    const res = await POST(makeRequest({
      email: 'Register-Test@Example.com',
      password: 'Sup3rSecret!',
      name: 'Register Test',
    }))

    expect(res.status).toBe(201)
    expect(await prisma.user.count({ where: { email: 'register-test@example.com' } })).toBe(1)
  })

  it('rejects a malformed JSON body with 400', async () => {
    const res = await POST(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: '{not valid json',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp() },
      })
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid JSON body')
  })
})
