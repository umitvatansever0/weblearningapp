import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === 'ADMIN'
}

export async function requireAdminApi(): Promise<{ session: Session } | { error: NextResponse }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!isAdmin(session)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  // The role inside the JWT can be stale (sessions live for weeks). Admin
  // APIs re-check the database so a demoted or deleted admin loses access
  // immediately.
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session }
}
