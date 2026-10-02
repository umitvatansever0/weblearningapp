import { describe, it, expect, vi, beforeEach } from 'vitest'

const levelFindUnique = vi.fn()
const unitFindFirst = vi.fn()
const lessonFindFirst = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    level: { findUnique: (a: unknown) => levelFindUnique(a) },
    unit: { findFirst: (a: unknown) => unitFindFirst(a) },
    lesson: { findFirst: (a: unknown) => lessonFindFirst(a) },
  },
}))

import { resolveLessonRef, lessonRedirectTarget } from '@/lib/learn'

describe('resolveLessonRef', () => {
  beforeEach(() => {
    levelFindUnique.mockReset()
    unitFindFirst.mockReset()
    lessonFindFirst.mockReset()
    levelFindUnique.mockResolvedValue({ id: 'LV1', code: 'A1' })
    unitFindFirst.mockResolvedValue({ id: 'U1', slug: 'greetings' })
    lessonFindFirst.mockResolvedValue({ id: 'L1', slug: 'der-die-das' })
  })

  it('resolves canonical slugs regardless of whether params were slugs or ids', async () => {
    const ref = await resolveLessonRef('A1', 'greetings', 'der-die-das')
    expect(ref).toEqual({
      lessonId: 'L1',
      levelCode: 'A1',
      unitSlug: 'greetings',
      lessonSlug: 'der-die-das',
    })
    // The OR lookup allows either slug or legacy id to match.
    expect(unitFindFirst).toHaveBeenCalledWith({
      where: { levelId: 'LV1', OR: [{ slug: 'greetings' }, { id: 'greetings' }] },
    })
  })

  it('falls back to the id when a slug is still null (pre-backfill row)', async () => {
    unitFindFirst.mockResolvedValue({ id: 'U1', slug: null })
    lessonFindFirst.mockResolvedValue({ id: 'L1', slug: null })
    const ref = await resolveLessonRef('A1', 'U1', 'L1')
    expect(ref?.unitSlug).toBe('U1')
    expect(ref?.lessonSlug).toBe('L1')
  })

  it('returns null for an unknown level, unit, or lesson (→ 404)', async () => {
    levelFindUnique.mockResolvedValue(null)
    expect(await resolveLessonRef('ZZ', 'x', 'y')).toBeNull()

    levelFindUnique.mockResolvedValue({ id: 'LV1', code: 'A1' })
    unitFindFirst.mockResolvedValue(null)
    expect(await resolveLessonRef('A1', 'x', 'y')).toBeNull()

    unitFindFirst.mockResolvedValue({ id: 'U1', slug: 'greetings' })
    lessonFindFirst.mockResolvedValue(null)
    expect(await resolveLessonRef('A1', 'greetings', 'nope')).toBeNull()
  })
})

describe('lessonRedirectTarget', () => {
  const ref = {
    lessonId: 'L1',
    levelCode: 'A1' as const,
    unitSlug: 'greetings',
    lessonSlug: 'der-die-das',
  }

  it('returns null when the URL is already canonical (new slug URL → 200)', () => {
    expect(lessonRedirectTarget('en', 'greetings', 'der-die-das', ref)).toBeNull()
  })

  it('301-targets the canonical slug URL for a legacy id URL', () => {
    expect(lessonRedirectTarget('en', 'U1', 'L1', ref)).toBe('/en/learn/A1/greetings/der-die-das')
    expect(lessonRedirectTarget('de', 'U1', 'L1', ref)).toBe('/de/learn/A1/greetings/der-die-das')
  })

  it('never chains: the redirect target is itself canonical', () => {
    const target = lessonRedirectTarget('en', 'oldunit', 'oldlesson', ref)!
    // Following the target must not produce another redirect.
    const second = lessonRedirectTarget('en', ref.unitSlug, ref.lessonSlug, ref)
    expect(target).toContain('/en/learn/A1/greetings/der-die-das')
    expect(second).toBeNull()
  })
})
