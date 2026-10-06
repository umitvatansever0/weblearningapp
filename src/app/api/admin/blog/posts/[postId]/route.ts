import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { blogModerationSchema } from '@/lib/validation'

// Hide or unhide a post. Hiding also resolves its open reports.
export async function PATCH(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error
  const { postId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = blogModerationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const post = await prisma.blogPost.findUnique({ where: { id: postId }, select: { id: true } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.blogPost.update({ where: { id: postId }, data: { hidden: parsed.data.hidden } }),
    ...(parsed.data.hidden
      ? [prisma.blogReport.updateMany({ where: { postId, resolvedAt: null }, data: { resolvedAt: new Date() } })]
      : []),
  ])
  return NextResponse.json({ id: postId, hidden: parsed.data.hidden })
}
