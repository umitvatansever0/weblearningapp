# Phase 8 — B2 Full Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the B2 level from its current 1 unit / 1 lesson to the full curriculum target of 12 units × 4 lessons (48 lessons total), following the topic outline in `docs/superpowers/specs/2026-09-16-phase8-b2-curriculum-design.md`.

**Architecture:** All new content is added to `prisma/seed.ts`, the existing single source of content (re-run via `npx prisma db seed`). Each task inserts one new `Unit` + its 4 `Lesson`s + `Exercise`s + `VocabWord`s, following the exact object-literal shape already used for the existing B2 unit (`Passiv`) and mirroring the A1 curriculum pattern from `docs/superpowers/plans/2026-09-15-phase5-a1-curriculum.md`. No schema, API, or UI changes.

**Tech Stack:** Prisma seed script (TypeScript), Vitest integration tests against a real Postgres DB (`tests/integration/seedContent.test.ts`, `tests/integration/learn.test.ts`).

## Global Constraints

- Every lesson has `explanationDe` / `explanationEn` / `explanationTr` — German example sentences inside the explanation stay in German in all three languages; only the surrounding explanation text is translated.
- Every lesson gets exactly 2 `Exercise` rows, using the 5 existing types (`MULTIPLE_CHOICE`, `FILL_IN_BLANK`, `MATCHING`, `SENTENCE_ORDER`, `SHORT_ANSWER`) and exactly 2 `VocabWord` rows (`word`, `translationEn`, `translationTr`, `exampleSentence`).
- **MATCHING constraint (hard requirement, previously shipped as a bug in Phase 5):** `data.rights` must never be positionally aligned with `data.lefts` (`rights[i]` must not equal the correct match for `lefts[i]`, for any `i`). Reorder only `rights` (e.g. a 3-cycle rotation); never reorder `lefts` or `correctAnswer.pairs`.
- `SENTENCE_ORDER` `data.words` tokens are single words, never multi-word phrases.
- `FILL_IN_BLANK`/`SHORT_ANSWER` `accepted` arrays only need the canonical (umlaut-containing) spelling — `normalizeGermanText` in `src/lib/exerciseChecking.ts` lowercases and maps `ä→ae`, `ö→oe`, `ü→ue`, `ß→ss` on both sides before comparing — but add a punctuation-free variant when a natural accepted phrase contains a comma a learner might plausibly omit.
- No `VocabWord.word` may exactly duplicate (same word + same translations + same example sentence) any vocab word already anywhere in the file — grep the whole file before finalizing each lesson's vocab.
- New `Unit`s get `levelId: b2.id` and ascending `order` values (1 through 12; the existing unit keeps `order: 1`) so `units[0]` stays the `Passiv` unit.
- Run `npx vitest run tests/integration/seedContent.test.ts tests/integration/learn.test.ts` and `npx eslint prisma/seed.ts tests/integration/seedContent.test.ts tests/integration/learn.test.ts` after every task; both must be clean before moving to the next task.
- Commit after every task with a `feat:`-prefixed message, one commit per unit.
- Insertion anchor: every new unit block (Tasks 2–12) is inserted immediately before the line `  // --- C1: Indirekte Rede (1 sample lesson) ---` in `prisma/seed.ts`. That comment is never modified, so it stays a stable, unique anchor across all 12 tasks. Task 1 instead edits the existing `b2Unit`/`b2Lesson` block in place (adding lessons 2–4 right after lesson 1's exercises, before that same anchor).
- Variable naming: everything added in this phase uses a `b2` prefix (`b2Unit2`, `b2Unit2Lesson1`, …) and never collides with any existing `a1*`/`a2*`/`b1*`/`c1*`/`c2*` variable name.

---

### Task 1: Expand the existing B2 unit (`Wiederholung & Passiv`) to 4 lessons

**Files:** `prisma/seed.ts`, `tests/integration/seedContent.test.ts`, `tests/integration/learn.test.ts`

- [ ] Add `b2Lesson2` (Vorgangspassiv im Präteritum: "wurde" + Partizip II), `b2Lesson3` (Zustandspassiv: "sein" + Partizip II, expresses resulting state vs. process), `b2Lesson4` (Passiv im Perfekt: "ist/sind ... worden") to the existing `b2Unit`, immediately after `b2Lesson`'s exercises and before the C1 anchor comment. 2 exercises + 2 vocab each, following global constraints.
- [ ] Update `seedContent.test.ts`: add a new, separate `it('has 12 B2 units with four lessons each', ...)` block (do not touch the existing A1-focused assertions). At this point in the sequence it will assert 1 unit / 4 lessons; the assertion is finalized to 12 units in Task 12.
- [ ] Update `learn.test.ts`: add a new, separate `describe`/`it` block for B2 unit/lesson counts, analogous to the A1 blocks, without touching the A1 assertions.
- [ ] `npx prisma db seed`, then `npx vitest run tests/integration/seedContent.test.ts tests/integration/learn.test.ts`, then `npx eslint prisma/seed.ts tests/integration/seedContent.test.ts tests/integration/learn.test.ts`.
- [ ] `git commit -m "feat: expand B2 unit 1 - Wiederholung & Passiv"`

---

### Task 2: Seed B2 Unit 2 — Konjunktiv I (formelle indirekte Rede)

**Files:** `prisma/seed.ts`, `tests/integration/seedContent.test.ts` (count bump), `tests/integration/learn.test.ts` (count bump)

Unit `order: 2`. Lessons: (1) Konjunktiv-I-Formen (regelmäßige Verben) — stem + `-e/-est/-e/-en/-et/-en`; (2) Konjunktiv I von sein/haben/Modalverben — irregular forms (`sei, seiest, sei…`, `habe, habest…`, `könne, müsse…`); (3) Ersatzform mit "würde" — used when Konjunktiv I is identical to indicative; (4) indirekte Fragen/Aufforderungen — `ob`-clauses and reported commands with `sollen`.

- [ ] Insert `b2Unit2` + 4 lessons before the C1 anchor comment, each with 2 exercises + 2 vocab.
- [ ] Bump B2 unit-count test assertions (still in-progress values, not yet 12/48 — only bumped in the dedicated B2 test blocks added in Task 1).
- [ ] `npx prisma db seed`; `npx vitest run tests/integration/seedContent.test.ts tests/integration/learn.test.ts`; `npx eslint prisma/seed.ts tests/integration/seedContent.test.ts tests/integration/learn.test.ts`.
- [ ] `git commit -m "feat: seed B2 unit 2 - Konjunktiv I"`

---

### Task 3: Seed B2 Unit 3 — Passiv mit Modalverben

Unit `order: 3`. Lessons: (1) Präsens ("muss gemacht werden"); (2) Präteritum ("musste gemacht werden"); (3) Negation im Passiv mit Modalverben ("darf nicht gemacht werden"); (4) Wiederholung (mixed review of unit 1 Passiv + Modalverben combination).

Same step pattern as Task 2. Commit: `feat: seed B2 unit 3 - Passiv mit Modalverben`

---

### Task 4: Seed B2 Unit 4 — Partizipialattribute

Unit `order: 4`. Lessons: (1) Partizip I als Adjektiv (`der schlafende Mann` — ongoing/active); (2) Partizip II als Adjektiv (`der reparierte Wagen` — completed/passive); (3) erweiterte Partizipialattribute (`der von vielen Menschen geliebte Sänger`); (4) Umwandlung zu Relativsätzen (Partizipialattribut ↔ `der/die/das ...`-clause).

Same step pattern. Commit: `feat: seed B2 unit 4 - Partizipialattribute`

---

### Task 5: Seed B2 Unit 5 — Nominalisierung

Unit `order: 5`. Lessons: (1) Verben zu Nomen (-ung): `bauen → die Bauung`... `entwickeln → die Entwicklung`; (2) Adjektive zu Nomen (-heit/-keit): `frei → die Freiheit`, `möglich → die Möglichkeit`; (3) Infinitiv als Nomen: `das Rauchen`, `das Lesen`; (4) Nominalisierung in formellen Texten (style shift from verbal to nominal register).

Same step pattern. Commit: `feat: seed B2 unit 5 - Nominalisierung`

---

### Task 6: Seed B2 Unit 6 — Komplexe Konnektoren

Unit `order: 6`. Lessons: (1) dennoch/trotzdem; (2) gleichwohl; (3) insofern (als); (4) zumal.

Same step pattern. Commit: `feat: seed B2 unit 6 - Komplexe Konnektoren`

---

### Task 7: Seed B2 Unit 7 — Funktionsverbgefüge

Unit `order: 7`. Lessons: (1) in Frage stellen / zur Verfügung stehen; (2) Anwendung finden / Rücksicht nehmen; (3) zum Ausdruck bringen / in Betracht ziehen; (4) Wiederholung (mixed review).

Same step pattern. Commit: `feat: seed B2 unit 7 - Funktionsverbgefüge`

---

### Task 8: Seed B2 Unit 8 — Textkohärenz

Unit `order: 8`. Lessons: (1) Personalpronomen als Verweiswörter; (2) Demonstrativpronomen als Verweis (`dieser, jener`); (3) Konnektoren zur Textverknüpfung; (4) Verweiswörter (dabei/dazu/damit).

Same step pattern. Commit: `feat: seed B2 unit 8 - Textkohärenz`

---

### Task 9: Seed B2 Unit 9 — Konjunktiv II der Vergangenheit

Unit `order: 9`. Lessons: (1) Bildung mit "hätte" + Partizip II; (2) Bildung mit "wäre" + Partizip II; (3) irreale Bedingungssätze der Vergangenheit (`Wenn ich Zeit gehabt hätte, wäre ich gekommen`); (4) Wiederholung.

Same step pattern. Commit: `feat: seed B2 unit 9 - Konjunktiv II der Vergangenheit`

---

### Task 10: Seed B2 Unit 10 — Passiversatzformen

Unit `order: 10`. Lessons: (1) "sich lassen" + Infinitiv; (2) man-Konstruktion; (3) sein + zu + Infinitiv; (4) Vergleich der Passiversatzformen.

Same step pattern. Commit: `feat: seed B2 unit 10 - Passiversatzformen`

---

### Task 11: Seed B2 Unit 11 — Relativsätze mit Präpositionen

Unit `order: 11`. Lessons: (1) Präposition + Relativpronomen (Akkusativ); (2) Präposition + Relativpronomen (Dativ); (3) "was"/"wo(r)+Präposition"; (4) Wiederholung.

Same step pattern. Commit: `feat: seed B2 unit 11 - Relativsätze mit Präpositionen`

---

### Task 12: Seed B2 Unit 12 — Redewiedergabe & formelle Stilmittel, finalize counts, full suite

Unit `order: 12`. Lessons: (1) Redewiedergabe mit Konjunktiv I; (2) Nominalstil vs. Verbalstil; (3) formelle Konnektoren in Berichten; (4) Wiederholung Gesamtkurs B2.

- [ ] Insert `b2Unit12` + 4 lessons before the C1 anchor comment.
- [ ] Finalize the B2 test assertions added in Task 1 to the target values: `expect(units).toHaveLength(12)`, each with 4 lessons, `totalLessons === 48` (mirroring the A1 assertion shape in `seedContent.test.ts`); finalize the `learn.test.ts` B2 block similarly (`b2?.unitCount === 12`, `units.length === 12`, `units[0].lessons.length === 4`).
- [ ] `npx prisma db seed`.
- [ ] Self-review across the whole diff: no MATCHING exercise positionally guessable, no vocab duplication anywhere in the file, all 48 B2 lessons have complete trilingual explanations, unit `order` is a clean 1–12 sequence with `b2` `levelId` throughout, anchor comment byte-for-byte unmodified.
- [ ] Run the **full** suite: `npx vitest run` and `npx eslint .`; confirm both clean (all levels, not just B2/A1-scoped files).
- [ ] `git commit -m "feat: seed B2 unit 12 - Redewiedergabe & formelle Stilmittel"`

---

## Report

After Task 12, write a final summary to `.superpowers/sdd/phase8-b2-report.md` covering: units built, commit list, final test/lint output, self-review findings, concerns.
