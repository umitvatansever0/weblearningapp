import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applyLessonCompletionRewards } from '@/lib/gamification'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lessonId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const score = typeof (body as { score?: unknown })?.score === 'number' ? (body as { score: number }).score : 0

  const progress = await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    update: { completed: true, score, lastAttemptAt: new Date() },
    create: { userId: session.user.id, lessonId, completed: true, score },
  })

  await applyLessonCompletionRewards(session.user.id, lessonId, score)

  return NextResponse.json({ completed: progress.completed, score: progress.score })
}
