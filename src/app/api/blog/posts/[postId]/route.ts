import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canDelete, deleteBlobs, requireUserApi } from '@/lib/blogServer'

export async function DELETE(_request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const auth = await requireUserApi()
  if ('error' in auth) return auth.error

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { authorId: true, attachments: { select: { url: true } } },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canDelete(auth.session, post.authorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Answers, attachments rows and reports cascade with the post.
  await prisma.blogPost.delete({ where: { id: postId } })
  await deleteBlobs(post.attachments.map((attachment) => attachment.url))

  return new NextResponse(null, { status: 204 })
}
