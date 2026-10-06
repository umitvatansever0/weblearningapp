import { describe, it, expect } from 'vitest'
import { isReservedName, registerSchema } from '@/lib/validation'

const valid = { email: 'learner@example.com', password: 'Sup3rSecret!', name: 'Ayşe' }

describe('registerSchema hardening', () => {
  it('accepts a normal sign-up', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects names that impersonate staff or the site', () => {
    for (const name of ['Admin', 'A.d-m_i n', 'DeutschStep Team', 'Site Yönetici', 'moderator42', 'Support']) {
      expect(isReservedName(name)).toBe(true)
      expect(registerSchema.safeParse({ ...valid, name }).success).toBe(false)
    }
    expect(isReservedName('Mehmet')).toBe(false)
  })

  it('caps the length of name, e-mail and password', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'x'.repeat(51) }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, password: 'p'.repeat(129) }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, email: `${'a'.repeat(250)}@example.com` }).success).toBe(false)
  })

  it('rejects a whitespace-only name', () => {
    expect(registerSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false)
  })
})
