import type { CourseUnit, Exercise, VocabItem } from '../types'
import { l } from '../l10n'

const VOCAB: VocabItem[] = [
  { word: 'gearbeitet', emoji: '💼', translation: l('worked (arbeiten)', 'çalıştı (arbeiten)', 'arbeiten'), example: 'Ich habe gestern gearbeitet.' },
  { word: 'gelernt', emoji: '📚', translation: l('learned (lernen)', 'öğrendi (lernen)', 'lernen'), example: 'Wir haben Deutsch gelernt.' },
  { word: 'gemacht', emoji: '🛠️', translation: l('done, made (machen)', 'yaptı (machen)', 'machen'), example: 'Was hast du gemacht?' },
  { word: 'gekauft', emoji: '🛒', translation: l('bought (kaufen)', 'satın aldı (kaufen)', 'kaufen'), example: 'Sie hat Brot gekauft.' },
  { word: 'gekocht', emoji: '🍳', translation: l('cooked (kochen)', 'pişirdi (kochen)', 'kochen'), example: 'Er hat Suppe gekocht.' },
  { word: 'gespielt', emoji: '⚽', translation: l('played (spielen)', 'oynadı (spielen)', 'spielen'), example: 'Die Kinder haben Fußball gespielt.' },
  { word: 'gegessen', emoji: '🍽️', translation: l('eaten (essen)', 'yedi (essen)', 'essen'), example: 'Ich habe Pizza gegessen.' },
  { word: 'getrunken', emoji: '☕', translation: l('drunk (trinken)', 'içti (trinken)', 'trinken'), example: 'Wir haben Kaffee getrunken.' },
  { word: 'geschlafen', emoji: '😴', translation: l('slept (schlafen)', 'uyudu (schlafen)', 'schlafen'), example: 'Ich habe gut geschlafen.' },
  { word: 'gesehen', emoji: '👀', translation: l('seen (sehen)', 'gördü (sehen)', 'sehen'), example: 'Hast du den Film gesehen?' },
  { word: 'gelesen', emoji: '📖', translation: l('read (lesen)', 'okudu (lesen)', 'lesen'), example: 'Sie hat ein Buch gelesen.' },
  { word: 'geschrieben', emoji: '✍️', translation: l('written (schreiben)', 'yazdı (schreiben)', 'schreiben'), example: 'Ich habe eine E-Mail geschrieben.' },
]

const MORE_VOCAB: VocabItem[] = [
  { word: 'gestern', translation: l('yesterday', 'dün', 'gestern') },
  { word: 'letzte Woche', translation: l('last week', 'geçen hafta', 'letzte Woche') },
  { word: 'am Wochenende', translation: l('at the weekend', 'hafta sonu', 'am Wochenende') },
  { word: 'das Partizip II', translation: l('past participle', 'geçmiş zaman ortacı', 'Partizip II') },
  { word: 'Film', gender: 'm', plural: 'die Filme', translation: l('film', 'film', 'Film') },
  { word: 'Pizza', gender: 'f', plural: 'die Pizzas', translation: l('pizza', 'pizza', 'Pizza') },
  { word: 'Brief', gender: 'm', plural: 'die Briefe', translation: l('letter', 'mektup', 'Brief') },
]

/** Regular verbs: ge- + stem + -(e)t. */
const REGULAR: [string, string][] = [
  ['machen', 'gemacht'],
  ['lernen', 'gelernt'],
  ['kaufen', 'gekauft'],
  ['spielen', 'gespielt'],
  ['kochen', 'gekocht'],
  ['arbeiten', 'gearbeitet'],
  ['wohnen', 'gewohnt'],
  ['hören', 'gehört'],
]

/** Common irregular participles (-en) – learn them as words. */
const IRREGULAR: [string, string, [string, string]][] = [
  ['essen', 'gegessen', ['geesst', 'gessen']],
  ['trinken', 'getrunken', ['getrinkt', 'getrinken']],
  ['schlafen', 'geschlafen', ['geschlaft', 'geschläft']],
  ['sehen', 'gesehen', ['geseht', 'gesieht']],
  ['lesen', 'gelesen', ['geliest', 'gelest']],
  ['schreiben', 'geschrieben', ['geschreibt', 'geschriebt']],
]

export function regularParticiple(infinitive: string): string {
  const stem = infinitive.replace(/en$/, '')
  return `ge${stem}${/[td]$/.test(stem) ? 'et' : 't'}`
}

function participleDrills(): Exercise[] {
  const regular = REGULAR.map(([inf, part], i) => {
    const stem = inf.replace(/en$/, '')
    const options = [part, `ge${inf}`, `${stem}t`]
    const rotation = i % 3
    const ordered = [...options.slice(rotation), ...options.slice(0, rotation)]
    return {
      id: `pii-${inf}`,
      type: 'multiple_choice' as const,
      topic: 'regular',
      concept: 'participle-regular',
      skill: 'grammar' as const,
      difficulty: 1 as const,
      prompt: `${inf} → ich habe … ___`,
      options: ordered,
      answer: ordered.indexOf(part),
      explanation: l(
        `Regular: ge- + ${stem} + ${part.endsWith('et') ? '-et' : '-t'} = ${part}.`,
        `Düzenli: ge- + ${stem} + ${part.endsWith('et') ? '-et' : '-t'} = ${part}.`,
        `Regelmäßig: ge- + ${stem} + ${part.endsWith('et') ? '-et' : '-t'} = ${part}.`
      ),
      examples: [`Ich habe **${part}**.`],
    }
  })
  const irregular = IRREGULAR.map(([inf, part, wrong], i) => {
    const options = [...new Set([part, ...wrong])]
    while (options.length < 3) options.push(`ge${inf.replace(/en$/, '')}t`)
    const rotation = i % 3
    const ordered = [...options.slice(rotation), ...options.slice(0, rotation)]
    return {
      id: `pii-${inf}`,
      type: 'multiple_choice' as const,
      topic: 'irregular',
      concept: 'participle-irregular',
      skill: 'vocabulary' as const,
      difficulty: 2 as const,
      prompt: `${inf} → ich habe … ___`,
      options: ordered,
      answer: ordered.indexOf(part),
      explanation: l(
        `${inf} is irregular: ${part} (ending -en). Learn these as words.`,
        `${inf} düzensizdir: ${part} (-en eki). Bunları kelime olarak öğren.`,
        `${inf} ist unregelmäßig: ${part}.`
      ),
      examples: [`Ich habe … **${part}**.`],
    }
  })
  return [...regular, ...irregular]
}

/** [time, haben form, subject, object, participle] – participle at the end. */
const PERFECT_SENTENCES: [string, string, string, string, string][] = [
  ['Gestern', 'habe', 'ich', 'Pizza', 'gegessen'],
  ['Am Wochenende', 'hat', 'Tom', 'Fußball', 'gespielt'],
  ['Letzte Woche', 'haben', 'wir', 'viel', 'gelernt'],
  ['Gestern', 'hast', 'du', 'lange', 'geschlafen'],
  ['Am Abend', 'hat', 'Lisa', 'Suppe', 'gekocht'],
  ['Heute', 'habe', 'ich', 'eine E-Mail', 'geschrieben'],
]

function bracketDrills(): Exercise[] {
  return PERFECT_SENTENCES.map(([time, aux, subject, object, part], i) => {
    const right = `${time} ${aux} ${subject} ${object} ${part}.`
    const options = [right, `${time} ${aux} ${subject} ${part} ${object}.`, `${time} ${subject} ${aux} ${object} ${part}.`]
    const rotation = i % 3
    const ordered = [...options.slice(rotation), ...options.slice(0, rotation)]
    return {
      id: `perf-${i + 1}`,
      type: 'multiple_choice' as const,
      topic: 'bracket',
      concept: 'perfect-bracket',
      skill: 'grammar' as const,
      difficulty: 2 as const,
      prompt: `${time} ${aux} … ${part}?`,
      promptL10n: l('Which sentence is correct?', 'Hangi cümle doğru?', 'Welcher Satz ist richtig?'),
      options: ordered,
      answer: ordered.indexOf(right),
      explanation: l(
        `„${aux}“ in position 2, the participle „${part}“ at the very end.`,
        `„${aux}“ 2. sırada, ortaç „${part}“ en sonda.`,
        `„${aux}“ auf Position 2, „${part}“ am Ende.`
      ),
      examples: [`${time} **${aux}** ${subject} ${object} **${part}**.`],
    }
  })
}

const EXERCISES: Exercise[] = [
  // --- Practice 1: recognise -------------------------------------------
  {
    id: 'mc-heute-gestern',
    type: 'multiple_choice',
    topic: 'recognize',
    concept: 'present-or-past',
    skill: 'grammar',
    difficulty: 1,
    prompt: 'Ich habe Pizza gegessen.',
    promptL10n: l('Present or past?', 'Şimdi mi geçmiş mi?', 'Gegenwart oder Vergangenheit?'),
    options: ['Vergangenheit (gestern)', 'Gegenwart (jetzt)'],
    answer: 0,
    explanation: l(
      'habe + gegessen (Partizip II) = past: I ate / have eaten pizza.',
      'habe + gegessen (Partizip II) = geçmiş: pizza yedim.',
      'habe + gegessen = Vergangenheit.'
    ),
    examples: ['Ich **habe** Pizza **gegessen**.', 'Ich **esse** Pizza. (jetzt)'],
    practice: ['tf-present'],
  },
  {
    id: 'tf-present',
    type: 'true_false',
    topic: 'recognize',
    concept: 'present-or-past',
    skill: 'grammar',
    difficulty: 1,
    statement: '„Wir lernen Deutsch“ ist Vergangenheit.',
    answer: false,
    explanation: l('„Wir lernen“ is present. Past: Wir haben Deutsch gelernt.', '„Wir lernen“ şimdiki zamandır. Geçmiş: Wir haben Deutsch gelernt.', 'Gegenwart. Vergangenheit: Wir haben … gelernt.'),
    examples: ['Wir **haben** Deutsch **gelernt**.'],
  },
  {
    id: 'match-infinitive',
    type: 'matching',
    topic: 'regular',
    concept: 'participle-regular',
    skill: 'vocabulary',
    difficulty: 1,
    instructions: l('Match infinitive and Partizip II.', 'Mastarı ve Partizip II’yi eşleştir.', 'Ordne Infinitiv und Partizip II zu.'),
    pairs: [
      { left: 'machen', right: 'gemacht' },
      { left: 'kaufen', right: 'gekauft' },
      { left: 'arbeiten', right: 'gearbeitet' },
      { left: 'essen', right: 'gegessen' },
    ],
    explanation: l(
      'Regular: ge- … -t (gemacht, gekauft, gearbeitet). Irregular: ge- … -en (gegessen).',
      'Düzenli: ge- … -t (gemacht, gekauft, gearbeitet). Düzensiz: ge- … -en (gegessen).',
      'ge- … -t oder ge- … -en.'
    ),
  },
  {
    id: 'sort-t-en',
    type: 'categorize',
    topic: 'irregular',
    concept: 'participle-irregular',
    skill: 'grammar',
    difficulty: 2,
    instructions: l('Which ending? Sort the participles.', 'Hangi ek? Ortaçları ayır.', 'Welche Endung? Sortiere.'),
    categories: ['ge- … -t', 'ge- … -en'],
    items: [
      { text: 'gelernt', category: 0 },
      { text: 'gegessen', category: 1 },
      { text: 'gekocht', category: 0 },
      { text: 'getrunken', category: 1 },
      { text: 'gespielt', category: 0 },
      { text: 'geschlafen', category: 1 },
    ],
    explanation: l(
      'Regular verbs end in -t; many irregular verbs end in -en (often with a vowel change: trinken → getrunken).',
      'Düzenli fiiller -t ile biter; birçok düzensiz fiil -en ile biter (çoğu zaman sesli harf değişimiyle: trinken → getrunken).',
      '-t (regelmäßig), -en (oft unregelmäßig).'
    ),
  },
  {
    id: 'select-past',
    type: 'multiple_select',
    topic: 'recognize',
    concept: 'present-or-past',
    skill: 'grammar',
    difficulty: 2,
    promptL10n: l('Which sentences are about the past? Select all.', 'Hangi cümleler geçmişten bahsediyor? Hepsini seç.', 'Welche Sätze sind Vergangenheit? Wähle alle.'),
    options: ['Ich habe gearbeitet.', 'Ich arbeite.', 'Sie hat ein Buch gelesen.', 'Sie liest ein Buch.', 'Wir haben gekocht.'],
    answers: [0, 2, 4],
    explanation: l('haben + Partizip II = past.', 'haben + Partizip II = geçmiş.', 'haben + Partizip II.'),
  },
  {
    id: 'mc-hat',
    type: 'multiple_choice',
    topic: 'bracket',
    concept: 'haben-form',
    skill: 'grammar',
    difficulty: 1,
    prompt: 'Lisa ___ gestern Tennis gespielt.',
    options: ['hat', 'habe', 'ist'],
    answer: 0,
    explanation: l(
      'The haben form changes with the person (sie hat), the participle never changes.',
      'haben biçimi kişiye göre değişir (sie hat), ortaç hiç değişmez.',
      'haben ändert sich (sie hat), das Partizip nicht.'
    ),
    examples: ['Lisa **hat** Tennis **gespielt**.'],
  },
  {
    id: 'ordering-tag',
    type: 'ordering',
    topic: 'bracket',
    concept: 'perfect-story',
    skill: 'reading',
    difficulty: 2,
    promptL10n: l('Put yesterday in order.', 'Dünü sıraya koy.', 'Bring den gestrigen Tag in die richtige Reihenfolge.'),
    items: ['Am Abend habe ich einen Film gesehen.', 'Am Morgen habe ich Kaffee getrunken.', 'Mittags habe ich mit Kollegen gegessen.', 'Dann habe ich bis 17 Uhr gearbeitet.'],
    answer: ['Am Morgen habe ich Kaffee getrunken.', 'Dann habe ich bis 17 Uhr gearbeitet.', 'Mittags habe ich mit Kollegen gegessen.', 'Am Abend habe ich einen Film gesehen.'],
    explanation: l(
      'Follow the time words: Am Morgen → Dann → Mittags → Am Abend.',
      'Sabah → sonra → öğle → akşam. Kelimelerin sırasını izle: Morgen → Dann → Mittags → Abend.',
      'Morgen → Dann → Mittags → Abend.'
    ),
  },

  // --- Practice 2: use ---------------------------------------------------
  {
    id: 'fill-gekauft',
    type: 'fill_blank',
    topic: 'regular',
    concept: 'participle-regular',
    skill: 'grammar',
    difficulty: 1,
    sentence: 'Ich habe Brot ___.',
    accepted: ['gekauft'],
    base: 'kaufen',
    explanation: l('kaufen → ge-kauf-t.', 'kaufen → ge-kauf-t.', 'kaufen → gekauft.'),
    examples: ['Ich habe Brot **gekauft**.'],
  },
  {
    id: 'fill-gearbeitet',
    type: 'fill_blank',
    topic: 'regular',
    concept: 'participle-regular',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Er hat gestern lange ___.',
    accepted: ['gearbeitet'],
    base: 'arbeiten',
    explanation: l('Stem ends in -t → -et: ge-arbeit-et.', 'Kök -t ile bitiyor → -et: ge-arbeit-et.', 'gearbeitet (-et).'),
    examples: ['Er hat lange **gearbeitet**.'],
  },
  {
    id: 'fill-habt',
    type: 'fill_blank',
    topic: 'bracket',
    concept: 'haben-form',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Was ___ ihr am Wochenende gemacht?',
    accepted: ['habt'],
    base: 'haben',
    explanation: l('ihr habt (Unit 10).', 'ihr habt (Ünite 10).', 'ihr habt.'),
    examples: ['Was **habt** ihr **gemacht**?'],
  },
  {
    id: 'build-gelernt',
    type: 'sentence_builder',
    topic: 'bracket',
    concept: 'perfect-bracket',
    skill: 'grammar',
    difficulty: 1,
    chips: ['gelernt', 'habe', 'Ich', 'Deutsch'],
    answers: [['Ich', 'habe', 'Deutsch', 'gelernt']],
    translation: l('I learned German.', 'Almanca öğrendim.', 'Ich habe Deutsch gelernt.'),
    explanation: l(
      'Like a modal verb: haben in position 2, Partizip II at the end.',
      'Modal fiil gibi: haben 2. sırada, Partizip II sonda.',
      'haben auf Position 2, Partizip am Ende.'
    ),
    examples: ['Ich **habe** Deutsch **gelernt**.'],
  },
  {
    id: 'build-gestern',
    type: 'sentence_builder',
    topic: 'bracket',
    concept: 'perfect-bracket',
    skill: 'grammar',
    difficulty: 2,
    chips: ['getrunken', 'Gestern', 'wir', 'Kaffee', 'haben'],
    answers: [['Gestern', 'haben', 'wir', 'Kaffee', 'getrunken']],
    translation: l('Yesterday we drank coffee.', 'Dün kahve içtik.', 'Gestern haben wir Kaffee getrunken.'),
    explanation: l('Gestern (1) + haben (2) + wir + … + getrunken (end).', 'Gestern (1) + haben (2) + wir + … + getrunken (son).', 'Gestern haben wir … getrunken.'),
    examples: ['Gestern **haben** wir Kaffee **getrunken**.'],
  },
  {
    id: 'build-question',
    type: 'sentence_builder',
    topic: 'bracket',
    concept: 'perfect-bracket',
    skill: 'grammar',
    difficulty: 2,
    chips: ['gemacht', 'du', 'Was', 'hast'],
    answers: [['Was', 'hast', 'du', 'gemacht']],
    end: '?',
    translation: l('What did you do?', 'Ne yaptın?', 'Was hast du gemacht?'),
    explanation: l('Was + hast + du + gemacht?', 'Was + hast + du + gemacht?', 'Was hast du gemacht?'),
    examples: ['Was **hast** du **gemacht**?'],
  },
  {
    id: 'fix-position',
    type: 'error_correction',
    topic: 'bracket',
    concept: 'perfect-bracket',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Ich habe gegessen einen Apfel.',
    accepted: ['Ich habe einen Apfel gegessen.'],
    explanation: l('Partizip II at the very end.', 'Partizip II en sonda.', 'Partizip am Ende.'),
    examples: ['Ich habe einen Apfel **gegessen**.'],
  },
  {
    id: 'fix-gemachen',
    type: 'error_correction',
    topic: 'regular',
    concept: 'participle-regular',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Was hast du gemachen?',
    accepted: ['Was hast du gemacht?'],
    explanation: l('machen is regular: gemacht.', 'machen düzenlidir: gemacht.', 'machen → gemacht.'),
    examples: ['Was hast du **gemacht**?'],
  },
  {
    id: 'tr-gekocht',
    type: 'translation',
    topic: 'bracket',
    concept: 'perfect-bracket',
    skill: 'writing',
    difficulty: 2,
    source: l('I cooked yesterday.', 'Dün yemek yaptım.', 'I cooked yesterday.'),
    accepted: ['Ich habe gestern gekocht.', 'Gestern habe ich gekocht.'],
    explanation: l('habe … gekocht.', 'habe … gekocht.', 'habe … gekocht.'),
    examples: ['Ich **habe** gestern **gekocht**.'],
  },
  {
    id: 'tr-gesehen',
    type: 'translation',
    topic: 'irregular',
    concept: 'participle-irregular',
    skill: 'writing',
    difficulty: 2,
    source: l('Did you see the film?', 'Filmi gördün mü?', 'Did you see the film?'),
    accepted: ['Hast du den Film gesehen?'],
    explanation: l('Hast du … gesehen? (der Film → den Film)', 'Hast du … gesehen? (der Film → den Film)', 'Hast du den Film gesehen?'),
    examples: ['**Hast** du den Film **gesehen**?'],
  },
  {
    id: 'dialog-wochenende',
    type: 'dialogue',
    topic: 'bracket',
    concept: 'perfect-bracket',
    skill: 'grammar',
    difficulty: 1,
    lines: [{ speaker: 'Kollege', de: 'Was hast du am Wochenende gemacht?' }],
    options: ['Ich habe meine Eltern besucht.', 'Ich habe besucht meine Eltern.', 'Ich besucht meine Eltern.'],
    answer: 0,
    explanation: l('habe … besucht (end).', 'habe … besucht (son).', 'habe … besucht.'),
    examples: ['Ich **habe** meine Eltern **besucht**.'],
  },
  {
    id: 'dialog-geschlafen',
    type: 'dialogue',
    topic: 'irregular',
    concept: 'participle-irregular',
    skill: 'grammar',
    difficulty: 2,
    lines: [{ speaker: 'Mama', de: 'Guten Morgen! Hast du gut geschlafen?' }],
    options: ['Ja, ich habe sehr gut geschlafen.', 'Ja, ich habe sehr gut geschlaft.', 'Ja, ich schlafen gut.'],
    answer: 0,
    explanation: l('schlafen → geschlafen (irregular).', 'schlafen → geschlafen (düzensiz).', 'geschlafen.'),
    examples: ['Ich habe gut **geschlafen**.'],
  },

  // --- Reading -----------------------------------------------------
  {
    id: 'read-samstag',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-wochenende',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Was hat Jana am Samstag gemacht?',
    options: ['Sie hat lange geschlafen und eingekauft.', 'Sie hat gearbeitet.', 'Sie hat Fußball gespielt.'],
    answer: 0,
    explanation: l('„Am Samstag habe ich lange geschlafen. Dann habe ich eingekauft.“', '„Am Samstag habe ich lange geschlafen. Dann habe ich eingekauft.“', '„… geschlafen … eingekauft.“'),
  },
  {
    id: 'read-abend',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-wochenende',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Was haben Jana und Max am Abend gekocht?',
    options: ['Pasta', 'Suppe', 'Fisch'],
    answer: 0,
    explanation: l('„Am Abend haben wir Pasta gekocht.“', '„Am Abend haben wir Pasta gekocht.“', '„Pasta gekocht“'),
  },
  {
    id: 'read-sonntag',
    type: 'true_false',
    topic: 'reading',
    concept: 'reading-wochenende',
    skill: 'reading',
    difficulty: 2,
    statement: 'Am Sonntag hat Jana ein Buch gelesen.',
    answer: true,
    explanation: l('„Am Sonntag habe ich ein Buch gelesen.“', '„Am Sonntag habe ich ein Buch gelesen.“', '„ein Buch gelesen“'),
  },
  {
    id: 'read-mutter',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-wochenende',
    skill: 'reading',
    difficulty: 2,
    prompt: 'Wem hat Jana eine E-Mail geschrieben?',
    options: ['ihrer Mutter', 'ihrem Chef', 'Max'],
    answer: 0,
    explanation: l('„… und meiner Mutter eine E-Mail geschrieben.“', '„… und meiner Mutter eine E-Mail geschrieben.“', '„meiner Mutter“'),
  },

  // --- Listening ---------------------------------------------------
  {
    id: 'listen-past',
    type: 'listening_choice',
    topic: 'recognize',
    concept: 'present-or-past',
    skill: 'listening',
    difficulty: 1,
    audio: 'Ich habe gestern viel gearbeitet.',
    question: l('Present or past?', 'Şimdi mi geçmiş mi?', 'Gegenwart oder Vergangenheit?'),
    options: ['Vergangenheit', 'Gegenwart'],
    answer: 0,
    explanation: l('habe … gearbeitet = past.', 'habe … gearbeitet = geçmiş.', 'Vergangenheit.'),
  },
  {
    id: 'listen-was',
    type: 'listening_choice',
    topic: 'irregular',
    concept: 'participle-irregular',
    skill: 'listening',
    difficulty: 2,
    audio: 'Am Wochenende haben wir einen Film gesehen und Pizza gegessen.',
    question: l('What did they do?', 'Ne yaptılar?', 'Was haben sie gemacht?'),
    options: ['🎬 + 🍕', '⚽ + ☕', '📖 + 🍳'],
    answer: 0,
    explanation: l('Film gesehen + Pizza gegessen.', 'Film gesehen + Pizza gegessen.', 'Film + Pizza.'),
  },
  {
    id: 'listen-hast',
    type: 'listening_choice',
    topic: 'bracket',
    concept: 'haben-form',
    skill: 'listening',
    difficulty: 2,
    audio: 'Hast du schon die E-Mail geschrieben?',
    question: l('What is the question about?', 'Soru ne hakkında?', 'Worum geht es?'),
    options: ['✍️ eine E-Mail', '📖 ein Buch', '🛒 Einkaufen'],
    answer: 0,
    explanation: l('„die E-Mail geschrieben“', '„die E-Mail geschrieben“', '„E-Mail geschrieben“'),
  },
  {
    id: 'listen-gestern',
    type: 'listening_choice',
    topic: 'regular',
    concept: 'participle-regular',
    skill: 'listening',
    difficulty: 1,
    audio: 'Gestern habe ich für den Test gelernt.',
    question: l('What did the person do yesterday?', 'Kişi dün ne yaptı?', 'Was hat die Person gestern gemacht?'),
    options: ['📚 gelernt', '😴 geschlafen', '⚽ gespielt'],
    answer: 0,
    explanation: l('„gelernt“', '„gelernt“', '„gelernt“'),
  },

  ...participleDrills(),
  ...bracketDrills(),
]

export const UNIT24_PERFEKT: CourseUnit = {
  level: 'A1',
  number: 24,
  slug: 'perfekt',
  titleDe: 'Vergangenheit – Einführung',
  title: l('Past tense – introduction', 'Geçmiş zaman – giriş', 'Vergangenheit – Einführung'),
  goal: l(
    'By the end of this unit you recognise the past tense (Perfekt) and can say simple things about yesterday or the weekend: Ich habe gearbeitet.',
    'Bu ünitenin sonunda geçmiş zamanı (Perfekt) tanır ve dün ya da hafta sonu hakkında basit şeyler söyleyebilirsin: Ich habe gearbeitet.',
    'Am Ende dieser Einheit erkennst du das Perfekt und erzählst Einfaches über gestern oder das Wochenende.'
  ),
  minutes: [15, 20],
  topics: [
    { key: 'recognize', label: l('Present or past?', 'Şimdi mi geçmiş mi?', 'Gegenwart oder Vergangenheit?') },
    { key: 'regular', label: l('ge- … -t', 'ge- … -t', 'ge- … -t') },
    { key: 'irregular', label: l('ge- … -en', 'ge- … -en', 'ge- … -en') },
    { key: 'bracket', label: l('habe … gelernt', 'habe … gelernt', 'habe … gelernt') },
  ],
  vocabulary: [...VOCAB, ...MORE_VOCAB],
  exercises: EXERCISES,
  mastery: { minAnswered: 0.7, minAccuracy: 0.7 },
  sections: [
    {
      key: 'discover',
      kind: 'discover',
      title: l('Discover', 'Keşfet', 'Entdecken'),
      intro: l('Twelve past participles – the „past“ form of verbs you already know.', 'On iki geçmiş zaman ortacı – zaten bildiğin fiillerin geçmiş biçimi.', 'Zwölf Partizipien – von Verben, die du schon kennst.'),
      cards: VOCAB,
    },
    {
      key: 'understand',
      kind: 'understand',
      title: l('Understand', 'Anla', 'Verstehen'),
      rules: [
        {
          title: l('haben + Partizip II', 'haben + Partizip II', 'haben + Partizip II'),
          body: l(
            'To talk about the past in spoken German, use haben (conjugated, position 2) + Partizip II (at the end). It works like a modal verb.',
            'Konuşma dilinde geçmişten bahsetmek için haben (çekimli, 2. sıra) + Partizip II (sonda) kullanılır. Modal fiil gibi çalışır.',
            'haben (Position 2) + Partizip II (Ende).'
          ),
          table: {
            head: [l('Position 1', '1. pozisyon', 'Position 1'), l('haben (2)', 'haben (2)', 'haben (2)'), l('…', '…', '…'), l('Partizip II (end)', 'Partizip II (son)', 'Partizip II (Ende)')],
            rows: [
              ['Ich', 'habe', 'Deutsch', 'gelernt.'],
              ['Gestern', 'hat', 'Tom', 'gearbeitet.'],
              ['Was', 'hast', 'du', 'gemacht?'],
            ],
          },
        },
        {
          title: l('Regular: ge- … -t', 'Düzenli: ge- … -t', 'Regelmäßig: ge- … -t'),
          body: l(
            'ge- + stem + -t: machen → gemacht, kaufen → gekauft, spielen → gespielt. Stems in -t/-d get -et: arbeiten → gearbeitet.',
            'ge- + kök + -t: machen → gemacht, kaufen → gekauft, spielen → gespielt. -t/-d ile biten kökler -et alır: arbeiten → gearbeitet.',
            'ge- + Stamm + -t; Stamm auf -t/-d → -et.'
          ),
        },
        {
          title: l('Irregular: ge- … -en', 'Düzensiz: ge- … -en', 'Unregelmäßig: ge- … -en'),
          body: l(
            'Many common verbs end in -en, sometimes with a vowel change. Learn them as words: essen → gegessen, trinken → getrunken, schlafen → geschlafen, sehen → gesehen, lesen → gelesen, schreiben → geschrieben.',
            'Birçok yaygın fiil -en ile biter, bazen sesli harf değişir. Bunları kelime olarak öğren: essen → gegessen, trinken → getrunken, schlafen → geschlafen, sehen → gesehen, lesen → gelesen, schreiben → geschrieben.',
            'gegessen, getrunken, geschlafen, gesehen, gelesen, geschrieben.'
          ),
          tip: l(
            'Some verbs of movement use sein instead of haben (Ich bin gegangen) – you will learn them in A2.',
            'Bazı hareket fiilleri haben yerine sein kullanır (Ich bin gegangen) – bunları A2’de öğreneceksin.',
            'Bewegungsverben mit sein (Ich bin gegangen) – in A2.'
          ),
        },
      ],
    },
    {
      key: 'context',
      kind: 'context',
      title: l('See it in context', 'Bağlamda gör', 'Im Kontext'),
      scene: l('Monday morning in the office.', 'Pazartesi sabahı ofiste.', 'Montagmorgen im Büro.'),
      dialogue: [
        { speaker: 'Max', de: 'Morgen, Jana! Was **hast** du am Wochenende **gemacht**?', translation: l('Morning, Jana! What did you do at the weekend?', 'Günaydın Jana! Hafta sonu ne yaptın?', '') },
        { speaker: 'Jana', de: 'Am Samstag **habe** ich lange **geschlafen**. Dann **habe** ich **eingekauft**.', translation: l('On Saturday I slept late. Then I went shopping.', 'Cumartesi geç saate kadar uyudum. Sonra alışveriş yaptım.', '') },
        { speaker: 'Max', de: 'Und am Abend?', translation: l('And in the evening?', 'Ya akşam?', '') },
        { speaker: 'Jana', de: 'Am Abend **haben** wir Pasta **gekocht** und einen Film **gesehen**.', translation: l('In the evening we cooked pasta and watched a film.', 'Akşam makarna yaptık ve film izledik.', '') },
        { speaker: 'Max', de: 'Schön! Ich **habe** leider **gearbeitet**.', translation: l('Nice! Unfortunately I worked.', 'Güzel! Ben maalesef çalıştım.', '') },
        { speaker: 'Jana', de: 'Oh nein! **Hast** du denn wenigstens gut **geschlafen**?', translation: l('Oh no! Did you at least sleep well?', 'Olamaz! Bari iyi uyudun mu?', '') },
      ],
      examples: [
        { de: 'Ich **habe** gestern **gearbeitet**.', translation: l('I worked yesterday.', 'Dün çalıştım.', '') },
        { de: 'Wir **haben** Deutsch **gelernt**.', translation: l('We learned German.', 'Almanca öğrendik.', '') },
        { de: 'Sie **hat** Brot **gekauft**.', translation: l('She bought bread.', 'Ekmek aldı.', '') },
        { de: 'Ich **habe** Pizza **gegessen**.', translation: l('I ate pizza.', 'Pizza yedim.', '') },
        { de: '**Hast** du Kaffee **getrunken**?', translation: l('Did you drink coffee?', 'Kahve içtin mi?', '') },
        { de: 'Er **hat** ein Buch **gelesen**.', translation: l('He read a book.', 'Bir kitap okudu.', '') },
        { de: 'Was **habt** ihr **gemacht**?', translation: l('What did you (pl.) do?', 'Ne yaptınız?', '') },
      ],
    },
    {
      key: 'practice-recognize',
      kind: 'practice',
      title: l('Practice 1 · Recognise', 'Pratik 1 · Tanı', 'Übung 1 · Erkennen'),
      intro: l('Recognise the past – and the participles.', 'Geçmişi – ve ortaçları – tanı.', 'Erkenne die Vergangenheit und die Partizipien.'),
      exercises: ['mc-heute-gestern', 'match-infinitive', 'sort-t-en', 'select-past', 'mc-hat', 'ordering-tag', 'pii-machen', 'pii-essen', 'perf-1'],
    },
    {
      key: 'practice-use',
      kind: 'practice',
      title: l('Practice 2 · Use', 'Pratik 2 · Kullan', 'Übung 2 · Anwenden'),
      intro: l('Talk about yesterday.', 'Dünden bahset.', 'Erzähl von gestern.'),
      exercises: [
        'fill-gekauft',
        'fill-gearbeitet',
        'fill-habt',
        'build-gelernt',
        'build-gestern',
        'build-question',
        'fix-position',
        'fix-gemachen',
        'tr-gekocht',
        'tr-gesehen',
        'dialog-wochenende',
        'dialog-geschlafen',
        'perf-2',
        'pii-trinken',
      ],
    },
    {
      key: 'reading',
      kind: 'reading',
      title: l('Reading', 'Okuma', 'Lesen'),
      intro: l('Jana writes about her weekend.', 'Jana hafta sonunu anlatıyor.', 'Jana schreibt über ihr Wochenende.'),
      passage: [
        'Mein Wochenende war super!',
        'Am Samstag **habe** ich lange **geschlafen**. Dann **habe** ich **eingekauft**.',
        'Am Abend **haben** Max und ich Pasta **gekocht**.',
        'Am Sonntag **habe** ich ein Buch **gelesen** und meiner Mutter eine E-Mail **geschrieben**.',
      ],
      glossary: [
        { de: 'war', note: l('was (sein, past)', 'idi (sein, geçmiş)', 'Vergangenheit von sein') },
        { de: 'eingekauft', note: l('went shopping (einkaufen)', 'alışveriş yaptı (einkaufen)', 'einkaufen → eingekauft') },
        { de: 'meiner Mutter', note: l('to my mother (Dativ)', 'anneme (Dativ)', 'Dativ') },
      ],
      exercises: ['read-samstag', 'read-abend', 'read-sonntag', 'read-mutter'],
    },
    {
      key: 'listening',
      kind: 'listening',
      title: l('Listening', 'Dinleme', 'Hören'),
      intro: l('Listen for haben … and the ge- word at the end.', 'haben … ve sondaki ge- kelimesine kulak ver.', 'Hör auf haben … und das ge-Wort am Ende.'),
      exercises: ['listen-past', 'listen-was', 'listen-hast', 'listen-gestern'],
    },
    {
      key: 'speaking',
      kind: 'speaking',
      title: l('Speaking', 'Konuşma', 'Sprechen'),
      prompt: l('Tell a friend about your last weekend.', 'Bir arkadaşına geçen hafta sonunu anlat.', 'Erzähl einer Freundin von deinem letzten Wochenende.'),
      points: [
        l('Saturday: „Am Samstag habe ich … gemacht.“', 'Cumartesi: „Am Samstag habe ich … gemacht.“', 'Samstag'),
        l('Sunday: „Am Sonntag habe ich …“', 'Pazar: „Am Sonntag habe ich …“', 'Sonntag'),
        l('Something you ate or drank: gegessen / getrunken', 'Yediğin ya da içtiğin bir şey: gegessen / getrunken', 'Essen und Trinken'),
        l('Ask back: „Und was hast du gemacht?“', 'Geri sor: „Und was hast du gemacht?“', 'Frag zurück'),
      ],
      model: ['Am Samstag habe ich lange geschlafen.', 'Dann habe ich mit Freunden Fußball gespielt.', 'Am Abend haben wir Pizza gegessen.', 'Am Sonntag habe ich ein Buch gelesen.', 'Und was hast du gemacht?'],
    },
    {
      key: 'writing',
      kind: 'writing',
      title: l('Writing', 'Yazma', 'Schreiben'),
      prompt: l(
        'What did you do yesterday? Write at least 4 sentences in the past.',
        'Dün ne yaptın? Geçmiş zamanda en az 4 cümle yaz.',
        'Was hast du gestern gemacht? Schreib mindestens 4 Sätze im Perfekt.'
      ),
      minSentences: 4,
      checks: [
        { label: l('A form of haben', 'haben’in bir biçimi', 'Eine Form von haben'), pattern: '\\b(habe|hast|hat|haben|habt)\\b' },
        { label: l('A Partizip II at the end (ge…t / ge…en)', 'Sonda bir Partizip II (ge…t / ge…en)', 'Partizip II am Ende'), pattern: '\\b\\p{Ll}*ge\\p{Ll}+(t|en)[.!?]' },
        { label: l('A time word (gestern, am Abend …)', 'Bir zaman kelimesi (gestern, am Abend …)', 'Ein Zeitwort'), pattern: '\\b([Gg]estern|[Aa]m (Morgen|Abend|Mittag|Nachmittag|Wochenende)|[Dd]ann|[Dd]anach|[Ll]etzte Woche)\\b' },
      ],
      model: ['Gestern habe ich bis 16 Uhr gearbeitet.', 'Dann habe ich im Supermarkt eingekauft.', 'Am Abend habe ich Suppe gekocht.', 'Danach habe ich ein Buch gelesen.'],
    },
    {
      key: 'speed',
      kind: 'timed',
      title: l('Speed round', 'Hız turu', 'Schnellrunde'),
      intro: l('Participles and word order – 60 seconds.', 'Ortaçlar ve dizilim – 60 saniye.', 'Partizipien und Satzstellung – 60 Sekunden.'),
      seconds: 60,
      pool: [...REGULAR.map(([inf]) => `pii-${inf}`), ...IRREGULAR.map(([inf]) => `pii-${inf}`), ...PERFECT_SENTENCES.map((_, i) => `perf-${i + 1}`)],
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
      l('Perfekt = haben + Partizip II', 'Perfekt = haben + Partizip II', 'Perfekt = haben + Partizip II'),
      l('Regular: gemacht, gekauft, gearbeitet', 'Düzenli: gemacht, gekauft, gearbeitet', 'Regelmäßig: gemacht, gekauft'),
      l('Irregular: gegessen, getrunken, geschlafen, gesehen', 'Düzensiz: gegessen, getrunken, geschlafen, gesehen', 'Unregelmäßig: gegessen, getrunken …'),
      l('haben in position 2, Partizip at the end', 'haben 2. sırada, ortaç sonda', 'haben Position 2, Partizip am Ende'),
    ],
    mistakes: [
      { wrong: 'Ich habe gegessen eine Pizza.', right: 'Ich habe eine Pizza gegessen.', note: l('Participle at the end.', 'Ortaç sonda.', 'Partizip am Ende.') },
      { wrong: 'Was hast du gemachen?', right: 'Was hast du gemacht?', note: l('machen → gemacht.', 'machen → gemacht.', 'gemacht.') },
      { wrong: 'Ich habe gearbeit.', right: 'Ich habe gearbeitet.', note: l('-t stem → -et.', '-t kök → -et.', '-et.') },
      { wrong: 'Er habe geschlafen.', right: 'Er hat geschlafen.', note: l('er hat.', 'er hat.', 'er hat.') },
    ],
  },
}
