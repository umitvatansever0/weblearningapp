import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { blogAnswerInputSchema } from '@/lib/validation'
import { checkRateLimit, requireUserApi } from '@/lib/blogServer'

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const auth = await requireUserApi()
  if ('error' in auth) return auth.error
  const userId = auth.session.user.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = blogAnswerInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const post = await prisma.blogPost.findUnique({ where: { id: postId }, select: { hidden: true } })
  if (!post || post.hidden) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const limited = await checkRateLimit('answer', userId)
  if (limited) return limited

  const answer = await prisma.blogAnswer.create({
    data: { postId, authorId: userId, body: parsed.data.body },
    select: { id: true },
  })
  return NextResponse.json(answer, { status: 201 })
}
