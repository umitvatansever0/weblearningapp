# Phase 3 — Gamification + Vocabulary Spaced-Repetition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add streak/XP/badge gamification and an SM-2 spaced-repetition vocabulary system on top of the Phase 2 exercise engine, so completing a lesson rewards the user and builds a `/vocab` review deck.

**Architecture:** Two new pure-function modules (`src/lib/spacedRepetition.ts`, `src/lib/streak.ts`) hold testable algorithms with no DB access. `src/lib/gamification.ts` orchestrates them against Prisma (`applyLessonCompletionRewards`, `checkAndAwardBadges`) and is called by the existing `/api/lessons/[lessonId]/complete` route as a side effect — the route's existing response shape is unchanged. A new `POST /api/vocab/[cardId]/review` route handles SM-2 grading. Two new server-component pages (`/dashboard`, `/vocab`) read directly via Prisma, matching the Phase 2 `/learn` pages pattern.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma + PostgreSQL, NextAuth.js (session gating), next-intl, Vitest + Testing Library. No new runtime dependencies.

## Global Constraints

- Every UI-facing string must be added to `messages/de.json`, `messages/en.json`, and `messages/tr.json` with matching keys — enforced by `tests/unit/messages.test.ts`. No hardcoded UI text in components.
- TypeScript strict mode stays enabled; no new `any` types.
- All new Prisma models/fields are additive only — no changes to existing Phase 1/2 columns or types.
- `/dashboard` and `/vocab` pages and their mutating API routes require an authenticated session (`getServerSession(authOptions)`); unauthenticated requests are redirected (pages) or receive `401` (API routes), matching the Phase 2 `/learn` precedent.
- The existing `POST /api/lessons/[lessonId]/complete` response shape (`{ completed: boolean, score: number }`) must not change — reward logic is a side effect, not a response-shape change.
- Do not add `dailyGoal` customization, admin CRUD for Badge/VocabWord, public SEO pages, ad slots, or additional A2-C2 curriculum content — those belong to later phases per `docs/superpowers/specs/2026-09-12-german-learning-platform-design.md`.
- This plan builds on the completed Phase 2 (`docs/superpowers/plans/2026-09-12-phase2-exercise-engine.md`): `Level`/`Unit`/`Lesson`/`Exercise`/`UserProgress` models, `authOptions` from `@/lib/auth`, `@/i18n/navigation`, `@/i18n/routing`, and the `[locale]` layout are already in place and must not be modified except where a task explicitly says so.

---

### Task 1: Gamification & Vocab Data Model

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/integration/gamificationSchema.test.ts`

**Interfaces:**
- Consumes: existing `User`, `Lesson` models (Phase 1/2).
- Produces: `User.streak`, `User.lastActivityDate`, `User.xp` fields; models `VocabWord`, `UserVocabCard`, `Badge`, `UserBadge`. Every later task in this plan depends on these exact field/model names.

- [ ] **Step 1: Write the failing schema integration test**

Create `tests/integration/gamificationSchema.test.ts`:

```ts
import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

describe('gamification schema', () => {
  afterAll(async () => {
    await prisma.userBadge.deleteMany({ where: { user: { email: 'schema-gamification-test@example.com' } } })
    await prisma.userVocabCard.deleteMany({ where: { user: { email: 'schema-gamification-test@example.com' } } })
    await prisma.badge.deleteMany({ where: { code: 'schema_test_badge' } })
    await prisma.vocabWord.deleteMany({ where: { word: 'SchemaTestWort' } })
    await prisma.user.deleteMany({ where: { email: 'schema-gamification-test@example.com' } })
    await prisma.$disconnect()
  })

  it('adds streak/xp fields to User with correct defaults', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'schema-gamification-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Schema Gamification Test',
      },
    })
    expect(user.streak).toBe(0)
    expect(user.xp).toBe(0)
    expect(user.lastActivityDate).toBeNull()
  })

  it('creates a VocabWord tied to a Lesson, a UserVocabCard, a Badge, and a UserBadge', async () => {
    const level = await prisma.level.upsert({
      where: { code: 'A1' },
      update: {},
      create: { code: 'A1', order: 1 },
    })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 997, titleDe: 'Test', titleEn: 'Schema Vocab Test Unit', titleTr: 'Test' },
    })
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Schema Vocab Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })
    const word = await prisma.vocabWord.create({
      data: {
        lessonId: lesson.id,
        word: 'SchemaTestWort',
        translationEn: 'schema test word',
        translationTr: 'şema test kelimesi',
        exampleSentence: 'Das ist ein SchemaTestWort.',
      },
    })

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'schema-gamification-test@example.com' } })

    const card = await prisma.userVocabCard.create({
      data: { userId: user.id, vocabWordId: word.id },
    })
    expect(card.easeFactor).toBe(2.5)
    expect(card.interval).toBe(0)
    expect(card.repetitions).toBe(0)

    const badge = await prisma.badge.create({
      data: { code: 'schema_test_badge', titleDe: 'Test', titleEn: 'Test', titleTr: 'Test' },
    })
    const userBadge = await prisma.userBadge.create({
      data: { userId: user.id, badgeId: badge.id },
    })
    expect(userBadge.earnedAt).toBeInstanceOf(Date)

    await prisma.userVocabCard.deleteMany({ where: { userId: user.id } })
    await prisma.userBadge.deleteMany({ where: { userId: user.id } })
    await prisma.badge.deleteMany({ where: { code: 'schema_test_badge' } })
    await prisma.vocabWord.deleteMany({ where: { id: word.id } })
    await prisma.lesson.deleteMany({ where: { id: lesson.id } })
    await prisma.unit.deleteMany({ where: { id: unit.id } })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- gamificationSchema`
Expected: FAIL — `prisma.vocabWord` (and related) do not exist on the client yet.

- [ ] **Step 3: Extend the schema**

In `prisma/schema.prisma`, modify the `User` model (add three fields and two relations) — replace:

```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String
  name         String
  role         Role       @default(USER)
  uiLanguage   UiLanguage @default(EN)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  progress     UserProgress[]
}
```

with:

```prisma
model User {
  id               String     @id @default(cuid())
  email            String     @unique
  passwordHash     String
  name             String
  role             Role       @default(USER)
  uiLanguage       UiLanguage @default(EN)
  streak           Int        @default(0)
  lastActivityDate DateTime?
  xp               Int        @default(0)
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  progress         UserProgress[]
  vocabCards       UserVocabCard[]
  badges           UserBadge[]
}
```

Add `vocabWords VocabWord[]` to the `Lesson` model — replace:

```prisma
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
```

with:

```prisma
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
  vocabWords    VocabWord[]
}
```

Append these new models at the end of the file:

```prisma
model VocabWord {
  id              String @id @default(cuid())
  lessonId        String
  lesson          Lesson @relation(fields: [lessonId], references: [id])
  word            String
  translationEn   String
  translationTr   String
  exampleSentence String
  cards           UserVocabCard[]
}

model UserVocabCard {
  id             String    @id @default(cuid())
  userId         String
  user           User      @relation(fields: [userId], references: [id])
  vocabWordId    String
  vocabWord      VocabWord @relation(fields: [vocabWordId], references: [id])
  easeFactor     Float     @default(2.5)
  interval       Int       @default(0)
  repetitions    Int       @default(0)
  dueDate        DateTime  @default(now())
  lastReviewedAt DateTime?

  @@unique([userId, vocabWordId])
}

model Badge {
  id      String @id @default(cuid())
  code    String @unique
  titleDe String
  titleEn String
  titleTr String
  users   UserBadge[]
}

model UserBadge {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  badgeId  String
  badge    Badge    @relation(fields: [badgeId], references: [id])
  earnedAt DateTime @default(now())

  @@unique([userId, badgeId])
}
```

- [ ] **Step 4: Run the migration**

Run: `npx prisma migrate dev --name gamification_vocab`
Expected: migration created under `prisma/migrations/`, applied to the database, `@prisma/client` regenerated automatically.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- gamificationSchema`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add prisma tests/integration/gamificationSchema.test.ts
git commit -m "feat: add gamification and vocab spaced-repetition data model"
```

---

### Task 2: Seed Badges & Vocab Words

**Files:**
- Modify: `prisma/seed.ts`
- Test: `tests/integration/gamificationSeedContent.test.ts`

**Interfaces:**
- Consumes: `Badge`, `VocabWord` models (Task 1); existing lesson variables in `prisma/seed.ts` (`a1Lesson1`, `a1Lesson2`, `a1Lesson3`, `a2Lesson`, `b1Lesson`, `b2Lesson`, `c1Lesson`, `c2Lesson`).
- Produces: 6 seeded `Badge` rows (codes: `first_lesson`, `streak_3`, `streak_7`, `first_vocab_review`, `a1_complete`, `xp_100`); 2 `VocabWord` rows per existing lesson (16 total). Task 5 (`checkAndAwardBadges`) depends on these exact badge codes existing.

- [ ] **Step 1: Write the failing content test**

Create `tests/integration/gamificationSeedContent.test.ts`:

```ts
import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('gamification seed content', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('has all six badges seeded', async () => {
    const badges = await prisma.badge.findMany({ select: { code: true } })
    const codes = new Set(badges.map((badge) => badge.code))
    expect(codes).toEqual(
      new Set(['first_lesson', 'streak_3', 'streak_7', 'first_vocab_review', 'a1_complete', 'xp_100'])
    )
  })

  it('has at least one vocab word for every seeded lesson', async () => {
    const lessons = await prisma.lesson.findMany({ include: { vocabWords: true } })
    expect(lessons.length).toBeGreaterThan(0)
    for (const lesson of lessons) {
      expect(lesson.vocabWords.length).toBeGreaterThanOrEqual(2)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- gamificationSeedContent`
Expected: FAIL — no `Badge` rows exist yet, `vocabWords` empty.

- [ ] **Step 3: Add badge seeding**

In `prisma/seed.ts`, add this block right after the `levelInputs`/`Level` upsert loop (after the `const [a1, a2, b1, b2, c1, c2] = ...` line, before the `// --- A1: Begrüßung` comment):

```ts
  const badgeInputs = [
    { code: 'first_lesson', titleDe: 'Erste Lektion', titleEn: 'First Lesson', titleTr: 'İlk Ders' },
    { code: 'streak_3', titleDe: '3-Tage-Serie', titleEn: '3-Day Streak', titleTr: '3 Günlük Seri' },
    { code: 'streak_7', titleDe: '7-Tage-Serie', titleEn: '7-Day Streak', titleTr: '7 Günlük Seri' },
    {
      code: 'first_vocab_review',
      titleDe: 'Erste Wortkarte',
      titleEn: 'First Vocab Review',
      titleTr: 'İlk Kelime Tekrarı',
    },
    { code: 'a1_complete', titleDe: 'A1 abgeschlossen', titleEn: 'A1 Complete', titleTr: 'A1 Tamamlandı' },
    { code: 'xp_100', titleDe: '100 XP', titleEn: '100 XP', titleTr: '100 XP' },
  ]

  for (const input of badgeInputs) {
    await prisma.badge.upsert({
      where: { code: input.code },
      update: { titleDe: input.titleDe, titleEn: input.titleEn, titleTr: input.titleTr },
      create: input,
    })
  }
```

- [ ] **Step 4: Add vocab word seeding**

In `prisma/seed.ts`, add this block immediately before the `console.log('Seed complete.')` line, at the end of `main()`:

```ts
  await prisma.vocabWord.createMany({
    data: [
      {
        lessonId: a1Lesson1.id,
        word: 'Guten Morgen',
        translationEn: 'good morning',
        translationTr: 'günaydın',
        exampleSentence: 'Guten Morgen, wie geht es dir?',
      },
      {
        lessonId: a1Lesson1.id,
        word: 'Hallo',
        translationEn: 'hello',
        translationTr: 'merhaba',
        exampleSentence: 'Hallo, ich bin Anna.',
      },
      {
        lessonId: a1Lesson2.id,
        word: 'sein',
        translationEn: 'to be',
        translationTr: 'olmak',
        exampleSentence: 'Ich bin müde.',
      },
      {
        lessonId: a1Lesson2.id,
        word: 'heißen',
        translationEn: 'to be called',
        translationTr: 'adında olmak',
        exampleSentence: 'Ich heiße Anna.',
      },
      {
        lessonId: a1Lesson3.id,
        word: 'eins',
        translationEn: 'one',
        translationTr: 'bir',
        exampleSentence: 'Ich habe eins.',
      },
      {
        lessonId: a1Lesson3.id,
        word: 'zehn',
        translationEn: 'ten',
        translationTr: 'on',
        exampleSentence: 'Zehn Finger habe ich.',
      },
      {
        lessonId: a2Lesson.id,
        word: 'essen',
        translationEn: 'to eat',
        translationTr: 'yemek',
        exampleSentence: 'Ich habe Pizza gegessen.',
      },
      {
        lessonId: a2Lesson.id,
        word: 'lesen',
        translationEn: 'to read',
        translationTr: 'okumak',
        exampleSentence: 'Er hat ein Buch gelesen.',
      },
      {
        lessonId: b1Lesson.id,
        word: 'krank',
        translationEn: 'sick',
        translationTr: 'hasta',
        exampleSentence: 'Ich bin krank.',
      },
      {
        lessonId: b1Lesson.id,
        word: 'weil',
        translationEn: 'because',
        translationTr: 'çünkü',
        exampleSentence: 'Ich bleibe zu Hause, weil ich krank bin.',
      },
      {
        lessonId: b2Lesson.id,
        word: 'reparieren',
        translationEn: 'to repair',
        translationTr: 'tamir etmek',
        exampleSentence: 'Das Auto wird repariert.',
      },
      {
        lessonId: b2Lesson.id,
        word: 'öffnen',
        translationEn: 'to open',
        translationTr: 'açmak',
        exampleSentence: 'Die Tür wird geöffnet.',
      },
      {
        lessonId: c1Lesson.id,
        word: 'müde',
        translationEn: 'tired',
        translationTr: 'yorgun',
        exampleSentence: 'Er sagt, er sei müde.',
      },
      {
        lessonId: c1Lesson.id,
        word: 'sagen',
        translationEn: 'to say',
        translationTr: 'söylemek',
        exampleSentence: 'Er sagt, er sei müde.',
      },
      {
        lessonId: c2Lesson.id,
        word: 'dennoch',
        translationEn: 'nevertheless',
        translationTr: 'yine de',
        exampleSentence: 'Er hat hart gearbeitet, dennoch ist er nicht befördert worden.',
      },
      {
        lessonId: c2Lesson.id,
        word: 'sich lohnen',
        translationEn: 'to be worth it',
        translationTr: 'değmek',
        exampleSentence: 'Die Investition lohnt sich langfristig.',
      },
    ],
  })
```

Also add `await prisma.vocabWord.deleteMany({})` to the FK-safe delete block at the top of `main()`, right after `await prisma.userProgress.deleteMany({})` and before `await prisma.exercise.deleteMany({})` (VocabWord has no FK dependents among the deleted rows, but deleting it before `lesson.deleteMany` keeps the order safe):

```ts
  await prisma.userProgress.deleteMany({})
  await prisma.vocabWord.deleteMany({})
  await prisma.exercise.deleteMany({})
  await prisma.lesson.deleteMany({})
  await prisma.unit.deleteMany({})
```

- [ ] **Step 5: Re-run the seed script**

Run: `npx tsx prisma/seed.ts` (or `npx prisma db seed` if that's how Phase 2 invoked it — check `package.json`'s `prisma.seed` config)
Expected: "Seed complete." printed, no errors.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- gamificationSeedContent`
Expected: PASS.

- [ ] **Step 7: Run the full suite to confirm no regressions**

Run: `npm test`
Expected: PASS — all Phase 1/2 tests plus the two new tests from this plan.

- [ ] **Step 8: Commit**

```bash
git add prisma/seed.ts tests/integration/gamificationSeedContent.test.ts
git commit -m "feat: seed badges and vocab words"
```

---

### Task 3: Spaced Repetition Algorithm (SM-2)

**Files:**
- Create: `src/lib/spacedRepetition.ts`
- Test: `tests/unit/spacedRepetition.test.ts`

**Interfaces:**
- Consumes: nothing (pure function, no DB).
- Produces: `type VocabGrade = 'again' | 'hard' | 'good' | 'easy'`; `applySM2Grade(card: { easeFactor: number; interval: number; repetitions: number }, grade: VocabGrade): { easeFactor: number; interval: number; repetitions: number; dueDate: Date }` from `@/lib/spacedRepetition`. Task 7 (vocab review route) depends on this exact name and signature.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/spacedRepetition.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { applySM2Grade } from '@/lib/spacedRepetition'

const newCard = { easeFactor: 2.5, interval: 0, repetitions: 0 }

describe('applySM2Grade', () => {
  it('resets repetitions and sets a 1-day interval on "again"', () => {
    const result = applySM2Grade({ easeFactor: 2.5, interval: 6, repetitions: 2 }, 'again')
    expect(result.repetitions).toBe(0)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBeCloseTo(2.3)
  })

  it('never lowers easeFactor below 1.3', () => {
    const result = applySM2Grade({ easeFactor: 1.35, interval: 1, repetitions: 0 }, 'again')
    expect(result.easeFactor).toBe(1.3)
  })

  it('sets interval to 1 day on first "good" grade', () => {
    const result = applySM2Grade(newCard, 'good')
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBe(2.5)
  })

  it('sets interval to 6 days on second "good" grade', () => {
    const result = applySM2Grade({ easeFactor: 2.5, interval: 1, repetitions: 1 }, 'good')
    expect(result.repetitions).toBe(2)
    expect(result.interval).toBe(6)
  })

  it('multiplies interval by easeFactor on third+ "good" grade', () => {
    const result = applySM2Grade({ easeFactor: 2.0, interval: 6, repetitions: 2 }, 'good')
    expect(result.repetitions).toBe(3)
    expect(result.interval).toBe(12)
  })

  it('sets interval to 4 days on first "easy" grade and raises easeFactor', () => {
    const result = applySM2Grade(newCard, 'easy')
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBe(4)
    expect(result.easeFactor).toBeCloseTo(2.65)
  })

  it('applies a 1.3x bonus on third+ "easy" grade', () => {
    const result = applySM2Grade({ easeFactor: 2.0, interval: 6, repetitions: 2 }, 'easy')
    expect(result.repetitions).toBe(3)
    expect(result.interval).toBe(16) // ceil(6 * 2.0 * 1.3) = ceil(15.6) = 16
  })

  it('sets interval to 1 day on first "hard" grade and lowers easeFactor', () => {
    const result = applySM2Grade(newCard, 'hard')
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBeCloseTo(2.35)
  })

  it('multiplies interval by 1.2 on third+ "hard" grade', () => {
    const result = applySM2Grade({ easeFactor: 2.0, interval: 6, repetitions: 2 }, 'hard')
    expect(result.repetitions).toBe(3)
    expect(result.interval).toBe(8) // ceil(6 * 1.2) = ceil(7.2) = 8
  })

  it('sets dueDate to now plus interval days', () => {
    const before = Date.now()
    const result = applySM2Grade(newCard, 'good')
    const expectedMs = before + 1 * 24 * 60 * 60 * 1000
    expect(result.dueDate.getTime()).toBeGreaterThanOrEqual(expectedMs - 1000)
    expect(result.dueDate.getTime()).toBeLessThanOrEqual(expectedMs + 5000)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- spacedRepetition`
Expected: FAIL — `@/lib/spacedRepetition` not found.

- [ ] **Step 3: Implement the algorithm**

Create `src/lib/spacedRepetition.ts`:

```ts
export type VocabGrade = 'again' | 'hard' | 'good' | 'easy'

interface CardState {
  easeFactor: number
  interval: number
  repetitions: number
}

interface CardUpdate {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: Date
}

const MIN_EASE_FACTOR = 1.3
const DAY_MS = 24 * 60 * 60 * 1000

function clampEase(value: number): number {
  return Math.max(MIN_EASE_FACTOR, value)
}

export function applySM2Grade(card: CardState, grade: VocabGrade): CardUpdate {
  let repetitions: number
  let interval: number
  let easeFactor: number

  switch (grade) {
    case 'again': {
      repetitions = 0
      interval = 1
      easeFactor = clampEase(card.easeFactor - 0.2)
      break
    }
    case 'hard': {
      repetitions = card.repetitions + 1
      interval = repetitions === 1 ? 1 : Math.ceil(card.interval * 1.2)
      easeFactor = clampEase(card.easeFactor - 0.15)
      break
    }
    case 'good': {
      repetitions = card.repetitions + 1
      interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.ceil(card.interval * card.easeFactor)
      easeFactor = card.easeFactor
      break
    }
    case 'easy': {
      repetitions = card.repetitions + 1
      interval =
        repetitions === 1 ? 4 : repetitions === 2 ? 10 : Math.ceil(card.interval * card.easeFactor * 1.3)
      easeFactor = card.easeFactor + 0.15
      break
    }
  }

  return {
    repetitions,
    interval,
    easeFactor,
    dueDate: new Date(Date.now() + interval * DAY_MS),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- spacedRepetition`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/spacedRepetition.ts tests/unit/spacedRepetition.test.ts
git commit -m "feat: add SM-2 spaced repetition algorithm"
```

---

### Task 4: Streak & XP Calculation

**Files:**
- Create: `src/lib/streak.ts`
- Test: `tests/unit/streak.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions, no DB).
- Produces: `computeNextStreak(currentStreak: number, lastActivityDate: Date | null, today: Date): { streak: number; activityChanged: boolean }` and `computeXpGain(correctCount: number): number` from `@/lib/streak`. Task 5 depends on these exact names.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/streak.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeNextStreak, computeXpGain } from '@/lib/streak'

const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`)

describe('computeNextStreak', () => {
  it('starts a streak of 1 for a user with no prior activity', () => {
    const result = computeNextStreak(0, null, day('2026-01-10'))
    expect(result).toEqual({ streak: 1, activityChanged: true })
  })

  it('does not change the streak for a second activity on the same UTC day', () => {
    const result = computeNextStreak(3, day('2026-01-10'), day('2026-01-10'))
    expect(result).toEqual({ streak: 3, activityChanged: false })
  })

  it('increments the streak for activity on the consecutive UTC day', () => {
    const result = computeNextStreak(3, day('2026-01-10'), day('2026-01-11'))
    expect(result).toEqual({ streak: 4, activityChanged: true })
  })

  it('resets the streak to 1 after a gap of more than one day', () => {
    const result = computeNextStreak(5, day('2026-01-08'), day('2026-01-11'))
    expect(result).toEqual({ streak: 1, activityChanged: true })
  })
})

describe('computeXpGain', () => {
  it('awards 10 XP per correct answer', () => {
    expect(computeXpGain(0)).toBe(0)
    expect(computeXpGain(1)).toBe(10)
    expect(computeXpGain(3)).toBe(30)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- streak`
Expected: FAIL — `@/lib/streak` not found.

- [ ] **Step 3: Implement the module**

Create `src/lib/streak.ts`:

```ts
function toUtcDayString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function computeNextStreak(
  currentStreak: number,
  lastActivityDate: Date | null,
  today: Date
): { streak: number; activityChanged: boolean } {
  const todayStr = toUtcDayString(today)

  if (!lastActivityDate) {
    return { streak: 1, activityChanged: true }
  }

  const lastStr = toUtcDayString(lastActivityDate)
  if (lastStr === todayStr) {
    return { streak: currentStreak, activityChanged: false }
  }

  const todayMs = Date.UTC(
    Number(todayStr.slice(0, 4)),
    Number(todayStr.slice(5, 7)) - 1,
    Number(todayStr.slice(8, 10))
  )
  const lastMs = Date.UTC(
    Number(lastStr.slice(0, 4)),
    Number(lastStr.slice(5, 7)) - 1,
    Number(lastStr.slice(8, 10))
  )
  const dayDiff = Math.round((todayMs - lastMs) / (24 * 60 * 60 * 1000))

  if (dayDiff === 1) {
    return { streak: currentStreak + 1, activityChanged: true }
  }

  return { streak: 1, activityChanged: true }
}

export function computeXpGain(correctCount: number): number {
  return correctCount * 10
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- streak`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/streak.ts tests/unit/streak.test.ts
git commit -m "feat: add streak and XP calculation"
```

---

### Task 5: Gamification Reward Application

**Files:**
- Create: `src/lib/gamification.ts`
- Test: `tests/integration/gamification.test.ts`

**Interfaces:**
- Consumes: `applySM2Grade`... no — this task does NOT use spaced repetition (that's review-time, Task 7). Consumes: `computeNextStreak`, `computeXpGain` from `@/lib/streak` (Task 4); `prisma` from `@/lib/prisma`; seeded `Badge` rows and lesson `VocabWord`s (Task 2).
- Produces: `applyLessonCompletionRewards(userId: string, lessonId: string, correctCount: number): Promise<void>` and `checkAndAwardBadges(userId: string): Promise<void>` from `@/lib/gamification`. Task 6 (lesson completion route) depends on `applyLessonCompletionRewards`'s exact name and signature.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/gamification.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { applyLessonCompletionRewards, checkAndAwardBadges } from '@/lib/gamification'

describe('applyLessonCompletionRewards', () => {
  let userId: string
  let lessonId: string
  let unitId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'gamification-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Gamification Test',
      },
    })
    userId = user.id

    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 996, titleDe: 'Test', titleEn: 'Gamification Test Unit', titleTr: 'Test' },
    })
    unitId = unit.id
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Gamification Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })
    lessonId = lesson.id
    await prisma.vocabWord.create({
      data: {
        lessonId,
        word: 'Testwort',
        translationEn: 'test word',
        translationTr: 'test kelimesi',
        exampleSentence: 'Das ist ein Testwort.',
      },
    })
  })

  afterAll(async () => {
    await prisma.userBadge.deleteMany({ where: { userId } })
    await prisma.userVocabCard.deleteMany({ where: { userId } })
    await prisma.vocabWord.deleteMany({ where: { lessonId } })
    await prisma.lesson.deleteMany({ where: { id: lessonId } })
    await prisma.unit.deleteMany({ where: { id: unitId } })
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  })

  it('increments streak, awards XP, creates vocab cards, and awards the first_lesson badge', async () => {
    await applyLessonCompletionRewards(userId, lessonId, 2)

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(user.streak).toBe(1)
    expect(user.xp).toBe(20)
    expect(user.lastActivityDate).not.toBeNull()

    const cards = await prisma.userVocabCard.findMany({ where: { userId } })
    expect(cards).toHaveLength(1)
    expect(cards[0].easeFactor).toBe(2.5)

    const badges = await prisma.userBadge.findMany({ where: { userId }, include: { badge: true } })
    expect(badges.map((entry) => entry.badge.code)).toContain('first_lesson')
  })

  it('does not create duplicate vocab cards or duplicate badges on a second completion', async () => {
    await applyLessonCompletionRewards(userId, lessonId, 1)

    const cards = await prisma.userVocabCard.findMany({ where: { userId } })
    expect(cards).toHaveLength(1)

    const badges = await prisma.userBadge.findMany({ where: { userId } })
    const firstLessonCount = badges.filter((b) => b.badgeId).length
    expect(new Set(badges.map((b) => b.badgeId)).size).toBe(badges.length)
    expect(firstLessonCount).toBeGreaterThanOrEqual(1)
  })
})

describe('checkAndAwardBadges', () => {
  it('is idempotent — awarding the same badge twice does not throw or duplicate', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'badge-idempotent-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Badge Idempotent Test',
        xp: 150,
      },
    })
    try {
      await checkAndAwardBadges(user.id)
      await checkAndAwardBadges(user.id)
      const badges = await prisma.userBadge.findMany({ where: { userId: user.id } })
      const xp100Count = badges.length
      expect(xp100Count).toBeGreaterThanOrEqual(1)
      const uniqueBadgeIds = new Set(badges.map((b) => b.badgeId))
      expect(uniqueBadgeIds.size).toBe(badges.length)
    } finally {
      await prisma.userBadge.deleteMany({ where: { userId: user.id } })
      await prisma.user.deleteMany({ where: { id: user.id } })
      await prisma.$disconnect()
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- gamification.test`
Expected: FAIL — `@/lib/gamification` not found.

- [ ] **Step 3: Implement the module**

Create `src/lib/gamification.ts`:

```ts
import { prisma } from '@/lib/prisma'
import { computeNextStreak, computeXpGain } from '@/lib/streak'

export async function checkAndAwardBadges(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  const candidates: string[] = []

  const lessonCount = await prisma.userProgress.count({ where: { userId, completed: true } })
  if (lessonCount >= 1) candidates.push('first_lesson')

  if (user.streak >= 3) candidates.push('streak_3')
  if (user.streak >= 7) candidates.push('streak_7')

  const vocabReviewCount = await prisma.userVocabCard.count({
    where: { userId, lastReviewedAt: { not: null } },
  })
  if (vocabReviewCount >= 1) candidates.push('first_vocab_review')

  if (user.xp >= 100) candidates.push('xp_100')

  const a1Level = await prisma.level.findUnique({ where: { code: 'A1' } })
  if (a1Level) {
    const a1LessonIds = await prisma.lesson.findMany({
      where: { unit: { levelId: a1Level.id } },
      select: { id: true },
    })
    if (a1LessonIds.length > 0) {
      const completedA1Count = await prisma.userProgress.count({
        where: { userId, completed: true, lessonId: { in: a1LessonIds.map((l) => l.id) } },
      })
      if (completedA1Count >= a1LessonIds.length) candidates.push('a1_complete')
    }
  }

  if (candidates.length === 0) return

  const badges = await prisma.badge.findMany({ where: { code: { in: candidates } } })

  for (const badge of badges) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      update: {},
      create: { userId, badgeId: badge.id },
    })
  }
}

export async function applyLessonCompletionRewards(
  userId: string,
  lessonId: string,
  correctCount: number
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const now = new Date()

  const { streak } = computeNextStreak(user.streak, user.lastActivityDate, now)
  const xpGain = computeXpGain(correctCount)

  await prisma.user.update({
    where: { id: userId },
    data: { streak, lastActivityDate: now, xp: user.xp + xpGain },
  })

  const vocabWords = await prisma.vocabWord.findMany({ where: { lessonId } })
  for (const word of vocabWords) {
    await prisma.userVocabCard.upsert({
      where: { userId_vocabWordId: { userId, vocabWordId: word.id } },
      update: {},
      create: { userId, vocabWordId: word.id },
    })
  }

  await checkAndAwardBadges(userId)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- gamification.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/gamification.ts tests/integration/gamification.test.ts
git commit -m "feat: add gamification reward application"
```

---

### Task 6: Wire Rewards into Lesson Completion Route

**Files:**
- Modify: `src/app/api/lessons/[lessonId]/complete/route.ts`
- Modify: `tests/integration/lessonComplete.test.ts`

**Interfaces:**
- Consumes: `applyLessonCompletionRewards` from `@/lib/gamification` (Task 5).
- Produces: no new exports — the route's existing `{ completed, score }` response shape is unchanged; reward application is a side effect that happens before the response is returned.

- [ ] **Step 1: Add a failing assertion to the existing test**

In `tests/integration/lessonComplete.test.ts`, add this test inside the existing `describe('POST /api/lessons/[lessonId]/complete', ...)` block, after the `'upserts progress for an authenticated user'` test:

```ts
  it('awards XP and creates vocab cards as a side effect', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: userId } } as never)
    await POST(makeRequest({ score: 1 }), { params: Promise.resolve({ lessonId }) })

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(user.xp).toBeGreaterThanOrEqual(10)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- lessonComplete`
Expected: FAIL — `user.xp` stays 0, the route doesn't call the reward logic yet.

- [ ] **Step 3: Wire in the reward call**

In `src/app/api/lessons/[lessonId]/complete/route.ts`, add the import and the call. Replace:

```ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
```

with:

```ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applyLessonCompletionRewards } from '@/lib/gamification'
```

Replace:

```ts
  const progress = await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    update: { completed: true, score, lastAttemptAt: new Date() },
    create: { userId: session.user.id, lessonId, completed: true, score },
  })

  return NextResponse.json({ completed: progress.completed, score: progress.score })
```

with:

```ts
  const progress = await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    update: { completed: true, score, lastAttemptAt: new Date() },
    create: { userId: session.user.id, lessonId, completed: true, score },
  })

  await applyLessonCompletionRewards(session.user.id, lessonId, score)

  return NextResponse.json({ completed: progress.completed, score: progress.score })
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- lessonComplete`
Expected: PASS.

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `npm test`
Expected: PASS — all prior tests plus this one.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/lessons tests/integration/lessonComplete.test.ts
git commit -m "feat: apply gamification rewards on lesson completion"
```

---

### Task 7: Vocab Review API Route

**Files:**
- Create: `src/app/api/vocab/[cardId]/review/route.ts`
- Test: `tests/integration/vocabReview.test.ts`

**Interfaces:**
- Consumes: `applySM2Grade` from `@/lib/spacedRepetition` (Task 3); `checkAndAwardBadges` from `@/lib/gamification` (Task 5); `authOptions` from `@/lib/auth`; `prisma` from `@/lib/prisma`.
- Produces: `POST /api/vocab/[cardId]/review` — body `{ grade: 'again' | 'hard' | 'good' | 'easy' }`, returns `200` with `{ interval: number, dueDate: string }`, `401` if unauthenticated, `404` if the card doesn't exist or belongs to another user. Per spec §5, this route also triggers badge-checking (for `first_vocab_review`) after updating the card. Task 10 (`/vocab` page's flashcard component) depends on this exact request/response shape.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/vocabReview.test.ts`:

```ts
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { POST } from '@/app/api/vocab/[cardId]/review/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/vocab/test/review', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/vocab/[cardId]/review', () => {
  let ownerId: string
  let otherUserId: string
  let cardId: string
  let lessonId: string
  let unitId: string

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'vocab-review-owner@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Vocab Review Owner',
      },
    })
    ownerId = owner.id
    const other = await prisma.user.create({
      data: {
        email: 'vocab-review-other@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Vocab Review Other',
      },
    })
    otherUserId = other.id

    const level = await prisma.level.findUniqueOrThrow({ where: { code: 'A1' } })
    const unit = await prisma.unit.create({
      data: { levelId: level.id, order: 995, titleDe: 'Test', titleEn: 'Vocab Review Test Unit', titleTr: 'Test' },
    })
    unitId = unit.id
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        order: 1,
        grammarTopic: 'Vocab Review Test Topic',
        explanationDe: 'Test',
        explanationEn: 'Test',
        explanationTr: 'Test',
      },
    })
    lessonId = lesson.id
    const word = await prisma.vocabWord.create({
      data: {
        lessonId,
        word: 'Testwort',
        translationEn: 'test word',
        translationTr: 'test kelimesi',
        exampleSentence: 'Das ist ein Testwort.',
      },
    })
    const card = await prisma.userVocabCard.create({ data: { userId: ownerId, vocabWordId: word.id } })
    cardId = card.id
  })

  afterAll(async () => {
    await prisma.userBadge.deleteMany({ where: { userId: { in: [ownerId, otherUserId] } } })
    await prisma.userVocabCard.deleteMany({ where: { userId: { in: [ownerId, otherUserId] } } })
    await prisma.vocabWord.deleteMany({ where: { lessonId } })
    await prisma.lesson.deleteMany({ where: { id: lessonId } })
    await prisma.unit.deleteMany({ where: { id: unitId } })
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherUserId] } } })
    await prisma.$disconnect()
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(makeRequest({ grade: 'good' }), { params: Promise.resolve({ cardId }) })
    expect(res.status).toBe(401)
  })

  it('rejects a card belonging to another user with 404', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: otherUserId } } as never)
    const res = await POST(makeRequest({ grade: 'good' }), { params: Promise.resolve({ cardId }) })
    expect(res.status).toBe(404)
  })

  it('returns 404 for an unknown card id', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: ownerId } } as never)
    const res = await POST(makeRequest({ grade: 'good' }), { params: Promise.resolve({ cardId: 'does-not-exist' }) })
    expect(res.status).toBe(404)
  })

  it('applies the SM-2 grade, returns the new interval/dueDate, and awards the first_vocab_review badge', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: ownerId } } as never)
    const res = await POST(makeRequest({ grade: 'good' }), { params: Promise.resolve({ cardId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.interval).toBe(1)
    expect(typeof json.dueDate).toBe('string')

    const stored = await prisma.userVocabCard.findUniqueOrThrow({ where: { id: cardId } })
    expect(stored.repetitions).toBe(1)
    expect(stored.lastReviewedAt).not.toBeNull()

    const badges = await prisma.userBadge.findMany({ where: { userId: ownerId }, include: { badge: true } })
    expect(badges.map((entry) => entry.badge.code)).toContain('first_vocab_review')
  })

  it('returns 400 for an invalid grade value', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: ownerId } } as never)
    const res = await POST(makeRequest({ grade: 'excellent' }), { params: Promise.resolve({ cardId }) })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- vocabReview`
Expected: FAIL — `src/app/api/vocab/[cardId]/review/route.ts` not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/vocab/[cardId]/review/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applySM2Grade, type VocabGrade } from '@/lib/spacedRepetition'
import { checkAndAwardBadges } from '@/lib/gamification'

const VALID_GRADES: VocabGrade[] = ['again', 'hard', 'good', 'easy']

export async function POST(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { cardId } = await params
  const card = await prisma.userVocabCard.findUnique({ where: { id: cardId } })
  if (!card || card.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const grade = (body as { grade?: unknown })?.grade
  if (typeof grade !== 'string' || !VALID_GRADES.includes(grade as VocabGrade)) {
    return NextResponse.json({ error: 'Invalid grade' }, { status: 400 })
  }

  const update = applySM2Grade(
    { easeFactor: card.easeFactor, interval: card.interval, repetitions: card.repetitions },
    grade as VocabGrade
  )

  await prisma.userVocabCard.update({
    where: { id: cardId },
    data: {
      easeFactor: update.easeFactor,
      interval: update.interval,
      repetitions: update.repetitions,
      dueDate: update.dueDate,
      lastReviewedAt: new Date(),
    },
  })

  await checkAndAwardBadges(session.user.id)

  return NextResponse.json({ interval: update.interval, dueDate: update.dueDate.toISOString() })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- vocabReview`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/vocab tests/integration/vocabReview.test.ts
git commit -m "feat: add vocab review API route"
```

---

### Task 8: `dashboard` and `vocab` Translation Namespaces

**Files:**
- Modify: `messages/en.json`, `messages/de.json`, `messages/tr.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: `dashboard` and `vocab` message namespaces. Tasks 9 and 10 depend on these exact keys.

- [ ] **Step 1: Add the `dashboard` and `vocab` namespaces**

Add to `messages/en.json` (as new top-level keys, alongside `nav`, `footer`, `cookieConsent`, `auth`, `learn`):

```json
  "dashboard": {
    "title": "Dashboard",
    "streak": "Day streak",
    "xp": "XP",
    "dailyGoal": "Daily goal",
    "badgesEarned": "Badges earned",
    "noBadgesYet": "No badges yet — complete a lesson to earn your first one!"
  },
  "vocab": {
    "title": "Vocabulary Review",
    "reviewDue": "cards due today",
    "noReviewsToday": "No reviews due today. Come back tomorrow!",
    "showAnswer": "Show answer",
    "again": "Again",
    "hard": "Hard",
    "good": "Good",
    "easy": "Easy",
    "reviewComplete": "Review complete for today!"
  }
```

Add to `messages/de.json`:

```json
  "dashboard": {
    "title": "Dashboard",
    "streak": "Tage-Serie",
    "xp": "XP",
    "dailyGoal": "Tagesziel",
    "badgesEarned": "Verdiente Abzeichen",
    "noBadgesYet": "Noch keine Abzeichen — schließe eine Lektion ab, um dein erstes zu verdienen!"
  },
  "vocab": {
    "title": "Wortschatz-Wiederholung",
    "reviewDue": "Karten heute fällig",
    "noReviewsToday": "Heute keine Wiederholungen fällig. Komm morgen wieder!",
    "showAnswer": "Antwort zeigen",
    "again": "Nochmal",
    "hard": "Schwer",
    "good": "Gut",
    "easy": "Leicht",
    "reviewComplete": "Wiederholung für heute abgeschlossen!"
  }
```

Add to `messages/tr.json`:

```json
  "dashboard": {
    "title": "Panel",
    "streak": "Günlük seri",
    "xp": "XP",
    "dailyGoal": "Günlük hedef",
    "badgesEarned": "Kazanılan rozetler",
    "noBadgesYet": "Henüz rozet yok — ilkini kazanmak için bir ders tamamla!"
  },
  "vocab": {
    "title": "Kelime Tekrarı",
    "reviewDue": "bugün tekrar edilecek kart",
    "noReviewsToday": "Bugün tekrar edilecek kart yok. Yarın tekrar gel!",
    "showAnswer": "Cevabı göster",
    "again": "Tekrar",
    "hard": "Zor",
    "good": "İyi",
    "easy": "Kolay",
    "reviewComplete": "Bugünkü tekrar tamamlandı!"
  }
```

- [ ] **Step 2: Run the translation consistency test**

Run: `npm test -- messages`
Expected: PASS (keys match across all three files).

- [ ] **Step 3: Commit**

```bash
git add messages
git commit -m "feat: add dashboard and vocab translation namespaces"
```

---

### Task 9: Dashboard Page

**Files:**
- Create: `src/app/[locale]/dashboard/page.tsx`

**Interfaces:**
- Consumes: `authOptions` from `@/lib/auth`; `prisma` from `@/lib/prisma`; `dashboard` message namespace (Task 8).
- Produces: `/dashboard` page, gated behind an authenticated session. No dedicated test — thin server component reading already-tested data (matches the Phase 2 `/learn` pages precedent of no per-page tests, verified manually in Task 11).

- [ ] **Step 1: Create the dashboard page**

Create `src/app/[locale]/dashboard/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pickByLocale } from '@/lib/learn'

const DAILY_GOAL_XP = 50

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('dashboard')
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } })
  const userBadges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  })

  const goalProgress = Math.min(100, Math.round((user.xp / DAILY_GOAL_XP) * 100))

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="flex gap-6">
        <div className="border rounded px-4 py-3">
          <p className="text-sm text-gray-600">{t('streak')}</p>
          <p className="text-2xl font-bold">{user.streak}</p>
        </div>
        <div className="border rounded px-4 py-3">
          <p className="text-sm text-gray-600">{t('xp')}</p>
          <p className="text-2xl font-bold">{user.xp}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-1">{t('dailyGoal')}</p>
        <div className="w-full bg-gray-200 rounded h-3">
          <div className="bg-gray-900 h-3 rounded" style={{ width: `${goalProgress}%` }} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">{t('badgesEarned')}</h2>
        {userBadges.length === 0 ? (
          <p className="text-sm text-gray-600">{t('noBadgesYet')}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {userBadges.map((entry) => (
              <li key={entry.id}>
                {pickByLocale(locale, {
                  de: entry.badge.titleDe,
                  en: entry.badge.titleEn,
                  tr: entry.badge.titleTr,
                })}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS — no regressions (this page has no dedicated test).

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/dashboard
git commit -m "feat: add dashboard page"
```

---

### Task 10: Vocab Review Page + Flashcard Component

**Files:**
- Create: `src/app/[locale]/vocab/page.tsx`
- Create: `src/components/vocab/VocabReviewSession.tsx`
- Test: `tests/unit/vocabReviewSession.test.tsx`

**Interfaces:**
- Consumes: `authOptions` from `@/lib/auth`; `prisma` from `@/lib/prisma`; `pickByLocale` from `@/lib/learn`; `POST /api/vocab/[cardId]/review` (Task 7); `vocab` message namespace (Task 8).
- Produces: `/vocab` page rendering `<VocabReviewSession cards={ReviewCard[]} />`. This completes Phase 3's end-to-end vocab flow.

- [ ] **Step 1: Write the failing component test**

Create `tests/unit/vocabReviewSession.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { VocabReviewSession } from '@/components/vocab/VocabReviewSession'
import en from '../../messages/en.json'

function renderSession(cards: { id: string; word: string; translation: string; exampleSentence: string }[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <VocabReviewSession cards={cards} />
    </NextIntlClientProvider>
  )
}

const cards = [
  { id: 'card-1', word: 'Hallo', translation: 'hello', exampleSentence: 'Hallo, ich bin Anna.' },
  { id: 'card-2', word: 'Danke', translation: 'thank you', exampleSentence: 'Danke schön!' },
]

describe('VocabReviewSession', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('shows the German word first, hides the translation until revealed', () => {
    renderSession(cards)
    expect(screen.getByText('Hallo')).toBeInTheDocument()
    expect(screen.queryByText('hello')).not.toBeInTheDocument()
  })

  it('reveals the translation and grading buttons after "Show answer"', () => {
    renderSession(cards)
    fireEvent.click(screen.getByText(en.vocab.showAnswer))
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText(en.vocab.good)).toBeInTheDocument()
  })

  it('submits the grade and advances to the next card', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ interval: 1, dueDate: new Date().toISOString() }),
    })

    renderSession(cards)
    fireEvent.click(screen.getByText(en.vocab.showAnswer))
    fireEvent.click(screen.getByText(en.vocab.good))

    await waitFor(() => {
      expect(screen.getByText('Danke')).toBeInTheDocument()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/vocab/card-1/review',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows the completion message after grading the last card', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ interval: 1, dueDate: new Date().toISOString() }),
    })

    renderSession([cards[0]])
    fireEvent.click(screen.getByText(en.vocab.showAnswer))
    fireEvent.click(screen.getByText(en.vocab.good))

    await waitFor(() => {
      expect(screen.getByText(en.vocab.reviewComplete)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- vocabReviewSession`
Expected: FAIL — `src/components/vocab/VocabReviewSession.tsx` not found.

- [ ] **Step 3: Implement the flashcard component**

Create `src/components/vocab/VocabReviewSession.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface ReviewCard {
  id: string
  word: string
  translation: string
  exampleSentence: string
}

type Grade = 'again' | 'hard' | 'good' | 'easy'

export function VocabReviewSession({ cards }: { cards: ReviewCard[] }) {
  const t = useTranslations('vocab')
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(cards.length === 0)

  const current = cards[index]

  async function handleGrade(grade: Grade) {
    await fetch(`/api/vocab/${current.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade }),
    })

    setRevealed(false)
    if (index + 1 < cards.length) {
      setIndex(index + 1)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return <p className="text-lg font-medium">{t('reviewComplete')}</p>
  }

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="border rounded p-6 text-center">
        <p className="text-2xl font-bold">{current.word}</p>
        {revealed && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-lg">{current.translation}</p>
            <p className="text-sm text-gray-600 italic">{current.exampleSentence}</p>
          </div>
        )}
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="bg-gray-900 text-white rounded px-4 py-2"
        >
          {t('showAnswer')}
        </button>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={() => handleGrade('again')} className="flex-1 border rounded px-3 py-2">
            {t('again')}
          </button>
          <button type="button" onClick={() => handleGrade('hard')} className="flex-1 border rounded px-3 py-2">
            {t('hard')}
          </button>
          <button type="button" onClick={() => handleGrade('good')} className="flex-1 border rounded px-3 py-2">
            {t('good')}
          </button>
          <button type="button" onClick={() => handleGrade('easy')} className="flex-1 border rounded px-3 py-2">
            {t('easy')}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- vocabReviewSession`
Expected: PASS.

- [ ] **Step 5: Create the vocab page**

Create `src/app/[locale]/vocab/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pickByLocale } from '@/lib/learn'
import { VocabReviewSession } from '@/components/vocab/VocabReviewSession'

export default async function VocabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('vocab')
  const dueCards = await prisma.userVocabCard.findMany({
    where: { userId: session.user.id, dueDate: { lte: new Date() } },
    include: { vocabWord: true },
    orderBy: { dueDate: 'asc' },
  })

  const cards = dueCards.map((card) => ({
    id: card.id,
    word: card.vocabWord.word,
    translation: pickByLocale(locale, {
      de: card.vocabWord.word,
      en: card.vocabWord.translationEn,
      tr: card.vocabWord.translationTr,
    }),
    exampleSentence: card.vocabWord.exampleSentence,
  }))

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {cards.length === 0 ? (
        <p className="text-gray-600">{t('noReviewsToday')}</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {cards.length} {t('reviewDue')}
          </p>
          <VocabReviewSession cards={cards} />
        </>
      )}
    </main>
  )
}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: PASS — all tests across this plan's 10 tasks.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/vocab src/components/vocab tests/unit/vocabReviewSession.test.tsx
git commit -m "feat: add vocab review page and flashcard component"
```

---

### Task 11: Manual End-to-End Verification & Final Commit

**Files:** none (verification only).

**Interfaces:**
- Consumes: everything from Tasks 1-10.
- Produces: confirmation that Phase 3's Definition of Done (below) is met.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Complete a lesson and verify rewards**

Log in, visit `/en/learn`, complete any lesson. Then visit `/en/dashboard` — confirm streak shows `1`, XP shows a positive number, and (if this is the user's first-ever completed lesson) the "First Lesson" badge appears.

- [ ] **Step 3: Verify vocab cards were created and review them**

Visit `/en/vocab` — confirm the words from the just-completed lesson appear as due cards. Click "Show answer", grade a card with each of the four buttons across different cards, confirm the session advances and eventually shows the completion message.

- [ ] **Step 4: Verify a graded card leaves today's due list**

After grading all due cards, reload `/en/vocab` — confirm it now shows "No reviews due today."

- [ ] **Step 5: Verify translated content**

Switch to `DE` and `TR`, revisit `/dashboard` and `/vocab` — confirm all UI strings (streak/XP labels, button labels, badge titles) are translated; vocab word itself stays German, translation switches per locale.

- [ ] **Step 6: Verify unauthenticated redirects**

Log out, visit `/en/dashboard` and `/en/vocab` — confirm both redirect to `/en/login`.

- [ ] **Step 7: Stop the dev server**

Press `Ctrl+C` in the terminal running `npm run dev`.

- [ ] **Step 8: Run the full test suite one last time**

Run: `npm test`
Expected: PASS — every test from Phases 1-3 is green.

- [ ] **Step 9: Final commit (if any uncommitted changes remain)**

```bash
git status
```

If clean, no commit is needed. If anything is uncommitted (e.g. a fix made during manual verification), commit it with a descriptive message before moving on.

---

## Phase 3 Definition of Done

- `npm test` passes with all unit and integration tests green (Phases 1-2 tests + this plan's new tests).
- Completing a lesson increments the user's streak (once per UTC day), awards 10 XP per correct answer, creates `UserVocabCard` rows for the lesson's vocab words, and awards any newly-earned badges.
- `/dashboard` shows streak, XP, daily-goal progress, and earned badges.
- `/vocab` shows due cards as flashcards; grading a card via the 4-button SM-2 interface updates its schedule and removes it from today's due list.
- An unauthenticated visitor is redirected to `/login` when visiting `/dashboard` or `/vocab`.
- The `VocabWord`/`UserVocabCard`/`Badge`/`UserBadge` tables are ready for Phase 4+ (admin CRUD, additional badges) without schema changes.
