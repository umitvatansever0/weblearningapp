import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/navigation'
import { LessonManager } from '@/components/admin/LessonManager'

export default async function AdminUnitPage({
  params,
}: {
  params: Promise<{ locale: string; unitId: string }>
}) {
  const { locale, unitId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }
  if (!isAdmin(session)) {
    redirect(`/${locale}/dashboard`)
  }

  const t = await getTranslations('admin')
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: { exercises: { select: { id: true } }, vocabWords: { select: { id: true } } },
      },
    },
  })

  if (!unit) {
    notFound()
  }

  const initialLessons = unit.lessons.map((lesson) => ({
    id: lesson.id,
    order: lesson.order,
    grammarTopic: lesson.grammarTopic,
    explanationDe: lesson.explanationDe,
    explanationEn: lesson.explanationEn,
    explanationTr: lesson.explanationTr,
    exerciseCount: lesson.exercises.length,
    vocabWordCount: lesson.vocabWords.length,
  }))

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <Link href="/admin/content" className="underline text-sm">
        {t('contentTitle')}
      </Link>
      <h1 className="text-2xl font-bold">{t('lessonsTitle')}</h1>
      <LessonManager unitId={unit.id} initialLessons={initialLessons} />
    </main>
  )
}
