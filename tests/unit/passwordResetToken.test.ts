import { describe, it, expect } from 'vitest'
import { generateResetToken, hashResetToken } from '@/lib/passwordResetToken'

describe('generateResetToken', () => {
  it('returns a token whose hash matches hashResetToken(token)', () => {
    const { token, tokenHash } = generateResetToken()
    expect(hashResetToken(token)).toBe(tokenHash)
  })

  it('sets expiresAt to 1 hour from now', () => {
    const before = Date.now()
    const { expiresAt } = generateResetToken()
    const after = Date.now()
    const oneHourMs = 60 * 60 * 1000
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + oneHourMs - 1000)
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + oneHourMs + 1000)
  })

  it('generates a different token each call', () => {
    const a = generateResetToken()
    const b = generateResetToken()
    expect(a.token).not.toBe(b.token)
  })
})

describe('hashResetToken', () => {
  it('is deterministic for the same input', () => {
    expect(hashResetToken('abc')).toBe(hashResetToken('abc'))
  })

  it('differs for different input', () => {
    expect(hashResetToken('abc')).not.toBe(hashResetToken('xyz'))
  })
})
