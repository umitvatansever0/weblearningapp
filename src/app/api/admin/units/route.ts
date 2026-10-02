import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { unitInputSchema } from '@/lib/validation'
import { uniqueSlug } from '@/lib/slug'

export async function GET() {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const units = await prisma.unit.findMany({
    orderBy: [{ level: { order: 'asc' } }, { order: 'asc' }],
    include: { level: true, lessons: { select: { id: true } } },
  })

  return NextResponse.json(
    units.map((unit) => ({
      id: unit.id,
      levelCode: unit.level.code,
      order: unit.order,
      titleDe: unit.titleDe,
      titleEn: unit.titleEn,
      titleTr: unit.titleTr,
      lessonCount: unit.lessons.length,
    }))
  )
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = unitInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const level = await prisma.level.findUnique({ where: { code: parsed.data.levelCode } })
  if (!level) {
    return NextResponse.json({ error: 'Level not found' }, { status: 404 })
  }

  // Generate a URL slug unique within the level, derived from the English title.
  const existing = await prisma.unit.findMany({
    where: { levelId: level.id, slug: { not: null } },
    select: { slug: true },
  })
  const taken = new Set(existing.map((u) => u.slug as string))
  const slug = uniqueSlug(parsed.data.titleEn, taken, 'unit')

  const unit = await prisma.unit.create({
    data: {
      levelId: level.id,
      order: parsed.data.order,
      slug,
      titleDe: parsed.data.titleDe,
      titleEn: parsed.data.titleEn,
      titleTr: parsed.data.titleTr,
    },
  })

  return NextResponse.json({ id: unit.id }, { status: 201 })
}
