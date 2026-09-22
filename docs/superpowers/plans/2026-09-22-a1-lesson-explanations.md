# A1 Lesson Explanations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every A1 lesson a real grammar explanation (konu anlatımı) in DE/EN/TR, rendered as formatted markdown above the exercises.

**Architecture:** Add a CSP-safe markdown renderer (`react-markdown` + `remark-gfm`) wrapped in a small `Markdown` component, wire it into the lesson page in place of the raw `<p>`, then rewrite the `explanation{De,En,Tr}` fields of all 52 A1 lessons in `prisma/seed.ts` with markdown content (heading, paragraphs, examples, tables). Apply to production via a full re-seed.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma/PostgreSQL, next-intl, Vitest + Testing Library, `react-markdown`, `remark-gfm`, Tailwind CSS v4.

## Global Constraints

- Scope is A1 only: units 1–13, 52 lessons (seed lines ~60–2140, before `a2Unit1` at line 2154). Do not touch A2–C2 content.
- Fill all three language fields for every lesson: `explanationDe` (German), `explanationEn` (English), `explanationTr` (Turkish, informal "sen" register).
- German example words/sentences stay in German in all three languages; only the surrounding explanation prose is translated.
- Do not change any exercise data, `grammarTopic`, `order`, unit, or vocab — only the three `explanation*` fields per lesson.
- Markdown rendering must stay CSP-safe: use `react-markdown` (React elements, no `dangerouslySetInnerHTML`), never inject raw HTML.
- Each explanation is markdown: an `##` heading, 1–3 short A1-beginner paragraphs, concrete example sentences, and a markdown table when the topic is tabular (conjugations, articles, pronouns, numbers).
- Multi-line explanation strings in `prisma/seed.ts` must use backtick template literals; escape any literal backtick or `${` inside content.
- React 19.2.8 / Next 16.3.5 are pinned — use `react-markdown` and `remark-gfm` versions that support React 19 (current majors do).

---

### Task 1: Markdown renderer component + lesson page wiring

**Files:**
- Modify: `package.json` (add `react-markdown`, `remark-gfm`)
- Create: `src/components/Markdown.tsx`
- Create: `tests/unit/markdown.test.tsx`
- Modify: `src/app/[locale]/learn/[level]/[unit]/[lesson]/page.tsx`

**Interfaces:**
- Produces: `Markdown` React component — `export function Markdown({ children }: { children: string }): JSX.Element`, renders a markdown string with GFM (tables) support. Consumed by the lesson page (and available to any later page).

- [ ] **Step 1: Install dependencies**

Run: `npm install react-markdown remark-gfm`
Expected: `package.json` gains `react-markdown` and `remark-gfm` under `dependencies`; `npm install` exits 0.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/markdown.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Markdown } from '@/components/Markdown'

describe('Markdown', () => {
  it('renders a heading as an <h2>', () => {
    render(<Markdown>{'## Das Verb "sein"'}</Markdown>)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Das Verb "sein"')
  })

  it('renders a GFM table', () => {
    const md = [
      '| Person | Form |',
      '| ------ | ---- |',
      '| ich    | bin  |',
      '| du     | bist |',
    ].join('\n')
    render(<Markdown>{md}</Markdown>)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'bist' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Person' })).toBeInTheDocument()
  })

  it('renders bold text as <strong>', () => {
    render(<Markdown>{'Ich **bin** Anna.'}</Markdown>)
    const strong = screen.getByText('bin')
    expect(strong.tagName).toBe('STRONG')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/markdown.test.tsx`
Expected: FAIL — module `@/components/Markdown` not found.

- [ ] **Step 4: Implement the Markdown component**

Create `src/components/Markdown.tsx`:

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Renders trusted first-party markdown (lesson explanations from the seed)
// as React elements — no raw HTML injection, so it stays within the app's
// strict CSP. remark-gfm adds table support.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-3 text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="text-xl font-bold">{children}</h2>,
          h2: ({ children }) => <h2 className="text-xl font-bold">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>,
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 flex flex-col gap-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 flex flex-col gap-1">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-3 py-1 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-3 py-1">{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/markdown.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Wire the Markdown component into the lesson page**

Edit `src/app/[locale]/learn/[level]/[unit]/[lesson]/page.tsx`. Add the import after the existing `ExerciseRunner` import (line 5):

```tsx
import { Markdown } from '@/components/Markdown'
```

Replace the explanation paragraph (currently `<p className="text-gray-700">{explanation}</p>`, line 33) with:

```tsx
        <Markdown>{explanation}</Markdown>
```

- [ ] **Step 7: Typecheck and build**

Run: `npx tsc --noEmit -p .`
Expected: 0 errors.
Run: `npm run build`
Expected: build succeeds; `/[locale]/learn/[level]/[unit]/[lesson]` still listed.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/components/Markdown.tsx tests/unit/markdown.test.tsx "src/app/[locale]/learn/[level]/[unit]/[lesson]/page.tsx"
git commit -m "feat: render lesson explanations as markdown"
```

---

## Content tasks (2–14): one per A1 unit

Each content task rewrites the `explanationDe`, `explanationEn`, and `explanationTr`
fields of the four lessons in one A1 unit, replacing the current one-liners with real
konu anlatımı in markdown. **Only the three `explanation*` fields change** — leave
`grammarTopic`, `order`, `unitId`, exercises, and vocab exactly as they are.

### Format every explanation must follow

Use a backtick template literal per field. Target shape (this is the quality bar,
adapt content to each topic):

- `explanationEn` example for the "sein" lesson:

```
## The verb "sein" (to be)

"sein" is irregular and one of the most important German verbs. Here are its present-tense forms:

| Pronoun | Form |
| ------- | ---- |
| ich | bin |
| du | bist |
| er/sie/es | ist |
| wir | sind |
| ihr | seid |
| sie/Sie | sind |

**Examples:** Ich **bin** Anna. (I am Anna.) · Wir **sind** müde. (We are tired.)

Use "sein" to introduce yourself, describe states, and give your profession: Ich **bin** Lehrer. (I am a teacher.)
```

- The `explanationDe` version teaches the same in German ("## Das Verb „sein"", German prose, same table, German glosses omitted).
- The `explanationTr` version teaches the same in Turkish, informal ("## „sein" fiili (olmak)", Turkish prose, Turkish glosses like "(Ben Anna'yım.)").

Rules for all three:
- Start with an `##` heading naming the topic.
- 1–3 short paragraphs suited to an A1 beginner.
- At least one concrete German example sentence with a gloss in that field's language.
- A markdown table whenever the topic is tabular (conjugations, article/case tables,
  pronouns, number lists, day/time lists). Non-tabular topics (e.g. a vocabulary or
  "Wiederholung/Übung" review lesson) may skip the table but still need heading +
  paragraphs + examples.
- German example words/sentences stay in German in every language version.

### Per-unit task template

For each unit task below, do exactly this:

- [ ] **Step 1: Read the unit's four lessons in the seed** to see the current
  `explanation*` values and the lesson variable names.

  Run (example for Unit 1): `grep -n "a1Lesson1\|a1Lesson2\|a1Lesson3\|a1Lesson4" prisma/seed.ts` (Unit 1 uses `a1Lesson1..4`; Units 2–13 use `a1UnitN Lesson1..4`, e.g. `a1Unit5Lesson3`).

- [ ] **Step 2: Rewrite the three `explanation*` fields** of each of the four lessons
  in that unit, following the Format section above. Use backtick template literals;
  escape any literal backtick or `${`.

- [ ] **Step 3: Typecheck** — Run: `npx tsc --noEmit -p .` — Expected: 0 errors
  (this catches unterminated/broken template strings).

- [ ] **Step 4: Commit** — `git add prisma/seed.ts && git commit -m "content: A1 Unit N konu anlatımı (<unit title>)"`

### The 13 units (each = one task)

- **Task 2 — Unit 1 "Greetings" (`a1Lesson1..4`):** Begrüßungsformen · Verb "sein" im Präsens · Zahlen 1-10 · Sich vorstellen (Herkunft und Wohnort)
- **Task 3 — Unit 2 "Articles & Nouns" (`a1Unit2Lesson1..4`):** Bestimmter Artikel (der/die/das) · Unbestimmter Artikel (ein/eine) · Plural · Verneinung mit "kein"
- **Task 4 — Unit 3 "Personal Pronouns & Present Tense" (`a1Unit3Lesson1..4`):** Personalpronomen · Regelmäßige Verben im Präsens · Verb "haben" · W-Fragen
- **Task 5 — Unit 4 "Family & Possessives" (`a1Unit4Lesson1..4`):** Familienmitglieder · Possessivartikel (mein/dein) · Ja/Nein-Fragen · Wiederholung (Familie + Artikel + Präsens)
- **Task 6 — Unit 5 "Numbers, Time & Daily Life" (`a1Unit5Lesson1..4`):** Zahlen 11-100 · Uhrzeit · Wochentage · Tagesablauf
- **Task 7 — Unit 6 "Accusative Case" (`a1Unit6Lesson1..4`):** Akkusativ-Artikel · Akkusativ-Pronomen · Verben mit Akkusativ · Verneinung mit "nicht"
- **Task 8 — Unit 7 "Modal Verbs" (`a1Unit7Lesson1..4`):** können/müssen · wollen/möchten/dürfen · Satzstruktur mit Modalverben · Bestellungen ("Ich möchte...")
- **Task 9 — Unit 8 "Separable Verbs & Daily Life" (`a1Unit8Lesson1..4`):** Trennbare Verben (Einführung) · Weitere trennbare Verben (einkaufen, fernsehen) · Satzstellung mit trennbaren Verben und Zeit · Übung (trennbare Verben Wiederholung)
- **Task 10 — Unit 9 "Dative Case & Prepositions" (`a1Unit9Lesson1..4`):** Dativ-Artikel · Präpositionen mit Dativ · Wechselpräpositionen (Einführung) · Wohnung/Zimmer
- **Task 11 — Unit 10 "Food & Shopping" (`a1Unit10Lesson1..4`):** Lebensmittel · "Ich hätte gern" / Mengenangaben · Im Restaurant · Übung (Essen & Einkaufen Wiederholung)
- **Task 12 — Unit 11 "Perfekt (Introduction)" (`a1Unit11Lesson1..4`):** Perfekt mit "haben" · Perfekt mit "sein" · Partizip II (regelmäßig/unregelmäßig) · Übung (Perfekt Wiederholung)
- **Task 13 — Unit 12 "Imperative & Giving Directions" (`a1Unit12Lesson1..4`):** Imperativ (du) · Imperativ (ihr/Sie) · Wegbeschreibung · Übung (Imperativ & Wegbeschreibung Wiederholung)
- **Task 14 — Unit 13 "Adjectives & Comparisons" (`a1Unit13Lesson1..4`):** Adjektivendungen nach bestimmtem Artikel · Adjektivendungen nach unbestimmtem Artikel · Komparativ · Superlativ

> Verify each unit's lesson variable names with the Step 1 grep before editing — the
> exact identifiers (`a1UnitNLessonM`) are how you locate each lesson's block.

---

### Task 15: Local seed verification, full test suite, production re-seed + deploy

**Files:** none (verification + deployment).

- [ ] **Step 1: Re-seed the local dev database** to confirm the rewritten seed runs end-to-end with no runtime errors.

Run: `npx prisma db seed`
Expected: ends with `Seed complete.` / `The seed command has been executed.` and no thrown error.

- [ ] **Step 2: Full test suite** — Run: `npx vitest run` — Expected: all tests pass (including the new `markdown.test.tsx`).

- [ ] **Step 3: Typecheck** — Run: `npx tsc --noEmit -p .` — Expected: 0 errors.

- [ ] **Step 4: Lint** — Run: `npx eslint .` — Expected: 0 errors.

- [ ] **Step 5: Build** — Run: `npm run build` — Expected: build succeeds.

- [ ] **Step 6: Spot-check rendered content locally.** Run `npm run dev`, log in, open an A1 lesson (e.g. Unit 1 → "Verb 'sein' im Präsens"), and confirm the explanation renders with a heading, paragraphs, and a conjugation table above the exercises. Stop the dev server afterward.

- [ ] **Step 7: Re-seed production.** This is a production write and deletes/re-inserts all curriculum (pre-launch, accepted). Run with the production Neon connection string (unpooled endpoint):

```bash
DATABASE_URL="<production-neon-unpooled-url>" npx prisma db seed
```

Expected: `Seed complete.`

- [ ] **Step 8: Push to deploy.** The final commit is already made by the content tasks and Task 1; push `master` so Vercel auto-deploys, then confirm the deployment reaches Ready and an A1 lesson shows the explanation on the live site.

```bash
git push origin master
```

---

## Notes for the executor

- Tasks 2–14 all edit the same file (`prisma/seed.ts`) but disjoint lesson blocks; run
  them sequentially (never in parallel) to avoid conflicts.
- The content is the deliverable for Tasks 2–14; there is no unit test per unit
  (explanations are data). `tsc` after each unit is the guard against broken strings,
  and Task 15 Step 1 re-runs the seed to catch any runtime issue.
- If a lesson's topic genuinely isn't tabular (vocabulary lists, review/Übung
  lessons), a table is not required — heading + paragraphs + examples still are.
