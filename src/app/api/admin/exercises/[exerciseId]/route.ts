import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { exerciseUpdateSchema } from '@/lib/validation'
import type { Prisma } from '@prisma/client'

export async function PATCH(request: Request, { params }: { params: Promise<{ exerciseId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { exerciseId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = exerciseUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const exercise = await prisma.exercise.update({
    where: { id: exerciseId },
    data: parsed.data as Prisma.ExerciseUpdateInput,
  })

  return NextResponse.json({ id: exercise.id })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ exerciseId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { exerciseId } = await params
  await prisma.exercise.delete({ where: { id: exerciseId } })

  return NextResponse.json({ deleted: true })
}
