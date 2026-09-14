import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { lessonInputSchema } from '@/lib/validation'

export async function GET(_request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { unitId } = await params
  const lessons = await prisma.lesson.findMany({
    where: { unitId },
    orderBy: { order: 'asc' },
    include: { exercises: { select: { id: true } }, vocabWords: { select: { id: true } } },
  })

  return NextResponse.json(
    lessons.map((lesson) => ({
      id: lesson.id,
      order: lesson.order,
      grammarTopic: lesson.grammarTopic,
      explanationDe: lesson.explanationDe,
      explanationEn: lesson.explanationEn,
      explanationTr: lesson.explanationTr,
      exerciseCount: lesson.exercises.length,
      vocabWordCount: lesson.vocabWords.length,
    }))
  )
}

export async function POST(request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { unitId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = lessonInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const unit = await prisma.unit.findUnique({ where: { id: unitId } })
  if (!unit) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const lesson = await prisma.lesson.create({
    data: { unitId, ...parsed.data },
  })

  return NextResponse.json({ id: lesson.id }, { status: 201 })
}
