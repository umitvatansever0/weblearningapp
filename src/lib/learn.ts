import { prisma } from '@/lib/prisma'
import type { LevelCode } from '@prisma/client'
import type { SanitizedExercise } from '@/types/exercise'

export interface LevelSummary {
  code: LevelCode
  order: number
  unitCount: number
}

export async function getLevels(): Promise<LevelSummary[]> {
  const levels = await prisma.level.findMany({
    orderBy: { order: 'asc' },
    include: { units: { select: { id: true } } },
  })
  return levels.map((level) => ({
    code: level.code,
    order: level.order,
    unitCount: level.units.length,
  }))
}

export interface UnitWithLessons {
  id: string
  slug: string
  titleDe: string
  titleEn: string
  titleTr: string
  order: number
  lessons: {
    id: string
    slug: string
    order: number
    grammarTopic: string
    completed: boolean
  }[]
}

export async function getUnitsForLevel(code: LevelCode, userId?: string): Promise<UnitWithLessons[]> {
  // Anonymous visitors have no progress. Filter on an id that can never match a
  // real (cuid) user so no completion state leaks in; when logged in, filter on
  // the real user id.
  const progressUserId = userId ?? '__anonymous__'
  const level = await prisma.level.findUnique({
    where: { code },
    include: {
      units: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { progress: { where: { userId: progressUserId } } },
          },
        },
      },
    },
  })

  if (!level) return []

  return level.units.map((unit) => ({
    id: unit.id,
    // Fall back to the id if a slug has not been backfilled yet, so links keep
    // working; the lesson route will 301 the id URL to the canonical slug URL.
    slug: unit.slug ?? unit.id,
    titleDe: unit.titleDe,
    titleEn: unit.titleEn,
    titleTr: unit.titleTr,
    order: unit.order,
    lessons: unit.lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug ?? lesson.id,
      order: lesson.order,
      grammarTopic: lesson.grammarTopic,
      completed: lesson.progress.some((entry) => entry.completed),
    })),
  }))
}

export interface LessonWithExercises {
  id: string
  grammarTopic: string
  explanationDe: string
  explanationEn: string
  explanationTr: string
  exercises: SanitizedExercise[]
}

export async function getLessonWithExercises(lessonId: string): Promise<LessonWithExercises | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { exercises: { orderBy: { order: 'asc' } } },
  })

  if (!lesson) return null

  return {
    id: lesson.id,
    grammarTopic: lesson.grammarTopic,
    explanationDe: lesson.explanationDe,
    explanationEn: lesson.explanationEn,
    explanationTr: lesson.explanationTr,
    exercises: lesson.exercises.map((exercise) => ({
      id: exercise.id,
      lessonId: exercise.lessonId,
      order: exercise.order,
      type: exercise.type,
      data: exercise.data,
      explanation: exercise.explanation,
    })),
  }
}

export interface LessonRef {
  id: string
  levelCode: LevelCode
  unitId: string
  unitSlug: string
  lessonSlug: string
  grammarTopic: string
}

export interface LessonContext {
  id: string
  grammarTopic: string
  levelCode: LevelCode
  unitId: string
  unitSlug: string
  lessonSlug: string
  unitTitleDe: string
  unitTitleEn: string
  unitTitleTr: string
  explanationDe: string
  explanationEn: string
  explanationTr: string
  prev: LessonRef | null
  next: LessonRef | null
}

/** A lesson resolved from URL params (slug or legacy id), with canonical slugs. */
export interface ResolvedLessonRef {
  lessonId: string
  levelCode: LevelCode
  unitSlug: string
  lessonSlug: string
}

/**
 * Resolve locale-agnostic URL params to a lesson. Each of `unitParam` and
 * `lessonParam` may be a human-readable slug OR a legacy database id, so old
 * id-based URLs keep resolving (the page 301s them to the canonical slug URL).
 * Returns null when nothing matches → the page renders a 404.
 */
export async function resolveLessonRef(
  levelCode: string,
  unitParam: string,
  lessonParam: string
): Promise<ResolvedLessonRef | null> {
  const level = await prisma.level.findUnique({ where: { code: levelCode as LevelCode } })
  if (!level) return null

  const unit = await prisma.unit.findFirst({
    where: { levelId: level.id, OR: [{ slug: unitParam }, { id: unitParam }] },
  })
  if (!unit) return null

  const lesson = await prisma.lesson.findFirst({
    where: { unitId: unit.id, OR: [{ slug: lessonParam }, { id: lessonParam }] },
  })
  if (!lesson) return null

  return {
    lessonId: lesson.id,
    levelCode: level.code,
    unitSlug: unit.slug ?? unit.id,
    lessonSlug: lesson.slug ?? lesson.id,
  }
}

/**
 * Given the incoming URL params and the resolved lesson, return the canonical
 * slug path to 301 to, or null when the request is already canonical. The
 * target always matches its own canonical slugs, so following it never
 * triggers another redirect (no chains, no loops).
 */
export function lessonRedirectTarget(
  locale: string,
  unitParam: string,
  lessonParam: string,
  ref: ResolvedLessonRef
): string | null {
  if (unitParam === ref.unitSlug && lessonParam === ref.lessonSlug) return null
  return `/${locale}/learn/${ref.levelCode}/${ref.unitSlug}/${ref.lessonSlug}`
}

/**
 * Resolve a lesson together with the context needed for SEO metadata and
 * internal linking: its level, unit, and the previous/next lessons in reading
 * order (ordered by unit.order, then lesson.order across the whole level).
 */
export async function getLessonContext(lessonId: string): Promise<LessonContext | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { unit: { include: { level: true } } },
  })
  if (!lesson) return null

  // Build the full ordered lesson list for the level to find prev/next.
  const units = await prisma.unit.findMany({
    where: { levelId: lesson.unit.levelId },
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        select: { id: true, slug: true, grammarTopic: true, unitId: true },
      },
    },
  })

  const ordered: LessonRef[] = units.flatMap((unit) =>
    unit.lessons.map((l) => ({
      id: l.id,
      levelCode: lesson.unit.level.code,
      unitId: l.unitId,
      unitSlug: unit.slug ?? unit.id,
      lessonSlug: l.slug ?? l.id,
      grammarTopic: l.grammarTopic,
    }))
  )

  const index = ordered.findIndex((l) => l.id === lessonId)

  return {
    id: lesson.id,
    grammarTopic: lesson.grammarTopic,
    levelCode: lesson.unit.level.code,
    unitId: lesson.unitId,
    unitSlug: lesson.unit.slug ?? lesson.unit.id,
    lessonSlug: lesson.slug ?? lesson.id,
    unitTitleDe: lesson.unit.titleDe,
    unitTitleEn: lesson.unit.titleEn,
    unitTitleTr: lesson.unit.titleTr,
    explanationDe: lesson.explanationDe,
    explanationEn: lesson.explanationEn,
    explanationTr: lesson.explanationTr,
    prev: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
  }
}

export function pickByLocale(locale: string, fields: { de: string; en: string; tr: string }): string {
  if (locale === 'de') return fields.de
  if (locale === 'tr') return fields.tr
  return fields.en
}
