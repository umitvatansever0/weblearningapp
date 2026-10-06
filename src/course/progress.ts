import { prisma } from '@/lib/prisma'
import type { ResolvedExercise } from './registry'
import type { Exercise } from './types'

/** Weight of the newest answer in the topic mastery moving average. */
export const MASTERY_WEIGHT = 0.25

/** Days until the next review after a correct answer at stage 0 and 1. */
export const REVIEW_INTERVALS_DAYS = [3, 5] as const
/** A wrong answer (first mistake or lapse) is due again after one day. */
export const RELEARN_DAYS = 1
/** Correct at this stage → the mistake is resolved (≈ day 1, 2, 5, 10). */
export const FINAL_STAGE = REVIEW_INTERVALS_DAYS.length + 1

const DAY_MS = 24 * 60 * 60 * 1000

export function nextMastery(previous: number, attempts: number, correct: boolean): number {
  const value = correct ? 100 : 0
  if (attempts === 0) return value
  return previous * (1 - MASTERY_WEIGHT) + value * MASTERY_WEIGHT
}

/**
 * Spaced-repetition step for a mistake that was reviewed while due.
 * stage 0 = just made (due day 1) → 1 (due +3 → day 5) → 2 (due +5 → day 10)
 * → correct at FINAL_STAGE resolves it. A wrong review starts over.
 */
export function scheduleReview(
  stage: number,
  correct: boolean,
  now = new Date()
): { stage: number; dueAt: Date; resolved: boolean } {
  if (!correct) return { stage: 0, dueAt: new Date(now.getTime() + RELEARN_DAYS * DAY_MS), resolved: false }
  const next = stage + 1
  if (next >= FINAL_STAGE) return { stage: next, dueAt: now, resolved: true }
  const days = REVIEW_INTERVALS_DAYS[next - 1]
  return { stage: next, dueAt: new Date(now.getTime() + days * DAY_MS), resolved: false }
}

export type AttemptMode = 'lesson' | 'practice' | 'review' | 'timed'

/** Mastery buckets an answer counts towards: its grammar topic and its skill. */
export function masteryTopics(exercise: Exercise): string[] {
  return [exercise.topic, `skill:${exercise.skill}`]
}

async function bumpMastery(userId: string, level: string, topic: string, correct: boolean) {
  const existing = await prisma.topicMastery.findUnique({
    where: { userId_level_topic: { userId, level, topic } },
  })
  const score = nextMastery(existing?.score ?? 0, existing?.attempts ?? 0, correct)
  await prisma.topicMastery.upsert({
    where: { userId_level_topic: { userId, level, topic } },
    create: { userId, level, topic, score, attempts: 1, correct: correct ? 1 : 0 },
    update: { score, attempts: { increment: 1 }, correct: { increment: correct ? 1 : 0 } },
  })
}

/**
 * Persist one checked answer: topic + skill mastery, and the mistake bank.
 * In review mode `mistakeId` names the mistake being reviewed; its schedule
 * only advances when it was actually due, so practising early never skips
 * the spacing.
 */
export async function recordAttempt(input: {
  userId: string
  resolved: ResolvedExercise
  correct: boolean
  given: string
  mode: AttemptMode
  mistakeId?: string
  now?: Date
}): Promise<void> {
  const { userId, resolved, correct, given, mode, mistakeId } = input
  const now = input.now ?? new Date()
  const { exercise, unit, key } = resolved
  const level = unit.level

  for (const topic of masteryTopics(exercise)) {
    await bumpMastery(userId, level, topic, correct)
  }

  if (mode === 'review' && mistakeId) {
    const mistake = await prisma.courseMistake.findFirst({ where: { id: mistakeId, userId, resolvedAt: null } })
    if (mistake) {
      if (mistake.dueAt <= now || !correct) {
        const next = scheduleReview(mistake.stage, correct, now)
        await prisma.courseMistake.update({
          where: { id: mistake.id },
          data: {
            stage: next.stage,
            dueAt: next.dueAt,
            resolvedAt: next.resolved ? now : null,
            lapses: correct ? undefined : { increment: 1 },
            wrongAnswer: correct ? undefined : given.slice(0, 300),
          },
        })
      }
      return
    }
  }

  // Reading questions only make sense next to their text, so they count
  // towards mastery but don't go into the mistake bank.
  if (!correct && exercise.skill !== 'reading') {
    await prisma.courseMistake.upsert({
      where: { userId_exerciseKey: { userId, exerciseKey: key } },
      create: {
        userId,
        level,
        exerciseKey: key,
        topic: exercise.topic,
        concept: exercise.concept,
        wrongAnswer: given.slice(0, 300),
        dueAt: new Date(now.getTime() + RELEARN_DAYS * DAY_MS),
      },
      update: {
        wrongAnswer: given.slice(0, 300),
        stage: 0,
        dueAt: new Date(now.getTime() + RELEARN_DAYS * DAY_MS),
        resolvedAt: null,
        lapses: { increment: 1 },
      },
    })
  }
}

export interface LearnerSnapshot {
  completedSections: string[]
  mastery: Record<string, number>
  dueMistakes: number
  openMistakes: number
}

export async function getLearnerSnapshot(userId: string, level: string, unitSlug?: string): Promise<LearnerSnapshot> {
  const now = new Date()
  const [sections, mastery, dueMistakes, openMistakes] = await Promise.all([
    unitSlug
      ? prisma.courseSectionProgress.findMany({ where: { userId, level, unitSlug }, select: { sectionKey: true } })
      : Promise.resolve([]),
    prisma.topicMastery.findMany({ where: { userId, level }, select: { topic: true, score: true } }),
    prisma.courseMistake.count({ where: { userId, level, resolvedAt: null, dueAt: { lte: now } } }),
    prisma.courseMistake.count({ where: { userId, level, resolvedAt: null } }),
  ])
  return {
    completedSections: sections.map((s) => s.sectionKey),
    mastery: Object.fromEntries(mastery.map((m) => [m.topic, Math.round(m.score)])),
    dueMistakes,
    openMistakes,
  }
}
