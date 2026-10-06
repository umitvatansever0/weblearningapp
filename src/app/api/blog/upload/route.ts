import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { authOptions } from '@/lib/auth'
import { ALLOWED_CONTENT_TYPES, MAX_UPLOAD_BYTES, uploadPrefixFor } from '@/lib/blog'
import { consume } from '@/lib/rateLimit'

// Issues short-lived client tokens so the browser uploads files straight to
// Vercel Blob (bypassing the 4.5 MB function body limit). A token is only
// granted to a signed-in member, only for a path inside that member's own
// folder, and only for the allowed file types and sizes. Per-type size limits
// (images 5 MB, documents 10 MB) are re-checked when the post is created.
export async function POST(request: Request) {
  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) throw new Error('Unauthorized')
        const prefix = uploadPrefixFor(session.user.id)
        if (!pathname.startsWith(prefix) || pathname.includes('..')) {
          throw new Error('Invalid upload path')
        }
        // Each token allows one file; cap tokens per member so nobody can
        // fill the storage quota with junk uploads.
        if (await consume('blogUpload', session.user.id)) throw new Error('Too many uploads')
        return {
          allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status = message === 'Unauthorized' ? 401 : message === 'Too many uploads' ? 429 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
