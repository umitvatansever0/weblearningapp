import { NextResponse } from 'next/server'
import { cleanupOrphanedBlogUploads } from '@/lib/blogCleanup'
import { pruneRateLimitHits } from '@/lib/rateLimit'

// Monthly Vercel Cron job (see vercel.json): removes orphaned blog uploads and
// old rate-limit counters. Vercel sends
// `Authorization: Bearer <CRON_SECRET>`; without a configured secret the job
// refuses to run so the endpoint can never be triggered anonymously.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uploads = await cleanupOrphanedBlogUploads()
  const prunedRateLimitHits = await pruneRateLimitHits()
  const result = { ...uploads, prunedRateLimitHits }
  console.log('[cron] monthly cleanup:', result)
  return NextResponse.json(result)
}
