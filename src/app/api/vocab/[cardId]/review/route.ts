import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applySM2Grade, type VocabGrade } from '@/lib/spacedRepetition'
import { checkAndAwardBadges } from '@/lib/gamification'

const VALID_GRADES: VocabGrade[] = ['again', 'hard', 'good', 'easy']

export async function POST(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { cardId } = await params
  const card = await prisma.userVocabCard.findUnique({ where: { id: cardId } })
  if (!card || card.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const grade = (body as { grade?: unknown })?.grade
  if (typeof grade !== 'string' || !VALID_GRADES.includes(grade as VocabGrade)) {
    return NextResponse.json({ error: 'Invalid grade' }, { status: 400 })
  }

  const update = applySM2Grade(
    { easeFactor: card.easeFactor, interval: card.interval, repetitions: card.repetitions },
    grade as VocabGrade
  )

  await prisma.userVocabCard.update({
    where: { id: cardId },
    data: {
      easeFactor: update.easeFactor,
      interval: update.interval,
      repetitions: update.repetitions,
      dueDate: update.dueDate,
      lastReviewedAt: new Date(),
    },
  })

  await checkAndAwardBadges(session.user.id)

  return NextResponse.json({ interval: update.interval, dueDate: update.dueDate.toISOString() })
}
