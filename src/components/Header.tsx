import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header() {
  const t = useTranslations('nav')

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Link href="/" className="font-bold text-lg">
        DeutschLernen
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/login">{t('login')}</Link>
        <Link href="/register">{t('register')}</Link>
        <LanguageSwitcher />
      </nav>
    </header>
  )
}
