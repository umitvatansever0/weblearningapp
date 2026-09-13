import type { ExerciseType } from '@prisma/client'

export type { ExerciseType }

export interface MultipleChoiceData {
  prompt: string
  options: string[]
}
export interface MultipleChoiceCorrectAnswer {
  correctIndex: number
}
export interface MultipleChoiceUserAnswer {
  selectedIndex: number
}

export interface FillInBlankData {
  sentence: string
}
export interface FillInBlankCorrectAnswer {
  accepted: string[]
}
export interface FillInBlankUserAnswer {
  text: string
}

export interface MatchingPair {
  left: string
  right: string
}
export interface MatchingData {
  lefts: string[]
  rights: string[] // shuffled — NOT positionally aligned with `lefts`
}
export interface MatchingCorrectAnswer {
  pairs: MatchingPair[]
}
export interface MatchingUserAnswer {
  pairs: MatchingPair[]
}

export interface SentenceOrderData {
  words: string[]
}
export interface SentenceOrderCorrectAnswer {
  order: string[]
}
export interface SentenceOrderUserAnswer {
  order: string[]
}

export interface ShortAnswerData {
  prompt: string
}
export interface ShortAnswerCorrectAnswer {
  accepted: string[]
}
export interface ShortAnswerUserAnswer {
  text: string
}

export interface SanitizedExercise {
  id: string
  lessonId: string
  order: number
  type: ExerciseType
  data: unknown
  explanation: string
}
