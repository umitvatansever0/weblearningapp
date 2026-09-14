import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { exerciseInputSchema } from '@/lib/validation'
import { Prisma } from '@prisma/client'

export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { lessonId } = await params
  const exercises = await prisma.exercise.findMany({ where: { lessonId }, orderBy: { order: 'asc' } })

  return NextResponse.json(exercises)
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
  const parsed = exerciseInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const exercise = await prisma.exercise.create({
    data: {
      lessonId,
      order: parsed.data.order,
      type: parsed.data.type,
      data: parsed.data.data as Prisma.InputJsonValue,
      correctAnswer: parsed.data.correctAnswer as Prisma.InputJsonValue,
      explanation: parsed.data.explanation,
    },
  })

  return NextResponse.json({ id: exercise.id }, { status: 201 })
}
