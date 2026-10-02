/**
 * SEO-friendly slug generation.
 *
 * Slugs are derived from human titles (unit: English title; lesson: the
 * German grammar topic) and are STABLE across locales so hreflang mapping
 * stays predictable:
 *   /en/learn/A1/greetings/begruessungsformen
 *   /de/learn/A1/greetings/begruessungsformen
 *   /tr/learn/A1/greetings/begruessungsformen
 *
 * Pure and dependency-free so it can run in the seed, the backfill script and
 * unit tests without a database.
 */

// German letters that should transliterate rather than be stripped, so
// "Begrüßungsformen" → "begruessungsformen" (not "begruungsformen").
const GERMAN_TRANSLITERATION: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
}

export function slugify(input: string): string {
  const lowered = (input ?? '').trim().toLowerCase()
  const transliterated = lowered.replace(/[äöüß]/g, (char) => GERMAN_TRANSLITERATION[char] ?? char)
  const asciiFolded = transliterated
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip remaining combining diacritics (é → e)
  return asciiFolded
    .replace(/[^a-z0-9]+/g, '-') // any run of non-alphanumerics → single hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}

/**
 * Return a slug that is unique within `taken`, appending -2, -3, … on
 * collision. Falls back to `fallback` when the title produces an empty slug.
 * The chosen slug is added to `taken` so repeated calls stay unique.
 */
export function uniqueSlug(input: string, taken: Set<string>, fallback = 'item'): string {
  const base = slugify(input) || fallback
  let candidate = base
  let suffix = 2
  while (taken.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  taken.add(candidate)
  return candidate
}
