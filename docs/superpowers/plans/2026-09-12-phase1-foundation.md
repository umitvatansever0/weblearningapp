# Phase 1 — Foundation & Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the foundational Next.js application — project scaffolding, PostgreSQL/Prisma data layer, credentials-based authentication, three-language UI (DE/EN/TR), base layout, and a GDPR-style cookie consent banner — so that a visitor can register, log in, and browse a translated shell of the site.

**Architecture:** Next.js 15 (App Router, TypeScript) with a `[locale]` root segment driven by `next-intl` for UI translation; PostgreSQL accessed through a single Prisma client singleton; NextAuth.js (Credentials provider, JWT sessions) for authentication, backed by the same `User` table. Every later phase (exercise engine, content, vocab, gamification, admin, ads) builds on top of this shell without needing to change it.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Prisma 5 + PostgreSQL, NextAuth.js 4, next-intl 3, Zod, bcryptjs, Vitest + Testing Library.

## Global Constraints

- Node.js >= 18.18 (Next.js 15 requirement).
- Package manager: npm (use `npm install`, not yarn/pnpm).
- TypeScript strict mode stays enabled (default from `create-next-app`); no new `any` types.
- Every UI-facing string must be added to `messages/de.json`, `messages/en.json`, and `messages/tr.json` with matching keys — enforced by the key-consistency test in Task 6. No hardcoded UI text in components.
- A local PostgreSQL instance is required to run integration tests; connection string lives in `.env` (never committed) as `DATABASE_URL`, with `.env.example` documenting the required shape.
- This is the first of six planned phases (exercise engine, A1 content, vocab/spaced-repetition, gamification, ads/SEO/legal follow later) — do not add models, routes, or fields that belong to those phases (e.g. no `Level`/`Lesson`/`VocabWord` tables yet).

---

### Task 1: Project Scaffolding

**Files:**
- Create: entire Next.js project structure via `create-next-app` (`package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`, `eslint.config.mjs`)
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a runnable Next.js dev server (`npm run dev`), a working test runner (`npm test`), path alias `@/*` → `src/*`.

- [ ] **Step 1: Scaffold the Next.js app in the current directory**

Run (the directory already contains `.git/` and `docs/`, which `create-next-app` tolerates since neither conflicts with generated files):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

If prompted interactively for any option not covered by a flag, accept the default.

- [ ] **Step 2: Verify the dev server starts**

Run: `npm run dev`
Expected: console prints `Ready in ...ms` and the app is reachable at `http://localhost:3000` (open it and confirm the default Next.js welcome page renders). Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 3: Install Vitest and testing libraries**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 4: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Add the test script and write a smoke test**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `tests/unit/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('smoke test', () => {
  it('sanity check passes', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run the test suite**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Vitest"
```

---

### Task 2: Prisma + PostgreSQL + User Model

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Modify: `.gitignore` (ensure `.env` is ignored)
- Create: `.env.example`
- Test: `tests/integration/user.test.ts`

**Interfaces:**
- Consumes: nothing new from Task 1 besides the `@/*` alias.
- Produces: `prisma` client singleton exported from `src/lib/prisma.ts` (`import { prisma } from '@/lib/prisma'`); `User` model with fields `id, email, passwordHash, name, role (Role: USER|ADMIN), uiLanguage (UiLanguage: DE|EN|TR), createdAt, updatedAt`. Later tasks (3, 4, 5) depend on this exact shape.

- [ ] **Step 1: Install Prisma**

```bash
npm install @prisma/client
npm install -D prisma
```

- [ ] **Step 2: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and a `.env` with a placeholder `DATABASE_URL`.

- [ ] **Step 3: Point `.env` at a real local database and document it**

Edit `.env` and set `DATABASE_URL` to a real local PostgreSQL connection string, e.g.:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/deutschlernen_dev?schema=public"
```

Create `.env.example`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/deutschlernen_dev?schema=public"
```

Confirm `.gitignore` contains a line ignoring `.env` (add `.env` to it if the generated `.gitignore` only lists `.env*.local`).

- [ ] **Step 4: Write the failing integration test**

Create `tests/integration/user.test.ts`:

```ts
import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('User model', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'schema-test@example.com' } })
    await prisma.$disconnect()
  })

  it('creates and retrieves a user with default role and uiLanguage', async () => {
    const created = await prisma.user.create({
      data: {
        email: 'schema-test@example.com',
        passwordHash: 'hashed-placeholder',
        name: 'Schema Test',
      },
    })

    expect(created.role).toBe('USER')
    expect(created.uiLanguage).toBe('EN')

    const found = await prisma.user.findUnique({ where: { email: 'schema-test@example.com' } })
    expect(found?.name).toBe('Schema Test')
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `src/lib/prisma.ts` does not exist yet (module not found).

- [ ] **Step 6: Define the schema**

Replace the contents of `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum UiLanguage {
  DE
  EN
  TR
}

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String
  name         String
  role         Role       @default(USER)
  uiLanguage   UiLanguage @default(EN)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

- [ ] **Step 7: Create the Prisma client singleton**

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 8: Run the migration**

Run: `npx prisma migrate dev --name init`
Expected: migration created under `prisma/migrations/`, applied to the database, and `@prisma/client` regenerated automatically.

- [ ] **Step 9: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add prisma src/lib/prisma.ts tests/integration/user.test.ts .env.example .gitignore
git commit -m "feat: add Prisma schema and User model"
```

---

### Task 3: Password Hashing Utility

**Files:**
- Create: `src/lib/password.ts`
- Test: `tests/unit/password.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `hashPassword(plain: string): Promise<string>` and `verifyPassword(plain: string, hash: string): Promise<boolean>`, imported as `import { hashPassword, verifyPassword } from '@/lib/password'`. Tasks 4 and 5 depend on these exact names and signatures.

- [ ] **Step 1: Install bcryptjs**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/password.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/password'

describe('password hashing', () => {
  it('hashes a password to a different string', async () => {
    const hash = await hashPassword('Sup3rSecret!')
    expect(hash).not.toBe('Sup3rSecret!')
  })

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('Sup3rSecret!')
    expect(await verifyPassword('Sup3rSecret!', hash)).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Sup3rSecret!')
    expect(await verifyPassword('WrongPassword', hash)).toBe(false)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `src/lib/password.ts` not found.

- [ ] **Step 4: Implement the utility**

Create `src/lib/password.ts`:

```ts
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/password.ts tests/unit/password.test.ts package.json package-lock.json
git commit -m "feat: add password hashing utility"
```

---

### Task 4: Registration API Route

**Files:**
- Create: `src/lib/validation.ts`
- Create: `src/app/api/register/route.ts`
- Test: `tests/integration/register.test.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma` (Task 2), `hashPassword` from `@/lib/password` (Task 3).
- Produces: `registerSchema` (Zod schema) exported from `@/lib/validation`; `POST` handler at `src/app/api/register/route.ts` accepting `{ email, password, name }` JSON, returning `201` with `{ id, email, name }` on success, `400` with `{ error }` on validation failure, `409` with `{ error }` on duplicate email.

- [ ] **Step 1: Install Zod**

```bash
npm install zod
```

- [ ] **Step 2: Write the failing test**

Create `tests/integration/register.test.ts`:

```ts
import { describe, it, expect, afterAll } from 'vitest'
import { POST } from '@/app/api/register/route'
import { prisma } from '@/lib/prisma'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/register', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'register-test@example.com' } })
    await prisma.$disconnect()
  })

  it('creates a new user and returns 201', async () => {
    const res = await POST(makeRequest({
      email: 'register-test@example.com',
      password: 'Sup3rSecret!',
      name: 'Register Test',
    }))

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.email).toBe('register-test@example.com')
  })

  it('rejects a duplicate email with 409', async () => {
    const res = await POST(makeRequest({
      email: 'register-test@example.com',
      password: 'Sup3rSecret!',
      name: 'Register Test',
    }))

    expect(res.status).toBe(409)
  })

  it('rejects a short password with 400', async () => {
    const res = await POST(makeRequest({
      email: 'another@example.com',
      password: 'short',
      name: 'Someone',
    }))

    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `src/app/api/register/route.ts` not found.

- [ ] **Step 4: Add the validation schema**

Create `src/lib/validation.ts`:

```ts
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
```

- [ ] **Step 5: Implement the route handler**

Create `src/app/api/register/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { registerSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, password, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  })

  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 })
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/validation.ts src/app/api/register tests/integration/register.test.ts package.json package-lock.json
git commit -m "feat: add user registration API route"
```

---

### Task 5: NextAuth Credentials Authentication

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/types/next-auth.d.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Test: `tests/integration/auth.test.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `verifyPassword` from `@/lib/password`.
- Produces: `authorizeUser(email: string, password: string): Promise<{ id, email, name, role } | null>` and `authOptions: NextAuthOptions`, both exported from `@/lib/auth`. `Session.user` is typed with `id: string` and `role: string`. Task 9 (login page) depends on the `next-auth/react` `signIn('credentials', ...)` flow working against this route.

- [ ] **Step 1: Install NextAuth**

```bash
npm install next-auth
```

- [ ] **Step 2: Write the failing test**

Create `tests/integration/auth.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { authorizeUser } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'

describe('authorizeUser', () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        email: 'auth-test@example.com',
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Auth Test',
      },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'auth-test@example.com' } })
    await prisma.$disconnect()
  })

  it('returns the user for correct credentials', async () => {
    const result = await authorizeUser('auth-test@example.com', 'Sup3rSecret!')
    expect(result?.email).toBe('auth-test@example.com')
  })

  it('returns null for wrong password', async () => {
    const result = await authorizeUser('auth-test@example.com', 'WrongPassword')
    expect(result).toBeNull()
  })

  it('returns null for unknown email', async () => {
    const result = await authorizeUser('nobody@example.com', 'whatever')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `src/lib/auth.ts` not found.

- [ ] **Step 4: Implement `authorizeUser` and `authOptions`**

Create `src/lib/auth.ts`:

```ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'

export async function authorizeUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return null

  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        return authorizeUser(credentials.email, credentials.password)
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
```

- [ ] **Step 5: Add session/JWT type augmentation**

Create `src/types/next-auth.d.ts`:

```ts
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
```

- [ ] **Step 6: Add the NextAuth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

Add to `.env` and `.env.example`:

```
NEXTAUTH_SECRET="replace-with-a-random-32-byte-value"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth.ts src/types/next-auth.d.ts src/app/api/auth tests/integration/auth.test.ts .env.example package.json package-lock.json
git commit -m "feat: add NextAuth credentials authentication"
```

---

### Task 6: next-intl Setup (DE/EN/TR Routing)

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/i18n/request.ts`
- Create: `src/middleware.ts`
- Modify: `next.config.ts`
- Create: `messages/en.json`, `messages/de.json`, `messages/tr.json`
- Delete: `src/app/page.tsx`, `src/app/layout.tsx` (default ones from Task 1)
- Create: `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`
- Test: `tests/unit/messages.test.ts`

**Interfaces:**
- Consumes: nothing from previous tasks.
- Produces: `routing` object (`{ locales: ['de','en','tr'], defaultLocale: 'en' }`) from `@/i18n/routing`; `Link`, `useRouter`, `usePathname` from `@/i18n/navigation` — Tasks 7, 8, 9 import these exact names. Message namespaces used by later tasks: `nav`, `footer`, `cookieConsent`, `auth` (the last added in Task 9).

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl
```

- [ ] **Step 2: Write the failing translation key-consistency test**

Create `tests/unit/messages.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import de from '../../messages/de.json'
import en from '../../messages/en.json'
import tr from '../../messages/tr.json'

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return typeof value === 'object' && value !== null
      ? flattenKeys(value as Record<string, unknown>, fullKey)
      : [fullKey]
  })
}

describe('translation messages', () => {
  it('has the same keys in de, en, and tr', () => {
    const deKeys = flattenKeys(de).sort()
    const enKeys = flattenKeys(en).sort()
    const trKeys = flattenKeys(tr).sort()

    expect(deKeys).toEqual(enKeys)
    expect(trKeys).toEqual(enKeys)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `messages/*.json` not found.

- [ ] **Step 4: Create the message files**

Create `messages/en.json`:

```json
{
  "nav": {
    "home": "Home",
    "login": "Log in",
    "register": "Sign up"
  },
  "footer": {
    "rights": "All rights reserved."
  },
  "cookieConsent": {
    "message": "We use cookies to improve your experience and show relevant ads.",
    "accept": "Accept",
    "decline": "Decline"
  }
}
```

Create `messages/de.json`:

```json
{
  "nav": {
    "home": "Startseite",
    "login": "Anmelden",
    "register": "Registrieren"
  },
  "footer": {
    "rights": "Alle Rechte vorbehalten."
  },
  "cookieConsent": {
    "message": "Wir verwenden Cookies, um Ihre Erfahrung zu verbessern und relevante Werbung anzuzeigen.",
    "accept": "Akzeptieren",
    "decline": "Ablehnen"
  }
}
```

Create `messages/tr.json`:

```json
{
  "nav": {
    "home": "Ana Sayfa",
    "login": "Giriş Yap",
    "register": "Kayıt Ol"
  },
  "footer": {
    "rights": "Tüm hakları saklıdır."
  },
  "cookieConsent": {
    "message": "Deneyiminizi geliştirmek ve ilgili reklamları göstermek için çerezler kullanıyoruz.",
    "accept": "Kabul Et",
    "decline": "Reddet"
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Add the routing, navigation, and request config**

Create `src/i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['de', 'en', 'tr'],
  defaultLocale: 'en',
})
```

Create `src/i18n/navigation.ts`:

```ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
```

Create `src/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 7: Add the middleware**

Create `src/middleware.ts`:

```ts
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
```

- [ ] **Step 8: Wire next-intl into the Next.js config**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
```

- [ ] **Step 9: Move the root page/layout under `[locale]`**

Delete `src/app/page.tsx` and `src/app/layout.tsx`.

Create `src/app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
```

Create `src/app/[locale]/page.tsx`:

```tsx
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('nav')
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">{t('home')}</h1>
    </main>
  )
}
```

- [ ] **Step 10: Manually verify all three locales render**

Run: `npm run dev`
Visit `http://localhost:3000/en`, `http://localhost:3000/de`, `http://localhost:3000/tr` — each should render the translated heading ("Home" / "Startseite" / "Ana Sayfa"). Visiting `http://localhost:3000/` should redirect to `/en`. Stop the server once confirmed.

- [ ] **Step 11: Run the full test suite**

Run: `npm test`
Expected: PASS (all prior tests still pass).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add next-intl DE/EN/TR routing"
```

---

### Task 7: Base Layout — Header, Footer, Language Switcher

**Files:**
- Create: `src/components/LanguageSwitcher.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/components/Footer.tsx`
- Modify: `src/app/[locale]/layout.tsx` (render `Header`/`Footer` around `children`)
- Test: `tests/unit/header.test.tsx`

**Interfaces:**
- Consumes: `Link`, `useRouter`, `usePathname` from `@/i18n/navigation` (Task 6); `routing` from `@/i18n/routing` (Task 6); `nav`/`footer` message namespaces (Task 6).
- Produces: `<Header />` and `<Footer />` components rendered in `src/app/[locale]/layout.tsx`, available to every page from this point on.

- [ ] **Step 1: Write the failing Header test**

Create `tests/unit/header.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { Header } from '@/components/Header'
import en from '../../messages/en.json'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}))

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  )
}

describe('Header', () => {
  it('renders login and register links', () => {
    renderWithIntl(<Header />)
    expect(screen.getByText(en.nav.login)).toBeInTheDocument()
    expect(screen.getByText(en.nav.register)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `src/components/Header.tsx` not found.

- [ ] **Step 3: Implement the LanguageSwitcher**

Create `src/components/LanguageSwitcher.tsx`:

```tsx
'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
      className="border rounded px-2 py-1 text-sm"
    >
      {routing.locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc.toUpperCase()}
        </option>
      ))}
    </select>
  )
}
```

- [ ] **Step 4: Implement the Header**

Create `src/components/Header.tsx`:

```tsx
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header() {
  const t = useTranslations('nav')

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Link href="/" className="font-bold text-lg">
        DeutschLernen
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/login">{t('login')}</Link>
        <Link href="/register">{t('register')}</Link>
        <LanguageSwitcher />
      </nav>
    </header>
  )
}
```

- [ ] **Step 5: Implement the Footer**

Create `src/components/Footer.tsx`:

```tsx
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  return (
    <footer className="p-4 text-center text-sm text-gray-500 border-t">
      &copy; {new Date().getFullYear()} DeutschLernen — {t('rights')}
    </footer>
  )
}
```

- [ ] **Step 6: Wire Header/Footer into the locale layout**

In `src/app/[locale]/layout.tsx`, import `Header` and `Footer` and render them around `children`:

```tsx
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
```

Replace `<NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>` with:

```tsx
<NextIntlClientProvider messages={messages}>
  <Header />
  {children}
  <Footer />
</NextIntlClientProvider>
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/Header.tsx src/components/Footer.tsx src/components/LanguageSwitcher.tsx src/app/[locale]/layout.tsx tests/unit/header.test.tsx
git commit -m "feat: add header, footer, and language switcher"
```

---

### Task 8: Cookie Consent Banner

**Files:**
- Create: `src/lib/cookieConsent.ts`
- Create: `src/components/CookieConsentBanner.tsx`
- Modify: `src/app/[locale]/layout.tsx` (render `CookieConsentBanner`)
- Test: `tests/unit/cookieConsent.test.ts`
- Test: `tests/unit/cookieConsentBanner.test.tsx`

**Interfaces:**
- Consumes: `cookieConsent` message namespace (Task 6).
- Produces: `getStoredConsent(): 'accepted' | 'declined' | null` and `storeConsent(status: 'accepted' | 'declined'): void` from `@/lib/cookieConsent` — Phase 6 (ad slots) will gate script loading on `getStoredConsent() === 'accepted'`.

- [ ] **Step 1: Write the failing storage logic test**

Create `tests/unit/cookieConsent.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getStoredConsent, storeConsent } from '@/lib/cookieConsent'

describe('cookie consent storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns null when no consent has been stored', () => {
    expect(getStoredConsent()).toBeNull()
  })

  it('stores and retrieves an accepted consent', () => {
    storeConsent('accepted')
    expect(getStoredConsent()).toBe('accepted')
  })

  it('stores and retrieves a declined consent', () => {
    storeConsent('declined')
    expect(getStoredConsent()).toBe('declined')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `src/lib/cookieConsent.ts` not found.

- [ ] **Step 3: Implement the storage logic**

Create `src/lib/cookieConsent.ts`:

```ts
export type ConsentStatus = 'accepted' | 'declined'

const STORAGE_KEY = 'cookie-consent'

export function getStoredConsent(): ConsentStatus | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'accepted' || value === 'declined' ? value : null
}

export function storeConsent(status: ConsentStatus): void {
  window.localStorage.setItem(STORAGE_KEY, status)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Write the failing banner component test**

Create `tests/unit/cookieConsentBanner.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import en from '../../messages/en.json'

function renderBanner() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CookieConsentBanner />
    </NextIntlClientProvider>
  )
}

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows the banner when no consent is stored', async () => {
    renderBanner()
    await waitFor(() => {
      expect(screen.getByText(en.cookieConsent.message)).toBeInTheDocument()
    })
  })

  it('hides the banner after accepting', async () => {
    renderBanner()
    await waitFor(() => screen.getByText(en.cookieConsent.accept))
    fireEvent.click(screen.getByText(en.cookieConsent.accept))
    await waitFor(() => {
      expect(screen.queryByText(en.cookieConsent.message)).not.toBeInTheDocument()
    })
  })

  it('does not show the banner when consent was already stored', () => {
    window.localStorage.setItem('cookie-consent', 'declined')
    renderBanner()
    expect(screen.queryByText(en.cookieConsent.message)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `src/components/CookieConsentBanner.tsx` not found.

- [ ] **Step 7: Implement the banner**

Create `src/components/CookieConsentBanner.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { getStoredConsent, storeConsent, type ConsentStatus } from '@/lib/cookieConsent'

export function CookieConsentBanner() {
  const t = useTranslations('cookieConsent')
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<ConsentStatus | null>(null)

  useEffect(() => {
    setStatus(getStoredConsent())
    setMounted(true)
  }, [])

  if (!mounted || status !== null) return null

  function handleChoice(choice: ConsentStatus) {
    storeConsent(choice)
    setStatus(choice)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm">{t('message')}</p>
      <div className="flex gap-2">
        <button
          onClick={() => handleChoice('declined')}
          className="px-3 py-1 border border-white rounded text-sm"
        >
          {t('decline')}
        </button>
        <button
          onClick={() => handleChoice('accepted')}
          className="px-3 py-1 bg-white text-gray-900 rounded text-sm"
        >
          {t('accept')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Wire the banner into the locale layout**

In `src/app/[locale]/layout.tsx`, import `CookieConsentBanner` and render it as the last child inside `NextIntlClientProvider`, after `<Footer />`.

- [ ] **Step 9: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/lib/cookieConsent.ts src/components/CookieConsentBanner.tsx src/app/[locale]/layout.tsx tests/unit/cookieConsent.test.ts tests/unit/cookieConsentBanner.test.tsx
git commit -m "feat: add cookie consent banner"
```

---

### Task 9: Register & Login Pages

**Files:**
- Modify: `messages/en.json`, `messages/de.json`, `messages/tr.json` (add `auth` namespace)
- Create: `src/components/Providers.tsx`
- Modify: `src/app/[locale]/layout.tsx` (wrap children in `Providers`)
- Create: `src/app/[locale]/(auth)/register/page.tsx`
- Create: `src/app/[locale]/(auth)/login/page.tsx`
- Test: `tests/unit/registerPage.test.tsx`

**Interfaces:**
- Consumes: `POST /api/register` (Task 4), `signIn('credentials', ...)` from `next-auth/react` (Task 5), `useRouter` from `@/i18n/navigation` (Task 6), `auth` message namespace (this task).
- Produces: working `/​[locale]/register` and `/[locale]/login` pages. This completes Phase 1's end-to-end flow: a visitor can register, then log in.

- [ ] **Step 1: Add the `auth` message namespace**

Add to `messages/en.json` (as a new top-level key alongside `nav`, `footer`, `cookieConsent`):

```json
"auth": {
  "emailLabel": "Email",
  "passwordLabel": "Password",
  "nameLabel": "Name",
  "registerSubmit": "Create account",
  "loginSubmit": "Log in",
  "registerError": "Something went wrong. Please try again.",
  "loginError": "Invalid email or password."
}
```

Add to `messages/de.json`:

```json
"auth": {
  "emailLabel": "E-Mail",
  "passwordLabel": "Passwort",
  "nameLabel": "Name",
  "registerSubmit": "Konto erstellen",
  "loginSubmit": "Anmelden",
  "registerError": "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
  "loginError": "Ungültige E-Mail oder ungültiges Passwort."
}
```

Add to `messages/tr.json`:

```json
"auth": {
  "emailLabel": "E-posta",
  "passwordLabel": "Şifre",
  "nameLabel": "Ad",
  "registerSubmit": "Hesap oluştur",
  "loginSubmit": "Giriş yap",
  "registerError": "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
  "loginError": "Geçersiz e-posta veya şifre."
}
```

- [ ] **Step 2: Run the translation consistency test to verify it still passes**

Run: `npm test -- messages.test`
Expected: PASS (keys still match across all three files).

- [ ] **Step 3: Add the SessionProvider wrapper**

Create `src/components/Providers.tsx`:

```tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

In `src/app/[locale]/layout.tsx`, import `Providers` and wrap the `<Header />{children}<Footer /><CookieConsentBanner />` block with it, inside `NextIntlClientProvider`.

- [ ] **Step 4: Write the failing RegisterPage test**

Create `tests/unit/registerPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import RegisterPage from '@/app/[locale]/(auth)/register/page'
import en from '../../messages/en.json'

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <RegisterPage />
    </NextIntlClientProvider>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('shows a server-provided error message on failed submission', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Email already registered' }),
    })

    renderPage()

    fireEvent.change(screen.getByLabelText(en.auth.nameLabel), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(en.auth.emailLabel), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(en.auth.passwordLabel), { target: { value: 'Sup3rSecret!' } })
    fireEvent.click(screen.getByText(en.auth.registerSubmit))

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `src/app/[locale]/(auth)/register/page.tsx` not found.

- [ ] **Step 6: Implement the register page**

Create `src/app/[locale]/(auth)/register/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? t('registerError'))
      return
    }

    router.push('/login')
  }

  return (
    <main className="max-w-sm mx-auto p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          {t('nameLabel')}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('emailLabel')}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('passwordLabel')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="border rounded px-2 py-1"
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-gray-900 text-white rounded px-4 py-2"
        >
          {t('registerSubmit')}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Implement the login page**

Create `src/app/[locale]/(auth)/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { signIn } from 'next-auth/react'
import { useRouter } from '@/i18n/navigation'

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setSubmitting(false)

    if (result?.error) {
      setError(t('loginError'))
      return
    }

    router.push('/')
  }

  return (
    <main className="max-w-sm mx-auto p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          {t('emailLabel')}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('passwordLabel')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-gray-900 text-white rounded px-4 py-2"
        >
          {t('loginSubmit')}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 9: Manually verify the end-to-end flow**

Run: `npm run dev`
In the browser: visit `http://localhost:3000/en/register`, create an account, confirm redirect to `/en/login`, log in with the same credentials, confirm redirect to `/en` with no error shown. Repeat quickly for `/de/register` and `/tr/register` to confirm translated labels render.

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: PASS — all tests across Tasks 1–9 pass.

- [ ] **Step 11: Commit**

```bash
git add messages src/components/Providers.tsx src/app/[locale]/layout.tsx src/app/[locale]/(auth) tests/unit/registerPage.test.tsx
git commit -m "feat: add register and login pages"
```

---

## Phase 1 Definition of Done

- `npm test` passes with all unit and integration tests green.
- A visitor can open `/en`, `/de`, or `/tr`, see fully translated navigation/footer text, register a new account, log in, and see the cookie consent banner (which disappears after a choice and does not reappear on reload).
- The `User` table, password hashing, and NextAuth session (`id` + `role`) are ready for Phase 2 (exercise engine) to build on without modification.
