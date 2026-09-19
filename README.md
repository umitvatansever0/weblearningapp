# DeutschLernen

A German-learning web app (Next.js App Router + Prisma/Postgres) covering all six CEFR levels (A1–C2), with grammar lessons, exercises, gamification (XP/streaks/badges), and spaced-repetition vocab review.

## Local development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and NEXTAUTH_SECRET at minimum
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.example` for the full list and descriptions. Required at minimum:

- `DATABASE_URL` — Postgres connection string
- `NEXTAUTH_SECRET` — random session-signing secret (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — the app's own URL

`NEXT_PUBLIC_ADSENSE_*`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, and `NEXT_PUBLIC_SITE_URL` are optional; the ad and analytics components no-op until those are set.

**Never commit `.env`** — it's gitignored (`.env*` except `.env.example`). Set real values only in your deployment platform's environment variable settings.

## Testing

```bash
npm run test        # full suite once
npm run test:watch  # watch mode
npx eslint .         # lint
npx tsc --noEmit -p . # typecheck
```

Integration tests hit a real Postgres database via `DATABASE_URL` and expect the schema to be migrated and seeded first (see CI workflow at `.github/workflows/ci.yml` for the exact sequence).

## Deployment (Vercel)

1. Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel.
2. In the Vercel project's Environment Variables settings, add everything from `.env.example` with real production values:
   - `DATABASE_URL` pointing at your production Postgres instance (a dedicated database, not shared with dev/preview environments)
   - A freshly generated `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` set to your real production domain
   - AdSense/GA IDs once you have them (optional to start)
3. Before the first deploy (or after any schema change), run migrations against the production database:
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   ```
   Do **not** use `prisma db push` against production — it's a prototyping tool that can silently drop data on divergent schemas. Migrations live in `prisma/migrations/` and are the only supported way to change the production schema.
4. Seed the initial curriculum content once, against production:
   ```bash
   DATABASE_URL="<production-url>" npx prisma db seed
   ```
   **Warning:** `prisma/seed.ts` deletes and re-inserts all curriculum content (units/lessons/exercises/vocab) on every run, and — because those rows have foreign keys to it — also wipes every user's `UserProgress` (lesson completion) and `UserVocabCard` (spaced-repetition review history) in the process. It does *not* delete `User` accounts themselves (email/password/role/XP/streak survive). Run it once before launch; after real users have progress, re-running it will reset their lesson/vocab progress, so treat it as a one-time initial-content step, not a routine deploy step.
5. Point your domain's DNS at Vercel per their custom-domain instructions, then update `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` to match and redeploy.

## CI

`.github/workflows/ci.yml` runs on every push/PR: spins up a throwaway Postgres, migrates, seeds, then runs typecheck, lint, tests, and a production build.

## Legal / compliance

Before going live, fill in the real operator details on the Contact & Legal Notice page (`messages/*.json` → `contact.fields`) — they currently contain placeholders (`[FULL NAME]`, etc.). Review `legal.privacyParagraphs` / `legal.termsParagraphs` in the same files to make sure they accurately describe your actual data handling before publishing.
