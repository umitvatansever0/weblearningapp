import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { blogPostInputSchema } from '@/lib/validation'
import { checkFile, isOwnBlobUpload } from '@/lib/blog'
import { checkRateLimit, requireUserApi } from '@/lib/blogServer'

export async function POST(request: Request) {
  const auth = await requireUserApi()
  if ('error' in auth) return auth.error
  const userId = auth.session.user.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = blogPostInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // Attachments were uploaded straight to Blob by the browser; only accept
  // files that sit in this member's own folder and respect the type limits.
  for (const attachment of parsed.data.attachments) {
    if (!isOwnBlobUpload(attachment.url, attachment.pathname, userId)) {
      return NextResponse.json({ error: 'Invalid attachment' }, { status: 400 })
    }
    if (!checkFile(attachment.contentType, attachment.size).ok) {
      return NextResponse.json({ error: 'File type or size not allowed' }, { status: 400 })
    }
  }

  const limited = await checkRateLimit('post', userId)
  if (limited) return limited

  const { title, body: text, attachments } = parsed.data
  const post = await prisma.blogPost.create({
    data: {
      authorId: userId,
      title,
      body: text,
      attachments: { create: attachments },
    },
    select: { id: true },
  })

  return NextResponse.json(post, { status: 201 })
}
