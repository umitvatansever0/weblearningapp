import { prisma } from '@/lib/prisma'

/**
 * Database-backed sliding-window rate limiting for unauthenticated endpoints
 * (login, registration, password reset). Each counted attempt is one row in
 * RateLimitHit; a key is limited once it has `max` rows inside `windowMs`.
 */

const MINUTE = 60 * 1000

export const LIMITS = {
  /** Failed logins per account – slows down password guessing. */
  loginEmail: { max: 10, windowMs: 15 * MINUTE },
  /** Failed logins per IP – slows down credential stuffing across accounts. */
  loginIp: { max: 30, windowMs: 15 * MINUTE },
  /** New accounts per IP. */
  registerIp: { max: 5, windowMs: 60 * MINUTE },
  /** Reset e-mails per address – stops mail-bombing a victim. */
  resetEmail: { max: 3, windowMs: 60 * MINUTE },
  /** Reset requests per IP. */
  resetIp: { max: 10, windowMs: 60 * MINUTE },
  /** "Someone tried to sign up with your address" e-mails per address. */
  accountExistsEmail: { max: 2, windowMs: 60 * MINUTE },
  /** Reset confirmations per IP. */
  resetConfirmIp: { max: 20, windowMs: 60 * MINUTE },
  /** Community blog, per member. Counted attempts survive deleting content. */
  blogPost: { max: 5, windowMs: 60 * MINUTE },
  blogAnswer: { max: 30, windowMs: 60 * MINUTE },
  blogReport: { max: 20, windowMs: 60 * MINUTE },
  /** Upload tokens per member – protects Blob storage quota and costs. */
  blogUpload: { max: 30, windowMs: 60 * MINUTE },
} as const

export type LimitName = keyof typeof LIMITS

/**
 * Best-effort client IP. On Vercel `x-forwarded-for` is set by the platform
 * edge (the left-most entry is the real client), so it cannot be spoofed to
 * bypass the limit.
 */
export function clientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined
    const value = headers[name]
    return Array.isArray(value) ? value[0] : value
  }
  const forwarded = get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || get('x-real-ip')?.trim() || 'unknown'
}

export function limitKey(name: LimitName, subject: string): string {
  return `${name}:${subject.toLowerCase()}`
}

/** True when the key already used up its quota in the current window. */
export async function isLimited(name: LimitName, subject: string, now = new Date()): Promise<boolean> {
  const { max, windowMs } = LIMITS[name]
  const count = await prisma.rateLimitHit.count({
    where: { key: limitKey(name, subject), createdAt: { gte: new Date(now.getTime() - windowMs) } },
  })
  return count >= max
}

/** Count one attempt against the key. */
export async function recordHit(name: LimitName, subject: string): Promise<void> {
  await prisma.rateLimitHit.create({ data: { key: limitKey(name, subject) } })
}

/** Check-and-count in one call: returns true if the request must be refused. */
export async function consume(name: LimitName, subject: string): Promise<boolean> {
  if (await isLimited(name, subject)) return true
  await recordHit(name, subject)
  return false
}

/** Delete hits older than the longest window (called by the monthly cron). */
export async function pruneRateLimitHits(now = new Date()): Promise<number> {
  const result = await prisma.rateLimitHit.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * MINUTE) } },
  })
  return result.count
}
