import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canDelete, requireUserApi } from '@/lib/blogServer'

export async function DELETE(_request: Request, { params }: { params: Promise<{ answerId: string }> }) {
  const { answerId } = await params
  const auth = await requireUserApi()
  if ('error' in auth) return auth.error

  const answer = await prisma.blogAnswer.findUnique({ where: { id: answerId }, select: { authorId: true } })
  if (!answer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canDelete(auth.session, answer.authorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.blogAnswer.delete({ where: { id: answerId } })
  return new NextResponse(null, { status: 204 })
}
