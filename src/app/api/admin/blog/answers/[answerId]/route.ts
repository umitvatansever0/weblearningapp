import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { blogModerationSchema } from '@/lib/validation'

// Hide or unhide an answer. Hiding also resolves its open reports.
export async function PATCH(request: Request, { params }: { params: Promise<{ answerId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error
  const { answerId } = await params

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

  const answer = await prisma.blogAnswer.findUnique({ where: { id: answerId }, select: { id: true } })
  if (!answer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.blogAnswer.update({ where: { id: answerId }, data: { hidden: parsed.data.hidden } }),
    ...(parsed.data.hidden
      ? [prisma.blogReport.updateMany({ where: { answerId, resolvedAt: null }, data: { resolvedAt: new Date() } })]
      : []),
  ])
  return NextResponse.json({ id: answerId, hidden: parsed.data.hidden })
}
