import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { Link } from '@/i18n/navigation'
import { NOINDEX_METADATA } from '@/lib/seo'
import { findExercise, isCourseLevel } from '@/course/registry'
import { buildReviewSession } from '@/course/review'
import { ReviewSession } from '@/components/course/ReviewSession'

type Params = Promise<{ locale: string; level: string }>

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('course')
  return { ...NOINDEX_METADATA, title: t('reviewTitle') }
}

export default async function CourseReviewPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Promise<{ scope?: string }>
}) {
  const { locale, level } = await params
  if (!isCourseLevel(level)) notFound()
  const { scope } = await searchParams
  const t = await getTranslations('course')
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-4">
        <h1 className="text-3xl font-bold">{t('reviewTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('trackBody')}</p>
        <Link href="/login" className="self-start rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-5 py-2 font-medium">
          {t('login')}
        </Link>
      </main>
    )
  }

  const items = await buildReviewSession(session.user.id, level, scope === 'all' ? 'all' : 'due')
  const exercises = items.flatMap((item) => {
    const resolved = findExercise(item.exerciseKey)
    return resolved ? [{ ...item, exercise: resolved.exercise }] : []
  })
  const tab = (active: boolean) =>
    `rounded-full px-3 py-1 border ${
      active ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900' : 'border-gray-300 dark:border-neutral-600'
    }`

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-6">
      <Link href={`/course/${level}`} className="text-sm text-gray-500 hover:underline underline-offset-4">
        ← {t('courseName', { level })}
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t('reviewTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('reviewIntro')}</p>
        <nav className="flex gap-2 text-sm">
          <Link href={`/course/${level}/review`} className={tab(scope !== 'all')}>
            {t('scopeDue')}
          </Link>
          <Link href={`/course/${level}/review?scope=all`} className={tab(scope === 'all')}>
            {t('scopeAll')}
          </Link>
        </nav>
      </header>
      <ReviewSession key={scope ?? 'due'} level={level} locale={locale} items={exercises} />
    </main>
  )
}
