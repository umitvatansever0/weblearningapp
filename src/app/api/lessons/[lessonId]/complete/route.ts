import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applyLessonCompletionRewards } from '@/lib/gamification'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const score = typeof (body as { score?: unknown })?.score === 'number' ? (body as { score: number }).score : 0

  // Content is public: anonymous visitors can finish a lesson, but there is no
  // account to attach progress to, so we acknowledge completion without saving.
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ completed: true, score, saved: false })
  }

  // Must run before the userProgress upsert below: applyLessonCompletionRewards
  // checks whether this lesson was already completed to decide whether to
  // award XP, so it needs to see pre-request state (not this request's own
  // completion write) to correctly detect a genuine first completion.
  await applyLessonCompletionRewards(session.user.id, lessonId, score)

  const progress = await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    update: { completed: true, score, lastAttemptAt: new Date() },
    create: { userId: session.user.id, lessonId, completed: true, score },
  })

  return NextResponse.json({ completed: progress.completed, score: progress.score })
}
