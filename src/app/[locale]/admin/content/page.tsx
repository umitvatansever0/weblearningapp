import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/navigation'
import { UnitManager } from '@/components/admin/UnitManager'

export default async function AdminContentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }
  if (!isAdmin(session)) {
    redirect(`/${locale}/dashboard`)
  }

  const t = await getTranslations('admin')
  const units = await prisma.unit.findMany({
    orderBy: [{ level: { order: 'asc' } }, { order: 'asc' }],
    include: { level: true, lessons: { select: { id: true } } },
  })

  const initialUnits = units.map((unit) => ({
    id: unit.id,
    levelCode: unit.level.code,
    order: unit.order,
    titleDe: unit.titleDe,
    titleEn: unit.titleEn,
    titleTr: unit.titleTr,
    lessonCount: unit.lessons.length,
  }))

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <Link href="/admin" className="underline text-sm">
        {t('backToAdmin')}
      </Link>
      <h1 className="text-2xl font-bold">{t('contentTitle')}</h1>
      <UnitManager initialUnits={initialUnits} />
    </main>
  )
}
