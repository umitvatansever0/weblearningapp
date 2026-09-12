import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  return (
    <footer className="p-4 text-center text-sm text-gray-500 border-t">
      &copy; {new Date().getFullYear()} DeutschLernen — {t('rights')}
    </footer>
  )
}
