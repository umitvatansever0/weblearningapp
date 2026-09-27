import { useTranslations } from 'next-intl'

type PrivacySection = { heading: string; paragraphs: string[] }

export default function PrivacyPage() {
  const t = useTranslations('legal')
  const intro = t('privacyIntro')
  const sections = t.raw('privacySections') as PrivacySection[]

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('privacyTitle')}</h1>
      <p className="text-sm text-gray-700">{intro}</p>
      {sections.map((section, index) => (
        <section key={index} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          {section.paragraphs.map((paragraph, pIndex) => (
            <p key={pIndex} className="text-sm text-gray-700">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </main>
  )
}
