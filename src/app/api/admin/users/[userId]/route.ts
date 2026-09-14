import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { userRoleUpdateSchema } from '@/lib/validation'

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const { userId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = userRoleUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  if (userId === auth.session.user.id && parsed.data.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
    select: { id: true, email: true, name: true, role: true, xp: true, streak: true, createdAt: true },
  })

  return NextResponse.json(user)
}
