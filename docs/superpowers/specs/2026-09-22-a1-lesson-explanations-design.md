# A1 Lesson Explanations (Konu Anlatımı) — Design

## Problem

Each A1 lesson currently jumps straight into exercises. The lesson page renders
`lesson.explanation{De,En,Tr}` as a single `<p>`, and the seeded explanations are
one-liners (e.g. "The numbers from 1 to 10 in German: eins, zwei, ..."). There is
no real grammar explanation before the questions. Learners need a proper topic
explanation (konu anlatımı) first, then the exercises.

## Scope

- **Levels:** A1 only (13 units, 52 lessons). Other levels are out of scope for this
  pass (A1 is the only "available" level on the site).
- **Languages:** all three — `explanationDe`, `explanationEn`, `explanationTr`. The
  lesson page shows the explanation for the user's chosen UI locale, so all three
  must be filled for parity.
- **Exercises:** unchanged. This pass only enriches the explanation text and how it
  renders.

## Rendering

The lesson page (`src/app/[locale]/learn/[level]/[unit]/[lesson]/page.tsx`) currently
renders the explanation as `<p className="text-gray-700">{explanation}</p>`.

Change: render the explanation as Markdown using `react-markdown` + `remark-gfm`
(GitHub-flavored markdown, needed for tables). `react-markdown` renders to React
elements (no `dangerouslySetInnerHTML`, no inline HTML execution), so it is
compatible with the app's strict Content-Security-Policy and makes no external
requests. The lesson content is first-party (from the seed), not user input.

- Add a small dedicated component, e.g. `src/components/Markdown.tsx`, wrapping
  `react-markdown` with `remark-gfm` and Tailwind-styled element renderers
  (headings, paragraphs, `table`/`thead`/`tbody`/`th`/`td`, `ul`/`ol`/`li`,
  `strong`/`em`, `code`). Keeps markdown styling in one place and off the page
  component.
- The lesson page uses `<Markdown>{explanation}</Markdown>` in place of the raw
  `<p>`.
- Tables must scroll horizontally on narrow screens (wrap in an
  `overflow-x-auto` container) so a conjugation table never breaks mobile layout.

No schema change: `explanation{De,En,Tr}` are already `String` and hold markdown text
fine.

## Content

Rewrite the `explanation{De,En,Tr}` fields of all 52 A1 lessons in `prisma/seed.ts`
with real konu anlatımı in markdown. Each explanation should contain, scaled to the
topic:

- An `##` heading naming the grammar point.
- 1–3 short explanation paragraphs appropriate for an A1 beginner.
- Concrete example sentences (German + a gloss in the target language).
- A markdown table where the topic is tabular (verb conjugations, articles,
  pronouns, numbers, etc.).

Each language version teaches the same content in that language:
- `explanationDe`: explanation in German (formal, beginner-friendly).
- `explanationEn`: explanation in English.
- `explanationTr`: explanation in Turkish (informal "sen", matching the app's existing
  Turkish register).

German example words/sentences stay in German across all three; only the surrounding
explanation prose is translated.

## Production update

Re-run the full seed against the production Neon database (`prisma db seed`). The seed
deletes and re-inserts all curriculum content, which also cascades to
`UserProgress`/`UserVocabCard`. This is acceptable now: the app is pre-launch and only
the owner's test account exists. (A progress-preserving targeted update is possible but
out of scope given the pre-launch state.)

## Testing

- A unit test for the `Markdown` component: renders a heading, a table, and bold text
  to the expected elements (verifies `remark-gfm` tables work and CSP-safe rendering).
- The existing lesson-page rendering path is server-side and DB-backed; no new
  integration test is added for it beyond confirming the build/typecheck pass. The
  content itself is verified by re-seeding and viewing a lesson.

## Out of scope (YAGNI)

- Other CEFR levels (A2–C2).
- Enriching exercise content or adding new exercise types.
- A progress-preserving production migration path (full re-seed is used, pre-launch).
- Rich media (images, audio) in explanations.
- Authoring/admin UI for editing markdown explanations.

## Dependencies

- `react-markdown` and `remark-gfm` (new). Verify compatibility with this project's
  React 19 / Next 16 during implementation; both support React 19 in current major
  versions.
