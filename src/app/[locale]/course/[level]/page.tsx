import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/navigation'
import { buildPublicMetadata } from '@/lib/seo'
import { getOutline, getUnit, getUnits, isCourseLevel, trackableSections } from '@/course/registry'
import { getLearnerSnapshot } from '@/course/progress'
import { pick } from '@/course/check'
import { SKILLS } from '@/course/types'
import { MasteryBar } from '@/components/course/MasteryBar'

type Params = Promise<{ locale: string; level: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, level } = await params
  if (!isCourseLevel(level)) return {}
  const t = await getTranslations('course')
  return buildPublicMetadata({
    locale,
    path: `/course/${level}`,
    title: t('overviewTitle', { level }),
    description: t('overviewDescription', { level }),
  })
}

const METHOD_STEPS = ['learn', 'understand', 'examples', 'practice', 'apply', 'review', 'master'] as const

export default async function CourseOverviewPage({ params }: { params: Params }) {
  const { locale, level } = await params
  if (!isCourseLevel(level)) notFound()
  const t = await getTranslations('course')
  const outline = getOutline(level)

  // Topic labels come from the units' own content.
  const topicLabels = new Map(getUnits(level).flatMap((unit) => unit.topics.map((topic) => [topic.key, pick(topic.label, locale)])))

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const [snapshot, sections] = userId
    ? await Promise.all([
        getLearnerSnapshot(userId, level),
        prisma.courseSectionProgress.findMany({ where: { userId, level }, select: { unitSlug: true, sectionKey: true } }),
      ])
    : [null, []]

  const unitProgress = (slug: string) => {
    const unit = getUnit(level, slug)
    if (!unit) return null
    const keys = trackableSections(unit)
    const done = sections.filter((s) => s.unitSlug === slug && keys.includes(s.sectionKey)).length
    return Math.round((done / keys.length) * 100)
  }

  const topics = snapshot ? Object.entries(snapshot.mastery).filter(([topic]) => !topic.startsWith('skill:')) : []
  const skills = snapshot ? SKILLS.map((skill) => [skill, snapshot.mastery[`skill:${skill}`] ?? null] as const) : []

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10">
      <header className="flex flex-col gap-3 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('courseName', { level })}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('overviewHeading', { level })}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">{t('overviewIntro')}</p>
        <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400" aria-label={t('method')}>
          {METHOD_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">→</span>}
              <span className="rounded-full bg-gray-100 dark:bg-neutral-800 px-3 py-1">{t(`methodStep.${step}`)}</span>
            </li>
          ))}
        </ol>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
        <section aria-labelledby="units-heading" className="flex flex-col gap-3">
          <h2 id="units-heading" className="text-sm font-bold uppercase tracking-wider text-gray-500">
            {t('unitsHeading', { count: outline.length })}
          </h2>
          <ol className="grid sm:grid-cols-2 gap-3">
            {outline.map((entry) => {
              const available = Boolean(getUnit(level, entry.slug))
              const progress = available && userId ? unitProgress(entry.slug) : null
              return (
                <li key={entry.slug}>
                  <Link
                    href={`/course/${level}/${entry.slug}`}
                    className={`h-full rounded-2xl border p-4 flex flex-col gap-2 transition ${
                      available
                        ? 'border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 hover:border-gray-900 dark:hover:border-gray-100 hover:shadow-sm'
                        : 'border-gray-200 dark:border-neutral-800 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {t('unit')} {String(entry.number).padStart(2, '0')}
                      </span>
                      {available ? (
                        <span className="text-xs rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5">
                          {progress !== null ? `${progress}%` : t('available')}
                        </span>
                      ) : (
                        <span className="text-xs rounded-full bg-gray-100 dark:bg-neutral-800 px-2 py-0.5">{t('comingSoon')}</span>
                      )}
                    </div>
                    <span className={`font-semibold ${available ? 'text-gray-900 dark:text-gray-100' : ''}`} lang="de">
                      {entry.titleDe}
                    </span>
                    <span className="text-sm">{pick(entry.title, locale)}</span>
                    <span className="text-xs text-gray-500" lang="de">
                      {entry.focus.join(' · ')}
                    </span>
                    {entry.scenario && <span className="text-xs">🎬 {pick(entry.scenario, locale)}</span>}
                    {progress !== null && (
                      <span className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden mt-1">
                        <span className="block h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-6 self-start w-full">
          {snapshot ? (
            <>
              <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 flex flex-col gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('myMistakes')}</h2>
                <p className="text-3xl font-bold tabular-nums">{snapshot.dueMistakes}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('dueSummary', { due: snapshot.dueMistakes, open: snapshot.openMistakes })}</p>
                <Link
                  href={`/course/${level}/review`}
                  className="self-start rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-5 py-2 text-sm font-medium"
                >
                  ↻ {t('startReview')}
                </Link>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 flex flex-col gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('topicMastery')}</h2>
                {topics.length === 0 ? (
                  <p className="text-sm text-gray-500">{t('noMasteryYet')}</p>
                ) : (
                  topics.map(([topic, value]) => <MasteryBar key={topic} label={topicLabels.get(topic) ?? topic} value={value} />)
                )}
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 flex flex-col gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('skills')}</h2>
                {skills.map(([skill, value]) => (
                  <MasteryBar key={skill} label={t(`skill.${skill}`)} value={value} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 flex flex-col gap-3">
              <p className="font-semibold">{t('trackTitle')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('trackBody')}</p>
              <div className="flex gap-2">
                <Link href="/login" className="rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-4 py-2 text-sm font-medium">
                  {t('login')}
                </Link>
                <Link href="/register" className="rounded-full border border-gray-300 dark:border-neutral-600 px-4 py-2 text-sm">
                  {t('register')}
                </Link>
              </div>
            </div>
          )}
          <Link href={`/learn/${level}`} className="text-sm underline underline-offset-4 text-gray-500">
            {t('grammarReference', { level })}
          </Link>
        </aside>
      </div>
    </main>
  )
}
