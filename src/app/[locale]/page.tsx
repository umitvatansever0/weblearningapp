import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AdSlot } from '@/components/AdSlot'
import { buildAlternates, localizedUrl, SITE_NAME, OG_IMAGE, OG_LOCALE } from '@/lib/seo'

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  // Title/description come from the localized layout defaults. We add canonical
  // + hreflang alternates and a complete openGraph object (Next replaces — not
  // deep-merges — the parent openGraph, so it must carry image/siteName/locale).
  return {
    alternates: buildAlternates(locale, ''),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url: localizedUrl(locale, ''),
      locale: OG_LOCALE[locale] ?? OG_LOCALE.en,
      images: [OG_IMAGE],
    },
  }
}

export default function HomePage() {
  const t = useTranslations('home')

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-12">
      <section className="flex flex-col gap-4 text-center">
        <h1 className="text-4xl font-bold">{t('heroTitle')}</h1>
        <p className="text-lg text-gray-600">{t('heroSubtitle')}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="bg-gray-900 text-white rounded px-5 py-2">
            {t('ctaRegister')}
          </Link>
          <Link href="/learn" className="border rounded px-5 py-2">
            {t('viewAllLessons')}
          </Link>
        </div>
        <p className="text-base text-gray-600 text-left mt-2">{t('intro')}</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">{t('levelsTitle')}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('levelsIntro')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LEVELS.map((level) => (
            <Link
              key={level}
              href={`/learn/${level}`}
              className="border rounded p-4 flex flex-col gap-1 hover:border-gray-900 transition-colors"
            >
              <span className="font-bold">German {level}</span>
              <span className="text-sm text-gray-600">{t(`level${level}Desc`)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">{t('featuresTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold">{t('featureGrammarTitle')}</h3>
            <p className="text-sm text-gray-600">{t('featureGrammarBody')}</p>
          </div>
          <div>
            <h3 className="font-semibold">{t('featureVocabTitle')}</h3>
            <p className="text-sm text-gray-600">{t('featureVocabBody')}</p>
          </div>
          <div>
            <h3 className="font-semibold">{t('featureExercisesTitle')}</h3>
            <p className="text-sm text-gray-600">{t('featureExercisesBody')}</p>
          </div>
          <div>
            <h3 className="font-semibold">{t('featureSrsTitle')}</h3>
            <p className="text-sm text-gray-600">{t('featureSrsBody')}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">{t('audienceTitle')}</h2>
        <p className="text-sm text-gray-600">{t('audienceBody')}</p>
      </section>

      <AdSlot placement="home" />
    </main>
  )
}
