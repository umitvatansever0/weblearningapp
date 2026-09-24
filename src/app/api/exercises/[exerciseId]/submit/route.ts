import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAnswer } from '@/lib/exerciseChecking'

// Checking an answer is public — anonymous visitors can practice without an
// account. No progress is written here, so no session is required.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
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

  let correct: boolean
  try {
    correct = checkAnswer(exercise.type, exercise.correctAnswer, answer)
  } catch {
    return NextResponse.json({ error: 'Invalid answer format' }, { status: 400 })
  }

  return NextResponse.json({
    correct,
    correctAnswer: exercise.correctAnswer,
    explanation: exercise.explanation,
  })
}
