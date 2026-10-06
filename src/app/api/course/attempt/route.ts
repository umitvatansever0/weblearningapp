import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserApi } from '@/lib/blogServer'
import { findExercise } from '@/course/registry'
import { checkExercise, isValidAnswer } from '@/course/check'
import { recordAttempt } from '@/course/progress'

const attemptSchema = z.object({
  exerciseKey: z.string().min(3).max(120),
  answer: z.unknown(),
  mode: z.enum(['lesson', 'practice', 'review', 'timed']),
  mistakeId: z.string().max(40).optional(),
})

/**
 * Save one answer of a signed-in learner. The answer is checked again on the
 * server against the course content, so stored mastery and the mistake bank
 * never depend on what the browser reports.
 */
export async function POST(request: Request) {
  const auth = await requireUserApi()
  if ('error' in auth) return auth.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = attemptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { exerciseKey, answer, mode, mistakeId } = parsed.data

  const resolved = findExercise(exerciseKey)
  if (!resolved) return NextResponse.json({ error: 'Unknown exercise' }, { status: 404 })
  if (!isValidAnswer(resolved.exercise, answer)) {
    return NextResponse.json({ error: 'Invalid answer' }, { status: 400 })
  }

  const result = checkExercise(resolved.exercise, answer)
  await recordAttempt({
    userId: auth.session.user.id,
    resolved,
    correct: result.correct,
    given: result.given,
    mode,
    mistakeId,
  })
  return NextResponse.json({ correct: result.correct })
}
