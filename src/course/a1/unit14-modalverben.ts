import type { CourseUnit, Exercise, VocabItem } from '../types'
import { l } from '../l10n'

const VOCAB: VocabItem[] = [
  { word: 'können', emoji: '💪', translation: l('can, to be able to', '-ebilmek', 'können'), example: 'Ich kann gut schwimmen.' },
  { word: 'müssen', emoji: '❗', translation: l('must, to have to', '-meli, zorunda olmak', 'müssen'), example: 'Ich muss heute arbeiten.' },
  { word: 'möchten', emoji: '🙏', translation: l('would like to', 'istemek (kibar)', 'möchten'), example: 'Ich möchte Kaffee trinken.' },
  { word: 'Deutsch sprechen', emoji: '🗣️', translation: l('to speak German', 'Almanca konuşmak', 'Deutsch sprechen'), example: 'Kannst du Deutsch sprechen?' },
  { word: 'Auto fahren', emoji: '🚗', translation: l('to drive a car', 'araba sürmek', 'Auto fahren'), example: 'Er kann nicht Auto fahren.' },
  { word: 'Gitarre spielen', emoji: '🎸', translation: l('to play the guitar', 'gitar çalmak', 'Gitarre spielen'), example: 'Sie kann Gitarre spielen.' },
  { word: 'kochen', emoji: '🍳', translation: l('to cook', 'yemek yapmak', 'kochen'), example: 'Wir müssen heute kochen.' },
  { word: 'lernen', emoji: '📚', translation: l('to study', 'ders çalışmak', 'lernen'), example: 'Ich muss für den Test lernen.' },
  { word: 'aufräumen', emoji: '🧹', translation: l('to tidy up', 'toplamak, düzenlemek', 'aufräumen'), example: 'Du musst dein Zimmer aufräumen.' },
  { word: 'einkaufen', emoji: '🛒', translation: l('to go shopping', 'alışverişe gitmek', 'einkaufen'), example: 'Ich muss noch einkaufen.' },
  { word: 'schlafen', emoji: '😴', translation: l('to sleep', 'uyumak', 'schlafen'), example: 'Das Baby muss jetzt schlafen.' },
  { word: 'Zeit haben', emoji: '⏰', translation: l('to have time', 'vakti olmak', 'Zeit haben'), example: 'Kannst du morgen? Hast du Zeit?' },
]

const MORE_VOCAB: VocabItem[] = [
  { word: 'leider', translation: l('unfortunately', 'maalesef', 'leider') },
  { word: 'gut / nicht gut', translation: l('well / not well', 'iyi / iyi değil', 'gut / nicht gut') },
  { word: 'helfen', translation: l('to help', 'yardım etmek', 'helfen') },
  { word: 'kommen', translation: l('to come', 'gelmek', 'kommen') },
  { word: 'Test', gender: 'm', plural: 'die Tests', translation: l('test', 'sınav', 'Test') },
  { word: 'Zimmer', gender: 'n', plural: 'die Zimmer', translation: l('room', 'oda', 'Zimmer') },
]

const KOENNEN = { ich: 'kann', du: 'kannst', er: 'kann', wir: 'können', ihr: 'könnt', sie: 'können' } as const
const MUESSEN = { ich: 'muss', du: 'musst', er: 'muss', wir: 'müssen', ihr: 'müsst', sie: 'müssen' } as const
type Person = keyof typeof KOENNEN

function modalDrills(): Exercise[] {
  const persons = Object.keys(KOENNEN) as Person[]
  return (['können', 'müssen'] as const).flatMap((verb, v) =>
    persons.map((person, i) => {
      const table = verb === 'können' ? KOENNEN : MUESSEN
      const right = table[person]
      const others = [...new Set(Object.values(table))].filter((f) => f !== right)
      const options = [right, others[(i + v) % others.length], others[(i + v + 1) % others.length]]
      const rotation = (i + v) % 3
      const ordered = [...options.slice(rotation), ...options.slice(0, rotation)]
      return {
        id: `${verb === 'können' ? 'koennen' : 'muessen'}-${person}`,
        type: 'multiple_choice' as const,
        topic: 'forms',
        concept: `${verb}-forms`,
        skill: 'grammar' as const,
        difficulty: 1 as const,
        prompt: `${person} ___ (${verb})`,
        options: ordered,
        answer: ordered.indexOf(right),
        explanation: l(
          `${verb}: ${person} ${right}. ich and er have no ending (ich ${table.ich}, er ${table.er}).`,
          `${verb}: ${person} ${right}. ich ve er ek almaz (ich ${table.ich}, er ${table.er}).`,
          `${verb}: ${person} ${right}. ich und er ohne Endung.`
        ),
      }
    })
  )
}

/** [subject, modal, middle, infinitive] – the infinitive must go to the end. */
const BRACKETS: [string, string, string, string][] = [
  ['Ich', 'kann', 'gut', 'schwimmen'],
  ['Du', 'musst', 'heute', 'arbeiten'],
  ['Wir', 'möchten', 'einen Kaffee', 'trinken'],
  ['Er', 'kann', 'kein Deutsch', 'sprechen'],
  ['Ihr', 'müsst', 'das Zimmer', 'aufräumen'],
  ['Sie', 'kann', 'sehr gut', 'kochen'],
]

function bracketDrills(): Exercise[] {
  return BRACKETS.map(([subject, modal, middle, infinitive], i) => {
    const right = `${subject} ${modal} ${middle} ${infinitive}.`
    const options = [right, `${subject} ${modal} ${infinitive} ${middle}.`, `${subject} ${middle} ${modal} ${infinitive}.`]
    const rotation = i % 3
    const ordered = [...options.slice(rotation), ...options.slice(0, rotation)]
    return {
      id: `bracket-${i + 1}`,
      type: 'multiple_choice' as const,
      topic: 'bracket',
      concept: 'modal-bracket',
      skill: 'grammar' as const,
      difficulty: 2 as const,
      prompt: `${subject} ${modal} … ?`,
      promptL10n: l('Which sentence is correct?', 'Hangi cümle doğru?', 'Welcher Satz ist richtig?'),
      options: ordered,
      answer: ordered.indexOf(right),
      explanation: l(
        `Modal verb „${modal}“ in position 2, infinitive „${infinitive}“ at the very end.`,
        `Modal fiil „${modal}“ 2. sırada, mastar „${infinitive}“ en sonda.`,
        `Modalverb „${modal}“ auf Position 2, Infinitiv „${infinitive}“ am Ende.`
      ),
      examples: [`${subject} **${modal}** ${middle} **${infinitive}**.`],
    }
  })
}

const EXERCISES: Exercise[] = [
  // --- Practice 1: recognise ----------------------------------------------
  {
    id: 'img-gitarre',
    type: 'image_choice',
    topic: 'meaning',
    concept: 'koennen-meaning',
    skill: 'vocabulary',
    difficulty: 1,
    prompt: 'Sie kann Gitarre spielen.',
    options: [
      { emoji: '🎸', label: 'Gitarre spielen' },
      { emoji: '🚗', label: 'Auto fahren' },
      { emoji: '🍳', label: 'kochen' },
      { emoji: '😴', label: 'schlafen' },
    ],
    answer: 0,
    explanation: l('können = ability: she can play the guitar.', 'können = yetenek: gitar çalabiliyor.', 'können = Fähigkeit.'),
    examples: ['Sie **kann** Gitarre **spielen**.'],
  },
  {
    id: 'match-meaning',
    type: 'matching',
    topic: 'meaning',
    concept: 'modal-meaning',
    skill: 'vocabulary',
    difficulty: 1,
    instructions: l('What does each modal verb express?', 'Her modal fiil neyi ifade eder?', 'Was drückt jedes Modalverb aus?'),
    pairs: [
      { left: 'können', right: l('ability / possibility', 'yetenek / imkân', 'Fähigkeit / Möglichkeit') },
      { left: 'müssen', right: l('necessity / obligation', 'zorunluluk', 'Notwendigkeit / Pflicht') },
      { left: 'möchten', right: l('polite wish', 'kibar istek', 'höflicher Wunsch') },
    ],
    explanation: l(
      'können = can, müssen = must / have to, möchten = would like to.',
      'können = -ebilmek, müssen = -meli / zorunda olmak, möchten = istemek.',
      'können = Fähigkeit, müssen = Pflicht, möchten = Wunsch.'
    ),
  },
  {
    id: 'mc-kannst',
    type: 'multiple_choice',
    topic: 'forms',
    concept: 'können-forms',
    skill: 'grammar',
    difficulty: 1,
    prompt: '___ du schwimmen?',
    options: ['Kannst', 'Kann', 'Könnt'],
    answer: 0,
    explanation: l('du kannst. Note the vowel: können → ich kann, du kannst.', 'du kannst. Sesli harfe dikkat: können → ich kann, du kannst.', 'du kannst (ö → a).'),
    examples: ['**Kannst** du schwimmen?'],
    practice: ['koennen-er', 'koennen-ihr'],
  },
  {
    id: 'mc-muss',
    type: 'multiple_choice',
    topic: 'forms',
    concept: 'müssen-forms',
    skill: 'grammar',
    difficulty: 1,
    prompt: 'Ich ___ heute lange arbeiten.',
    options: ['muss', 'musst', 'müssen'],
    answer: 0,
    explanation: l('ich muss – no ending, no umlaut.', 'ich muss – ek yok, umlaut yok.', 'ich muss – ohne Endung, ohne Umlaut.'),
    examples: ['Ich **muss** heute lange **arbeiten**.'],
    practice: ['muessen-du', 'muessen-wir'],
  },
  {
    id: 'sort-kann-muss',
    type: 'categorize',
    topic: 'meaning',
    concept: 'modal-meaning',
    skill: 'grammar',
    difficulty: 2,
    instructions: l('können (ability) or müssen (obligation)?', 'können (yetenek) mi müssen (zorunluluk) mu?', 'können oder müssen?'),
    categories: ['können', 'müssen'],
    items: [
      { text: 'Ich spreche drei Sprachen.', category: 0 },
      { text: 'Der Test ist morgen!', category: 1 },
      { text: 'Er schwimmt sehr gut.', category: 0 },
      { text: 'Das Zimmer ist chaotisch.', category: 1 },
      { text: 'Sie spielt Klavier.', category: 0 },
      { text: 'Der Kühlschrank ist leer.', category: 1 },
    ],
    explanation: l(
      'Abilities → können (Ich kann drei Sprachen sprechen). Things you have to do → müssen (Ich muss lernen / aufräumen / einkaufen).',
      'Yetenekler → können (Ich kann drei Sprachen sprechen). Yapmak zorunda oldukların → müssen (Ich muss lernen / aufräumen / einkaufen).',
      'Fähigkeit → können. Pflicht → müssen.'
    ),
  },
  {
    id: 'tf-end',
    type: 'true_false',
    topic: 'bracket',
    concept: 'modal-bracket',
    skill: 'grammar',
    difficulty: 1,
    statement: 'Ich kann spielen Gitarre.',
    answer: false,
    instructions: l('Is this sentence correct?', 'Bu cümle doğru mu?', 'Ist der Satz richtig?'),
    explanation: l(
      'The infinitive goes to the end: Ich kann Gitarre spielen.',
      'Mastar sona gider: Ich kann Gitarre spielen.',
      'Infinitiv ans Ende: Ich kann Gitarre spielen.'
    ),
    examples: ['Ich **kann** Gitarre **spielen**.'],
  },
  {
    id: 'select-correct',
    type: 'multiple_select',
    topic: 'bracket',
    concept: 'modal-bracket',
    skill: 'grammar',
    difficulty: 2,
    promptL10n: l('Select all correct sentences.', 'Tüm doğru cümleleri seç.', 'Wähle alle richtigen Sätze.'),
    options: [
      'Wir müssen heute einkaufen.',
      'Wir müssen einkaufen heute.',
      'Kannst du mir helfen?',
      'Kannst du helfen mir?',
      'Er möchte ein Eis essen.',
      'Er möchtet ein Eis essen.',
    ],
    answers: [0, 2, 4],
    explanation: l(
      'Modal in position 2 (or 1 in a question), infinitive at the end. er möchte (no -t).',
      'Modal 2. sırada (soruda 1.), mastar sonda. er möchte (-t yok).',
      'Modalverb auf Position 2, Infinitiv am Ende.'
    ),
  },
  {
    id: 'match-forms',
    type: 'matching',
    topic: 'forms',
    concept: 'können-forms',
    skill: 'grammar',
    difficulty: 1,
    instructions: l('Match person and form of können.', 'Kişi ve können biçimini eşleştir.', 'Ordne Person und Form von können zu.'),
    pairs: [
      { left: 'ich', right: 'kann' },
      { left: 'du', right: 'kannst' },
      { left: 'wir', right: 'können' },
      { left: 'ihr', right: 'könnt' },
    ],
    explanation: l('ich kann, du kannst, er kann, wir können, ihr könnt, sie können.', 'ich kann, du kannst, er kann, wir können, ihr könnt, sie können.', 'ich kann, du kannst, er kann, wir können, ihr könnt, sie können.'),
  },

  // --- Practice 2: use ----------------------------------------------------
  {
    id: 'fill-musst',
    type: 'fill_blank',
    topic: 'forms',
    concept: 'müssen-forms',
    skill: 'grammar',
    difficulty: 1,
    sentence: 'Du ___ dein Zimmer aufräumen!',
    accepted: ['musst'],
    base: 'müssen',
    explanation: l('du musst.', 'du musst.', 'du musst.'),
    examples: ['Du **musst** dein Zimmer **aufräumen**.'],
  },
  {
    id: 'fill-koennt',
    type: 'fill_blank',
    topic: 'forms',
    concept: 'können-forms',
    skill: 'grammar',
    difficulty: 2,
    sentence: '___ ihr morgen kommen?',
    accepted: ['Könnt'],
    base: 'können',
    explanation: l('ihr könnt → Könnt ihr …?', 'ihr könnt → Könnt ihr …?', 'ihr könnt → Könnt ihr …?'),
    examples: ['**Könnt** ihr morgen **kommen**?'],
  },
  {
    id: 'fill-sprechen',
    type: 'fill_blank',
    topic: 'bracket',
    concept: 'modal-bracket',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Meine Mutter kann sehr gut Englisch ___.',
    accepted: ['sprechen'],
    base: 'sprechen',
    explanation: l('After a modal verb: infinitive at the end – sprechen (not spricht).', 'Modal fiilden sonra: sonda mastar – sprechen (spricht değil).', 'Nach Modalverb: Infinitiv – sprechen.'),
    examples: ['Meine Mutter **kann** sehr gut Englisch **sprechen**.'],
  },
  {
    id: 'build-kann',
    type: 'sentence_builder',
    topic: 'bracket',
    concept: 'modal-bracket',
    skill: 'grammar',
    difficulty: 1,
    chips: ['sprechen', 'kann', 'Ich', 'Deutsch'],
    answers: [['Ich', 'kann', 'Deutsch', 'sprechen']],
    translation: l('I can speak German.', 'Almanca konuşabiliyorum.', 'Ich kann Deutsch sprechen.'),
    explanation: l(
      'Modal verb = position 2. Main verb = infinitive at the end. Like a bracket around the sentence.',
      'Modal fiil = 2. pozisyon. Ana fiil = sonda mastar. Cümlenin etrafında bir parantez gibi.',
      'Modalverb = Position 2, Hauptverb = Infinitiv am Ende (Satzklammer).'
    ),
    examples: ['Ich **kann** Deutsch **sprechen**.'],
  },
  {
    id: 'build-muss',
    type: 'sentence_builder',
    topic: 'bracket',
    concept: 'modal-bracket',
    skill: 'grammar',
    difficulty: 2,
    chips: ['arbeiten', 'muss', 'Heute', 'ich'],
    answers: [['Heute', 'muss', 'ich', 'arbeiten']],
    translation: l('Today I have to work.', 'Bugün çalışmak zorundayım.', 'Heute muss ich arbeiten.'),
    explanation: l('Heute (1) + muss (2) + ich + … + arbeiten (end).', 'Heute (1) + muss (2) + ich + … + arbeiten (son).', 'Heute + muss + ich + arbeiten.'),
    examples: ['Heute **muss** ich **arbeiten**.'],
  },
  {
    id: 'build-question',
    type: 'sentence_builder',
    topic: 'bracket',
    concept: 'modal-bracket',
    skill: 'grammar',
    difficulty: 2,
    chips: ['helfen', 'du', 'mir', 'Kannst'],
    answers: [['Kannst', 'du', 'mir', 'helfen']],
    end: '?',
    translation: l('Can you help me?', 'Bana yardım edebilir misin?', 'Kannst du mir helfen?'),
    explanation: l('Yes/no question: modal first, infinitive still at the end.', 'Evet/hayır sorusu: modal başta, mastar yine sonda.', 'Ja/Nein-Frage: Modalverb zuerst, Infinitiv am Ende.'),
    examples: ['**Kannst** du mir **helfen**?'],
  },
  {
    id: 'fix-kann-spielt',
    type: 'error_correction',
    topic: 'bracket',
    concept: 'modal-bracket',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Er kann gut Fußball spielt.',
    accepted: ['Er kann gut Fußball spielen.'],
    explanation: l('After a modal: infinitive (spielen), not spielt.', 'Modal fiilden sonra mastar (spielen) gelir, spielt değil.', 'Nach Modalverb: Infinitiv.'),
    examples: ['Er **kann** gut Fußball **spielen**.'],
  },
  {
    id: 'fix-musst-ich',
    type: 'error_correction',
    topic: 'forms',
    concept: 'müssen-forms',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Ich musse morgen früh aufstehen.',
    accepted: ['Ich muss morgen früh aufstehen.'],
    explanation: l('ich muss – no -e.', 'ich muss – -e yok.', 'ich muss – ohne -e.'),
    examples: ['Ich **muss** morgen früh **aufstehen**.'],
  },
  {
    id: 'tr-kann-nicht',
    type: 'translation',
    topic: 'bracket',
    concept: 'modal-bracket',
    skill: 'writing',
    difficulty: 2,
    source: l('I can’t come today.', 'Bugün gelemiyorum.', 'I can’t come today.'),
    accepted: ['Ich kann heute nicht kommen.', 'Heute kann ich nicht kommen.'],
    explanation: l('kann (2) … nicht … kommen (end).', 'kann (2) … nicht … kommen (son).', 'kann … nicht … kommen.'),
    examples: ['Ich **kann** heute nicht **kommen**.'],
  },
  {
    id: 'tr-muessen',
    type: 'translation',
    topic: 'bracket',
    concept: 'modal-bracket',
    skill: 'writing',
    difficulty: 2,
    source: l('We have to go shopping.', 'Alışverişe gitmek zorundayız.', 'We have to go shopping.'),
    accepted: ['Wir müssen einkaufen.', 'Wir müssen einkaufen gehen.'],
    explanation: l('Wir müssen einkaufen.', 'Wir müssen einkaufen.', 'Wir müssen einkaufen.'),
    examples: ['Wir **müssen** **einkaufen**.'],
  },
  {
    id: 'dialog-einladung',
    type: 'dialogue',
    topic: 'meaning',
    concept: 'modal-meaning',
    skill: 'grammar',
    difficulty: 2,
    lines: [{ speaker: 'Ben', de: 'Kommst du heute Abend ins Kino?' }],
    options: ['Leider nicht. Ich muss lernen.', 'Leider nicht. Ich kann lernen.', 'Leider nicht. Ich muss lerne.'],
    answer: 0,
    explanation: l(
      'An obligation is the reason you can’t come → müssen + infinitive.',
      'Gelememenin nedeni bir zorunluluk → müssen + mastar.',
      'Pflicht → müssen + Infinitiv.'
    ),
    examples: ['Leider nicht. Ich **muss** **lernen**.'],
  },
  {
    id: 'dialog-hilfe',
    type: 'dialogue',
    topic: 'forms',
    concept: 'können-forms',
    skill: 'grammar',
    difficulty: 1,
    lines: [{ speaker: 'Frau Roth', de: 'Können Sie mir bitte helfen?' }],
    options: ['Ja, natürlich!', 'Ja, ich muss.', 'Ja, Sie können.'],
    answer: 0,
    explanation: l(
      '„Können Sie …?“ is a polite request. Answer: „Ja, natürlich!“ / „Ja, gern!“',
      '„Können Sie …?“ kibar bir ricadır. Cevap: „Ja, natürlich!“ / „Ja, gern!“',
      '„Können Sie …?“ = höfliche Bitte.'
    ),
  },

  // --- Reading --------------------------------------------------------
  {
    id: 'read-kann',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-familie',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Was kann Mia gut?',
    options: ['zeichnen', 'kochen', 'Auto fahren'],
    answer: 0,
    explanation: l('„Mia kann sehr gut zeichnen.“', '„Mia kann sehr gut zeichnen.“', '„Mia kann sehr gut zeichnen.“'),
  },
  {
    id: 'read-muss',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-familie',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Was muss Paul am Samstag machen?',
    options: ['arbeiten', 'aufräumen', 'einkaufen'],
    answer: 0,
    explanation: l('„Paul muss am Samstag arbeiten.“', '„Paul muss am Samstag arbeiten.“', '„Paul muss am Samstag arbeiten.“'),
  },
  {
    id: 'read-auto',
    type: 'true_false',
    topic: 'reading',
    concept: 'reading-familie',
    skill: 'reading',
    difficulty: 2,
    statement: 'Oma kann Auto fahren.',
    answer: false,
    explanation: l('„Oma kann nicht Auto fahren.“', '„Oma kann nicht Auto fahren.“', '„Oma kann nicht Auto fahren.“'),
  },
  {
    id: 'read-moechte',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-familie',
    skill: 'reading',
    difficulty: 2,
    prompt: 'Was möchte die Familie am Sonntag machen?',
    options: ['einen Ausflug', 'kochen', 'schlafen'],
    answer: 0,
    explanation: l('„Am Sonntag möchten alle zusammen einen Ausflug machen.“', '„Am Sonntag möchten alle zusammen einen Ausflug machen.“', '„… einen Ausflug machen.“'),
  },

  // --- Listening ----------------------------------------------------
  {
    id: 'listen-kann',
    type: 'listening_choice',
    topic: 'meaning',
    concept: 'koennen-meaning',
    skill: 'listening',
    difficulty: 1,
    audio: 'Ich kann leider nicht schwimmen.',
    question: l('Can the person swim?', 'Kişi yüzebiliyor mu?', 'Kann die Person schwimmen?'),
    options: ['Ja', 'Nein'],
    answer: 1,
    explanation: l('„kann leider nicht schwimmen“', '„kann leider nicht schwimmen“', '„kann nicht schwimmen“'),
  },
  {
    id: 'listen-muss',
    type: 'listening_choice',
    topic: 'meaning',
    concept: 'muessen-meaning',
    skill: 'listening',
    difficulty: 1,
    audio: 'Morgen muss ich zum Arzt.',
    question: l('What does the person have to do tomorrow?', 'Kişi yarın ne yapmak zorunda?', 'Was muss die Person morgen?'),
    options: ['🩺 zum Arzt', '🛒 einkaufen', '💼 arbeiten'],
    answer: 0,
    explanation: l('„zum Arzt“ = to the doctor.', '„zum Arzt“ = doktora.', '„zum Arzt“.'),
  },
  {
    id: 'listen-koennt',
    type: 'listening_choice',
    topic: 'forms',
    concept: 'können-forms',
    skill: 'listening',
    difficulty: 2,
    audio: 'Könnt ihr am Samstag helfen?',
    question: l('Who is asked?', 'Kime soruluyor?', 'Wer wird gefragt?'),
    options: ['du', 'ihr', 'Sie'],
    answer: 1,
    explanation: l('„Könnt ihr …?“', '„Könnt ihr …?“', '„Könnt ihr …?“'),
  },
  {
    id: 'listen-moechte',
    type: 'listening_choice',
    topic: 'meaning',
    concept: 'modal-meaning',
    skill: 'listening',
    difficulty: 2,
    audio: 'Ich möchte gern Gitarre spielen lernen.',
    question: l('What is it – a wish, an ability or an obligation?', 'Bu ne – istek mi, yetenek mi, zorunluluk mu?', 'Wunsch, Fähigkeit oder Pflicht?'),
    options: ['Wunsch', 'Fähigkeit', 'Pflicht'],
    answer: 0,
    explanation: l('möchten = wish.', 'möchten = istek.', 'möchten = Wunsch.'),
  },

  ...modalDrills(),
  ...bracketDrills(),
]

export const UNIT14_MODALVERBEN: CourseUnit = {
  level: 'A1',
  number: 14,
  slug: 'modalverben',
  titleDe: 'Modalverben',
  title: l('Modal verbs', 'Modal fiiller', 'Modalverben'),
  goal: l(
    'By the end of this unit you can say what you can do, what you have to do and what you would like to do – with the verb bracket: modal in position 2, infinitive at the end.',
    'Bu ünitenin sonunda neler yapabildiğini, neleri yapmak zorunda olduğunu ve neler yapmak istediğini söyleyebilirsin – fiil parantezi ile: modal 2. sırada, mastar sonda.',
    'Am Ende dieser Einheit sagst du, was du kannst, musst und möchtest – mit der Satzklammer: Modalverb auf Position 2, Infinitiv am Ende.'
  ),
  minutes: [15, 20],
  topics: [
    { key: 'forms', label: l('können / müssen forms', 'können / müssen biçimleri', 'Formen von können / müssen') },
    { key: 'bracket', label: l('Infinitive at the end', 'Mastar sonda', 'Infinitiv am Ende') },
    { key: 'meaning', label: l('can / must / would like', '-ebilmek / -meli / istemek', 'können / müssen / möchten') },
  ],
  vocabulary: [...VOCAB, ...MORE_VOCAB],
  exercises: EXERCISES,
  mastery: { minAnswered: 0.7, minAccuracy: 0.7 },
  sections: [
    {
      key: 'discover',
      kind: 'discover',
      title: l('Discover', 'Keşfet', 'Entdecken'),
      intro: l('Three modal verbs and activities to use them with.', 'Üç modal fiil ve onlarla kullanılacak etkinlikler.', 'Drei Modalverben und Aktivitäten dazu.'),
      cards: VOCAB,
    },
    {
      key: 'understand',
      kind: 'understand',
      title: l('Understand', 'Anla', 'Verstehen'),
      rules: [
        {
          title: l('The verb bracket', 'Fiil parantezi', 'Die Satzklammer'),
          body: l(
            'The modal verb is conjugated and stands in position 2. The main verb stays in the infinitive and goes to the very end. Everything else is inside the bracket.',
            'Modal fiil çekimlenir ve 2. sırada durur. Ana fiil mastar halinde kalır ve en sona gider. Geri kalan her şey parantezin içindedir.',
            'Das Modalverb ist konjugiert auf Position 2. Das Hauptverb steht im Infinitiv am Ende.'
          ),
          table: {
            head: [l('Position 1', '1. pozisyon', 'Position 1'), l('modal (2)', 'modal (2)', 'Modalverb (2)'), l('…', '…', '…'), l('infinitive (end)', 'mastar (son)', 'Infinitiv (Ende)')],
            rows: [
              ['Ich', 'kann', 'gut', 'schwimmen.'],
              ['Heute', 'muss', 'ich lange', 'arbeiten.'],
              ['Wir', 'möchten', 'einen Kaffee', 'trinken.'],
            ],
          },
          tip: l(
            'Think of two pillars: modal in slot 2, infinitive at the end.',
            'İki direk düşün: modal 2. yerde, mastar sonda.',
            'Zwei Säulen: Modalverb auf Platz 2, Infinitiv am Ende.'
          ),
        },
        {
          title: l('Forms', 'Biçimler', 'Formen'),
          body: l(
            'Singular forms change their vowel (können → kann, müssen → muss). ich and er have no ending.',
            'Tekil biçimlerde sesli harf değişir (können → kann, müssen → muss). ich ve er ek almaz.',
            'Im Singular ändert sich der Vokal. ich und er ohne Endung.'
          ),
          table: {
            head: [l('Person', 'Kişi', 'Person'), l('können', 'können', 'können'), l('müssen', 'müssen', 'müssen'), l('möchten', 'möchten', 'möchten')],
            rows: [
              ['ich', 'kann', 'muss', 'möchte'],
              ['du', 'kannst', 'musst', 'möchtest'],
              ['er / sie', 'kann', 'muss', 'möchte'],
              ['wir', 'können', 'müssen', 'möchten'],
              ['ihr', 'könnt', 'müsst', 'möchtet'],
              ['sie / Sie', 'können', 'müssen', 'möchten'],
            ],
          },
        },
        {
          title: l('What they mean', 'Ne anlama gelirler', 'Bedeutung'),
          body: l(
            'können = ability or possibility. müssen = necessity, something you have to do. möchten = a polite wish.',
            'können = yetenek ya da imkân. müssen = zorunluluk, yapmak zorunda olduğun şey. möchten = kibar bir istek.',
            'können = Fähigkeit/Möglichkeit, müssen = Notwendigkeit, möchten = Wunsch.'
          ),
          examples: [
            { de: 'Ich **kann** Gitarre **spielen**.', translation: l('I can play the guitar.', 'Gitar çalabiliyorum.', 'Fähigkeit') },
            { de: 'Ich **muss** heute **lernen**.', translation: l('I have to study today.', 'Bugün ders çalışmak zorundayım.', 'Pflicht') },
            { de: '**Können** Sie mir **helfen**?', translation: l('Can you help me? (polite request)', 'Bana yardım edebilir misiniz? (kibar rica)', 'höfliche Bitte') },
          ],
        },
      ],
    },
    {
      key: 'context',
      kind: 'context',
      title: l('See it in context', 'Bağlamda gör', 'Im Kontext'),
      scene: l('Ben invites Sara to a party on Saturday.', 'Ben, Sara’yı cumartesi bir partiye davet ediyor.', 'Ben lädt Sara zu einer Party am Samstag ein.'),
      dialogue: [
        { speaker: 'Ben', de: 'Am Samstag ist meine Party. **Kannst** du **kommen**?', translation: l('My party is on Saturday. Can you come?', 'Cumartesi partim var. Gelebilir misin?', '') },
        { speaker: 'Sara', de: 'Ich **möchte** gern **kommen**, aber ich **muss** bis sechs **arbeiten**.', translation: l('I’d like to come, but I have to work until six.', 'Gelmek isterim ama altıya kadar çalışmak zorundayım.', '') },
        { speaker: 'Ben', de: 'Kein Problem! Die Party beginnt um acht.', translation: l('No problem! The party starts at eight.', 'Sorun değil! Parti sekizde başlıyor.', '') },
        { speaker: 'Sara', de: 'Super! **Kann** ich etwas **mitbringen**?', translation: l('Great! Can I bring something?', 'Süper! Bir şey getirebilir miyim?', '') },
        { speaker: 'Ben', de: 'Du **kannst** so gut Kuchen **backen**!', translation: l('You can bake cake so well!', 'Çok güzel pasta yapıyorsun!', '') },
        { speaker: 'Sara', de: 'Okay, dann **muss** ich am Freitag **einkaufen**.', translation: l('Okay, then I have to go shopping on Friday.', 'Tamam, o zaman cuma alışveriş yapmalıyım.', '') },
      ],
      examples: [
        { de: 'Ich **kann** gut **schwimmen**.', translation: l('I can swim well.', 'İyi yüzebiliyorum.', '') },
        { de: '**Kannst** du Auto **fahren**?', translation: l('Can you drive?', 'Araba sürebiliyor musun?', '') },
        { de: 'Er **kann** nicht **kommen**.', translation: l('He can’t come.', 'Gelemiyor.', '') },
        { de: 'Wir **müssen** **einkaufen**.', translation: l('We have to go shopping.', 'Alışverişe gitmeliyiz.', '') },
        { de: 'Du **musst** dein Zimmer **aufräumen**.', translation: l('You must tidy your room.', 'Odanı toplamalısın.', '') },
        { de: 'Ich **möchte** Deutsch **lernen**.', translation: l('I would like to learn German.', 'Almanca öğrenmek istiyorum.', '') },
        { de: 'Heute **muss** ich lange **arbeiten**.', translation: l('Today I have to work long.', 'Bugün uzun süre çalışmalıyım.', '') },
      ],
    },
    {
      key: 'practice-recognize',
      kind: 'practice',
      title: l('Practice 1 · Recognise', 'Pratik 1 · Tanı', 'Übung 1 · Erkennen'),
      intro: l('Meanings, forms and the bracket.', 'Anlamlar, biçimler ve parantez.', 'Bedeutung, Formen und Satzklammer.'),
      exercises: ['img-gitarre', 'match-meaning', 'mc-kannst', 'mc-muss', 'sort-kann-muss', 'tf-end', 'select-correct', 'match-forms', 'bracket-1', 'bracket-2'],
    },
    {
      key: 'practice-use',
      kind: 'practice',
      title: l('Practice 2 · Use', 'Pratik 2 · Kullan', 'Übung 2 · Anwenden'),
      intro: l('Build sentences with the verb bracket.', 'Fiil paranteziyle cümle kur.', 'Bau Sätze mit der Satzklammer.'),
      exercises: [
        'fill-musst',
        'fill-koennt',
        'fill-sprechen',
        'build-kann',
        'build-muss',
        'build-question',
        'fix-kann-spielt',
        'fix-musst-ich',
        'tr-kann-nicht',
        'tr-muessen',
        'dialog-einladung',
        'dialog-hilfe',
        'bracket-3',
        'bracket-4',
      ],
    },
    {
      key: 'reading',
      kind: 'reading',
      title: l('Reading', 'Okuma', 'Lesen'),
      intro: l('Who can do what in the Weber family?', 'Weber ailesinde kim ne yapabiliyor?', 'Wer kann was in Familie Weber?'),
      passage: [
        'In Familie Weber **kann** jeder etwas gut.',
        'Mia **kann** sehr gut **zeichnen**. Paul **kann** toll **kochen**, aber er **muss** am Samstag **arbeiten**.',
        'Oma **kann** nicht Auto **fahren**, aber sie **kann** drei Sprachen **sprechen**.',
        'Am Sonntag **möchten** alle zusammen einen Ausflug **machen**.',
      ],
      glossary: [
        { de: 'jeder', note: l('everyone', 'herkes', 'alle') },
        { de: 'zeichnen', note: l('to draw', 'resim çizmek', 'Bilder malen') },
        { de: 'toll', note: l('great', 'harika', 'super') },
        { de: 'der Ausflug', note: l('trip, outing', 'gezi', 'kleine Reise') },
      ],
      exercises: ['read-kann', 'read-muss', 'read-auto', 'read-moechte'],
    },
    {
      key: 'listening',
      kind: 'listening',
      title: l('Listening', 'Dinleme', 'Hören'),
      intro: l('Listen for the modal verb – and the infinitive at the end.', 'Modal fiile – ve sondaki mastara – kulak ver.', 'Hör auf das Modalverb – und den Infinitiv am Ende.'),
      exercises: ['listen-kann', 'listen-muss', 'listen-koennt', 'listen-moechte'],
    },
    {
      key: 'speaking',
      kind: 'speaking',
      title: l('Speaking', 'Konuşma', 'Sprechen'),
      prompt: l('Talk about your abilities, obligations and wishes.', 'Yeteneklerin, zorunlulukların ve isteklerinden bahset.', 'Sprich über Fähigkeiten, Pflichten und Wünsche.'),
      points: [
        l('Two things you can do: „Ich kann …“', 'Yapabildiğin iki şey: „Ich kann …“', 'Zwei Dinge, die du kannst'),
        l('Something you can’t do: „Ich kann nicht …“', 'Yapamadığın bir şey: „Ich kann nicht …“', 'Etwas, das du nicht kannst'),
        l('What you have to do this week: „Ich muss …“', 'Bu hafta yapman gereken: „Ich muss …“', 'Was du diese Woche musst'),
        l('A wish: „Ich möchte … lernen.“', 'Bir istek: „Ich möchte … lernen.“', 'Ein Wunsch'),
      ],
      model: ['Ich kann gut kochen und schwimmen.', 'Ich kann leider nicht Auto fahren.', 'Diese Woche muss ich viel arbeiten.', 'Ich möchte Gitarre spielen lernen.'],
    },
    {
      key: 'writing',
      kind: 'writing',
      title: l('Writing', 'Yazma', 'Schreiben'),
      prompt: l(
        'Write a short message: you can’t come to a party – explain why and say what you would like to do instead. (at least 3 sentences)',
        'Kısa bir mesaj yaz: bir partiye gelemiyorsun – nedenini açıkla ve onun yerine ne yapmak istediğini söyle. (en az 3 cümle)',
        'Schreib eine kurze Nachricht: Du kannst nicht zur Party kommen – erklär warum und was du stattdessen möchtest. (mindestens 3 Sätze)'
      ),
      minSentences: 3,
      checks: [
        { label: l('A form of können', 'können’in bir biçimi', 'Eine Form von können'), pattern: '\\b(kann|kannst|können|könnt)\\b' },
        { label: l('A form of müssen', 'müssen’in bir biçimi', 'Eine Form von müssen'), pattern: '\\b(muss|musst|müssen|müsst)\\b' },
        { label: l('An infinitive at the end of a sentence', 'Cümle sonunda bir mastar', 'Ein Infinitiv am Satzende'), pattern: '\\p{Ll}+en[.!?]' },
      ],
      model: ['Hallo Ben, leider kann ich am Samstag nicht kommen.', 'Ich muss arbeiten.', 'Aber ich möchte dich am Sonntag besuchen.'],
    },
    {
      key: 'speed',
      kind: 'timed',
      title: l('Speed round', 'Hız turu', 'Schnellrunde'),
      intro: l('Forms and word order – 60 seconds.', 'Biçimler ve dizilim – 60 saniye.', 'Formen und Satzstellung – 60 Sekunden.'),
      seconds: 60,
      pool: [
        ...['koennen', 'muessen'].flatMap((verb) => (Object.keys(KOENNEN) as Person[]).map((p) => `${verb}-${p}`)),
        ...BRACKETS.map((_, i) => `bracket-${i + 1}`),
      ],
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
      l('können = ability, müssen = obligation, möchten = wish', 'können = yetenek, müssen = zorunluluk, möchten = istek', 'können / müssen / möchten'),
      l('ich kann, du kannst – ich muss, du musst', 'ich kann, du kannst – ich muss, du musst', 'ich kann, du kannst – ich muss, du musst'),
      l('Verb bracket: modal (2) … infinitive (end)', 'Fiil parantezi: modal (2) … mastar (son)', 'Satzklammer: Modalverb … Infinitiv'),
      l('Polite requests: Können Sie …?', 'Kibar ricalar: Können Sie …?', 'Höfliche Bitte: Können Sie …?'),
    ],
    mistakes: [
      { wrong: 'Ich kann spielen Gitarre.', right: 'Ich kann Gitarre spielen.', note: l('Infinitive at the end.', 'Mastar sonda.', 'Infinitiv am Ende.') },
      { wrong: 'Er kann gut kocht.', right: 'Er kann gut kochen.', note: l('Infinitive, not conjugated.', 'Çekimsiz mastar.', 'Infinitiv.') },
      { wrong: 'Ich musse arbeiten.', right: 'Ich muss arbeiten.', note: l('ich muss – no -e.', 'ich muss – -e yok.', 'ich muss.') },
      { wrong: 'Ihr könnet kommen.', right: 'Ihr könnt kommen.', note: l('ihr könnt', 'ihr könnt', 'ihr könnt') },
    ],
  },
}
