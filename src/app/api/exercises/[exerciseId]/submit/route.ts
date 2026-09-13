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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const answer = (body as { answer?: unknown })?.answer
  const correct = checkAnswer(exercise.type, exercise.correctAnswer, answer)

  return NextResponse.json({
    correct,
    correctAnswer: exercise.correctAnswer,
    explanation: exercise.explanation,
  })
}
