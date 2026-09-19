# Phase 6 — A2 Full Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the A2 level from its current 1 unit / 1 lesson to the full curriculum target of 12 units × 4 lessons (48 lessons total), following the topic outline in `docs/superpowers/specs/2026-09-16-phase6-a2-curriculum-design.md`.

**Architecture:** All new content is added to `prisma/seed.ts`, the existing single source of content (re-run via `npx prisma db seed`). Each task inserts one new `Unit` + its 4 `Lesson`s + `Exercise`s + `VocabWord`s (Task 1 instead adds 3 lessons to the existing `a2Unit`), following the exact object-literal shape already used throughout the file (see the A1 units from Phase 5, and the existing A2 `Vergangenheit` lesson). No schema, API, or UI changes — the admin panel, `/learn` pages, and `ExerciseRunner` already render whatever is in the database.

**Tech Stack:** Prisma seed script (TypeScript), Vitest integration tests against a real Postgres DB (`tests/integration/seedContent.test.ts`, `tests/integration/learn.test.ts`).

## Global Constraints

- Every lesson has `explanationDe` / `explanationEn` / `explanationTr` — German examples inside the explanation stay in German in all three languages; only the surrounding explanation text is translated.
- Every lesson gets exactly 2 `Exercise` rows, using the 5 existing types (`MULTIPLE_CHOICE`, `FILL_IN_BLANK`, `MATCHING`, `SENTENCE_ORDER`, `SHORT_ANSWER`) and exactly 2 `VocabWord` rows (`word`, `translationEn`, `translationTr`, `exampleSentence`).
- `SENTENCE_ORDER` `data.words` are always single-word tokens, never multi-word phrases.
- `FILL_IN_BLANK`/`SHORT_ANSWER` `accepted` arrays only need the canonical (umlaut-containing) spelling — `normalizeGermanText` in `src/lib/exerciseChecking.ts` lowercases and maps `ä→ae`, `ö→oe`, `ü→ue`, `ß→ss` on both sides before comparing — but if a natural phrase contains a comma or similar punctuation a learner might reasonably omit, a punctuation-free variant is added too.
- Every `MATCHING` exercise's `data.rights` must NOT be positionally aligned with `data.lefts` (i.e. `rights[i]` is never the correct match for `lefts[i]`, for any `i`) — this is the real bug Phase 5 shipped and had to fix after the fact. `correctAnswer.pairs` matches by string equality, not position, so only `rights` needs reordering (e.g. a 3-cycle rotation), never `lefts` or `correctAnswer.pairs`.
- No `VocabWord.word` may exactly duplicate (same word + same translations + same example sentence) any vocab word already anywhere else in the file — grep the whole file before finalizing each lesson's vocab.
- New `Unit`s get `levelId: a2.id` and ascending `order` values (2 through 12); the existing `a2Unit` stays `order: 1`. All new variables use an `a2`-prefixed name (`a2Unit2`, `a2Unit2Lesson1`, etc.) — never reusing any `a1*` name already in the file.
- Run `npx prisma db seed`, then `npx vitest run tests/integration/seedContent.test.ts tests/integration/learn.test.ts`, then `npx eslint prisma/seed.ts tests/integration/seedContent.test.ts tests/integration/learn.test.ts` after every task; all three must be clean before moving to the next task.
- Commit after every task with a `feat:`-prefixed message, one commit per unit (`feat: seed A2 unit N - <title>`).
- Insertion anchor: every new unit block (Tasks 2-12) is inserted immediately before the line `  // --- B1: Nebensätze (1 sample lesson) ---` in `prisma/seed.ts`. That comment is never modified, so it stays a stable, unique anchor across all tasks (and across the concurrent, independent Phase 7 B1 track, which uses the same anchor).

---

### Task 1: Expand the existing A2 `Vergangenheit` unit to 4 lessons

**Files:** Modify `prisma/seed.ts`

**Produces:** `a2Lesson2`, `a2Lesson3`, `a2Lesson4` (local variables, inserted directly after the existing `a2Lesson`'s exercises, before the B1 anchor comment). The existing `a2Unit`/`a2Lesson` (order 1) are untouched.

- [ ] **Lesson 2 — Perfekt mit "sein"** (`grammarTopic`): movement/change-of-state verbs form the Perfekt with "sein" instead of "haben" (e.g. "Ich bin gegangen"). 2 exercises (mix types not used back-to-back), 2 vocab words (e.g. gehen/fahren-flavored, not literal duplicates of any A1 "gehen"/"fahren" vocab entry already in the file).
- [ ] **Lesson 3 — Zeitangaben der Vergangenheit**: time expressions used with past tense (gestern, letzte Woche, vor zwei Tagen). 2 exercises, 2 vocab words.
- [ ] **Lesson 4 — Wiederholung: Alltag erzählen**: review lesson combining haben/sein Perfekt in everyday narration sentences. 2 exercises, 2 vocab words.
- [ ] Run seed + targeted tests + targeted lint; fix until clean. (The existing "at least one lesson for every level above A1" test keeps passing throughout Tasks 1-11; the exact 12-units/48-lessons A2 assertions are added once in Task 12, after the full curriculum exists, to avoid failing interim tasks and to minimize textual overlap with the concurrent B1 track editing the same test files.)
- [ ] Commit: `feat: seed A2 unit 1 - Wiederholung & Alltag`

---

### Task 2: Unit 2 — Perfekt Vertiefung

**Produces:** `a2Unit2`, `a2Unit2Lesson1..4`. `levelId: a2.id`, `order: 2`. Inserted before the B1 anchor.

Lessons: (1) haben oder sein? — the rule of thumb (movement/change of state → sein, else haben); (2) Partizip II unregelmäßiger Verben — irregular past participles beyond what A1/Task 1 covered; (3) trennbare Verben im Perfekt — separable-prefix verbs insert "-ge-" between prefix and stem (aufstehen → aufgestanden); (4) nicht-trennbare & "-ieren"-Verben im Perfekt — no "ge-" prefix (besuchen → besucht, studieren → studiert).

- [ ] Write all 4 lessons (2 exercises + 2 vocab each, per Global Constraints).
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Commit: `feat: seed A2 unit 2 - Perfekt Vertiefung`

---

### Task 3: Unit 3 — Komparativ & Superlativ

**Produces:** `a2Unit3`, `a2Unit3Lesson1..4`. `order: 3`.

Lessons: (1) Komparativ (regelmäßig) — `-er` + `als`; (2) Komparativ mit Umlaut — groß→größer, jung→jünger, alt→älter; (3) Superlativ mit "am ...sten"; (4) unregelmäßige Formen — gut/besser/am besten, viel/mehr/am meisten, gern/lieber/am liebsten.

- [ ] Write all 4 lessons.
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Commit: `feat: seed A2 unit 3 - Komparativ & Superlativ`

---

### Task 4: Unit 4 — Nebensätze mit "dass" und "weil"

**Produces:** `a2Unit4`, `a2Unit4Lesson1..4`. `order: 4`.

Lessons: (1) Nebensätze mit "dass" — verb-final word order; (2) Nebensätze mit "weil" — reason clauses, verb-final; (3) dass vs. weil — contrastive practice; (4) common main-clause verbs that trigger "dass" (glauben, denken, wissen, hoffen).

- [ ] Write all 4 lessons; at least one `SENTENCE_ORDER` exercise practices verb-final subordinate word order (single-word tokens only).
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Commit: `feat: seed A2 unit 4 - Nebensätze mit dass und weil`

---

### Task 5: Unit 5 — Nebensätze mit "wenn"

**Produces:** `a2Unit5`, `a2Unit5Lesson1..4`. `order: 5`.

Lessons: (1) wenn (zeitlich/wiederholt) — repeated events; (2) wenn (Bedingung) — real conditionals; (3) wenn vs. wann — conjunction vs. question word; (4) combining Haupt- and Nebensatz with "wenn" first (verb-verb word order when the subordinate clause leads).

- [ ] Write all 4 lessons.
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Commit: `feat: seed A2 unit 5 - Nebensätze mit wenn`

---

### Task 6: Unit 6 — Indirekte Fragesätze

**Produces:** `a2Unit6`, `a2Unit6Lesson1..4`. `order: 6`.

Lessons: (1) indirekte Ja/Nein-Fragen mit "ob"; (2) indirekte W-Fragen (wo, wann, warum as embedded clauses); (3) einleitende Ausdrücke (Ich weiß nicht, ob... / Kannst du mir sagen, wann...); (4) converting direct questions to indirect questions.

- [ ] Write all 4 lessons.
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Commit: `feat: seed A2 unit 6 - Indirekte Fragesätze`

---

### Task 7: Unit 7 — Präteritum der Modalverben und "sein"/"haben"

**Produces:** `a2Unit7`, `a2Unit7Lesson1..4`. `order: 7`.

Lessons: (1) Präteritum von "sein" und "haben" (war, hatte); (2) Präteritum der Modalverben (konnte, musste, wollte, durfte); (3) "mochte"/"sollte" plus usage in narration; (4) Präteritum vs. Perfekt — when each is preferred.

- [ ] Write all 4 lessons.
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Commit: `feat: seed A2 unit 7 - Präteritum der Modalverben`

---

### Task 8: Unit 8 — Wechselpräpositionen Vertiefung

**Produces:** `a2Unit8`, `a2Unit8Lesson1..4`. `order: 8`.

Lessons: (1) Überblick (in, an, auf, unter, über, vor, hinter, neben, zwischen) — Wo? = Dativ; (2) Wohin? = Akkusativ (motion); (3) Wo vs. Wohin contrastive practice (liegen/legen pairs); (4) fixed expressions using Wechselpräpositionen (warten auf, sich freuen auf).

- [ ] Write all 4 lessons.
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Commit: `feat: seed A2 unit 8 - Wechselpräpositionen Vertiefung`

---

### Task 9: Unit 9 — Adjektivdeklination

**Produces:** `a2Unit9`, `a2Unit9Lesson1..4`. `order: 9`.

Lessons: (1) Adjektivendungen nach bestimmtem Artikel im Nominativ; (2) im Akkusativ; (3) feminin/neutral/Plural forms in both cases; (4) mixed review sentences.

- [ ] Write all 4 lessons.
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Commit: `feat: seed A2 unit 9 - Adjektivdeklination`

---

### Task 10: Unit 10 — Reflexive Verben

**Produces:** `a2Unit10`, `a2Unit10Lesson1..4`. `order: 10`.

Lessons: (1) Reflexivpronomen (Akkusativ); (2) common accusative-reflexive verbs (sich freuen, sich interessieren, sich fühlen); (3) Reflexivpronomen im Dativ; (4) review sentences using reflexive verbs in everyday contexts.

- [ ] Write all 4 lessons.
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Commit: `feat: seed A2 unit 10 - Reflexive Verben`

---

### Task 11: Unit 11 — Zukunft mit "werden"

**Produces:** `a2Unit11`, `a2Unit11Lesson1..4`. `order: 11`.

Lessons: (1) Futur-I-Bildung (werden + Infinitiv); (2) Futur I for predictions/assumptions; (3) Futur I vs. Präsens+time-expression (both valid for future); (4) review: plans and predictions.

- [ ] Write all 4 lessons.
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Commit: `feat: seed A2 unit 11 - Zukunft mit werden`

---

### Task 12: Unit 12 — Beruf & Bewerbung, final assertions, full-suite run

**Produces:** `a2Unit12`, `a2Unit12Lesson1..4`. `order: 12`.

Lessons: (1) Berufe (vocabulary: der Lehrer, die Ärztin, etc.); (2) talking about your job (Ich arbeite als..., Ich bin von Beruf...); (3) Lebenslauf/Bewerbung vocabulary (die Erfahrung, die Bewerbung, das Vorstellungsgespräch); (4) job-interview questions and answers, reviewing modal verbs.

- [ ] Write all 4 lessons.
- [ ] Update `tests/integration/seedContent.test.ts`: add a new, separate `it('has 12 A2 units with four lessons each', ...)` block (do not edit the existing A1-focused test body — the concurrent Phase 7 B1 track edits the same file).
- [ ] Update `tests/integration/learn.test.ts`: add a new, separate `describe`/`it` block asserting `getUnitsForLevel('A2', ...)` returns 12 units with 4 lessons each (do not edit existing A1-focused assertions).
- [ ] Final self-review across the whole diff: no MATCHING exercise is positionally guessable (re-check every one added across all 12 units), no vocab duplication anywhere in the file, all 48 A2 lessons have complete trilingual explanations, unit `order` is a clean 1–12 sequence with `levelId: a2.id` throughout, and the `// --- B1: Nebensätze (1 sample lesson) ---` anchor comment is byte-for-byte unmodified.
- [ ] Run seed + targeted tests + targeted lint; fix until clean.
- [ ] Run the full `npx vitest run` and `npx eslint .`; confirm both clean.
- [ ] Commit: `feat: seed A2 unit 12 - Beruf & Bewerbung`
- [ ] Commit: `test: add A2 curriculum assertions to seedContent/learn tests`
