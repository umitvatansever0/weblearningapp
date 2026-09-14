import { describe, it, expect, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { isAdmin, requireAdminApi } from '@/lib/adminAuth'
import type { Session } from 'next-auth'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function sessionWithRole(role: string): Session {
  return { user: { id: 'u1', role }, expires: '2099-01-01' } as Session
}

describe('isAdmin', () => {
  it('returns true for a session with role ADMIN', () => {
    expect(isAdmin(sessionWithRole('ADMIN'))).toBe(true)
  })

  it('returns false for a session with role USER', () => {
    expect(isAdmin(sessionWithRole('USER'))).toBe(false)
  })

  it('returns false for a null session', () => {
    expect(isAdmin(null)).toBe(false)
  })
})

describe('requireAdminApi', () => {
  it('returns a 401 error response when there is no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const result = await requireAdminApi()
    expect('error' in result).toBe(true)
    if ('error' in result) expect(result.error.status).toBe(401)
  })

  it('returns a 403 error response when the session is not an admin', async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionWithRole('USER') as never)
    const result = await requireAdminApi()
    expect('error' in result).toBe(true)
    if ('error' in result) expect(result.error.status).toBe(403)
  })

  it('returns the session when the user is an admin', async () => {
    const session = sessionWithRole('ADMIN')
    vi.mocked(getServerSession).mockResolvedValue(session as never)
    const result = await requireAdminApi()
    expect('session' in result).toBe(true)
    if ('session' in result) expect(result.session).toEqual(session)
  })
})
