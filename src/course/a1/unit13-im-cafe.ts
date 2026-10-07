import type { CourseUnit, Exercise, VocabItem } from '../types'
import { l } from '../l10n'

const VOCAB: VocabItem[] = [
  { word: 'Speisekarte', gender: 'f', plural: 'die Speisekarten', emoji: '📜', translation: l('menu', 'menü', 'Speisekarte'), example: 'Die Speisekarte, bitte.' },
  { word: 'Kellner', gender: 'm', plural: 'die Kellner', emoji: '🤵', translation: l('waiter', 'garson', 'Kellner'), example: 'Der Kellner bringt den Kaffee.' },
  { word: 'Rechnung', gender: 'f', plural: 'die Rechnungen', emoji: '🧾', translation: l('bill', 'hesap', 'Rechnung'), example: 'Die Rechnung, bitte!' },
  { word: 'Trinkgeld', gender: 'n', emoji: '💰', translation: l('tip', 'bahşiş', 'Trinkgeld'), example: 'In Deutschland gibt man Trinkgeld.' },
  { word: 'Tasse', gender: 'f', plural: 'die Tassen', emoji: '☕', translation: l('cup', 'fincan', 'Tasse'), example: 'eine Tasse Kaffee' },
  { word: 'Glas', gender: 'n', plural: 'die Gläser', emoji: '🥛', translation: l('glass', 'bardak', 'Glas'), example: 'ein Glas Wasser' },
  { word: 'Stück', gender: 'n', plural: 'die Stücke', emoji: '🍰', translation: l('piece', 'parça, dilim', 'Stück'), example: 'ein Stück Kuchen' },
  { word: 'Flasche', gender: 'f', plural: 'die Flaschen', emoji: '🍾', translation: l('bottle', 'şişe', 'Flasche'), example: 'eine Flasche Wasser' },
  { word: 'Portion', gender: 'f', plural: 'die Portionen', emoji: '🍟', translation: l('portion', 'porsiyon', 'Portion'), example: 'eine Portion Pommes' },
  { word: 'Tisch', gender: 'm', plural: 'die Tische', emoji: '🪑', translation: l('table', 'masa', 'Tisch'), example: 'Ist der Tisch frei?' },
  { word: 'bezahlen', emoji: '💳', translation: l('to pay', 'ödemek', 'bezahlen'), example: 'Ich möchte bezahlen.' },
  { word: 'bar', emoji: '💶', translation: l('in cash', 'nakit', 'bar'), example: 'Ich zahle bar.' },
]

const MORE_VOCAB: VocabItem[] = [
  { word: 'Kellnerin', gender: 'f', plural: 'die Kellnerinnen', translation: l('waitress', 'kadın garson', 'Kellnerin') },
  { word: 'nehmen', translation: l('to take, to have (food)', 'almak (yemek için)', 'nehmen') },
  { word: 'frei', translation: l('free, available', 'boş', 'frei') },
  { word: 'zusammen / getrennt', translation: l('together / separately (paying)', 'birlikte / ayrı ayrı (ödeme)', 'zusammen / getrennt') },
  { word: 'Stimmt so!', translation: l('Keep the change!', 'Üstü kalsın!', 'Stimmt so!') },
  { word: 'mit Karte', translation: l('by card', 'kartla', 'mit Karte') },
  { word: 'Kuchen', gender: 'm', plural: 'die Kuchen', translation: l('cake', 'pasta', 'Kuchen') },
  { word: 'Cappuccino', gender: 'm', plural: 'die Cappuccinos', translation: l('cappuccino', 'kapuçino', 'Cappuccino') },
  { word: 'Kaffee', gender: 'm', translation: l('coffee', 'kahve', 'Kaffee') },
  { word: 'Wasser', gender: 'n', translation: l('water', 'su', 'Wasser') },
]

const NEHMEN = { ich: 'nehme', du: 'nimmst', er: 'nimmt', wir: 'nehmen', ihr: 'nehmt', sie: 'nehmen' } as const
type Person = keyof typeof NEHMEN

/** nehmen is irregular for du/er (e → i, mm). */
function nehmenDrills(): Exercise[] {
  return (Object.keys(NEHMEN) as Person[]).map((person, i) => {
    const right = NEHMEN[person]
    const others = [...new Set(Object.values(NEHMEN)), 'nehmst', 'nehmt'].filter((f) => f !== right)
    const options = [...new Set([right, others[i % others.length], others[(i + 2) % others.length]])]
    const rotation = i % options.length
    const ordered = [...options.slice(rotation), ...options.slice(0, rotation)]
    return {
      id: `nehmen-${person}`,
      type: 'multiple_choice' as const,
      topic: 'nehmen',
      concept: 'nehmen-forms',
      skill: 'grammar' as const,
      difficulty: 1 as const,
      prompt: `${person} ___ (nehmen)`,
      options: ordered,
      answer: ordered.indexOf(right),
      explanation: l(
        `nehmen: ich nehme, du nimmst, er nimmt (e → i and double m for du/er), wir nehmen, ihr nehmt.`,
        `nehmen: ich nehme, du nimmst, er nimmt (du/er için e → i ve çift m), wir nehmen, ihr nehmt.`,
        `nehmen: ich nehme, du nimmst, er nimmt (e → i), wir nehmen, ihr nehmt.`
      ),
    }
  })
}

/** Situation → the right café phrase. */
const SITUATIONS: [ReturnType<typeof l>, string, [string, string]][] = [
  [l('You want to pay.', 'Ödemek istiyorsun.', 'Du möchtest bezahlen.'), 'Die Rechnung, bitte!', ['Die Speisekarte, bitte!', 'Guten Appetit!']],
  [l('You want to see the menu.', 'Menüyü görmek istiyorsun.', 'Du möchtest die Karte sehen.'), 'Die Speisekarte, bitte!', ['Stimmt so!', 'Zusammen, bitte.']],
  [l('The bill is €8.50. You give €10 and want no change.', 'Hesap 8,50 €. 10 € veriyorsun ve para üstü istemiyorsun.', 'Die Rechnung ist 8,50 €. Du gibst 10 € ohne Wechselgeld.'), 'Stimmt so!', ['Getrennt, bitte.', 'Ist hier frei?']],
  [l('You ask if a seat is free.', 'Bir yerin boş olup olmadığını soruyorsun.', 'Du fragst, ob ein Platz frei ist.'), 'Ist hier noch frei?', ['Die Rechnung, bitte!', 'Ich nehme den Kuchen.']],
  [l('Each person pays for themselves.', 'Herkes kendi hesabını ödüyor.', 'Jeder bezahlt für sich.'), 'Getrennt, bitte.', ['Zusammen, bitte.', 'Stimmt so!']],
  [l('The food arrives. You wish everyone a good meal.', 'Yemek geliyor. Herkese afiyet olsun diyorsun.', 'Das Essen kommt.'), 'Guten Appetit!', ['Gute Nacht!', 'Bis bald!']],
]

function situationDrills(): Exercise[] {
  return SITUATIONS.map(([situation, right, wrong], i) => {
    const options = [right, ...wrong]
    const rotation = i % 3
    const ordered = [...options.slice(rotation), ...options.slice(0, rotation)]
    return {
      id: `phrase-${i + 1}`,
      type: 'multiple_choice' as const,
      topic: 'phrases',
      concept: 'cafe-phrases',
      skill: 'vocabulary' as const,
      difficulty: 1 as const,
      prompt: '…',
      promptL10n: situation,
      options: ordered,
      answer: ordered.indexOf(right),
      explanation: l(`What you say: „${right}“`, `Söyleyeceğin: „${right}“`, `Man sagt: „${right}“`),
      examples: [`**${right}**`],
    }
  })
}

const EXERCISES: Exercise[] = [
  // --- Practice 1: recognise ----------------------------------------------
  {
    id: 'img-rechnung',
    type: 'image_choice',
    topic: 'phrases',
    concept: 'cafe-words',
    skill: 'vocabulary',
    difficulty: 1,
    prompt: 'die Rechnung',
    options: [
      { emoji: '📜', label: 'die Speisekarte' },
      { emoji: '🧾', label: 'die Rechnung' },
      { emoji: '💰', label: 'das Trinkgeld' },
      { emoji: '🍰', label: 'das Stück Kuchen' },
    ],
    answer: 1,
    explanation: l('die Rechnung = the bill.', 'die Rechnung = hesap.', 'die Rechnung.'),
    examples: ['**Die Rechnung**, bitte!'],
  },
  {
    id: 'match-containers',
    type: 'matching',
    topic: 'phrases',
    concept: 'containers',
    skill: 'vocabulary',
    difficulty: 1,
    instructions: l('Match the drink or food with how you order it.', 'İçecek ya da yiyeceği sipariş biçimiyle eşleştir.', 'Was passt zusammen?'),
    pairs: [
      { left: 'eine Tasse', right: 'Kaffee' },
      { left: 'ein Glas', right: 'Wasser' },
      { left: 'ein Stück', right: 'Kuchen' },
      { left: 'eine Portion', right: 'Pommes' },
    ],
    explanation: l(
      'eine Tasse Kaffee, ein Glas Wasser, ein Stück Kuchen, eine Portion Pommes – no „von“ in between!',
      'eine Tasse Kaffee, ein Glas Wasser, ein Stück Kuchen, eine Portion Pommes – arada „von“ yok!',
      'eine Tasse Kaffee, ein Glas Wasser, ein Stück Kuchen – ohne „von“!'
    ),
  },
  {
    id: 'mc-nimmst',
    type: 'multiple_choice',
    topic: 'nehmen',
    concept: 'nehmen-forms',
    skill: 'grammar',
    difficulty: 2,
    prompt: 'Was ___ du? – Ich nehme den Kuchen.',
    options: ['nimmst', 'nehmst', 'nehmen'],
    answer: 0,
    explanation: l(
      'nehmen is irregular: du nimmst, er nimmt (e → i). In cafés you often say „Ich nehme …“ = I’ll have …',
      'nehmen düzensizdir: du nimmst, er nimmt (e → i). Kafede sık sık „Ich nehme …“ = … alayım denir.',
      'nehmen ist unregelmäßig: du nimmst, er nimmt.'
    ),
    examples: ['Was **nimmst** du?', 'Ich **nehme** {m:den Kuchen}.'],
    practice: ['nehmen-er', 'nehmen-ihr'],
  },
  {
    id: 'tf-trinkgeld',
    type: 'true_false',
    topic: 'phrases',
    concept: 'cafe-culture',
    skill: 'reading',
    difficulty: 1,
    statement: 'In Deutschland gibt man im Café oft fünf bis zehn Prozent Trinkgeld.',
    answer: true,
    explanation: l(
      'Yes – usually you round up: €8.50 → „Neun Euro, bitte.“ or „Stimmt so!“',
      'Evet – genelde yukarı yuvarlanır: 8,50 € → „Neun Euro, bitte.“ ya da „Stimmt so!“',
      'Ja – man rundet auf: 8,50 € → „Neun Euro, bitte.“'
    ),
  },
  {
    id: 'sort-guest-waiter',
    type: 'categorize',
    topic: 'phrases',
    concept: 'cafe-phrases',
    skill: 'vocabulary',
    difficulty: 2,
    instructions: l('Who says it – the guest or the waiter?', 'Kim söyler – misafir mi garson mu?', 'Wer sagt das – Gast oder Kellner?'),
    categories: ['Gast 🙋', 'Kellner 🤵'],
    items: [
      { text: 'Die Rechnung, bitte!', category: 0 },
      { text: 'Was darf es sein?', category: 1 },
      { text: 'Ich nehme einen Tee.', category: 0 },
      { text: 'Zusammen oder getrennt?', category: 1 },
      { text: 'Stimmt so!', category: 0 },
      { text: 'Das macht 12,40 Euro.', category: 1 },
    ],
    explanation: l(
      'Waiter: Was darf es sein? / Zusammen oder getrennt? / Das macht … Guest: Ich nehme … / Die Rechnung, bitte! / Stimmt so!',
      'Garson: Was darf es sein? / Zusammen oder getrennt? / Das macht … Misafir: Ich nehme … / Die Rechnung, bitte! / Stimmt so!',
      'Kellner: Was darf es sein? … Gast: Ich nehme … / Die Rechnung, bitte!'
    ),
  },
  {
    id: 'select-polite',
    type: 'multiple_select',
    topic: 'ordering',
    concept: 'polite-order',
    skill: 'grammar',
    difficulty: 2,
    promptL10n: l('Which orders are correct and polite? Select all.', 'Hangi siparişler doğru ve kibar? Hepsini seç.', 'Welche Bestellungen sind richtig und höflich?'),
    options: ['Ich nehme einen Cappuccino.', 'Ich möchte ein Cappuccino.', 'Für mich ein Stück Kuchen, bitte.', 'Ich bin einen Tee.', 'Ich hätte gern ein Glas Wasser.'],
    answers: [0, 2, 4],
    explanation: l(
      'der Cappuccino → einen Cappuccino. „Ich bin einen Tee“ mixes up sein and nehmen.',
      'der Cappuccino → einen Cappuccino. „Ich bin einen Tee“ sein ile nehmen’i karıştırır.',
      'der Cappuccino → einen. „Ich bin einen Tee“ ist falsch.'
    ),
  },

  // --- Practice 2: the café simulation ------------------------------------
  {
    id: 'sim-1-platz',
    type: 'dialogue',
    topic: 'phrases',
    concept: 'cafe-phrases',
    skill: 'grammar',
    difficulty: 1,
    visual: ['🪑 🍽️ 🪑', '🙋 . 🤵'],
    lines: [{ speaker: 'Kellnerin', de: 'Guten Tag! Haben Sie reserviert?' }],
    options: ['Nein. Ist der Tisch hier frei?', 'Nein, ich bin frei.', 'Ja, die Rechnung, bitte.'],
    answer: 0,
    explanation: l(
      'Ask if a table is free: „Ist der Tisch hier frei?“ (frei = available).',
      'Masanın boş olup olmadığını sor: „Ist der Tisch hier frei?“ (frei = boş).',
      '„Ist der Tisch hier frei?“'
    ),
    examples: ['Ist der Tisch hier **frei**?'],
  },
  {
    id: 'sim-2-getraenk',
    type: 'dialogue',
    topic: 'ordering',
    concept: 'order-akk',
    skill: 'grammar',
    difficulty: 1,
    lines: [{ speaker: 'Kellnerin', de: 'Guten Tag. Was möchten Sie trinken?' }],
    options: ['Ich möchte einen Kaffee.', 'Ich bin einen Kaffee.', 'Ich habe ein Kaffee.'],
    answer: 0,
    explanation: l(
      '„Ich möchte“ is a polite way to order. Kaffee is masculine (der Kaffee) and is the object → Akkusativ: einen Kaffee.',
      '„Ich möchte“ kibar bir sipariş biçimidir. Kaffee eril (der Kaffee) ve nesnedir → Akkusativ: einen Kaffee.',
      '„Ich möchte“ = höflich bestellen. der Kaffee → einen Kaffee (Akkusativ).'
    ),
    examples: ['Ich möchte {m:einen Kaffee}.'],
  },
  {
    id: 'sim-3-essen',
    type: 'dialogue',
    topic: 'nehmen',
    concept: 'nehmen-forms',
    skill: 'grammar',
    difficulty: 2,
    lines: [
      { speaker: 'Kellnerin', de: 'Und möchten Sie auch etwas essen?' },
    ],
    options: ['Ja, ich nehme ein Stück Apfelkuchen.', 'Ja, ich nimmt ein Stück Apfelkuchen.', 'Ja, ich nehmen ein Stück Apfelkuchen.'],
    answer: 0,
    explanation: l('ich nehme (regular for ich).', 'ich nehme (ich için düzenli).', 'ich nehme.'),
    examples: ['Ich **nehme** {n:ein Stück} Apfelkuchen.'],
  },
  {
    id: 'sim-4-freund',
    type: 'dialogue',
    topic: 'nehmen',
    concept: 'nehmen-forms',
    skill: 'grammar',
    difficulty: 2,
    lines: [
      { speaker: 'Kellnerin', de: 'Und Ihr Freund?' },
    ],
    options: ['Er nimmt einen Tee.', 'Er nehmt einen Tee.', 'Er nimm einen Tee.'],
    answer: 0,
    explanation: l('er nimmt – e → i, double m, ending -t.', 'er nimmt – e → i, çift m, -t eki.', 'er nimmt.'),
    examples: ['Er **nimmt** {m:einen Tee}.'],
  },
  {
    id: 'sim-5-zahlen',
    type: 'dialogue',
    topic: 'paying',
    concept: 'paying',
    skill: 'grammar',
    difficulty: 1,
    lines: [{ speaker: 'Du', de: '(Ihr seid fertig und möchtet gehen.)' }],
    options: ['Entschuldigung, wir möchten bezahlen.', 'Entschuldigung, wir möchten bestellen.', 'Guten Appetit!'],
    answer: 0,
    explanation: l(
      'To pay: „Wir möchten bezahlen.“ or „Die Rechnung, bitte!“',
      'Ödemek için: „Wir möchten bezahlen.“ ya da „Die Rechnung, bitte!“',
      '„Wir möchten bezahlen.“ / „Die Rechnung, bitte!“'
    ),
    examples: ['Wir möchten **bezahlen**.'],
  },
  {
    id: 'sim-6-getrennt',
    type: 'dialogue',
    topic: 'paying',
    concept: 'paying',
    skill: 'grammar',
    difficulty: 2,
    lines: [{ speaker: 'Kellnerin', de: 'Zusammen oder getrennt?' }],
    options: ['Getrennt, bitte.', 'Zusammen, danke, ich bin satt.', 'Ja, bitte.'],
    answer: 0,
    explanation: l(
      'zusammen = one bill for everyone, getrennt = everyone pays separately. „Ja, bitte“ does not answer an „or“ question!',
      'zusammen = herkes için tek hesap, getrennt = herkes ayrı öder. „Ja, bitte“ bir „ya … ya …“ sorusunun cevabı olamaz!',
      'zusammen = eine Rechnung, getrennt = jeder einzeln.'
    ),
  },
  {
    id: 'sim-7-trinkgeld',
    type: 'dialogue',
    topic: 'paying',
    concept: 'paying',
    skill: 'grammar',
    difficulty: 2,
    lines: [{ speaker: 'Kellnerin', de: 'Das macht 7,60 Euro.' }],
    options: ['Acht Euro, bitte. Stimmt so!', 'Sieben Euro, bitte.', 'Das macht nichts.'],
    answer: 0,
    explanation: l(
      'You round up as a tip: 7,60 → 8 Euro. „Stimmt so!“ = keep the change.',
      'Bahşiş olarak yukarı yuvarlarsın: 7,60 → 8 avro. „Stimmt so!“ = üstü kalsın.',
      'Man rundet auf: 7,60 → 8 Euro. „Stimmt so!“'
    ),
  },

  // --- Practice 3: use ----------------------------------------------------
  {
    id: 'fill-nimmt',
    type: 'fill_blank',
    topic: 'nehmen',
    concept: 'nehmen-forms',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Anna ___ einen Salat.',
    accepted: ['nimmt'],
    base: 'nehmen',
    explanation: l('sie nimmt.', 'sie nimmt.', 'sie nimmt.'),
    examples: ['Anna **nimmt** {m:einen Salat}.'],
  },
  {
    id: 'fill-tasse',
    type: 'fill_blank',
    topic: 'ordering',
    concept: 'containers',
    skill: 'vocabulary',
    difficulty: 1,
    sentence: 'Ich möchte eine ___ Tee.',
    accepted: ['Tasse'],
    explanation: l('eine Tasse Tee = a cup of tea.', 'eine Tasse Tee = bir fincan çay.', 'eine Tasse Tee.'),
    examples: ['eine **Tasse** Tee'],
  },
  {
    id: 'build-rechnung',
    type: 'sentence_builder',
    topic: 'paying',
    concept: 'paying',
    skill: 'grammar',
    difficulty: 1,
    chips: ['bezahlen', 'Wir', 'möchten'],
    answers: [['Wir', 'möchten', 'bezahlen']],
    translation: l('We would like to pay.', 'Ödemek istiyoruz.', 'Wir möchten bezahlen.'),
    explanation: l('möchten (2) + infinitive at the end.', 'möchten (2) + sonda mastar.', 'möchten + Infinitiv am Ende.'),
    examples: ['Wir **möchten** bezahlen.'],
  },
  {
    id: 'build-nehme',
    type: 'sentence_builder',
    topic: 'nehmen',
    concept: 'nehmen-forms',
    skill: 'grammar',
    difficulty: 1,
    chips: ['ein Stück Kuchen', 'Ich', 'nehme'],
    answers: [['Ich', 'nehme', 'ein Stück Kuchen']],
    translation: l('I’ll have a piece of cake.', 'Bir dilim pasta alayım.', 'Ich nehme ein Stück Kuchen.'),
    explanation: l('Ich + nehme + what you order.', 'Ich + nehme + sipariş ettiğin şey.', 'Ich + nehme + Bestellung.'),
    examples: ['Ich **nehme** {n:ein Stück} Kuchen.'],
  },
  {
    id: 'fix-nehmt',
    type: 'error_correction',
    topic: 'nehmen',
    concept: 'nehmen-forms',
    skill: 'grammar',
    difficulty: 2,
    sentence: 'Er nehmt einen Kaffee.',
    accepted: ['Er nimmt einen Kaffee.'],
    explanation: l('er nimmt (not nehmt).', 'er nimmt (nehmt değil).', 'er nimmt.'),
    examples: ['Er **nimmt** {m:einen Kaffee}.'],
  },
  {
    id: 'tr-zahlen',
    type: 'translation',
    topic: 'paying',
    concept: 'paying',
    skill: 'writing',
    difficulty: 1,
    source: l('The bill, please!', 'Hesap, lütfen!', 'The bill, please!'),
    accepted: ['Die Rechnung, bitte!', 'Die Rechnung bitte!', 'Zahlen, bitte!'],
    explanation: l('Die Rechnung, bitte! (also: Zahlen, bitte!)', 'Die Rechnung, bitte! (ya da: Zahlen, bitte!)', 'Die Rechnung, bitte!'),
    examples: ['**Die Rechnung**, bitte!'],
  },
  {
    id: 'tr-glas',
    type: 'translation',
    topic: 'ordering',
    concept: 'containers',
    skill: 'writing',
    difficulty: 2,
    source: l('A glass of water, please.', 'Bir bardak su, lütfen.', 'A glass of water, please.'),
    accepted: ['Ein Glas Wasser, bitte.', 'Ein Glas Wasser bitte.'],
    explanation: l('ein Glas Wasser – no „of“ in German.', 'ein Glas Wasser – Almancada „of“ yok.', 'ein Glas Wasser.'),
    examples: ['{n:Ein Glas} Wasser, bitte.'],
  },

  // --- Reading -------------------------------------------------------
  {
    id: 'read-offen',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-bon',
    skill: 'reading',
    difficulty: 1,
    prompt: 'Wann ist das Café am Sonntag geöffnet?',
    options: ['von 10 bis 18 Uhr', 'von 8 bis 20 Uhr', 'gar nicht'],
    answer: 0,
    explanation: l('„So 10–18 Uhr“', '„So 10–18 Uhr“', '„So 10–18 Uhr“'),
  },
  {
    id: 'read-montag',
    type: 'true_false',
    topic: 'reading',
    concept: 'reading-bon',
    skill: 'reading',
    difficulty: 1,
    statement: 'Am Montag ist das Café geschlossen.',
    answer: true,
    explanation: l('„Montag Ruhetag“ = closed on Monday.', '„Montag Ruhetag“ = pazartesi kapalı.', '„Montag Ruhetag“.'),
  },
  {
    id: 'read-summe',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-bon',
    skill: 'reading',
    difficulty: 2,
    prompt: 'Wie viel kostet alles zusammen?',
    options: ['9,70 €', '7,90 €', '10,70 €'],
    answer: 0,
    explanation: l('3,20 + 2,50 + 4,00 = 9,70 €.', '3,20 + 2,50 + 4,00 = 9,70 €.', '3,20 + 2,50 + 4,00 = 9,70 €.'),
  },
  {
    id: 'read-karte',
    type: 'multiple_choice',
    topic: 'reading',
    concept: 'reading-bon',
    skill: 'reading',
    difficulty: 2,
    prompt: 'Kann man mit Karte bezahlen?',
    options: ['Ja, ab 10 Euro.', 'Nein, nur bar.', 'Ja, immer.'],
    answer: 0,
    explanation: l('„Kartenzahlung ab 10 €“', '„Kartenzahlung ab 10 €“ – 10 €’dan itibaren kart.', '„Kartenzahlung ab 10 €“'),
  },

  // --- Listening ----------------------------------------------------
  {
    id: 'listen-was-darf',
    type: 'listening_choice',
    topic: 'phrases',
    concept: 'cafe-phrases',
    skill: 'listening',
    difficulty: 1,
    audio: 'Guten Tag! Was darf es sein?',
    question: l('Who is speaking?', 'Kim konuşuyor?', 'Wer spricht?'),
    options: ['🤵 der Kellner', '🙋 der Gast'],
    answer: 0,
    explanation: l('„Was darf es sein?“ – typical waiter question.', '„Was darf es sein?“ – tipik garson sorusu.', 'Typische Kellnerfrage.'),
  },
  {
    id: 'listen-bestellung',
    type: 'listening_choice',
    topic: 'ordering',
    concept: 'order-akk',
    skill: 'listening',
    difficulty: 2,
    audio: 'Für mich einen Cappuccino und für meine Freundin ein Glas Orangensaft.',
    question: l('What does the friend get?', 'Kız arkadaşına ne geliyor?', 'Was bekommt die Freundin?'),
    options: ['☕ Cappuccino', '🍊 Orangensaft', '🍵 Tee'],
    answer: 1,
    explanation: l('„für meine Freundin ein Glas Orangensaft“', '„für meine Freundin ein Glas Orangensaft“', '„ein Glas Orangensaft“'),
  },
  {
    id: 'listen-betrag',
    type: 'listening_choice',
    topic: 'paying',
    concept: 'paying',
    skill: 'listening',
    difficulty: 2,
    audio: 'Zusammen macht das dreizehn Euro achtzig.',
    question: l('How much is it?', 'Ne kadar?', 'Wie viel?'),
    options: ['13,80 €', '30,80 €', '18,30 €'],
    answer: 0,
    explanation: l('dreizehn Euro achtzig = 13,80 €.', 'dreizehn Euro achtzig = 13,80 €.', '13,80 €.'),
  },
  {
    id: 'listen-bar',
    type: 'listening_choice',
    topic: 'paying',
    concept: 'paying',
    skill: 'listening',
    difficulty: 1,
    audio: 'Kann ich mit Karte zahlen? – Nein, leider nur bar.',
    question: l('How can you pay?', 'Nasıl ödeyebilirsin?', 'Wie kann man bezahlen?'),
    options: ['💶 bar', '💳 mit Karte'],
    answer: 0,
    explanation: l('„nur bar“ = cash only.', '„nur bar“ = yalnızca nakit.', '„nur bar“.'),
  },

  ...nehmenDrills(),
  ...situationDrills(),
]

export const UNIT13_IM_CAFE: CourseUnit = {
  level: 'A1',
  number: 13,
  slug: 'im-cafe',
  titleDe: 'Im Café',
  title: l('At the café', 'Kafede', 'Im Café'),
  goal: l(
    'By the end of this unit you can go through a whole café visit in German: find a table, order, ask for the bill, pay and tip.',
    'Bu ünitenin sonunda bir kafe ziyaretinin tamamını Almanca yapabilirsin: masa bulmak, sipariş vermek, hesabı istemek, ödemek ve bahşiş vermek.',
    'Am Ende dieser Einheit schaffst du einen ganzen Cafébesuch auf Deutsch: Platz finden, bestellen, Rechnung, bezahlen, Trinkgeld.'
  ),
  minutes: [15, 20],
  topics: [
    { key: 'ordering', label: l('Ordering', 'Sipariş', 'Bestellen') },
    { key: 'nehmen', label: l('nehmen: ich nehme, du nimmst', 'nehmen: ich nehme, du nimmst', 'nehmen') },
    { key: 'paying', label: l('Paying', 'Ödeme', 'Bezahlen') },
    { key: 'phrases', label: l('Café phrases', 'Kafe ifadeleri', 'Café-Wendungen') },
  ],
  vocabulary: [...VOCAB, ...MORE_VOCAB],
  exercises: EXERCISES,
  mastery: { minAnswered: 0.7, minAccuracy: 0.7 },
  sections: [
    {
      key: 'discover',
      kind: 'discover',
      title: l('Discover', 'Keşfet', 'Entdecken'),
      intro: l('Everything you need in a café.', 'Kafede ihtiyacın olan her şey.', 'Alles, was du im Café brauchst.'),
      cards: VOCAB,
    },
    {
      key: 'understand',
      kind: 'understand',
      title: l('Understand', 'Anla', 'Verstehen'),
      rules: [
        {
          title: l('The café visit in 5 steps', '5 adımda kafe ziyareti', 'Der Cafébesuch in 5 Schritten'),
          body: l(
            'Most café conversations follow the same steps. Learn the key phrase for each.',
            'Kafe konuşmalarının çoğu aynı adımları izler. Her adımın anahtar ifadesini öğren.',
            'Die meisten Gespräche im Café folgen denselben Schritten.'
          ),
          table: {
            head: [l('step', 'adım', 'Schritt'), l('guest', 'misafir', 'Gast'), l('waiter', 'garson', 'Kellner')],
            rows: [
              ['1 Platz', 'Ist hier noch frei?', 'Ja, bitte.'],
              ['2 Bestellen', 'Ich nehme / möchte …', 'Was darf es sein?'],
              ['3 Essen', 'Danke!', 'Guten Appetit!'],
              ['4 Rechnung', 'Die Rechnung, bitte!', 'Zusammen oder getrennt?'],
              ['5 Bezahlen', 'Neun Euro. Stimmt so!', 'Das macht 8,50 €.'],
            ],
          },
        },
        {
          title: l('nehmen – irregular', 'nehmen – düzensiz', 'nehmen – unregelmäßig'),
          body: l(
            'For du and er the vowel changes e → i and the h disappears: du nimmst, er nimmt. „Ich nehme …“ is the most common way to order.',
            'du ve er için sesli harf e → i olur ve h düşer: du nimmst, er nimmt. „Ich nehme …“ en yaygın sipariş biçimidir.',
            'du nimmst, er nimmt (e → i). „Ich nehme …“ = Bestellung.'
          ),
          table: {
            head: [l('Person', 'Kişi', 'Person'), l('nehmen', 'nehmen', 'nehmen')],
            rows: [
              ['ich', 'nehme'],
              ['du', 'nimmst'],
              ['er / sie', 'nimmt'],
              ['wir / sie / Sie', 'nehmen'],
              ['ihr', 'nehmt'],
            ],
          },
        },
        {
          title: l('A cup of …, a glass of …', 'Bir fincan …, bir bardak …', 'eine Tasse …, ein Glas …'),
          body: l(
            'German puts the drink directly after the container – no „of“: eine Tasse Kaffee, ein Glas Wasser, ein Stück Kuchen, eine Flasche Saft.',
            'Almanca içeceği doğrudan kabın arkasına koyar – „von“ yok: eine Tasse Kaffee, ein Glas Wasser, ein Stück Kuchen, eine Flasche Saft.',
            'Ohne „von“: eine Tasse Kaffee, ein Glas Wasser, ein Stück Kuchen.'
          ),
        },
        {
          title: l('Tipping in Germany', 'Almanya’da bahşiş', 'Trinkgeld in Deutschland'),
          body: l(
            'Tell the waiter the total you want to pay (incl. tip) – about 5–10 %: „Das macht 7,60.“ – „Acht Euro, bitte.“ / „Stimmt so!“',
            'Garsona bahşiş dahil ödemek istediğin toplamı söyle – yaklaşık %5–10: „Das macht 7,60.“ – „Acht Euro, bitte.“ / „Stimmt so!“',
            'Man nennt den Betrag mit Trinkgeld (5–10 %): „Acht Euro, bitte.“'
          ),
          tip: l(
            'Don’t leave money on the table – say the amount when you pay.',
            'Parayı masaya bırakma – öderken tutarı söyle.',
            'Geld nicht auf den Tisch legen – beim Bezahlen den Betrag sagen.'
          ),
        },
      ],
    },
    {
      key: 'context',
      kind: 'context',
      title: l('See it in context', 'Bağlamda gör', 'Im Kontext'),
      scene: l('Saturday afternoon in a café. Deniz and Jan sit down.', 'Cumartesi öğleden sonra bir kafede. Deniz ve Jan oturuyor.', 'Samstagnachmittag im Café. Deniz und Jan setzen sich.'),
      dialogue: [
        { speaker: 'Deniz', de: 'Entschuldigung, ist hier noch frei?', translation: l('Excuse me, is this seat free?', 'Affedersiniz, burası boş mu?', '') },
        { speaker: 'Kellnerin', de: 'Ja, bitte. Hier ist die Speisekarte. Was darf es sein?', translation: l('Yes, please. Here’s the menu. What would you like?', 'Evet, buyurun. İşte menü. Ne arzu edersiniz?', '') },
        { speaker: 'Deniz', de: 'Ich **nehme** {m:einen Cappuccino} und {n:ein Stück} Käsekuchen.', translation: l('I’ll have a cappuccino and a piece of cheesecake.', 'Bir kapuçino ve bir dilim cheesecake alayım.', '') },
        { speaker: 'Jan', de: 'Für mich {f:eine Tasse} Tee, bitte.', translation: l('A cup of tea for me, please.', 'Bana bir fincan çay, lütfen.', '') },
        { speaker: 'Kellnerin', de: 'Gern. … So, bitte schön. Guten Appetit!', translation: l('Sure. … Here you are. Enjoy!', 'Tabii. … Buyurun. Afiyet olsun!', '') },
        { speaker: 'Jan', de: 'Entschuldigung, wir möchten **bezahlen**.', translation: l('Excuse me, we’d like to pay.', 'Affedersiniz, ödemek istiyoruz.', '') },
        { speaker: 'Kellnerin', de: 'Zusammen oder getrennt?', translation: l('Together or separately?', 'Birlikte mi ayrı mı?', '') },
        { speaker: 'Jan', de: 'Zusammen. – Das macht 9,70 Euro. – Zehn Euro. **Stimmt so!**', translation: l('Together. – That’s €9.70. – Ten euros. Keep the change!', 'Birlikte. – 9,70 avro. – On avro. Üstü kalsın!', '') },
      ],
      examples: [
        { de: 'Ist der Tisch hier frei?', translation: l('Is this table free?', 'Bu masa boş mu?', '') },
        { de: 'Ich **nehme** {m:einen Tee}.', translation: l('I’ll have a tea.', 'Bir çay alayım.', '') },
        { de: 'Was **nimmst** du?', translation: l('What are you having?', 'Sen ne alıyorsun?', '') },
        { de: '{f:Eine Tasse} Kaffee, bitte.', translation: l('A cup of coffee, please.', 'Bir fincan kahve, lütfen.', '') },
        { de: '**Die Rechnung**, bitte!', translation: l('The bill, please!', 'Hesap, lütfen!', '') },
        { de: 'Getrennt, bitte.', translation: l('Separately, please.', 'Ayrı ayrı, lütfen.', '') },
        { de: 'Kann ich mit Karte bezahlen?', translation: l('Can I pay by card?', 'Kartla ödeyebilir miyim?', '') },
      ],
    },
    {
      key: 'practice-recognize',
      kind: 'practice',
      title: l('Practice 1 · Recognise', 'Pratik 1 · Tanı', 'Übung 1 · Erkennen'),
      intro: l('Café words and who says what.', 'Kafe kelimeleri ve kimin ne dediği.', 'Café-Wörter und wer was sagt.'),
      exercises: ['img-rechnung', 'match-containers', 'mc-nimmst', 'tf-trinkgeld', 'sort-guest-waiter', 'select-polite', 'phrase-1', 'phrase-3', 'phrase-5'],
    },
    {
      key: 'simulation',
      kind: 'practice',
      title: l('Simulation · In the café', 'Simülasyon · Kafede', 'Simulation · Im Café'),
      intro: l(
        'You are the guest. Answer the waitress – step by step through the whole visit. After every answer you get a short explanation.',
        'Misafir sensin. Garsona cevap ver – tüm ziyaret boyunca adım adım. Her cevaptan sonra kısa bir açıklama göreceksin.',
        'Du bist der Gast. Antworte der Kellnerin – Schritt für Schritt durch den ganzen Besuch.'
      ),
      exercises: ['sim-1-platz', 'sim-2-getraenk', 'sim-3-essen', 'sim-4-freund', 'sim-5-zahlen', 'sim-6-getrennt', 'sim-7-trinkgeld'],
    },
    {
      key: 'practice-use',
      kind: 'practice',
      title: l('Practice 2 · Use', 'Pratik 2 · Kullan', 'Übung 2 · Anwenden'),
      intro: l('Now write and build the café phrases yourself.', 'Şimdi kafe ifadelerini kendin yaz ve kur.', 'Jetzt schreibst und baust du die Café-Sätze selbst.'),
      exercises: ['fill-nimmt', 'fill-tasse', 'build-rechnung', 'build-nehme', 'fix-nehmt', 'tr-zahlen', 'tr-glas', 'phrase-2', 'phrase-4', 'phrase-6'],
    },
    {
      key: 'reading',
      kind: 'reading',
      title: l('Reading', 'Okuma', 'Lesen'),
      intro: l('The café door sign – and a receipt.', 'Kafenin kapı tabelası – ve bir fiş.', 'Das Schild an der Tür – und ein Kassenbon.'),
      passage: [
        '**Café Sonnenschein** – Öffnungszeiten: Di–Sa 8–20 Uhr, So 10–18 Uhr, **Montag Ruhetag**',
        'Kartenzahlung ab 10 €',
        '**Bon:** 1 Cappuccino 3,20 € · 1 Tee 2,50 € · 1 Käsekuchen 4,00 €',
      ],
      glossary: [
        { de: 'Öffnungszeiten', note: l('opening hours', 'açılış saatleri', 'wann offen') },
        { de: 'Ruhetag', note: l('closing day', 'kapalı gün', 'geschlossen') },
        { de: 'Kartenzahlung ab 10 €', note: l('card payment from €10', '10 €’dan itibaren kartla ödeme', 'mit Karte erst ab 10 €') },
        { de: 'der Bon', note: l('receipt', 'fiş', 'Kassenzettel') },
      ],
      exercises: ['read-offen', 'read-montag', 'read-summe', 'read-karte'],
    },
    {
      key: 'listening',
      kind: 'listening',
      title: l('Listening', 'Dinleme', 'Hören'),
      intro: l('Sounds of the café.', 'Kafeden sesler.', 'Geräusche im Café.'),
      exercises: ['listen-was-darf', 'listen-bestellung', 'listen-betrag', 'listen-bar'],
    },
    {
      key: 'speaking',
      kind: 'speaking',
      title: l('Speaking', 'Konuşma', 'Sprechen'),
      prompt: l('Role play: you are in a café. Say all your lines out loud.', 'Canlandırma: bir kafedesin. Tüm repliklerini sesli söyle.', 'Rollenspiel: Du bist im Café. Sprich deine Sätze laut.'),
      points: [
        l('Ask for a free table.', 'Boş masa sor.', 'Frag nach einem freien Platz.'),
        l('Order a drink and something to eat.', 'Bir içecek ve yiyecek bir şey sipariş et.', 'Bestelle ein Getränk und etwas zu essen.'),
        l('Ask for the bill.', 'Hesabı iste.', 'Verlange die Rechnung.'),
        l('Pay with a tip.', 'Bahşişle öde.', 'Bezahle mit Trinkgeld.'),
      ],
      model: ['Entschuldigung, ist hier noch frei?', 'Ich nehme einen Tee und ein Stück Apfelkuchen, bitte.', 'Die Rechnung, bitte!', 'Sieben Euro, bitte. Stimmt so!'],
    },
    {
      key: 'writing',
      kind: 'writing',
      title: l('Writing', 'Yazma', 'Schreiben'),
      prompt: l(
        'Write the guest’s lines for a café visit (at least 4 sentences).',
        'Bir kafe ziyareti için misafirin repliklerini yaz (en az 4 cümle).',
        'Schreib die Sätze des Gastes für einen Cafébesuch (mindestens 4 Sätze).'
      ),
      minSentences: 4,
      checks: [
        { label: l('Orders with nehme / möchte / hätte gern', 'nehme / möchte / hätte gern ile sipariş', 'Bestellung mit nehme / möchte / hätte gern'), pattern: '\\b(nehme|möchte|möchten)\\b|hätte gern' },
        { label: l('Asks for the bill', 'Hesabı istiyor', 'Verlangt die Rechnung'), pattern: '(Rechnung|bezahlen|[Zz]ahlen)' },
        { label: l('Uses Tasse / Glas / Stück …', 'Tasse / Glas / Stück … kullanılmış', 'Mit Tasse / Glas / Stück …'), pattern: '\\b(Tasse|Glas|Stück|Flasche|Portion)\\b' },
      ],
      model: ['Guten Tag! Ist hier noch frei?', 'Ich nehme eine Tasse Kaffee und ein Stück Kuchen.', 'Die Rechnung, bitte!', 'Acht Euro, bitte. Stimmt so!'],
    },
    {
      key: 'speed',
      kind: 'timed',
      title: l('Speed round', 'Hız turu', 'Schnellrunde'),
      intro: l('nehmen forms and café phrases – 60 seconds.', 'nehmen biçimleri ve kafe ifadeleri – 60 saniye.', 'nehmen und Café-Sätze – 60 Sekunden.'),
      seconds: 60,
      pool: [...(Object.keys(NEHMEN) as Person[]).map((p) => `nehmen-${p}`), ...SITUATIONS.map((_, i) => `phrase-${i + 1}`)],
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
      l('A whole café visit: Platz → bestellen → bezahlen', 'Bütün bir kafe ziyareti: Platz → bestellen → bezahlen', 'Cafébesuch: Platz → bestellen → bezahlen'),
      l('nehmen: ich nehme, du nimmst, er nimmt', 'nehmen: ich nehme, du nimmst, er nimmt', 'nehmen: ich nehme, du nimmst, er nimmt'),
      l('eine Tasse Kaffee, ein Glas Wasser, ein Stück Kuchen', 'eine Tasse Kaffee, ein Glas Wasser, ein Stück Kuchen', 'eine Tasse Kaffee, ein Glas Wasser'),
      l('Zusammen oder getrennt? Stimmt so!', 'Zusammen oder getrennt? Stimmt so!', 'Zusammen oder getrennt? Stimmt so!'),
    ],
    mistakes: [
      { wrong: 'Er nehmt einen Tee.', right: 'Er nimmt einen Tee.', note: l('er nimmt', 'er nimmt', 'er nimmt') },
      { wrong: 'Ich bin einen Kaffee.', right: 'Ich nehme einen Kaffee.', note: l('Order with nehmen/möchten.', 'nehmen/möchten ile sipariş.', 'Bestellen mit nehmen/möchten.') },
      { wrong: 'eine Tasse von Kaffee', right: 'eine Tasse Kaffee', note: l('No „von“.', '„von“ yok.', 'Ohne „von“.') },
      { wrong: 'Ich will die Rechnung!', right: 'Die Rechnung, bitte!', note: l('Polite with „bitte“.', '„bitte“ ile kibar.', 'Höflich mit „bitte“.') },
    ],
  },
}
