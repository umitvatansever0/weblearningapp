import type { ResolvedExercise } from './registry'

/**
 * Choose a variation of a concept for review. Rotates through the pool by
 * `turn` so each review shows a different item, and prefers anything over
 * the exact question that was answered wrongly.
 */
export function pickVariation(
  pool: ResolvedExercise[],
  originalKey: string,
  concept: string,
  turn: number
): ResolvedExercise | undefined {
  const sameConcept = pool.filter((item) => item.exercise.concept === concept)
  const others = sameConcept.filter((item) => item.key !== originalKey)
  const candidates = others.length > 0 ? others : sameConcept
  if (candidates.length === 0) return pool.find((item) => item.key === originalKey)
  return candidates[turn % candidates.length]
}
