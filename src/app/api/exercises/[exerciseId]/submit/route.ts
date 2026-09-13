import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAnswer } from '@/lib/exerciseChecking'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { exerciseId } = await params
  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } })
  if (!exercise) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
  }

  const body = await request.json()
  const correct = checkAnswer(exercise.type, exercise.correctAnswer, body.answer)

  return NextResponse.json({
    correct,
    correctAnswer: exercise.correctAnswer,
    explanation: exercise.explanation,
  })
}
