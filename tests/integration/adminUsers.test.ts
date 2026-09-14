import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { GET } from '@/app/api/admin/users/route'
import { PATCH } from '@/app/api/admin/users/[userId]/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function adminSession(userId: string) {
  return { user: { id: userId, role: 'ADMIN' } } as never
}

describe('admin users API', () => {
  vi.setConfig({ testTimeout: 30000 })
  let adminId: string
  let plainUserId: string

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: 'admin-users-test-admin@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Admin User',
        role: 'ADMIN',
      },
    })
    adminId = admin.id

    const plain = await prisma.user.create({
      data: {
        email: 'admin-users-test-plain@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Plain User',
      },
    })
    plainUserId = plain.id
  })

  afterAll(async () => {
    if (adminId && plainUserId) {
      await prisma.user.deleteMany({ where: { id: { in: [adminId, plainUserId] } } })
    }
    await prisma.$disconnect()
  })

  describe('GET /api/admin/users', () => {
    it('rejects unauthenticated requests with 401', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)
      const res = await GET()
      expect(res.status).toBe(401)
    })

    it('rejects non-admin requests with 403', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: plainUserId, role: 'USER' } } as never)
      const res = await GET()
      expect(res.status).toBe(403)
    })

    it('returns the user list for an admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(adminSession(adminId))
      const res = await GET()
      expect(res.status).toBe(200)
      const json = await res.json()
      const emails = json.map((u: { email: string }) => u.email)
      expect(emails).toContain('admin-users-test-admin@example.com')
      expect(emails).toContain('admin-users-test-plain@example.com')
    })
  })

  describe('PATCH /api/admin/users/[userId]', () => {
    it('rejects non-admin requests with 403', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: plainUserId, role: 'USER' } } as never)
      const req = new Request('http://localhost/api/admin/users/x', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'ADMIN' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ userId: plainUserId }) })
      expect(res.status).toBe(403)
    })

    it('updates a target user role to ADMIN', async () => {
      vi.mocked(getServerSession).mockResolvedValue(adminSession(adminId))
      const req = new Request('http://localhost/api/admin/users/x', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'ADMIN' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ userId: plainUserId }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.role).toBe('ADMIN')

      const stored = await prisma.user.findUniqueOrThrow({ where: { id: plainUserId } })
      expect(stored.role).toBe('ADMIN')
    })

    it('rejects an invalid role value with 400', async () => {
      vi.mocked(getServerSession).mockResolvedValue(adminSession(adminId))
      const req = new Request('http://localhost/api/admin/users/x', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'SUPERUSER' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ userId: plainUserId }) })
      expect(res.status).toBe(400)
    })

    it('rejects an admin removing their own admin role', async () => {
      vi.mocked(getServerSession).mockResolvedValue(adminSession(adminId))
      const req = new Request('http://localhost/api/admin/users/x', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'USER' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ userId: adminId }) })
      expect(res.status).toBe(400)
    })
  })
})
