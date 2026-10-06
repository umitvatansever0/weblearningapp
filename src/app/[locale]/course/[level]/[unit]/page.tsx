import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { Link } from '@/i18n/navigation'
import { buildPublicMetadata, NOINDEX_METADATA } from '@/lib/seo'
import { getOutline, getUnit, isCourseLevel } from '@/course/registry'
import { getLearnerSnapshot } from '@/course/progress'
import { pick } from '@/course/check'
import { LessonCanvas } from '@/components/course/LessonCanvas'

type Params = Promise<{ locale: string; level: string; unit: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, level, unit: slug } = await params
  const unit = getUnit(level, slug)
  if (!unit) {
    const outline = isCourseLevel(level) ? getOutline(level).find((u) => u.slug === slug) : undefined
    return outline ? { ...NOINDEX_METADATA, title: `${level} · ${outline.titleDe}` } : {}
  }
  return buildPublicMetadata({
    locale,
    path: `/course/${level}/${slug}`,
    title: `${unit.titleDe} – German ${level} Unit ${unit.number}`,
    description: pick(unit.goal, locale),
    type: 'article',
  })
}

export default async function CourseUnitPage({ params }: { params: Params }) {
  const { locale, level, unit: slug } = await params
  if (!isCourseLevel(level)) notFound()
  const outline = getOutline(level)
  const position = outline.findIndex((u) => u.slug === slug)
  if (position === -1) notFound()

  const unit = getUnit(level, slug)
  const t = await getTranslations('course')

  if (!unit) {
    const entry = outline[position]
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-5">
        <Link href={`/course/${level}`} className="text-sm text-gray-500 hover:underline underline-offset-4">
          ← {t('courseName', { level })}
        </Link>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
          {level} · {t('unit')} {String(entry.number).padStart(2, '0')}
        </p>
        <h1 className="text-3xl font-bold" lang="de">
          {entry.titleDe}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{pick(entry.title, locale)}</p>
        <ul className="flex flex-wrap gap-2" lang="de">
          {entry.focus.map((f) => (
            <li key={f} className="rounded-full border border-gray-200 dark:border-neutral-700 px-3 py-1 text-sm">
              {f}
            </li>
          ))}
        </ul>
        <p className="rounded-2xl bg-gray-50 dark:bg-neutral-900 p-5">{t('inPreparation')}</p>
        <Link href={`/learn/${level}`} className="self-start underline underline-offset-4">
          {t('grammarLessonsMeanwhile', { level })}
        </Link>
      </main>
    )
  }

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const snapshot = userId ? await getLearnerSnapshot(userId, level, slug) : null

  return (
    <LessonCanvas
      unit={unit}
      locale={locale}
      signedIn={Boolean(userId)}
      serverCompleted={snapshot?.completedSections ?? []}
      dueMistakes={snapshot?.dueMistakes ?? 0}
      next={outline[position + 1]}
    />
  )
}
