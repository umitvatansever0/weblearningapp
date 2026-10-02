import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getLevels } from '@/lib/learn'
import { Link } from '@/i18n/navigation'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { JsonLd } from '@/components/JsonLd'
import { buildPublicMetadata, breadcrumbJsonLd, getLevelCopy } from '@/lib/seo'

const TITLE: Record<string, string> = {
  en: 'German Lessons – A1 to B2 Grammar, Vocabulary & Exercises',
  de: 'Deutschlektionen – A1 bis B2 Grammatik, Wortschatz & Übungen',
  tr: 'Almanca Dersleri – A1’den B2’ye Dilbilgisi, Kelime ve Alıştırmalar',
}

const DESCRIPTION: Record<string, string> = {
  en: 'Browse all German lessons from A1 to B2: grammar explanations, vocabulary and interactive exercises, organised by CEFR level.',
  de: 'Durchsuche alle Deutschlektionen von A1 bis B2: Grammatikerklärungen, Wortschatz und interaktive Übungen, nach CEFR-Niveau geordnet.',
  tr: 'A1’den B2’ye tüm Almanca derslerine göz atın: dilbilgisi anlatımları, kelime ve interaktif alıştırmalar, CEFR seviyesine göre düzenlenmiş.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPublicMetadata({
    locale,
    path: '/learn',
    title: TITLE[locale] ?? TITLE.en,
    description: DESCRIPTION[locale] ?? DESCRIPTION.en,
  })
}

export default async function LevelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('learn')
  const tNav = await getTranslations('nav')
  const levels = await getLevels()

  const breadcrumbs = [
    { name: tNav('home'), path: '/' },
    { name: t('levelsTitle'), path: '/learn' },
  ]

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <JsonLd data={breadcrumbJsonLd(locale, breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-2xl font-bold">{TITLE[locale] ?? TITLE.en}</h1>
      <p className="text-gray-600">{DESCRIPTION[locale] ?? DESCRIPTION.en}</p>
      <ul className="flex flex-col gap-3">
        {levels.map((level) => {
          const copy = getLevelCopy(level.code, locale)
          return (
            <li key={level.code}>
              <Link
                href={`/learn/${level.code}`}
                className="block border rounded p-4 hover:border-gray-900 transition-colors"
              >
                <span className="font-semibold">German {level.code}</span>
                {copy ? <span className="block text-sm text-gray-600">{copy.intro}</span> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
