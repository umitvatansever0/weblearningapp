import { notFound } from 'next/navigation'
import { getLessonWithExercises, pickByLocale } from '@/lib/learn'
import { ExerciseRunner } from '@/components/exercises/ExerciseRunner'
import { Markdown } from '@/components/Markdown'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; unit: string; lesson: string }>
}) {
  // Content is public — no login required to read the explanation or do the
  // exercises. Progress is only saved when a logged-in user completes a lesson.
  const { locale, lesson: lessonId } = await params

  const lesson = await getLessonWithExercises(lessonId)
  if (!lesson) {
    notFound()
  }

  const explanation = pickByLocale(locale, {
    de: lesson.explanationDe,
    en: lesson.explanationEn,
    tr: lesson.explanationTr,
  })

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{lesson.grammarTopic}</h1>
        <Markdown>{explanation}</Markdown>
      </div>
      <ExerciseRunner exercises={lesson.exercises} lessonId={lesson.id} />
    </main>
  )
}
