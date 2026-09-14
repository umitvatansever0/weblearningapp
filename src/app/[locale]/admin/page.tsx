import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/navigation'

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }
  if (!isAdmin(session)) {
    redirect(`/${locale}/dashboard`)
  }

  const t = await getTranslations('admin')
  const [userCount, lessonCount, completionCount] = await Promise.all([
    prisma.user.count(),
    prisma.lesson.count(),
    prisma.userProgress.count({ where: { completed: true } }),
  ])

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="flex gap-6">
        <div className="border rounded px-4 py-3">
          <p className="text-sm text-gray-600">{t('statsUsers')}</p>
          <p className="text-2xl font-bold">{userCount}</p>
        </div>
        <div className="border rounded px-4 py-3">
          <p className="text-sm text-gray-600">{t('statsLessons')}</p>
          <p className="text-2xl font-bold">{lessonCount}</p>
        </div>
        <div className="border rounded px-4 py-3">
          <p className="text-sm text-gray-600">{t('statsCompletions')}</p>
          <p className="text-2xl font-bold">{completionCount}</p>
        </div>
      </div>

      <nav className="flex gap-4">
        <Link href="/admin/users" className="underline">
          {t('navUsers')}
        </Link>
        <Link href="/admin/content" className="underline">
          {t('navContent')}
        </Link>
      </nav>
    </main>
  )
}
