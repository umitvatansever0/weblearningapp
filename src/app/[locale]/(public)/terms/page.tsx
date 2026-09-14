import { useTranslations } from 'next-intl'

export default function TermsPage() {
  const t = useTranslations('legal')
  const paragraphs = t.raw('termsParagraphs') as string[]

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('termsTitle')}</h1>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-sm text-gray-700">
          {paragraph}
        </p>
      ))}
    </main>
  )
}
