'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'

// Rendered above the footer on every page. Hidden inside the blog itself and
// in the admin area, where it would be redundant or out of place.
export function AskQuestionCta() {
  const t = useTranslations('blog')
  const pathname = usePathname()
  if (pathname.startsWith('/blog') || pathname.startsWith('/admin')) return null

  return (
    <section className="border-t bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{t('ctaTitle')}</p>
          <p className="text-sm text-gray-600">{t('ctaText')}</p>
        </div>
        <Link
          href="/blog/new"
          className="bg-gray-900 text-white rounded px-4 py-2 text-sm text-center whitespace-nowrap"
        >
          {t('ctaButton')}
        </Link>
      </div>
    </section>
  )
}
