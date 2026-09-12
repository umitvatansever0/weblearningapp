import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('User model', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'schema-test@example.com' } })
    await prisma.$disconnect()
  })

  it('creates and retrieves a user with default role and uiLanguage', async () => {
    const created = await prisma.user.create({
      data: {
        email: 'schema-test@example.com',
        passwordHash: 'hashed-placeholder',
        name: 'Schema Test',
      },
    })

    expect(created.role).toBe('USER')
    expect(created.uiLanguage).toBe('EN')

    const found = await prisma.user.findUnique({ where: { email: 'schema-test@example.com' } })
    expect(found?.name).toBe('Schema Test')
  })
})
