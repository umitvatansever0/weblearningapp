import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { del } from '@vercel/blob'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { RATE_LIMITS, rateLimitSince } from '@/lib/blog'

/** Any signed-in member; 401 otherwise. */
export async function requireUserApi(): Promise<{ session: Session } | { error: NextResponse }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session }
}

/** Authors may delete their own content; admins may delete anything. */
export function canDelete(session: Session, authorId: string): boolean {
  return session.user.id === authorId || isAdmin(session)
}

/** Returns a 429 response when the member exceeded the write limit, else null. */
export async function checkRateLimit(
  kind: keyof typeof RATE_LIMITS,
  userId: string
): Promise<NextResponse | null> {
  const since = rateLimitSince(kind)
  const where = { createdAt: { gte: since } }
  const count =
    kind === 'post'
      ? await prisma.blogPost.count({ where: { ...where, authorId: userId } })
      : kind === 'answer'
        ? await prisma.blogAnswer.count({ where: { ...where, authorId: userId } })
        : await prisma.blogReport.count({ where: { ...where, reporterId: userId } })
  if (count >= RATE_LIMITS[kind].max) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }
  return null
}

/**
 * Best-effort removal of a post's files from Vercel Blob. The database row is
 * the source of truth, so a storage failure is logged and never blocks the
 * deletion of the post itself.
 */
export async function deleteBlobs(urls: string[]): Promise<void> {
  if (urls.length === 0 || !process.env.BLOB_READ_WRITE_TOKEN) return
  try {
    await del(urls)
  } catch (error) {
    console.error('[blog] failed to delete blobs:', error)
  }
}
