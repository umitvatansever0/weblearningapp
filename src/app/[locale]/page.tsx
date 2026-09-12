import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('nav')
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">{t('home')}</h1>
    </main>
  )
}
