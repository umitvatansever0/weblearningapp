import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AdSlot } from '@/components/AdSlot'

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const
const AVAILABLE_LEVELS: readonly string[] = ['A1', 'A2']

export default function HomePage() {
  const t = useTranslations('home')

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-10">
      <section className="flex flex-col gap-4 text-center">
        <h1 className="text-4xl font-bold">{t('heroTitle')}</h1>
        <p className="text-lg text-gray-600">{t('heroSubtitle')}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="bg-gray-900 text-white rounded px-5 py-2">
            {t('ctaRegister')}
          </Link>
          <Link href="/login" className="border rounded px-5 py-2">
            {t('ctaLogin')}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">{t('levelsTitle')}</h2>
        <div className="grid grid-cols-2 gap-4">
          {LEVELS.map((level) => {
            const available = AVAILABLE_LEVELS.includes(level)
            const cardContent = (
              <>
                <p className="font-bold">{level}</p>
                <p className="text-sm text-gray-600">
                  {available ? t('levelAvailable') : t('levelComingSoon')}
                </p>
              </>
            )
            return available ? (
              <Link
                key={level}
                href={`/learn/${level}`}
                className="border rounded p-4 flex flex-col gap-1 hover:border-gray-900 transition-colors"
              >
                {cardContent}
              </Link>
            ) : (
              <div key={level} className="border rounded p-4 flex flex-col gap-1 opacity-60">
                {cardContent}
              </div>
            )
          })}
        </div>
      </section>

      <AdSlot placement="home" />
    </main>
  )
}
