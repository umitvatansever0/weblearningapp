import { describe, it, expect } from 'vitest'
import { slugify, uniqueSlug } from '@/lib/slug'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('German Personal Pronouns')).toBe('german-personal-pronouns')
    expect(slugify('The Present Tense')).toBe('the-present-tense')
    expect(slugify('Modal Verbs')).toBe('modal-verbs')
  })

  it('strips punctuation and collapses separators', () => {
    expect(slugify('Der, die oder das?')).toBe('der-die-oder-das')
    expect(slugify('  Spaced   out!!  ')).toBe('spaced-out')
    expect(slugify('A/B — C')).toBe('a-b-c')
  })

  it('transliterates German characters instead of dropping them', () => {
    expect(slugify('Begrüßungsformen')).toBe('begruessungsformen')
    expect(slugify('Präsens')).toBe('praesens')
    expect(slugify('Fußball über Köln')).toBe('fussball-ueber-koeln')
  })

  it('folds other accented Latin letters to ASCII', () => {
    expect(slugify('café résumé')).toBe('cafe-resume')
  })

  it('returns an empty string when nothing slug-worthy remains', () => {
    expect(slugify('!!!')).toBe('')
    expect(slugify('')).toBe('')
  })
})

describe('uniqueSlug', () => {
  it('returns the base slug when free and records it as taken', () => {
    const taken = new Set<string>()
    expect(uniqueSlug('Greetings', taken)).toBe('greetings')
    expect(taken.has('greetings')).toBe(true)
  })

  it('appends an incrementing suffix on collision', () => {
    const taken = new Set<string>()
    expect(uniqueSlug('Perfekt', taken)).toBe('perfekt')
    expect(uniqueSlug('Perfekt', taken)).toBe('perfekt-2')
    expect(uniqueSlug('Perfekt', taken)).toBe('perfekt-3')
  })

  it('uses the fallback for titles that produce an empty slug', () => {
    const taken = new Set<string>()
    expect(uniqueSlug('???', taken, 'lesson')).toBe('lesson')
    expect(uniqueSlug('', taken, 'lesson')).toBe('lesson-2')
  })

  it('respects slugs pre-seeded into the taken set (no overwrite)', () => {
    const taken = new Set<string>(['greetings'])
    expect(uniqueSlug('Greetings', taken)).toBe('greetings-2')
  })
})
