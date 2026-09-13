import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MultipleChoiceExercise } from '@/components/exercises/MultipleChoiceExercise'
import { FillInBlankExercise } from '@/components/exercises/FillInBlankExercise'
import { MatchingExercise } from '@/components/exercises/MatchingExercise'
import { SentenceOrderExercise } from '@/components/exercises/SentenceOrderExercise'
import { ShortAnswerExercise } from '@/components/exercises/ShortAnswerExercise'

describe('MultipleChoiceExercise', () => {
  it('calls onAnswer with the selected index', () => {
    const onAnswer = vi.fn()
    render(
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
    render(<FillInBlankExercise data={{ sentence: '___ Tag!' }} submitLabel="Check" onAnswer={onAnswer} />)
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
        data={{ pairs: [{ left: 'ich', right: 'bin' }, { left: 'du', right: 'bist' }] }}
        submitLabel="Check"
        onAnswer={onAnswer}
      />
    )
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'bin' } })
    fireEvent.change(selects[1], { target: { value: 'bist' } })
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({
      pairs: [
        { left: 'ich', right: 'bin' },
        { left: 'du', right: 'bist' },
      ],
    })
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
})

describe('ShortAnswerExercise', () => {
  it('calls onAnswer with the typed text', () => {
    const onAnswer = vi.fn()
    render(<ShortAnswerExercise data={{ prompt: 'Question?' }} submitLabel="Check" onAnswer={onAnswer} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ich heiße Anna' } })
    fireEvent.click(screen.getByText('Check'))
    expect(onAnswer).toHaveBeenCalledWith({ text: 'Ich heiße Anna' })
  })
})
