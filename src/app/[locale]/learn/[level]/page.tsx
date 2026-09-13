import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { getUnitsForLevel, pickByLocale } from '@/lib/learn'
import { Link } from '@/i18n/navigation'
import type { LevelCode } from '@prisma/client'

const VALID_LEVELS: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default async function LevelUnitsPage({
  params,
}: {
  params: Promise<{ locale: string; level: string }>
}) {
  const { locale, level } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  if (!VALID_LEVELS.includes(level as LevelCode)) {
    notFound()
  }

  const t = await getTranslations('learn')
  const units = await getUnitsForLevel(level as LevelCode, session.user.id)

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        {level} — {t('unitsTitle')}
      </h1>
      {units.map((unit) => (
        <div key={unit.id} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {pickByLocale(locale, { de: unit.titleDe, en: unit.titleEn, tr: unit.titleTr })}
          </h2>
          <ul className="flex flex-col gap-1">
            {unit.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link href={`/learn/${level}/${unit.id}/${lesson.id}`} className="underline">
                  {lesson.grammarTopic} {lesson.completed ? '✓' : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </main>
  )
}
