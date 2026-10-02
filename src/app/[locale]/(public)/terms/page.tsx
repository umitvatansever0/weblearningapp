import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { buildPublicMetadata, metaDescriptionFromMarkdown } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('legal')
  const paragraphs = t.raw('termsParagraphs') as string[]
  return buildPublicMetadata({
    locale,
    path: '/terms',
    title: t('termsTitle'),
    description: metaDescriptionFromMarkdown(paragraphs[0] ?? ''),
  })
}

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
