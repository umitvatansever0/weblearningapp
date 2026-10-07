import type { CourseUnit, Exercise, UnitOutline } from './types'
import { A1_OUTLINE } from './a1/curriculum'
import { UNIT01_HALLO } from './a1/unit01-hallo'
import { UNIT05_ARTICLES } from './a1/unit05-articles'

export const COURSE_LEVELS = ['A1'] as const
export type CourseLevel = (typeof COURSE_LEVELS)[number]

/** Units that already have full content. The rest of the outline is "in preparation". */
const UNITS: CourseUnit[] = [UNIT01_HALLO, UNIT05_ARTICLES]

export function isCourseLevel(level: string): level is CourseLevel {
  return (COURSE_LEVELS as readonly string[]).includes(level)
}

export function getOutline(level: CourseLevel): UnitOutline[] {
  return level === 'A1' ? A1_OUTLINE : []
}

export function getUnit(level: string, slug: string): CourseUnit | undefined {
  return UNITS.find((unit) => unit.level === level && unit.slug === slug)
}

export function getUnits(level: string): CourseUnit[] {
  return UNITS.filter((unit) => unit.level === level)
}

export function exerciseKey(unit: Pick<CourseUnit, 'slug'>, exerciseId: string): string {
  return `${unit.slug}:${exerciseId}`
}

export interface ResolvedExercise {
  unit: CourseUnit
  exercise: Exercise
  key: string
}

export function findExercise(key: string): ResolvedExercise | undefined {
  const [slug, id] = key.split(':')
  const unit = UNITS.find((u) => u.slug === slug)
  const exercise = unit?.exercises.find((e) => e.id === id)
  return unit && exercise ? { unit, exercise, key } : undefined
}

/** Every exercise of the level, used to build mixed review sessions. */
export function allExercises(level: string): ResolvedExercise[] {
  return getUnits(level).flatMap((unit) =>
    unit.exercises.map((exercise) => ({ unit, exercise, key: exerciseKey(unit, exercise.id) }))
  )
}

/** Section keys a learner can complete (everything but the final summary). */
export function trackableSections(unit: CourseUnit): string[] {
  return unit.sections.filter((s) => s.kind !== 'summary').map((s) => s.key)
}
