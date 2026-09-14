import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { lessonUpdateSchema } from '@/lib/validation'

export async function PATCH(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { lessonId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = lessonUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const lesson = await prisma.lesson.update({ where: { id: lessonId }, data: parsed.data })
  return NextResponse.json({ id: lesson.id })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { lessonId } = await params

  await prisma.$transaction([
    prisma.userProgress.deleteMany({ where: { lessonId } }),
    prisma.userVocabCard.deleteMany({ where: { vocabWord: { lessonId } } }),
    prisma.vocabWord.deleteMany({ where: { lessonId } }),
    prisma.exercise.deleteMany({ where: { lessonId } }),
    prisma.lesson.delete({ where: { id: lessonId } }),
  ])

  return NextResponse.json({ deleted: true })
}
