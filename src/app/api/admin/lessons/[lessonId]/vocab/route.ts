import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { vocabWordInputSchema } from '@/lib/validation'

export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { lessonId } = await params
  const words = await prisma.vocabWord.findMany({ where: { lessonId }, orderBy: { word: 'asc' } })

  return NextResponse.json(words)
}

export async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { lessonId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = vocabWordInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const word = await prisma.vocabWord.create({ data: { lessonId, ...parsed.data } })

  return NextResponse.json({ id: word.id }, { status: 201 })
}
