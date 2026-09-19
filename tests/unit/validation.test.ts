import { describe, it, expect } from 'vitest'
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validation'

describe('forgotPasswordSchema', () => {
  it('accepts a valid email and lowercases it', () => {
    const result = forgotPasswordSchema.parse({ email: 'User@Example.com' })
    expect(result.email).toBe('user@example.com')
  })

  it('rejects an invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts a token and a password of at least 8 characters', () => {
    const result = resetPasswordSchema.parse({ token: 'abc123', password: 'Sup3rSecret!' })
    expect(result.token).toBe('abc123')
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(
      resetPasswordSchema.safeParse({ token: 'abc123', password: 'short' }).success
    ).toBe(false)
  })

  it('rejects a missing token', () => {
    expect(resetPasswordSchema.safeParse({ password: 'Sup3rSecret!' }).success).toBe(false)
  })
})
