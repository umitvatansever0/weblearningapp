import type { CourseUnit, Exercise, VocabItem } from '../types'
import { l } from '../l10n'

const VOCAB: VocabItem[] = [
  { word: 'heute', emoji: '📅', translation: l('today', 'bugün', 'heute'), example: 'Heute lerne ich Deutsch.' },
  { word: 'morgen', emoji: '🌅', translation: l('tomorrow', 'yarın', 'morgen'), example: 'Morgen arbeite ich nicht.' },
  { word: 'jetzt', emoji: '⏰', translation: l('now', 'şimdi', 'jetzt'), example: 'Jetzt trinken wir Kaffee.' },
  { word: 'dann', emoji: '➡️', translation: l('then', 'sonra', 'dann'), example: 'Dann gehe ich nach Hause.' },
  { word: 'danach', emoji: '⏭️', translation: l('after that', 'ondan sonra', 'danach'), example: 'Danach kocht Paul.' },
  { word: 'später', emoji: '🕓', translation: l('later', 'daha sonra', 'später'), example: 'Später spielen wir Karten.' },
  { word: 'am Morgen', emoji: '🌄', translation: l('in the morning', 'sabahleyin', 'am Morgen'), example: 'Am Morgen trinke ich Tee.' },
  { word: 'am Abend', emoji: '🌆', translation: l('in the evening', 'akşamleyin', 'am Abend'), example: 'Am Abend kocht Paul.' },
  { word: 'am Wochenende', emoji: '🛋️', translation: l('at the weekend', 'hafta sonu', 'am Wochenende'), example: 'Am Wochenende schlafe ich lange.' },
  { word: 'oft', emoji: '🔁', translation: l('often', 'sık sık', 'oft'), example: 'Ich koche oft.' },
  { word: 'manchmal', emoji: '🎲', translation: l('sometimes', 'bazen', 'manchmal'), example: 'Manchmal gehen wir ins Kino.' },
  { word: 'immer', emoji: '♾️', translation: l('always', 'her zaman', 'immer'), example: 'Er kommt immer spät.' },
]

const MORE_VOCAB: VocabItem[] = [
  { word: 'das Verb', translation: l('verb', 'fiil', 'Verb') },
  { word: 'das Subjekt', translation: l('subject', 'özne', 'Subjekt') },
  { word: 'die Position', translation: l('position', 'pozisyon, sıra', 'Position') },
  { word: 'nach Hause', translation: l('(to) home', 'eve', 'nach Hause') },
  { word: 'Pasta', gender: 'f', translation: l('pasta', 'makarna', 'Pasta') },
]

/** [position 1, verb, subject, rest] – the verb must stay in position 2. */
const SENTENCES: [string, string, string, string][] = [
  ['Heute', 'lerne', 'ich', 'Deutsch'],
  ['Am Abend', 'kocht', 'Paul', 'Pasta'],
  ['Morgen', 'arbeitet', 'Anna', 'nicht'],
  ['Am Wochenende', 'spielen', 'wir', 'Fußball'],
  ['Dann', 'trinkt', 'sie', 'Kaffee'],
  ['Jetzt', 'wohnt', 'er', 'in Köln'],
  ['Am Montag', 'hast', 'du', 'Deutschkurs'],
  ['Später', 'gehen', 'wir', 'nach Hause'],
  ['Im Sommer', 'schwimmt', 'Lea', 'oft'],
  ['Danach', 'hören', 'sie', 'Musik'],
]

/** Pick the correct order: verb in position 2 vs the two typical mistakes. */
function wordOrderDrills(): Exercise[] {
  return SENTENCES.map(([first, verb, subject, rest], i) => {
    const right = `${first} ${verb} ${subject} ${rest}.`
    const verbThird = `${first} ${subject} ${verb} ${rest}.`
    const verbLast = `${first} ${subject} ${rest} ${verb}.`
    const options = [right, verbThird, verbLast]
    const rotation = i % 3
    const ordered = [...options.slice(rotation), ...options.slice(0, rotation)]
    return {
      id: `order-${i + 1}`,
      type: 'multiple_choice' as const,
      topic: 'inversion',
      concept: 'inversion',
      skill: 'grammar' as const,
      difficulty: 2 as const,
      prompt: `${first} … ?`,
      promptL10n: l('Which sentence is correct?', 'Hangi cümle doğru?', 'Welcher Satz ist richtig?'),
      options: ordered,
      answer: ordered.indexOf(right),
      explanation: l(
        `„${first}“ is position 1, so the verb „${verb}“ comes second and the subject „${subject}“ moves behind it.`,
        `„${first}“ 1. pozisyonda, bu yüzden fiil „${verb}“ ikinci sıraya gelir ve özne „${subject}“ fiilin arkasına geçer.`,
        `„${first}“ steht auf Position 1, also kommt das Verb „${verb}“ an zweiter Stelle und das Subjekt „${subject}“ dahinter.`
      ),
      examples: [`${first} **${verb}** ${subject} ${rest}.`],
    }
  })
}

const EXERCISES: Exercise[] = [
  // --- Practice 1: recognise ----------------------------------------------
  {
    id: 'mc-find-verb',
    type: 'multiple_choice',
    topic: 'verb-position',
    concept: 'find-verb',
    skill: 'grammar',
    difficulty: 1,
    prompt: 'Am Abend spielt Tom Gitarre.',
    promptL10n: l('Which word is the verb?', 'Hangi kelime fiil?', 'Welches Wort ist das Verb?'),
    options: ['Abend', 'spielt', 'Tom', 'Gitarre'],
    answer: 1,
    explanation: l(
      'spielt is the conjugated verb – and it is in position 2 („Am Abend“ counts as one position).',
      'spielt çekimli fiildir – ve 2. pozisyondadır („Am Abend“ tek bir pozisyon sayılır).',
      'spielt ist das konjugierte Verb – auf Position 2 („Am Abend“ ist eine Position).'
    ),
    examples: ['Am Abend **spielt** Tom Gitarre.'],
    practice: ['mc-find-verb-2'],
  },
  {
    id: 'mc-find-verb-2',
    type: 'multiple_choice',
    topic: 'verb-position',
    concept: 'find-verb',
    skill: 'grammar',
    difficulty: 1,
    prompt: 'Meine Schwester wohnt in Wien.',
    promptL10n: l('Which word is the verb?', 'Hangi kelime fiil?', 'Welches Wort ist das Verb?'),
    options: ['Schwester', 'wohnt', 'Wien'],
    answer: 1,
    explanation: l('„Meine Schwester“ = position 1, wohnt = position 2.', '„Meine Schwester“ = 1. pozisyon, wohnt = 2. pozisyon.', '„Meine Schwester“ = Position 1, wohnt = Position 2.'),
    examples: ['Meine Schwester **wohnt** in Wien.'],
  },
  {
    id: 'sort-positions',
    type: 'categorize',
    topic: 'verb-position',
    concept: 'positions',
    skill: 'grammar',
    difficulty: 2,
    instructions: l(
      '„Heute lerne ich Deutsch.“ – Which part is in which position?',
      '„Heute lerne ich Deutsch.“ – Hangi parça hangi pozisyonda?',
      '„Heute lerne ich Deutsch.“ – Welcher Teil steht auf welcher Position?'
    ),
    categories: ['Position 1', 'Position 2 (Verb)', 'Rest'],
    items: [
      { text: 'Heute', category: 0 },
      { text: 'lerne', category: 1 },
      { text: 'ich', category: 2 },
      { text: 'Deutsch', category: 2 },
    ],
    explanation: l(
      'Heute (1) – lerne (2) – ich Deutsch (rest). The subject „ich“ moves behind the verb.',
      'Heute (1) – lerne (2) – ich Deutsch (geri kalan). Özne „ich“ fiilin arkasına geçer.',
      'Heute (1) – lerne (2) – ich Deutsch (Rest). Das Subjekt „ich“ steht hinter dem Verb.'
    ),
  },
  {
    id: 'tf-heute-ich',
    type: 'true_false',
    topic: 'inversion',
    concept: 'inversion',
    skill: 'grammar',
    difficulty: 1,
    statement: 'Heute ich lerne Deutsch.',
    answer: false,
    instructions: l('Is this sentence correct?', 'Bu cümle doğru mu?', 'Ist der Satz richtig?'),
    explanation: l(
      'The verb would be in position 3. Correct: Heute lerne ich Deutsch.',
      'Fiil 3. pozisyonda kalmış. Doğrusu: Heute lerne ich Deutsch.',
      'Das Verb stünde auf Position 3. Richtig: Heute lerne ich Deutsch.'
    ),
    examples: ['Heute **lerne** ich Deutsch.'],
  },
  {
    id: 'tf-kommst-du',
    type: 'true_false',
    topic: 'questions',
    concept: 'yes-no-question',
    skill: 'grammar',
    difficulty: 1,
    statement: 'Kommst du morgen?',
    answer: true,
    instructions: l('Is this sentence correct?', 'Bu cümle doğru mu?', 'Ist der Satz richtig?'),
    explanation: l(
      'Yes/no question: the verb goes to position 1. Kommst du morgen? – Ja. / Nein.',
      'Evet/hayır sorusu: fiil 1. pozisyona gider. Kommst du morgen? – Ja. / Nein.',
      'Ja/Nein-Frage: Das Verb steht auf Position 1.'
    ),
    examples: ['**Kommst** du morgen?'],
  },
  {
    id: 'select-correct',
    type: 'multiple_select',
    topic: 'inversion',
    concept: 'inversion',
    skill: 'grammar',
    difficulty: 2,
    promptL10n: l('Select all correct sentences.', 'Tüm doğru cümleleri seç.', 'Wähle alle richtigen Sätze.'),
    options: [
      'Morgen arbeite ich.',
      'Morgen ich arbeite.',
      'Ich arbeite morgen.',
      'Am Abend kocht Paul.',
      'Am Abend Paul kocht.',
      'Paul kocht am Abend.',
    ],
    answers: [0, 2, 3, 5],
    explanation: l(
      'Both orders work – as long as the verb is second: Ich arbeite morgen. / Morgen arbeite ich.',
      'İki dizilim de olur – yeter ki fiil ikinci olsun: Ich arbeite morgen. / Morgen arbeite ich.',
      'Beide Reihenfolgen gehen – Hauptsache, das Verb steht an zweiter Stelle.'
    ),
  },
  {
    id: 'match-questions',
    type: 'matching',
    topic: 'questions',
    concept: 'question-types',
    skill: 'grammar',
    difficulty: 2,
    instructions: l('Match the questions and answers.', 'Soruları ve cevapları eşleştir.', 'Ordne Fragen und Antworten zu.'),
    pairs: [
      { left: 'Wohnst du in Köln?', right: 'Ja.' },
      { left: 'Wo wohnst du?', right: 'In Köln.' },
      { left: 'Arbeitest du heute?', right: 'Nein, morgen.' },
      { left: 'Wann arbeitest du?', right: 'Am Montag.' },
    ],
    explanation: l(
      'Verb first → yes/no answer. Question word first → information answer.',
      'Fiil başta → evet/hayır cevabı. Soru kelimesi başta → bilgi cevabı.',
      'Verb zuerst → Ja/Nein. Fragewort zuerst → Information.'
    ),
  },
  {
    id: 'mc-position-3',
    type: 'multiple_choice',
    topic: 'inversion',
    concept: 'inversion',
    skill: 'grammar',
    difficulty: 1,
    prompt: 'Am Wochenende ___ wir lange.',
    options: ['schlafen', 'wir schlafen', 'schläft'],
    answer: 0,
    explanation: l(
      'Position 1 = Am Wochenende, position 2 = schlafen, then wir.',
      '1. pozisyon = Am Wochenende, 2. pozisyon = schlafen, sonra wir.',
      'Position 1 = Am Wochenende, Position 2 = schlafen, dann wir.'
    ),
    examples: ['Am Wochenende **schlafen** wir lange.'],
  },

  // --- Practice 2: use -----------------------------------------------------
  {
    id: 'build-heute',
    type: 'sentence_builder',
    topic: 'inversion',
    concept: 'inversion',
    skill: 'grammar',
    difficulty: 1,
    chips: ['lerne', 'Deutsch', 'Heute', 'ich'],
    answers: [['Heute', 'lerne', 'ich', 'Deutsch']],
    translation: l('Today I’m learning German.', 'Bugün Almanca öğreniyorum.', 'Heute lerne ich Deutsch.'),
    explanation: l('Heute (1) + lerne (2) + ich + Deutsch.', 'Heute (1) + lerne (2) + ich + Deutsch.', 'Heute (1) + lerne (2) + ich + Deutsch.'),
    examples: ['Heute **lerne** ich Deutsch.'],
    practice: ['build-am-abend'],
  },
  {
    id: 'build-am-abend',
    type: 'sentence_builder',
    topic: 'inversion',
    concept: 'inversion',
    skill: 'grammar',
    difficulty: 2,
    chips: ['Paul', 'Am Abend', 'Pasta', 'kocht'],
    answers: [['Am Abend', 'kocht', 'Paul', 'Pasta']],
    translation: l('In the evening Paul cooks pasta.', 'Akşam Paul makarna yapıyor.', 'Am Abend kocht Paul Pasta.'),
    explanation: l('Am Abend (1) + kocht (2) + Paul + Pasta.', 'Am Abend (1) + kocht (2) + Paul + Pasta.', 'Am Abend (1) + kocht (2) + Paul + Pasta.'),
    examples: ['Am Abend **kocht** Paul Pasta.'],
  },
  {
    id: 'build-question',
    type: 'sentence_builder',
    topic: 'questions',
    concept: 'yes-no-question',
    skill: 'grammar',
    difficulty: 1,
    chips: ['du', 'Kaffee', 'Trinkst'],
    answers: [['Trinkst', 'du', 'Kaffee']],
    end: '?',
    translation: l('Do you drink coffee?', 'Kahve içer misin?', 'Trinkst du Kaffee?'),
    explanation: l('Yes/no question: verb – subject – rest.', 'Evet/hayır sorusu: fiil – özne – geri kalan.', 'Ja/Nein-Frage: Verb – Subjekt – Rest.'),
    examples: ['**Trinkst** du Kaffee?'],
  },
  {
    id: 'build-nicht',
    type: 'sentence_builder',
    topic: 'verb-position',
    concept: 'nicht-position',
    skill: 'grammar',
    difficulty: 2,
    chips: ['arbeitet', 'nicht', 'Anna', 'Morgen'],
    answers: [['Morgen', 'arbeitet', 'Anna', 'nicht']],
    translation: l('Anna is not working tomorrow.', 'Anna yarın çalışmıyor.', 'Morgen arbeitet Anna nicht.'),
    explanation: l('Verb second, nicht at the end.', 'Fiil ikinci, nicht sonda.', 'Verb an zweiter Stelle, nicht am Ende.'),
    examples: ['Morgen **arbeitet** Anna nicht.'],
  },
  {
    id: 'build-wann',
    type: 'sentence_builder',
    topic: 'questions',
    concept: 'w-question',
    skill: 'grammar',
    difficulty: 1,
    chips: ['ihr', 'Wann', 'kommt'],
    answers: [['Wann', 'kommt', 'ihr']],
    end: '?',
    translation: l('When are you (pl.) coming?', 'Ne zaman geliyorsunuz?', 'Wann kommt ihr?'),
    explanation: l('W-question: question word (1) + verb (2).', 'Soru kelimeli soru: soru kelimesi (1) + fiil (2).', 'W-Frage: Fragewort (1) + Verb (2).'),
    examples: ['Wann **kommt** ihr?'],
  },
  {
    id: 'fix-dann-ich',
    type: 'error_correction',
    topic: 'inversion',
    concept: 'inversion',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Dann ich gehe nach Hause.',
    accepted: ['Dann gehe ich nach Hause.'],
    explanation: l('Dann (1) + gehe (2) + ich.', 'Dann (1) + gehe (2) + ich.', 'Dann (1) + gehe (2) + ich.'),
    examples: ['Dann **gehe** ich nach Hause.'],
  },
  {
    id: 'fix-question',
    type: 'error_correction',
    topic: 'questions',
    concept: 'yes-no-question',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Du wohnst in Berlin?',
    accepted: ['Wohnst du in Berlin?'],
    instructions: l(
      'Make it a proper yes/no question.',
      'Bunu doğru bir evet/hayır sorusu yap.',
      'Mach daraus eine richtige Ja/Nein-Frage.'
    ),
    explanation: l(
      'In spoken German you hear „Du wohnst in Berlin?“, but the standard question puts the verb first: Wohnst du in Berlin?',
      'Konuşmada „Du wohnst in Berlin?“ de duyulur, ama standart soruda fiil başa gelir: Wohnst du in Berlin?',
      'Gesprochen hört man das manchmal, aber die Standardfrage: Wohnst du in Berlin?'
    ),
    examples: ['**Wohnst** du in Berlin?'],
  },
  {
    id: 'fix-verb-last',
    type: 'error_correction',
    topic: 'verb-position',
    concept: 'v2',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Ich jeden Tag Deutsch lerne.',
    accepted: ['Ich lerne jeden Tag Deutsch.', 'Jeden Tag lerne ich Deutsch.'],
    explanation: l(
      'Not like Turkish – the verb does not go to the end in a main clause: Ich lerne jeden Tag Deutsch.',
      'Türkçedeki gibi değil – ana cümlede fiil sona gitmez: Ich lerne jeden Tag Deutsch.',
      'Im Hauptsatz steht das Verb nicht am Ende: Ich lerne jeden Tag Deutsch.'
    ),
    examples: ['Ich **lerne** jeden Tag Deutsch.'],
  },
  {
    id: 'tr-morgen',
    type: 'translation',
    topic: 'inversion',
    concept: 'inversion',
    skill: 'writing',
    difficulty: 2,
    source: l('Tomorrow I am working.', 'Yarın çalışıyorum.', 'Tomorrow I am working.'),
    accepted: ['Morgen arbeite ich.', 'Ich arbeite morgen.'],
    explanation: l('Morgen arbeite ich. / Ich arbeite morgen.', 'Morgen arbeite ich. / Ich arbeite morgen.', 'Morgen arbeite ich. / Ich arbeite morgen.'),
    examples: ['Morgen **arbeite** ich.'],
  },
  {
    id: 'tr-spielst-du',
    type: 'translation',
    topic: 'questions',
    concept: 'yes-no-question',
    skill: 'writing',
    difficulty: 2,
    source: l('Do you play tennis?', 'Tenis oynar mısın?', 'Do you play tennis?'),
    accepted: ['Spielst du Tennis?'],
    explanation: l(
      'German has no „do“ in questions: just put the verb first.',
      'Almancada soru için ek bir kelime yok: fiili başa koy yeter.',
      'Kein Hilfsverb nötig: Verb an den Anfang.'
    ),
    examples: ['**Spielst** du Tennis?'],
  },
  {
    id: 'ordering-day',
    type: 'ordering',
    topic: 'verb-position',
    concept: 'v2',
    skill: 'reading',
    difficulty: 2,
    promptL10n: l('Put Paul’s evening in order.', 'Paul’un akşamını sıraya koy.', 'Bring Pauls Abend in die richtige Reihenfolge.'),
    items: ['Danach essen wir zusammen.', 'Zuerst kauft Paul Gemüse.', 'Später spielen wir Karten.', 'Dann kocht er Pasta.'],
    answer: ['Zuerst kauft Paul Gemüse.', 'Dann kocht er Pasta.', 'Danach essen wir zusammen.', 'Später spielen wir Karten.'],
    explanation: l(
      'zuerst (first) → dann (then) → danach (after that) → später (later). Each time: time word + verb + subject.',
      'zuerst (önce) → dann (sonra) → danach (ondan sonra) → später (daha sonra). Her seferinde: zaman kelimesi + fiil + özne.',
      'zuerst → dann → danach → später. Jedes Mal: Zeitwort + Verb + Subjekt.'
    ),
  },
  {
    id: 'dialog-heute',
    type: 'dialogue',
    topic: 'inversion',
    concept: 'inversion',
    skill: 'grammar',
    difficulty: 1,
    lines: [{ speaker: 'Mia', de: 'Was machst du heute Abend?' }],
    options: ['Heute Abend koche ich.', 'Heute Abend ich koche.', 'Heute Abend koche.'],
    answer: 0,
    explanation: l('Heute Abend (1) + koche (2) + ich.', 'Heute Abend (1) + koche (2) + ich.', 'Heute Abend (1) + koche (2) + ich.'),
    examples: ['Heute Abend **koche** ich.'],
  },

  // --- Reading ------------------------------------------------------------
  {
    id: 'read-morgen',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-paul',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Was macht Paul am Sonntagmorgen?',
    options: ['Er joggt im Park.', 'Er kocht.', 'Er arbeitet.'],
    answer: 0,
    explanation: l('„Am Morgen joggt er im Park.“', '„Am Morgen joggt er im Park.“', '„Am Morgen joggt er im Park.“'),
  },
  {
    id: 'read-mittag',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-paul',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Wer kommt zum Mittagessen?',
    options: ['Seine Eltern.', 'Seine Kollegen.', 'Niemand.'],
    answer: 0,
    explanation: l('„Mittags kommen seine Eltern.“', '„Mittags kommen seine Eltern.“', '„Mittags kommen seine Eltern.“'),
  },
  {
    id: 'read-arbeit',
    type: 'true_false',
    topic: 'reading',
    concept: 'reading-paul',
    skill: 'reading',
    difficulty: 1,
    statement: 'Am Sonntag arbeitet Paul.',
    answer: false,
    explanation: l('„Am Sonntag arbeitet Paul nicht.“', '„Am Sonntag arbeitet Paul nicht.“', '„Am Sonntag arbeitet Paul nicht.“'),
  },
  {
    id: 'read-abend',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-paul',
    skill: 'reading',
    difficulty: 2,
    prompt: 'Was macht Paul am Abend?',
    options: ['Er sieht einen Film.', 'Er spielt Fußball.', 'Er besucht Freunde.'],
    answer: 0,
    explanation: l('„Am Abend sieht er einen Film.“', '„Am Abend sieht er einen Film.“', '„Am Abend sieht er einen Film.“'),
  },

  // --- Listening ---------------------------------------------------------
  {
    id: 'listen-maria',
    type: 'listening_choice',
    topic: 'inversion',
    concept: 'inversion',
    skill: 'listening',
    difficulty: 1,
    audio: 'Am Montag arbeitet Maria.',
    question: l('Who works on Monday?', 'Pazartesi kim çalışıyor?', 'Wer arbeitet am Montag?'),
    options: ['Maria', 'Montag', 'niemand'],
    answer: 0,
    explanation: l('The subject (Maria) comes after the verb.', 'Özne (Maria) fiilden sonra geliyor.', 'Das Subjekt (Maria) steht nach dem Verb.'),
  },
  {
    id: 'listen-question',
    type: 'listening_choice',
    topic: 'questions',
    concept: 'yes-no-question',
    skill: 'listening',
    difficulty: 1,
    audio: 'Kommst du heute?',
    question: l('Is this a question or a statement?', 'Bu soru mu, düz cümle mi?', 'Frage oder Aussage?'),
    options: ['Frage', 'Aussage'],
    answer: 0,
    explanation: l('Verb first + rising tone = question.', 'Fiil başta + yükselen ton = soru.', 'Verb zuerst + Stimme hoch = Frage.'),
  },
  {
    id: 'listen-dann',
    type: 'listening_choice',
    topic: 'inversion',
    concept: 'inversion',
    skill: 'listening',
    difficulty: 2,
    audio: 'Zuerst trinke ich Kaffee, dann lese ich die Zeitung.',
    question: l('What comes second?', 'İkinci olarak ne geliyor?', 'Was kommt als Zweites?'),
    options: ['☕ Kaffee trinken', '📰 Zeitung lesen', '🚶 spazieren gehen'],
    answer: 1,
    explanation: l('zuerst = first, dann = then.', 'zuerst = önce, dann = sonra.', 'zuerst, dann.'),
  },
  {
    id: 'listen-nicht',
    type: 'listening_choice',
    topic: 'verb-position',
    concept: 'nicht-position',
    skill: 'listening',
    difficulty: 2,
    audio: 'Morgen komme ich nicht.',
    question: l('Is the person coming tomorrow?', 'Kişi yarın geliyor mu?', 'Kommt die Person morgen?'),
    options: ['Ja', 'Nein'],
    answer: 1,
    explanation: l('„nicht“ at the end – easy to miss!', 'Sondaki „nicht“ kolayca kaçırılır!', '„nicht“ am Ende – leicht zu überhören!'),
  },

  ...wordOrderDrills(),
]

export const UNIT08_SATZBAU: CourseUnit = {
  level: 'A1',
  number: 8,
  slug: 'satzbau',
  titleDe: 'Satzbau',
  title: l('Word order', 'Cümle yapısı', 'Satzbau'),
  goal: l(
    'By the end of this unit you always put the verb in the right place: second in statements and W-questions, first in yes/no questions.',
    'Bu ünitenin sonunda fiili her zaman doğru yere koyarsın: düz cümlede ve W-sorularında ikinci, evet/hayır sorularında birinci sıraya.',
    'Am Ende dieser Einheit steht dein Verb immer richtig: an zweiter Stelle in Aussagen und W-Fragen, an erster Stelle in Ja/Nein-Fragen.'
  ),
  minutes: [15, 20],
  topics: [
    { key: 'verb-position', label: l('Verb in position 2', '2. pozisyonda fiil', 'Verb auf Position 2') },
    { key: 'inversion', label: l('Time first: Heute lerne ich …', 'Önce zaman: Heute lerne ich …', 'Zeit zuerst: Heute lerne ich …') },
    { key: 'questions', label: l('Question order', 'Soru dizilimi', 'Fragen') },
  ],
  vocabulary: [...VOCAB, ...MORE_VOCAB],
  exercises: EXERCISES,
  mastery: { minAnswered: 0.7, minAccuracy: 0.7 },
  sections: [
    {
      key: 'discover',
      kind: 'discover',
      title: l('Discover', 'Keşfet', 'Entdecken'),
      intro: l(
        'Time words like these often start a sentence – and then the order changes.',
        'Bunlar gibi zaman kelimeleri sıkça cümleye başlar – ve o zaman dizilim değişir.',
        'Zeitwörter wie diese stehen oft am Satzanfang – dann ändert sich die Reihenfolge.'
      ),
      cards: VOCAB,
    },
    {
      key: 'understand',
      kind: 'understand',
      title: l('Understand', 'Anla', 'Verstehen'),
      rules: [
        {
          title: l('The golden rule: verb in position 2', 'Altın kural: fiil 2. pozisyonda', 'Die goldene Regel: Verb auf Position 2'),
          body: l(
            'In a German statement the conjugated verb is always the second element. Position 1 can be one word or a group (Meine Schwester, Am Abend).',
            'Almanca düz cümlede çekimli fiil her zaman ikinci öğedir. 1. pozisyon tek bir kelime ya da bir grup olabilir (Meine Schwester, Am Abend).',
            'Im Aussagesatz ist das konjugierte Verb immer das zweite Element. Position 1 kann ein Wort oder eine Gruppe sein.'
          ),
          table: {
            head: [l('Position 1', '1. pozisyon', 'Position 1'), l('Position 2', '2. pozisyon', 'Position 2'), l('rest', 'geri kalan', 'Rest')],
            rows: [
              ['Ich', 'lerne', 'Deutsch.'],
              ['Maria', 'wohnt', 'in Berlin.'],
              ['Meine Schwester', 'kauft', 'Brot.'],
            ],
          },
        },
        {
          title: l('Something else first? The subject moves!', 'Başka bir şey başta mı? Özne yer değiştirir!', 'Etwas anderes zuerst? Das Subjekt wandert!'),
          body: l(
            'If a time or place starts the sentence, the verb stays in position 2 and the subject comes right after the verb.',
            'Cümleye bir zaman ya da yer başlarsa, fiil 2. pozisyonda kalır ve özne fiilin hemen arkasına gelir.',
            'Steht eine Zeit oder ein Ort am Anfang, bleibt das Verb auf Position 2 und das Subjekt kommt direkt danach.'
          ),
          table: {
            head: [l('Position 1', '1. pozisyon', 'Position 1'), l('Position 2', '2. pozisyon', 'Position 2'), l('subject', 'özne', 'Subjekt'), l('rest', 'geri kalan', 'Rest')],
            rows: [
              ['Heute', 'lerne', 'ich', 'Deutsch.'],
              ['Am Abend', 'kocht', 'Paul', 'Pasta.'],
              ['In Berlin', 'wohnt', 'Maria', 'seit 2020.'],
            ],
          },
          tip: l(
            'Think of the verb as a fixed pillar in slot 2. Everything else moves around it.',
            'Fiili 2. yerde sabit bir direk gibi düşün. Her şey onun etrafında yer değiştirir.',
            'Das Verb ist eine feste Säule auf Platz 2 – alles andere bewegt sich darum.'
          ),
        },
        {
          title: l('Questions', 'Sorular', 'Fragen'),
          body: l(
            'W-question: question word (1) + verb (2) → Wo wohnst du? Yes/no question: verb first → Wohnst du in Berlin?',
            'W-sorusu: soru kelimesi (1) + fiil (2) → Wo wohnst du? Evet/hayır sorusu: fiil başta → Wohnst du in Berlin?',
            'W-Frage: Fragewort (1) + Verb (2) → Wo wohnst du? Ja/Nein-Frage: Verb zuerst → Wohnst du in Berlin?'
          ),
          examples: [
            { de: 'Wann **kommst** du?', translation: l('When are you coming?', 'Ne zaman geliyorsun?', 'W-Frage') },
            { de: '**Kommst** du heute?', translation: l('Are you coming today?', 'Bugün geliyor musun?', 'Ja/Nein-Frage') },
          ],
        },
        {
          title: l('Not like Turkish', 'Türkçe gibi değil', 'Anders als im Türkischen'),
          body: l(
            'Turkish and many languages put the verb at the end. In a German main clause it never goes to the end: Ich lerne jeden Tag Deutsch (not: Ich jeden Tag Deutsch lerne).',
            'Türkçe ve birçok dil fiili sona koyar. Almanca ana cümlede fiil asla sona gitmez: Ich lerne jeden Tag Deutsch (Ich jeden Tag Deutsch lerne değil).',
            'Im Hauptsatz steht das Verb nie am Ende: Ich lerne jeden Tag Deutsch.'
          ),
        },
      ],
    },
    {
      key: 'context',
      kind: 'context',
      title: l('See it in context', 'Bağlamda gör', 'Im Kontext'),
      scene: l('Mia and Paul plan their Saturday.', 'Mia ve Paul cumartesilerini planlıyor.', 'Mia und Paul planen ihren Samstag.'),
      dialogue: [
        { speaker: 'Mia', de: '**Arbeitest** du am Samstag?', translation: l('Are you working on Saturday?', 'Cumartesi çalışıyor musun?', '') },
        { speaker: 'Paul', de: 'Nein. Am Samstag **arbeite** ich nicht.', translation: l('No. On Saturday I’m not working.', 'Hayır. Cumartesi çalışmıyorum.', '') },
        { speaker: 'Mia', de: 'Super! Was **machen** wir?', translation: l('Great! What shall we do?', 'Süper! Ne yapalım?', '') },
        { speaker: 'Paul', de: 'Zuerst **kaufen** wir auf dem Markt ein. Dann **koche** ich.', translation: l('First we shop at the market. Then I’ll cook.', 'Önce pazardan alışveriş yaparız. Sonra ben yemek yaparım.', '') },
        { speaker: 'Mia', de: 'Und am Abend **gehen** wir ins Kino?', translation: l('And in the evening we go to the cinema?', 'Ve akşam sinemaya mı gidiyoruz?', '') },
        { speaker: 'Paul', de: 'Ja! Später **spielen** wir dann noch Karten.', translation: l('Yes! Later we’ll play cards too.', 'Evet! Daha sonra da kâğıt oynarız.', '') },
      ],
      examples: [
        { de: 'Ich **lerne** heute Deutsch.', translation: l('I’m learning German today.', 'Bugün Almanca öğreniyorum.', '') },
        { de: 'Heute **lerne** ich Deutsch.', translation: l('Today I’m learning German.', 'Bugün Almanca öğreniyorum.', '') },
        { de: 'Maria **wohnt** in Berlin.', translation: l('Maria lives in Berlin.', 'Maria Berlin’de oturuyor.', '') },
        { de: 'Jetzt **wohnt** Maria in Berlin.', translation: l('Now Maria lives in Berlin.', 'Şimdi Maria Berlin’de oturuyor.', '') },
        { de: 'Wo **wohnt** Maria?', translation: l('Where does Maria live?', 'Maria nerede oturuyor?', '') },
        { de: '**Wohnt** Maria in Berlin?', translation: l('Does Maria live in Berlin?', 'Maria Berlin’de mi oturuyor?', '') },
        { de: 'Am Sonntag **arbeitet** Paul nicht.', translation: l('Paul doesn’t work on Sunday.', 'Paul pazar günü çalışmıyor.', '') },
      ],
    },
    {
      key: 'practice-recognize',
      kind: 'practice',
      title: l('Practice 1 · Recognise', 'Pratik 1 · Tanı', 'Übung 1 · Erkennen'),
      intro: l('Find the verb and its position.', 'Fiili ve pozisyonunu bul.', 'Finde das Verb und seine Position.'),
      exercises: ['mc-find-verb', 'sort-positions', 'tf-heute-ich', 'tf-kommst-du', 'select-correct', 'match-questions', 'mc-position-3', 'order-1', 'order-2'],
    },
    {
      key: 'practice-use',
      kind: 'practice',
      title: l('Practice 2 · Use', 'Pratik 2 · Kullan', 'Übung 2 · Anwenden'),
      intro: l('Build sentences and questions with the verb in the right place.', 'Fiili doğru yere koyarak cümle ve soru kur.', 'Bau Sätze und Fragen mit dem Verb an der richtigen Stelle.'),
      exercises: [
        'build-heute',
        'build-question',
        'build-nicht',
        'build-wann',
        'fix-dann-ich',
        'fix-question',
        'fix-verb-last',
        'tr-morgen',
        'tr-spielst-du',
        'ordering-day',
        'dialog-heute',
        'order-3',
        'order-4',
      ],
    },
    {
      key: 'reading',
      kind: 'reading',
      title: l('Reading', 'Okuma', 'Lesen'),
      intro: l('Paul’s Sunday. Notice where the verb stands in each sentence.', 'Paul’un pazar günü. Her cümlede fiilin yerine dikkat et.', 'Pauls Sonntag. Achte auf das Verb in jedem Satz.'),
      passage: [
        'Am Sonntag **arbeitet** Paul nicht.',
        'Am Morgen **joggt** er im Park. Danach **frühstückt** er lange.',
        'Mittags **kommen** seine Eltern. Paul **kocht** Pasta.',
        'Am Nachmittag **gehen** sie spazieren.',
        'Am Abend **sieht** er einen Film.',
      ],
      glossary: [
        { de: 'joggen', note: l('to jog', 'koşmak (jogging)', 'laufen') },
        { de: 'frühstücken', note: l('to have breakfast', 'kahvaltı yapmak', 'Frühstück essen') },
        { de: 'mittags', note: l('at noon', 'öğlen', 'um 12 Uhr') },
        { de: 'einen Film sehen', note: l('to watch a film', 'film izlemek', 'Film schauen') },
      ],
      exercises: ['read-morgen', 'read-mittag', 'read-arbeit', 'read-abend'],
    },
    {
      key: 'listening',
      kind: 'listening',
      title: l('Listening', 'Dinleme', 'Hören'),
      intro: l('Who does what? Listen for the subject after the verb.', 'Kim ne yapıyor? Fiilden sonraki özneye kulak ver.', 'Wer macht was? Hör auf das Subjekt nach dem Verb.'),
      exercises: ['listen-maria', 'listen-question', 'listen-dann', 'listen-nicht'],
    },
    {
      key: 'speaking',
      kind: 'speaking',
      title: l('Speaking', 'Konuşma', 'Sprechen'),
      prompt: l('Describe your Sunday – start your sentences with time words.', 'Pazar gününü anlat – cümlelerine zaman kelimeleriyle başla.', 'Beschreib deinen Sonntag – beginne mit Zeitwörtern.'),
      points: [
        l('„Am Morgen … ich …“', '„Am Morgen … ich …“', '„Am Morgen … ich …“'),
        l('„Dann / Danach … ich …“', '„Dann / Danach … ich …“', '„Dann / Danach … ich …“'),
        l('„Am Abend … ich …“', '„Am Abend … ich …“', '„Am Abend … ich …“'),
        l('Ask a yes/no question: „Machst du auch …?“', 'Evet/hayır sorusu sor: „Machst du auch …?“', 'Stell eine Ja/Nein-Frage: „Machst du auch …?“'),
      ],
      model: ['Am Morgen schlafe ich lange.', 'Dann frühstücke ich mit meiner Familie.', 'Am Nachmittag gehen wir spazieren.', 'Am Abend lese ich ein Buch.', 'Und du? Arbeitest du am Sonntag?'],
    },
    {
      key: 'writing',
      kind: 'writing',
      title: l('Writing', 'Yazma', 'Schreiben'),
      prompt: l(
        'Write at least 4 sentences about your day. Start at least two of them with a time word – and ask one question.',
        'Günün hakkında en az 4 cümle yaz. En az ikisine zaman kelimesiyle başla – ve bir soru sor.',
        'Schreib mindestens 4 Sätze über deinen Tag. Beginne mindestens zwei mit einem Zeitwort – und stell eine Frage.'
      ),
      minSentences: 4,
      checks: [
        {
          label: l('Time word + verb + subject (Heute lerne ich …)', 'Zaman kelimesi + fiil + özne (Heute lerne ich …)', 'Zeitwort + Verb + Subjekt (Heute lerne ich …)'),
          pattern: '(^|[.!?]\\s*)(Heute|Morgen|Jetzt|Dann|Danach|Später|Zuerst|Am \\p{Lu}\\p{Ll}+|Um \\d+ Uhr) \\p{Ll}+ (ich|du|er|sie|es|wir|ihr)\\b',
        },
        { label: l('A sentence starting with the subject (Ich …)', 'Özneyle başlayan bir cümle (Ich …)', 'Ein Satz mit Subjekt am Anfang (Ich …)'), pattern: '(^|[.!?]\\s*)(Ich|Wir|Er|Sie|Mein|Meine) \\S+' },
        { label: l('A question', 'Bir soru', 'Eine Frage'), pattern: '\\?' },
      ],
      model: ['Ich stehe um sieben Uhr auf.', 'Dann trinke ich Kaffee.', 'Am Abend koche ich mit meinem Mann.', 'Danach sehen wir einen Film.', 'Und was machst du am Abend?'],
    },
    {
      key: 'speed',
      kind: 'timed',
      title: l('Speed round', 'Hız turu', 'Schnellrunde'),
      intro: l('Spot the correct word order – 60 seconds.', 'Doğru dizilimi bul – 60 saniye.', 'Finde die richtige Satzstellung – 60 Sekunden.'),
      seconds: 60,
      pool: SENTENCES.map((_, i) => `order-${i + 1}`),
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
      l('The verb is always in position 2 in statements', 'Düz cümlede fiil her zaman 2. pozisyonda', 'Im Aussagesatz: Verb immer auf Position 2'),
      l('Time first → subject after the verb: Heute lerne ich …', 'Önce zaman → özne fiilden sonra: Heute lerne ich …', 'Zeit zuerst → Subjekt nach dem Verb'),
      l('W-questions: Wo wohnst du?', 'W-soruları: Wo wohnst du?', 'W-Fragen: Wo wohnst du?'),
      l('Yes/no questions: verb first – Wohnst du …?', 'Evet/hayır soruları: fiil başta – Wohnst du …?', 'Ja/Nein-Fragen: Verb zuerst'),
      l('zuerst, dann, danach, später', 'zuerst, dann, danach, später', 'zuerst, dann, danach, später'),
    ],
    mistakes: [
      { wrong: 'Heute ich lerne Deutsch.', right: 'Heute lerne ich Deutsch.', note: l('Verb in position 2.', 'Fiil 2. pozisyonda.', 'Verb auf Position 2.') },
      { wrong: 'Ich jeden Tag Deutsch lerne.', right: 'Ich lerne jeden Tag Deutsch.', note: l('Verb not at the end.', 'Fiil sonda değil.', 'Verb nicht am Ende.') },
      { wrong: 'Du kommst morgen?', right: 'Kommst du morgen?', note: l('Yes/no question: verb first.', 'Evet/hayır sorusu: fiil başta.', 'Ja/Nein-Frage: Verb zuerst.') },
      { wrong: 'Dann ich gehe nach Hause.', right: 'Dann gehe ich nach Hause.', note: l('dann (1) + verb (2).', 'dann (1) + fiil (2).', 'dann (1) + Verb (2).') },
    ],
  },
}
