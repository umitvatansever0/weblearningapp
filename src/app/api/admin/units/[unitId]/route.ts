import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { unitUpdateSchema } from '@/lib/validation'

export async function PATCH(request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { unitId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = unitUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { levelCode, ...rest } = parsed.data
  let levelId: string | undefined
  if (levelCode) {
    const level = await prisma.level.findUnique({ where: { code: levelCode } })
    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 })
    }
    levelId = level.id
  }

  const unit = await prisma.unit.update({
    where: { id: unitId },
    data: { ...rest, ...(levelId ? { levelId } : {}) },
  })

  return NextResponse.json({ id: unit.id })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { unitId } = await params

  const lessons = await prisma.lesson.findMany({ where: { unitId }, select: { id: true } })
  const lessonIds = lessons.map((lesson) => lesson.id)

  await prisma.$transaction([
    prisma.userProgress.deleteMany({ where: { lessonId: { in: lessonIds } } }),
    prisma.userVocabCard.deleteMany({ where: { vocabWord: { lessonId: { in: lessonIds } } } }),
    prisma.vocabWord.deleteMany({ where: { lessonId: { in: lessonIds } } }),
    prisma.exercise.deleteMany({ where: { lessonId: { in: lessonIds } } }),
    prisma.lesson.deleteMany({ where: { unitId } }),
    prisma.unit.delete({ where: { id: unitId } }),
  ])

  return NextResponse.json({ deleted: true })
}
