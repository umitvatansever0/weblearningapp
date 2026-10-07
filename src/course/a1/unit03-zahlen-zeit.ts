import type { CourseUnit, Exercise, VocabItem } from '../types'
import { l } from '../l10n'

const ONES = [
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun',
  'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn',
]
const TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig']

/** German number words 0–100: 21 → einundzwanzig. */
export function numberToGerman(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new RangeError(`unsupported number ${n}`)
  if (n === 100) return 'hundert'
  if (n < 20) return ONES[n]
  const unit = n % 10
  const tens = TENS[Math.floor(n / 10)]
  if (unit === 0) return tens
  return `${unit === 1 ? 'ein' : ONES[unit]}und${tens}`
}

const DRILL_NUMBERS = [13, 17, 21, 30, 34, 45, 56, 67, 72, 89, 96, 16]

/** "vierunddreißig → ?" with typical traps (swapped digits, neighbouring tens). */
function numberDrills(): Exercise[] {
  return DRILL_NUMBERS.map((n, i) => {
    const swapped = n >= 10 && n % 10 !== 0 ? (n % 10) * 10 + Math.floor(n / 10) : n + 1
    const neighbour = n >= 20 ? n - 10 : n + 50
    const distinct = [...new Set([n, swapped, neighbour, n + 10 <= 100 ? n + 10 : n - 2])].slice(0, 3)
    const rotation = i % distinct.length
    const options = [...distinct.slice(rotation), ...distinct.slice(0, rotation)].map(String)
    return {
      id: `num-${n}`,
      type: 'multiple_choice' as const,
      topic: 'numbers',
      concept: n > 20 && n % 10 !== 0 ? 'numbers-reversed' : 'numbers-basic',
      skill: 'vocabulary' as const,
      difficulty: 1 as const,
      prompt: `${numberToGerman(n)} = ___`,
      options,
      answer: options.indexOf(String(n)),
      explanation: l(
        n > 20 && n % 10 !== 0
          ? `German says the ones first: ${numberToGerman(n % 10 === 1 ? 1 : n % 10).replace(/^eins$/, 'ein')}-und-${TENS[Math.floor(n / 10)]} = ${n}.`
          : `${numberToGerman(n)} = ${n}.`,
        n > 20 && n % 10 !== 0
          ? `Almancada önce birler söylenir: ${n % 10 === 1 ? 'ein' : ONES[n % 10]}-und-${TENS[Math.floor(n / 10)]} = ${n}.`
          : `${numberToGerman(n)} = ${n}.`,
        n > 20 && n % 10 !== 0
          ? `Zuerst die Einer, dann die Zehner: ${n % 10 === 1 ? 'ein' : ONES[n % 10]}-und-${TENS[Math.floor(n / 10)]} = ${n}.`
          : `${numberToGerman(n)} = ${n}.`
      ),
    }
  })
}

const VOCAB: VocabItem[] = [
  { word: 'Uhr', gender: 'f', plural: 'die Uhren', emoji: '🕗', translation: l('clock; o’clock', 'saat', 'Uhr'), example: 'Es ist acht Uhr.' },
  { word: 'Stunde', gender: 'f', plural: 'die Stunden', emoji: '⏳', translation: l('hour', 'saat (süre)', 'Stunde'), example: 'Der Kurs dauert zwei Stunden.' },
  { word: 'Minute', gender: 'f', plural: 'die Minuten', emoji: '⏱️', translation: l('minute', 'dakika', 'Minute'), example: 'Der Bus kommt in fünf Minuten.' },
  { word: 'Tag', gender: 'm', plural: 'die Tage', emoji: '☀️', translation: l('day', 'gün', 'Tag'), example: 'Heute ist ein schöner Tag.' },
  { word: 'Woche', gender: 'f', plural: 'die Wochen', emoji: '🗓️', translation: l('week', 'hafta', 'Woche'), example: 'Die Woche hat sieben Tage.' },
  { word: 'Monat', gender: 'm', plural: 'die Monate', emoji: '📅', translation: l('month', 'ay', 'Monat'), example: 'Der Monat Mai ist schön.' },
  { word: 'Jahr', gender: 'n', plural: 'die Jahre', emoji: '🎆', translation: l('year', 'yıl', 'Jahr'), example: 'Das Jahr hat zwölf Monate.' },
  { word: 'Wochenende', gender: 'n', plural: 'die Wochenenden', emoji: '🛋️', translation: l('weekend', 'hafta sonu', 'Wochenende'), example: 'Am Wochenende habe ich Zeit.' },
  { word: 'Euro', gender: 'm', plural: 'die Euro', emoji: '💶', translation: l('euro', 'avro', 'Euro'), example: 'Das kostet drei Euro.' },
  { word: 'Preis', gender: 'm', plural: 'die Preise', emoji: '🏷️', translation: l('price', 'fiyat', 'Preis'), example: 'Der Preis ist gut.' },
  { word: 'Termin', gender: 'm', plural: 'die Termine', emoji: '📆', translation: l('appointment', 'randevu', 'Termin'), example: 'Der Termin ist am Montag.' },
  { word: 'Geburtstag', gender: 'm', plural: 'die Geburtstage', emoji: '🎂', translation: l('birthday', 'doğum günü', 'Geburtstag'), example: 'Mein Geburtstag ist im Mai.' },
]

const MORE_VOCAB: VocabItem[] = [
  { word: 'Montag · Dienstag · Mittwoch · Donnerstag · Freitag · Samstag · Sonntag', translation: l('Monday … Sunday', 'Pazartesi … Pazar', 'die Wochentage') },
  { word: 'Januar · Februar · März · April · Mai · Juni', translation: l('January … June', 'Ocak … Haziran', 'die Monate (1)') },
  { word: 'Juli · August · September · Oktober · November · Dezember', translation: l('July … December', 'Temmuz … Aralık', 'die Monate (2)') },
  { word: 'Cent', gender: 'm', plural: 'die Cent', translation: l('cent', 'sent', 'Cent') },
  { word: 'kosten', translation: l('to cost', 'tutmak, fiyatı olmak', 'kosten') },
  { word: 'Wie spät ist es?', translation: l('What time is it?', 'Saat kaç?', 'Wie viel Uhr ist es?') },
  { word: 'halb', translation: l('half (halb neun = 8:30!)', 'buçuk (halb neun = 8:30!)', 'halb (halb neun = 8:30)') },
  { word: 'Viertel', gender: 'n', translation: l('quarter', 'çeyrek', 'Viertel') },
  { word: 'Brötchen', gender: 'n', plural: 'die Brötchen', translation: l('bread roll', 'küçük ekmek', 'Brötchen') },
  { word: 'Brezel', gender: 'f', plural: 'die Brezeln', translation: l('pretzel', 'brezel (simit benzeri)', 'Brezel') },
]

const EXERCISES: Exercise[] = [
  // --- Practice 1: recognise ----------------------------------------------
  {
    id: 'img-drei-uhr',
    type: 'image_choice',
    topic: 'time',
    concept: 'clock-full',
    skill: 'vocabulary',
    difficulty: 1,
    prompt: 'Es ist drei Uhr.',
    options: [
      { emoji: '🕘', label: '9:00' },
      { emoji: '🕒', label: '3:00' },
      { emoji: '🕐', label: '1:00' },
      { emoji: '🕖', label: '7:00' },
    ],
    answer: 1,
    explanation: l('drei Uhr = 3:00.', 'drei Uhr = 3:00.', 'drei Uhr = 3:00.'),
    examples: ['Es ist **drei Uhr**.'],
    practice: ['img-halb-sieben'],
  },
  {
    id: 'img-halb-sieben',
    type: 'image_choice',
    topic: 'time',
    concept: 'clock-halb',
    skill: 'vocabulary',
    difficulty: 2,
    prompt: 'Es ist halb sieben.',
    options: [
      { emoji: '🕖', label: '7:00' },
      { emoji: '🕢', label: '7:30' },
      { emoji: '🕡', label: '6:30' },
    ],
    answer: 2,
    explanation: l(
      'halb sieben = half way TO seven = 6:30. Not 7:30!',
      'halb sieben = yediye yarım saat var = 6:30. 7:30 değil!',
      'halb sieben = eine halbe Stunde vor sieben = 6:30.'
    ),
    examples: ['Es ist **halb sieben** (6:30).'],
  },
  {
    id: 'match-numbers',
    type: 'matching',
    topic: 'numbers',
    concept: 'numbers-basic',
    skill: 'vocabulary',
    difficulty: 1,
    instructions: l('Match the words and numbers.', 'Kelimeleri ve sayıları eşleştir.', 'Ordne Wörter und Zahlen zu.'),
    pairs: [
      { left: 'zwölf', right: '12' },
      { left: 'zwanzig', right: '20' },
      { left: 'dreizehn', right: '13' },
      { left: 'dreißig', right: '30' },
    ],
    explanation: l(
      '13–19 end in -zehn (dreizehn). Tens end in -zig – except dreißig (with ß).',
      '13–19 -zehn ile biter (dreizehn). Onluklar -zig ile biter – dreißig hariç (ß ile).',
      '13–19 enden auf -zehn (dreizehn). Zehner enden auf -zig – außer dreißig (mit ß).'
    ),
  },
  {
    id: 'mc-21',
    type: 'multiple_choice',
    topic: 'numbers',
    concept: 'numbers-reversed',
    skill: 'vocabulary',
    difficulty: 1,
    prompt: 'einundzwanzig = ___',
    options: ['12', '21', '201'],
    answer: 1,
    explanation: l(
      'German reads two-digit numbers backwards: ein-und-zwanzig = one-and-twenty = 21.',
      'Almanca iki basamaklı sayıları tersten okur: ein-und-zwanzig = bir-ve-yirmi = 21.',
      'Zweistellige Zahlen: zuerst die Einer, dann die Zehner: ein-und-zwanzig = 21.'
    ),
    examples: ['**einundzwanzig** = 21', '**zweiundvierzig** = 42'],
    practice: ['num-34', 'num-67'],
  },
  {
    id: 'mc-halb-neun',
    type: 'multiple_choice',
    topic: 'time',
    concept: 'clock-halb',
    skill: 'grammar',
    difficulty: 2,
    prompt: 'Es ist halb neun. = ___',
    options: ['8:30', '9:30', '9:00'],
    answer: 0,
    explanation: l(
      'halb neun = half an hour before nine = 8:30.',
      'halb neun = dokuza yarım saat var = 8:30.',
      'halb neun = eine halbe Stunde vor neun = 8:30.'
    ),
    examples: ['Es ist **halb neun** (8:30).'],
  },
  {
    id: 'tf-viertel',
    type: 'true_false',
    topic: 'time',
    concept: 'clock-viertel',
    skill: 'grammar',
    difficulty: 1,
    statement: 'Viertel nach zehn = 10:15',
    answer: true,
    explanation: l(
      'Viertel nach zehn = a quarter past ten = 10:15. Viertel vor zehn = 9:45.',
      'Viertel nach zehn = onu çeyrek geçiyor = 10:15. Viertel vor zehn = 9:45.',
      'Viertel nach zehn = 10:15. Viertel vor zehn = 9:45.'
    ),
    examples: ['Es ist **Viertel nach** zehn.'],
  },
  {
    id: 'sort-um-am-im',
    type: 'categorize',
    topic: 'prepositions',
    concept: 'um-am-im',
    skill: 'grammar',
    difficulty: 2,
    instructions: l('um, am or im? Sort the time words.', 'um, am mı im mi? Zaman kelimelerini ayır.', 'um, am oder im? Sortiere.'),
    categories: ['um', 'am', 'im'],
    items: [
      { text: '8 Uhr', category: 0 },
      { text: 'Montag', category: 1 },
      { text: 'Mai', category: 2 },
      { text: 'halb neun', category: 0 },
      { text: 'Wochenende', category: 1 },
      { text: 'Juli', category: 2 },
    ],
    explanation: l(
      'um + clock time, am + day (and Wochenende), im + month.',
      'um + saat, am + gün (ve Wochenende), im + ay.',
      'um + Uhrzeit, am + Tag (und Wochenende), im + Monat.'
    ),
  },
  {
    id: 'select-days',
    type: 'multiple_select',
    topic: 'vocabulary',
    concept: 'days',
    skill: 'vocabulary',
    difficulty: 1,
    promptL10n: l('Select the days of the week.', 'Haftanın günlerini seç.', 'Wähle die Wochentage.'),
    options: ['Montag', 'Mai', 'Freitag', 'Juni', 'Sonntag', 'Uhr'],
    answers: [0, 2, 4],
    explanation: l('Days: Montag, Freitag, Sonntag. Mai and Juni are months.', 'Günler: Montag, Freitag, Sonntag. Mai ve Juni aydır.', 'Tage: Montag, Freitag, Sonntag. Mai und Juni sind Monate.'),
  },
  {
    id: 'match-prices',
    type: 'matching',
    topic: 'prices',
    concept: 'prices',
    skill: 'vocabulary',
    difficulty: 2,
    instructions: l('Match the prices.', 'Fiyatları eşleştir.', 'Ordne die Preise zu.'),
    pairs: [
      { left: '1,50 €', right: 'ein Euro fünfzig' },
      { left: '3,20 €', right: 'drei Euro zwanzig' },
      { left: '0,80 €', right: 'achtzig Cent' },
      { left: '10,00 €', right: 'zehn Euro' },
    ],
    explanation: l(
      'Say euros, then cents – without „und“: 3,20 € = drei Euro zwanzig. Germany writes a comma: 3,20.',
      'Önce avro, sonra sent – „und“ olmadan: 3,20 € = drei Euro zwanzig. Almanya’da virgül yazılır: 3,20.',
      'Erst Euro, dann Cent – ohne „und“: 3,20 € = drei Euro zwanzig.'
    ),
  },

  // --- Practice 2: use -----------------------------------------------------
  {
    id: 'fill-am',
    type: 'fill_blank',
    topic: 'prepositions',
    concept: 'um-am-im',
    skill: 'grammar',
    difficulty: 1,
    sentence: 'Der Kurs ist ___ Montag.',
    accepted: ['am'],
    base: 'um / am / im',
    explanation: l('Day → am: am Montag.', 'Gün → am: am Montag.', 'Tag → am: am Montag.'),
    examples: ['Der Kurs ist **am** Montag.'],
    practice: ['fill-um', 'fill-im'],
  },
  {
    id: 'fill-um',
    type: 'fill_blank',
    topic: 'prepositions',
    concept: 'um-am-im',
    skill: 'grammar',
    difficulty: 1,
    sentence: 'Der Film beginnt ___ 20 Uhr.',
    accepted: ['um'],
    base: 'um / am / im',
    explanation: l('Clock time → um: um 20 Uhr.', 'Saat → um: um 20 Uhr.', 'Uhrzeit → um: um 20 Uhr.'),
    examples: ['Der Film beginnt **um** 20 Uhr.'],
  },
  {
    id: 'fill-im',
    type: 'fill_blank',
    topic: 'prepositions',
    concept: 'um-am-im',
    skill: 'grammar',
    difficulty: 1,
    sentence: 'Mein Geburtstag ist ___ Mai.',
    accepted: ['im'],
    base: 'um / am / im',
    explanation: l('Month → im: im Mai.', 'Ay → im: im Mai.', 'Monat → im: im Mai.'),
    examples: ['Mein Geburtstag ist **im** Mai.'],
  },
  {
    id: 'mc-wie-spaet',
    type: 'multiple_choice',
    topic: 'time',
    concept: 'ask-time',
    skill: 'grammar',
    difficulty: 1,
    prompt: 'Wie ___ ist es? – Es ist drei Uhr.',
    options: ['spät', 'viel', 'alt'],
    answer: 0,
    explanation: l(
      '„Wie spät ist es?“ = What time is it? (Also: Wie viel Uhr ist es?)',
      '„Wie spät ist es?“ = Saat kaç? (Ayrıca: Wie viel Uhr ist es?)',
      '„Wie spät ist es?“ oder „Wie viel Uhr ist es?“'
    ),
    examples: ['**Wie spät** ist es? – Es ist drei Uhr.'],
  },
  {
    id: 'mc-wie-viel',
    type: 'multiple_choice',
    topic: 'prices',
    concept: 'ask-price',
    skill: 'grammar',
    difficulty: 1,
    prompt: '___ kostet das? – Fünf Euro.',
    options: ['Wie viel', 'Wie spät', 'Wie alt'],
    answer: 0,
    explanation: l('Price: Wie viel kostet das? / Was kostet das?', 'Fiyat: Wie viel kostet das? / Was kostet das?', 'Preis: Wie viel kostet das? / Was kostet das?'),
    examples: ['**Wie viel** kostet das?'],
  },
  {
    id: 'fill-15',
    type: 'fill_blank',
    topic: 'numbers',
    concept: 'numbers-basic',
    skill: 'writing',
    difficulty: 1,
    sentence: '15 = ___',
    accepted: ['fünfzehn'],
    instructions: l('Write the number as a word.', 'Sayıyı yazıyla yaz.', 'Schreib die Zahl als Wort.'),
    explanation: l('fünf + zehn = fünfzehn.', 'fünf + zehn = fünfzehn.', 'fünf + zehn = fünfzehn.'),
  },
  {
    id: 'fill-30',
    type: 'fill_blank',
    topic: 'numbers',
    concept: 'numbers-basic',
    skill: 'writing',
    difficulty: 2,
    sentence: '30 = ___',
    accepted: ['dreißig'],
    instructions: l('Write the number as a word.', 'Sayıyı yazıyla yaz.', 'Schreib die Zahl als Wort.'),
    hint: l('Careful – this one is special.', 'Dikkat – bu özel.', 'Achtung – diese Zahl ist besonders.'),
    explanation: l('dreißig with ß – not dreizig.', 'dreißig ß ile – dreizig değil.', 'dreißig mit ß – nicht dreizig.'),
  },
  {
    id: 'fill-46',
    type: 'fill_blank',
    topic: 'numbers',
    concept: 'numbers-reversed',
    skill: 'writing',
    difficulty: 2,
    sentence: '46 = ___',
    accepted: ['sechsundvierzig'],
    instructions: l('Write the number as a word – in one word.', 'Sayıyı yazıyla yaz – tek kelime olarak.', 'Schreib die Zahl als ein Wort.'),
    explanation: l('6 + und + 40 = sechsundvierzig (one word).', '6 + und + 40 = sechsundvierzig (tek kelime).', 'sechs-und-vierzig = sechsundvierzig.'),
  },
  {
    id: 'build-acht-uhr',
    type: 'sentence_builder',
    topic: 'time',
    concept: 'clock-full',
    skill: 'grammar',
    difficulty: 1,
    chips: ['ist', 'Es', 'Uhr', 'acht'],
    answers: [['Es', 'ist', 'acht', 'Uhr']],
    translation: l('It is eight o’clock.', 'Saat sekiz.', 'Es ist acht Uhr.'),
    explanation: l('Es ist + number + Uhr.', 'Es ist + sayı + Uhr.', 'Es ist + Zahl + Uhr.'),
    examples: ['**Es ist** acht Uhr.'],
  },
  {
    id: 'build-kostet',
    type: 'sentence_builder',
    topic: 'prices',
    concept: 'ask-price',
    skill: 'grammar',
    difficulty: 1,
    chips: ['kostet', 'Das', 'Euro', 'drei'],
    answers: [['Das', 'kostet', 'drei', 'Euro']],
    translation: l('That costs three euros.', 'Bu üç avro.', 'Das kostet drei Euro.'),
    explanation: l('Das + kostet + price.', 'Das + kostet + fiyat.', 'Das + kostet + Preis.'),
    examples: ['Das **kostet** drei Euro.'],
  },
  {
    id: 'build-wie-spaet',
    type: 'sentence_builder',
    topic: 'time',
    concept: 'ask-time',
    skill: 'grammar',
    difficulty: 1,
    chips: ['spät', 'es', 'Wie', 'ist'],
    answers: [['Wie', 'spät', 'ist', 'es']],
    end: '?',
    translation: l('What time is it?', 'Saat kaç?', 'Wie spät ist es?'),
    explanation: l('Wie spät + ist + es?', 'Wie spät + ist + es?', 'Wie spät + ist + es?'),
    examples: ['**Wie spät** ist es?'],
  },
  {
    id: 'fix-um-montag',
    type: 'error_correction',
    topic: 'prepositions',
    concept: 'um-am-im',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Der Kurs ist um Montag.',
    accepted: ['Der Kurs ist am Montag.'],
    explanation: l('Day → am.', 'Gün → am.', 'Tag → am.'),
    examples: ['Der Kurs ist **am** Montag.'],
  },
  {
    id: 'fix-uhren',
    type: 'error_correction',
    topic: 'time',
    concept: 'clock-full',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Es ist acht Uhren.',
    accepted: ['Es ist acht Uhr.'],
    explanation: l(
      'In clock times Uhr stays singular: acht Uhr. (die Uhren = several clocks.)',
      'Saat söylerken Uhr tekil kalır: acht Uhr. (die Uhren = birden fazla saat aleti.)',
      'Bei der Uhrzeit bleibt Uhr im Singular: acht Uhr.'
    ),
    examples: ['Es ist acht **Uhr**.'],
  },
  {
    id: 'tr-sieben-uhr',
    type: 'translation',
    topic: 'time',
    concept: 'clock-full',
    skill: 'writing',
    difficulty: 1,
    source: l('It is seven o’clock.', 'Saat yedi.', 'It is seven o’clock.'),
    accepted: ['Es ist sieben Uhr.', 'Es ist 7 Uhr.'],
    explanation: l('Es ist sieben Uhr.', 'Es ist sieben Uhr.', 'Es ist sieben Uhr.'),
    examples: ['Es ist **sieben Uhr**.'],
  },
  {
    id: 'tr-freitag',
    type: 'translation',
    topic: 'prepositions',
    concept: 'um-am-im',
    skill: 'writing',
    difficulty: 1,
    source: l('on Friday', 'cuma günü', 'on Friday'),
    accepted: ['am Freitag'],
    explanation: l('am + day: am Freitag.', 'am + gün: am Freitag.', 'am + Tag: am Freitag.'),
    examples: ['**am** Freitag'],
  },
  {
    id: 'dialog-uhrzeit',
    type: 'dialogue',
    topic: 'time',
    concept: 'ask-time',
    skill: 'grammar',
    difficulty: 1,
    lines: [{ speaker: 'Tom', de: 'Entschuldigung, wie spät ist es?' }],
    options: ['Es ist zehn Uhr.', 'Ich bin zehn.', 'Das kostet zehn Euro.'],
    answer: 0,
    explanation: l('Time → Es ist … Uhr.', 'Saat → Es ist … Uhr.', 'Uhrzeit → Es ist … Uhr.'),
  },
  {
    id: 'dialog-bezahlen',
    type: 'dialogue',
    topic: 'prices',
    concept: 'prices',
    skill: 'grammar',
    difficulty: 1,
    lines: [{ speaker: 'Verkäuferin', de: 'Das macht vier Euro fünfzig.' }],
    options: ['Hier, bitte.', 'Wie alt sind Sie?', 'Gute Nacht!'],
    answer: 0,
    explanation: l(
      '„Das macht …“ = That comes to … You pay: „Hier, bitte.“',
      '„Das macht …“ = Toplam … Ödersin: „Hier, bitte.“',
      '„Das macht …“ – du bezahlst: „Hier, bitte.“'
    ),
  },
  {
    id: 'mc-mittwoch',
    type: 'multiple_choice',
    topic: 'vocabulary',
    concept: 'days',
    skill: 'vocabulary',
    difficulty: 1,
    prompt: 'Welcher Tag kommt nach Dienstag?',
    options: ['Montag', 'Mittwoch', 'Donnerstag'],
    answer: 1,
    explanation: l('Montag, Dienstag, Mittwoch (Wednesday = middle of the week).', 'Montag, Dienstag, Mittwoch (haftanın ortası).', 'Montag, Dienstag, Mittwoch – die Mitte der Woche.'),
  },

  // --- Reading -----------------------------------------------------------
  {
    id: 'read-wann',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-kurs',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Wann ist der Kurs?',
    options: ['Am Montag und am Mittwoch.', 'Am Dienstag und am Donnerstag.', 'Am Wochenende.'],
    answer: 0,
    explanation: l('„Der Kurs ist am Montag und am Mittwoch.“', '„Der Kurs ist am Montag und am Mittwoch.“', '„Der Kurs ist am Montag und am Mittwoch.“'),
  },
  {
    id: 'read-preis',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-kurs',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Was kostet der Kurs?',
    options: ['140 Euro', '240 Euro', '420 Euro'],
    answer: 1,
    explanation: l('„Der Kurs kostet 240 Euro.“', '„Der Kurs kostet 240 Euro.“', '„Der Kurs kostet 240 Euro.“'),
  },
  {
    id: 'read-cafe',
    type: 'true_false',
    topic: 'reading',
    concept: 'reading-kurs',
    skill: 'reading',
    difficulty: 1,
    statement: 'Das Sprachcafé kostet fünf Euro.',
    answer: false,
    explanation: l('„Das Sprachcafé kostet nichts.“ – it is free.', '„Das Sprachcafé kostet nichts.“ – ücretsiz.', '„Das Sprachcafé kostet nichts.“'),
  },
  {
    id: 'read-beginn',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-kurs',
    skill: 'reading',
    difficulty: 2,
    prompt: 'Um wie viel Uhr beginnt der Kurs?',
    options: ['Um 18 Uhr.', 'Um 20 Uhr.', 'Um 17 Uhr.'],
    answer: 0,
    explanation: l('„von 18 bis 20 Uhr“ – it starts at 18:00.', '„von 18 bis 20 Uhr“ – 18:00’de başlıyor.', '„von 18 bis 20 Uhr“'),
  },

  // --- Listening ----------------------------------------------------------
  {
    id: 'listen-34',
    type: 'listening_choice',
    topic: 'numbers',
    concept: 'numbers-reversed',
    skill: 'listening',
    difficulty: 2,
    audio: 'Das kostet vierunddreißig Euro.',
    question: l('How much does it cost?', 'Kaç para?', 'Wie viel kostet das?'),
    options: ['34 €', '43 €', '24 €'],
    answer: 0,
    explanation: l('vier-und-dreißig = 34.', 'vier-und-dreißig = 34.', 'vier-und-dreißig = 34.'),
  },
  {
    id: 'listen-halb',
    type: 'listening_choice',
    topic: 'time',
    concept: 'clock-halb',
    skill: 'listening',
    difficulty: 2,
    audio: 'Es ist halb sieben.',
    question: l('What time is it?', 'Saat kaç?', 'Wie spät ist es?'),
    options: ['6:30', '7:30', '7:00'],
    answer: 0,
    explanation: l('halb sieben = 6:30.', 'halb sieben = 6:30.', 'halb sieben = 6:30.'),
  },
  {
    id: 'listen-donnerstag',
    type: 'listening_choice',
    topic: 'prepositions',
    concept: 'um-am-im',
    skill: 'listening',
    difficulty: 1,
    audio: 'Der Termin ist am Donnerstag um neun Uhr.',
    question: l('When is the appointment?', 'Randevu ne zaman?', 'Wann ist der Termin?'),
    options: ['Dienstag, 9:00', 'Donnerstag, 9:00', 'Donnerstag, 19:00'],
    answer: 1,
    explanation: l('„am Donnerstag um neun Uhr“', '„am Donnerstag um neun Uhr“', '„am Donnerstag um neun Uhr“'),
  },
  {
    id: 'listen-juli',
    type: 'listening_choice',
    topic: 'prepositions',
    concept: 'um-am-im',
    skill: 'listening',
    difficulty: 1,
    audio: 'Mein Geburtstag ist im Juli.',
    question: l('When is the birthday?', 'Doğum günü ne zaman?', 'Wann ist der Geburtstag?'),
    options: ['im Juni', 'im Juli', 'im Januar'],
    answer: 1,
    explanation: l('„im Juli“ = in July.', '„im Juli“ = temmuzda.', '„im Juli“'),
  },

  ...numberDrills(),
]

export const UNIT03_ZAHLEN_ZEIT: CourseUnit = {
  level: 'A1',
  number: 3,
  slug: 'zahlen-zeit',
  titleDe: 'Zahlen, Uhrzeit und Datum',
  title: l('Numbers, time and dates', 'Sayılar, saat ve tarih', 'Zahlen, Uhrzeit und Datum'),
  goal: l(
    'By the end of this unit you can understand and say numbers up to 100, prices and clock times, and say when something happens (um, am, im).',
    'Bu ünitenin sonunda 100’e kadar sayıları, fiyatları ve saatleri anlayıp söyleyebilir, bir şeyin ne zaman olduğunu söyleyebilirsin (um, am, im).',
    'Am Ende dieser Einheit verstehst und sagst du Zahlen bis 100, Preise und Uhrzeiten und kannst sagen, wann etwas passiert (um, am, im).'
  ),
  minutes: [15, 20],
  topics: [
    { key: 'numbers', label: l('Numbers 0–100', 'Sayılar 0–100', 'Zahlen 0–100') },
    { key: 'prices', label: l('Prices', 'Fiyatlar', 'Preise') },
    { key: 'time', label: l('Clock time', 'Saat', 'Uhrzeit') },
    { key: 'prepositions', label: l('um / am / im', 'um / am / im', 'um / am / im') },
    { key: 'vocabulary', label: l('Days & months', 'Günler ve aylar', 'Tage & Monate') },
  ],
  vocabulary: [...VOCAB, ...MORE_VOCAB],
  exercises: EXERCISES,
  mastery: { minAnswered: 0.7, minAccuracy: 0.7 },
  sections: [
    {
      key: 'discover',
      kind: 'discover',
      title: l('Discover', 'Keşfet', 'Entdecken'),
      intro: l('Words for time and money.', 'Zaman ve para kelimeleri.', 'Wörter für Zeit und Geld.'),
      cards: VOCAB,
    },
    {
      key: 'understand',
      kind: 'understand',
      title: l('Understand', 'Anla', 'Verstehen'),
      rules: [
        {
          title: l('Numbers 0–20', 'Sayılar 0–20', 'Zahlen 0–20'),
          body: l(
            '0–12 have their own words. 13–19 = number + zehn. Two short forms: sechzehn (not sechszehn), siebzehn (not siebenzehn).',
            '0–12’nin kendi kelimeleri var. 13–19 = sayı + zehn. İki kısaltma: sechzehn (sechszehn değil), siebzehn (siebenzehn değil).',
            '0–12 haben eigene Wörter. 13–19 = Zahl + zehn. Zwei Kurzformen: sechzehn, siebzehn.'
          ),
          table: {
            head: [l('0–6', '0–6', '0–6'), l('7–12', '7–12', '7–12'), l('13–19', '13–19', '13–19')],
            rows: [
              ['0 null · 1 eins · 2 zwei', '7 sieben · 8 acht', '13 dreizehn · 14 vierzehn'],
              ['3 drei · 4 vier', '9 neun · 10 zehn', '15 fünfzehn · 16 sechzehn'],
              ['5 fünf · 6 sechs', '11 elf · 12 zwölf', '17 siebzehn · 18 achtzehn · 19 neunzehn'],
            ],
          },
        },
        {
          title: l('21–99: backwards!', '21–99: tersten!', '21–99: rückwärts!'),
          body: l(
            'German says the ones first, then „und“, then the tens – as one word: 21 = einundzwanzig (one-and-twenty), 58 = achtundfünfzig.',
            'Almanca önce birleri, sonra „und“, sonra onlukları söyler – tek kelime olarak: 21 = einundzwanzig (bir-ve-yirmi), 58 = achtundfünfzig.',
            'Zuerst die Einer, dann „und“, dann die Zehner – in einem Wort: 21 = einundzwanzig, 58 = achtundfünfzig.'
          ),
          table: {
            head: [l('tens', 'onluklar', 'Zehner'), l('example', 'örnek', 'Beispiel')],
            rows: [
              ['20 zwanzig', '21 einundzwanzig'],
              ['30 dreißig', '34 vierunddreißig'],
              ['40 vierzig · 50 fünfzig', '45 fünfundvierzig'],
              ['60 sechzig · 70 siebzig', '67 siebenundsechzig'],
              ['80 achtzig · 90 neunzig', '99 neunundneunzig'],
              ['100 hundert', ''],
            ],
          },
          tip: l(
            'Trick: when you hear a number, write the second digit first, then the first.',
            'Püf noktası: bir sayı duyduğunda önce ikinci rakamı, sonra birinciyi yaz.',
            'Trick: Beim Hören zuerst die zweite Ziffer schreiben, dann die erste.'
          ),
        },
        {
          title: l('Prices', 'Fiyatlar', 'Preise'),
          body: l(
            'Wie viel kostet …? / Was kostet …? – Das kostet … 2,50 € = zwei Euro fünfzig (comma, no „und“).',
            'Wie viel kostet …? / Was kostet …? – Das kostet … 2,50 € = zwei Euro fünfzig (virgül, „und“ yok).',
            'Wie viel kostet …? / Was kostet …? – Das kostet … 2,50 € = zwei Euro fünfzig.'
          ),
          examples: [
            { de: 'Was **kostet** ein Brötchen? – Fünfzig Cent.', translation: l('How much is a roll? – Fifty cents.', 'Bir ekmek ne kadar? – Elli sent.', 'Preis') },
            { de: 'Das **macht** zwei Euro zwanzig.', translation: l('That comes to €2.20.', 'Toplam 2,20 avro.', 'Summe') },
          ],
        },
        {
          title: l('Telling the time', 'Saati söylemek', 'Die Uhrzeit'),
          body: l(
            'Wie spät ist es? / Wie viel Uhr ist es? – Es ist acht Uhr. In everyday speech: Viertel nach (quarter past), halb (half TO the next hour!), Viertel vor (quarter to).',
            'Wie spät ist es? / Wie viel Uhr ist es? – Es ist acht Uhr. Günlük konuşmada: Viertel nach (çeyrek geçiyor), halb (bir sonraki saate yarım var!), Viertel vor (çeyrek var).',
            'Wie spät ist es? – Es ist acht Uhr. Umgangssprachlich: Viertel nach, halb (zur nächsten Stunde!), Viertel vor.'
          ),
          table: {
            head: [l('clock', 'saat', 'Uhr'), l('everyday', 'günlük', 'umgangssprachlich'), l('official', 'resmi', 'offiziell')],
            rows: [
              ['8:00', 'acht (Uhr)', 'acht Uhr'],
              ['8:15', 'Viertel nach acht', 'acht Uhr fünfzehn'],
              ['8:30', 'halb neun', 'acht Uhr dreißig'],
              ['8:45', 'Viertel vor neun', 'acht Uhr fünfundvierzig'],
              ['20:00', 'acht (Uhr abends)', 'zwanzig Uhr'],
            ],
          },
          tip: l(
            'halb neun is 8:30 – half way to nine. A classic trap!',
            'halb neun 8:30’dur – dokuza yarım saat var. Klasik bir tuzak!',
            'halb neun ist 8:30 – eine klassische Falle!'
          ),
        },
        {
          title: l('When? um · am · im', 'Ne zaman? um · am · im', 'Wann? um · am · im'),
          body: l(
            'um + clock time · am + day / date / Wochenende · im + month / season.',
            'um + saat · am + gün / tarih / Wochenende · im + ay / mevsim.',
            'um + Uhrzeit · am + Tag / Datum / Wochenende · im + Monat / Jahreszeit.'
          ),
          table: {
            head: [l('um', 'um', 'um'), l('am', 'am', 'am'), l('im', 'im', 'im')],
            rows: [
              ['um 8 Uhr', 'am Montag', 'im Mai'],
              ['um halb neun', 'am Wochenende', 'im Sommer'],
            ],
          },
        },
      ],
    },
    {
      key: 'context',
      kind: 'context',
      title: l('See it in context', 'Bağlamda gör', 'Im Kontext'),
      scene: l('Early morning at the bakery.', 'Sabah erkenden fırında.', 'Früh am Morgen in der Bäckerei.'),
      dialogue: [
        { speaker: 'Elif', de: 'Guten Morgen! Was **kostet** ein Brötchen?', translation: l('Good morning! How much is a roll?', 'Günaydın! Bir küçük ekmek ne kadar?', '') },
        { speaker: 'Verkäufer', de: 'Ein Brötchen **kostet** fünfzig Cent.', translation: l('A roll costs fifty cents.', 'Bir ekmek elli sent.', '') },
        { speaker: 'Elif', de: 'Und die Brezel?', translation: l('And the pretzel?', 'Ya brezel?', '') },
        { speaker: 'Verkäufer', de: 'Eine Brezel **kostet** einen Euro zwanzig.', translation: l('A pretzel costs €1.20.', 'Bir brezel 1,20 avro.', '') },
        { speaker: 'Elif', de: 'Zwei Brötchen und eine Brezel, bitte.', translation: l('Two rolls and a pretzel, please.', 'İki ekmek ve bir brezel, lütfen.', '') },
        { speaker: 'Verkäufer', de: 'Das **macht** zwei Euro zwanzig.', translation: l('That’s €2.20.', 'Toplam 2,20 avro.', '') },
        { speaker: 'Elif', de: 'Bitte schön. Ach – **wie spät ist es**?', translation: l('Here you are. Oh – what time is it?', 'Buyurun. Ah – saat kaç?', '') },
        { speaker: 'Verkäufer', de: 'Es ist **Viertel vor acht**.', translation: l('It’s a quarter to eight.', 'Sekize çeyrek var.', '') },
        { speaker: 'Elif', de: 'Oh! Mein Kurs beginnt **um acht**. Tschüss!', translation: l('Oh! My course starts at eight. Bye!', 'Aa! Kursum sekizde başlıyor. Hoşça kal!', '') },
      ],
      examples: [
        { de: 'Der Kurs ist **am** Montag **um** 9 Uhr.', translation: l('The course is on Monday at 9.', 'Kurs pazartesi saat 9’da.', '') },
        { de: 'Mein Geburtstag ist **im** Mai.', translation: l('My birthday is in May.', 'Doğum günüm mayısta.', '') },
        { de: 'Es ist **halb drei** (2:30).', translation: l('It’s half past two.', 'Saat iki buçuk.', '') },
        { de: 'Das **kostet** drei Euro fünfzig.', translation: l('That costs €3.50.', 'Bu 3,50 avro.', '') },
        { de: 'Heute ist Mittwoch.', translation: l('Today is Wednesday.', 'Bugün çarşamba.', '') },
        { de: '**Wie viel** kostet das?', translation: l('How much is that?', 'Bu ne kadar?', '') },
        { de: '**Am** Wochenende habe ich Zeit.', translation: l('I have time at the weekend.', 'Hafta sonu vaktim var.', '') },
      ],
    },
    {
      key: 'practice-recognize',
      kind: 'practice',
      title: l('Practice 1 · Recognise', 'Pratik 1 · Tanı', 'Übung 1 · Erkennen'),
      intro: l('Numbers, clocks and time words – recognise them first.', 'Sayılar, saatler ve zaman kelimeleri – önce tanı.', 'Zahlen, Uhren und Zeitwörter – erst erkennen.'),
      exercises: ['img-drei-uhr', 'match-numbers', 'mc-21', 'mc-halb-neun', 'tf-viertel', 'sort-um-am-im', 'select-days', 'match-prices'],
    },
    {
      key: 'practice-use',
      kind: 'practice',
      title: l('Practice 2 · Use', 'Pratik 2 · Kullan', 'Übung 2 · Anwenden'),
      intro: l('Now say and write times, prices and numbers yourself.', 'Şimdi saatleri, fiyatları ve sayıları kendin söyle ve yaz.', 'Jetzt sagst und schreibst du Zeiten, Preise und Zahlen selbst.'),
      exercises: [
        'fill-am',
        'mc-wie-spaet',
        'mc-wie-viel',
        'fill-15',
        'fill-30',
        'fill-46',
        'build-acht-uhr',
        'build-kostet',
        'build-wie-spaet',
        'fix-um-montag',
        'fix-uhren',
        'tr-sieben-uhr',
        'tr-freitag',
        'dialog-uhrzeit',
        'dialog-bezahlen',
        'mc-mittwoch',
      ],
    },
    {
      key: 'reading',
      kind: 'reading',
      title: l('Reading', 'Okuma', 'Lesen'),
      intro: l('An ad for a German course.', 'Bir Almanca kursu ilanı.', 'Eine Anzeige für einen Deutschkurs.'),
      passage: [
        '**Deutschkurs A1** – für Anfängerinnen und Anfänger',
        'Der Kurs ist **am** Montag und **am** Mittwoch, von 18 bis 20 Uhr.',
        'Er beginnt **im** März und dauert zehn Wochen.',
        'Der Kurs kostet 240 Euro.',
        '**Am** Freitag **um** 17 Uhr ist unser Sprachcafé. Das Sprachcafé kostet nichts!',
      ],
      glossary: [
        { de: 'von 18 bis 20 Uhr', note: l('from 6 to 8 pm', 'saat 18’den 20’ye kadar', 'Anfang 18 Uhr, Ende 20 Uhr') },
        { de: 'dauern', note: l('to last', 'sürmek', 'Zeit brauchen') },
        { de: 'nichts', note: l('nothing (free)', 'hiçbir şey (ücretsiz)', 'kostenlos') },
      ],
      exercises: ['read-wann', 'read-preis', 'read-cafe', 'read-beginn'],
    },
    {
      key: 'listening',
      kind: 'listening',
      title: l('Listening', 'Dinleme', 'Hören'),
      intro: l('Numbers are easier to read than to hear – listen carefully.', 'Sayıları okumak duymaktan kolaydır – dikkatle dinle.', 'Zahlen hören ist schwerer als lesen – hör genau hin.'),
      exercises: ['listen-34', 'listen-halb', 'listen-donnerstag', 'listen-juli'],
    },
    {
      key: 'speaking',
      kind: 'speaking',
      title: l('Speaking', 'Konuşma', 'Sprechen'),
      prompt: l('Talk about your week and your numbers.', 'Haftanı ve sayılarını anlat.', 'Sprich über deine Woche und deine Zahlen.'),
      points: [
        l('What time is it now? „Es ist …“', 'Şu an saat kaç? „Es ist …“', 'Wie spät ist es jetzt? „Es ist …“'),
        l('When is your course or work? „Am … um …“', 'Kursun ya da işin ne zaman? „Am … um …“', 'Wann ist dein Kurs oder deine Arbeit? „Am … um …“'),
        l('When is your birthday? „Mein Geburtstag ist im …“', 'Doğum günün ne zaman? „Mein Geburtstag ist im …“', 'Wann hast du Geburtstag? „Mein Geburtstag ist im …“'),
        l('Say your phone number digit by digit.', 'Telefon numaranı rakam rakam söyle.', 'Sag deine Telefonnummer Ziffer für Ziffer.'),
      ],
      model: ['Es ist halb zehn.', 'Mein Deutschkurs ist am Dienstag und am Donnerstag um 18 Uhr.', 'Mein Geburtstag ist im Oktober.', 'Meine Telefonnummer ist null – eins – sieben – sechs …'],
    },
    {
      key: 'writing',
      kind: 'writing',
      title: l('Writing', 'Yazma', 'Schreiben'),
      prompt: l(
        'Write at least 3 sentences about your week: what happens when?',
        'Haftan hakkında en az 3 cümle yaz: ne zaman ne oluyor?',
        'Schreib mindestens 3 Sätze über deine Woche: Was ist wann?'
      ),
      minSentences: 3,
      checks: [
        { label: l('um + time', 'um + saat', 'um + Uhrzeit'), pattern: '\\bum (\\d{1,2}([.:]\\d{2})?|halb|Viertel|ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)' },
        { label: l('am + day', 'am + gün', 'am + Tag'), pattern: '\\b[Aa]m (Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Wochenende)\\b' },
        { label: l('im + month', 'im + ay', 'im + Monat'), pattern: '\\b[Ii]m (Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\\b' },
      ],
      model: ['Am Montag arbeite ich von 8 bis 16 Uhr.', 'Mein Deutschkurs ist am Mittwoch um 18 Uhr.', 'Am Wochenende habe ich Zeit.', 'Im August habe ich Urlaub.'],
    },
    {
      key: 'speed',
      kind: 'timed',
      title: l('Speed round', 'Hız turu', 'Schnellrunde'),
      intro: l('Read the number word – pick the number. 60 seconds!', 'Sayı kelimesini oku – sayıyı seç. 60 saniye!', 'Lies das Zahlwort – wähle die Zahl. 60 Sekunden!'),
      seconds: 60,
      pool: DRILL_NUMBERS.map((n) => `num-${n}`),
    },
    {
      key: 'review',
      kind: 'review',
      title: l('Review', 'Tekrar', 'Wiederholung'),
      intro: l(
        'Your mistakes in this unit – with the correct form. Practise them once more now.',
        'Bu ünitedeki hataların – doğru biçimleriyle. Şimdi bir kez daha çalış.',
        'Deine Fehler in dieser Einheit – mit der richtigen Form. Übe sie jetzt noch einmal.'
      ),
    },
    { key: 'summary', kind: 'summary', title: l('Mastery', 'Ustalık', 'Abschluss') },
  ],
  summary: {
    learned: [
      l('Numbers 0–100 – and 21–99 backwards', 'Sayılar 0–100 – ve 21–99 tersten', 'Zahlen 0–100 – und 21–99 rückwärts'),
      l('Prices: Was kostet …? Das kostet …', 'Fiyatlar: Was kostet …? Das kostet …', 'Preise: Was kostet …? Das kostet …'),
      l('Clock times: Viertel nach, halb, Viertel vor', 'Saatler: Viertel nach, halb, Viertel vor', 'Uhrzeiten: Viertel nach, halb, Viertel vor'),
      l('um + time, am + day, im + month', 'um + saat, am + gün, im + ay', 'um + Uhrzeit, am + Tag, im + Monat'),
      l('Days of the week and months', 'Haftanın günleri ve aylar', 'Wochentage und Monate'),
    ],
    mistakes: [
      { wrong: 'halb neun = 9:30', right: 'halb neun = 8:30', note: l('halb = half TO the next hour.', 'halb = bir sonraki saate yarım var.', 'halb = zur nächsten Stunde.') },
      { wrong: 'zwanzigeins', right: 'einundzwanzig', note: l('Ones first, then tens.', 'Önce birler, sonra onluklar.', 'Erst Einer, dann Zehner.') },
      { wrong: 'um Montag', right: 'am Montag', note: l('Days → am.', 'Günler → am.', 'Tage → am.') },
      { wrong: 'dreizig', right: 'dreißig', note: l('30 is spelt with ß.', '30 ß ile yazılır.', '30 schreibt man mit ß.') },
    ],
  },
}
