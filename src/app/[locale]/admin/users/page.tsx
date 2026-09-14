import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/navigation'
import { UserRoleManager } from '@/components/admin/UserRoleManager'

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }
  if (!isAdmin(session)) {
    redirect(`/${locale}/dashboard`)
  }

  const t = await getTranslations('admin')
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true, role: true, xp: true, streak: true },
  })

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <Link href="/admin" className="underline text-sm">
        {t('backToAdmin')}
      </Link>
      <h1 className="text-2xl font-bold">{t('usersTitle')}</h1>
      <UserRoleManager initialUsers={users} currentUserId={session.user.id} />
    </main>
  )
}
