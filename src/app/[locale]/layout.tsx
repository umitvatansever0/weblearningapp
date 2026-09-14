import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import { Analytics } from '@/components/Analytics'
import { Providers } from '@/components/Providers'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

const TITLES: Record<string, string> = {
  en: 'DeutschLernen — Learn German',
  de: 'DeutschLernen — Deutsch lernen',
  tr: 'DeutschLernen — Almanca Öğren',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: TITLES[locale] ?? TITLES.en,
  }
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
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            {children}
            <Footer />
            <CookieConsentBanner />
            <Analytics />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
