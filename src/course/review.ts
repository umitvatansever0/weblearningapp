import { prisma } from '@/lib/prisma'
import { allExercises, type ResolvedExercise } from './registry'
import { pickVariation } from './variation'

export { pickVariation }

export interface ReviewItem {
  exerciseKey: string
  /** Set when the item reviews a mistake from the bank. */
  mistakeId?: string
  /** The answer that was wrong before (shown after answering). */
  previousAnswer?: string
}

export const REVIEW_SIZE = 12
const MIN_SESSION = 8

/** Exercises that make sense on their own (reading questions need their text). */
function standalone(item: ResolvedExercise): boolean {
  return item.exercise.skill !== 'reading'
}

/** Deterministic shuffle so a session is stable within a day but varies across days. */
function rotate<T>(items: T[], seed: number): T[] {
  if (items.length === 0) return items
  const shift = seed % items.length
  return [...items.slice(shift), ...items.slice(0, shift)]
}

/**
 * Build a review session: due mistakes first (as variations), then – if the
 * session is short – mixed practice from the learner's weakest topics.
 * `scope: 'all'` also includes mistakes that are not due yet ("practise my
 * mistakes now"); those don't advance the schedule.
 */
export async function buildReviewSession(
  userId: string,
  level: string,
  scope: 'due' | 'all',
  now = new Date()
): Promise<ReviewItem[]> {
  const pool = allExercises(level).filter(standalone)
  const mistakes = await prisma.courseMistake.findMany({
    where: { userId, level, resolvedAt: null, ...(scope === 'due' ? { dueAt: { lte: now } } : {}) },
    orderBy: { dueAt: 'asc' },
    take: REVIEW_SIZE,
  })

  const items: ReviewItem[] = []
  const used = new Set<string>()
  for (const mistake of mistakes) {
    const variation = pickVariation(pool, mistake.exerciseKey, mistake.concept, mistake.stage + mistake.lapses)
    if (!variation || used.has(variation.key)) continue
    used.add(variation.key)
    items.push({ exerciseKey: variation.key, mistakeId: mistake.id, previousAnswer: mistake.wrongAnswer })
  }

  if (items.length < MIN_SESSION) {
    const mastery = await prisma.topicMastery.findMany({
      where: { userId, level, NOT: { topic: { startsWith: 'skill:' } } },
      orderBy: { score: 'asc' },
    })
    const weakTopics = mastery.map((m) => m.topic)
    const daySeed = Math.floor(now.getTime() / (24 * 60 * 60 * 1000))
    const ranked = weakTopics.length > 0 ? weakTopics : [...new Set(pool.map((p) => p.exercise.topic))]
    for (const topic of ranked) {
      for (const item of rotate(pool.filter((p) => p.exercise.topic === topic), daySeed)) {
        if (items.length >= MIN_SESSION) break
        if (used.has(item.key)) continue
        used.add(item.key)
        items.push({ exerciseKey: item.key })
        break // one per topic per pass keeps the mix varied
      }
    }
    // Still short (few topics practised yet): top up from the whole pool.
    for (const item of rotate(pool, daySeed)) {
      if (items.length >= MIN_SESSION) break
      if (used.has(item.key)) continue
      used.add(item.key)
      items.push({ exerciseKey: item.key })
    }
  }
  return items
}
