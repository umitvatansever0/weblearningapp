import { prisma } from '@/lib/prisma'
import { computeNextStreak, computeXpGain } from '@/lib/streak'

export async function checkAndAwardBadges(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  const candidates: string[] = []

  const lessonCount = await prisma.userProgress.count({ where: { userId, completed: true } })
  if (lessonCount >= 1) candidates.push('first_lesson')

  if (user.streak >= 3) candidates.push('streak_3')
  if (user.streak >= 7) candidates.push('streak_7')

  const vocabReviewCount = await prisma.userVocabCard.count({
    where: { userId, lastReviewedAt: { not: null } },
  })
  if (vocabReviewCount >= 1) candidates.push('first_vocab_review')

  if (user.xp >= 100) candidates.push('xp_100')

  const a1Level = await prisma.level.findUnique({ where: { code: 'A1' } })
  if (a1Level) {
    const a1LessonIds = await prisma.lesson.findMany({
      where: { unit: { levelId: a1Level.id } },
      select: { id: true },
    })
    if (a1LessonIds.length > 0) {
      const completedA1Count = await prisma.userProgress.count({
        where: { userId, completed: true, lessonId: { in: a1LessonIds.map((l) => l.id) } },
      })
      if (completedA1Count >= a1LessonIds.length) candidates.push('a1_complete')
    }
  }

  if (candidates.length === 0) return

  const badges = await prisma.badge.findMany({ where: { code: { in: candidates } } })

  for (const badge of badges) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      update: {},
      create: { userId, badgeId: badge.id },
    })
  }
}

export async function applyLessonCompletionRewards(
  userId: string,
  lessonId: string,
  correctCount: number
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const now = new Date()

  const { streak } = computeNextStreak(user.streak, user.lastActivityDate, now)

  // Only award XP the first time this lesson is completed — otherwise a
  // user could replay POST /api/lessons/[id]/complete indefinitely to
  // farm unbounded XP and badges (e.g. xp_100) from a single lesson.
  const existingProgress = await prisma.userProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  })
  const isFirstCompletion = !existingProgress?.completed
  const xpGain = isFirstCompletion ? computeXpGain(correctCount) : 0

  await prisma.user.update({
    where: { id: userId },
    data: { streak, lastActivityDate: now, xp: user.xp + xpGain },
  })

  // Record (or refresh) completion so badge criteria that count completed
  // lessons (e.g. `first_lesson`, `a1_complete`) can see this lesson.
  await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completed: true, lastAttemptAt: now },
    create: { userId, lessonId, completed: true, lastAttemptAt: now },
  })

  const vocabWords = await prisma.vocabWord.findMany({ where: { lessonId } })
  for (const word of vocabWords) {
    await prisma.userVocabCard.upsert({
      where: { userId_vocabWordId: { userId, vocabWordId: word.id } },
      update: {},
      create: { userId, vocabWordId: word.id },
    })
  }

  await checkAndAwardBadges(userId)
}
