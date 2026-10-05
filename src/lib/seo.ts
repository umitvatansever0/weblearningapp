import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'

/**
 * Centralised technical-SEO helpers: canonical + hreflang construction,
 * Open Graph / Twitter defaults, structured-data (JSON-LD) builders and the
 * per-level copy used both for metadata and for the crawlable intro text that
 * renders in the initial HTML.
 *
 * Everything here is pure and DB-free so it can be unit-tested without a
 * database connection.
 */

export const SITE_NAME = 'DeutschStep'
export const DEFAULT_SITE_URL = 'https://www.deutschstep.com'

/** Preferred, canonical origin with any trailing slash stripped. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
  return raw.replace(/\/+$/, '')
}

/** Build an absolute URL on the canonical origin. */
export function absoluteUrl(path = ''): string {
  const base = getSiteUrl()
  if (!path || path === '/') return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** Normalise a locale-agnostic path (no leading locale segment). */
function normalizePath(pathWithoutLocale: string): string {
  if (!pathWithoutLocale || pathWithoutLocale === '/') return ''
  return pathWithoutLocale.startsWith('/') ? pathWithoutLocale : `/${pathWithoutLocale}`
}

/** Absolute URL for a given locale + locale-agnostic path. */
export function localizedUrl(locale: string, pathWithoutLocale = ''): string {
  return absoluteUrl(`/${locale}${normalizePath(pathWithoutLocale)}`)
}

/**
 * Canonical + hreflang alternates for a page. Every language version points at
 * the others, and x-default points at the default locale, exactly as Google
 * recommends for international sites.
 */
export function buildAlternates(locale: string, pathWithoutLocale = ''): NonNullable<Metadata['alternates']> {
  const normalized = normalizePath(pathWithoutLocale)
  const languages: Record<string, string> = {}
  for (const l of routing.locales) {
    languages[l] = absoluteUrl(`/${l}${normalized}`)
  }
  languages['x-default'] = absoluteUrl(`/${routing.defaultLocale}${normalized}`)
  return {
    canonical: absoluteUrl(`/${locale}${normalized}`),
    languages,
  }
}

export const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  de: 'de_DE',
  tr: 'tr_TR',
}

/**
 * Default social-share image. SVG keeps the repo binary-free; a 1200×630 PNG
 * is a recommended follow-up for maximum platform coverage.
 */
export const OG_IMAGE = {
  url: '/og.svg',
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — Learn German online`,
}

interface PublicPageMetadataInput {
  locale: string
  /** Locale-agnostic path, e.g. '/learn/A1'. '' for the homepage. */
  path?: string
  title: string
  description: string
  type?: 'website' | 'article'
}

/** Assemble a complete, indexable metadata object for a PUBLIC page. */
export function buildPublicMetadata({
  locale,
  path = '',
  title,
  description,
  type = 'website',
}: PublicPageMetadataInput): Metadata {
  const url = localizedUrl(locale, path)
  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: OG_LOCALE[locale] ?? OG_LOCALE.en,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  }
}

/** robots metadata that must be attached to every PRIVATE / authenticated page. */
export const NOINDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

// --------------------------------------------------------------------------
// Per-level SEO copy (titles, descriptions, H1 and crawlable intro text).
// --------------------------------------------------------------------------

/**
 * Produce a plain-text meta description from a Markdown explanation: strip the
 * common Markdown syntax, collapse whitespace and truncate on a word boundary.
 */
export function metaDescriptionFromMarkdown(markdown: string, maxLength = 155): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ') // code fences
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/[#>*_`~|-]/g, ' ') // markdown punctuation
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= maxLength) return plain
  const truncated = plain.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()}…`
}

export type SeoLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface LevelCopy {
  title: string
  description: string
  h1: string
  intro: string
}

const LEVEL_COPY: Record<SeoLevel, Record<string, LevelCopy>> = {
  A1: {
    en: {
      title: 'German A1 – Beginner German Lessons, Grammar & Vocabulary',
      description:
        'Learn German at A1 level with beginner grammar lessons, vocabulary exercises and practical German practice. Free, structured lessons for absolute beginners.',
      h1: 'German A1 – Beginner German Grammar & Vocabulary',
      intro:
        'German A1 is the first CEFR level for absolute beginners. These lessons introduce the German alphabet, articles (der, die, das), personal pronouns, the present tense and essential everyday vocabulary, each with interactive exercises so you can practise as you learn.',
    },
    de: {
      title: 'Deutsch A1 – Deutsch für Anfänger, Grammatik & Wortschatz',
      description:
        'Lerne Deutsch auf A1-Niveau mit Grammatiklektionen für Anfänger, Wortschatzübungen und praktischer Übung. Kostenlose, strukturierte Lektionen für Einsteiger.',
      h1: 'Deutsch A1 – Grammatik & Wortschatz für Anfänger',
      intro:
        'Deutsch A1 ist die erste CEFR-Stufe für absolute Anfänger. Diese Lektionen führen in das Alphabet, die Artikel (der, die, das), Personalpronomen, das Präsens und den wichtigsten Alltagswortschatz ein – jeweils mit interaktiven Übungen.',
    },
    tr: {
      title: 'Almanca A1 – Başlangıç Almanca Dersleri, Dilbilgisi ve Kelime',
      description:
        'A1 seviyesinde başlangıç dilbilgisi dersleri, kelime alıştırmaları ve pratik alıştırmalarla Almanca öğrenin. Yeni başlayanlar için ücretsiz, yapılandırılmış dersler.',
      h1: 'Almanca A1 – Başlangıç Dilbilgisi ve Kelime',
      intro:
        'Almanca A1, tam başlangıç seviyesindekiler için ilk CEFR seviyesidir. Bu dersler alfabeyi, artikelleri (der, die, das), şahıs zamirlerini, geniş zamanı ve temel günlük kelimeleri interaktif alıştırmalarla tanıtır.',
    },
  },
  A2: {
    en: {
      title: 'German A2 – Elementary German Lessons & Grammar',
      description:
        'Learn German at A2 level with elementary grammar lessons, the perfect tense, modal verbs and everyday vocabulary, with interactive exercises and practice.',
      h1: 'German A2 – Elementary German Grammar & Vocabulary',
      intro:
        'German A2 builds on the basics with the perfect tense (Perfekt), modal verbs, dative prepositions and richer everyday vocabulary. Each lesson pairs a clear explanation with exercises so you can consolidate what you learn.',
    },
    de: {
      title: 'Deutsch A2 – Deutsch Grundstufe, Grammatik & Übungen',
      description:
        'Lerne Deutsch auf A2-Niveau mit Grammatik der Grundstufe, Perfekt, Modalverben und Alltagswortschatz – mit interaktiven Übungen.',
      h1: 'Deutsch A2 – Grammatik & Wortschatz der Grundstufe',
      intro:
        'Deutsch A2 baut auf den Grundlagen auf: Perfekt, Modalverben, Dativpräpositionen und erweiterter Alltagswortschatz. Jede Lektion verbindet eine klare Erklärung mit Übungen.',
    },
    tr: {
      title: 'Almanca A2 – Temel Almanca Dersleri ve Dilbilgisi',
      description:
        'A2 seviyesinde temel dilbilgisi dersleri, Perfekt zamanı, modal fiiller ve günlük kelimelerle Almanca öğrenin. İnteraktif alıştırmalarla pratik yapın.',
      h1: 'Almanca A2 – Temel Dilbilgisi ve Kelime',
      intro:
        'Almanca A2, temel bilgileri Perfekt zamanı, modal fiiller, datif edatları ve daha zengin günlük kelimelerle geliştirir. Her ders, açık bir anlatımı alıştırmalarla birleştirir.',
    },
  },
  B1: {
    en: {
      title: 'German B1 – Intermediate German Grammar & Vocabulary',
      description:
        'Learn German at B1 level with intermediate grammar lessons, subordinate clauses, the Genitiv and connectors, plus exercises and practical German practice.',
      h1: 'German B1 – Intermediate German Grammar & Vocabulary',
      intro:
        'German B1 is the intermediate level where you master subordinate clauses, connectors (weil, dass, obwohl), the genitive case and the past tense. Lessons combine detailed explanations with exercises to build confidence.',
    },
    de: {
      title: 'Deutsch B1 – Mittelstufe Grammatik & Wortschatz',
      description:
        'Lerne Deutsch auf B1-Niveau mit Grammatik der Mittelstufe, Nebensätzen, Genitiv und Konnektoren sowie Übungen und praktischer Anwendung.',
      h1: 'Deutsch B1 – Grammatik & Wortschatz der Mittelstufe',
      intro:
        'Deutsch B1 ist die Mittelstufe, auf der du Nebensätze, Konnektoren (weil, dass, obwohl), den Genitiv und die Vergangenheit beherrschst. Lektionen verbinden ausführliche Erklärungen mit Übungen.',
    },
    tr: {
      title: 'Almanca B1 – Orta Seviye Almanca Dilbilgisi ve Kelime',
      description:
        'B1 seviyesinde orta seviye dilbilgisi dersleri, yan cümleler, Genitiv ve bağlaçlarla Almanca öğrenin. Alıştırmalar ve pratik uygulamalarla.',
      h1: 'Almanca B1 – Orta Seviye Dilbilgisi ve Kelime',
      intro:
        'Almanca B1, yan cümleleri, bağlaçları (weil, dass, obwohl), genitif durumunu ve geçmiş zamanı öğrendiğiniz orta seviyedir. Dersler, ayrıntılı anlatımları alıştırmalarla birleştirir.',
    },
  },
  B2: {
    en: {
      title: 'German B2 – Upper Intermediate German Grammar & Practice',
      description:
        'Learn German at B2 level with upper-intermediate grammar: the passive voice, Konjunktiv II, relative clauses and advanced connectors, with exercises and practice.',
      h1: 'German B2 – Upper-Intermediate German Grammar & Practice',
      intro:
        'German B2 is the upper-intermediate level covering the passive voice, Konjunktiv II, relative clauses, participle constructions and advanced connectors. Each lesson explains the grammar in depth and lets you practise with exercises.',
    },
    de: {
      title: 'Deutsch B2 – Obere Mittelstufe Grammatik & Übungen',
      description:
        'Lerne Deutsch auf B2-Niveau mit Grammatik der oberen Mittelstufe: Passiv, Konjunktiv II, Relativsätze und fortgeschrittene Konnektoren – mit Übungen.',
      h1: 'Deutsch B2 – Grammatik & Übungen der oberen Mittelstufe',
      intro:
        'Deutsch B2 ist die obere Mittelstufe mit Passiv, Konjunktiv II, Relativsätzen, Partizipialkonstruktionen und fortgeschrittenen Konnektoren. Jede Lektion erklärt die Grammatik ausführlich und bietet Übungen.',
    },
    tr: {
      title: 'Almanca B2 – Üst Orta Seviye Almanca Dilbilgisi ve Pratik',
      description:
        'B2 seviyesinde üst orta seviye dilbilgisi: edilgen çatı, Konjunktiv II, ilgi cümleleri ve ileri bağlaçlarla Almanca öğrenin. Alıştırmalarla pratik yapın.',
      h1: 'Almanca B2 – Üst Orta Seviye Dilbilgisi ve Pratik',
      intro:
        'Almanca B2, edilgen çatı, Konjunktiv II, ilgi cümleleri, ortaç yapıları ve ileri bağlaçları kapsayan üst orta seviyedir. Her ders dilbilgisini ayrıntılı anlatır ve alıştırmalar sunar.',
    },
  },
  C1: {
    en: {
      title: 'German C1 – Advanced German Grammar, Style & Practice',
      description:
        'Learn German at C1 level: Konjunktiv I and reported speech, extended participial attributes, nominal style, modal particles and idioms – with detailed explanations, many examples and exercises.',
      h1: 'German C1 – Advanced German Grammar & Style',
      intro:
        'German C1 is the advanced level for learners who want to understand demanding texts and express themselves fluently and precisely. The lessons cover Konjunktiv I and reported speech, extended participial attributes, nominal versus verbal style, complex connectors, modal particles, idioms, text cohesion and academic register – each with in-depth explanations, many example sentences and exercises.',
    },
    de: {
      title: 'Deutsch C1 – Fortgeschrittene Grammatik, Stil & Übungen',
      description:
        'Lerne Deutsch auf C1-Niveau: Konjunktiv I und indirekte Rede, erweiterte Partizipialattribute, Nominalstil, Modalpartikeln und Redewendungen – mit ausführlichen Erklärungen, vielen Beispielen und Übungen.',
      h1: 'Deutsch C1 – Fortgeschrittene Grammatik & Stil',
      intro:
        'Deutsch C1 ist die Stufe für Fortgeschrittene, die anspruchsvolle Texte verstehen und sich flüssig und präzise ausdrücken möchten. Die Lektionen behandeln Konjunktiv I und indirekte Rede, erweiterte Partizipialattribute, Nominal- und Verbalstil, komplexe Konnektoren, Modalpartikeln, Redewendungen, Textkohärenz und Fachsprache – jeweils mit ausführlichen Erklärungen, vielen Beispielsätzen und Übungen.',
    },
    tr: {
      title: 'Almanca C1 – İleri Seviye Dilbilgisi, Üslup ve Pratik',
      description:
        'C1 seviyesinde Almanca öğrenin: Konjunktiv I ve dolaylı anlatım, genişletilmiş sıfat-fiil öbekleri, isim üslubu, kip edatları ve deyimler – ayrıntılı anlatımlar, bol örnek ve alıştırmalarla.',
      h1: 'Almanca C1 – İleri Seviye Dilbilgisi ve Üslup',
      intro:
        'Almanca C1, zorlu metinleri anlamak ve kendini akıcı ve kesin biçimde ifade etmek isteyenler için ileri seviyedir. Dersler Konjunktiv I ve dolaylı anlatımı, genişletilmiş sıfat-fiil öbeklerini, isim ve fiil üslubunu, karmaşık bağlaçları, kip edatlarını, deyimleri, metin bütünlüğünü ve akademik dil düzeyini kapsar – her biri ayrıntılı anlatım, bol örnek cümle ve alıştırmalarla.',
    },
  },
  C2: {
    en: {
      title: 'German C2 – Mastery-Level German Grammar & Style',
      description:
        'Learn German at C2 level: elevated nominal style, rhetorical devices, irony and nuance, specialist registers, subtleties of the subjunctive and precise academic expression – with detailed explanations and many examples.',
      h1: 'German C2 – Mastery-Level German Grammar & Style',
      intro:
        'German C2 is the highest CEFR level, close to an educated native speaker. The lessons focus on elevated nominal style, rhetorical devices, sarcasm and exaggeration, specialist and elevated vocabulary, the finer points of the subjunctive, text-type-specific styles, language varieties, wordplay, academic discourse markers and precise expression – each with in-depth explanations, many example sentences and exercises.',
    },
    de: {
      title: 'Deutsch C2 – Grammatik & Stil auf muttersprachlichem Niveau',
      description:
        'Lerne Deutsch auf C2-Niveau: gehobener Nominalstil, rhetorische Mittel, Ironie und Nuancen, Fachsprachen, Feinheiten des Konjunktivs und präziser wissenschaftlicher Ausdruck – mit ausführlichen Erklärungen und vielen Beispielen.',
      h1: 'Deutsch C2 – Kompetente Sprachbeherrschung: Grammatik & Stil',
      intro:
        'Deutsch C2 ist die höchste CEFR-Stufe und entspricht annähernd dem Niveau gebildeter Muttersprachler. Die Lektionen behandeln gehobenen Nominalstil, rhetorische Mittel, Sarkasmus und Übertreibung, Fach- und gehobenen Wortschatz, Feinheiten des Konjunktivs, textsortenspezifische Stile, Sprachvarietäten, Wortspiele, akademische Diskursmarker und präzisen Ausdruck – jeweils mit ausführlichen Erklärungen, vielen Beispielsätzen und Übungen.',
    },
    tr: {
      title: 'Almanca C2 – Ustalık Seviyesi Dilbilgisi ve Üslup',
      description:
        'C2 seviyesinde Almanca öğrenin: yüksek isim üslubu, retorik araçlar, ironi ve anlam incelikleri, uzmanlık dilleri, Konjunktiv incelikleri ve kesin akademik ifade – ayrıntılı anlatımlar ve bol örneklerle.',
      h1: 'Almanca C2 – Ustalık Seviyesi Dilbilgisi ve Üslup',
      intro:
        'Almanca C2, eğitimli bir anadil konuşurunun düzeyine yakın en yüksek CEFR seviyesidir. Dersler yüksek isim üslubunu, retorik araçları, alay ve abartıyı, uzmanlık ve yüksek üslup kelime dağarcığını, Konjunktiv inceliklerini, metin türüne özgü üslupları, dil çeşitlerini, kelime oyunlarını, akademik söylem belirteçlerini ve kesin ifadeyi kapsar – her biri ayrıntılı anlatım, bol örnek cümle ve alıştırmalarla.',
    },
  },
}

export function getLevelCopy(level: string, locale: string): LevelCopy | null {
  const byLocale = LEVEL_COPY[level as SeoLevel]
  if (!byLocale) return null
  return byLocale[locale] ?? byLocale.en
}

// --------------------------------------------------------------------------
// JSON-LD structured-data builders.
// --------------------------------------------------------------------------

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl('/og.svg'),
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getSiteUrl(),
    inLanguage: routing.locales,
  }
}

export interface BreadcrumbItem {
  name: string
  path: string
}

export function breadcrumbJsonLd(locale: string, items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: localizedUrl(locale, item.path),
    })),
  }
}

export function courseJsonLd(input: {
  name: string
  description: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: 'de',
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: getSiteUrl(),
    },
  }
}
