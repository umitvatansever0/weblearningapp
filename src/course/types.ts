/**
 * Content model for the structured course (A1 first).
 *
 * Course → Level → Unit → Section → Exercise. Units are plain typed data so
 * lessons are authored as content, not hard-coded into components. German
 * learning material stays German; everything addressed to the learner
 * (instructions, explanations, translations) is localized via `L10n`.
 */

export type CourseLocale = 'en' | 'tr' | 'de'
export type L10n = Record<CourseLocale, string>

export type Skill = 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'writing' | 'speaking'
export const SKILLS: Skill[] = ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking']

export type Gender = 'm' | 'f' | 'n'

export interface VocabItem {
  /** Noun without article, or the word itself for non-nouns. */
  word: string
  gender?: Gender
  plural?: string
  emoji?: string
  translation: L10n
  example?: string
}

export interface Topic {
  key: string
  label: L10n
}

/**
 * Rich German text: `{m:der Hund}`, `{f:die Tasche}`, `{n:das Handy}` mark
 * article + noun groups (coloured by gender), `**…**` highlights anything else.
 */
export type RichDe = string

export interface WorkedExample {
  de: RichDe
  translation: L10n
}

export interface RuleBlock {
  title: L10n
  body: L10n
  /** Compact table rows, e.g. [['der', 'masculine', 'der Hund']]. */
  table?: { head: L10n[]; rows: string[][] }
  examples?: WorkedExample[]
  tip?: L10n
}

export interface DialogueLine {
  speaker: string
  de: RichDe
  translation: L10n
}

interface ExerciseBase {
  /** Unique within the unit; global key is `${unitSlug}:${id}`. */
  id: string
  topic: string
  /** Finer grouping used to pick variations for review. */
  concept: string
  skill: Skill
  difficulty: 1 | 2 | 3
  instructions?: L10n
  /** WHY the answer is right – short, example-driven. */
  explanation: L10n
  /** Correct German sentence(s) shown as reinforcement after answering. */
  examples?: RichDe[]
  hint?: L10n
  /** "Try one more": ids of similar exercises offered after the answer. */
  practice?: string[]
  tags?: string[]
  /** Optional emoji scene shown above the task (rows of space-separated cells, "." = empty), e.g. a street map. */
  visual?: string[]
}

export interface MultipleChoiceExercise extends ExerciseBase {
  type: 'multiple_choice'
  prompt: string
  promptL10n?: L10n
  options: string[]
  answer: number
}

export interface MultipleSelectExercise extends ExerciseBase {
  type: 'multiple_select'
  promptL10n: L10n
  options: string[]
  answers: number[]
}

export interface TrueFalseExercise extends ExerciseBase {
  type: 'true_false'
  statement: string
  answer: boolean
}

export interface FillBlankExercise extends ExerciseBase {
  type: 'fill_blank'
  /** Sentence with one `___` gap. */
  sentence: string
  accepted: string[]
  /** Shown as a small hint next to the gap, e.g. "(kein)". */
  base?: string
}

export interface MatchingExercise extends ExerciseBase {
  type: 'matching'
  pairs: { left: string; right: string | L10n }[]
}

export interface CategorizeExercise extends ExerciseBase {
  type: 'categorize'
  categories: string[]
  items: { text: string; category: number }[]
}

export interface SentenceBuilderExercise extends ExerciseBase {
  type: 'sentence_builder'
  /** Chips in the (scrambled) order they are offered. */
  chips: string[]
  /** Correct sentence(s) as chip sequences. */
  answers: string[][]
  translation?: L10n
  /** Final punctuation shown after the sentence (default "."). */
  end?: '.' | '?' | '!'
}

export interface ImageChoiceExercise extends ExerciseBase {
  type: 'image_choice'
  prompt: string
  options: { emoji: string; label: string }[]
  answer: number
}

export interface ListeningChoiceExercise extends ExerciseBase {
  type: 'listening_choice'
  /** Text spoken by the browser's German voice. */
  audio: string
  question: L10n
  options: string[]
  answer: number
}

export interface ErrorCorrectionExercise extends ExerciseBase {
  type: 'error_correction'
  sentence: string
  accepted: string[]
}

export interface TranslationExercise extends ExerciseBase {
  type: 'translation'
  source: L10n
  accepted: string[]
}

export interface OrderingExercise extends ExerciseBase {
  type: 'ordering'
  promptL10n?: L10n
  /** Items in the (scrambled) order they are offered. */
  items: string[]
  /** The same items in the correct order. */
  answer: string[]
}

export interface DialogueExercise extends ExerciseBase {
  type: 'dialogue'
  lines: { speaker: string; de: string }[]
  options: string[]
  answer: number
}

export type Exercise =
  | MultipleChoiceExercise
  | MultipleSelectExercise
  | TrueFalseExercise
  | FillBlankExercise
  | MatchingExercise
  | CategorizeExercise
  | SentenceBuilderExercise
  | ImageChoiceExercise
  | ListeningChoiceExercise
  | ErrorCorrectionExercise
  | TranslationExercise
  | OrderingExercise
  | DialogueExercise

export type ExerciseType = Exercise['type']

interface SectionBase {
  key: string
  title: L10n
  intro?: L10n
}

export type Section =
  | (SectionBase & { kind: 'discover'; cards: VocabItem[] })
  | (SectionBase & { kind: 'understand'; rules: RuleBlock[] })
  | (SectionBase & {
      kind: 'context'
      scene: L10n
      dialogue: DialogueLine[]
      examples: WorkedExample[]
    })
  | (SectionBase & { kind: 'practice'; exercises: string[] })
  | (SectionBase & {
      kind: 'reading'
      passage: RichDe[]
      glossary?: { de: string; note: L10n }[]
      exercises: string[]
    })
  | (SectionBase & { kind: 'listening'; exercises: string[] })
  | (SectionBase & {
      kind: 'speaking'
      prompt: L10n
      points: L10n[]
      model: string[]
    })
  | (SectionBase & {
      kind: 'writing'
      prompt: L10n
      minSentences: number
      checks: WritingCheck[]
      model: string[]
    })
  | (SectionBase & { kind: 'timed'; seconds: number; pool: string[] })
  | (SectionBase & { kind: 'review' })
  | (SectionBase & { kind: 'summary' })

export type SectionKind = Section['kind']

export interface WritingCheck {
  label: L10n
  /** Unicode regular expression source (flag `u`) tested against the text. */
  pattern: string
}

export interface CommonMistake {
  wrong: string
  right: string
  note: L10n
}

export interface CourseUnit {
  level: 'A1'
  number: number
  slug: string
  titleDe: string
  title: L10n
  goal: L10n
  minutes: [number, number]
  topics: Topic[]
  vocabulary: VocabItem[]
  sections: Section[]
  exercises: Exercise[]
  summary: { learned: L10n[]; mistakes: CommonMistake[] }
  /** Practice share (answered) and accuracy needed to count as mastered. */
  mastery: { minAnswered: number; minAccuracy: number }
}

/** Outline entry for every unit of the curriculum, built or not. */
export interface UnitOutline {
  number: number
  slug: string
  titleDe: string
  title: L10n
  focus: string[]
  scenario?: L10n
}
