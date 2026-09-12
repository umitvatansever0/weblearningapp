import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { authorizeUser } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'

describe('authorizeUser', () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        email: 'auth-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Auth Test',
      },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'auth-test@example.com' } })
    await prisma.$disconnect()
  })

  it('returns the user for correct credentials', async () => {
    const result = await authorizeUser('auth-test@example.com', 'Sup3rSecret!')
    expect(result?.email).toBe('auth-test@example.com')
  })

  it('returns null for wrong password', async () => {
    const result = await authorizeUser('auth-test@example.com', 'WrongPassword')
    expect(result).toBeNull()
  })

  it('returns null for unknown email', async () => {
    const result = await authorizeUser('nobody@example.com', 'whatever')
    expect(result).toBeNull()
  })
})
