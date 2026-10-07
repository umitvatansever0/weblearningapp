import type { CourseUnit, Exercise, UnitOutline } from './types'
import { A1_OUTLINE } from './a1/curriculum'
import { A2_OUTLINE } from './a2/curriculum'
import { UNIT01_HALLO } from './a1/unit01-hallo'
import { UNIT02_WER_BIST_DU } from './a1/unit02-wer-bist-du'
import { UNIT03_ZAHLEN_ZEIT } from './a1/unit03-zahlen-zeit'
import { UNIT04_FAMILIE } from './a1/unit04-familie'
import { UNIT05_ARTICLES } from './a1/unit05-articles'
import { UNIT06_PLURAL } from './a1/unit06-plural'
import { UNIT07_ALLTAG_VERBEN } from './a1/unit07-alltag-verben'
import { UNIT08_SATZBAU } from './a1/unit08-satzbau'
import { UNIT09_FRAGEN } from './a1/unit09-fragen'
import { UNIT10_HABEN_SEIN } from './a1/unit10-haben-sein'
import { UNIT11_AKKUSATIV } from './a1/unit11-akkusativ'
import { UNIT12_ESSEN_TRINKEN } from './a1/unit12-essen-trinken'
import { UNIT13_IM_CAFE } from './a1/unit13-im-cafe'
import { UNIT14_MODALVERBEN } from './a1/unit14-modalverben'
import { UNIT15_TAGESABLAUF } from './a1/unit15-tagesablauf'
import { UNIT16_FREIZEIT } from './a1/unit16-freizeit'
import { UNIT17_STADT_ORTE } from './a1/unit17-stadt-orte'
import { UNIT18_RICHTUNGEN } from './a1/unit18-richtungen'
import { UNIT19_DATIV } from './a1/unit19-dativ'
import { UNIT20_KLEIDUNG_FARBEN } from './a1/unit20-kleidung-farben'
import { UNIT21_EINKAUFEN } from './a1/unit21-einkaufen'
import { UNIT22_WOHNEN } from './a1/unit22-wohnen'
import { UNIT23_GESUNDHEIT } from './a1/unit23-gesundheit'
import { UNIT24_PERFEKT } from './a1/unit24-perfekt'
import { UNIT25_A1_REVIEW } from './a1/unit25-a1-review'
import { UNIT_A2_01_ERLEBNISSE } from './a2/unit01-erlebnisse'
import { UNIT_A2_02_DAMALS } from './a2/unit02-damals'
import { UNIT_A2_03_MIR_GEFAELLT } from './a2/unit03-mir-gefaellt'
import { UNIT_A2_04_WECHSELPRAEPOSITIONEN } from './a2/unit04-wechselpraepositionen'
import { UNIT_A2_05_ADJEKTIVE_DER } from './a2/unit05-adjektive-der'
import { UNIT_A2_06_ADJEKTIVE_EIN } from './a2/unit06-adjektive-ein'
import { UNIT_A2_07_VERGLEICHE } from './a2/unit07-vergleiche'
import { UNIT_A2_08_WEIL_DASS } from './a2/unit08-weil-dass'
import { UNIT_A2_09_WENN_DANN } from './a2/unit09-wenn-dann'
import { UNIT_A2_10_REFLEXIVE_VERBEN } from './a2/unit10-reflexive-verben'
import { UNIT_A2_11_VERBEN_PRAEPOSITIONEN } from './a2/unit11-verben-praepositionen'
import { UNIT_A2_12_BERUF_ARBEIT } from './a2/unit12-beruf-arbeit'
import { UNIT_A2_13_BEWERBUNG } from './a2/unit13-bewerbung'
import { UNIT_A2_14_BAHNHOF_REISEN } from './a2/unit14-bahnhof-reisen'
import { UNIT_A2_15_HOTEL } from './a2/unit15-hotel'

export const COURSE_LEVELS = ['A1', 'A2'] as const
export type CourseLevel = (typeof COURSE_LEVELS)[number]

/** Units that already have full content. The rest of the outline is "in preparation". */
const UNITS: CourseUnit[] = [UNIT01_HALLO, UNIT02_WER_BIST_DU, UNIT03_ZAHLEN_ZEIT, UNIT04_FAMILIE, UNIT05_ARTICLES, UNIT06_PLURAL, UNIT07_ALLTAG_VERBEN, UNIT08_SATZBAU, UNIT09_FRAGEN, UNIT10_HABEN_SEIN, UNIT11_AKKUSATIV, UNIT12_ESSEN_TRINKEN, UNIT13_IM_CAFE, UNIT14_MODALVERBEN, UNIT15_TAGESABLAUF, UNIT16_FREIZEIT, UNIT17_STADT_ORTE, UNIT18_RICHTUNGEN, UNIT19_DATIV, UNIT20_KLEIDUNG_FARBEN, UNIT21_EINKAUFEN, UNIT22_WOHNEN, UNIT23_GESUNDHEIT, UNIT24_PERFEKT, UNIT25_A1_REVIEW, UNIT_A2_01_ERLEBNISSE, UNIT_A2_02_DAMALS, UNIT_A2_03_MIR_GEFAELLT, UNIT_A2_04_WECHSELPRAEPOSITIONEN, UNIT_A2_05_ADJEKTIVE_DER, UNIT_A2_06_ADJEKTIVE_EIN, UNIT_A2_07_VERGLEICHE, UNIT_A2_08_WEIL_DASS, UNIT_A2_09_WENN_DANN, UNIT_A2_10_REFLEXIVE_VERBEN, UNIT_A2_11_VERBEN_PRAEPOSITIONEN, UNIT_A2_12_BERUF_ARBEIT, UNIT_A2_13_BEWERBUNG, UNIT_A2_14_BAHNHOF_REISEN, UNIT_A2_15_HOTEL]

export function isCourseLevel(level: string): level is CourseLevel {
  return (COURSE_LEVELS as readonly string[]).includes(level)
}

export function getOutline(level: CourseLevel): UnitOutline[] {
  return level === 'A1' ? A1_OUTLINE : A2_OUTLINE
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
