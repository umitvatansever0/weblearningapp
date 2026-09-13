import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { getLevels } from '@/lib/learn'
import { Link } from '@/i18n/navigation'

export default async function LevelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('learn')
  const levels = await getLevels()

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t('levelsTitle')}</h1>
      <ul className="flex flex-col gap-2">
        {levels.map((level) => (
          <li key={level.code}>
            <Link href={`/learn/${level.code}`} className="underline">
              {level.code} ({level.unitCount})
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
