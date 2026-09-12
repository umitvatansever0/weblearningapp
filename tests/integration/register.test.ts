import { describe, it, expect, afterAll } from 'vitest'
import { POST } from '@/app/api/register/route'
import { prisma } from '@/lib/prisma'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/register', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'register-test@example.com' } })
    await prisma.$disconnect()
  })

  it('creates a new user and returns 201', async () => {
    const res = await POST(makeRequest({
      email: 'register-test@example.com',
      password: 'Sup3rSecret!',
      name: 'Register Test',
    }))

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.email).toBe('register-test@example.com')
  })

  it('rejects a duplicate email with 409', async () => {
    const res = await POST(makeRequest({
      email: 'register-test@example.com',
      password: 'Sup3rSecret!',
      name: 'Register Test',
    }))

    expect(res.status).toBe(409)
  })

  it('rejects a short password with 400', async () => {
    const res = await POST(makeRequest({
      email: 'another@example.com',
      password: 'short',
      name: 'Someone',
    }))

    expect(res.status).toBe(400)
  })
})
