import type {
  ExerciseType,
  MultipleChoiceCorrectAnswer,
  MultipleChoiceUserAnswer,
  FillInBlankCorrectAnswer,
  FillInBlankUserAnswer,
  MatchingCorrectAnswer,
  MatchingUserAnswer,
  SentenceOrderCorrectAnswer,
  SentenceOrderUserAnswer,
  ShortAnswerCorrectAnswer,
  ShortAnswerUserAnswer,
} from '@/types/exercise'

export function normalizeGermanText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

export function checkAnswer(type: ExerciseType, correctAnswer: unknown, userAnswer: unknown): boolean {
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const correct = correctAnswer as MultipleChoiceCorrectAnswer
      const user = userAnswer as MultipleChoiceUserAnswer
      return correct.correctIndex === user.selectedIndex
    }
    case 'FILL_IN_BLANK': {
      const correct = correctAnswer as FillInBlankCorrectAnswer
      const user = userAnswer as FillInBlankUserAnswer
      const normalizedUser = normalizeGermanText(user.text)
      return correct.accepted.some((accepted) => normalizeGermanText(accepted) === normalizedUser)
    }
    case 'MATCHING': {
      const correct = correctAnswer as MatchingCorrectAnswer
      const user = userAnswer as MatchingUserAnswer
      if (correct.pairs.length !== user.pairs.length) return false
      return correct.pairs.every((pair) =>
        user.pairs.some((candidate) => candidate.left === pair.left && candidate.right === pair.right)
      )
    }
    case 'SENTENCE_ORDER': {
      const correct = correctAnswer as SentenceOrderCorrectAnswer
      const user = userAnswer as SentenceOrderUserAnswer
      return (
        correct.order.length === user.order.length &&
        correct.order.every((word, index) => word === user.order[index])
      )
    }
    case 'SHORT_ANSWER': {
      const correct = correctAnswer as ShortAnswerCorrectAnswer
      const user = userAnswer as ShortAnswerUserAnswer
      const normalizedUser = normalizeGermanText(user.text)
      return correct.accepted.some((accepted) => normalizeGermanText(accepted) === normalizedUser)
    }
    default:
      return false
  }
}
