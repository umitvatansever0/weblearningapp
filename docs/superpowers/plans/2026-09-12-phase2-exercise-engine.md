# Phase 2 — Exercise Engine + Multi-Level Starter Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the alıştırma (exercise) engine — data model, answer-checking logic, 5 exercise-type UI components, submit/complete API routes, and `/learn` pages — and populate it with real, gradable content spanning all six CEFR levels (A1 full unit, A2-C2 one sample lesson each) so a logged-in visitor can actually study and get graded feedback.

**Architecture:** Content (Level/Unit/Lesson/Exercise) lives in Postgres via Prisma, loaded once via a seed script (not hand-written into components). Server components read content directly through a small `src/lib/learn.ts` data-access layer (no GET API needed, matching the Phase 1 precedent of API routes only for mutations). A single client component, `<ExerciseRunner>`, receives a sanitized exercise list (never includes `correctAnswer`) and dispatches to one of 5 typed sub-components; answers are POSTed to a server route that owns the only copy of `correctAnswer` and returns graded feedback.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma + PostgreSQL, NextAuth.js (session gating), next-intl, Vitest + Testing Library. No new runtime dependencies except `tsx` (dev-only, to run the TypeScript seed script).

## Global Constraints

- Every UI-facing string must be added to `messages/de.json`, `messages/en.json`, and `messages/tr.json` with matching keys — enforced by the existing key-consistency test (`tests/unit/messages.test.ts`). No hardcoded UI text in components.
- TypeScript strict mode stays enabled; no new `any` types (use `unknown` + narrow casts where a JSON column's shape varies by exercise type).
- `correctAnswer` must never be sent to the client before an answer is submitted. Server components and the learn data-access layer must strip it before returning exercise data to pages/components.
- `/learn` pages and their mutating API routes require an authenticated session (`getServerSession(authOptions)`); unauthenticated requests are redirected (pages) or receive `401` (API routes).
- Content is loaded via `prisma/seed.ts`, not hardcoded into TSX files — this keeps the door open for a future admin panel to manage the same tables.
- Do not add XP/streak/badge fields, vocab/spaced-repetition tables, admin CRUD UI, public SEO grammar pages, or ad slots — those belong to later phases per `docs/superpowers/specs/2026-09-12-german-learning-platform-design.md`.
- This plan builds on the completed Phase 1 (`docs/superpowers/plans/2026-09-12-phase1-foundation.md`): `User` model, `authOptions`/`authorizeUser` from `@/lib/auth`, `@/i18n/navigation` (`Link`, `useRouter`, `usePathname`), `@/i18n/routing` (`routing`), and the `[locale]` layout are already in place and must not be modified except where a task explicitly says so.

---

### Task 1: Exercise Engine Data Model

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/integration/exerciseSchema.test.ts`

**Interfaces:**
- Consumes: nothing new (extends the existing `User` model from Phase 1).
- Produces: Prisma models `Level`, `Unit`, `Lesson`, `Exercise`, `UserProgress` and enums `LevelCode` (`A1|A2|B1|B2|C1|C2`), `ExerciseType` (`MULTIPLE_CHOICE|FILL_IN_BLANK|MATCHING|SENTENCE_ORDER|SHORT_ANSWER`). Every later task in this plan depends on these exact model/field names.

- [ ] **Step 1: Write the failing schema integration test**

Create `tests/integration/exerciseSchema.test.ts`:

```ts
import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

describe('exercise engine schema', () => {
  afterAll(async () => {
    await prisma.userProgress.deleteMany({ where: { user: { email: 'schema-exercise-test@example.com' } } })
    await prisma.exercise.deleteMany({ where: { lesson: { grammarTopic: 'Schema Test Topic' } } })
    await prisma.lesson.deleteMany({ where: { grammarTopic: 'Schema Test Topic' } })
    await prisma.unit.deleteMany({ where: { titleEn: 'Schema Test Unit' } })
    await prisma.user.deleteMany({ where: { email: 'schema-exercise-test@example.com' } })
    await prisma.$disconnect()
  })

  it('creates a full Level -> Unit -> Lesson -> Exercise -> UserProgress chain', async () => {
    const level = await prisma.level.upsert({
      where: { code: 'A1' },
      update: {},
      create: { code: 'A1', order: 1 },
    })

    const unit = await prisma.unit.create({
      data: {
        levelId: level.id,
        order: 1,
        titleDe: 'Test',
        titleEn: 'Schema Test Unit',
        titleTr: 'Test',
      },
    })

    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Schema Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })

    const exercise = await prisma.exercise.create({
      data: {
        lessonId: lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Test?', options: ['A', 'B'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Test explanation',
      },
    })

    const user = await prisma.user.create({
      data: {
        email: 'schema-exercise-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Schema Exercise Test',
      },
    })

    const progress = await prisma.userProgress.create({
      data: { userId: user.id, lessonId: lesson.id, completed: true, score: 100 },
    })

    expect(exercise.type).toBe('MULTIPLE_CHOICE')
    expect(progress.completed).toBe(true)

    const found = await prisma.level.findUnique({
      where: { id: level.id },
      include: { units: { include: { lessons: { include: { exercises: true } } } } },
    })
    const foundUnit = found?.units.find((u) => u.id === unit.id)
    expect(foundUnit?.lessons[0].exercises[0].id).toBe(exercise.id)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- exerciseSchema`
Expected: FAIL — Prisma throws because `Level`/`Unit`/`Lesson`/`Exercise`/`UserProgress` don't exist on the client yet.

- [ ] **Step 3: Extend the Prisma schema**

Append to `prisma/schema.prisma` (after the existing `User` model), and add a `progress UserProgress[]` line inside the existing `User` model:

```prisma
enum LevelCode {
  A1
  A2
  B1
  B2
  C1
  C2
}

enum ExerciseType {
  MULTIPLE_CHOICE
  FILL_IN_BLANK
  MATCHING
  SENTENCE_ORDER
  SHORT_ANSWER
}

model Level {
  id    String    @id @default(cuid())
  code  LevelCode @unique
  order Int
  units Unit[]
}

model Unit {
  id      String @id @default(cuid())
  levelId String
  level   Level  @relation(fields: [levelId], references: [id])
  order   Int
  titleDe String
  titleEn String
  titleTr String
  lessons Lesson[]
}

model Lesson {
  id            String @id @default(cuid())
  unitId        String
  unit          Unit   @relation(fields: [unitId], references: [id])
  order         Int
  grammarTopic  String
  explanationDe String
  explanationEn String
  explanationTr String
  exercises     Exercise[]
  progress      UserProgress[]
}

model Exercise {
  id            String       @id @default(cuid())
  lessonId      String
  lesson        Lesson       @relation(fields: [lessonId], references: [id])
  order         Int
  type          ExerciseType
  data          Json
  correctAnswer Json
  explanation   String
}

model UserProgress {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  lessonId      String
  lesson        Lesson   @relation(fields: [lessonId], references: [id])
  completed     Boolean  @default(false)
  score         Int      @default(0)
  lastAttemptAt DateTime @default(now())

  @@unique([userId, lessonId])
}
```

In the existing `model User { ... }` block, add one line (anywhere among the fields):

```prisma
  progress UserProgress[]
```

- [ ] **Step 4: Run the migration**

Run: `npx prisma migrate dev --name exercise_engine`
Expected: migration created under `prisma/migrations/`, applied, `@prisma/client` regenerated.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- exerciseSchema`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add prisma tests/integration/exerciseSchema.test.ts
git commit -m "feat: add exercise engine data model (Level/Unit/Lesson/Exercise/UserProgress)"
```

---

### Task 2: Exercise Types & Answer-Checking Logic

**Files:**
- Create: `src/types/exercise.ts`
- Create: `src/lib/exerciseChecking.ts`
- Test: `tests/unit/exerciseChecking.test.ts`

**Interfaces:**
- Consumes: `ExerciseType` (Prisma-generated enum from Task 1).
- Produces: types `MultipleChoiceData/CorrectAnswer/UserAnswer`, `FillInBlankData/CorrectAnswer/UserAnswer`, `MatchingPair`, `MatchingData/CorrectAnswer/UserAnswer`, `SentenceOrderData/CorrectAnswer/UserAnswer`, `ShortAnswerData/CorrectAnswer/UserAnswer`, `SanitizedExercise` (all from `@/types/exercise`); `normalizeGermanText(text: string): string` and `checkAnswer(type: ExerciseType, correctAnswer: unknown, userAnswer: unknown): boolean` (both from `@/lib/exerciseChecking`). Tasks 5, 7, 8, 9 depend on these exact names.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/exerciseChecking.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { checkAnswer, normalizeGermanText } from '@/lib/exerciseChecking'

describe('normalizeGermanText', () => {
  it('lowercases and trims', () => {
    expect(normalizeGermanText('  Guten Tag  ')).toBe('guten tag')
  })

  it('treats umlauts and their ASCII spellings as equivalent', () => {
    expect(normalizeGermanText('fünf')).toBe(normalizeGermanText('fuenf'))
    expect(normalizeGermanText('schön')).toBe(normalizeGermanText('schoen'))
    expect(normalizeGermanText('groß')).toBe(normalizeGermanText('gross'))
  })
})

describe('checkAnswer', () => {
  it('grades MULTIPLE_CHOICE by matching index', () => {
    const correctAnswer = { correctIndex: 1 }
    expect(checkAnswer('MULTIPLE_CHOICE', correctAnswer, { selectedIndex: 1 })).toBe(true)
    expect(checkAnswer('MULTIPLE_CHOICE', correctAnswer, { selectedIndex: 0 })).toBe(false)
  })

  it('grades FILL_IN_BLANK with umlaut-tolerant matching', () => {
    const correctAnswer = { accepted: ['fünf'] }
    expect(checkAnswer('FILL_IN_BLANK', correctAnswer, { text: 'fünf' })).toBe(true)
    expect(checkAnswer('FILL_IN_BLANK', correctAnswer, { text: 'fuenf' })).toBe(true)
    expect(checkAnswer('FILL_IN_BLANK', correctAnswer, { text: 'Fünf' })).toBe(true)
    expect(checkAnswer('FILL_IN_BLANK', correctAnswer, { text: 'sechs' })).toBe(false)
  })

  it('grades MATCHING by comparing pair sets regardless of order', () => {
    const correctAnswer = {
      pairs: [
        { left: 'ich', right: 'bin' },
        { left: 'du', right: 'bist' },
      ],
    }
    expect(
      checkAnswer('MATCHING', correctAnswer, {
        pairs: [
          { left: 'du', right: 'bist' },
          { left: 'ich', right: 'bin' },
        ],
      })
    ).toBe(true)
    expect(
      checkAnswer('MATCHING', correctAnswer, {
        pairs: [
          { left: 'ich', right: 'bist' },
          { left: 'du', right: 'bin' },
        ],
      })
    ).toBe(false)
  })

  it('grades SENTENCE_ORDER by exact sequence', () => {
    const correctAnswer = { order: ['eins', 'zwei', 'drei'] }
    expect(checkAnswer('SENTENCE_ORDER', correctAnswer, { order: ['eins', 'zwei', 'drei'] })).toBe(true)
    expect(checkAnswer('SENTENCE_ORDER', correctAnswer, { order: ['zwei', 'eins', 'drei'] })).toBe(false)
  })

  it('grades SHORT_ANSWER with umlaut-tolerant matching against any accepted variant', () => {
    const correctAnswer = { accepted: ['ich heiße anna', 'ich heisse anna'] }
    expect(checkAnswer('SHORT_ANSWER', correctAnswer, { text: 'Ich heiße Anna' })).toBe(true)
    expect(checkAnswer('SHORT_ANSWER', correctAnswer, { text: 'ich heisse anna' })).toBe(true)
    expect(checkAnswer('SHORT_ANSWER', correctAnswer, { text: 'ich bin anna' })).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- exerciseChecking`
Expected: FAIL — `@/lib/exerciseChecking` not found.

- [ ] **Step 3: Create the type definitions**

Create `src/types/exercise.ts`:

```ts
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
  pairs: MatchingPair[]
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
```

- [ ] **Step 4: Implement the answer-checking logic**

Create `src/lib/exerciseChecking.ts`:

```ts
import type {
  ExerciseType,
  MultipleChoiceCorrectAnswer,
  MultipleChoiceUserAnswer,
  FillInBlankCorrectAnswer,
  FillInBlankUserAnswer,
  MatchingCorrectAnswer,
  MatchingUserAnswer,
  SentenceOrderCorrectAnswer,
  SentenceOrderUserAnswer,
  ShortAnswerCorrectAnswer,
  ShortAnswerUserAnswer,
} from '@/types/exercise'

export function normalizeGermanText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

export function checkAnswer(type: ExerciseType, correctAnswer: unknown, userAnswer: unknown): boolean {
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const correct = correctAnswer as MultipleChoiceCorrectAnswer
      const user = userAnswer as MultipleChoiceUserAnswer
      return correct.correctIndex === user.selectedIndex
    }
    case 'FILL_IN_BLANK': {
      const correct = correctAnswer as FillInBlankCorrectAnswer
      const user = userAnswer as FillInBlankUserAnswer
      const normalizedUser = normalizeGermanText(user.text)
      return correct.accepted.some((accepted) => normalizeGermanText(accepted) === normalizedUser)
    }
    case 'MATCHING': {
      const correct = correctAnswer as MatchingCorrectAnswer
      const user = userAnswer as MatchingUserAnswer
      if (correct.pairs.length !== user.pairs.length) return false
      return correct.pairs.every((pair) =>
        user.pairs.some((candidate) => candidate.left === pair.left && candidate.right === pair.right)
      )
    }
    case 'SENTENCE_ORDER': {
      const correct = correctAnswer as SentenceOrderCorrectAnswer
      const user = userAnswer as SentenceOrderUserAnswer
      return (
        correct.order.length === user.order.length &&
        correct.order.every((word, index) => word === user.order[index])
      )
    }
    case 'SHORT_ANSWER': {
      const correct = correctAnswer as ShortAnswerCorrectAnswer
      const user = userAnswer as ShortAnswerUserAnswer
      const normalizedUser = normalizeGermanText(user.text)
      return correct.accepted.some((accepted) => normalizeGermanText(accepted) === normalizedUser)
    }
    default:
      return false
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- exerciseChecking`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/exercise.ts src/lib/exerciseChecking.ts tests/unit/exerciseChecking.test.ts
git commit -m "feat: add exercise types and answer-checking logic"
```

---

### Task 3: Seed Content (A1 Full Unit + A2-C2 Sample Lessons)

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add `tsx` dev dependency and `prisma.seed` config)
- Test: `tests/integration/seedContent.test.ts`

**Interfaces:**
- Consumes: `Level`/`Unit`/`Lesson`/`Exercise` models (Task 1).
- Produces: persistent seeded rows in the database — 6 `Level` rows (A1-C2), an A1 unit "Begrüßung" with 3 lessons, and one sample unit+lesson each for A2/B1/B2/C1/C2. Tasks 5, 6, 9, 10, 11 rely on this data existing (in particular, the `Level` row with `code: 'A1'`).

- [ ] **Step 1: Write the failing content test**

Create `tests/integration/seedContent.test.ts`:

```ts
import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('seed content', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('has all six CEFR levels in order', async () => {
    const levels = await prisma.level.findMany({ orderBy: { order: 'asc' } })
    expect(levels.map((level) => level.code)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  })

  it('has one A1 unit with three lessons', async () => {
    const a1 = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const units = await prisma.unit.findMany({ where: { levelId: a1.id }, include: { lessons: true } })
    expect(units).toHaveLength(1)
    expect(units[0].lessons).toHaveLength(3)
  })

  it('has at least one lesson for every level above A1', async () => {
    const codes = ['A2', 'B1', 'B2', 'C1', 'C2'] as const
    for (const code of codes) {
      const level = await prisma.level.findUniqueOrThrow({ where: { code } })
      const units = await prisma.unit.findMany({ where: { levelId: level.id }, include: { lessons: true } })
      const lessonCount = units.reduce((sum, unit) => sum + unit.lessons.length, 0)
      expect(lessonCount).toBeGreaterThanOrEqual(1)
    }
  })

  it('uses all five exercise types across the seeded content', async () => {
    const exercises = await prisma.exercise.findMany({ select: { type: true } })
    const types = new Set(exercises.map((exercise) => exercise.type))
    expect(types).toEqual(
      new Set(['MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'MATCHING', 'SENTENCE_ORDER', 'SHORT_ANSWER'])
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- seedContent`
Expected: FAIL — no `Level` rows exist yet (`findUniqueOrThrow` throws).

- [ ] **Step 3: Install `tsx` and configure the seed command**

```bash
npm install -D tsx
```

In `package.json`, add a top-level `"prisma"` key (as a sibling of `"scripts"`, `"dependencies"`, etc.):

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 4: Write the seed script**

Create `prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Delete in FK-safe order so this script is safely re-runnable, even after
  // a learner has generated UserProgress rows against the seeded lessons.
  await prisma.userProgress.deleteMany({})
  await prisma.exercise.deleteMany({})
  await prisma.lesson.deleteMany({})
  await prisma.unit.deleteMany({})

  const levelInputs = [
    { code: 'A1' as const, order: 1 },
    { code: 'A2' as const, order: 2 },
    { code: 'B1' as const, order: 3 },
    { code: 'B2' as const, order: 4 },
    { code: 'C1' as const, order: 5 },
    { code: 'C2' as const, order: 6 },
  ]

  for (const input of levelInputs) {
    await prisma.level.upsert({
      where: { code: input.code },
      update: { order: input.order },
      create: { code: input.code, order: input.order },
    })
  }

  const [a1, a2, b1, b2, c1, c2] = await Promise.all(
    levelInputs.map((input) => prisma.level.findUniqueOrThrow({ where: { code: input.code } }))
  )

  // --- A1: Begrüßung (3 lessons) ---
  const a1Unit = await prisma.unit.create({
    data: { levelId: a1.id, order: 1, titleDe: 'Begrüßung', titleEn: 'Greetings', titleTr: 'Tanışma' },
  })

  const a1Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit.id,
      order: 1,
      grammarTopic: 'Begrüßungsformen',
      explanationDe:
        'Man begrüßt sich je nach Tageszeit unterschiedlich: "Guten Morgen" am Morgen, "Guten Tag" tagsüber, "Guten Abend" am Abend. "Hallo" passt informell zu jeder Zeit.',
      explanationEn:
        'Greetings differ by time of day: "Guten Morgen" (good morning), "Guten Tag" (good day), "Guten Abend" (good evening). "Hallo" (hello) works informally at any time.',
      explanationTr:
        'Selamlaşma günün saatine göre değişir: sabah "Guten Morgen", gün içinde "Guten Tag", akşam "Guten Abend". "Hallo" ise günün her saati kullanılabilecek resmi olmayan bir selamlaşmadır.',
    },
  })

  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was sagt man am Morgen?', options: ['Guten Abend', 'Guten Morgen', 'Gute Nacht', 'Tschüss'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Guten Morgen" wird morgens verwendet.',
      },
      {
        lessonId: a1Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ Tag! Wie geht es Ihnen?' },
        correctAnswer: { accepted: ['guten'] },
        explanation: '"Guten Tag" ist die formelle Begrüßung tagsüber.',
      },
    ],
  })

  const a1Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit.id,
      order: 2,
      grammarTopic: "Verb 'sein' im Präsens",
      explanationDe:
        'Das Verb "sein" wird konjugiert: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind. Man benutzt es auch, um sich vorzustellen: "Ich bin Anna."',
      explanationEn:
        'The verb "sein" (to be) conjugates as: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind. It is also used to introduce yourself: "Ich bin Anna" (I am Anna).',
      explanationTr:
        '"Sein" (olmak) fiili şöyle çekimlenir: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind. Kendini tanıtmak için de kullanılır: "Ich bin Anna" (Ben Anna\'yım).',
    },
  })

  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ Anna.', options: ['bin', 'bist', 'ist', 'sind'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" benutzt man "bin".',
      },
      {
        lessonId: a1Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'My name is Anna'?" },
        correctAnswer: { accepted: ['ich heiße anna', 'ich heisse anna'] },
        explanation: '"Ich heiße Anna" bedeutet "My name is Anna".',
      },
      {
        lessonId: a1Lesson2.id,
        order: 3,
        type: 'MATCHING',
        data: {
          pairs: [
            { left: 'ich', right: 'bin' },
            { left: 'du', right: 'bist' },
            { left: 'er/sie/es', right: 'ist' },
          ],
        },
        correctAnswer: {
          pairs: [
            { left: 'ich', right: 'bin' },
            { left: 'du', right: 'bist' },
            { left: 'er/sie/es', right: 'ist' },
          ],
        },
        explanation: 'Das sind die Präsensformen von "sein" für ich, du, er/sie/es.',
      },
    ],
  })

  const a1Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit.id,
      order: 3,
      grammarTopic: 'Zahlen 1-10',
      explanationDe: 'Die Zahlen von 1 bis 10 auf Deutsch: eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn.',
      explanationEn: 'The numbers from 1 to 10 in German: eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn.',
      explanationTr: 'Almanca 1\'den 10\'a kadar sayılar: eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn.',
    },
  })

  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Lesson3.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['zwei', 'eins', 'drei'] },
        correctAnswer: { order: ['eins', 'zwei', 'drei'] },
        explanation: 'Die richtige Reihenfolge ist eins, zwei, drei.',
      },
      {
        lessonId: a1Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: "Nach 'vier' kommt ___." },
        correctAnswer: { accepted: ['fünf'] },
        explanation: 'Nach vier kommt fünf.',
      },
    ],
  })

  // --- A2: Vergangenheit (1 sample lesson) ---
  const a2Unit = await prisma.unit.create({
    data: { levelId: a2.id, order: 1, titleDe: 'Vergangenheit', titleEn: 'Past Tense', titleTr: 'Geçmiş Zaman' },
  })
  const a2Lesson = await prisma.lesson.create({
    data: {
      unitId: a2Unit.id,
      order: 1,
      grammarTopic: "Perfekt mit 'haben'",
      explanationDe: 'Die meisten Verben bilden das Perfekt mit "haben" + Partizip II, z. B. "Ich habe gegessen."',
      explanationEn: 'Most verbs form the Perfekt (past tense) with "haben" + past participle, e.g. "Ich habe gegessen" (I have eaten).',
      explanationTr: 'Çoğu fiil Perfekt (geçmiş zaman) yapısını "haben" + Partizip II ile kurar, örn. "Ich habe gegessen" (Yedim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ gestern Pizza gegessen.', options: ['bin', 'habe', 'hat', 'haben'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Mit "ich" benutzt man "habe" im Perfekt.',
      },
      {
        lessonId: a2Lesson.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er hat ein Buch ___ (lesen).' },
        correctAnswer: { accepted: ['gelesen'] },
        explanation: 'Das Partizip II von "lesen" ist "gelesen".',
      },
    ],
  })

  // --- B1: Nebensätze (1 sample lesson) ---
  const b1Unit = await prisma.unit.create({
    data: { levelId: b1.id, order: 1, titleDe: 'Nebensätze', titleEn: 'Subordinate Clauses', titleTr: 'Yan Cümleler' },
  })
  const b1Lesson = await prisma.lesson.create({
    data: {
      unitId: b1Unit.id,
      order: 1,
      grammarTopic: "Nebensätze mit 'weil'",
      explanationDe: 'In "weil"-Sätzen steht das konjugierte Verb am Ende des Nebensatzes, z. B. "..., weil ich krank bin."',
      explanationEn: 'In "weil" (because) clauses, the conjugated verb moves to the end of the clause, e.g. "..., weil ich krank bin" (..., because I am sick).',
      explanationTr: '"Weil" (çünkü) cümlelerinde çekimli fiil cümlenin sonuna gider, örn. "..., weil ich krank bin" (..., çünkü hastayım).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich bleibe zu Hause, weil ich krank ___.', options: ['bin', 'ist', 'bist', 'sind'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" benutzt man "bin".',
      },
      {
        lessonId: b1Lesson.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['bin', 'weil', 'krank', 'ich'] },
        correctAnswer: { order: ['weil', 'ich', 'krank', 'bin'] },
        explanation: 'Im Nebensatz steht das Verb am Ende: "weil ich krank bin".',
      },
    ],
  })

  // --- B2: Passiv (1 sample lesson) ---
  const b2Unit = await prisma.unit.create({
    data: { levelId: b2.id, order: 1, titleDe: 'Passiv', titleEn: 'Passive Voice', titleTr: 'Edilgen Çatı' },
  })
  const b2Lesson = await prisma.lesson.create({
    data: {
      unitId: b2Unit.id,
      order: 1,
      grammarTopic: 'Vorgangspassiv im Präsens',
      explanationDe: 'Das Vorgangspassiv wird mit "werden" + Partizip II gebildet, z. B. "Das Haus wird gebaut."',
      explanationEn: 'The passive voice is formed with "werden" + past participle, e.g. "Das Haus wird gebaut" (The house is being built).',
      explanationTr: 'Edilgen çatı "werden" + Partizip II ile kurulur, örn. "Das Haus wird gebaut" (Ev inşa ediliyor).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Auto ___ repariert.', options: ['wird', 'ist', 'hat', 'wurde'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Präsens Passiv: "wird" + Partizip II.',
      },
      {
        lessonId: b2Lesson.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Tür ___ geöffnet.' },
        correctAnswer: { accepted: ['wird'] },
        explanation: 'Präsens Passiv von "öffnen": "wird geöffnet".',
      },
    ],
  })

  // --- C1: Indirekte Rede (1 sample lesson) ---
  const c1Unit = await prisma.unit.create({
    data: { levelId: c1.id, order: 1, titleDe: 'Indirekte Rede', titleEn: 'Reported Speech', titleTr: 'Dolaylı Anlatım' },
  })
  const c1Lesson = await prisma.lesson.create({
    data: {
      unitId: c1Unit.id,
      order: 1,
      grammarTopic: 'Konjunktiv I in der indirekten Rede',
      explanationDe: 'Der Konjunktiv I wird verwendet, um die Aussage einer anderen Person wiederzugeben, z. B. "Er sagt, er sei müde."',
      explanationEn: 'Konjunktiv I is used to report what someone else said, e.g. "Er sagt, er sei müde" (He says he is tired).',
      explanationTr: 'Konjunktiv I, başka birinin söylediğini aktarmak için kullanılır, örn. "Er sagt, er sei müde" (Yorgun olduğunu söylüyor).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er sagt, er ___ müde. (indirekte Rede)', options: ['ist', 'sei', 'war', 'wäre'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Konjunktiv I von "sein" für "er" ist "sei".',
      },
      {
        lessonId: c1Lesson.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie lautet die Konjunktiv-I-Form von 'haben' für 'er'?" },
        correctAnswer: { accepted: ['habe', 'er habe'] },
        explanation: 'Konjunktiv I von "haben" für "er" ist "habe".',
      },
    ],
  })

  // --- C2: Komplexe Konnektoren (1 sample lesson) ---
  const c2Unit = await prisma.unit.create({
    data: { levelId: c2.id, order: 1, titleDe: 'Komplexe Konnektoren', titleEn: 'Complex Connectors', titleTr: 'Karmaşık Bağlaçlar' },
  })
  const c2Lesson = await prisma.lesson.create({
    data: {
      unitId: c2Unit.id,
      order: 1,
      grammarTopic: "Konnektoren wie 'dennoch'",
      explanationDe: 'Fortgeschrittene Konnektoren wie "dennoch" (trotzdem) drücken einen Gegensatz aus und stehen am Satzanfang, gefolgt vom Verb.',
      explanationEn: 'Advanced connectors like "dennoch" (nevertheless) express contrast and stand at the start of the clause, followed by the verb.',
      explanationTr: '"Dennoch" (yine de) gibi ileri düzey bağlaçlar zıtlık ifade eder ve cümle başında, fiilden önce yer alır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'Er hat hart gearbeitet, ___ ist er nicht befördert worden.',
          options: ['dennoch', 'und', 'weil', 'obwohl'],
        },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Dennoch" drückt hier den Gegensatz aus und steht am Satzanfang mit Verb-Zweit-Stellung.',
      },
      {
        lessonId: c2Lesson.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Kosten sind hoch; ___ lohnt sich die Investition langfristig.' },
        correctAnswer: { accepted: ['dennoch'] },
        explanation: '"Dennoch" verbindet den Gegensatz zwischen hohen Kosten und langfristigem Nutzen.',
      },
    ],
  })

  console.log('Seed complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] **Step 5: Run the seed script**

Run: `npx prisma db seed`
Expected: console prints `Seed complete.` with no errors.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- seedContent`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json tests/integration/seedContent.test.ts
git commit -m "feat: seed A1 unit and multi-level sample content"
```

---

### Task 4: `learn` Translation Namespace

**Files:**
- Modify: `messages/en.json`, `messages/de.json`, `messages/tr.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: `learn` message namespace with keys `levelsTitle`, `unitsTitle`, `continue`, `checkAnswer`, `correct`, `incorrect`, `nextExercise`, `lessonComplete`, `score`, `backToLevels`, `startLesson`. Tasks 8 and 10 depend on these exact keys.

- [ ] **Step 1: Add the namespace to `messages/en.json`**

Add a new top-level key (alongside `nav`, `footer`, `cookieConsent`, `auth`):

```json
"learn": {
  "levelsTitle": "Levels",
  "unitsTitle": "Units",
  "continue": "Continue",
  "checkAnswer": "Check answer",
  "correct": "Correct!",
  "incorrect": "Incorrect",
  "nextExercise": "Next exercise",
  "lessonComplete": "Lesson complete!",
  "score": "Score",
  "backToLevels": "Back to levels",
  "startLesson": "Start lesson"
}
```

- [ ] **Step 2: Add the namespace to `messages/de.json`**

```json
"learn": {
  "levelsTitle": "Niveaus",
  "unitsTitle": "Einheiten",
  "continue": "Weiter",
  "checkAnswer": "Antwort prüfen",
  "correct": "Richtig!",
  "incorrect": "Falsch",
  "nextExercise": "Nächste Übung",
  "lessonComplete": "Lektion abgeschlossen!",
  "score": "Punktzahl",
  "backToLevels": "Zurück zu den Niveaus",
  "startLesson": "Lektion starten"
}
```

- [ ] **Step 3: Add the namespace to `messages/tr.json`**

```json
"learn": {
  "levelsTitle": "Seviyeler",
  "unitsTitle": "Üniteler",
  "continue": "Devam Et",
  "checkAnswer": "Cevabı kontrol et",
  "correct": "Doğru!",
  "incorrect": "Yanlış",
  "nextExercise": "Sonraki alıştırma",
  "lessonComplete": "Ders tamamlandı!",
  "score": "Puan",
  "backToLevels": "Seviyelere dön",
  "startLesson": "Derse başla"
}
```

- [ ] **Step 4: Run the key-consistency test**

Run: `npm test -- messages`
Expected: PASS (all three files still have matching keys).

- [ ] **Step 5: Commit**

```bash
git add messages
git commit -m "feat: add learn translation namespace"
```

---

### Task 5: Exercise Submission API Route

**Files:**
- Create: `src/app/api/exercises/[exerciseId]/submit/route.ts`
- Test: `tests/integration/exerciseSubmit.test.ts`

**Interfaces:**
- Consumes: `checkAnswer` from `@/lib/exerciseChecking` (Task 2), `authOptions` from `@/lib/auth` (Phase 1), seeded `Level` code `'A1'` (Task 3, used only to satisfy the `Unit.levelId` foreign key in the test fixture).
- Produces: `POST /api/exercises/[exerciseId]/submit` — body `{ answer: unknown }`, returns `200` with `{ correct: boolean, correctAnswer: unknown, explanation: string }`, `401` if unauthenticated, `404` if the exercise doesn't exist. Task 8 (`ExerciseRunner`) depends on this exact request/response shape.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/exerciseSubmit.test.ts`:

```ts
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { POST } from '@/app/api/exercises/[exerciseId]/submit/route'
import { prisma } from '@/lib/prisma'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/exercises/test/submit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/exercises/[exerciseId]/submit', () => {
  let unitId: string
  let lessonId: string
  let exerciseId: string

  beforeAll(async () => {
    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 998, titleDe: 'Test', titleEn: 'Submit Test Unit', titleTr: 'Test' },
    })
    unitId = unit.id
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Submit Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })
    lessonId = lesson.id
    const exercise = await prisma.exercise.create({
      data: {
        lessonId: lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Test?', options: ['A', 'B'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'B is correct.',
      },
    })
    exerciseId = exercise.id
  })

  afterAll(async () => {
    await prisma.exercise.deleteMany({ where: { lessonId } })
    await prisma.lesson.deleteMany({ where: { id: lessonId } })
    await prisma.unit.deleteMany({ where: { id: unitId } })
    await prisma.$disconnect()
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(makeRequest({ answer: { selectedIndex: 1 } }), {
      params: Promise.resolve({ exerciseId }),
    })
    expect(res.status).toBe(401)
  })

  it('returns correct: true for the right answer', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'someone' } } as never)
    const res = await POST(makeRequest({ answer: { selectedIndex: 1 } }), {
      params: Promise.resolve({ exerciseId }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.correct).toBe(true)
    expect(json.correctAnswer).toEqual({ correctIndex: 1 })
    expect(json.explanation).toBe('B is correct.')
  })

  it('returns correct: false for the wrong answer', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'someone' } } as never)
    const res = await POST(makeRequest({ answer: { selectedIndex: 0 } }), {
      params: Promise.resolve({ exerciseId }),
    })
    const json = await res.json()
    expect(json.correct).toBe(false)
  })

  it('returns 404 for an unknown exercise', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'someone' } } as never)
    const res = await POST(makeRequest({ answer: {} }), {
      params: Promise.resolve({ exerciseId: 'does-not-exist' }),
    })
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- exerciseSubmit`
Expected: FAIL — `src/app/api/exercises/[exerciseId]/submit/route.ts` not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/exercises/[exerciseId]/submit/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAnswer } from '@/lib/exerciseChecking'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { exerciseId } = await params
  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } })
  if (!exercise) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
  }

  const body = await request.json()
  const correct = checkAnswer(exercise.type, exercise.correctAnswer, body.answer)

  return NextResponse.json({
    correct,
    correctAnswer: exercise.correctAnswer,
    explanation: exercise.explanation,
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- exerciseSubmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/exercises tests/integration/exerciseSubmit.test.ts
git commit -m "feat: add exercise submission API route"
```

---

### Task 6: Lesson Completion API Route

**Files:**
- Create: `src/app/api/lessons/[lessonId]/complete/route.ts`
- Test: `tests/integration/lessonComplete.test.ts`

**Interfaces:**
- Consumes: `authOptions` from `@/lib/auth`, seeded `Level` code `'A1'` (Task 3, for the test fixture's FK chain).
- Produces: `POST /api/lessons/[lessonId]/complete` — body `{ score: number }`, returns `200` with `{ completed: true, score: number }` and upserts `UserProgress`, `401` if unauthenticated. Task 8 (`ExerciseRunner`) depends on this exact shape.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/lessonComplete.test.ts`:

```ts
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { POST } from '@/app/api/lessons/[lessonId]/complete/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/lessons/test/complete', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/lessons/[lessonId]/complete', () => {
  let userId: string
  let unitId: string
  let lessonId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'lesson-complete-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Lesson Complete Test',
      },
    })
    userId = user.id

    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 999, titleDe: 'Test', titleEn: 'Complete Test Unit', titleTr: 'Test' },
    })
    unitId = unit.id
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Complete Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })
    lessonId = lesson.id
  })

  afterAll(async () => {
    await prisma.userProgress.deleteMany({ where: { userId } })
    await prisma.lesson.deleteMany({ where: { id: lessonId } })
    await prisma.unit.deleteMany({ where: { id: unitId } })
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(makeRequest({ score: 100 }), { params: Promise.resolve({ lessonId }) })
    expect(res.status).toBe(401)
  })

  it('upserts progress for an authenticated user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: userId } } as never)
    const res = await POST(makeRequest({ score: 80 }), { params: Promise.resolve({ lessonId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ completed: true, score: 80 })

    const stored = await prisma.userProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })
    expect(stored?.completed).toBe(true)
    expect(stored?.score).toBe(80)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- lessonComplete`
Expected: FAIL — `src/app/api/lessons/[lessonId]/complete/route.ts` not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/lessons/[lessonId]/complete/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lessonId } = await params
  const body = await request.json()
  const score = typeof body.score === 'number' ? body.score : 0

  const progress = await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    update: { completed: true, score, lastAttemptAt: new Date() },
    create: { userId: session.user.id, lessonId, completed: true, score },
  })

  return NextResponse.json({ completed: progress.completed, score: progress.score })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- lessonComplete`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/lessons tests/integration/lessonComplete.test.ts
git commit -m "feat: add lesson completion API route"
```

---

### Task 7: Exercise Type UI Components + Pronunciation Button

**Files:**
- Create: `src/components/exercises/PronounceButton.tsx`
- Create: `src/components/exercises/MultipleChoiceExercise.tsx`
- Create: `src/components/exercises/FillInBlankExercise.tsx`
- Create: `src/components/exercises/MatchingExercise.tsx`
- Create: `src/components/exercises/SentenceOrderExercise.tsx`
- Create: `src/components/exercises/ShortAnswerExercise.tsx`
- Test: `tests/unit/pronounceButton.test.tsx`
- Test: `tests/unit/exerciseComponents.test.tsx`

**Interfaces:**
- Consumes: `MultipleChoiceData`, `FillInBlankData`, `MatchingData`, `SentenceOrderData`, `ShortAnswerData` and their `*UserAnswer` types from `@/types/exercise` (Task 2).
- Produces: `<PronounceButton text={string} />` (renders a 🔊 button that speaks German text via the browser's Web Speech API, or nothing if unsupported — per the design spec's pronunciation requirement); 5 client components, each taking `{ data, submitLabel, onAnswer }` and calling `onAnswer(userAnswer)` with the shape matching its `*UserAnswer` type. Task 8 (`ExerciseRunner`) renders the 5 exercise components directly.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/exerciseComponents.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MultipleChoiceExercise } from '@/components/exercises/MultipleChoiceExercise'
import { FillInBlankExercise } from '@/components/exercises/FillInBlankExercise'
import { MatchingExercise } from '@/components/exercises/MatchingExercise'
import { SentenceOrderExercise } from '@/components/exercises/SentenceOrderExercise'
import { ShortAnswerExercise } from '@/components/exercises/ShortAnswerExercise'

describe('MultipleChoiceExercise', () => {
  it('calls onAnswer with the selected index', () => {
    const onAnswer = vi.fn()
    render(
      <MultipleChoiceExercise
        data={{ prompt: 'Question?', options: ['A', 'B'] }}
        submitLabel="Check"
        onAnswer={onAnswer}
      />
    )
    fireEvent.click(screen.getByText('B'))
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({ selectedIndex: 1 })
  })
})

describe('FillInBlankExercise', () => {
  it('calls onAnswer with the typed text', () => {
    const onAnswer = vi.fn()
    render(<FillInBlankExercise data={{ sentence: '___ Tag!' }} submitLabel="Check" onAnswer={onAnswer} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Guten' } })
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({ text: 'Guten' })
  })
})

describe('MatchingExercise', () => {
  it('calls onAnswer with the selected pairs', () => {
    const onAnswer = vi.fn()
    render(
      <MatchingExercise
        data={{ pairs: [{ left: 'ich', right: 'bin' }, { left: 'du', right: 'bist' }] }}
        submitLabel="Check"
        onAnswer={onAnswer}
      />
    )
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'bin' } })
    fireEvent.change(selects[1], { target: { value: 'bist' } })
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({
      pairs: [
        { left: 'ich', right: 'bin' },
        { left: 'du', right: 'bist' },
      ],
    })
  })
})

describe('SentenceOrderExercise', () => {
  it('calls onAnswer with words in the clicked order', () => {
    const onAnswer = vi.fn()
    render(<SentenceOrderExercise data={{ words: ['zwei', 'eins'] }} submitLabel="Check" onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('eins'))
    fireEvent.click(screen.getByText('zwei'))
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({ order: ['eins', 'zwei'] })
  })
})

describe('ShortAnswerExercise', () => {
  it('calls onAnswer with the typed text', () => {
    const onAnswer = vi.fn()
    render(<ShortAnswerExercise data={{ prompt: 'Question?' }} submitLabel="Check" onAnswer={onAnswer} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ich heiße Anna' } })
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({ text: 'Ich heiße Anna' })
  })
})
```

- [ ] **Step 2: Write the failing PronounceButton test**

Create `tests/unit/pronounceButton.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PronounceButton } from '@/components/exercises/PronounceButton'

describe('PronounceButton', () => {
  afterEach(() => {
    // @ts-expect-error test cleanup — these globals don't exist in jsdom by default
    delete window.speechSynthesis
    // @ts-expect-error test cleanup
    delete window.SpeechSynthesisUtterance
  })

  it('renders nothing when the Web Speech API is unavailable', () => {
    const { container } = render(<PronounceButton text="Hallo" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('speaks the given text in German when clicked', () => {
    const speak = vi.fn()
    // @ts-expect-error test stub for an unimplemented browser API
    window.speechSynthesis = { speak }
    // @ts-expect-error test stub for an unimplemented browser API
    window.SpeechSynthesisUtterance = function (text: string) {
      return { text, lang: '' }
    }

    render(<PronounceButton text="Hallo" />)
    fireEvent.click(screen.getByRole('button'))
    expect(speak).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- exerciseComponents pronounceButton`
Expected: FAIL — none of the 5 exercise components or `PronounceButton` exist yet.

- [ ] **Step 4: Implement `PronounceButton`**

Create `src/components/exercises/PronounceButton.tsx`:

```tsx
'use client'

export function PronounceButton({ text }: { text: string }) {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  if (!supported) return null

  function handleClick() {
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button type="button" onClick={handleClick} aria-label="Pronounce" className="text-lg">
      🔊
    </button>
  )
}
```

- [ ] **Step 5: Implement `MultipleChoiceExercise`**

Create `src/components/exercises/MultipleChoiceExercise.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { MultipleChoiceData, MultipleChoiceUserAnswer } from '@/types/exercise'
import { PronounceButton } from './PronounceButton'

export function MultipleChoiceExercise({
  data,
  submitLabel,
  onAnswer,
}: {
  data: MultipleChoiceData
  submitLabel: string
  onAnswer: (answer: MultipleChoiceUserAnswer) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="font-medium">{data.prompt}</p>
        <PronounceButton text={data.prompt} />
      </div>
      <div className="flex flex-col gap-2">
        {data.options.map((option, index) => (
          <button
            key={option}
            type="button"
            onClick={() => setSelected(index)}
            className={`text-left border rounded px-3 py-2 ${selected === index ? 'border-gray-900 bg-gray-100' : ''}`}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={selected === null}
        onClick={() => selected !== null && onAnswer({ selectedIndex: selected })}
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Implement `FillInBlankExercise`**

Create `src/components/exercises/FillInBlankExercise.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { FillInBlankData, FillInBlankUserAnswer } from '@/types/exercise'
import { PronounceButton } from './PronounceButton'

export function FillInBlankExercise({
  data,
  submitLabel,
  onAnswer,
}: {
  data: FillInBlankData
  submitLabel: string
  onAnswer: (answer: FillInBlankUserAnswer) => void
}) {
  const [text, setText] = useState('')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="font-medium">{data.sentence}</p>
        <PronounceButton text={data.sentence} />
      </div>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="border rounded px-3 py-2"
      />
      <button
        type="button"
        disabled={text.trim().length === 0}
        onClick={() => onAnswer({ text })}
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 7: Implement `MatchingExercise`**

Create `src/components/exercises/MatchingExercise.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { MatchingData, MatchingUserAnswer } from '@/types/exercise'

export function MatchingExercise({
  data,
  submitLabel,
  onAnswer,
}: {
  data: MatchingData
  submitLabel: string
  onAnswer: (answer: MatchingUserAnswer) => void
}) {
  const [selections, setSelections] = useState<Record<string, string>>({})
  const rightOptions = data.pairs.map((pair) => pair.right)
  const canSubmit = data.pairs.every((pair) => selections[pair.left])

  return (
    <div className="flex flex-col gap-3">
      {data.pairs.map((pair) => (
        <div key={pair.left} className="flex items-center gap-2">
          <span className="w-24">{pair.left}</span>
          <select
            aria-label={pair.left}
            value={selections[pair.left] ?? ''}
            onChange={(event) => setSelections((prev) => ({ ...prev, [pair.left]: event.target.value }))}
            className="border rounded px-2 py-1"
          >
            <option value="" disabled>
              --
            </option>
            {rightOptions.map((right) => (
              <option key={right} value={right}>
                {right}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() =>
          onAnswer({
            pairs: data.pairs.map((pair) => ({ left: pair.left, right: selections[pair.left] })),
          })
        }
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 8: Implement `SentenceOrderExercise`**

Create `src/components/exercises/SentenceOrderExercise.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { SentenceOrderData, SentenceOrderUserAnswer } from '@/types/exercise'

export function SentenceOrderExercise({
  data,
  submitLabel,
  onAnswer,
}: {
  data: SentenceOrderData
  submitLabel: string
  onAnswer: (answer: SentenceOrderUserAnswer) => void
}) {
  const [chosen, setChosen] = useState<string[]>([])
  const remaining = data.words.filter((word) => !chosen.includes(word))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 min-h-[2.5rem] border rounded px-3 py-2">
        {chosen.map((word) => (
          <span key={word} className="px-2 py-1 bg-gray-100 rounded">
            {word}
          </span>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {remaining.map((word) => (
          <button
            key={word}
            type="button"
            onClick={() => setChosen((prev) => [...prev, word])}
            className="border rounded px-3 py-1"
          >
            {word}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={chosen.length !== data.words.length}
        onClick={() => onAnswer({ order: chosen })}
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 9: Implement `ShortAnswerExercise`**

Create `src/components/exercises/ShortAnswerExercise.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { ShortAnswerData, ShortAnswerUserAnswer } from '@/types/exercise'
import { PronounceButton } from './PronounceButton'

export function ShortAnswerExercise({
  data,
  submitLabel,
  onAnswer,
}: {
  data: ShortAnswerData
  submitLabel: string
  onAnswer: (answer: ShortAnswerUserAnswer) => void
}) {
  const [text, setText] = useState('')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="font-medium">{data.prompt}</p>
        <PronounceButton text={data.prompt} />
      </div>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="border rounded px-3 py-2"
      />
      <button
        type="button"
        disabled={text.trim().length === 0}
        onClick={() => onAnswer({ text })}
        className="bg-gray-900 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 10: Run the tests to verify they pass**

Run: `npm test -- exerciseComponents pronounceButton`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add src/components/exercises tests/unit/exerciseComponents.test.tsx tests/unit/pronounceButton.test.tsx
git commit -m "feat: add exercise type UI components and pronunciation button"
```

---

### Task 8: ExerciseRunner Component

**Files:**
- Create: `src/components/exercises/ExerciseRunner.tsx`
- Test: `tests/unit/exerciseRunner.test.tsx`

**Interfaces:**
- Consumes: `SanitizedExercise` from `@/types/exercise` (Task 2); all 5 components from Task 7; `learn` message namespace (Task 4); `useRouter` from `@/i18n/navigation` (Phase 1); `POST /api/exercises/[id]/submit` and `POST /api/lessons/[id]/complete` (Tasks 5, 6).
- Produces: `<ExerciseRunner exercises={SanitizedExercise[]} lessonId={string} />`. Task 10 (lesson page) renders this directly.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/exerciseRunner.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { ExerciseRunner } from '@/components/exercises/ExerciseRunner'
import en from '../../messages/en.json'
import type { SanitizedExercise } from '@/types/exercise'

const pushMock = vi.fn()

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function renderRunner(exercises: SanitizedExercise[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ExerciseRunner exercises={exercises} lessonId="lesson-1" />
    </NextIntlClientProvider>
  )
}

const exercises: SanitizedExercise[] = [
  {
    id: 'ex-1',
    lessonId: 'lesson-1',
    order: 1,
    type: 'MULTIPLE_CHOICE',
    data: { prompt: 'Question one?', options: ['A', 'B'] },
    explanation: 'Because B.',
  },
  {
    id: 'ex-2',
    lessonId: 'lesson-1',
    order: 2,
    type: 'SHORT_ANSWER',
    data: { prompt: 'Question two?' },
    explanation: 'Because text.',
  },
]

describe('ExerciseRunner', () => {
  beforeEach(() => {
    pushMock.mockReset()
    global.fetch = vi.fn()
  })

  it('renders the first exercise using its matching sub-component', () => {
    renderRunner(exercises)
    expect(screen.getByText('Question one?')).toBeInTheDocument()
  })

  it('shows feedback after answering and advances on next', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ correct: true, correctAnswer: { correctIndex: 1 }, explanation: 'Because B.' }),
    })

    renderRunner(exercises)
    fireEvent.click(screen.getByText('B'))
    fireEvent.click(screen.getByText(en.learn.checkAnswer))

    await waitFor(() => {
      expect(screen.getByText(en.learn.correct)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(en.learn.nextExercise))

    expect(screen.getByText('Question two?')).toBeInTheDocument()
  })

  it('shows the lesson-complete screen with the final score after the last exercise', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: async () => ({ correct: true, correctAnswer: { correctIndex: 1 }, explanation: 'Because B.' }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ correct: false, correctAnswer: { accepted: ['x'] }, explanation: 'Because text.' }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ completed: true, score: 1 }),
      })

    renderRunner(exercises)
    fireEvent.click(screen.getByText('B'))
    fireEvent.click(screen.getByText(en.learn.checkAnswer))
    await waitFor(() => screen.getByText(en.learn.correct))
    fireEvent.click(screen.getByText(en.learn.nextExercise))

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'anything' } })
    fireEvent.click(screen.getByText(en.learn.checkAnswer))
    await waitFor(() => screen.getByText(en.learn.incorrect))
    fireEvent.click(screen.getByText(en.learn.nextExercise))

    await waitFor(() => {
      expect(screen.getByText(en.learn.lessonComplete)).toBeInTheDocument()
    })
    expect(screen.getByText(`${en.learn.score}: 1 / 2`)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- exerciseRunner`
Expected: FAIL — `src/components/exercises/ExerciseRunner.tsx` not found.

- [ ] **Step 3: Implement `ExerciseRunner`**

Create `src/components/exercises/ExerciseRunner.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { MultipleChoiceExercise } from './MultipleChoiceExercise'
import { FillInBlankExercise } from './FillInBlankExercise'
import { MatchingExercise } from './MatchingExercise'
import { SentenceOrderExercise } from './SentenceOrderExercise'
import { ShortAnswerExercise } from './ShortAnswerExercise'
import type { SanitizedExercise } from '@/types/exercise'

interface SubmitResult {
  correct: boolean
  correctAnswer: unknown
  explanation: string
}

export function ExerciseRunner({
  exercises,
  lessonId,
}: {
  exercises: SanitizedExercise[]
  lessonId: string
}) {
  const t = useTranslations('learn')
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [finished, setFinished] = useState(false)

  const current = exercises[index]

  async function handleAnswer(answer: unknown) {
    const res = await fetch(`/api/exercises/${current.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    })
    const data: SubmitResult = await res.json()
    setResult(data)
    if (data.correct) setScore((previous) => previous + 1)
  }

  async function handleNext() {
    setResult(null)
    if (index + 1 < exercises.length) {
      setIndex(index + 1)
      return
    }
    await fetch(`/api/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    })
    setFinished(true)
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t('lessonComplete')}</h2>
        <p>
          {t('score')}: {score} / {exercises.length}
        </p>
        <button
          type="button"
          onClick={() => router.push('/learn')}
          className="bg-gray-900 text-white rounded px-4 py-2 self-start"
        >
          {t('backToLevels')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {!result && current.type === 'MULTIPLE_CHOICE' && (
        <MultipleChoiceExercise data={current.data as never} submitLabel={t('checkAnswer')} onAnswer={handleAnswer} />
      )}
      {!result && current.type === 'FILL_IN_BLANK' && (
        <FillInBlankExercise data={current.data as never} submitLabel={t('checkAnswer')} onAnswer={handleAnswer} />
      )}
      {!result && current.type === 'MATCHING' && (
        <MatchingExercise data={current.data as never} submitLabel={t('checkAnswer')} onAnswer={handleAnswer} />
      )}
      {!result && current.type === 'SENTENCE_ORDER' && (
        <SentenceOrderExercise data={current.data as never} submitLabel={t('checkAnswer')} onAnswer={handleAnswer} />
      )}
      {!result && current.type === 'SHORT_ANSWER' && (
        <ShortAnswerExercise data={current.data as never} submitLabel={t('checkAnswer')} onAnswer={handleAnswer} />
      )}
      {result && (
        <div className="flex flex-col gap-2">
          <p className={result.correct ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
            {result.correct ? t('correct') : t('incorrect')}
          </p>
          <p className="text-sm text-gray-700">{result.explanation}</p>
          <button
            type="button"
            onClick={handleNext}
            className="bg-gray-900 text-white rounded px-4 py-2 self-start"
          >
            {t('nextExercise')}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- exerciseRunner`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/exercises/ExerciseRunner.tsx tests/unit/exerciseRunner.test.tsx
git commit -m "feat: add ExerciseRunner component"
```

---

### Task 9: Learn Data-Access Layer

**Files:**
- Create: `src/lib/learn.ts`
- Test: `tests/integration/learn.test.ts`

**Interfaces:**
- Consumes: seeded content from Task 3 (must already exist in the database — this task's tests read the real seeded `A1` unit).
- Produces: `getLevels(): Promise<LevelSummary[]>`, `getUnitsForLevel(code: LevelCode, userId: string): Promise<UnitWithLessons[]>`, `getLessonWithExercises(lessonId: string): Promise<LessonWithExercises | null>`, `pickByLocale(locale: string, fields: { de: string; en: string; tr: string }): string` — all from `@/lib/learn`. Task 10 (pages) depends on these exact names and return shapes.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/learn.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getLevels, getUnitsForLevel, getLessonWithExercises, pickByLocale } from '@/lib/learn'

describe('getLevels', () => {
  it('returns all six levels in order with unit counts', async () => {
    const levels = await getLevels()
    expect(levels.map((level) => level.code)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    const a1 = levels.find((level) => level.code === 'A1')
    expect(a1?.unitCount).toBe(1)
  })
})

describe('getUnitsForLevel', () => {
  it('returns the A1 unit with three lessons and no progress for a new user', async () => {
    const units = await getUnitsForLevel('A1', 'nonexistent-user-id')
    expect(units).toHaveLength(1)
    expect(units[0].lessons).toHaveLength(3)
    expect(units[0].lessons.every((lesson) => lesson.completed === false)).toBe(true)
  })
})

describe('getLessonWithExercises', () => {
  it('returns lesson exercises without leaking correctAnswer', async () => {
    const units = await getUnitsForLevel('A1', 'nonexistent-user-id')
    const firstLessonId = units[0].lessons[0].id
    const lesson = await getLessonWithExercises(firstLessonId)
    expect(lesson).not.toBeNull()
    expect(lesson!.exercises.length).toBeGreaterThan(0)
    for (const exercise of lesson!.exercises) {
      expect('correctAnswer' in exercise).toBe(false)
    }
  })

  it('returns null for an unknown lesson id', async () => {
    const lesson = await getLessonWithExercises('does-not-exist')
    expect(lesson).toBeNull()
  })
})

describe('pickByLocale', () => {
  it('returns the German field for locale "de"', () => {
    expect(pickByLocale('de', { de: 'Hallo', en: 'Hello', tr: 'Merhaba' })).toBe('Hallo')
  })

  it('returns the Turkish field for locale "tr"', () => {
    expect(pickByLocale('tr', { de: 'Hallo', en: 'Hello', tr: 'Merhaba' })).toBe('Merhaba')
  })

  it('falls back to English for any other locale', () => {
    expect(pickByLocale('en', { de: 'Hallo', en: 'Hello', tr: 'Merhaba' })).toBe('Hello')
    expect(pickByLocale('fr', { de: 'Hallo', en: 'Hello', tr: 'Merhaba' })).toBe('Hello')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- learn.test`
Expected: FAIL — `@/lib/learn` not found.

- [ ] **Step 3: Implement the data-access layer**

Create `src/lib/learn.ts`:

```ts
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

export async function getUnitsForLevel(code: LevelCode, userId: string): Promise<UnitWithLessons[]> {
  const level = await prisma.level.findUnique({
    where: { code },
    include: {
      units: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { progress: { where: { userId } } },
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- learn.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/learn.ts tests/integration/learn.test.ts
git commit -m "feat: add learn data-access layer"
```

---

### Task 10: Learn Pages

**Files:**
- Create: `src/app/[locale]/learn/page.tsx`
- Create: `src/app/[locale]/learn/[level]/page.tsx`
- Create: `src/app/[locale]/learn/[level]/[unit]/[lesson]/page.tsx`

**Interfaces:**
- Consumes: `getLevels`, `getUnitsForLevel`, `getLessonWithExercises`, `pickByLocale` from `@/lib/learn` (Task 9); `ExerciseRunner` from `@/components/exercises/ExerciseRunner` (Task 8); `authOptions` from `@/lib/auth`; `Link` from `@/i18n/navigation`; `learn` messages (Task 4).
- Produces: `/learn`, `/learn/[level]`, `/learn/[level]/[unit]/[lesson]` pages, gated behind an authenticated session. No automated test for these three files — they are thin server components whose data logic is already covered by Task 9's integration tests; they are verified manually in Task 11 (this matches the Phase 1 precedent where `src/app/[locale]/page.tsx` also has no dedicated unit test).

- [ ] **Step 1: Create the levels page**

Create `src/app/[locale]/learn/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { getLevels } from '@/lib/learn'
import { Link } from '@/i18n/navigation'

export default async function LevelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('learn')
  const levels = await getLevels()

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t('levelsTitle')}</h1>
      <ul className="flex flex-col gap-2">
        {levels.map((level) => (
          <li key={level.code}>
            <Link href={`/learn/${level.code}`} className="underline">
              {level.code} ({level.unitCount})
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 2: Create the level units page**

Create `src/app/[locale]/learn/[level]/page.tsx`:

```tsx
import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { getUnitsForLevel, pickByLocale } from '@/lib/learn'
import { Link } from '@/i18n/navigation'
import type { LevelCode } from '@prisma/client'

const VALID_LEVELS: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default async function LevelUnitsPage({
  params,
}: {
  params: Promise<{ locale: string; level: string }>
}) {
  const { locale, level } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  if (!VALID_LEVELS.includes(level as LevelCode)) {
    notFound()
  }

  const t = await getTranslations('learn')
  const units = await getUnitsForLevel(level as LevelCode, session.user.id)

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        {level} — {t('unitsTitle')}
      </h1>
      {units.map((unit) => (
        <div key={unit.id} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {pickByLocale(locale, { de: unit.titleDe, en: unit.titleEn, tr: unit.titleTr })}
          </h2>
          <ul className="flex flex-col gap-1">
            {unit.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link href={`/learn/${level}/${unit.id}/${lesson.id}`} className="underline">
                  {lesson.grammarTopic} {lesson.completed ? '✓' : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </main>
  )
}
```

- [ ] **Step 3: Create the lesson page**

Create `src/app/[locale]/learn/[level]/[unit]/[lesson]/page.tsx`:

```tsx
import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLessonWithExercises, pickByLocale } from '@/lib/learn'
import { ExerciseRunner } from '@/components/exercises/ExerciseRunner'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; unit: string; lesson: string }>
}) {
  const { locale, lesson: lessonId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const lesson = await getLessonWithExercises(lessonId)
  if (!lesson) {
    notFound()
  }

  const explanation = pickByLocale(locale, {
    de: lesson.explanationDe,
    en: lesson.explanationEn,
    tr: lesson.explanationTr,
  })

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{lesson.grammarTopic}</h1>
        <p className="text-gray-700">{explanation}</p>
      </div>
      <ExerciseRunner exercises={lesson.exercises} lessonId={lesson.id} />
    </main>
  )
}
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS — all tests from Phase 1 and Tasks 1-9 of this plan still pass (these 3 page files have no dedicated tests, per the Interfaces note above).

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/learn
git commit -m "feat: add /learn pages"
```

---

### Task 11: Manual End-to-End Verification & Final Commit

**Files:** none (verification only).

**Interfaces:**
- Consumes: everything from Tasks 1-10.
- Produces: confirmation that Phase 2's Definition of Done (below) is met.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify the unauthenticated redirect**

Visit `http://localhost:3000/en/learn` while logged out. Expected: redirected to `/en/login`.

- [ ] **Step 3: Log in and complete the full A1 unit**

Log in with an existing test account (or register a new one at `/en/register`). Visit `/en/learn`, click into `A1`, open each of the 3 lessons in the "Begrüßung" unit in order, answer every exercise (mix of correct and incorrect answers to see both feedback states), and confirm each lesson ends with a "Lesson complete!" screen showing a score, and that completed lessons show a ✓ back on the unit list.

- [ ] **Step 4: Spot-check one sample lesson per remaining level**

Visit `/en/learn/A2`, `/en/learn/B1`, `/en/learn/B2`, `/en/learn/C1`, `/en/learn/C2` in turn — each should show one unit with one lesson, and completing it should show correct/incorrect feedback and a final score.

- [ ] **Step 5: Verify translated content**

Switch the language switcher to `DE` and `TR` while browsing `/learn` — confirm the unit titles and lesson explanations change language (grammar topic names and German example sentences stay in German, per design), and that all `learn`-namespace UI strings (buttons, feedback, "Lesson complete!") are translated.

- [ ] **Step 6: Stop the dev server**

Press `Ctrl+C` in the terminal running `npm run dev`.

- [ ] **Step 7: Run the full test suite one last time**

Run: `npm test`
Expected: PASS — every test from Phase 1 and this plan is green.

- [ ] **Step 8: Final commit (if any uncommitted changes remain)**

```bash
git status
```

If clean, no commit is needed — Tasks 1-10 already committed everything. If anything is uncommitted (e.g. a fix made during manual verification), commit it with a descriptive message before moving on.

---

## Phase 2 Definition of Done

- `npm test` passes with all unit and integration tests green (Phase 1 tests + this plan's new tests).
- A logged-in visitor can browse `/learn`, see all 6 levels (A1-C2), complete the full 3-lesson A1 unit and one sample lesson from each of A2/B1/B2/C1/C2, using all 5 exercise types, with correct/incorrect feedback and a final score per lesson.
- An unauthenticated visitor is redirected to `/login` when visiting any `/learn` route.
- `correctAnswer` is never present in data sent to the browser before an answer is submitted.
- The `Level`/`Unit`/`Lesson`/`Exercise`/`UserProgress` tables are ready for Phase 3 (A2-C2 full content, added via a future admin panel or further seed scripts) without schema changes.
