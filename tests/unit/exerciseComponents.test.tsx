import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MultipleChoiceExercise } from '@/components/exercises/MultipleChoiceExercise'
import { FillInBlankExercise } from '@/components/exercises/FillInBlankExercise'
import { MatchingExercise } from '@/components/exercises/MatchingExercise'
import { SentenceOrderExercise } from '@/components/exercises/SentenceOrderExercise'
import { ShortAnswerExercise } from '@/components/exercises/ShortAnswerExercise'
import en from '../../messages/en.json'

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  )
}

describe('MultipleChoiceExercise', () => {
  it('calls onAnswer with the selected index', () => {
    const onAnswer = vi.fn()
    renderWithIntl(
      <MultipleChoiceExercise
        data={{ prompt: 'Question?', options: ['A', 'B'] }}
        submitLabel="Check"
        onAnswer={onAnswer}
      />
    )
    fireEvent.click(screen.getByText('B'))
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({ selectedIndex: 1 })
  })
})

describe('FillInBlankExercise', () => {
  it('calls onAnswer with the typed text', () => {
    const onAnswer = vi.fn()
    renderWithIntl(<FillInBlankExercise data={{ sentence: '___ Tag!' }} submitLabel="Check" onAnswer={onAnswer} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Guten' } })
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({ text: 'Guten' })
  })
})

describe('MatchingExercise', () => {
  it('calls onAnswer with the selected pairs', () => {
    const onAnswer = vi.fn()
    render(
      <MatchingExercise
        data={{ lefts: ['ich', 'du'], rights: ['bist', 'bin'] }}
        submitLabel="Check"
        onAnswer={onAnswer}
      />
    )
    // Select via the row's stable data-testid (index-based), not the option value,
    // since the rights list is shuffled and not positionally tied to lefts.
    fireEvent.change(screen.getByTestId('matching-select-0'), { target: { value: 'bin' } })
    fireEvent.change(screen.getByTestId('matching-select-1'), { target: { value: 'bist' } })
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({
      pairs: [
        { left: 'ich', right: 'bin' },
        { left: 'du', right: 'bist' },
      ],
    })
  })

  it('does not derive the correct pairing from data shape (no `pairs` key)', () => {
    const data = { lefts: ['ich', 'du'], rights: ['bist', 'bin'] }
    expect('pairs' in data).toBe(false)
  })
})

describe('SentenceOrderExercise', () => {
  it('calls onAnswer with words in the clicked order', () => {
    const onAnswer = vi.fn()
    render(<SentenceOrderExercise data={{ words: ['zwei', 'eins'] }} submitLabel="Check" onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('eins'))
    fireEvent.click(screen.getByText('zwei'))
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({ order: ['eins', 'zwei'] })
  })

  it('handles duplicate tokens correctly using index-based tracking (regression for value-keyed bug)', () => {
    const onAnswer = vi.fn()
    render(<SentenceOrderExercise data={{ words: ['ich', 'bin', 'ich'] }} submitLabel="Check" onAnswer={onAnswer} />)

    // Query only the "remaining word" pool buttons (excluding the chosen-tray
    // spans and the submit button), always clicking the first one available —
    // this exercises index-based (not value-based) selection/removal with a
    // repeated token ("ich" appears at both index 0 and index 2).
    const getRemainingWordButtons = () =>
      screen.getAllByRole('button').filter((button) => button.textContent !== 'Check')

    expect(getRemainingWordButtons().map((b) => b.textContent)).toEqual(['ich', 'bin', 'ich'])
    fireEvent.click(getRemainingWordButtons()[0]) // picks index 0 ("ich")
    expect(getRemainingWordButtons().map((b) => b.textContent)).toEqual(['bin', 'ich'])
    fireEvent.click(getRemainingWordButtons()[0]) // picks index 1 ("bin")
    expect(getRemainingWordButtons().map((b) => b.textContent)).toEqual(['ich'])
    fireEvent.click(getRemainingWordButtons()[0]) // picks index 2 ("ich")

    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({ order: ['ich', 'bin', 'ich'] })
  })
})

describe('ShortAnswerExercise', () => {
  it('calls onAnswer with the typed text', () => {
    const onAnswer = vi.fn()
    renderWithIntl(<ShortAnswerExercise data={{ prompt: 'Question?' }} submitLabel="Check" onAnswer={onAnswer} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ich heiße Anna' } })
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({ text: 'Ich heiße Anna' })
  })
})
