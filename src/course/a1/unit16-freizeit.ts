import type { CourseUnit, Exercise, VocabItem } from '../types'
import { l } from '../l10n'

const VOCAB: VocabItem[] = [
  { word: 'Fußball spielen', emoji: '⚽', translation: l('to play football', 'futbol oynamak', 'Fußball spielen'), example: 'Ich spiele gern Fußball.' },
  { word: 'lesen', emoji: '📖', translation: l('to read', 'okumak', 'lesen'), example: 'Sie liest gern Romane.' },
  { word: 'Musik hören', emoji: '🎧', translation: l('to listen to music', 'müzik dinlemek', 'Musik hören'), example: 'Ich höre gern Musik.' },
  { word: 'ins Kino gehen', emoji: '🎬', translation: l('to go to the cinema', 'sinemaya gitmek', 'ins Kino gehen'), example: 'Wir gehen gern ins Kino.' },
  { word: 'Rad fahren', emoji: '🚴', translation: l('to cycle', 'bisiklet sürmek', 'Rad fahren'), example: 'Er fährt gern Rad.' },
  { word: 'schwimmen', emoji: '🏊', translation: l('to swim', 'yüzmek', 'schwimmen'), example: 'Im Sommer schwimme ich gern.' },
  { word: 'tanzen', emoji: '💃', translation: l('to dance', 'dans etmek', 'tanzen'), example: 'Tanzt du gern?' },
  { word: 'kochen', emoji: '🍳', translation: l('to cook', 'yemek yapmak', 'kochen'), example: 'Mein Vater kocht gern.' },
  { word: 'fotografieren', emoji: '📷', translation: l('to take photos', 'fotoğraf çekmek', 'fotografieren'), example: 'Ich fotografiere gern.' },
  { word: 'wandern', emoji: '🥾', translation: l('to hike', 'yürüyüşe çıkmak', 'wandern'), example: 'Am Wochenende wandern wir.' },
  { word: 'Freunde treffen', emoji: '👫', translation: l('to meet friends', 'arkadaşlarla buluşmak', 'Freunde treffen'), example: 'Ich treffe gern Freunde.' },
  { word: 'Computerspiele spielen', emoji: '🎮', translation: l('to play video games', 'bilgisayar oyunu oynamak', 'Computerspiele spielen'), example: 'Mein Bruder spielt gern Computerspiele.' },
]

const MORE_VOCAB: VocabItem[] = [
  { word: 'gern', translation: l('gladly – „like to“', 'severek – „-meyi sevmek“', 'gern') },
  { word: 'nicht gern', translation: l('don’t like to', '-meyi sevmemek', 'nicht gern') },
  { word: 'Hobby', gender: 'n', plural: 'die Hobbys', translation: l('hobby', 'hobi', 'Hobby') },
  { word: 'Freizeit', gender: 'f', translation: l('free time', 'boş zaman', 'Freizeit') },
  { word: 'Roman', gender: 'm', plural: 'die Romane', translation: l('novel', 'roman', 'Roman') },
  { word: 'Verein', gender: 'm', plural: 'die Vereine', translation: l('club', 'kulüp, dernek', 'Verein') },
  { word: 'oft · manchmal · nie', translation: l('often · sometimes · never', 'sık · bazen · asla', 'oft · manchmal · nie') },
]

/** [subject, verb, object] – gern goes right after the verb. */
const GERN: [string, string, string][] = [
  ['Ich', 'spiele', 'Fußball'],
  ['Sie', 'liest', 'Romane'],
  ['Wir', 'hören', 'Musik'],
  ['Er', 'fährt', 'Rad'],
  ['Du', 'kochst', 'Pasta'],
  ['Ihr', 'tanzt', 'Salsa'],
  ['Mein Vater', 'trifft', 'Freunde'],
  ['Die Kinder', 'spielen', 'Computerspiele'],
]

function gernDrills(): Exercise[] {
  return GERN.map(([subject, verb, object], i) => {
    const right = `${subject} ${verb} gern ${object}.`
    const lowerFirst = subject[0].toLowerCase() + subject.slice(1)
    const options = [right, `${subject} gern ${verb} ${object}.`, `Gern ${lowerFirst} ${verb} ${object}.`]
    const rotation = i % 3
    const ordered = [...options.slice(rotation), ...options.slice(0, rotation)]
    return {
      id: `gern-${i + 1}`,
      type: 'multiple_choice' as const,
      topic: 'gern',
      concept: 'gern-position',
      skill: 'grammar' as const,
      difficulty: 2 as const,
      prompt: `${subject} … gern …`,
      promptL10n: l('Which sentence is correct?', 'Hangi cümle doğru?', 'Welcher Satz ist richtig?'),
      options: ordered,
      answer: ordered.indexOf(right),
      explanation: l(
        `gern comes right after the verb: ${subject} ${verb} gern …`,
        `gern fiilin hemen arkasına gelir: ${subject} ${verb} gern …`,
        `gern steht direkt nach dem Verb: ${subject} ${verb} gern …`
      ),
      examples: [`${subject} **${verb} gern** ${object}.`],
    }
  })
}

/** Irregular present (e → ie / e → i / a → ä) for du and er. */
const IRREGULAR: [string, string, string, string][] = [
  ['lesen', 'liest', 'liest', 'lest'],
  ['sehen', 'siehst', 'sieht', 'seht'],
  ['fahren', 'fährst', 'fährt', 'fahrt'],
  ['schlafen', 'schläfst', 'schläft', 'schlaft'],
  ['treffen', 'triffst', 'trifft', 'trefft'],
  ['sprechen', 'sprichst', 'spricht', 'sprecht'],
]

function irregularDrills(): Exercise[] {
  return IRREGULAR.map(([inf, du, er], i) => {
    const regularWrong = `${inf.replace(/en$/, '')}${inf.endsWith('sen') ? 't' : 'st'}`
    const person = i % 2 === 0 ? 'du' : 'er'
    const right = person === 'du' ? du : er
    const wrongRegular = person === 'du' ? `${inf.replace(/en$/, '')}st` : `${inf.replace(/en$/, '')}t`
    const options = [...new Set([right, wrongRegular, person === 'du' ? er : du, regularWrong])].slice(0, 3)
    const rotation = i % options.length
    const ordered = [...options.slice(rotation), ...options.slice(0, rotation)]
    return {
      id: `irr-${inf}`,
      type: 'multiple_choice' as const,
      topic: 'irregular',
      concept: 'stem-change',
      skill: 'grammar' as const,
      difficulty: 2 as const,
      prompt: `${person} ___ (${inf})`,
      options: ordered,
      answer: ordered.indexOf(right),
      explanation: l(
        `${inf} changes its vowel for du and er: du ${du}, er ${er}.`,
        `${inf} du ve er için sesli harf değiştirir: du ${du}, er ${er}.`,
        `${inf}: du ${du}, er ${er} (Vokalwechsel).`
      ),
    }
  })
}

const EXERCISES: Exercise[] = [
  // --- Practice 1: recognise --------------------------------------------
  {
    id: 'img-wandern',
    type: 'image_choice',
    topic: 'vocabulary',
    concept: 'hobbies',
    skill: 'vocabulary',
    difficulty: 1,
    prompt: 'Wir wandern gern.',
    options: [
      { emoji: '🥾', label: 'wandern' },
      { emoji: '💃', label: 'tanzen' },
      { emoji: '🎮', label: 'Computerspiele' },
      { emoji: '📷', label: 'fotografieren' },
    ],
    answer: 0,
    explanation: l('wandern = to hike.', 'wandern = doğa yürüyüşü yapmak.', 'wandern.'),
    examples: ['Wir **wandern gern**.'],
  },
  {
    id: 'match-hobbies',
    type: 'matching',
    topic: 'vocabulary',
    concept: 'hobbies',
    skill: 'vocabulary',
    difficulty: 1,
    instructions: l('Match hobbies and pictures.', 'Hobileri ve resimleri eşleştir.', 'Ordne Hobbys und Bilder zu.'),
    pairs: [
      { left: 'Rad fahren', right: '🚴' },
      { left: 'ins Kino gehen', right: '🎬' },
      { left: 'Musik hören', right: '🎧' },
      { left: 'schwimmen', right: '🏊' },
    ],
    explanation: l('Rad fahren, ins Kino gehen, Musik hören, schwimmen.', 'Rad fahren, ins Kino gehen, Musik hören, schwimmen.', 'Rad fahren, ins Kino gehen, Musik hören, schwimmen.'),
  },
  {
    id: 'mc-gern',
    type: 'multiple_choice',
    topic: 'gern',
    concept: 'gern-position',
    skill: 'grammar',
    difficulty: 1,
    prompt: 'Ich spiele ___ Fußball.',
    options: ['gern', 'gerne mag', 'mag'],
    answer: 0,
    explanation: l(
      'verb + gern = to like doing something: Ich spiele gern Fußball (I like playing football).',
      'fiil + gern = bir şeyi yapmayı sevmek: Ich spiele gern Fußball (futbol oynamayı severim).',
      'Verb + gern: Ich spiele gern Fußball.'
    ),
    examples: ['Ich **spiele gern** Fußball.'],
    practice: ['gern-1', 'gern-3'],
  },
  {
    id: 'sort-gern',
    type: 'categorize',
    topic: 'gern',
    concept: 'gern-meaning',
    skill: 'reading',
    difficulty: 1,
    instructions: l('Does Tom like it or not?', 'Tom bunu seviyor mu, sevmiyor mu?', 'Mag Tom das oder nicht?'),
    categories: ['😊 gern', '😕 nicht gern'],
    items: [
      { text: 'Tom tanzt gern.', category: 0 },
      { text: 'Tom kocht nicht gern.', category: 1 },
      { text: 'Tom liest sehr gern.', category: 0 },
      { text: 'Tom schwimmt nicht gern.', category: 1 },
      { text: 'Tom hört gern Musik.', category: 0 },
      { text: 'Tom wandert gar nicht gern.', category: 1 },
    ],
    explanation: l(
      'gern = 😊, sehr gern = 😍, nicht gern = 😕, gar nicht gern = 😖.',
      'gern = 😊, sehr gern = 😍, nicht gern = 😕, gar nicht gern = 😖.',
      'gern, sehr gern, nicht gern, gar nicht gern.'
    ),
  },
  {
    id: 'tf-gern-position',
    type: 'true_false',
    topic: 'gern',
    concept: 'gern-position',
    skill: 'grammar',
    difficulty: 1,
    statement: 'Ich gern lese.',
    answer: false,
    instructions: l('Is this sentence correct?', 'Bu cümle doğru mu?', 'Ist der Satz richtig?'),
    explanation: l('Verb in position 2, gern after it: Ich lese gern.', 'Fiil 2. sırada, gern ondan sonra: Ich lese gern.', 'Ich lese gern.'),
    examples: ['Ich **lese gern**.'],
  },
  {
    id: 'mc-liest',
    type: 'multiple_choice',
    topic: 'irregular',
    concept: 'stem-change',
    skill: 'grammar',
    difficulty: 2,
    prompt: 'Meine Schwester ___ jeden Abend.',
    options: ['liest', 'lest', 'lesst'],
    answer: 0,
    explanation: l(
      'lesen changes e → ie for du and er: du liest, er/sie liest.',
      'lesen du ve er için e → ie olur: du liest, er/sie liest.',
      'lesen: du liest, sie liest.'
    ),
    examples: ['Meine Schwester **liest** jeden Abend.'],
    practice: ['irr-sehen', 'irr-fahren'],
  },
  {
    id: 'select-hobbies',
    type: 'multiple_select',
    topic: 'vocabulary',
    concept: 'hobbies',
    skill: 'vocabulary',
    difficulty: 1,
    promptL10n: l('Which are hobbies? Select all.', 'Hangileri hobi? Hepsini seç.', 'Was sind Hobbys? Wähle alle.'),
    options: ['tanzen', 'arbeiten', 'wandern', 'aufräumen', 'fotografieren', 'einkaufen'],
    answers: [0, 2, 4],
    explanation: l('tanzen, wandern, fotografieren = free-time activities.', 'tanzen, wandern, fotografieren = boş zaman etkinlikleri.', 'Freizeit: tanzen, wandern, fotografieren.'),
  },
  {
    id: 'match-irregular',
    type: 'matching',
    topic: 'irregular',
    concept: 'stem-change',
    skill: 'grammar',
    difficulty: 2,
    instructions: l('Match infinitive and er-form.', 'Mastarı ve er biçimini eşleştir.', 'Ordne Infinitiv und er-Form zu.'),
    pairs: [
      { left: 'lesen', right: 'er liest' },
      { left: 'fahren', right: 'er fährt' },
      { left: 'sehen', right: 'er sieht' },
      { left: 'treffen', right: 'er trifft' },
    ],
    explanation: l('e → ie (lesen, sehen), e → i (treffen), a → ä (fahren).', 'e → ie (lesen, sehen), e → i (treffen), a → ä (fahren).', 'e → ie, e → i, a → ä.'),
  },

  // --- Practice 2: use -------------------------------------------------
  {
    id: 'fill-gern',
    type: 'fill_blank',
    topic: 'gern',
    concept: 'gern-position',
    skill: 'grammar',
    difficulty: 1,
    sentence: 'Wir gehen ___ ins Kino.',
    accepted: ['gern', 'gerne'],
    explanation: l('gern (or gerne) after the verb.', 'gern (ya da gerne) fiilden sonra.', 'gern (oder gerne) nach dem Verb.'),
    examples: ['Wir **gehen gern** ins Kino.'],
  },
  {
    id: 'fill-faehrt',
    type: 'fill_blank',
    topic: 'irregular',
    concept: 'stem-change',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Er ___ jeden Tag Rad.',
    accepted: ['fährt'],
    base: 'fahren',
    explanation: l('fahren: er fährt (a → ä).', 'fahren: er fährt (a → ä).', 'fahren: er fährt.'),
    examples: ['Er **fährt** jeden Tag Rad.'],
  },
  {
    id: 'fill-nicht-gern',
    type: 'fill_blank',
    topic: 'gern',
    concept: 'nicht-gern',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Ich koche ___ gern – ich esse lieber im Restaurant.',
    accepted: ['nicht'],
    explanation: l('nicht gern = don’t like to.', 'nicht gern = sevmemek.', 'nicht gern.'),
    examples: ['Ich koche **nicht gern**.'],
  },
  {
    id: 'build-gern',
    type: 'sentence_builder',
    topic: 'gern',
    concept: 'gern-position',
    skill: 'grammar',
    difficulty: 1,
    chips: ['gern', 'Musik', 'Ich', 'höre'],
    answers: [['Ich', 'höre', 'gern', 'Musik']],
    translation: l('I like listening to music.', 'Müzik dinlemeyi severim.', 'Ich höre gern Musik.'),
    explanation: l('Ich + höre + gern + Musik.', 'Ich + höre + gern + Musik.', 'Ich + höre + gern + Musik.'),
    examples: ['Ich **höre gern** Musik.'],
  },
  {
    id: 'build-question',
    type: 'sentence_builder',
    topic: 'gern',
    concept: 'gern-position',
    skill: 'grammar',
    difficulty: 2,
    chips: ['gern', 'du', 'Tanzt'],
    answers: [['Tanzt', 'du', 'gern']],
    end: '?',
    translation: l('Do you like dancing?', 'Dans etmeyi sever misin?', 'Tanzt du gern?'),
    explanation: l('Question: verb + du + gern?', 'Soru: fiil + du + gern?', 'Frage: Verb + du + gern?'),
    examples: ['**Tanzt** du **gern**?'],
  },
  {
    id: 'build-am-wochenende',
    type: 'sentence_builder',
    topic: 'gern',
    concept: 'gern-position',
    skill: 'grammar',
    difficulty: 2,
    chips: ['wandern', 'Am Wochenende', 'gern', 'wir'],
    answers: [['Am Wochenende', 'wandern', 'wir', 'gern']],
    translation: l('At the weekend we like to hike.', 'Hafta sonu yürüyüş yapmayı severiz.', 'Am Wochenende wandern wir gern.'),
    explanation: l(
      'Time (1) + verb (2) + subject + gern.',
      'Zaman (1) + fiil (2) + özne + gern.',
      'Zeit + Verb + Subjekt + gern.'
    ),
    examples: ['Am Wochenende **wandern** wir **gern**.'],
  },
  {
    id: 'fix-gern',
    type: 'error_correction',
    topic: 'gern',
    concept: 'gern-position',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Ich gern schwimme im Sommer.',
    accepted: ['Ich schwimme gern im Sommer.', 'Im Sommer schwimme ich gern.'],
    explanation: l('Verb first (position 2), then gern.', 'Önce fiil (2. sıra), sonra gern.', 'Verb zuerst, dann gern.'),
    examples: ['Ich **schwimme gern** im Sommer.'],
  },
  {
    id: 'fix-sprecht',
    type: 'error_correction',
    topic: 'irregular',
    concept: 'stem-change',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Mein Freund sprecht drei Sprachen.',
    accepted: ['Mein Freund spricht drei Sprachen.'],
    explanation: l('sprechen: er spricht (e → i).', 'sprechen: er spricht (e → i).', 'sprechen: er spricht.'),
    examples: ['Mein Freund **spricht** drei Sprachen.'],
  },
  {
    id: 'tr-lese-gern',
    type: 'translation',
    topic: 'gern',
    concept: 'gern-position',
    skill: 'writing',
    difficulty: 1,
    source: l('I like reading.', 'Okumayı severim.', 'I like reading.'),
    accepted: ['Ich lese gern.', 'Ich lese gerne.'],
    explanation: l('like doing = verb + gern: Ich lese gern.', '-meyi sevmek = fiil + gern: Ich lese gern.', 'Ich lese gern.'),
    examples: ['Ich **lese gern**.'],
  },
  {
    id: 'tr-nicht-gern',
    type: 'translation',
    topic: 'gern',
    concept: 'nicht-gern',
    skill: 'writing',
    difficulty: 2,
    source: l('He doesn’t like dancing.', 'Dans etmeyi sevmiyor.', 'He doesn’t like dancing.'),
    accepted: ['Er tanzt nicht gern.', 'Er tanzt nicht gerne.'],
    explanation: l('Er tanzt nicht gern.', 'Er tanzt nicht gern.', 'Er tanzt nicht gern.'),
    examples: ['Er **tanzt nicht gern**.'],
  },
  {
    id: 'dialog-hobby',
    type: 'dialogue',
    topic: 'gern',
    concept: 'gern-position',
    skill: 'grammar',
    difficulty: 1,
    lines: [{ speaker: 'Jonas', de: 'Was machst du gern in deiner Freizeit?' }],
    options: ['Ich fotografiere gern.', 'Ich gern fotografiere.', 'Ich fotografieren gern.'],
    answer: 0,
    explanation: l('Ich + fotografiere + gern.', 'Ich + fotografiere + gern.', 'Ich fotografiere gern.'),
    examples: ['Ich **fotografiere gern**.'],
  },
  {
    id: 'dialog-kino',
    type: 'dialogue',
    topic: 'gern',
    concept: 'nicht-gern',
    skill: 'grammar',
    difficulty: 2,
    lines: [{ speaker: 'Mara', de: 'Gehst du gern ins Kino?' }],
    options: ['Nein, nicht so gern. Ich lese lieber.', 'Nein, ich gehe gern nicht.', 'Nein, ich nicht gern.'],
    answer: 0,
    explanation: l(
      '„nicht so gern“ = not so much. „lieber“ = rather (prefer).',
      '„nicht so gern“ = pek sevmem. „lieber“ = tercihen.',
      '„nicht so gern“, „lieber“.'
    ),
    examples: ['Ich **lese lieber**.'],
  },

  // --- Reading ------------------------------------------------------
  {
    id: 'read-mara',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-profil',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Was macht Mara sehr gern?',
    options: ['Sie tanzt.', 'Sie kocht.', 'Sie wandert.'],
    answer: 0,
    explanation: l('„Ich tanze sehr gern – am liebsten Salsa.“', '„Ich tanze sehr gern – am liebsten Salsa.“', '„Ich tanze sehr gern.“'),
  },
  {
    id: 'read-kochen',
    type: 'true_false',
    topic: 'reading',
    concept: 'reading-profil',
    skill: 'reading',
    difficulty: 1,
    statement: 'Mara kocht gern.',
    answer: false,
    explanation: l('„Ich koche nicht gern.“', '„Ich koche nicht gern.“', '„Ich koche nicht gern.“'),
  },
  {
    id: 'read-verein',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-profil',
    skill: 'reading',
    difficulty: 2,
    prompt: 'Wann spielt Mara Volleyball?',
    options: ['am Dienstag', 'am Wochenende', 'jeden Tag'],
    answer: 0,
    explanation: l('„Am Dienstag spiele ich Volleyball im Verein.“', '„Am Dienstag spiele ich Volleyball im Verein.“', '„Am Dienstag …“'),
  },
  {
    id: 'read-suche',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-profil',
    skill: 'reading',
    difficulty: 2,
    prompt: 'Was sucht Mara?',
    options: ['Leute zum Wandern', 'einen Tanzkurs', 'ein Fahrrad'],
    answer: 0,
    explanation: l('„Ich suche Leute zum Wandern!“', '„Ich suche Leute zum Wandern!“', '„Ich suche Leute zum Wandern!“'),
  },

  // --- Listening --------------------------------------------------
  {
    id: 'listen-hobby',
    type: 'listening_choice',
    topic: 'gern',
    concept: 'gern-meaning',
    skill: 'listening',
    difficulty: 1,
    audio: 'In meiner Freizeit fotografiere ich gern.',
    question: l('What is the hobby?', 'Hobisi ne?', 'Was ist das Hobby?'),
    options: ['📷', '🎮', '🥾'],
    answer: 0,
    explanation: l('fotografieren.', 'fotografieren.', 'fotografieren.'),
  },
  {
    id: 'listen-nicht-gern',
    type: 'listening_choice',
    topic: 'gern',
    concept: 'nicht-gern',
    skill: 'listening',
    difficulty: 2,
    audio: 'Ich schwimme gern, aber ich fahre nicht gern Rad.',
    question: l('What doesn’t the person like?', 'Kişi neyi sevmiyor?', 'Was macht die Person nicht gern?'),
    options: ['🏊 schwimmen', '🚴 Rad fahren'],
    answer: 1,
    explanation: l('„… fahre nicht gern Rad“', '„… fahre nicht gern Rad“', '„nicht gern Rad“'),
  },
  {
    id: 'listen-siehst',
    type: 'listening_choice',
    topic: 'irregular',
    concept: 'stem-change',
    skill: 'listening',
    difficulty: 2,
    audio: 'Siehst du gern Filme?',
    question: l('Which verb do you hear?', 'Hangi fiili duyuyorsun?', 'Welches Verb hörst du?'),
    options: ['sehen', 'sagen', 'suchen'],
    answer: 0,
    explanation: l('du siehst → sehen.', 'du siehst → sehen.', 'du siehst → sehen.'),
  },
  {
    id: 'listen-wochenende',
    type: 'listening_choice',
    topic: 'vocabulary',
    concept: 'hobbies',
    skill: 'listening',
    difficulty: 1,
    audio: 'Am Wochenende treffe ich Freunde und wir gehen tanzen.',
    question: l('What happens at the weekend?', 'Hafta sonu ne oluyor?', 'Was passiert am Wochenende?'),
    options: ['👫 + 💃', '📖 + 🎧', '🍳 + 🏊'],
    answer: 0,
    explanation: l('Freunde treffen + tanzen.', 'Freunde treffen + tanzen.', 'Freunde treffen + tanzen.'),
  },

  ...gernDrills(),
  ...irregularDrills(),
]

export const UNIT16_FREIZEIT: CourseUnit = {
  level: 'A1',
  number: 16,
  slug: 'freizeit',
  titleDe: 'Freizeit',
  title: l('Free time', 'Boş zaman', 'Freizeit'),
  goal: l(
    'By the end of this unit you can talk about your hobbies, say what you like and don’t like doing (gern / nicht gern) and use verbs like lesen and fahren correctly.',
    'Bu ünitenin sonunda hobilerinden bahsedebilir, neyi yapmayı sevip sevmediğini söyleyebilir (gern / nicht gern) ve lesen, fahren gibi fiilleri doğru kullanabilirsin.',
    'Am Ende dieser Einheit sprichst du über Hobbys, sagst, was du (nicht) gern machst, und benutzt Verben wie lesen und fahren richtig.'
  ),
  minutes: [15, 20],
  topics: [
    { key: 'gern', label: l('gern / nicht gern', 'gern / nicht gern', 'gern / nicht gern') },
    { key: 'irregular', label: l('du liest, er fährt', 'du liest, er fährt', 'du liest, er fährt') },
    { key: 'vocabulary', label: l('Hobbies', 'Hobiler', 'Hobbys') },
  ],
  vocabulary: [...VOCAB, ...MORE_VOCAB],
  exercises: EXERCISES,
  mastery: { minAnswered: 0.7, minAccuracy: 0.7 },
  sections: [
    {
      key: 'discover',
      kind: 'discover',
      title: l('Discover', 'Keşfet', 'Entdecken'),
      intro: l('What do you do in your free time?', 'Boş zamanında ne yapıyorsun?', 'Was machst du in deiner Freizeit?'),
      cards: VOCAB,
    },
    {
      key: 'understand',
      kind: 'understand',
      title: l('Understand', 'Anla', 'Verstehen'),
      rules: [
        {
          title: l('gern = like doing', 'gern = yapmayı sevmek', 'gern'),
          body: l(
            'German says „I play gladly“: verb + gern. gern comes right after the verb (or after the subject in inverted sentences).',
            'Almanca „severek oynarım“ der: fiil + gern. gern fiilin hemen arkasına gelir (devrik cümlede öznenin arkasına).',
            'Verb + gern: Ich spiele gern Fußball.'
          ),
          table: {
            head: [l('', '', ''), l('example', 'örnek', 'Beispiel')],
            rows: [
              ['😍 sehr gern', 'Ich tanze sehr gern.'],
              ['😊 gern', 'Ich lese gern.'],
              ['😕 nicht gern', 'Ich koche nicht gern.'],
              ['😖 gar nicht gern', 'Ich wandere gar nicht gern.'],
            ],
          },
          tip: l(
            'gern and gerne mean the same.',
            'gern ve gerne aynı anlamdadır.',
            'gern = gerne.'
          ),
        },
        {
          title: l('Verbs with a vowel change', 'Sesli harf değiştiren fiiller', 'Verben mit Vokalwechsel'),
          body: l(
            'Some verbs change their vowel – only for du and er/sie/es: e → ie (lesen, sehen), e → i (sprechen, treffen), a → ä (fahren, schlafen).',
            'Bazı fiiller sesli harf değiştirir – yalnızca du ve er/sie/es için: e → ie (lesen, sehen), e → i (sprechen, treffen), a → ä (fahren, schlafen).',
            'Nur bei du und er/sie/es: e → ie, e → i, a → ä.'
          ),
          table: {
            head: [l('infinitive', 'mastar', 'Infinitiv'), l('du', 'du', 'du'), l('er / sie', 'er / sie', 'er / sie'), l('wir', 'wir', 'wir')],
            rows: [
              ['lesen', 'liest', 'liest', 'lesen'],
              ['sehen', 'siehst', 'sieht', 'sehen'],
              ['sprechen', 'sprichst', 'spricht', 'sprechen'],
              ['fahren', 'fährst', 'fährt', 'fahren'],
              ['treffen', 'triffst', 'trifft', 'treffen'],
            ],
          },
        },
        {
          title: l('How often?', 'Ne sıklıkla?', 'Wie oft?'),
          body: l(
            'immer (always) – oft (often) – manchmal (sometimes) – nie (never). They go where gern goes: Ich gehe oft ins Kino.',
            'immer (her zaman) – oft (sık) – manchmal (bazen) – nie (asla). gern’in yerine gelirler: Ich gehe oft ins Kino.',
            'immer – oft – manchmal – nie.'
          ),
        },
      ],
    },
    {
      key: 'context',
      kind: 'context',
      title: l('See it in context', 'Bağlamda gör', 'Im Kontext'),
      scene: l('Jonas and Mara meet at the language café.', 'Jonas ve Mara dil kafesinde tanışıyor.', 'Jonas und Mara treffen sich im Sprachcafé.'),
      dialogue: [
        { speaker: 'Jonas', de: 'Was machst du **gern** in deiner Freizeit?', translation: l('What do you like doing in your free time?', 'Boş zamanında ne yapmayı seversin?', '') },
        { speaker: 'Mara', de: 'Ich tanze **sehr gern** – am liebsten Salsa. Und du?', translation: l('I love dancing – salsa most of all. And you?', 'Dans etmeyi çok severim – en çok salsa. Ya sen?', '') },
        { speaker: 'Jonas', de: 'Ich **fahre gern** Rad und **lese** viel.', translation: l('I like cycling and read a lot.', 'Bisiklete binmeyi severim ve çok okurum.', '') },
        { speaker: 'Mara', de: 'Was **liest** du gern?', translation: l('What do you like reading?', 'Ne okumayı seversin?', '') },
        { speaker: 'Jonas', de: 'Krimis! Aber ich **sehe nicht gern** fern.', translation: l('Crime novels! But I don’t like watching TV.', 'Polisiye! Ama televizyon izlemeyi sevmem.', '') },
        { speaker: 'Mara', de: 'Ich auch nicht. **Gehst** du **gern** wandern? Am Sonntag gehen wir in die Berge.', translation: l('Me neither. Do you like hiking? On Sunday we’re going to the mountains.', 'Ben de. Yürüyüşe çıkmayı sever misin? Pazar dağlara gidiyoruz.', '') },
      ],
      examples: [
        { de: 'Ich **spiele gern** Fußball.', translation: l('I like playing football.', 'Futbol oynamayı severim.', '') },
        { de: 'Sie **liest sehr gern**.', translation: l('She loves reading.', 'Okumayı çok sever.', '') },
        { de: 'Er **fährt** gern Rad.', translation: l('He likes cycling.', 'Bisiklete binmeyi sever.', '') },
        { de: 'Wir **gehen** oft ins Kino.', translation: l('We often go to the cinema.', 'Sık sık sinemaya gideriz.', '') },
        { de: 'Ich **koche nicht gern**.', translation: l('I don’t like cooking.', 'Yemek yapmayı sevmem.', '') },
        { de: '**Tanzt** du **gern**?', translation: l('Do you like dancing?', 'Dans etmeyi sever misin?', '') },
        { de: 'Am Wochenende **trifft** sie Freunde.', translation: l('At the weekend she meets friends.', 'Hafta sonu arkadaşlarıyla buluşur.', '') },
      ],
    },
    {
      key: 'practice-recognize',
      kind: 'practice',
      title: l('Practice 1 · Recognise', 'Pratik 1 · Tanı', 'Übung 1 · Erkennen'),
      intro: l('Hobbies, gern and vowel changes.', 'Hobiler, gern ve sesli harf değişimleri.', 'Hobbys, gern und Vokalwechsel.'),
      exercises: ['img-wandern', 'match-hobbies', 'mc-gern', 'sort-gern', 'tf-gern-position', 'mc-liest', 'select-hobbies', 'match-irregular', 'gern-2'],
    },
    {
      key: 'practice-use',
      kind: 'practice',
      title: l('Practice 2 · Use', 'Pratik 2 · Kullan', 'Übung 2 · Anwenden'),
      intro: l('Talk about what you like doing.', 'Neyi yapmayı sevdiğinden bahset.', 'Sag, was du gern machst.'),
      exercises: [
        'fill-gern',
        'fill-faehrt',
        'fill-nicht-gern',
        'build-gern',
        'build-question',
        'build-am-wochenende',
        'fix-gern',
        'fix-sprecht',
        'tr-lese-gern',
        'tr-nicht-gern',
        'dialog-hobby',
        'dialog-kino',
        'irr-lesen',
        'irr-schlafen',
      ],
    },
    {
      key: 'reading',
      kind: 'reading',
      title: l('Reading', 'Okuma', 'Lesen'),
      intro: l('Mara’s profile on a hobby website.', 'Mara’nın bir hobi sitesindeki profili.', 'Maras Profil auf einer Hobby-Website.'),
      passage: [
        'Hallo! Ich bin Mara, 29, aus Freiburg.',
        'Ich **tanze sehr gern** – am liebsten Salsa. Am Dienstag spiele ich Volleyball im Verein.',
        'Ich **lese** auch **gern**, aber ich **koche nicht gern**.',
        'Am Wochenende **fahre** ich oft Rad. Ich suche Leute zum Wandern!',
      ],
      glossary: [
        { de: 'am liebsten', note: l('most of all', 'en çok', 'am meisten gern') },
        { de: 'der Verein', note: l('club', 'kulüp', 'Club') },
        { de: 'Leute zum Wandern', note: l('people to go hiking with', 'yürüyüş yapacak insanlar', 'Personen zum Wandern') },
      ],
      exercises: ['read-mara', 'read-kochen', 'read-verein', 'read-suche'],
    },
    {
      key: 'listening',
      kind: 'listening',
      title: l('Listening', 'Dinleme', 'Hören'),
      intro: l('People talk about their free time.', 'İnsanlar boş zamanlarından bahsediyor.', 'Menschen erzählen von ihrer Freizeit.'),
      exercises: ['listen-hobby', 'listen-nicht-gern', 'listen-siehst', 'listen-wochenende'],
    },
    {
      key: 'speaking',
      kind: 'speaking',
      title: l('Speaking', 'Konuşma', 'Sprechen'),
      prompt: l('Present your hobbies.', 'Hobilerini anlat.', 'Stell deine Hobbys vor.'),
      points: [
        l('Two things you like doing: „Ich … gern …“', 'Yapmayı sevdiğin iki şey: „Ich … gern …“', 'Zwei Dinge, die du gern machst'),
        l('Something you don’t like: „Ich … nicht gern …“', 'Sevmediğin bir şey: „Ich … nicht gern …“', 'Etwas, das du nicht gern machst'),
        l('How often? (oft, manchmal, nie)', 'Ne sıklıkla? (oft, manchmal, nie)', 'Wie oft?'),
        l('A question: „… du gern …?“', 'Bir soru: „… du gern …?“', 'Eine Frage'),
      ],
      model: ['In meiner Freizeit lese ich sehr gern.', 'Ich fahre auch gern Rad.', 'Ich tanze nicht gern.', 'Am Wochenende treffe ich oft Freunde.', 'Und du? Was machst du gern?'],
    },
    {
      key: 'writing',
      kind: 'writing',
      title: l('Writing', 'Yazma', 'Schreiben'),
      prompt: l(
        'Write your own hobby profile (at least 4 sentences).',
        'Kendi hobi profilini yaz (en az 4 cümle).',
        'Schreib dein eigenes Hobby-Profil (mindestens 4 Sätze).'
      ),
      minSentences: 4,
      checks: [
        { label: l('Something you like (… gern)', 'Sevdiğin bir şey (… gern)', 'Etwas, das du gern machst'), pattern: '\\b\\p{Ll}+ (sehr )?gerne?\\b' },
        { label: l('Something you don’t like (nicht gern)', 'Sevmediğin bir şey (nicht gern)', 'Etwas, das du nicht gern machst'), pattern: '\\bnicht (so )?gerne?\\b' },
        { label: l('How often (oft, manchmal, nie …)', 'Ne sıklıkla (oft, manchmal, nie …)', 'Wie oft (oft, manchmal, nie …)'), pattern: '\\b(oft|manchmal|nie|immer|jeden Tag)\\b' },
      ],
      model: ['Hallo, ich bin Deniz.', 'In meiner Freizeit spiele ich gern Gitarre.', 'Ich schwimme auch sehr gern.', 'Ich koche nicht so gern.', 'Am Wochenende gehe ich oft ins Kino.'],
    },
    {
      key: 'speed',
      kind: 'timed',
      title: l('Speed round', 'Hız turu', 'Schnellrunde'),
      intro: l('gern and vowel changes – 60 seconds.', 'gern ve sesli harf değişimleri – 60 saniye.', 'gern und Vokalwechsel – 60 Sekunden.'),
      seconds: 60,
      pool: [...GERN.map((_, i) => `gern-${i + 1}`), ...IRREGULAR.map(([inf]) => `irr-${inf}`)],
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
      l('Hobbies and free time', 'Hobiler ve boş zaman', 'Hobbys und Freizeit'),
      l('verb + gern / nicht gern / sehr gern', 'fiil + gern / nicht gern / sehr gern', 'Verb + gern / nicht gern'),
      l('Vowel change: du liest, er fährt, sie spricht', 'Sesli harf değişimi: du liest, er fährt, sie spricht', 'Vokalwechsel: du liest, er fährt'),
      l('immer, oft, manchmal, nie', 'immer, oft, manchmal, nie', 'immer, oft, manchmal, nie'),
    ],
    mistakes: [
      { wrong: 'Ich gern lese.', right: 'Ich lese gern.', note: l('Verb first, then gern.', 'Önce fiil, sonra gern.', 'Verb, dann gern.') },
      { wrong: 'Er fahrt Rad.', right: 'Er fährt Rad.', note: l('a → ä', 'a → ä', 'a → ä') },
      { wrong: 'Du lest viel.', right: 'Du liest viel.', note: l('e → ie', 'e → ie', 'e → ie') },
      { wrong: 'Ich mag lesen gern.', right: 'Ich lese gern.', note: l('gern replaces mögen here.', 'gern burada mögen’in yerine geçer.', 'gern statt mögen.') },
    ],
  },
}
