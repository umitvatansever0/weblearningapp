import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { getUnitsForLevel, pickByLocale } from '@/lib/learn'
import { Link } from '@/i18n/navigation'
import { AdSlot } from '@/components/AdSlot'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { JsonLd } from '@/components/JsonLd'
import {
  buildPublicMetadata,
  breadcrumbJsonLd,
  courseJsonLd,
  getLevelCopy,
  localizedUrl,
} from '@/lib/seo'
import type { LevelCode } from '@prisma/client'

const VALID_LEVELS: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; level: string }>
}): Promise<Metadata> {
  const { locale, level } = await params
  const copy = getLevelCopy(level, locale)
  if (!copy) return {}
  return buildPublicMetadata({
    locale,
    path: `/learn/${level}`,
    title: copy.title,
    description: copy.description,
  })
}

export default async function LevelUnitsPage({
  params,
}: {
  params: Promise<{ locale: string; level: string }>
}) {
  const { locale, level } = await params

  if (!VALID_LEVELS.includes(level as LevelCode)) {
    notFound()
  }

  // Content is public; if the visitor happens to be logged in we still show
  // their per-lesson completion ticks, otherwise none are shown.
  const session = await getServerSession(authOptions)
  const t = await getTranslations('learn')
  const tNav = await getTranslations('nav')
  const units = await getUnitsForLevel(level as LevelCode, session?.user?.id)
  const copy = getLevelCopy(level, locale)

  const breadcrumbs = [
    { name: tNav('home'), path: '/' },
    { name: t('levelsTitle'), path: '/learn' },
    { name: `German ${level}`, path: `/learn/${level}` },
  ]

  const structuredData: object[] = [breadcrumbJsonLd(locale, breadcrumbs)]
  if (copy) {
    structuredData.push(
      courseJsonLd({
        name: copy.h1,
        description: copy.description,
        url: localizedUrl(locale, `/learn/${level}`),
      })
    )
  }

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <JsonLd data={structuredData} />
      <Breadcrumbs items={breadcrumbs} />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{copy?.h1 ?? `German ${level}`}</h1>
        {copy ? <p className="text-gray-600">{copy.intro}</p> : null}
      </header>

      {units.map((unit) => (
        <section key={unit.id}>
          <h2 className="text-lg font-semibold mb-2">
            {pickByLocale(locale, { de: unit.titleDe, en: unit.titleEn, tr: unit.titleTr })}
          </h2>
          <ul className="flex flex-col gap-1">
            {unit.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link href={`/learn/${level}/${unit.slug}/${lesson.slug}`} className="underline">
                  {lesson.grammarTopic} {lesson.completed ? '✓' : ''}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <AdSlot placement="lessonList" />
    </main>
  )
}
