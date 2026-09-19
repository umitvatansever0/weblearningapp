import { useTranslations } from 'next-intl'

export default function ContactPage() {
  const t = useTranslations('contact')
  const fields = t.raw('fields') as { label: string; value: string }[]

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-sm text-gray-700">{t('intro')}</p>
      <dl className="flex flex-col gap-2">
        {fields.map((field) => (
          <div key={field.label} className="flex gap-2 text-sm">
            <dt className="font-semibold min-w-24">{field.label}:</dt>
            <dd className="text-gray-700">{field.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-gray-700">{t('note')}</p>
    </main>
  )
}
