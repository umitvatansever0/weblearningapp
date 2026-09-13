function toUtcDayString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function computeNextStreak(
  currentStreak: number,
  lastActivityDate: Date | null,
  today: Date
): { streak: number; activityChanged: boolean } {
  const todayStr = toUtcDayString(today)

  if (!lastActivityDate) {
    return { streak: 1, activityChanged: true }
  }

  const lastStr = toUtcDayString(lastActivityDate)
  if (lastStr === todayStr) {
    return { streak: currentStreak, activityChanged: false }
  }

  const todayMs = Date.UTC(
    Number(todayStr.slice(0, 4)),
    Number(todayStr.slice(5, 7)) - 1,
    Number(todayStr.slice(8, 10))
  )
  const lastMs = Date.UTC(
    Number(lastStr.slice(0, 4)),
    Number(lastStr.slice(5, 7)) - 1,
    Number(lastStr.slice(8, 10))
  )
  const dayDiff = Math.round((todayMs - lastMs) / (24 * 60 * 60 * 1000))

  if (dayDiff === 1) {
    return { streak: currentStreak + 1, activityChanged: true }
  }

  return { streak: 1, activityChanged: true }
}

export function computeXpGain(correctCount: number): number {
  return correctCount * 10
}
