import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pickByLocale } from '@/lib/learn'
import { VocabReviewSession } from '@/components/vocab/VocabReviewSession'

export default async function VocabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('vocab')
  const dueCards = await prisma.userVocabCard.findMany({
    where: { userId: session.user.id, dueDate: { lte: new Date() } },
    include: { vocabWord: true },
    orderBy: { dueDate: 'asc' },
  })

  const cards = dueCards.map((card) => ({
    id: card.id,
    word: card.vocabWord.word,
    translation: pickByLocale(locale, {
      de: card.vocabWord.word,
      en: card.vocabWord.translationEn,
      tr: card.vocabWord.translationTr,
    }),
    exampleSentence: card.vocabWord.exampleSentence,
  }))

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {cards.length === 0 ? (
        <p className="text-gray-600">{t('noReviewsToday')}</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {cards.length} {t('reviewDue')}
          </p>
          <VocabReviewSession cards={cards} />
        </>
      )}
    </main>
  )
}
