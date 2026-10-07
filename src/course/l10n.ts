import type { L10n } from './types'

/** Shorthand for authoring course content: l(english, turkish, german). */
export function l(en: string, tr: string, de: string): L10n {
  return { en, tr, de }
}

/** Same text in every language (German examples, names, symbols). */
export function same(text: string): L10n {
  return { en: text, tr: text, de: text }
}
