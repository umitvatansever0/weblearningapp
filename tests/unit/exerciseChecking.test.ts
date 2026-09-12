import { describe, it, expect } from 'vitest'
import { checkAnswer, normalizeGermanText } from '@/lib/exerciseChecking'

describe('normalizeGermanText', () => {
  it('lowercases and trims', () => {
    expect(normalizeGermanText('  Guten Tag  ')).toBe('guten tag')
  })

  it('treats umlauts and their ASCII spellings as equivalent', () => {
    expect(normalizeGermanText('fünf')).toBe(normalizeGermanText('fuenf'))
    expect(normalizeGermanText('schön')).toBe(normalizeGermanText('schoen'))
    expect(normalizeGermanText('groß')).toBe(normalizeGermanText('gross'))
  })
})

describe('checkAnswer', () => {
  it('grades MULTIPLE_CHOICE by matching index', () => {
    const correctAnswer = { correctIndex: 1 }
    expect(checkAnswer('MULTIPLE_CHOICE', correctAnswer, { selectedIndex: 1 })).toBe(true)
    expect(checkAnswer('MULTIPLE_CHOICE', correctAnswer, { selectedIndex: 0 })).toBe(false)
  })

  it('grades FILL_IN_BLANK with umlaut-tolerant matching', () => {
    const correctAnswer = { accepted: ['fünf'] }
    expect(checkAnswer('FILL_IN_BLANK', correctAnswer, { text: 'fünf' })).toBe(true)
    expect(checkAnswer('FILL_IN_BLANK', correctAnswer, { text: 'fuenf' })).toBe(true)
    expect(checkAnswer('FILL_IN_BLANK', correctAnswer, { text: 'Fünf' })).toBe(true)
    expect(checkAnswer('FILL_IN_BLANK', correctAnswer, { text: 'sechs' })).toBe(false)
  })

  it('grades MATCHING by comparing pair sets regardless of order', () => {
    const correctAnswer = {
      pairs: [
        { left: 'ich', right: 'bin' },
        { left: 'du', right: 'bist' },
      ],
    }
    expect(
      checkAnswer('MATCHING', correctAnswer, {
        pairs: [
          { left: 'du', right: 'bist' },
          { left: 'ich', right: 'bin' },
        ],
      })
    ).toBe(true)
    expect(
      checkAnswer('MATCHING', correctAnswer, {
        pairs: [
          { left: 'ich', right: 'bist' },
          { left: 'du', right: 'bin' },
        ],
      })
    ).toBe(false)
  })

  it('grades SENTENCE_ORDER by exact sequence', () => {
    const correctAnswer = { order: ['eins', 'zwei', 'drei'] }
    expect(checkAnswer('SENTENCE_ORDER', correctAnswer, { order: ['eins', 'zwei', 'drei'] })).toBe(true)
    expect(checkAnswer('SENTENCE_ORDER', correctAnswer, { order: ['zwei', 'eins', 'drei'] })).toBe(false)
  })

  it('grades SHORT_ANSWER with umlaut-tolerant matching against any accepted variant', () => {
    const correctAnswer = { accepted: ['ich heiße anna', 'ich heisse anna'] }
    expect(checkAnswer('SHORT_ANSWER', correctAnswer, { text: 'Ich heiße Anna' })).toBe(true)
    expect(checkAnswer('SHORT_ANSWER', correctAnswer, { text: 'ich heisse anna' })).toBe(true)
    expect(checkAnswer('SHORT_ANSWER', correctAnswer, { text: 'ich bin anna' })).toBe(false)
  })
})
