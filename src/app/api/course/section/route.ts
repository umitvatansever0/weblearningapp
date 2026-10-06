import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireUserApi } from '@/lib/blogServer'
import { getUnit, trackableSections } from '@/course/registry'

const sectionSchema = z.object({
  level: z.string().max(4),
  unitSlug: z.string().max(80),
  sectionKey: z.string().max(80),
})

/** Mark a section of a course unit as completed for the signed-in learner. */
export async function POST(request: Request) {
  const auth = await requireUserApi()
  if ('error' in auth) return auth.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = sectionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { level, unitSlug, sectionKey } = parsed.data

  const unit = getUnit(level, unitSlug)
  if (!unit || !trackableSections(unit).includes(sectionKey)) {
    return NextResponse.json({ error: 'Unknown section' }, { status: 404 })
  }

  const userId = auth.session.user.id
  await prisma.courseSectionProgress.upsert({
    where: { userId_level_unitSlug_sectionKey: { userId, level, unitSlug, sectionKey } },
    create: { userId, level, unitSlug, sectionKey },
    update: {},
  })
  return NextResponse.json({ completed: true })
}
