import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const

/**
 * Locale-aware 404 page. Rendered inside the [locale] layout (which provides
 * the next-intl context) whenever a page calls notFound(); Next.js serves it
 * with a real HTTP 404 status. Includes links back into the main content so
 * both users and crawlers can recover.
 */
export default function NotFound() {
  const t = useTranslations('notFound')

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6 text-center">
      <h1 className="text-3xl font-bold">404 — {t('title')}</h1>
      <p className="text-gray-600">{t('description')}</p>
      <div>
        <Link href="/" className="underline font-medium">
          {t('home')}
        </Link>
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('levelsHeading')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {LEVELS.map((level) => (
            <Link
              key={level}
              href={`/learn/${level}`}
              className="border rounded p-3 hover:border-gray-900 transition-colors"
            >
              German {level}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
