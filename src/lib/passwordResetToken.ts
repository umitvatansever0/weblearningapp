import { randomBytes, createHash } from 'crypto'

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateResetToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  }
}
