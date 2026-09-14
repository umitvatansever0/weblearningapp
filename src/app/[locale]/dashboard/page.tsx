import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pickByLocale } from '@/lib/learn'

const DAILY_GOAL_XP = 50

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('dashboard')
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } })
  const userBadges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  })

  const goalProgress = Math.min(100, Math.round((user.xp / DAILY_GOAL_XP) * 100))

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="flex gap-6">
        <div className="border rounded px-4 py-3">
          <p className="text-sm text-gray-600">{t('streak')}</p>
          <p className="text-2xl font-bold">{user.streak}</p>
        </div>
        <div className="border rounded px-4 py-3">
          <p className="text-sm text-gray-600">{t('xp')}</p>
          <p className="text-2xl font-bold">{user.xp}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-1">{t('dailyGoal')}</p>
        <div className="w-full bg-gray-200 rounded h-3">
          <div className="bg-gray-900 h-3 rounded" style={{ width: `${goalProgress}%` }} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">{t('badgesEarned')}</h2>
        {userBadges.length === 0 ? (
          <p className="text-sm text-gray-600">{t('noBadgesYet')}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {userBadges.map((entry) => (
              <li key={entry.id}>
                {pickByLocale(locale, {
                  de: entry.badge.titleDe,
                  en: entry.badge.titleEn,
                  tr: entry.badge.titleTr,
                })}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
