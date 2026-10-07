import type { CourseUnit, Exercise, Gender, VocabItem } from '../types'
import { l } from '../l10n'

const VOCAB: VocabItem[] = [
  { word: 'Tisch', gender: 'm', plural: 'die Tische', emoji: '🍽️', translation: l('table', 'masa', 'Tisch'), example: 'Die Tische sind neu.' },
  { word: 'Schuh', gender: 'm', plural: 'die Schuhe', emoji: '👟', translation: l('shoe', 'ayakkabı', 'Schuh'), example: 'Die Schuhe sind teuer.' },
  { word: 'Stuhl', gender: 'm', plural: 'die Stühle', emoji: '🪑', translation: l('chair', 'sandalye', 'Stuhl'), example: 'Wir haben vier Stühle.' },
  { word: 'Blume', gender: 'f', plural: 'die Blumen', emoji: '🌸', translation: l('flower', 'çiçek', 'Blume'), example: 'Die Blumen sind schön.' },
  { word: 'Frau', gender: 'f', plural: 'die Frauen', emoji: '👩', translation: l('woman', 'kadın', 'Frau'), example: 'Die Frauen arbeiten.' },
  { word: 'Zeitung', gender: 'f', plural: 'die Zeitungen', emoji: '📰', translation: l('newspaper', 'gazete', 'Zeitung'), example: 'Die Zeitungen liegen hier.' },
  { word: 'Kind', gender: 'n', plural: 'die Kinder', emoji: '🧒', translation: l('child', 'çocuk', 'Kind'), example: 'Die Kinder spielen.' },
  { word: 'Buch', gender: 'n', plural: 'die Bücher', emoji: '📖', translation: l('book', 'kitap', 'Buch'), example: 'Die Bücher kosten einen Euro.' },
  { word: 'Ei', gender: 'n', plural: 'die Eier', emoji: '🥚', translation: l('egg', 'yumurta', 'Ei'), example: 'Ich kaufe sechs Eier.' },
  { word: 'Auto', gender: 'n', plural: 'die Autos', emoji: '🚗', translation: l('car', 'araba', 'Auto'), example: 'Die Autos sind schnell.' },
  { word: 'Foto', gender: 'n', plural: 'die Fotos', emoji: '📷', translation: l('photo', 'fotoğraf', 'Foto'), example: 'Die Fotos sind toll.' },
  { word: 'Apfel', gender: 'm', plural: 'die Äpfel', emoji: '🍎', translation: l('apple', 'elma', 'Apfel'), example: 'Ich kaufe zwei Äpfel.' },
]

const MORE_VOCAB: VocabItem[] = [
  { word: 'Lehrer', gender: 'm', plural: 'die Lehrer', translation: l('teacher', 'öğretmen', 'Lehrer') },
  { word: 'Fenster', gender: 'n', plural: 'die Fenster', translation: l('window', 'pencere', 'Fenster') },
  { word: 'Lampe', gender: 'f', plural: 'die Lampen', translation: l('lamp', 'lamba', 'Lampe') },
  { word: 'Handy', gender: 'n', plural: 'die Handys', translation: l('mobile phone', 'cep telefonu', 'Handy') },
  { word: 'Glas', gender: 'n', plural: 'die Gläser', translation: l('glass', 'bardak', 'Glas') },
  { word: 'Haus', gender: 'n', plural: 'die Häuser', translation: l('house', 'ev', 'Haus') },
  { word: 'Banane', gender: 'f', plural: 'die Bananen', translation: l('banana', 'muz', 'Banane') },
  { word: 'Flohmarkt', gender: 'm', plural: 'die Flohmärkte', translation: l('flea market', 'bit pazarı', 'Flohmarkt') },
  { word: 'viele', translation: l('many', 'birçok', 'viele') },
]

const ART: Record<Gender, string> = { m: 'der', f: 'die', n: 'das' }

/** "das Buch → die ___" drills with typical wrong endings as distractors. */
function pluralDrills(): Exercise[] {
  return [...VOCAB, ...MORE_VOCAB]
    .filter((v): v is VocabItem & { gender: Gender; plural: string } => Boolean(v.gender && v.plural))
    .map((v, i) => {
      const plural = v.plural.replace(/^die /, '')
      const base = v.word
      // Plausible wrong endings for the shape of the word (no "Lehrerer" or "Bananee").
      const candidates = base.endsWith('e')
        ? [`${base}n`, `${base}s`, base]
        : /(er|el|en)$/.test(base)
          ? [base, `${base}n`, `${base}s`, `${base}e`]
          : [`${base}e`, `${base}en`, `${base}er`, `${base}s`, base]
      const wrong = [...new Set(candidates)].filter((c) => c !== plural)
      const distractors = [...new Set([wrong[i % wrong.length], wrong[(i + 1) % wrong.length]])]
      const distinct = [plural, ...distractors]
      const rotation = i % distinct.length
      const options = [...distinct.slice(rotation), ...distinct.slice(0, rotation)]
      return {
        id: `pl-${base.toLowerCase()}`,
        type: 'multiple_choice' as const,
        topic: 'patterns',
        concept: 'plural-form',
        skill: 'vocabulary' as const,
        difficulty: 1 as const,
        prompt: `${v.emoji ? `${v.emoji} ` : ''}${ART[v.gender]} ${base} → die ___`,
        options,
        answer: options.indexOf(plural),
        explanation: l(
          `${ART[v.gender]} ${base} → die ${plural}. Learn the plural together with the noun.`,
          `${ART[v.gender]} ${base} → die ${plural}. Çoğulu isimle birlikte öğren.`,
          `${ART[v.gender]} ${base} → die ${plural}. Lerne den Plural mit dem Nomen.`
        ),
        examples: [`**die ${plural}**`],
      }
    })
}

const EXERCISES: Exercise[] = [
  // --- Practice 1: recognise ----------------------------------------------
  {
    id: 'img-blumen',
    type: 'image_choice',
    topic: 'vocabulary',
    concept: 'singular-plural',
    skill: 'vocabulary',
    difficulty: 1,
    prompt: 'die Blumen',
    options: [
      { emoji: '🌸', label: 'die Blume (1)' },
      { emoji: '💐', label: 'die Blumen (viele)' },
    ],
    answer: 1,
    explanation: l(
      'die Blume = one flower, die Blumen = several flowers (-n).',
      'die Blume = bir çiçek, die Blumen = birçok çiçek (-n).',
      'die Blume = eine, die Blumen = mehrere (-n).'
    ),
    examples: ['**Die Blumen** sind schön.'],
  },
  {
    id: 'match-singular-plural',
    type: 'matching',
    topic: 'patterns',
    concept: 'plural-form',
    skill: 'vocabulary',
    difficulty: 1,
    instructions: l('Match singular and plural.', 'Tekil ve çoğulu eşleştir.', 'Ordne Singular und Plural zu.'),
    pairs: [
      { left: 'der Tisch', right: 'die Tische' },
      { left: 'die Frau', right: 'die Frauen' },
      { left: 'das Kind', right: 'die Kinder' },
      { left: 'das Auto', right: 'die Autos' },
    ],
    explanation: l(
      'Four typical plural endings: -e (Tische), -en (Frauen), -er (Kinder), -s (Autos).',
      'Dört tipik çoğul eki: -e (Tische), -en (Frauen), -er (Kinder), -s (Autos).',
      'Vier typische Endungen: -e (Tische), -en (Frauen), -er (Kinder), -s (Autos).'
    ),
  },
  {
    id: 'mc-die-kinder',
    type: 'multiple_choice',
    topic: 'article',
    concept: 'plural-article',
    skill: 'grammar',
    difficulty: 1,
    prompt: '___ Kinder spielen im Park.',
    options: ['Der', 'Die', 'Das'],
    answer: 1,
    explanation: l(
      'In the plural the article is always die – even for das Kind: die Kinder.',
      'Çoğulda artikel her zaman die’dir – das Kind için bile: die Kinder.',
      'Im Plural ist der Artikel immer die – auch bei das Kind: die Kinder.'
    ),
    examples: ['**Die Kinder** spielen im Park.'],
    practice: ['mc-die-tische'],
  },
  {
    id: 'mc-die-tische',
    type: 'multiple_choice',
    topic: 'article',
    concept: 'plural-article',
    skill: 'grammar',
    difficulty: 1,
    prompt: '___ Tische sind neu.',
    options: ['Der', 'Die', 'Das'],
    answer: 1,
    explanation: l('der Tisch → die Tische.', 'der Tisch → die Tische.', 'der Tisch → die Tische.'),
    examples: ['**Die Tische** sind neu.'],
  },
  {
    id: 'sort-endings',
    type: 'categorize',
    topic: 'patterns',
    concept: 'plural-ending',
    skill: 'grammar',
    difficulty: 2,
    instructions: l('Sort the plurals by their ending.', 'Çoğulları eklerine göre ayır.', 'Sortiere die Pluralformen nach der Endung.'),
    categories: ['-e', '-(e)n', '-er', '-s'],
    items: [
      { text: 'Schuhe', category: 0 },
      { text: 'Blumen', category: 1 },
      { text: 'Eier', category: 2 },
      { text: 'Fotos', category: 3 },
      { text: 'Tische', category: 0 },
      { text: 'Zeitungen', category: 1 },
      { text: 'Bücher', category: 2 },
      { text: 'Handys', category: 3 },
    ],
    explanation: l(
      '-e: Schuhe, Tische · -(e)n: Blumen, Zeitungen · -er: Eier, Bücher · -s: Fotos, Handys.',
      '-e: Schuhe, Tische · -(e)n: Blumen, Zeitungen · -er: Eier, Bücher · -s: Fotos, Handys.',
      '-e: Schuhe, Tische · -(e)n: Blumen, Zeitungen · -er: Eier, Bücher · -s: Fotos, Handys.'
    ),
  },
  {
    id: 'tf-buchs',
    type: 'true_false',
    topic: 'patterns',
    concept: 'plural-form',
    skill: 'grammar',
    difficulty: 1,
    statement: 'das Buch → die Buchs',
    answer: false,
    explanation: l('das Buch → die Bücher (umlaut + -er).', 'das Buch → die Bücher (umlaut + -er).', 'das Buch → die Bücher (Umlaut + -er).'),
    examples: ['**die Bücher**'],
  },
  {
    id: 'select-plural',
    type: 'multiple_select',
    topic: 'article',
    concept: 'singular-plural',
    skill: 'grammar',
    difficulty: 1,
    promptL10n: l('Select all plural forms.', 'Tüm çoğul biçimleri seç.', 'Wähle alle Pluralformen.'),
    options: ['die Tische', 'der Tisch', 'die Autos', 'das Auto', 'die Frauen', 'die Frau'],
    answers: [0, 2, 4],
    explanation: l(
      'die Frau is singular (feminine). Look at the ending: Tische, Autos, Frauen.',
      'die Frau tekildir (dişil). Eke bak: Tische, Autos, Frauen.',
      'die Frau ist Singular (feminin). Achte auf die Endung: Tische, Autos, Frauen.'
    ),
  },
  {
    id: 'mc-foto',
    type: 'multiple_choice',
    topic: 'patterns',
    concept: 'plural-s',
    skill: 'grammar',
    difficulty: 1,
    prompt: 'das Foto → die ___',
    options: ['Fotos', 'Foten', 'Fötos'],
    answer: 0,
    explanation: l(
      'Words ending in -o, -a, -i and many foreign words take -s: Fotos, Autos, Handys.',
      '-o, -a, -i ile biten kelimeler ve birçok yabancı kelime -s alır: Fotos, Autos, Handys.',
      'Wörter auf -o, -a, -i und viele Fremdwörter: -s (Fotos, Autos, Handys).'
    ),
    examples: ['**die Fotos**'],
  },
  {
    id: 'match-umlaut',
    type: 'matching',
    topic: 'patterns',
    concept: 'plural-umlaut',
    skill: 'vocabulary',
    difficulty: 2,
    instructions: l('These plurals get an umlaut. Match them.', 'Bu çoğullar umlaut alıyor. Eşleştir.', 'Diese Pluralformen haben einen Umlaut. Ordne zu.'),
    pairs: [
      { left: 'der Apfel', right: 'die Äpfel' },
      { left: 'der Stuhl', right: 'die Stühle' },
      { left: 'das Haus', right: 'die Häuser' },
      { left: 'das Glas', right: 'die Gläser' },
    ],
    explanation: l(
      'a → ä, o → ö, u → ü, au → äu. Apfel only changes the vowel – no ending.',
      'a → ä, o → ö, u → ü, au → äu. Apfel yalnızca sesli harfi değiştirir – ek yok.',
      'a → ä, o → ö, u → ü, au → äu. Apfel ändert nur den Vokal.'
    ),
  },

  // --- Practice 2: use -----------------------------------------------------
  {
    id: 'fill-blumen',
    type: 'fill_blank',
    topic: 'patterns',
    concept: 'plural-en',
    skill: 'grammar',
    difficulty: 1,
    sentence: 'eine Blume, zwei ___',
    accepted: ['Blumen'],
    explanation: l(
      'Feminine nouns in -e add -n: Blume → Blumen.',
      '-e ile biten dişil isimler -n alır: Blume → Blumen.',
      'Feminine Nomen auf -e: + n → Blumen.'
    ),
    examples: ['zwei **Blumen**'],
    practice: ['fill-kinder'],
  },
  {
    id: 'fill-kinder',
    type: 'fill_blank',
    topic: 'patterns',
    concept: 'plural-er',
    skill: 'grammar',
    difficulty: 1,
    sentence: 'ein Kind, drei ___',
    accepted: ['Kinder'],
    explanation: l('das Kind → die Kinder (-er).', 'das Kind → die Kinder (-er).', 'das Kind → die Kinder (-er).'),
    examples: ['drei **Kinder**'],
  },
  {
    id: 'mc-spielen',
    type: 'multiple_choice',
    topic: 'verb',
    concept: 'plural-verb',
    skill: 'grammar',
    difficulty: 2,
    prompt: 'Die Kinder ___ im Garten.',
    options: ['spielt', 'spielen', 'spielst'],
    answer: 1,
    explanation: l(
      'Plural subject = sie (they) → verb -en: die Kinder spielen.',
      'Çoğul özne = sie (onlar) → fiil -en: die Kinder spielen.',
      'Plural-Subjekt = sie → Verb auf -en: die Kinder spielen.'
    ),
    examples: ['Die Kinder **spielen**.', 'Die Autos **sind** neu.'],
    practice: ['fix-autos-ist'],
  },
  {
    id: 'build-buecher',
    type: 'sentence_builder',
    topic: 'verb',
    concept: 'plural-verb',
    skill: 'grammar',
    difficulty: 1,
    chips: ['kosten', 'Die Bücher', 'zwei Euro'],
    answers: [['Die Bücher', 'kosten', 'zwei Euro']],
    translation: l('The books cost two euros.', 'Kitaplar iki avro.', 'Die Bücher kosten zwei Euro.'),
    explanation: l('Plural → kosten (not kostet).', 'Çoğul → kosten (kostet değil).', 'Plural → kosten.'),
    examples: ['Die Bücher **kosten** zwei Euro.'],
  },
  {
    id: 'build-keine-kinder',
    type: 'sentence_builder',
    topic: 'article',
    concept: 'plural-keine',
    skill: 'grammar',
    difficulty: 2,
    chips: ['keine', 'habe', 'Ich', 'Kinder'],
    answers: [['Ich', 'habe', 'keine', 'Kinder']],
    translation: l('I have no children.', 'Çocuğum yok.', 'Ich habe keine Kinder.'),
    explanation: l(
      'ein has no plural – but kein does: keine Kinder.',
      'ein’in çoğulu yoktur – ama kein’in vardır: keine Kinder.',
      'ein hat keinen Plural – kein schon: keine Kinder.'
    ),
    examples: ['Ich habe **keine** Kinder.'],
  },
  {
    id: 'fix-zwei-kind',
    type: 'error_correction',
    topic: 'patterns',
    concept: 'plural-er',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Ich habe zwei Kind.',
    accepted: ['Ich habe zwei Kinder.'],
    explanation: l('After zwei, drei … use the plural: zwei Kinder.', 'zwei, drei … sonrası çoğul: zwei Kinder.', 'Nach zwei, drei …: Plural → zwei Kinder.'),
    examples: ['Ich habe zwei **Kinder**.'],
  },
  {
    id: 'fix-autos-ist',
    type: 'error_correction',
    topic: 'verb',
    concept: 'plural-verb',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Die Autos ist neu.',
    accepted: ['Die Autos sind neu.'],
    explanation: l('Plural → sind.', 'Çoğul → sind.', 'Plural → sind.'),
    examples: ['Die Autos **sind** neu.'],
  },
  {
    id: 'tr-zwei-buecher',
    type: 'translation',
    topic: 'patterns',
    concept: 'plural-umlaut',
    skill: 'writing',
    difficulty: 2,
    source: l('two books', 'iki kitap', 'two books'),
    accepted: ['zwei Bücher'],
    hint: l('das Buch → die B…', 'das Buch → die B…', 'das Buch → die B…'),
    explanation: l(
      'In German, numbers are followed by the plural: zwei Bücher (Turkish says iki kitap!).',
      'Almancada sayıdan sonra çoğul gelir: zwei Bücher (Türkçede „iki kitap“ denir!).',
      'Nach Zahlen steht der Plural: zwei Bücher.'
    ),
    examples: ['zwei **Bücher**'],
  },
  {
    id: 'tr-kinder-spielen',
    type: 'translation',
    topic: 'verb',
    concept: 'plural-verb',
    skill: 'writing',
    difficulty: 2,
    source: l('The children are playing.', 'Çocuklar oynuyor.', 'The children are playing.'),
    accepted: ['Die Kinder spielen.'],
    explanation: l('die Kinder + spielen.', 'die Kinder + spielen.', 'die Kinder + spielen.'),
    examples: ['Die Kinder **spielen**.'],
  },
  {
    id: 'dialog-stuehle',
    type: 'dialogue',
    topic: 'verb',
    concept: 'plural-verb',
    skill: 'grammar',
    difficulty: 2,
    lines: [{ speaker: 'Käufer', de: 'Was kosten die Stühle?' }],
    options: ['Die Stühle kosten zehn Euro.', 'Die Stühle kostet zehn Euro.', 'Der Stühle kosten zehn Euro.'],
    answer: 0,
    explanation: l('die Stühle (plural) + kosten.', 'die Stühle (çoğul) + kosten.', 'die Stühle (Plural) + kosten.'),
    examples: ['Die Stühle **kosten** zehn Euro.'],
  },
  {
    id: 'mc-lehrer',
    type: 'multiple_choice',
    topic: 'patterns',
    concept: 'plural-none',
    skill: 'grammar',
    difficulty: 2,
    prompt: 'der Lehrer → die ___',
    options: ['Lehrer', 'Lehrern', 'Lehrers'],
    answer: 0,
    explanation: l(
      'Masculine and neuter nouns in -er, -el, -en often stay the same: die Lehrer, die Fenster.',
      '-er, -el, -en ile biten eril ve nötr isimler çoğu zaman aynı kalır: die Lehrer, die Fenster.',
      'Maskuline und neutrale Nomen auf -er, -el, -en bleiben oft gleich: die Lehrer, die Fenster.'
    ),
    examples: ['der Lehrer → **die Lehrer**'],
  },
  {
    id: 'fill-zeitungen',
    type: 'fill_blank',
    topic: 'patterns',
    concept: 'plural-en',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'die Zeitung → die ___',
    accepted: ['Zeitungen'],
    explanation: l('-ung → -ungen, always.', '-ung → -ungen, her zaman.', '-ung → -ungen, immer.'),
    examples: ['**die Zeitungen**'],
  },

  // --- Reading ------------------------------------------------------------
  {
    id: 'read-wann',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-flohmarkt',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Wann ist der Flohmarkt?',
    options: ['Am Samstag.', 'Am Sonntag.', 'Am Montag.'],
    answer: 0,
    explanation: l('„Flohmarkt am Samstag!“', '„Flohmarkt am Samstag!“', '„Flohmarkt am Samstag!“'),
  },
  {
    id: 'read-stuehle',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-flohmarkt',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Wie viele Stühle gibt es?',
    options: ['zwei', 'drei', 'vier'],
    answer: 1,
    explanation: l('„drei Stühle“', '„drei Stühle“', '„drei Stühle“'),
  },
  {
    id: 'read-buecher',
    type: 'true_false',
    topic: 'reading',
    concept: 'reading-flohmarkt',
    skill: 'reading',
    difficulty: 1,
    statement: 'Die Bücher kosten fünf Euro.',
    answer: false,
    explanation: l('„Die Bücher kosten einen Euro.“', '„Die Bücher kosten einen Euro.“ – beş değil bir avro.', '„Die Bücher kosten einen Euro.“'),
  },
  {
    id: 'read-lampen',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-flohmarkt',
    skill: 'reading',
    difficulty: 2,
    prompt: 'Wie sind die Lampen?',
    options: ['alt', 'fast neu', 'kaputt'],
    answer: 1,
    explanation: l('„Die Lampen sind fast neu.“', '„Die Lampen sind fast neu.“', '„Die Lampen sind fast neu.“'),
  },

  // --- Listening ---------------------------------------------------------
  {
    id: 'listen-bananen',
    type: 'listening_choice',
    topic: 'patterns',
    concept: 'plural-en',
    skill: 'listening',
    difficulty: 1,
    audio: 'Ich kaufe zwei Äpfel und drei Bananen.',
    question: l('How many bananas?', 'Kaç muz?', 'Wie viele Bananen?'),
    options: ['2', '3', '5'],
    answer: 1,
    explanation: l('„drei Bananen“', '„drei Bananen“', '„drei Bananen“'),
  },
  {
    id: 'listen-garten',
    type: 'listening_choice',
    topic: 'verb',
    concept: 'plural-verb',
    skill: 'listening',
    difficulty: 1,
    audio: 'Die Kinder spielen im Garten.',
    question: l('Who is playing?', 'Kim oynuyor?', 'Wer spielt?'),
    options: ['das Kind', 'die Kinder', 'die Frau'],
    answer: 1,
    explanation: l('„Die Kinder spielen“ – several children.', '„Die Kinder spielen“ – birden fazla çocuk.', '„Die Kinder spielen“ – mehrere Kinder.'),
  },
  {
    id: 'listen-stuehle',
    type: 'listening_choice',
    topic: 'patterns',
    concept: 'plural-umlaut',
    skill: 'listening',
    difficulty: 2,
    audio: 'Wir haben nur vier Stühle.',
    question: l('How many chairs?', 'Kaç sandalye?', 'Wie viele Stühle?'),
    options: ['4', '14', '40'],
    answer: 0,
    explanation: l('vier = 4.', 'vier = 4.', 'vier = 4.'),
  },
  {
    id: 'listen-zeitungen',
    type: 'listening_choice',
    topic: 'article',
    concept: 'singular-plural',
    skill: 'listening',
    difficulty: 2,
    audio: 'die Zeitungen',
    question: l('Singular or plural?', 'Tekil mi çoğul mu?', 'Singular oder Plural?'),
    options: ['Singular', 'Plural'],
    answer: 1,
    explanation: l('Zeitung-en: the ending -en marks the plural.', 'Zeitung-en: -en eki çoğulu gösterir.', 'Die Endung -en zeigt den Plural.'),
  },

  ...pluralDrills(),
]

export const UNIT06_PLURAL: CourseUnit = {
  level: 'A1',
  number: 6,
  slug: 'plural',
  titleDe: 'Plural',
  title: l('Plural', 'Çoğul', 'Plural'),
  goal: l(
    'By the end of this unit you can recognise and form the plural of common nouns and use it with numbers, die, keine and the right verb.',
    'Bu ünitenin sonunda yaygın isimlerin çoğulunu tanıyıp kurabilir; sayılar, die, keine ve doğru fiille kullanabilirsin.',
    'Am Ende dieser Einheit erkennst und bildest du den Plural häufiger Nomen und benutzt ihn mit Zahlen, die, keine und dem richtigen Verb.'
  ),
  minutes: [15, 20],
  topics: [
    { key: 'patterns', label: l('Plural endings', 'Çoğul ekleri', 'Pluralendungen') },
    { key: 'article', label: l('die / keine in the plural', 'Çoğulda die / keine', 'die / keine im Plural') },
    { key: 'verb', label: l('Plural verbs', 'Çoğul fiil', 'Verb im Plural') },
    { key: 'vocabulary', label: l('Vocabulary', 'Kelime', 'Wortschatz') },
  ],
  vocabulary: [...VOCAB, ...MORE_VOCAB],
  exercises: EXERCISES,
  mastery: { minAnswered: 0.7, minAccuracy: 0.7 },
  sections: [
    {
      key: 'discover',
      kind: 'discover',
      title: l('Discover', 'Keşfet', 'Entdecken'),
      intro: l('Tap a card: you see the singular and the plural.', 'Bir karta dokun: tekili ve çoğulu görürsün.', 'Tippe auf eine Karte: Singular und Plural.'),
      cards: VOCAB,
    },
    {
      key: 'understand',
      kind: 'understand',
      title: l('Understand', 'Anla', 'Verstehen'),
      rules: [
        {
          title: l('Plural article: always die', 'Çoğul artikeli: her zaman die', 'Plural-Artikel: immer die'),
          body: l(
            'Whatever the singular – der, die or das – the plural is always die. ein has no plural (zwei Bücher), kein becomes keine.',
            'Tekil ne olursa olsun – der, die ya da das – çoğul her zaman die’dir. ein’in çoğulu yoktur (zwei Bücher), kein → keine olur.',
            'Egal ob der, die oder das – im Plural immer die. ein hat keinen Plural (zwei Bücher), kein wird keine.'
          ),
          table: {
            head: [l('singular', 'tekil', 'Singular'), l('plural', 'çoğul', 'Plural')],
            rows: [
              ['der Tisch', 'die Tische'],
              ['die Frau', 'die Frauen'],
              ['das Kind', 'die Kinder'],
            ],
          },
        },
        {
          title: l('Five plural patterns', 'Beş çoğul kalıbı', 'Fünf Pluralmuster'),
          body: l(
            'There is no single rule – but most nouns follow one of these patterns. Some also get an umlaut (ä, ö, ü).',
            'Tek bir kural yok – ama isimlerin çoğu bu kalıplardan birine uyar. Bazıları umlaut da alır (ä, ö, ü).',
            'Es gibt keine einzige Regel – aber die meisten Nomen folgen diesen Mustern. Manche bekommen auch einen Umlaut.'
          ),
          table: {
            head: [l('ending', 'ek', 'Endung'), l('example', 'örnek', 'Beispiel'), l('often for …', 'çoğunlukla …', 'oft bei …')],
            rows: [
              ['-e', 'Tisch → Tische, Stuhl → Stühle', 'der-Wörter'],
              ['-(e)n', 'Frau → Frauen, Blume → Blumen', 'die-Wörter'],
              ['-er', 'Kind → Kinder, Buch → Bücher', 'das-Wörter'],
              ['-s', 'Auto → Autos, Foto → Fotos', '-o, -a, -i, Fremdwörter'],
              ['–', 'Lehrer → Lehrer, Apfel → Äpfel', '-er, -el, -en'],
            ],
          },
        },
        {
          title: l('Safe bets', 'Kesin kurallar', 'Sichere Regeln'),
          body: l(
            'die-words ending in -e → -n (Lampe → Lampen). -ung, -heit, -keit → -en (Zeitung → Zeitungen). Words ending in -o, -a, -i → -s (Kino → Kinos).',
            '-e ile biten die-kelimeleri → -n (Lampe → Lampen). -ung, -heit, -keit → -en (Zeitung → Zeitungen). -o, -a, -i ile bitenler → -s (Kino → Kinos).',
            'die-Wörter auf -e → -n (Lampen). -ung, -heit, -keit → -en (Zeitungen). Wörter auf -o, -a, -i → -s (Kinos).'
          ),
          tip: l(
            'Always learn three things: der Tisch, die Tische. Article + singular + plural.',
            'Her zaman üç şeyi öğren: der Tisch, die Tische. Artikel + tekil + çoğul.',
            'Lerne immer drei Dinge: der Tisch, die Tische.'
          ),
        },
        {
          title: l('Plural + verb', 'Çoğul + fiil', 'Plural + Verb'),
          body: l(
            'A plural subject is like sie (they): the verb ends in -en, sein becomes sind.',
            'Çoğul özne sie (onlar) gibidir: fiil -en ile biter, sein → sind olur.',
            'Ein Plural-Subjekt ist wie sie (Plural): Verb auf -en, sein → sind.'
          ),
          examples: [
            { de: 'Die Kinder **spielen**.', translation: l('The children are playing.', 'Çocuklar oynuyor.', 'Plural: spielen') },
            { de: 'Die Schuhe **sind** teuer.', translation: l('The shoes are expensive.', 'Ayakkabılar pahalı.', 'Plural: sind') },
          ],
        },
      ],
    },
    {
      key: 'context',
      kind: 'context',
      title: l('See it in context', 'Bağlamda gör', 'Im Kontext'),
      scene: l('Saturday at the flea market.', 'Cumartesi bit pazarında.', 'Samstag auf dem Flohmarkt.'),
      dialogue: [
        { speaker: 'Lea', de: 'Guten Tag! Was **kosten** die **Bücher**?', translation: l('Hello! How much are the books?', 'İyi günler! Kitaplar ne kadar?', '') },
        { speaker: 'Verkäufer', de: 'Die **Bücher kosten** einen Euro.', translation: l('The books are one euro.', 'Kitaplar bir avro.', '') },
        { speaker: 'Lea', de: 'Und die **Lampen**?', translation: l('And the lamps?', 'Ya lambalar?', '') },
        { speaker: 'Verkäufer', de: 'Die **Lampen sind** fast neu. Sie **kosten** acht Euro.', translation: l('The lamps are almost new. They cost eight euros.', 'Lambalar neredeyse yeni. Sekiz avro.', '') },
        { speaker: 'Lea', de: 'Haben Sie auch **Stühle**?', translation: l('Do you also have chairs?', 'Sandalyeniz de var mı?', '') },
        { speaker: 'Verkäufer', de: 'Ja, drei **Stühle**. Aber **keine Tische**.', translation: l('Yes, three chairs. But no tables.', 'Evet, üç sandalye. Ama masa yok.', '') },
        { speaker: 'Lea', de: 'Gut, dann nehme ich zwei **Bücher** und zwei **Stühle**.', translation: l('Good, then I’ll take two books and two chairs.', 'Tamam, o zaman iki kitap ve iki sandalye alıyorum.', '') },
      ],
      examples: [
        { de: 'der Tisch → **die Tische**', translation: l('table – tables', 'masa – masalar', '') },
        { de: 'die Frau → **die Frauen**', translation: l('woman – women', 'kadın – kadınlar', '') },
        { de: 'das Kind → **die Kinder**', translation: l('child – children', 'çocuk – çocuklar', '') },
        { de: 'das Auto → **die Autos**', translation: l('car – cars', 'araba – arabalar', '') },
        { de: 'Ich habe zwei **Brüder** und **keine** Schwestern.', translation: l('I have two brothers and no sisters.', 'İki erkek kardeşim var, kız kardeşim yok.', '') },
        { de: 'Die **Äpfel** kosten zwei Euro.', translation: l('The apples cost two euros.', 'Elmalar iki avro.', '') },
        { de: 'Die Kinder **sind** im Garten.', translation: l('The children are in the garden.', 'Çocuklar bahçede.', '') },
      ],
    },
    {
      key: 'practice-recognize',
      kind: 'practice',
      title: l('Practice 1 · Recognise', 'Pratik 1 · Tanı', 'Übung 1 · Erkennen'),
      intro: l('Recognise plural forms and their endings.', 'Çoğul biçimleri ve eklerini tanı.', 'Erkenne Pluralformen und ihre Endungen.'),
      exercises: ['img-blumen', 'match-singular-plural', 'mc-die-kinder', 'sort-endings', 'tf-buchs', 'select-plural', 'mc-foto', 'match-umlaut', 'mc-lehrer'],
    },
    {
      key: 'practice-use',
      kind: 'practice',
      title: l('Practice 2 · Use', 'Pratik 2 · Kullan', 'Übung 2 · Anwenden'),
      intro: l('Now form plurals yourself and use them in sentences.', 'Şimdi çoğulları kendin kur ve cümlede kullan.', 'Jetzt bildest du den Plural selbst und benutzt ihn im Satz.'),
      exercises: [
        'fill-blumen',
        'fill-kinder',
        'fill-zeitungen',
        'mc-spielen',
        'build-buecher',
        'build-keine-kinder',
        'fix-zwei-kind',
        'fix-autos-ist',
        'tr-zwei-buecher',
        'tr-kinder-spielen',
        'dialog-stuehle',
        'mc-die-tische',
      ],
    },
    {
      key: 'reading',
      kind: 'reading',
      title: l('Reading', 'Okuma', 'Lesen'),
      intro: l('An ad for a flea market.', 'Bir bit pazarı ilanı.', 'Eine Anzeige für einen Flohmarkt.'),
      passage: [
        '**Flohmarkt am Samstag!** Schillerstraße 4, von 9 bis 14 Uhr.',
        'Wir verkaufen drei **Stühle**, zwei **Lampen**, viele **Bücher** und **Spiele** für **Kinder**.',
        'Die **Bücher** kosten einen Euro. Die **Stühle** kosten fünf Euro.',
        'Die **Lampen** sind fast neu!',
      ],
      glossary: [
        { de: 'verkaufen', note: l('to sell', 'satmak', 'gegen Geld geben') },
        { de: 'das Spiel, die Spiele', note: l('game, games', 'oyun, oyunlar', 'Spiel') },
        { de: 'fast', note: l('almost', 'neredeyse', 'beinahe') },
      ],
      exercises: ['read-wann', 'read-stuehle', 'read-buecher', 'read-lampen'],
    },
    {
      key: 'listening',
      kind: 'listening',
      title: l('Listening', 'Dinleme', 'Hören'),
      intro: l('Listen for the plural endings.', 'Çoğul eklerine kulak ver.', 'Hör auf die Pluralendungen.'),
      exercises: ['listen-bananen', 'listen-garten', 'listen-stuehle', 'listen-zeitungen'],
    },
    {
      key: 'speaking',
      kind: 'speaking',
      title: l('Speaking', 'Konuşma', 'Sprechen'),
      prompt: l('What do you have at home? Count things.', 'Evde neler var? Eşyaları say.', 'Was hast du zu Hause? Zähl Dinge.'),
      points: [
        l('„Ich habe zwei …“ (plural!)', '„Ich habe zwei …“ (çoğul!)', '„Ich habe zwei …“ (Plural!)'),
        l('„Die … sind …“ (e.g. neu, alt, schön)', '„Die … sind …“ (ör. neu, alt, schön)', '„Die … sind …“ (z. B. neu, alt, schön)'),
        l('„Ich habe keine …“', '„Ich habe keine …“', '„Ich habe keine …“'),
      ],
      model: ['Ich habe vier Stühle und zwei Lampen.', 'Die Stühle sind alt, aber die Lampen sind neu.', 'Ich habe viele Bücher.', 'Ich habe keine Blumen.'],
    },
    {
      key: 'writing',
      kind: 'writing',
      title: l('Writing', 'Yazma', 'Schreiben'),
      prompt: l(
        'You are selling things at a flea market. Write a short ad (at least 3 sentences).',
        'Bit pazarında eşya satıyorsun. Kısa bir ilan yaz (en az 3 cümle).',
        'Du verkaufst Sachen auf dem Flohmarkt. Schreib eine kurze Anzeige (mindestens 3 Sätze).'
      ),
      minSentences: 3,
      checks: [
        { label: l('A number + plural (zwei Stühle …)', 'Sayı + çoğul (zwei Stühle …)', 'Zahl + Plural (zwei Stühle …)'), pattern: '\\b([Zz]wei|[Dd]rei|[Vv]ier|[Ff]ünf|[Ss]echs|[Vv]iele|\\d+)\\s+\\p{Lu}' },
        { label: l('die + plural noun', 'die + çoğul isim', 'die + Plural-Nomen'), pattern: '\\b[Dd]ie\\s+\\p{Lu}\\p{L}*(e|en|n|er|s)\\b' },
        { label: l('Plural verb (sind / kosten)', 'Çoğul fiil (sind / kosten)', 'Verb im Plural (sind / kosten)'), pattern: '\\b(sind|kosten)\\b' },
      ],
      model: ['Ich verkaufe zwei Lampen und drei Stühle.', 'Die Lampen kosten zehn Euro.', 'Die Stühle sind alt, aber schön.', 'Ich habe auch viele Bücher.'],
    },
    {
      key: 'speed',
      kind: 'timed',
      title: l('Speed round', 'Hız turu', 'Schnellrunde'),
      intro: l('Pick the right plural – 60 seconds.', 'Doğru çoğulu seç – 60 saniye.', 'Wähle den richtigen Plural – 60 Sekunden.'),
      seconds: 60,
      pool: [...VOCAB, ...MORE_VOCAB].filter((v) => v.gender && v.plural).map((v) => `pl-${v.word.toLowerCase()}`),
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
      l('Plural article: always die', 'Çoğul artikeli: her zaman die', 'Plural-Artikel: immer die'),
      l('Endings -e, -(e)n, -er, -s or none – sometimes with umlaut', 'Ekler -e, -(e)n, -er, -s ya da hiç – bazen umlautlu', 'Endungen -e, -(e)n, -er, -s oder keine – manchmal mit Umlaut'),
      l('Safe bets: -e → -n, -ung → -ungen, -o → -s', 'Kesin kurallar: -e → -n, -ung → -ungen, -o → -s', 'Sichere Regeln: -e → -n, -ung → -ungen, -o → -s'),
      l('Numbers + plural: zwei Bücher', 'Sayı + çoğul: zwei Bücher', 'Zahl + Plural: zwei Bücher'),
      l('Plural verb: die Kinder spielen, die Autos sind', 'Çoğul fiil: die Kinder spielen, die Autos sind', 'Verb im Plural: die Kinder spielen'),
    ],
    mistakes: [
      { wrong: 'zwei Buch', right: 'zwei Bücher', note: l('Plural after numbers.', 'Sayıdan sonra çoğul.', 'Nach Zahlen: Plural.') },
      { wrong: 'das Kinder', right: 'die Kinder', note: l('Plural → die.', 'Çoğul → die.', 'Plural → die.') },
      { wrong: 'Die Autos ist neu.', right: 'Die Autos sind neu.', note: l('Plural → sind.', 'Çoğul → sind.', 'Plural → sind.') },
      { wrong: 'die Fotoen', right: 'die Fotos', note: l('-o → -s.', '-o → -s.', '-o → -s.') },
    ],
  },
}
