# Phase 4 — Public Homepage, Monetization & Legal Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the still-missing pieces of the master design (public homepage, ad monetization scaffolding, GDPR legal pages, and basic SEO), all gated by the existing cookie-consent infrastructure.

**Architecture:** Two new consent-aware client components (`AdSlot`, `Analytics`) that read `src/lib/cookieConsent.ts` and render nothing unless the user has accepted cookies AND the relevant `NEXT_PUBLIC_*` env var is set. These are wired into five existing surfaces. Two new static, synchronous (non-async, no DB/auth) locale pages for `/privacy` and `/terms`, and a rewritten `/` homepage — all following the existing pattern of calling `useTranslations` directly in a Server Component (see `src/app/[locale]/admin/content/page.tsx` for precedent of `Link` usage in RSC, and the original `src/app/[locale]/page.tsx` for precedent of sync `useTranslations` in RSC). Root-level `sitemap.ts` / `robots.ts` using Next's native `MetadataRoute` types.

**Tech Stack:** Next.js App Router (RSC + client components), next-intl, Vitest + React Testing Library, existing `src/lib/cookieConsent.ts`.

## Global Constraints

- All user-facing strings go in `messages/de.json`, `messages/en.json`, `messages/tr.json` — every new key must be added to all three files, in the same order, before the component that uses it.
- `AdSlot` and `Analytics` must render nothing (return `null`, inject no scripts) unless `getStoredConsent() === 'accepted'` AND the required `NEXT_PUBLIC_*` env var(s) are non-empty. This is not an error state — no fallback UI, no console warning.
- New env vars go in `.env.example` with empty default values: `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_ADSENSE_SLOT_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_SITE_URL`.
- Follow existing test conventions exactly: component tests live in `tests/unit/*.test.tsx`, wrap with `<NextIntlClientProvider locale="en" messages={en}>` importing `en` from `../../messages/en.json`, mock `@/i18n/navigation` the same way `tests/unit/header.test.tsx` does when a test touches `Link`/`useRouter`.
- Do not add tests for plain RSC pages (`page.tsx` files with no client logic) — this codebase has no precedent for that (verified: no test imports any `page.tsx`). Only test client components and pure functions (`sitemap.ts`/`robots.ts` are plain functions and ARE tested).
- Run `npx vitest run` and `npx eslint .` after every task; both must be clean before moving to the next task.
- Commit after every task with a `feat:`-prefixed message, matching the granularity of prior phases (one commit per component/page).

---

### Task 1: `AdSlot` component

**Files:**
- Create: `src/components/AdSlot.tsx`
- Test: `tests/unit/adSlot.test.tsx`
- Modify: `.env.example`

**Interfaces:**
- Produces: `export type AdPlacement = 'home' | 'lessonList' | 'exerciseResult' | 'sidebar' | 'vocabReview'` and `export function AdSlot({ placement }: { placement: AdPlacement }): JSX.Element | null`. Later tasks import `AdSlot` and `AdPlacement` from `@/components/AdSlot`.
- Consumes: `getStoredConsent`, `subscribeToConsent` from `@/lib/cookieConsent` (already exist, signatures unchanged).

- [ ] **Step 1: Add the three AdSense env vars to `.env.example`**

Append to `.env.example`:
```
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
NEXT_PUBLIC_ADSENSE_SLOT_ID=
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/adSlot.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdSlot } from '@/components/AdSlot'

describe('AdSlot', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT_ID', 'ca-pub-123')
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ID', 'slot-456')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.querySelectorAll('script[src*="adsbygoogle.js"]').forEach((node) => node.remove())
  })

  it('renders nothing when consent has not been given', () => {
    render(<AdSlot placement="home" />)
    expect(screen.queryByTestId('ad-slot-home')).not.toBeInTheDocument()
  })

  it('renders nothing when consent was declined', () => {
    window.localStorage.setItem('cookie-consent', 'declined')
    render(<AdSlot placement="home" />)
    expect(screen.queryByTestId('ad-slot-home')).not.toBeInTheDocument()
  })

  it('renders nothing when consent is accepted but the AdSense client id is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT_ID', '')
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<AdSlot placement="home" />)
    expect(screen.queryByTestId('ad-slot-home')).not.toBeInTheDocument()
  })

  it('renders the ad unit with the placement-specific test id when consent is accepted and env vars are set', () => {
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<AdSlot placement="sidebar" />)
    const ins = screen.getByTestId('ad-slot-sidebar')
    expect(ins).toHaveAttribute('data-ad-client', 'ca-pub-123')
    expect(ins).toHaveAttribute('data-ad-slot', 'slot-456')
  })

  it('injects the adsbygoogle loader script once when enabled', () => {
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<AdSlot placement="home" />)
    const scripts = document.querySelectorAll('script[src*="adsbygoogle.js"]')
    expect(scripts.length).toBe(1)
  })
})
```

Add `import { vi } from 'vitest'` alongside the existing `vitest` import (combine into the first import line: `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'`).

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/adSlot.test.tsx`
Expected: FAIL — cannot find module `@/components/AdSlot`.

- [ ] **Step 4: Write the implementation**

Create `src/components/AdSlot.tsx`:
```tsx
'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { getStoredConsent, subscribeToConsent } from '@/lib/cookieConsent'

export type AdPlacement = 'home' | 'lessonList' | 'exerciseResult' | 'sidebar' | 'vocabReview'

function getServerSnapshot() {
  return null
}

export function AdSlot({ placement }: { placement: AdPlacement }) {
  const consent = useSyncExternalStore(subscribeToConsent, getStoredConsent, getServerSnapshot)
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID
  const enabled = consent === 'accepted' && Boolean(clientId) && Boolean(slotId)

  useEffect(() => {
    if (!enabled) return
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return
    const script = document.createElement('script')
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
    script.async = true
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)
  }, [enabled, clientId])

  useEffect(() => {
    if (!enabled) return
    const win = window as unknown as { adsbygoogle?: unknown[] }
    try {
      win.adsbygoogle = win.adsbygoogle ?? []
      win.adsbygoogle.push({})
    } catch {
      // adsbygoogle script may not have finished loading yet; safe to skip
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <ins
      className="adsbygoogle block"
      data-testid={`ad-slot-${placement}`}
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
      style={{ display: 'block' }}
    />
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/adSlot.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 6: Lint and commit**

Run: `npx eslint src/components/AdSlot.tsx tests/unit/adSlot.test.tsx`
Expected: no errors

```bash
git add src/components/AdSlot.tsx tests/unit/adSlot.test.tsx .env.example
git commit -m "feat: add consent-gated AdSlot component"
```

---

### Task 2: `Analytics` component

**Files:**
- Create: `src/components/Analytics.tsx`
- Test: `tests/unit/analytics.test.tsx`
- Modify: `.env.example`

**Interfaces:**
- Produces: `export function Analytics(): null`. Task 4 renders `<Analytics />` in the locale layout.
- Consumes: same `@/lib/cookieConsent` exports as Task 1.

- [ ] **Step 1: Add the GA env var to `.env.example`**

Append:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/analytics.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { Analytics } from '@/components/Analytics'

describe('Analytics', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST123')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.querySelectorAll('script[data-ga-script]').forEach((node) => node.remove())
  })

  it('injects nothing when consent has not been given', () => {
    render(<Analytics />)
    expect(document.querySelectorAll('script[data-ga-script]').length).toBe(0)
  })

  it('injects nothing when the measurement id is missing, even with consent', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '')
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<Analytics />)
    expect(document.querySelectorAll('script[data-ga-script]').length).toBe(0)
  })

  it('injects the gtag loader and inline config script when consent is accepted and the id is set', () => {
    window.localStorage.setItem('cookie-consent', 'accepted')
    render(<Analytics />)
    const scripts = document.querySelectorAll('script[data-ga-script]')
    expect(scripts.length).toBe(2)
    const loader = document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
    expect(loader).not.toBeNull()
    expect(loader?.getAttribute('src')).toContain('G-TEST123')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/analytics.test.tsx`
Expected: FAIL — cannot find module `@/components/Analytics`.

- [ ] **Step 4: Write the implementation**

Create `src/components/Analytics.tsx`:
```tsx
'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { getStoredConsent, subscribeToConsent } from '@/lib/cookieConsent'

function getServerSnapshot() {
  return null
}

export function Analytics() {
  const consent = useSyncExternalStore(subscribeToConsent, getStoredConsent, getServerSnapshot)
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const enabled = consent === 'accepted' && Boolean(measurementId)

  useEffect(() => {
    if (!enabled) return
    if (document.querySelector('script[data-ga-script]')) return

    const loader = document.createElement('script')
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    loader.async = true
    loader.setAttribute('data-ga-script', 'loader')
    document.head.appendChild(loader)

    const inline = document.createElement('script')
    inline.setAttribute('data-ga-script', 'inline')
    inline.textContent = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${measurementId}');`
    document.head.appendChild(inline)
  }, [enabled, measurementId])

  return null
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/analytics.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Lint and commit**

Run: `npx eslint src/components/Analytics.tsx tests/unit/analytics.test.tsx`

```bash
git add src/components/Analytics.tsx tests/unit/analytics.test.tsx .env.example
git commit -m "feat: add consent-gated Analytics component"
```

---

### Task 3: Wire `Analytics` into the locale layout

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `Analytics` from Task 2.

- [ ] **Step 1: Add the import and render it next to `CookieConsentBanner`**

In `src/app/[locale]/layout.tsx`, add the import:
```tsx
import { Analytics } from '@/components/Analytics'
```

Change:
```tsx
            <Header />
            {children}
            <Footer />
            <CookieConsentBanner />
```
to:
```tsx
            <Header />
            {children}
            <Footer />
            <CookieConsentBanner />
            <Analytics />
```

- [ ] **Step 2: Run the full suite to confirm nothing broke**

Run: `npx vitest run`
Expected: all existing tests still PASS (this file has no direct test; layout composition is not unit tested per this codebase's convention).

- [ ] **Step 3: Lint and commit**

Run: `npx eslint src/app/[locale]/layout.tsx`

```bash
git add src/app/[locale]/layout.tsx
git commit -m "feat: mount Analytics in the locale layout"
```

---

### Task 4: Public homepage

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `messages/de.json`, `messages/en.json`, `messages/tr.json` (add `home` namespace)
- Test: `tests/unit/homePage.test.tsx`

**Interfaces:**
- Consumes: `AdSlot` from Task 1 (`placement="home"`), `Link` from `@/i18n/navigation`.

- [ ] **Step 1: Add the `home` namespace to all three message files**

In `messages/en.json`, add after the `"nav"` block (before `"footer"`):
```json
  "home": {
    "heroTitle": "Learn German the smart way",
    "heroSubtitle": "Free grammar lessons, exercises, and spaced-repetition vocabulary practice for German learners at every level.",
    "ctaRegister": "Get started for free",
    "ctaLogin": "Log in",
    "levelsTitle": "Levels",
    "levelAvailable": "Available now",
    "levelComingSoon": "Coming soon"
  },
```

In `messages/de.json`, add the same key structure:
```json
  "home": {
    "heroTitle": "Lerne Deutsch auf die smarte Art",
    "heroSubtitle": "Kostenlose Grammatiklektionen, Übungen und Vokabeltraining mit Spaced Repetition für Deutschlernende jeder Stufe.",
    "ctaRegister": "Kostenlos starten",
    "ctaLogin": "Anmelden",
    "levelsTitle": "Niveaus",
    "levelAvailable": "Jetzt verfügbar",
    "levelComingSoon": "Demnächst"
  },
```

In `messages/tr.json`, add:
```json
  "home": {
    "heroTitle": "Almancayı akıllıca öğren",
    "heroSubtitle": "Her seviyeden Almanca öğrenenler için ücretsiz gramer dersleri, alıştırmalar ve aralıklı tekrar yöntemiyle kelime çalışması.",
    "ctaRegister": "Ücretsiz başla",
    "ctaLogin": "Giriş yap",
    "levelsTitle": "Seviyeler",
    "levelAvailable": "Şimdi kullanılabilir",
    "levelComingSoon": "Yakında"
  },
```

(Insert each block immediately after that file's `"nav"` block, keeping valid JSON — add a comma after the `nav` block's closing `}` if not already present.)

- [ ] **Step 2: Write the failing test**

Create `tests/unit/homePage.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import HomePage from '@/app/[locale]/page'
import en from '../../messages/en.json'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}))

describe('HomePage', () => {
  it('renders the hero heading and both CTAs', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <HomePage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(en.home.heroTitle)).toBeInTheDocument()
    expect(screen.getByText(en.home.ctaRegister)).toBeInTheDocument()
    expect(screen.getByText(en.home.ctaLogin)).toBeInTheDocument()
  })

  it('renders all four CEFR levels with an availability label', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <HomePage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText('A1')).toBeInTheDocument()
    expect(screen.getByText('B2')).toBeInTheDocument()
    expect(screen.getAllByText(en.home.levelComingSoon).length).toBe(3)
    expect(screen.getByText(en.home.levelAvailable)).toBeInTheDocument()
  })
})
```

Add `import { vi } from 'vitest'` — combine into the first import line: `import { describe, it, expect, vi } from 'vitest'`.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/homePage.test.tsx`
Expected: FAIL — current `HomePage` only renders `nav.home`, no hero/CTA/level markup.

- [ ] **Step 4: Rewrite the homepage**

Replace the contents of `src/app/[locale]/page.tsx`:
```tsx
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AdSlot } from '@/components/AdSlot'

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const
const AVAILABLE_LEVELS: readonly string[] = ['A1']

export default function HomePage() {
  const t = useTranslations('home')

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-10">
      <section className="flex flex-col gap-4 text-center">
        <h1 className="text-4xl font-bold">{t('heroTitle')}</h1>
        <p className="text-lg text-gray-600">{t('heroSubtitle')}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="bg-gray-900 text-white rounded px-5 py-2">
            {t('ctaRegister')}
          </Link>
          <Link href="/login" className="border rounded px-5 py-2">
            {t('ctaLogin')}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">{t('levelsTitle')}</h2>
        <div className="grid grid-cols-2 gap-4">
          {LEVELS.map((level) => (
            <div key={level} className="border rounded p-4 flex flex-col gap-1">
              <p className="font-bold">{level}</p>
              <p className="text-sm text-gray-600">
                {AVAILABLE_LEVELS.includes(level) ? t('levelAvailable') : t('levelComingSoon')}
              </p>
            </div>
          ))}
        </div>
      </section>

      <AdSlot placement="home" />
    </main>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/homePage.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Run the full suite, lint, and commit**

Run: `npx vitest run && npx eslint .`
Expected: all clean (existing `nav.home` key stays in messages — unrelated, still used by `Header`).

```bash
git add src/app/[locale]/page.tsx tests/unit/homePage.test.tsx messages/de.json messages/en.json messages/tr.json
git commit -m "feat: build public marketing homepage with level overview"
```

---

### Task 5: Privacy and Terms pages

**Files:**
- Create: `src/app/[locale]/(public)/privacy/page.tsx`
- Create: `src/app/[locale]/(public)/terms/page.tsx`
- Modify: `messages/de.json`, `messages/en.json`, `messages/tr.json` (add `legal` namespace)
- Modify: `src/components/Footer.tsx`
- Modify: `messages/de.json`, `messages/en.json`, `messages/tr.json` (add `footer.privacy` / `footer.terms`)
- Test: `tests/unit/legalPages.test.tsx`
- Test: `tests/unit/footer.test.tsx`

**Interfaces:**
- Produces: default-exported `PrivacyPage` and `TermsPage` components (no props). Route paths are `/privacy` and `/terms` in every locale (route groups `(public)` do not affect the URL).

- [ ] **Step 1: Add the `legal` namespace to all three message files**

In `messages/en.json`, add a new top-level key after `"admin"` (before the closing `}` of the file — add a comma after the `admin` block's closing `}`):
```json
  "legal": {
    "privacyTitle": "Privacy Policy",
    "privacyParagraphs": [
      "We collect the information you provide when you create an account (email, name, password) and the learning data generated while you use DeutschLernen, including lesson progress, XP, streaks, badges, and vocabulary review history. This data is stored on our servers and used solely to provide and improve the service.",
      "We use a cookie consent banner to ask for your permission before loading any non-essential cookies. If you accept, we may load Google AdSense to show ads and Google Analytics to understand site usage. If you decline, none of these third-party scripts are loaded, and only strictly necessary cookies (such as your login session) are used.",
      "You can request access to, correction of, or deletion of your personal data at any time by contacting us using the details on our contact page. You can also withdraw cookie consent at any time by clearing your browser's local storage for this site.",
      "If you have questions about this policy, please contact us at the email address listed in your account settings or on our contact page."
    ],
    "termsTitle": "Terms of Service",
    "termsParagraphs": [
      "By creating an account on DeutschLernen you agree to use the service for personal, non-commercial language learning purposes only.",
      "You are responsible for keeping your account credentials confidential and for all activity that occurs under your account.",
      "Content on this platform (grammar explanations, exercises, vocabulary) is provided for educational purposes and may be updated or corrected at any time without notice.",
      "We may suspend or terminate accounts that violate these terms, abuse the service, or attempt to disrupt its operation. We reserve the right to modify these terms; continued use of the service after changes constitutes acceptance of the updated terms."
    ]
  }
```

In `messages/de.json`, add:
```json
  "legal": {
    "privacyTitle": "Datenschutzerklärung",
    "privacyParagraphs": [
      "Wir erheben die Informationen, die Sie bei der Kontoerstellung angeben (E-Mail, Name, Passwort), sowie die Lerndaten, die bei der Nutzung von DeutschLernen entstehen, einschließlich Lektionsfortschritt, XP, Serien (Streaks), Abzeichen und Vokabelwiederholungsverlauf. Diese Daten werden auf unseren Servern gespeichert und ausschließlich zur Bereitstellung und Verbesserung des Dienstes verwendet.",
      "Wir verwenden einen Cookie-Consent-Banner, um vor dem Laden nicht notwendiger Cookies Ihre Zustimmung einzuholen. Bei Zustimmung können wir Google AdSense zur Anzeige von Werbung und Google Analytics zur Nutzungsanalyse laden. Bei Ablehnung werden keine dieser Drittanbieter-Skripte geladen; es werden nur unbedingt notwendige Cookies (z. B. für Ihre Anmeldesitzung) verwendet.",
      "Sie können jederzeit Auskunft über, Berichtigung oder Löschung Ihrer personenbezogenen Daten verlangen, indem Sie uns über die auf unserer Kontaktseite angegebenen Kontaktdaten kontaktieren. Sie können Ihre Cookie-Zustimmung außerdem jederzeit widerrufen, indem Sie den lokalen Speicher Ihres Browsers für diese Website löschen.",
      "Bei Fragen zu dieser Richtlinie kontaktieren Sie uns bitte über die E-Mail-Adresse in Ihren Kontoeinstellungen oder auf unserer Kontaktseite."
    ],
    "termsTitle": "Nutzungsbedingungen",
    "termsParagraphs": [
      "Mit der Erstellung eines Kontos bei DeutschLernen erklären Sie sich damit einverstanden, den Dienst ausschließlich für private, nicht-kommerzielle Sprachlernzwecke zu nutzen.",
      "Sie sind dafür verantwortlich, Ihre Zugangsdaten vertraulich zu behandeln, sowie für alle Aktivitäten, die unter Ihrem Konto stattfinden.",
      "Inhalte auf dieser Plattform (Grammatikerklärungen, Übungen, Vokabeln) dienen Bildungszwecken und können jederzeit ohne Vorankündigung aktualisiert oder korrigiert werden.",
      "Wir können Konten sperren oder löschen, die gegen diese Bedingungen verstoßen, den Dienst missbrauchen oder dessen Betrieb stören. Wir behalten uns das Recht vor, diese Bedingungen zu ändern; die weitere Nutzung des Dienstes nach einer Änderung gilt als Zustimmung zu den aktualisierten Bedingungen."
    ]
  }
```

In `messages/tr.json`, add:
```json
  "legal": {
    "privacyTitle": "Gizlilik Politikası",
    "privacyParagraphs": [
      "Hesap oluştururken sağladığınız bilgileri (e-posta, ad, şifre) ve DeutschLernen'i kullanırken oluşan öğrenme verilerini —ders ilerlemesi, XP, seri (streak), rozetler ve kelime tekrar geçmişi dahil— topluyoruz. Bu veriler sunucularımızda saklanır ve yalnızca hizmeti sunmak ve geliştirmek için kullanılır.",
      "Gerekli olmayan çerezleri yüklemeden önce izninizi almak için bir çerez onay banner'ı kullanıyoruz. Kabul ederseniz reklam göstermek için Google AdSense ve site kullanımını anlamak için Google Analytics yükleyebiliriz. Reddederseniz bu üçüncü taraf script'lerinden hiçbiri yüklenmez; yalnızca oturum açma gibi kesinlikle gerekli çerezler kullanılır.",
      "İletişim sayfamızdaki bilgileri kullanarak bize ulaşıp kişisel verilerinize erişim, düzeltme veya silme talebinde her zaman bulunabilirsiniz. Ayrıca bu site için tarayıcınızın yerel depolamasını temizleyerek çerez onayınızı istediğiniz zaman geri çekebilirsiniz.",
      "Bu politikayla ilgili sorularınız için lütfen hesap ayarlarınızda veya iletişim sayfamızda belirtilen e-posta adresinden bize ulaşın."
    ],
    "termsTitle": "Kullanım Şartları",
    "termsParagraphs": [
      "DeutschLernen'de bir hesap oluşturarak hizmeti yalnızca kişisel, ticari olmayan dil öğrenimi amacıyla kullanmayı kabul etmiş olursunuz.",
      "Hesap bilgilerinizi gizli tutmaktan ve hesabınız altında gerçekleşen tüm etkinliklerden siz sorumlusunuz.",
      "Bu platformdaki içerikler (gramer açıklamaları, alıştırmalar, kelimeler) eğitim amaçlıdır ve önceden haber verilmeksizin herhangi bir zamanda güncellenebilir veya düzeltilebilir.",
      "Bu şartları ihlal eden, hizmeti kötüye kullanan veya işleyişini bozmaya çalışan hesapları askıya alabilir veya sonlandırabiliriz. Bu şartları değiştirme hakkımızı saklı tutarız; değişikliklerden sonra hizmeti kullanmaya devam etmek, güncellenmiş şartların kabulü anlamına gelir."
    ]
  }
```

- [ ] **Step 2: Add `footer.privacy` / `footer.terms` to all three message files**

In `messages/en.json`, change:
```json
  "footer": {
    "rights": "All rights reserved."
  },
```
to:
```json
  "footer": {
    "rights": "All rights reserved.",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service"
  },
```

In `messages/de.json`, find the equivalent `footer` block and add:
```json
    "privacy": "Datenschutz",
    "terms": "Nutzungsbedingungen"
```

In `messages/tr.json`, find the equivalent `footer` block and add:
```json
    "privacy": "Gizlilik Politikası",
    "terms": "Kullanım Şartları"
```

- [ ] **Step 3: Write the failing tests**

Create `tests/unit/legalPages.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import PrivacyPage from '@/app/[locale]/(public)/privacy/page'
import TermsPage from '@/app/[locale]/(public)/terms/page'
import en from '../../messages/en.json'

describe('PrivacyPage', () => {
  it('renders the privacy title and all paragraphs', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <PrivacyPage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(en.legal.privacyTitle)).toBeInTheDocument()
    en.legal.privacyParagraphs.forEach((paragraph) => {
      expect(screen.getByText(paragraph)).toBeInTheDocument()
    })
  })
})

describe('TermsPage', () => {
  it('renders the terms title and all paragraphs', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <TermsPage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(en.legal.termsTitle)).toBeInTheDocument()
    en.legal.termsParagraphs.forEach((paragraph) => {
      expect(screen.getByText(paragraph)).toBeInTheDocument()
    })
  })
})
```

Create `tests/unit/footer.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { Footer } from '@/components/Footer'
import en from '../../messages/en.json'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}))

describe('Footer', () => {
  it('links to the privacy and terms pages', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <Footer />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(en.footer.privacy).closest('a')).toHaveAttribute('href', '/privacy')
    expect(screen.getByText(en.footer.terms).closest('a')).toHaveAttribute('href', '/terms')
  })
})
```

Add `import { vi } from 'vitest'` to the `footer.test.tsx` import line: `import { describe, it, expect, vi } from 'vitest'`.

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run tests/unit/legalPages.test.tsx tests/unit/footer.test.tsx`
Expected: FAIL — `@/app/[locale]/(public)/privacy/page` and `.../terms/page` don't exist yet; `Footer` has no privacy/terms links yet.

- [ ] **Step 5: Create the privacy page**

Create `src/app/[locale]/(public)/privacy/page.tsx`:
```tsx
import { useTranslations } from 'next-intl'

export default function PrivacyPage() {
  const t = useTranslations('legal')
  const paragraphs = t.raw('privacyParagraphs') as string[]

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('privacyTitle')}</h1>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-sm text-gray-700">
          {paragraph}
        </p>
      ))}
    </main>
  )
}
```

- [ ] **Step 6: Create the terms page**

Create `src/app/[locale]/(public)/terms/page.tsx`:
```tsx
import { useTranslations } from 'next-intl'

export default function TermsPage() {
  const t = useTranslations('legal')
  const paragraphs = t.raw('termsParagraphs') as string[]

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('termsTitle')}</h1>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-sm text-gray-700">
          {paragraph}
        </p>
      ))}
    </main>
  )
}
```

- [ ] **Step 7: Add footer links**

Replace the contents of `src/components/Footer.tsx`:
```tsx
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function Footer() {
  const t = useTranslations('footer')
  return (
    <footer className="p-4 text-center text-sm text-gray-500 border-t flex flex-col gap-1">
      <p>
        &copy; {new Date().getFullYear()} DeutschLernen — {t('rights')}
      </p>
      <nav className="flex gap-3 justify-center">
        <Link href="/privacy" className="underline">
          {t('privacy')}
        </Link>
        <Link href="/terms" className="underline">
          {t('terms')}
        </Link>
      </nav>
    </footer>
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run tests/unit/legalPages.test.tsx tests/unit/footer.test.tsx`
Expected: PASS (3 tests total)

- [ ] **Step 9: Run the full suite, lint, and commit**

Run: `npx vitest run && npx eslint .`
Expected: all clean.

```bash
git add src/app/[locale]/\(public\)/privacy/page.tsx src/app/[locale]/\(public\)/terms/page.tsx src/components/Footer.tsx tests/unit/legalPages.test.tsx tests/unit/footer.test.tsx messages/de.json messages/en.json messages/tr.json
git commit -m "feat: add privacy and terms pages, link them from the footer"
```

---

### Task 6: `sitemap.ts` and `robots.ts`

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Test: `tests/unit/sitemap.test.ts`
- Test: `tests/unit/robots.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: default-exported functions matching Next.js's `MetadataRoute.Sitemap` / `MetadataRoute.Robots` conventions — no other task depends on these.

- [ ] **Step 1: Add the site URL env var to `.env.example`**

Append:
```
NEXT_PUBLIC_SITE_URL=
```

- [ ] **Step 2: Write the failing tests**

Create `tests/unit/sitemap.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import sitemap from '@/app/sitemap'

describe('sitemap', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('includes every static path for every locale', () => {
    const entries = sitemap()
    const urls = entries.map((entry) => entry.url)
    expect(urls).toContain('https://example.com/en')
    expect(urls).toContain('https://example.com/de/privacy')
    expect(urls).toContain('https://example.com/tr/terms')
    expect(urls).toContain('https://example.com/en/login')
    expect(urls).toContain('https://example.com/en/register')
  })

  it('produces exactly 15 entries (3 locales x 5 static paths)', () => {
    expect(sitemap().length).toBe(15)
  })
})
```

Create `tests/unit/robots.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import robots from '@/app/robots'

describe('robots', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('disallows authenticated-only sections and points to the sitemap', () => {
    const result = robots()
    expect(result.sitemap).toBe('https://example.com/sitemap.xml')
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules
    expect(rules.disallow).toEqual(['/admin', '/dashboard', '/learn', '/vocab'])
    expect(rules.allow).toBe('/')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/unit/sitemap.test.ts tests/unit/robots.test.ts`
Expected: FAIL — `@/app/sitemap` and `@/app/robots` don't exist yet.

- [ ] **Step 4: Create the sitemap**

Create `src/app/sitemap.ts`:
```ts
import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

const STATIC_PATHS = ['', '/login', '/register', '/privacy', '/terms']

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({ url: `${baseUrl}/${locale}${path}`, lastModified: new Date() })
    }
  }

  return entries
}
```

- [ ] **Step 5: Create robots.ts**

Create `src/app/robots.ts`:
```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/learn', '/vocab'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/unit/sitemap.test.ts tests/unit/robots.test.ts`
Expected: PASS (3 tests total)

- [ ] **Step 7: Run the full suite, lint, and commit**

Run: `npx vitest run && npx eslint .`

```bash
git add src/app/sitemap.ts src/app/robots.ts tests/unit/sitemap.test.ts tests/unit/robots.test.ts .env.example
git commit -m "feat: add sitemap.xml and robots.txt generation"
```

---

### Task 7: Wire `AdSlot` into the four remaining placements

**Files:**
- Modify: `src/app/[locale]/learn/[level]/page.tsx`
- Modify: `src/components/exercises/ExerciseRunner.tsx`
- Modify: `src/app/[locale]/dashboard/page.tsx`
- Modify: `src/components/vocab/VocabReviewSession.tsx`
- Modify: `tests/unit/exerciseRunner.test.tsx`
- Modify: `tests/unit/vocabReviewSession.test.tsx`

**Interfaces:**
- Consumes: `AdSlot` from Task 1.

- [ ] **Step 1: `/learn/[level]` — lesson list placement**

In `src/app/[locale]/learn/[level]/page.tsx`, add the import:
```tsx
import { AdSlot } from '@/components/AdSlot'
```

Change the closing of the returned JSX from:
```tsx
        </div>
      ))}
    </main>
  )
}
```
to:
```tsx
        </div>
      ))}
      <AdSlot placement="lessonList" />
    </main>
  )
}
```

- [ ] **Step 2: `/dashboard` — sidebar placement**

In `src/app/[locale]/dashboard/page.tsx`, add the import:
```tsx
import { AdSlot } from '@/components/AdSlot'
```

Change the end of the returned JSX from:
```tsx
        )}
      </div>
    </main>
  )
}
```
to:
```tsx
        )}
      </div>

      <AdSlot placement="sidebar" />
    </main>
  )
}
```

- [ ] **Step 3: Write the failing test for the exercise-result placement**

In `tests/unit/exerciseRunner.test.tsx`, change the first import line to include `vi`:
```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
```

Add these two `beforeEach`/`afterEach` blocks inside the existing `describe('ExerciseRunner', ...)` block, right after the existing `beforeEach`:
```tsx
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT_ID', 'ca-pub-123')
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ID', 'slot-456')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.querySelectorAll('script[src*="adsbygoogle.js"]').forEach((node) => node.remove())
  })
```

Add a new test at the end of the `describe` block, before the closing `})`:
```tsx
  it('renders the exercise-result ad slot on the lesson-complete screen when consent is accepted', async () => {
    window.localStorage.setItem('cookie-consent', 'accepted')
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ correct: true, correctAnswer: { correctIndex: 1 }, explanation: 'Because B.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ correct: false, correctAnswer: { accepted: ['x'] }, explanation: 'Because text.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
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
      expect(screen.getByTestId('ad-slot-exerciseResult')).toBeInTheDocument()
    })
  })
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run tests/unit/exerciseRunner.test.tsx`
Expected: FAIL — `ad-slot-exerciseResult` not found (not wired in yet).

- [ ] **Step 5: Wire `AdSlot` into `ExerciseRunner`'s finished screen**

In `src/components/exercises/ExerciseRunner.tsx`, add the import:
```tsx
import { AdSlot } from '@/components/AdSlot'
```

Change the `finished` block from:
```tsx
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
```
to:
```tsx
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
        <AdSlot placement="exerciseResult" />
      </div>
    )
  }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/unit/exerciseRunner.test.tsx`
Expected: PASS (all tests in this file, including the new one)

- [ ] **Step 7: Write the failing test for the vocab-review placement**

In `tests/unit/vocabReviewSession.test.tsx`, change the first import line to include `vi`:
```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
```

Add these `beforeEach`/`afterEach` blocks right after the existing `beforeEach`:
```tsx
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT_ID', 'ca-pub-123')
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ID', 'slot-456')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.querySelectorAll('script[src*="adsbygoogle.js"]').forEach((node) => node.remove())
  })
```

Add a new test at the end of the `describe` block, before the closing `})`:
```tsx
  it('renders the vocab-review ad slot after grading the last card when consent is accepted', async () => {
    window.localStorage.setItem('cookie-consent', 'accepted')
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ interval: 1, dueDate: new Date().toISOString() }),
    })

    renderSession([cards[0]])
    fireEvent.click(screen.getByText(en.vocab.showAnswer))
    fireEvent.click(screen.getByText(en.vocab.good))

    await waitFor(() => {
      expect(screen.getByTestId('ad-slot-vocabReview')).toBeInTheDocument()
    })
  })
```

- [ ] **Step 8: Run test to verify it fails**

Run: `npx vitest run tests/unit/vocabReviewSession.test.tsx`
Expected: FAIL — `ad-slot-vocabReview` not found.

- [ ] **Step 9: Wire `AdSlot` into `VocabReviewSession`'s done screen**

In `src/components/vocab/VocabReviewSession.tsx`, add the import:
```tsx
import { AdSlot } from '@/components/AdSlot'
```

Change:
```tsx
  if (done) {
    return <p className="text-lg font-medium">{t('reviewComplete')}</p>
  }
```
to:
```tsx
  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg font-medium">{t('reviewComplete')}</p>
        <AdSlot placement="vocabReview" />
      </div>
    )
  }
```

- [ ] **Step 10: Run test to verify it passes**

Run: `npx vitest run tests/unit/vocabReviewSession.test.tsx`
Expected: PASS (all tests in this file, including the new one)

- [ ] **Step 11: Run the full suite, lint, and commit**

Run: `npx vitest run && npx eslint .`
Expected: all clean.

```bash
git add src/app/[locale]/learn/[level]/page.tsx src/app/[locale]/dashboard/page.tsx src/components/exercises/ExerciseRunner.tsx src/components/vocab/VocabReviewSession.tsx tests/unit/exerciseRunner.test.tsx tests/unit/vocabReviewSession.test.tsx
git commit -m "feat: wire AdSlot into lesson list, dashboard, exercise result, and vocab review"
```

---

## Post-plan verification

After Task 7, run the full checks one more time to confirm the whole phase is coherent:

```bash
npx vitest run
npx eslint .
```

Both must be clean. This closes out master-design sections 9 (monetization, partial — real AdSense/GA credentials still need to be supplied via env vars before going live), 10 (legal/cookie compliance), and 11 (sitemap/robots; per-page meta descriptions and full GA dashboard setup remain a follow-up). `/grammar/[topic]` content pages and the Playwright E2E smoke test are out of scope for this plan (see the design doc's "Kapsam dışı" section).
