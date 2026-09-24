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
  titleDe: string
  titleEn: string
  titleTr: string
  order: number
  lessons: {
    id: string
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
    titleDe: unit.titleDe,
    titleEn: unit.titleEn,
    titleTr: unit.titleTr,
    order: unit.order,
    lessons: unit.lessons.map((lesson) => ({
      id: lesson.id,
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

export function pickByLocale(locale: string, fields: { de: string; en: string; tr: string }): string {
  if (locale === 'de') return fields.de
  if (locale === 'tr') return fields.tr
  return fields.en
}
