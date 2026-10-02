import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  getLessonWithExercises,
  getLessonContext,
  resolveLessonRef,
  lessonRedirectTarget,
  pickByLocale,
} from '@/lib/learn'
import { ExerciseRunner } from '@/components/exercises/ExerciseRunner'
import { Markdown } from '@/components/Markdown'
import { Link } from '@/i18n/navigation'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { JsonLd } from '@/components/JsonLd'
import {
  SITE_NAME,
  buildPublicMetadata,
  breadcrumbJsonLd,
  metaDescriptionFromMarkdown,
  getSiteUrl,
  localizedUrl,
} from '@/lib/seo'

function lessonTitle(grammarTopic: string, level: string): string {
  return `${grammarTopic} – ${level} German Grammar`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; level: string; unit: string; lesson: string }>
}): Promise<Metadata> {
  const { locale, level, unit, lesson } = await params
  const ref = await resolveLessonRef(level, unit, lesson)
  if (!ref) return {}

  const ctx = await getLessonContext(ref.lessonId)
  if (!ctx) return {}

  const explanation = pickByLocale(locale, {
    de: ctx.explanationDe,
    en: ctx.explanationEn,
    tr: ctx.explanationTr,
  })

  // Canonical is always the slug URL, even when reached via a legacy id URL.
  return buildPublicMetadata({
    locale,
    path: `/learn/${ref.levelCode}/${ref.unitSlug}/${ref.lessonSlug}`,
    title: lessonTitle(ctx.grammarTopic, ctx.levelCode),
    description: metaDescriptionFromMarkdown(explanation),
    type: 'article',
  })
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; unit: string; lesson: string }>
}) {
  // Content is public — no login required to read the explanation or do the
  // exercises. Progress is only saved when a logged-in user completes a lesson.
  const { locale, level, unit, lesson } = await params

  const ref = await resolveLessonRef(level, unit, lesson)
  if (!ref) {
    notFound()
  }

  // Backward compatibility: if the request used a legacy id (or any non-canonical
  // segment), permanently redirect to the canonical slug URL.
  const redirectTarget = lessonRedirectTarget(locale, unit, lesson, ref)
  if (redirectTarget) {
    permanentRedirect(redirectTarget)
  }

  const [lessonData, ctx] = await Promise.all([
    getLessonWithExercises(ref.lessonId),
    getLessonContext(ref.lessonId),
  ])
  if (!lessonData || !ctx) {
    notFound()
  }

  const t = await getTranslations('learn')
  const tNav = await getTranslations('nav')

  const explanation = pickByLocale(locale, {
    de: lessonData.explanationDe,
    en: lessonData.explanationEn,
    tr: lessonData.explanationTr,
  })
  const unitTitle = pickByLocale(locale, {
    de: ctx.unitTitleDe,
    en: ctx.unitTitleEn,
    tr: ctx.unitTitleTr,
  })

  const lessonPath = `/learn/${ctx.levelCode}/${ctx.unitSlug}/${ctx.lessonSlug}`
  const breadcrumbs = [
    { name: tNav('home'), path: '/' },
    { name: t('levelsTitle'), path: '/learn' },
    { name: `German ${ctx.levelCode}`, path: `/learn/${ctx.levelCode}` },
    { name: lessonData.grammarTopic, path: lessonPath },
  ]

  const learningResource = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lessonTitle(lessonData.grammarTopic, ctx.levelCode),
    description: metaDescriptionFromMarkdown(explanation),
    url: localizedUrl(locale, lessonPath),
    inLanguage: 'de',
    educationalLevel: ctx.levelCode,
    learningResourceType: 'Lesson',
    isAccessibleForFree: true,
    provider: { '@type': 'Organization', name: SITE_NAME, url: getSiteUrl() },
  }

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <JsonLd data={[breadcrumbJsonLd(locale, breadcrumbs), learningResource]} />
      <Breadcrumbs items={breadcrumbs} />

      <article className="flex flex-col gap-4">
        <header>
          <p className="text-sm text-gray-500">
            <Link href={`/learn/${ctx.levelCode}`} className="underline">
              German {ctx.levelCode}
            </Link>{' '}
            · {unitTitle}
          </p>
          <h1 className="text-2xl font-bold mt-1">
            {lessonTitle(lessonData.grammarTopic, ctx.levelCode)}
          </h1>
        </header>
        <Markdown>{explanation}</Markdown>
      </article>

      <ExerciseRunner exercises={lessonData.exercises} lessonId={lessonData.id} />

      <nav aria-label="Lesson navigation" className="flex justify-between gap-4 border-t pt-4 text-sm">
        {ctx.prev ? (
          <Link
            href={`/learn/${ctx.prev.levelCode}/${ctx.prev.unitSlug}/${ctx.prev.lessonSlug}`}
            className="underline"
            rel="prev"
          >
            ← {ctx.prev.grammarTopic}
          </Link>
        ) : (
          <span />
        )}
        {ctx.next ? (
          <Link
            href={`/learn/${ctx.next.levelCode}/${ctx.next.unitSlug}/${ctx.next.lessonSlug}`}
            className="underline text-right"
            rel="next"
          >
            {ctx.next.grammarTopic} →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <p className="text-sm">
        <Link href={`/learn/${ctx.levelCode}`} className="underline">
          {t('backToLevels')}
        </Link>
      </p>
    </main>
  )
}
