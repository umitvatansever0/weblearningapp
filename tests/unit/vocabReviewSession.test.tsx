import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { VocabReviewSession } from '@/components/vocab/VocabReviewSession'
import en from '../../messages/en.json'

function renderSession(cards: { id: string; word: string; translation: string; exampleSentence: string }[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <VocabReviewSession cards={cards} />
    </NextIntlClientProvider>
  )
}

const cards = [
  { id: 'card-1', word: 'Hallo', translation: 'hello', exampleSentence: 'Hallo, ich bin Anna.' },
  { id: 'card-2', word: 'Danke', translation: 'thank you', exampleSentence: 'Danke schön!' },
]

describe('VocabReviewSession', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('shows the German word first, hides the translation until revealed', () => {
    renderSession(cards)
    expect(screen.getByText('Hallo')).toBeInTheDocument()
    expect(screen.queryByText('hello')).not.toBeInTheDocument()
  })

  it('reveals the translation and grading buttons after "Show answer"', () => {
    renderSession(cards)
    fireEvent.click(screen.getByText(en.vocab.showAnswer))
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText(en.vocab.good)).toBeInTheDocument()
  })

  it('submits the grade and advances to the next card', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ interval: 1, dueDate: new Date().toISOString() }),
    })

    renderSession(cards)
    fireEvent.click(screen.getByText(en.vocab.showAnswer))
    fireEvent.click(screen.getByText(en.vocab.good))

    await waitFor(() => {
      expect(screen.getByText('Danke')).toBeInTheDocument()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/vocab/card-1/review',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows an error and does not advance when the review submission fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    })

    renderSession(cards)
    fireEvent.click(screen.getByText(en.vocab.showAnswer))
    fireEvent.click(screen.getByText(en.vocab.good))

    await waitFor(() => {
      expect(screen.getByText(en.vocab.submitError)).toBeInTheDocument()
    })
    expect(screen.getByText('Hallo')).toBeInTheDocument()
    expect(screen.queryByText('Danke')).not.toBeInTheDocument()
  })

  it('shows the completion message after grading the last card', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ interval: 1, dueDate: new Date().toISOString() }),
    })

    renderSession([cards[0]])
    fireEvent.click(screen.getByText(en.vocab.showAnswer))
    fireEvent.click(screen.getByText(en.vocab.good))

    await waitFor(() => {
      expect(screen.getByText(en.vocab.reviewComplete)).toBeInTheDocument()
    })
  })
})
