import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { vocabWordUpdateSchema } from '@/lib/validation'

export async function PATCH(request: Request, { params }: { params: Promise<{ wordId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { wordId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = vocabWordUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const word = await prisma.vocabWord.update({ where: { id: wordId }, data: parsed.data })
  return NextResponse.json({ id: word.id })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ wordId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { wordId } = await params

  await prisma.$transaction([
    prisma.userVocabCard.deleteMany({ where: { vocabWordId: wordId } }),
    prisma.vocabWord.delete({ where: { id: wordId } }),
  ])

  return NextResponse.json({ deleted: true })
}
