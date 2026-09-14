export type VocabGrade = 'again' | 'hard' | 'good' | 'easy'

interface CardState {
  easeFactor: number
  interval: number
  repetitions: number
}

interface CardUpdate {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: Date
}

const MIN_EASE_FACTOR = 1.3
const DAY_MS = 24 * 60 * 60 * 1000

function clampEase(value: number): number {
  return Math.max(MIN_EASE_FACTOR, value)
}

export function applySM2Grade(card: CardState, grade: VocabGrade): CardUpdate {
  let repetitions: number
  let interval: number
  let easeFactor: number

  switch (grade) {
    case 'again': {
      repetitions = 0
      interval = 1
      easeFactor = clampEase(card.easeFactor - 0.2)
      break
    }
    case 'hard': {
      repetitions = card.repetitions + 1
      interval = repetitions === 1 ? 1 : Math.ceil(card.interval * 1.2)
      easeFactor = clampEase(card.easeFactor - 0.15)
      break
    }
    case 'good': {
      repetitions = card.repetitions + 1
      interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.ceil(card.interval * card.easeFactor)
      easeFactor = card.easeFactor
      break
    }
    case 'easy': {
      repetitions = card.repetitions + 1
      interval =
        repetitions === 1 ? 4 : repetitions === 2 ? 10 : Math.ceil(card.interval * card.easeFactor * 1.3)
      easeFactor = card.easeFactor + 0.15
      break
    }
  }

  return {
    repetitions,
    interval,
    easeFactor,
    dueDate: new Date(Date.now() + interval * DAY_MS),
  }
}
