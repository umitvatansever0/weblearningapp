import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const cleanup = vi.hoisted(() => vi.fn())
vi.mock('@/lib/blogCleanup', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/blogCleanup')>()
  return { ...actual, cleanupOrphanedBlogUploads: cleanup }
})

import { ORPHAN_MIN_AGE_MS, selectOrphans } from '@/lib/blogCleanup'
import { GET } from '@/app/api/cron/blog-cleanup/route'

const now = new Date('2026-10-01T03:00:00Z')
const old = new Date(now.getTime() - ORPHAN_MIN_AGE_MS - 1000)
const fresh = new Date(now.getTime() - 60 * 60 * 1000)

describe('selectOrphans', () => {
  it('deletes only old blobs that no post references', () => {
    const blobs = [
      { url: 'https://s.public.blob.vercel-storage.com/blog/u/attached.png', uploadedAt: old },
      { url: 'https://s.public.blob.vercel-storage.com/blog/u/orphan.png', uploadedAt: old },
      { url: 'https://s.public.blob.vercel-storage.com/blog/u/still-writing.png', uploadedAt: fresh },
    ]
    const attached = new Set([blobs[0].url])
    expect(selectOrphans(blobs, attached, now)).toEqual([blobs[1].url])
  })

  it('returns nothing for an empty store', () => {
    expect(selectOrphans([], new Set(), now)).toEqual([])
  })
})

describe('GET /api/cron/blog-cleanup', () => {
  const original = process.env.CRON_SECRET

  beforeEach(() => {
    cleanup.mockReset()
    cleanup.mockResolvedValue({ scanned: 3, deleted: 1 })
  })
  afterEach(() => {
    process.env.CRON_SECRET = original
  })

  function request(authorization?: string) {
    return new Request('http://localhost/api/cron/blog-cleanup', {
      headers: authorization ? { authorization } : {},
    })
  }

  it('refuses to run without a configured secret', async () => {
    delete process.env.CRON_SECRET
    expect((await GET(request('Bearer anything'))).status).toBe(500)
    expect(cleanup).not.toHaveBeenCalled()
  })

  it('rejects requests without the right bearer token', async () => {
    process.env.CRON_SECRET = 'test-secret'
    expect((await GET(request())).status).toBe(401)
    expect((await GET(request('Bearer wrong'))).status).toBe(401)
    expect(cleanup).not.toHaveBeenCalled()
  })

  it('runs the cleanup for Vercel Cron', async () => {
    process.env.CRON_SECRET = 'test-secret'
    const res = await GET(request('Bearer test-secret'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ scanned: 3, deleted: 1 })
    expect(cleanup).toHaveBeenCalledOnce()
  })
})
