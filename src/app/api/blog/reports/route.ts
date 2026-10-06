import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { blogReportInputSchema } from '@/lib/validation'
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
  const parsed = blogReportInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { postId, answerId, reason } = parsed.data

  const exists = postId
    ? await prisma.blogPost.findUnique({ where: { id: postId }, select: { id: true } })
    : await prisma.blogAnswer.findUnique({ where: { id: answerId }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const limited = await checkRateLimit('report', userId)
  if (limited) return limited

  try {
    await prisma.blogReport.create({ data: { reporterId: userId, postId, answerId, reason } })
  } catch (error) {
    // The member already reported this item — treat it as success.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ reported: true })
    }
    throw error
  }
  return NextResponse.json({ reported: true }, { status: 201 })
}
