import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/navigation'
import { ExerciseManager } from '@/components/admin/ExerciseManager'
import { VocabManager } from '@/components/admin/VocabManager'

export default async function AdminLessonPage({
  params,
}: {
  params: Promise<{ locale: string; lessonId: string }>
}) {
  const { locale, lessonId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }
  if (!isAdmin(session)) {
    redirect(`/${locale}/dashboard`)
  }

  const t = await getTranslations('admin')
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      exercises: { orderBy: { order: 'asc' } },
      vocabWords: { orderBy: { word: 'asc' } },
    },
  })

  if (!lesson) {
    notFound()
  }

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-10">
      <Link href="/admin/content" className="underline text-sm">
        {t('contentTitle')}
      </Link>
      <h1 className="text-2xl font-bold">{lesson.grammarTopic}</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t('exercisesTitle')}</h2>
        <ExerciseManager lessonId={lesson.id} initialExercises={lesson.exercises} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t('vocabTitle')}</h2>
        <VocabManager lessonId={lesson.id} initialWords={lesson.vocabWords} />
      </section>
    </main>
  )
}
