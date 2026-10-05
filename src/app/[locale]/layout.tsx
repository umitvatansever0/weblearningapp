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
import { JsonLd } from '@/components/JsonLd'
import {
  SITE_NAME,
  getSiteUrl,
  OG_IMAGE,
  OG_LOCALE,
  organizationJsonLd,
  websiteJsonLd,
} from '@/lib/seo'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

const DEFAULT_TITLE: Record<string, string> = {
  en: 'Learn German Online – A1 to C2 Grammar & Vocabulary | DeutschStep',
  de: 'Deutsch lernen online – A1 bis C2 Grammatik & Wortschatz | DeutschStep',
  tr: 'Online Almanca Öğren – A1’den C2’ye Dilbilgisi ve Kelime | DeutschStep',
}

const DEFAULT_DESCRIPTION: Record<string, string> = {
  en: 'Learn German online with free A1–C2 grammar lessons, exercises and vocabulary practice. Improve your German with structured lessons and spaced repetition.',
  de: 'Lerne Deutsch online mit kostenlosen A1–C2 Grammatiklektionen, Übungen und Wortschatztraining. Verbessere dein Deutsch mit strukturierten Lektionen und Spaced Repetition.',
  tr: 'Ücretsiz A1–C2 dilbilgisi dersleri, alıştırmalar ve kelime pratiğiyle online Almanca öğren. Yapılandırılmış dersler ve aralıklı tekrar ile Almancanı geliştir.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const title = DEFAULT_TITLE[locale] ?? DEFAULT_TITLE.en
  const description = DEFAULT_DESCRIPTION[locale] ?? DEFAULT_DESCRIPTION.en
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale] ?? OG_LOCALE.en,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      images: [OG_IMAGE.url],
    },
    other: {
      'google-adsense-account': 'ca-pub-1871274232514582',
    },
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
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
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
