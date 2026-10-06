import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

// Dismiss a report without changing the reported content.
export async function PATCH(_request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth) return auth.error
  const { reportId } = await params

  const report = await prisma.blogReport.findUnique({ where: { id: reportId }, select: { id: true } })
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.blogReport.update({ where: { id: reportId }, data: { resolvedAt: new Date() } })
  return NextResponse.json({ id: reportId, resolved: true })
}
