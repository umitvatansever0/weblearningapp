import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true, role: true, xp: true, streak: true, createdAt: true },
  })

  return NextResponse.json(users)
}
