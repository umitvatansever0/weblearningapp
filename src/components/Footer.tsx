import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function Footer() {
  const t = useTranslations('footer')
  return (
    <footer className="p-4 text-center text-sm text-gray-500 border-t flex flex-col gap-1">
      <p>
        &copy; {new Date().getFullYear()} DeutschLernen — {t('rights')}
      </p>
      <nav className="flex gap-3 justify-center">
        <Link href="/privacy" className="underline">
          {t('privacy')}
        </Link>
        <Link href="/terms" className="underline">
          {t('terms')}
        </Link>
        <Link href="/contact" className="underline">
          {t('contact')}
        </Link>
      </nav>
    </footer>
  )
}
