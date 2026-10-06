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

  // The score (number of correct exercises) comes from the browser, so it is
  // clamped to what the lesson can actually yield: an integer between 0 and
  // the lesson's exercise count. Otherwise a crafted request could award
  // arbitrary XP or overflow the database integer.
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { _count: { select: { exercises: true } } },
  })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
  const rawScore = (body as { score?: unknown })?.score
  const score =
    typeof rawScore === 'number' && Number.isFinite(rawScore)
      ? Math.min(Math.max(Math.trunc(rawScore), 0), lesson._count.exercises)
      : 0

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
