'use client'

import { useTranslations } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header() {
  const t = useTranslations('nav')
  const { data: session, status } = useSession()

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Link href="/" className="font-bold text-lg">
        DeutschLernen
      </Link>
      <nav className="flex items-center gap-4">
        {status === 'authenticated' ? (
          <>
            {session.user?.role === 'ADMIN' && <Link href="/admin">{t('admin')}</Link>}
            <span className="text-sm">{session.user?.name ?? session.user?.email}</span>
            <button type="button" onClick={() => signOut()} className="text-sm underline">
              {t('logout')}
            </button>
          </>
        ) : (
          <>
            <Link href="/login">{t('login')}</Link>
            <Link href="/register">{t('register')}</Link>
          </>
        )}
        <LanguageSwitcher />
      </nav>
    </header>
  )
}
