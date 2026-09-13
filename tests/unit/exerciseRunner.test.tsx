import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { ExerciseRunner } from '@/components/exercises/ExerciseRunner'
import en from '../../messages/en.json'
import type { SanitizedExercise } from '@/types/exercise'

const pushMock = vi.fn()

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function renderRunner(exercises: SanitizedExercise[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ExerciseRunner exercises={exercises} lessonId="lesson-1" />
    </NextIntlClientProvider>
  )
}

const exercises: SanitizedExercise[] = [
  {
    id: 'ex-1',
    lessonId: 'lesson-1',
    order: 1,
    type: 'MULTIPLE_CHOICE',
    data: { prompt: 'Question one?', options: ['A', 'B'] },
    explanation: 'Because B.',
  },
  {
    id: 'ex-2',
    lessonId: 'lesson-1',
    order: 2,
    type: 'SHORT_ANSWER',
    data: { prompt: 'Question two?' },
    explanation: 'Because text.',
  },
]

describe('ExerciseRunner', () => {
  beforeEach(() => {
    pushMock.mockReset()
    global.fetch = vi.fn()
  })

  it('renders the first exercise using its matching sub-component', () => {
    renderRunner(exercises)
    expect(screen.getByText('Question one?')).toBeInTheDocument()
  })

  it('shows feedback after answering and advances on next', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ correct: true, correctAnswer: { correctIndex: 1 }, explanation: 'Because B.' }),
    })

    renderRunner(exercises)
    fireEvent.click(screen.getByText('B'))
    fireEvent.click(screen.getByText(en.learn.checkAnswer))

    await waitFor(() => {
      expect(screen.getByText(en.learn.correct)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(en.learn.nextExercise))

    expect(screen.getByText('Question two?')).toBeInTheDocument()
  })

  it('shows the lesson-complete screen with the final score after the last exercise', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: async () => ({ correct: true, correctAnswer: { correctIndex: 1 }, explanation: 'Because B.' }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ correct: false, correctAnswer: { accepted: ['x'] }, explanation: 'Because text.' }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ completed: true, score: 1 }),
      })

    renderRunner(exercises)
    fireEvent.click(screen.getByText('B'))
    fireEvent.click(screen.getByText(en.learn.checkAnswer))
    await waitFor(() => screen.getByText(en.learn.correct))
    fireEvent.click(screen.getByText(en.learn.nextExercise))

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'anything' } })
    fireEvent.click(screen.getByText(en.learn.checkAnswer))
    await waitFor(() => screen.getByText(en.learn.incorrect))
    fireEvent.click(screen.getByText(en.learn.nextExercise))

    await waitFor(() => {
      expect(screen.getByText(en.learn.lessonComplete)).toBeInTheDocument()
    })
    expect(screen.getByText(`${en.learn.score}: 1 / 2`)).toBeInTheDocument()
  })

  it('does not re-show the last exercise while the completion request is pending', async () => {
    let resolveComplete: (value: unknown) => void = () => {}
    const completePromise = new Promise((resolve) => {
      resolveComplete = resolve
    })

    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ correct: true, correctAnswer: { correctIndex: 1 }, explanation: 'Because B.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ correct: false, correctAnswer: { accepted: ['x'] }, explanation: 'Because text.' }),
      })
      .mockImplementationOnce(() => completePromise)

    renderRunner(exercises)
    fireEvent.click(screen.getByText('B'))
    fireEvent.click(screen.getByText(en.learn.checkAnswer))
    await waitFor(() => screen.getByText(en.learn.correct))
    fireEvent.click(screen.getByText(en.learn.nextExercise))

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'anything' } })
    fireEvent.click(screen.getByText(en.learn.checkAnswer))
    await waitFor(() => screen.getByText(en.learn.incorrect))
    fireEvent.click(screen.getByText(en.learn.nextExercise))

    // While the /complete fetch is still pending, the answered exercise's
    // input form must not reappear.
    await waitFor(() => {
      expect(screen.queryByText(en.learn.incorrect)).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Question two?')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByText(en.learn.checkAnswer)).not.toBeInTheDocument()
    expect(screen.queryByText(en.learn.lessonComplete)).not.toBeInTheDocument()

    resolveComplete({ ok: true, json: async () => ({ completed: true, score: 1 }) })

    await waitFor(() => {
      expect(screen.getByText(en.learn.lessonComplete)).toBeInTheDocument()
    })
  })

  it('shows an error message instead of a false result when the submit request fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    })

    renderRunner(exercises)
    fireEvent.click(screen.getByText('B'))
    fireEvent.click(screen.getByText(en.learn.checkAnswer))

    await waitFor(() => {
      expect(screen.getByText(en.learn.submitError)).toBeInTheDocument()
    })
    expect(screen.queryByText(en.learn.incorrect)).not.toBeInTheDocument()
    expect(screen.queryByText(en.learn.correct)).not.toBeInTheDocument()
  })
})
