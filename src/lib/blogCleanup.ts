import { del, list } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

/**
 * Orphaned blog uploads: files a member uploaded in the new-post form but
 * never attached to a published post (form abandoned, file removed again).
 * A grace period keeps files that belong to a post still being written.
 */
export const ORPHAN_MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000
const BLOG_PREFIX = 'blog/'

export interface StoredBlob {
  url: string
  uploadedAt: Date
}

/** Blobs that are older than the grace period and not referenced by any post. */
export function selectOrphans(
  blobs: StoredBlob[],
  attachedUrls: ReadonlySet<string>,
  now: Date,
  minAgeMs = ORPHAN_MIN_AGE_MS
): string[] {
  const cutoff = now.getTime() - minAgeMs
  return blobs
    .filter((blob) => blob.uploadedAt.getTime() < cutoff && !attachedUrls.has(blob.url))
    .map((blob) => blob.url)
}

export interface CleanupResult {
  scanned: number
  deleted: number
}

/** Scan every blog upload in the Blob store and delete the orphans. */
export async function cleanupOrphanedBlogUploads(now = new Date()): Promise<CleanupResult> {
  let scanned = 0
  let deleted = 0
  let cursor: string | undefined

  do {
    const page = await list({ prefix: BLOG_PREFIX, limit: 1000, cursor })
    scanned += page.blobs.length

    // Look up only this page's URLs instead of loading every attachment.
    const attached = await prisma.blogAttachment.findMany({
      where: { url: { in: page.blobs.map((blob) => blob.url) } },
      select: { url: true },
    })
    const orphans = selectOrphans(page.blobs, new Set(attached.map((row) => row.url)), now)
    if (orphans.length > 0) {
      await del(orphans)
      deleted += orphans.length
    }

    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)

  return { scanned, deleted }
}
