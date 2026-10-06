import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { Link } from '@/i18n/navigation'
import { buildPublicMetadata } from '@/lib/seo'
import { PLACEMENT_QUESTION_COUNT, publicPlacementQuestions } from '@/lib/placementTest'
import { PlacementTest } from '@/components/placement/PlacementTest'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('placement')
  return buildPublicMetadata({
    locale,
    path: '/placement-test',
    title: t('title'),
    description: t('metaDescription'),
  })
}

export default async function PlacementTestPage() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('placement')

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-gray-600">{t('intro', { count: PLACEMENT_QUESTION_COUNT })}</p>
      <ul className="list-disc pl-5 text-sm text-gray-600 flex flex-col gap-1">
        <li>{t('ruleLevels')}</li>
        <li>{t('ruleSkip')}</li>
        <li>{t('ruleTime')}</li>
      </ul>

      {session?.user?.id ? (
        <PlacementTest questions={publicPlacementQuestions()} email={session.user.email ?? ''} />
      ) : (
        <div className="border rounded p-4 flex flex-col gap-3">
          <p>{t('loginRequired')}</p>
          <div className="flex gap-3">
            <Link href="/login" className="bg-gray-900 text-white rounded px-4 py-2 text-sm">
              {t('login')}
            </Link>
            <Link href="/register" className="border rounded px-4 py-2 text-sm">
              {t('register')}
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
