# Phase 7 — B1 Full Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the B1 level from its current 1 unit / 1 lesson to the full curriculum target of 12 units × 4 lessons (48 lessons total), following the topic outline in `docs/superpowers/specs/2026-09-16-phase7-b1-curriculum-design.md`.

**Architecture:** All new content is added to `prisma/seed.ts`, the existing single source of content (re-run via `npx prisma db seed`). Each task inserts one new `Unit` + its 4 `Lesson`s + `Exercise`s + `VocabWord`s (Task 1 instead adds 3 lessons to the existing `b1Unit`), following the exact object-literal shape already used throughout the file (A1's 12 units from Phase 5, and the existing B1 sample lesson). No schema, API, or UI changes.

**Tech Stack:** Prisma seed script (TypeScript), Vitest integration tests against a real Postgres DB (`tests/integration/seedContent.test.ts`, `tests/integration/learn.test.ts`).

## Global Constraints

- Every lesson has `explanationDe` / `explanationEn` / `explanationTr` — German examples inside the explanation stay in German in all three languages; only the surrounding explanation text is translated.
- Every lesson gets exactly 2 `Exercise` rows, using the 5 existing types (`MULTIPLE_CHOICE`, `FILL_IN_BLANK`, `MATCHING`, `SENTENCE_ORDER`, `SHORT_ANSWER`) and exactly 2 `VocabWord` rows (`word`, `translationEn`, `translationTr`, `exampleSentence`).
- No vocab `word` (with matching translations/example) may duplicate any vocab word already anywhere in the file — grep the whole file before finalizing each lesson's vocab.
- Every `MATCHING` exercise's `data.rights` must NOT be positionally aligned with `data.lefts` (rotate, never leave `rights[i]` equal to the correct match for `lefts[i]`). `correctAnswer.pairs` always lists the true left→right mapping regardless of storage order.
- `SENTENCE_ORDER` `data.words` tokens are always single words.
- `FILL_IN_BLANK`/`SHORT_ANSWER` `accepted` arrays only need the canonical (umlaut-containing) spelling — `normalizeGermanText` in `src/lib/exerciseChecking.ts` lowercases and maps `ä→ae`, `ö→oe`, `ü→ue`, `ß→ss` on both sides before comparing. Where a natural accepted phrase has punctuation a learner might drop, add a punctuation-free variant too.
- New `Unit`s get `levelId: b1.id` and ascending `order` values (2 through 12); the existing `b1Unit` (order 1) is untouched aside from gaining 3 more lessons.
- All new variables use a `b1` prefix (`b1Unit2`, `b1Unit2Lesson1`, ...) and never collide with any existing `a1*`/`a2*` name.
- Insertion anchor: every new unit block is inserted immediately before the line `  // --- B2: Passiv (1 sample lesson) ---` in `prisma/seed.ts`. That comment is never modified.
- Run `npx prisma db seed`, then `npx vitest run tests/integration/seedContent.test.ts tests/integration/learn.test.ts`, then `npx eslint prisma/seed.ts tests/integration/seedContent.test.ts tests/integration/learn.test.ts` after every task; all must be clean before moving to the next task.
- Commit after every task with a `feat:`-prefixed message, one commit per unit.
- Test-file edits add new, clearly separated `it(...)` blocks for B1 — never edit the body of an existing A1-focused test (parallel worktrees are editing the same test files for A2/B2 concurrently; minimizing textual overlap avoids merge conflicts later).

---

### Task 1: Expand the existing B1 unit (`Nebensätze`) to 4 lessons

**Files:** `prisma/seed.ts`, `tests/integration/seedContent.test.ts`, `tests/integration/learn.test.ts`

- [ ] Add `b1Lesson2` ("Nebensätze mit 'dass'"), `b1Lesson3` ("Nebensätze mit 'wenn'"), `b1Lesson4` ("Wiederholung: weil/dass/wenn") to `b1Unit` (order 2-4), each with 2 exercises + 2 vocab, inserted right after the existing `b1Lesson`'s exercise block, before the `// --- B2 ---` anchor.
- [ ] Add a new test block to `seedContent.test.ts`: `it('has 12 B1 units with four lessons each', ...)` (added now checking unit count 1, updated in later tasks up to 12 — or written once at Task 12; simplest is to add the final-shape assertion once in Task 1 and let intermediate tasks fail until the count is correct... instead: add the assertion incrementally is unnecessary complexity — add a single new `it.skip`-free block in Task 1 asserting only lesson count on unit 1 is 4, and expand it to the full 12-unit assertion in Task 12).
- [ ] Add a matching new block to `learn.test.ts` for B1 lesson count.
- [ ] Seed, test, lint, commit: `feat: expand B1 unit 1 to four lessons (Nebensätze)`.

### Tasks 2-12: Seed B1 Units 2-12

Each task follows the identical shape (mirroring Phase 5 Tasks 2-12):

- [ ] Insert `// --- B1 Unit N: <Title> (4 lessons) ---` immediately before `  // --- B2: Passiv (1 sample lesson) ---`.
- [ ] Create `b1UnitN` with `levelId: b1.id`, `order: N`, trilingual titles.
- [ ] Create 4 lessons (`b1UnitNLesson1..4`) per the topic breakdown in the design spec, each with trilingual `explanationDe/En/Tr`, 2 exercises, 2 vocab words.
- [ ] Run seed, tests, lint; commit `feat: seed B1 unit N - <title>`.

Topic breakdown per unit (see design spec §2 for full rationale):

- **Unit 2 — Konjunktiv II:** würde + Infinitiv / wäre / hätte / höfliche Bitten
- **Unit 3 — Passiv:** Präsens / Präteritum / mit Modalverben / Wiederholung
- **Unit 4 — Relativsätze:** Nominativ / Akkusativ / mit Präpositionen / Übung
- **Unit 5 — Genitiv:** Artikel / Präpositionen (wegen/trotz/während) / Possessiv / Übung
- **Unit 6 — Plusquamperfekt:** mit "hatte" / mit "war" / mit "nachdem" / Übung
- **Unit 7 — Doppelkonjunktionen:** je...desto / sowohl...als auch / weder...noch / Übung
- **Unit 8 — Infinitiv mit "zu":** nach Verben / um...zu / ohne...zu / Übung
- **Unit 9 — Adjektivdeklination:** Nominativ/Akkusativ / Dativ / alle Artikeltypen / Übung
- **Unit 10 — obwohl/während/nachdem:** obwohl / während / nachdem / Wiederholung
- **Unit 11 — Konnektoren:** trotzdem / deshalb / außerdem / allerdings
- **Unit 12 — Indirekte Rede & Nomen-Verb-Verbindungen:** Indirekte Rede / Nomen-Verb-Verbindungen / Wiederholung / Abschlusswiederholung B1

**Task 12 additionally:**

- [ ] Update `seedContent.test.ts`'s B1 block to its final form: `it('has 12 B1 units with four lessons each', ...)` asserting `units` length 12, each with 4 lessons, total 48.
- [ ] Update `learn.test.ts`'s B1 block similarly (unit count 12, `units[0].lessons` length 4).
- [ ] Run the **full** `npx vitest run` and `npx eslint .` (whole repo) and confirm both clean.
- [ ] Final self-review across the whole diff: no MATCHING exercise positionally guessable, no vocab duplication anywhere in the file, all 48 B1 lessons have complete trilingual explanations, unit `order` is a clean 1-12 sequence with `b1` `levelId` throughout, anchor comment byte-for-byte unmodified.
- [ ] Commit: `feat: seed B1 unit 12 - Indirekte Rede & Nomen-Verb-Verbindungen`.
