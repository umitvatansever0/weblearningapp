import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Delete in FK-safe order so this script is safely re-runnable, even after
  // a learner has generated UserProgress/UserVocabCard rows against the
  // seeded lessons/words.
  await prisma.userProgress.deleteMany({})
  await prisma.userVocabCard.deleteMany({})
  await prisma.vocabWord.deleteMany({})
  await prisma.exercise.deleteMany({})
  await prisma.lesson.deleteMany({})
  await prisma.unit.deleteMany({})

  const levelInputs = [
    { code: 'A1' as const, order: 1 },
    { code: 'A2' as const, order: 2 },
    { code: 'B1' as const, order: 3 },
    { code: 'B2' as const, order: 4 },
    { code: 'C1' as const, order: 5 },
    { code: 'C2' as const, order: 6 },
  ]

  for (const input of levelInputs) {
    await prisma.level.upsert({
      where: { code: input.code },
      update: { order: input.order },
      create: { code: input.code, order: input.order },
    })
  }

  const [a1, a2, b1, b2, c1, c2] = await Promise.all(
    levelInputs.map((input) => prisma.level.findUniqueOrThrow({ where: { code: input.code } }))
  )

  const badgeInputs = [
    { code: 'first_lesson', titleDe: 'Erste Lektion', titleEn: 'First Lesson', titleTr: 'İlk Ders' },
    { code: 'streak_3', titleDe: '3-Tage-Serie', titleEn: '3-Day Streak', titleTr: '3 Günlük Seri' },
    { code: 'streak_7', titleDe: '7-Tage-Serie', titleEn: '7-Day Streak', titleTr: '7 Günlük Seri' },
    {
      code: 'first_vocab_review',
      titleDe: 'Erste Wortkarte',
      titleEn: 'First Vocab Review',
      titleTr: 'İlk Kelime Tekrarı',
    },
    { code: 'a1_complete', titleDe: 'A1 abgeschlossen', titleEn: 'A1 Complete', titleTr: 'A1 Tamamlandı' },
    { code: 'xp_100', titleDe: '100 XP', titleEn: '100 XP', titleTr: '100 XP' },
  ]

  for (const input of badgeInputs) {
    await prisma.badge.upsert({
      where: { code: input.code },
      update: { titleDe: input.titleDe, titleEn: input.titleEn, titleTr: input.titleTr },
      create: input,
    })
  }

  // --- A1: Begrüßung (4 lessons) ---
  const a1Unit = await prisma.unit.create({
    data: { levelId: a1.id, order: 1, titleDe: 'Begrüßung', titleEn: 'Greetings', titleTr: 'Tanışma' },
  })

  const a1Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit.id,
      order: 1,
      grammarTopic: 'Begrüßungsformen',
      explanationDe: `## Begrüßungsformen

Im Deutschen begrüßt man sich je nach Tageszeit. Die höfliche Form beginnt mit „Guten …", informell sagt man einfach „Hallo".

| Tageszeit | Begrüßung |
| --------- | --------- |
| morgens | Guten Morgen |
| tagsüber | Guten Tag |
| abends | Guten Abend |
| jederzeit (informell) | Hallo |

**Beispiele:** **Guten Morgen**, Frau Meier! · **Hallo**, wie geht's?

Zum Abschied sagt man **Auf Wiedersehen** (formell) oder **Tschüss** (informell).`,
      explanationEn: `## Greetings

In German you greet people differently depending on the time of day. The polite form starts with "Guten …", while informally you just say "Hallo".

| Time of day | Greeting |
| ----------- | -------- |
| morning | Guten Morgen |
| daytime | Guten Tag |
| evening | Guten Abend |
| any time (informal) | Hallo |

**Examples:** **Guten Morgen**, Frau Meier! (Good morning, Mrs Meier!) · **Hallo**, wie geht's? (Hi, how are you?)

To say goodbye, use **Auf Wiedersehen** (formal) or **Tschüss** (informal).`,
      explanationTr: `## Selamlaşma biçimleri

Almancada günün saatine göre farklı selamlaşırsın. Kibar biçim „Guten …" ile başlar, samimi biçimde ise sadece „Hallo" dersin.

| Günün saati | Selamlaşma |
| ----------- | ---------- |
| sabah | Guten Morgen |
| gündüz | Guten Tag |
| akşam | Guten Abend |
| her zaman (samimi) | Hallo |

**Örnekler:** **Guten Morgen**, Frau Meier! (Günaydın, Meier Hanım!) · **Hallo**, wie geht's? (Selam, nasılsın?)

Vedalaşırken **Auf Wiedersehen** (resmi) ya da **Tschüss** (samimi) dersin.`,
    },
  })

  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was sagt man am Morgen?', options: ['Guten Abend', 'Guten Morgen', 'Gute Nacht', 'Tschüss'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Guten Morgen" wird morgens verwendet.',
      },
      {
        lessonId: a1Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ Tag! Wie geht es Ihnen?' },
        correctAnswer: { accepted: ['guten'] },
        explanation: '"Guten Tag" ist die formelle Begrüßung tagsüber.',
      },
    ],
  })

  const a1Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit.id,
      order: 2,
      grammarTopic: "Verb 'sein' im Präsens",
      explanationDe: `## Das Verb „sein"

„sein" ist unregelmäßig und eines der wichtigsten deutschen Verben. Hier sind die Präsensformen:

| Person | Form |
| --------- | ---- |
| ich | bin |
| du | bist |
| er/sie/es | ist |
| wir | sind |
| ihr | seid |
| sie/Sie | sind |

**Beispiele:** Ich **bin** Anna. · Wir **sind** müde.

Man benutzt „sein", um sich vorzustellen und Zustände zu beschreiben: Ich **bin** Lehrer.`,
      explanationEn: `## The verb "sein" (to be)

"sein" is irregular and one of the most important German verbs. Here are its present-tense forms:

| Pronoun | Form |
| --------- | ---- |
| ich | bin |
| du | bist |
| er/sie/es | ist |
| wir | sind |
| ihr | seid |
| sie/Sie | sind |

**Examples:** Ich **bin** Anna. (I am Anna.) · Wir **sind** müde. (We are tired.)

Use "sein" to introduce yourself and describe states: Ich **bin** Lehrer. (I am a teacher.)`,
      explanationTr: `## „sein" fiili (olmak)

„sein" düzensiz bir fiildir ve Almancanın en önemli fiillerinden biridir. Geniş zaman çekimi şöyledir:

| Kişi | Biçim |
| --------- | ----- |
| ich | bin |
| du | bist |
| er/sie/es | ist |
| wir | sind |
| ihr | seid |
| sie/Sie | sind |

**Örnekler:** Ich **bin** Anna. (Ben Anna'yım.) · Wir **sind** müde. (Biz yorgunuz.)

„sein" fiilini kendini tanıtmak ve durum belirtmek için kullanırsın: Ich **bin** Lehrer. (Ben öğretmenim.)`,
    },
  })

  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ Anna.', options: ['bin', 'bist', 'ist', 'sind'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" benutzt man "bin".',
      },
      {
        lessonId: a1Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'My name is Anna'?" },
        correctAnswer: { accepted: ['ich heiße anna', 'ich heisse anna'] },
        explanation: '"Ich heiße Anna" bedeutet "My name is Anna".',
      },
      {
        lessonId: a1Lesson2.id,
        order: 3,
        type: 'MATCHING',
        data: {
          lefts: ['ich', 'du', 'er/sie/es'],
          rights: ['ist', 'bin', 'bist'],
        },
        correctAnswer: {
          pairs: [
            { left: 'ich', right: 'bin' },
            { left: 'du', right: 'bist' },
            { left: 'er/sie/es', right: 'ist' },
          ],
        },
        explanation: 'Das sind die Präsensformen von "sein" für ich, du, er/sie/es.',
      },
    ],
  })

  const a1Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit.id,
      order: 3,
      grammarTopic: 'Zahlen 1-10',
      explanationDe: `## Die Zahlen 1–10

Das sind die Grundzahlen von 1 bis 10. Du brauchst sie zum Zählen, für Telefonnummern und Preise.

| Ziffer | Wort |
| ------ | ---- |
| 1 | eins |
| 2 | zwei |
| 3 | drei |
| 4 | vier |
| 5 | fünf |
| 6 | sechs |
| 7 | sieben |
| 8 | acht |
| 9 | neun |
| 10 | zehn |

**Beispiel:** Ich habe **zwei** Katzen und **drei** Hunde.`,
      explanationEn: `## Numbers 1–10

These are the cardinal numbers from 1 to 10. You need them for counting, phone numbers and prices.

| Digit | Word |
| ----- | ---- |
| 1 | eins |
| 2 | zwei |
| 3 | drei |
| 4 | vier |
| 5 | fünf |
| 6 | sechs |
| 7 | sieben |
| 8 | acht |
| 9 | neun |
| 10 | zehn |

**Example:** Ich habe **zwei** Katzen und **drei** Hunde. (I have two cats and three dogs.)`,
      explanationTr: `## Sayılar 1–10

Bunlar 1'den 10'a kadar olan sayı adlarıdır. Saymak, telefon numaraları ve fiyatlar için gereklidir.

| Rakam | Sözcük |
| ----- | ------ |
| 1 | eins |
| 2 | zwei |
| 3 | drei |
| 4 | vier |
| 5 | fünf |
| 6 | sechs |
| 7 | sieben |
| 8 | acht |
| 9 | neun |
| 10 | zehn |

**Örnek:** Ich habe **zwei** Katzen und **drei** Hunde. (İki kedim ve üç köpeğim var.)`,
    },
  })

  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Lesson3.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['zwei', 'eins', 'drei'] },
        correctAnswer: { order: ['eins', 'zwei', 'drei'] },
        explanation: 'Die richtige Reihenfolge ist eins, zwei, drei.',
      },
      {
        lessonId: a1Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: "Nach 'vier' kommt ___." },
        correctAnswer: { accepted: ['fünf'] },
        explanation: 'Nach vier kommt fünf.',
      },
    ],
  })

  const a1Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit.id,
      order: 4,
      grammarTopic: 'Sich vorstellen (Herkunft und Wohnort)',
      explanationDe: `## Sich vorstellen: Herkunft und Wohnort

Um zu sagen, woher du kommst, benutzt du **kommen aus** + Land. Um zu sagen, wo du wohnst, benutzt du **wohnen in** + Stadt.

| Frage | Antwort |
| ----- | ------- |
| Woher kommst du? | Ich komme **aus** Deutschland. |
| Wo wohnst du? | Ich wohne **in** Berlin. |

**Beispiel:** Ich **komme aus** der Türkei und **wohne in** München.`,
      explanationEn: `## Introducing yourself: origin and place of residence

To say where you come from, use **kommen aus** + country. To say where you live, use **wohnen in** + city.

| Question | Answer |
| -------- | ------ |
| Woher kommst du? (Where are you from?) | Ich komme **aus** Deutschland. |
| Wo wohnst du? (Where do you live?) | Ich wohne **in** Berlin. |

**Example:** Ich **komme aus** der Türkei und **wohne in** München. (I come from Turkey and live in Munich.)`,
      explanationTr: `## Kendini tanıtma: memleket ve yaşanılan yer

Nereden geldiğini söylemek için **kommen aus** + ülke kullanırsın. Nerede yaşadığını söylemek için **wohnen in** + şehir kullanırsın.

| Soru | Cevap |
| ---- | ----- |
| Woher kommst du? (Nerelisin?) | Ich komme **aus** Deutschland. |
| Wo wohnst du? (Nerede yaşıyorsun?) | Ich wohne **in** Berlin. |

**Örnek:** Ich **komme aus** der Türkei und **wohne in** München. (Türkiye'den geliyorum ve Münih'te yaşıyorum.)`,
    },
  })

  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ aus der Türkei.', options: ['komme', 'kommst', 'kommt', 'kommen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" benutzt man "komme".',
      },
      {
        lessonId: a1Lesson4.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich wohne ___ Berlin.' },
        correctAnswer: { accepted: ['in'] },
        explanation: '"Wohnen" + "in" + Stadt.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      {
        lessonId: a1Lesson4.id,
        word: 'kommen aus',
        translationEn: 'to come from',
        translationTr: '-den gelmek',
        exampleSentence: 'Ich komme aus Deutschland.',
      },
      {
        lessonId: a1Lesson4.id,
        word: 'wohnen',
        translationEn: 'to live',
        translationTr: 'oturmak',
        exampleSentence: 'Ich wohne in Berlin.',
      },
    ],
  })

  // --- A1 Unit 2: Artikel & Nomen (4 lessons) ---
  const a1Unit2 = await prisma.unit.create({
    data: { levelId: a1.id, order: 2, titleDe: 'Artikel & Nomen', titleEn: 'Articles & Nouns', titleTr: 'Tanımlıklar ve İsimler' },
  })

  const a1Unit2Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit2.id,
      order: 1,
      grammarTopic: 'Bestimmter Artikel (der/die/das)',
      explanationDe: `## Der bestimmte Artikel (der/die/das)

Jedes deutsche Nomen hat ein Genus. Der bestimmte Artikel („the") zeigt dieses Genus an:

| Genus | Artikel | Beispiel |
| -------- | ------- | -------- |
| maskulin | der | der Mann |
| feminin | die | die Frau |
| neutral | das | das Kind |

**Beispiel:** **Der** Mann ist groß. **Die** Frau liest. **Das** Kind spielt.

Lerne jedes neue Nomen immer zusammen mit seinem Artikel.`,
      explanationEn: `## The definite article (der/die/das)

Every German noun has a gender. The definite article ("the") shows this gender:

| Gender | Article | Example |
| --------- | ------- | ------- |
| masculine | der | der Mann |
| feminine | die | die Frau |
| neuter | das | das Kind |

**Example:** **Der** Mann ist groß. (The man is tall.) **Die** Frau liest. (The woman reads.) **Das** Kind spielt. (The child plays.)

Always learn every new noun together with its article.`,
      explanationTr: `## Belirli tanımlık (der/die/das)

Her Almanca ismin bir cinsiyeti vardır. Belirli tanımlık („the") bu cinsiyeti gösterir:

| Cinsiyet | Tanımlık | Örnek |
| -------- | -------- | ----- |
| eril | der | der Mann |
| dişil | die | die Frau |
| nötr | das | das Kind |

**Örnek:** **Der** Mann ist groß. (Adam uzun boylu.) **Die** Frau liest. (Kadın okuyor.) **Das** Kind spielt. (Çocuk oynuyor.)

Her yeni ismi mutlaka tanımlığıyla birlikte öğren.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit2Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ Mann ist groß.', options: ['Der', 'Die', 'Das', 'Den'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Mann" ist maskulin: der Mann.',
      },
      {
        lessonId: a1Unit2Lesson1.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['Mann', 'Frau', 'Kind'], rights: ['das', 'der', 'die'] },
        correctAnswer: {
          pairs: [
            { left: 'Mann', right: 'der' },
            { left: 'Frau', right: 'die' },
            { left: 'Kind', right: 'das' },
          ],
        },
        explanation: 'Mann = der, Frau = die, Kind = das.',
      },
    ],
  })

  const a1Unit2Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit2.id,
      order: 2,
      grammarTopic: 'Unbestimmter Artikel (ein/eine)',
      explanationDe: `## Der unbestimmte Artikel (ein/eine)

Der unbestimmte Artikel („a/an") heißt **ein** bei maskulinen und neutralen Nomen und **eine** bei femininen Nomen:

| Genus | Artikel | Beispiel |
| -------- | ------- | --------- |
| maskulin | ein | ein Mann |
| feminin | eine | eine Frau |
| neutral | ein | ein Kind |

**Beispiel:** Das ist **ein** Buch. Das ist **eine** Lampe.

Du benutzt den unbestimmten Artikel, wenn etwas neu oder unbekannt ist.`,
      explanationEn: `## The indefinite article (ein/eine)

The indefinite article ("a/an") is **ein** for masculine and neuter nouns and **eine** for feminine nouns:

| Gender | Article | Example |
| --------- | ------- | -------- |
| masculine | ein | ein Mann |
| feminine | eine | eine Frau |
| neuter | ein | ein Kind |

**Example:** Das ist **ein** Buch. (That is a book.) Das ist **eine** Lampe. (That is a lamp.)

Use the indefinite article when something is new or unknown.`,
      explanationTr: `## Belirsiz tanımlık (ein/eine)

Belirsiz tanımlık („bir") eril ve nötr isimlerde **ein**, dişil isimlerde **eine** olur:

| Cinsiyet | Tanımlık | Örnek |
| -------- | -------- | ------- |
| eril | ein | ein Mann |
| dişil | eine | eine Frau |
| nötr | ein | ein Kind |

**Örnek:** Das ist **ein** Buch. (Bu bir kitap.) Das ist **eine** Lampe. (Bu bir lamba.)

Bir şey yeni ya da bilinmiyorsa belirsiz tanımlık kullanırsın.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit2Lesson2.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das ist ___ Frau.' },
        correctAnswer: { accepted: ['eine'] },
        explanation: '"Frau" ist feminin: eine Frau.',
      },
      {
        lessonId: a1Unit2Lesson2.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das ist ___ Buch.', options: ['ein', 'eine', 'der', 'die'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Buch" ist neutral: ein Buch.',
      },
    ],
  })

  const a1Unit2Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit2.id,
      order: 3,
      grammarTopic: 'Plural',
      explanationDe: `## Der Plural

Deutsche Nomen bilden den Plural unterschiedlich. Im Plural ist der Artikel immer **die**.

| Endung | Singular | Plural |
| ------ | -------- | ------ |
| -e | der Tisch | die Tisch**e** |
| -er | das Kind | die Kind**er** |
| -(e)n | die Frau | die Frau**en** |
| -s | das Auto | die Auto**s** |

**Beispiel:** **Die** Kinder spielen. **Die** Tische sind neu.

Lerne den Plural am besten zusammen mit dem Nomen.`,
      explanationEn: `## The plural

German nouns form the plural in different ways. In the plural the article is always **die**.

| Ending | Singular | Plural |
| ------ | -------- | ------ |
| -e | der Tisch | die Tisch**e** |
| -er | das Kind | die Kind**er** |
| -(e)n | die Frau | die Frau**en** |
| -s | das Auto | die Auto**s** |

**Example:** **Die** Kinder spielen. (The children play.) **Die** Tische sind neu. (The tables are new.)

It is best to learn the plural together with the noun.`,
      explanationTr: `## Çoğul (Plural)

Almanca isimler çoğulu farklı şekillerde yapar. Çoğulda tanımlık her zaman **die** olur.

| Ek | Tekil | Çoğul |
| ---- | -------- | ------ |
| -e | der Tisch | die Tisch**e** |
| -er | das Kind | die Kind**er** |
| -(e)n | die Frau | die Frau**en** |
| -s | das Auto | die Auto**s** |

**Örnek:** **Die** Kinder spielen. (Çocuklar oynuyor.) **Die** Tische sind neu. (Masalar yeni.)

Çoğulu, ismin kendisiyle birlikte öğrenmen en iyisidir.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit2Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der Plural von "das Kind" ist ___.', options: ['die Kinder', 'die Kinds', 'der Kinder', 'das Kinder'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Kind" wird im Plural zu "Kinder".',
      },
      {
        lessonId: a1Unit2Lesson3.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['Frauen', 'die', 'sind', 'hier'] },
        correctAnswer: { order: ['die', 'Frauen', 'sind', 'hier'] },
        explanation: 'Reihenfolge: Artikel, Nomen, Verb, Ort.',
      },
    ],
  })

  const a1Unit2Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit2.id,
      order: 4,
      grammarTopic: 'Verneinung mit "kein"',
      explanationDe: `## Verneinung mit „kein"

Nomen mit unbestimmtem Artikel oder ohne Artikel verneinst du mit **kein**. Die Endung ist wie beim Artikel „ein":

| Genus/Zahl | Form | Beispiel |
| ---------- | ----- | -------- |
| maskulin | kein | Ich habe **kein** Auto. |
| feminin | keine | Ich habe **keine** Zeit. |
| neutral | kein | Ich habe **kein** Buch. |
| Plural | keine | Ich habe **keine** Kinder. |

**Beispiel:** Das ist **kein** Problem. Ich trinke **keinen** Kaffee.`,
      explanationEn: `## Negation with "kein"

Nouns with an indefinite article or no article are negated with **kein**. The ending works like the article "ein":

| Gender/Number | Form | Example |
| ------------- | ----- | -------- |
| masculine | kein | Ich habe **kein** Auto. (I have no car.) |
| feminine | keine | Ich habe **keine** Zeit. (I have no time.) |
| neuter | kein | Ich habe **kein** Buch. (I have no book.) |
| plural | keine | Ich habe **keine** Kinder. (I have no children.) |

**Example:** Das ist **kein** Problem. (That's no problem.) Ich trinke **keinen** Kaffee. (I don't drink coffee.)`,
      explanationTr: `## „kein" ile olumsuzlama

Belirsiz tanımlıklı ya da tanımlıksız isimleri **kein** ile olumsuz yaparsın. Eki „ein" tanımlığı gibi çekilir:

| Cinsiyet/Sayı | Biçim | Örnek |
| ------------- | ----- | ----- |
| eril | kein | Ich habe **kein** Auto. (Arabam yok.) |
| dişil | keine | Ich habe **keine** Zeit. (Vaktim yok.) |
| nötr | kein | Ich habe **kein** Buch. (Kitabım yok.) |
| çoğul | keine | Ich habe **keine** Kinder. (Çocuğum yok.) |

**Örnek:** Das ist **kein** Problem. (Sorun değil.) Ich trinke **keinen** Kaffee. (Kahve içmiyorum.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit2Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich habe ___ Zeit.' },
        correctAnswer: { accepted: ['keine'] },
        explanation: '"Zeit" ist feminin: keine Zeit.',
      },
      {
        lessonId: a1Unit2Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er hat ___ Buch.', options: ['kein', 'keine', 'nicht', 'keinen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Buch" ist neutral: kein Buch.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit2Lesson1.id, word: 'der Mann', translationEn: 'the man', translationTr: 'adam', exampleSentence: 'Der Mann ist groß.' },
      { lessonId: a1Unit2Lesson1.id, word: 'die Frau', translationEn: 'the woman', translationTr: 'kadın', exampleSentence: 'Die Frau ist nett.' },
      { lessonId: a1Unit2Lesson2.id, word: 'das Buch', translationEn: 'the book', translationTr: 'kitap', exampleSentence: 'Das ist ein Buch.' },
      { lessonId: a1Unit2Lesson2.id, word: 'das Kind', translationEn: 'the child', translationTr: 'çocuk', exampleSentence: 'Das Kind spielt.' },
      { lessonId: a1Unit2Lesson3.id, word: 'der Tisch', translationEn: 'the table', translationTr: 'masa', exampleSentence: 'Der Tisch ist groß.' },
      { lessonId: a1Unit2Lesson3.id, word: 'die Kinder', translationEn: 'the children', translationTr: 'çocuklar', exampleSentence: 'Die Kinder sind hier.' },
      { lessonId: a1Unit2Lesson4.id, word: 'die Zeit', translationEn: 'the time', translationTr: 'zaman', exampleSentence: 'Ich habe keine Zeit.' },
      { lessonId: a1Unit2Lesson4.id, word: 'haben', translationEn: 'to have', translationTr: 'sahip olmak', exampleSentence: 'Ich habe ein Buch.' },
    ],
  })

  // --- A1 Unit 3: Personalpronomen & Präsens (4 lessons) ---
  const a1Unit3 = await prisma.unit.create({
    data: { levelId: a1.id, order: 3, titleDe: 'Personalpronomen & Präsens', titleEn: 'Personal Pronouns & Present Tense', titleTr: 'Şahıs Zamirleri ve Şimdiki Zaman' },
  })

  const a1Unit3Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit3.id,
      order: 1,
      grammarTopic: 'Personalpronomen',
      explanationDe: `## Personalpronomen

Personalpronomen ersetzen eine Person oder eine Sache. Das sind die Subjektpronomen im Deutschen:

| Singular | Plural |
| -------- | ------ |
| ich | wir |
| du | ihr |
| er/sie/es | sie |

**„Sie"** (immer groß geschrieben) ist die höfliche Anrede für eine oder mehrere Personen.

**Beispiel:** **Ich** bin müde. **Wir** lernen Deutsch. **Sie** sind Herr Müller, oder?`,
      explanationEn: `## Personal pronouns

Personal pronouns replace a person or a thing. These are the subject pronouns in German:

| Singular | Plural |
| --------- | ------ |
| ich (I) | wir (we) |
| du (you) | ihr (you all) |
| er/sie/es (he/she/it) | sie (they) |

**"Sie"** (always capitalized) is the polite form of address for one or more people.

**Example:** **Ich** bin müde. (I am tired.) **Wir** lernen Deutsch. (We learn German.) **Sie** sind Herr Müller, oder? (You are Mr Müller, right?)`,
      explanationTr: `## Şahıs zamirleri

Şahıs zamirleri bir kişinin ya da nesnenin yerini tutar. Almancadaki özne zamirleri şunlardır:

| Tekil | Çoğul |
| --------- | ----- |
| ich (ben) | wir (biz) |
| du (sen) | ihr (siz) |
| er/sie/es (o) | sie (onlar) |

**„Sie"** (her zaman büyük harfle) bir ya da birden fazla kişiye karşı kullanılan saygı biçimidir.

**Örnek:** **Ich** bin müde. (Yorgunum.) **Wir** lernen Deutsch. (Almanca öğreniyoruz.) **Sie** sind Herr Müller, oder? (Siz Müller Bey'siniz, değil mi?)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit3Lesson1.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['ich', 'du', 'wir'], rights: ['we', 'I', 'you'] },
        correctAnswer: {
          pairs: [
            { left: 'ich', right: 'I' },
            { left: 'du', right: 'you' },
            { left: 'wir', right: 'we' },
          ],
        },
        explanation: 'Personalpronomen und ihre Bedeutung.',
      },
      {
        lessonId: a1Unit3Lesson1.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wie sagt man höflich "you" auf Deutsch?', options: ['du', 'Sie', 'er', 'ihr'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Sie" ist die höfliche Form.',
      },
    ],
  })

  const a1Unit3Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit3.id,
      order: 2,
      grammarTopic: 'Regelmäßige Verben im Präsens',
      explanationDe: `## Regelmäßige Verben im Präsens

Regelmäßige Verben bildest du aus **Stamm + Endung**. Der Stamm von „spielen" ist *spiel-*.

| Person | Endung | Form |
| --------- | ------ | -------- |
| ich | -e | spiel**e** |
| du | -st | spiel**st** |
| er/sie/es | -t | spiel**t** |
| wir | -en | spiel**en** |
| ihr | -t | spiel**t** |
| sie/Sie | -en | spiel**en** |

**Beispiel:** Ich **spiele** Fußball. Wir **lernen** Deutsch.`,
      explanationEn: `## Regular verbs in the present tense

You form regular verbs from **stem + ending**. The stem of "spielen" (to play) is *spiel-*.

| Person | Ending | Form |
| --------- | ------ | -------- |
| ich | -e | spiel**e** |
| du | -st | spiel**st** |
| er/sie/es | -t | spiel**t** |
| wir | -en | spiel**en** |
| ihr | -t | spiel**t** |
| sie/Sie | -en | spiel**en** |

**Example:** Ich **spiele** Fußball. (I play football.) Wir **lernen** Deutsch. (We learn German.)`,
      explanationTr: `## Düzenli fiillerde geniş/şimdiki zaman

Düzenli fiilleri **gövde + ek** ile yaparsın. „spielen" (oynamak) fiilinin gövdesi *spiel-*'dir.

| Kişi | Ek | Biçim |
| --------- | ---- | -------- |
| ich | -e | spiel**e** |
| du | -st | spiel**st** |
| er/sie/es | -t | spiel**t** |
| wir | -en | spiel**en** |
| ihr | -t | spiel**t** |
| sie/Sie | -en | spiel**en** |

**Örnek:** Ich **spiele** Fußball. (Futbol oynuyorum.) Wir **lernen** Deutsch. (Almanca öğreniyoruz.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit3Lesson2.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Du ___ (spielen) Fußball.' },
        correctAnswer: { accepted: ['spielst'] },
        explanation: 'Mit "du" benutzt man die Endung -st: spielst.',
      },
      {
        lessonId: a1Unit3Lesson2.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wir ___ Deutsch.', options: ['lerne', 'lernst', 'lernen', 'lernt'] },
        correctAnswer: { correctIndex: 2 },
        explanation: 'Mit "wir" benutzt man die Endung -en: lernen.',
      },
    ],
  })

  const a1Unit3Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit3.id,
      order: 3,
      grammarTopic: 'Verb "haben"',
      explanationDe: `## Das Verb „haben"

„haben" ist unregelmäßig – besonders „du hast" und „er hat" verlieren das *b*. Präsensformen:

| Person | Form |
| --------- | ---- |
| ich | habe |
| du | hast |
| er/sie/es | hat |
| wir | haben |
| ihr | habt |
| sie/Sie | haben |

**Beispiel:** Ich **habe** ein Buch. Du **hast** Zeit. Man benutzt „haben" auch in festen Wendungen: Ich **habe** Hunger.`,
      explanationEn: `## The verb "haben" (to have)

"haben" is irregular – notably "du hast" and "er hat" drop the *b*. Present-tense forms:

| Person | Form |
| --------- | ---- |
| ich | habe |
| du | hast |
| er/sie/es | hat |
| wir | haben |
| ihr | habt |
| sie/Sie | haben |

**Example:** Ich **habe** ein Buch. (I have a book.) Du **hast** Zeit. (You have time.) "haben" is also used in fixed phrases: Ich **habe** Hunger. (I am hungry.)`,
      explanationTr: `## „haben" fiili (sahip olmak)

„haben" düzensizdir – özellikle „du hast" ve „er hat" biçimlerinde *b* düşer. Geniş zaman çekimi:

| Kişi | Biçim |
| --------- | ----- |
| ich | habe |
| du | hast |
| er/sie/es | hat |
| wir | haben |
| ihr | habt |
| sie/Sie | haben |

**Örnek:** Ich **habe** ein Buch. (Bir kitabım var.) Du **hast** Zeit. (Vaktin var.) „haben" kalıplaşmış ifadelerde de kullanılır: Ich **habe** Hunger. (Karnım aç / Açım.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit3Lesson3.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['ich', 'du', 'er'], rights: ['hat', 'habe', 'hast'] },
        correctAnswer: {
          pairs: [
            { left: 'ich', right: 'habe' },
            { left: 'du', right: 'hast' },
            { left: 'er', right: 'hat' },
          ],
        },
        explanation: 'Das sind die Präsensformen von "haben".',
      },
      {
        lessonId: a1Unit3Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: 'Wie sagt man auf Deutsch: \'I am hungry\' (wörtlich: \'ich habe...\')?' },
        correctAnswer: { accepted: ['ich habe hunger'] },
        explanation: '"Ich habe Hunger" bedeutet "I am hungry".',
      },
    ],
  })

  const a1Unit3Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit3.id,
      order: 4,
      grammarTopic: 'W-Fragen',
      explanationDe: `## W-Fragen

W-Fragen beginnen mit einem Fragewort. Das Verb steht immer an **zweiter Stelle**.

| Fragewort | Bedeutung | Beispiel |
| --------- | --------- | -------- |
| wer | who | **Wer** ist das? |
| was | what | **Was** machst du? |
| wo | where | **Wo** wohnst du? |
| wann | when | **Wann** kommst du? |
| wie | how | **Wie** heißt du? |

**Beispiel:** **Wo** wohnst du? – Ich wohne in Berlin.`,
      explanationEn: `## W-questions (open questions)

W-questions start with a question word. The verb always comes **second**.

| Question word | Meaning | Example |
| ------------- | ------- | -------- |
| wer | who | **Wer** ist das? |
| was | what | **Was** machst du? |
| wo | where | **Wo** wohnst du? |
| wann | when | **Wann** kommst du? |
| wie | how | **Wie** heißt du? |

**Example:** **Wo** wohnst du? – Ich wohne in Berlin. (Where do you live? – I live in Berlin.)`,
      explanationTr: `## W-soruları (açık uçlu sorular)

W-soruları bir soru kelimesiyle başlar. Fiil her zaman **ikinci sırada** gelir.

| Soru kelimesi | Anlamı | Örnek |
| ------------- | ------ | ----- |
| wer | kim | **Wer** ist das? |
| was | ne | **Was** machst du? |
| wo | nerede | **Wo** wohnst du? |
| wann | ne zaman | **Wann** kommst du? |
| wie | nasıl | **Wie** heißt du? |

**Örnek:** **Wo** wohnst du? – Ich wohne in Berlin. (Nerede yaşıyorsun? – Berlin'de yaşıyorum.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit3Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ wohnst du?', options: ['Wo', 'Wer', 'Was', 'Wann'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Wo" fragt nach dem Ort.',
      },
      {
        lessonId: a1Unit3Lesson4.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['du', 'heißt', 'wie'] },
        correctAnswer: { order: ['wie', 'heißt', 'du'] },
        explanation: 'W-Wort zuerst, dann Verb, dann Subjekt.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit3Lesson1.id, word: 'Sie', translationEn: 'formal you', translationTr: 'siz', exampleSentence: 'Wie heißen Sie?' },
      { lessonId: a1Unit3Lesson1.id, word: 'wir', translationEn: 'we', translationTr: 'biz', exampleSentence: 'Wir lernen Deutsch.' },
      { lessonId: a1Unit3Lesson2.id, word: 'spielen', translationEn: 'to play', translationTr: 'oynamak', exampleSentence: 'Ich spiele Fußball.' },
      { lessonId: a1Unit3Lesson2.id, word: 'lernen', translationEn: 'to learn', translationTr: 'öğrenmek', exampleSentence: 'Wir lernen Deutsch.' },
      { lessonId: a1Unit3Lesson3.id, word: 'der Hunger', translationEn: 'hunger', translationTr: 'açlık', exampleSentence: 'Ich habe Hunger.' },
      { lessonId: a1Unit3Lesson3.id, word: 'der Durst', translationEn: 'thirst', translationTr: 'susuzluk', exampleSentence: 'Er hat Durst.' },
      { lessonId: a1Unit3Lesson4.id, word: 'wo', translationEn: 'where', translationTr: 'nerede', exampleSentence: 'Wo wohnst du?' },
      { lessonId: a1Unit3Lesson4.id, word: 'wie', translationEn: 'how', translationTr: 'nasıl', exampleSentence: 'Wie heißt du?' },
    ],
  })

  // --- A1 Unit 4: Familie & Possessivpronomen (4 lessons) ---
  const a1Unit4 = await prisma.unit.create({
    data: { levelId: a1.id, order: 4, titleDe: 'Familie & Possessivpronomen', titleEn: 'Family & Possessives', titleTr: 'Aile ve İyelik Sıfatları' },
  })

  const a1Unit4Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit4.id,
      order: 1,
      grammarTopic: 'Familienmitglieder',
      explanationDe: `## Familienmitglieder

Das sind die wichtigsten Wörter für die Familie. Achte auf den Artikel:

| Deutsch | Englisch |
| ------------- | -------- |
| der Vater | father |
| die Mutter | mother |
| der Bruder | brother |
| die Schwester | sister |
| die Eltern | parents |
| die Geschwister | siblings |

**Beispiel:** Mein **Vater** heißt Peter und meine **Mutter** heißt Anna.`,
      explanationEn: `## Family members

These are the most important words for the family. Pay attention to the article:

| German | English |
| ------------- | -------- |
| der Vater | father |
| die Mutter | mother |
| der Bruder | brother |
| die Schwester | sister |
| die Eltern | parents |
| die Geschwister | siblings |

**Example:** Mein **Vater** heißt Peter und meine **Mutter** heißt Anna. (My father is called Peter and my mother is called Anna.)`,
      explanationTr: `## Aile bireyleri

Bunlar aileyle ilgili en önemli kelimelerdir. Tanımlığa dikkat et:

| Almanca | Türkçe |
| ------------- | ------ |
| der Vater | baba |
| die Mutter | anne |
| der Bruder | erkek kardeş |
| die Schwester | kız kardeş |
| die Eltern | ebeveynler |
| die Geschwister | kardeşler |

**Örnek:** Mein **Vater** heißt Peter und meine **Mutter** heißt Anna. (Babamın adı Peter, annemin adı Anna.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit4Lesson1.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['der Vater', 'die Mutter', 'die Schwester'], rights: ['sister', 'father', 'mother'] },
        correctAnswer: {
          pairs: [
            { left: 'der Vater', right: 'father' },
            { left: 'die Mutter', right: 'mother' },
            { left: 'die Schwester', right: 'sister' },
          ],
        },
        explanation: 'Familienwörter und ihre Bedeutung.',
      },
      {
        lessonId: a1Unit4Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Mein ___ heißt Peter. (father)' },
        correctAnswer: { accepted: ['vater'] },
        explanation: '"Vater" bedeutet "father".',
      },
    ],
  })

  const a1Unit4Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit4.id,
      order: 2,
      grammarTopic: 'Possessivartikel (mein/dein)',
      explanationDe: `## Possessivartikel (mein/dein)

Possessivartikel zeigen, wem etwas gehört. Die Endung richtet sich nach dem Nomen – wie bei „ein/kein".

| Genus/Zahl | mein | dein |
| ---------- | ------ | ------ |
| maskulin | mein Vater | dein Vater |
| feminin | meine Mutter | deine Mutter |
| neutral | mein Kind | dein Kind |
| Plural | meine Eltern | deine Eltern |

**Beispiel:** **Mein** Bruder ist groß. **Deine** Schwester ist nett.`,
      explanationEn: `## Possessive articles (mein/dein)

Possessive articles show who something belongs to. The ending follows the noun – just like "ein/kein".

| Gender/Number | mein (my) | dein (your) |
| ------------- | ---------- | ----------- |
| masculine | mein Vater | dein Vater |
| feminine | meine Mutter | deine Mutter |
| neuter | mein Kind | dein Kind |
| plural | meine Eltern | deine Eltern |

**Example:** **Mein** Bruder ist groß. (My brother is tall.) **Deine** Schwester ist nett. (Your sister is nice.)`,
      explanationTr: `## İyelik tanımlıkları (mein/dein)

İyelik tanımlıkları bir şeyin kime ait olduğunu gösterir. Ek, isme göre değişir – tıpkı „ein/kein" gibi.

| Cinsiyet/Sayı | mein (benim) | dein (senin) |
| ------------- | ------------ | ------------ |
| eril | mein Vater | dein Vater |
| dişil | meine Mutter | deine Mutter |
| nötr | mein Kind | dein Kind |
| çoğul | meine Eltern | deine Eltern |

**Örnek:** **Mein** Bruder ist groß. (Erkek kardeşim uzun boylu.) **Deine** Schwester ist nett. (Senin kız kardeşin hoş biri.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit4Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ Mutter ist nett. (my)', options: ['Mein', 'Meine', 'Dein', 'Deine'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Mutter" ist feminin: meine Mutter.',
      },
      {
        lessonId: a1Unit4Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ist das ___ Bruder? (your)' },
        correctAnswer: { accepted: ['dein'] },
        explanation: '"Bruder" ist maskulin: dein Bruder.',
      },
    ],
  })

  const a1Unit4Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit4.id,
      order: 3,
      grammarTopic: 'Ja/Nein-Fragen',
      explanationDe: `## Ja/Nein-Fragen

Bei Ja/Nein-Fragen steht das **Verb an erster Stelle**. Man antwortet mit „Ja" oder „Nein".

| Aussage | Frage |
| ------------------- | ------------------- |
| Du **hast** Geschwister. | **Hast** du Geschwister? |
| Er **wohnt** hier. | **Wohnt** er hier? |

**Beispiel:** **Hast** du Geschwister? – **Ja**, ich habe eine Schwester. / **Nein**, ich habe keine Geschwister.`,
      explanationEn: `## Yes/no questions

In yes/no questions the **verb comes first**. You answer with "Ja" (yes) or "Nein" (no).

| Statement | Question |
| ------------------- | ------------------- |
| Du **hast** Geschwister. | **Hast** du Geschwister? |
| Er **wohnt** hier. | **Wohnt** er hier? |

**Example:** **Hast** du Geschwister? – **Ja**, ich habe eine Schwester. / **Nein**, ich habe keine Geschwister. (Do you have siblings? – Yes, I have a sister. / No, I don't have siblings.)`,
      explanationTr: `## Evet/hayır soruları

Evet/hayır sorularında **fiil başta** gelir. „Ja" (evet) ya da „Nein" (hayır) ile cevap verirsin.

| Cümle | Soru |
| ------------------- | ------------------- |
| Du **hast** Geschwister. | **Hast** du Geschwister? |
| Er **wohnt** hier. | **Wohnt** er hier? |

**Örnek:** **Hast** du Geschwister? – **Ja**, ich habe eine Schwester. / **Nein**, ich habe keine Geschwister. (Kardeşin var mı? – Evet, bir kız kardeşim var. / Hayır, kardeşim yok.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit4Lesson3.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['Geschwister', 'du', 'hast'] },
        correctAnswer: { order: ['hast', 'du', 'Geschwister'] },
        explanation: 'Bei Ja/Nein-Fragen steht das Verb zuerst.',
      },
      {
        lessonId: a1Unit4Lesson3.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ du eine Schwester?', options: ['Hast', 'Hat', 'Habe', 'Haben'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "du" benutzt man "hast".',
      },
    ],
  })

  const a1Unit4Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit4.id,
      order: 4,
      grammarTopic: 'Wiederholung (Familie + Artikel + Präsens)',
      explanationDe: `## Wiederholung: Familie, Artikel und Präsens

In dieser Lektion kombinierst du alles aus Unit 4: **Possessivartikel** (mein/dein), **Familienwörter** und das **Präsens** der Verben.

So sprichst du über deine Familie:

- **Meine** Schwester **wohnt** in München.
- **Mein** Bruder **spielt** gern Fußball.
- **Hast** du Geschwister? – Ja, ich **habe** eine Schwester.

**Beispiel:** **Meine** Mutter **kommt** aus der Türkei und **spricht** Türkisch.`,
      explanationEn: `## Review: family, articles and present tense

In this lesson you combine everything from Unit 4: **possessive articles** (mein/dein), **family words** and the **present tense** of verbs.

This is how you talk about your family:

- **Meine** Schwester **wohnt** in München. (My sister lives in Munich.)
- **Mein** Bruder **spielt** gern Fußball. (My brother likes playing football.)
- **Hast** du Geschwister? – Ja, ich **habe** eine Schwester. (Do you have siblings? – Yes, I have a sister.)

**Example:** **Meine** Mutter **kommt** aus der Türkei und **spricht** Türkisch. (My mother comes from Turkey and speaks Turkish.)`,
      explanationTr: `## Tekrar: aile, tanımlıklar ve geniş zaman

Bu derste Unit 4'teki her şeyi birleştirirsin: **iyelik tanımlıkları** (mein/dein), **aile kelimeleri** ve fiillerin **geniş zamanı**.

Ailen hakkında şöyle konuşursun:

- **Meine** Schwester **wohnt** in München. (Kız kardeşim Münih'te yaşıyor.)
- **Mein** Bruder **spielt** gern Fußball. (Erkek kardeşim futbol oynamayı seviyor.)
- **Hast** du Geschwister? – Ja, ich **habe** eine Schwester. (Kardeşin var mı? – Evet, bir kız kardeşim var.)

**Örnek:** **Meine** Mutter **kommt** aus der Türkei und **spricht** Türkisch. (Annem Türkiye'den geliyor ve Türkçe konuşuyor.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit4Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Meine Schwester ___ (wohnen) in München.' },
        correctAnswer: { accepted: ['wohnt'] },
        explanation: 'Mit "sie" (3. Person) benutzt man die Endung -t: wohnt.',
      },
      {
        lessonId: a1Unit4Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'My brother plays football'?" },
        correctAnswer: { accepted: ['mein bruder spielt fußball'] },
        explanation: '"Mein Bruder spielt Fußball" bedeutet "My brother plays football".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit4Lesson1.id, word: 'der Vater', translationEn: 'father', translationTr: 'baba', exampleSentence: 'Mein Vater heißt Peter.' },
      { lessonId: a1Unit4Lesson1.id, word: 'die Mutter', translationEn: 'mother', translationTr: 'anne', exampleSentence: 'Meine Mutter ist nett.' },
      { lessonId: a1Unit4Lesson2.id, word: 'der Bruder', translationEn: 'brother', translationTr: 'erkek kardeş', exampleSentence: 'Mein Bruder spielt Fußball.' },
      { lessonId: a1Unit4Lesson2.id, word: 'die Schwester', translationEn: 'sister', translationTr: 'kız kardeş', exampleSentence: 'Meine Schwester wohnt in München.' },
      { lessonId: a1Unit4Lesson3.id, word: 'die Geschwister', translationEn: 'siblings', translationTr: 'kardeşler', exampleSentence: 'Hast du Geschwister?' },
      { lessonId: a1Unit4Lesson3.id, word: 'die Eltern', translationEn: 'parents', translationTr: 'ebeveynler', exampleSentence: 'Meine Eltern wohnen in Berlin.' },
      { lessonId: a1Unit4Lesson4.id, word: 'gern', translationEn: 'gladly / like to', translationTr: 'severek', exampleSentence: 'Sie spielt gern Fußball.' },
      { lessonId: a1Unit4Lesson4.id, word: 'die Stadt', translationEn: 'the city', translationTr: 'şehir', exampleSentence: 'München ist eine Stadt.' },
    ],
  })

  // --- A1 Unit 5: Zahlen, Uhrzeit & Alltag (4 lessons) ---
  const a1Unit5 = await prisma.unit.create({
    data: { levelId: a1.id, order: 5, titleDe: 'Zahlen, Uhrzeit & Alltag', titleEn: 'Numbers, Time & Daily Life', titleTr: 'Sayılar, Saat ve Günlük Hayat' },
  })

  const a1Unit5Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit5.id,
      order: 1,
      grammarTopic: 'Zahlen 11-100',
      explanationDe: `## Die Zahlen 11–100

Die Zehner enden auf **-zig** (Ausnahme: dreißig). Ab 21 nennst du zuerst den Einer, dann „und", dann den Zehner.

| Zahl | Wort |
| ---- | ---- |
| 11 | elf |
| 12 | zwölf |
| 20 | zwanzig |
| 21 | einundzwanzig |
| 30 | dreißig |
| 100 | hundert |

**Beispiel:** Ich bin **einundzwanzig** Jahre alt. Das kostet **dreißig** Euro.`,
      explanationEn: `## Numbers 11–100

The tens end in **-zig** (exception: dreißig). From 21 on, you say the unit first, then "und", then the ten.

| Number | Word |
| ------ | ---- |
| 11 | elf |
| 12 | zwölf |
| 20 | zwanzig |
| 21 | einundzwanzig |
| 30 | dreißig |
| 100 | hundert |

**Example:** Ich bin **einundzwanzig** Jahre alt. (I am twenty-one years old.) Das kostet **dreißig** Euro. (That costs thirty euros.) Note: 21 is literally "one-and-twenty".`,
      explanationTr: `## Sayılar 11–100

Onlar **-zig** ile biter (istisna: dreißig). 21'den itibaren önce biri, sonra „und", sonra onu söylersin.

| Sayı | Sözcük |
| ---- | ------ |
| 11 | elf |
| 12 | zwölf |
| 20 | zwanzig |
| 21 | einundzwanzig |
| 30 | dreißig |
| 100 | hundert |

**Örnek:** Ich bin **einundzwanzig** Jahre alt. (Yirmi bir yaşındayım.) Das kostet **dreißig** Euro. (Bu otuz euro.) Not: 21, kelime kelime „bir-ve-yirmi" demektir.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit5Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wie sagt man "21" auf Deutsch?', options: ['zwanzigeins', 'einundzwanzig', 'zwanzig-eins', 'eins-zwanzig'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '21 = einundzwanzig.',
      },
      {
        lessonId: a1Unit5Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: "Nach 'neunzehn' kommt ___." },
        correctAnswer: { accepted: ['zwanzig'] },
        explanation: 'Nach 19 kommt 20 (zwanzig).',
      },
    ],
  })

  const a1Unit5Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit5.id,
      order: 2,
      grammarTopic: 'Uhrzeit',
      explanationDe: `## Die Uhrzeit

Du fragst nach der Zeit mit **„Wie spät ist es?"** oder **„Wie viel Uhr ist es?"**. Die Antwort beginnt mit „Es ist …".

| Uhrzeit | Deutsch |
| ------- | ------- |
| 3:00 | Es ist drei Uhr. |
| 3:15 | Es ist Viertel nach drei. |
| 3:30 | Es ist halb vier. |
| 3:45 | Es ist Viertel vor vier. |

**Achtung:** „halb vier" bedeutet 3:30 – also *eine halbe Stunde vor vier*.`,
      explanationEn: `## Telling the time

You ask the time with **"Wie spät ist es?"** or **"Wie viel Uhr ist es?"** (What time is it?). The answer starts with "Es ist …".

| Time | German |
| ---- | ------ |
| 3:00 | Es ist drei Uhr. |
| 3:15 | Es ist Viertel nach drei. |
| 3:30 | Es ist halb vier. |
| 3:45 | Es ist Viertel vor vier. |

**Watch out:** "halb vier" means 3:30 – i.e. *half an hour before four*, not after three.`,
      explanationTr: `## Saati söyleme

Saati **„Wie spät ist es?"** ya da **„Wie viel Uhr ist es?"** (Saat kaç?) diye sorarsın. Cevap „Es ist …" ile başlar.

| Saat | Almanca |
| ---- | ------- |
| 3:00 | Es ist drei Uhr. |
| 3:15 | Es ist Viertel nach drei. |
| 3:30 | Es ist halb vier. |
| 3:45 | Es ist Viertel vor vier. |

**Dikkat:** „halb vier" 3:30 demektir – yani *dörde yarım saat kala*, üç buçuk. Almanca bir sonraki saati sayar.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit5Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wie fragt man nach der Uhrzeit?', options: ['Wie spät ist es?', 'Wie alt bist du?', 'Wo bist du?', 'Was machst du?'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Wie spät ist es?" fragt nach der Uhrzeit.',
      },
      {
        lessonId: a1Unit5Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'It is three o'clock'?" },
        correctAnswer: { accepted: ['es ist drei uhr'] },
        explanation: '"Es ist drei Uhr" bedeutet "It is three o\'clock".',
      },
    ],
  })

  const a1Unit5Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit5.id,
      order: 3,
      grammarTopic: 'Wochentage',
      explanationDe: `## Die Wochentage

Alle Wochentage sind maskulin (der). Für „an einem Tag" benutzt du **am** (an + dem).

| Deutsch | Englisch |
| ---------- | -------- |
| Montag | Monday |
| Dienstag | Tuesday |
| Mittwoch | Wednesday |
| Donnerstag | Thursday |
| Freitag | Friday |
| Samstag | Saturday |
| Sonntag | Sunday |

**Beispiel:** **Am** Montag arbeite ich. **Am** Sonntag habe ich frei.`,
      explanationEn: `## The days of the week

All weekdays are masculine (der). To say "on a day" you use **am** (an + dem).

| German | English |
| ---------- | --------- |
| Montag | Monday |
| Dienstag | Tuesday |
| Mittwoch | Wednesday |
| Donnerstag | Thursday |
| Freitag | Friday |
| Samstag | Saturday |
| Sonntag | Sunday |

**Example:** **Am** Montag arbeite ich. (On Monday I work.) **Am** Sonntag habe ich frei. (On Sunday I'm off.)`,
      explanationTr: `## Haftanın günleri

Bütün günler erildir (der). „Bir günde" demek için **am** (an + dem) kullanırsın.

| Almanca | Türkçe |
| ---------- | ------ |
| Montag | Pazartesi |
| Dienstag | Salı |
| Mittwoch | Çarşamba |
| Donnerstag | Perşembe |
| Freitag | Cuma |
| Samstag | Cumartesi |
| Sonntag | Pazar |

**Örnek:** **Am** Montag arbeite ich. (Pazartesi çalışırım.) **Am** Sonntag habe ich frei. (Pazar günü izinliyim.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit5Lesson3.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['Montag', 'Mittwoch', 'Sonntag'], rights: ['Sunday', 'Monday', 'Wednesday'] },
        correctAnswer: {
          pairs: [
            { left: 'Montag', right: 'Monday' },
            { left: 'Mittwoch', right: 'Wednesday' },
            { left: 'Sonntag', right: 'Sunday' },
          ],
        },
        explanation: 'Wochentage und ihre Bedeutung.',
      },
      {
        lessonId: a1Unit5Lesson3.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['ich', 'Montag', 'am', 'arbeite'] },
        correctAnswer: { order: ['ich', 'arbeite', 'am', 'Montag'] },
        explanation: 'Reihenfolge: Subjekt, Verb, Zeitangabe.',
      },
    ],
  })

  const a1Unit5Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit5.id,
      order: 4,
      grammarTopic: 'Tagesablauf',
      explanationDe: `## Der Tagesablauf

Um deinen Tag zu beschreiben, verbindest du Zeitangaben mit Verben. Wichtige Präpositionen:

| Präposition | Bedeutung | Beispiel |
| ----------- | --------- | -------- |
| um | at (Uhrzeit) | **um** acht Uhr |
| von … bis | from … to | **von** neun **bis** siebzehn Uhr |
| am | on (Tag) | **am** Morgen |

**Beispiel:** Ich esse **um** acht Uhr Frühstück und arbeite **von** neun **bis** siebzehn Uhr.`,
      explanationEn: `## Daily routine

To describe your day, you combine time expressions with verbs. Important prepositions:

| Preposition | Meaning | Example |
| ----------- | ------- | -------- |
| um | at (a time) | **um** acht Uhr |
| von … bis | from … to | **von** neun **bis** siebzehn Uhr |
| am | on (a part of day) | **am** Morgen |

**Example:** Ich esse **um** acht Uhr Frühstück und arbeite **von** neun **bis** siebzehn Uhr. (I have breakfast at eight and work from nine to five.)`,
      explanationTr: `## Günlük akış (Tagesablauf)

Gününü anlatmak için zaman ifadelerini fiillerle birleştirirsin. Önemli edatlar:

| Edat | Anlamı | Örnek |
| ---- | ------ | ----- |
| um | -de (saat) | **um** acht Uhr |
| von … bis | -den … -e kadar | **von** neun **bis** siebzehn Uhr |
| am | -de (günün bölümü) | **am** Morgen |

**Örnek:** Ich esse **um** acht Uhr Frühstück und arbeite **von** neun **bis** siebzehn Uhr. (Saat sekizde kahvaltı yaparım ve dokuzdan beşe kadar çalışırım.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit5Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich esse ___ acht Uhr Frühstück.' },
        correctAnswer: { accepted: ['um'] },
        explanation: 'Uhrzeit mit "um": um acht Uhr.',
      },
      {
        lessonId: a1Unit5Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich arbeite ___ neun bis siebzehn Uhr.', options: ['von', 'um', 'am', 'bei'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Von...bis" beschreibt einen Zeitraum.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit5Lesson1.id, word: 'zwanzig', translationEn: 'twenty', translationTr: 'yirmi', exampleSentence: 'Ich bin zwanzig Jahre alt.' },
      { lessonId: a1Unit5Lesson1.id, word: 'hundert', translationEn: 'hundred', translationTr: 'yüz', exampleSentence: 'Das kostet hundert Euro.' },
      { lessonId: a1Unit5Lesson2.id, word: 'die Uhr', translationEn: 'the clock / o\'clock', translationTr: 'saat', exampleSentence: 'Es ist drei Uhr.' },
      { lessonId: a1Unit5Lesson2.id, word: 'spät', translationEn: 'late', translationTr: 'geç', exampleSentence: 'Wie spät ist es?' },
      { lessonId: a1Unit5Lesson3.id, word: 'der Montag', translationEn: 'Monday', translationTr: 'pazartesi', exampleSentence: 'Ich arbeite am Montag.' },
      { lessonId: a1Unit5Lesson3.id, word: 'der Sonntag', translationEn: 'Sunday', translationTr: 'pazar', exampleSentence: 'Am Sonntag bin ich zu Hause.' },
      { lessonId: a1Unit5Lesson4.id, word: 'das Frühstück', translationEn: 'breakfast', translationTr: 'kahvaltı', exampleSentence: 'Ich esse um acht Uhr Frühstück.' },
      { lessonId: a1Unit5Lesson4.id, word: 'arbeiten', translationEn: 'to work', translationTr: 'çalışmak', exampleSentence: 'Ich arbeite von neun bis siebzehn Uhr.' },
    ],
  })

  // --- A1 Unit 6: Akkusativ (4 lessons) ---
  const a1Unit6 = await prisma.unit.create({
    data: { levelId: a1.id, order: 6, titleDe: 'Akkusativ', titleEn: 'Accusative Case', titleTr: 'Akkusativ (-i Hali)' },
  })

  const a1Unit6Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit6.id,
      order: 1,
      grammarTopic: 'Akkusativ-Artikel',
      explanationDe: `## Der Akkusativ: Artikel

Das Akkusativobjekt ist meist die Person oder Sache, die eine Handlung „empfängt". Nur der **maskuline** Artikel ändert sich – der Rest bleibt gleich.

| Genus | Nominativ | Akkusativ |
| -------- | --------- | --------- |
| maskulin | der/ein | **den/einen** |
| feminin | die/eine | die/eine |
| neutral | das/ein | das/ein |
| Plural | die | die |

**Beispiel:** Ich sehe **den** Mann, **die** Frau und **das** Kind.`,
      explanationEn: `## The accusative: articles

The accusative object is usually the person or thing that "receives" the action. Only the **masculine** article changes – the rest stays the same.

| Gender | Nominative | Accusative |
| --------- | ---------- | ---------- |
| masculine | der/ein | **den/einen** |
| feminine | die/eine | die/eine |
| neuter | das/ein | das/ein |
| plural | die | die |

**Example:** Ich sehe **den** Mann, **die** Frau und **das** Kind. (I see the man, the woman and the child.)`,
      explanationTr: `## Akkusatif: tanımlıklar

Akkusatif nesnesi genelde bir eylemi „alan" kişi ya da nesnedir. Sadece **eril** tanımlık değişir – geri kalanı aynı kalır.

| Cinsiyet | Nominatif | Akkusatif |
| -------- | --------- | --------- |
| eril | der/ein | **den/einen** |
| dişil | die/eine | die/eine |
| nötr | das/ein | das/ein |
| çoğul | die | die |

**Örnek:** Ich sehe **den** Mann, **die** Frau und **das** Kind. (Adamı, kadını ve çocuğu görüyorum.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit6Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich sehe ___ Mann.', options: ['der', 'den', 'die', 'das'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Maskulin im Akkusativ: den Mann.',
      },
      {
        lessonId: a1Unit6Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich sehe ___ Frau.' },
        correctAnswer: { accepted: ['die'] },
        explanation: 'Feminin bleibt im Akkusativ gleich: die Frau.',
      },
    ],
  })

  const a1Unit6Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit6.id,
      order: 2,
      grammarTopic: 'Akkusativ-Pronomen',
      explanationDe: `## Der Akkusativ: Pronomen

Auch die Personalpronomen haben eine Akkusativform. Nur „sie", „es", „Sie" bleiben gleich.

| Nominativ | Akkusativ |
| --------- | --------- |
| ich | mich |
| du | dich |
| er | ihn |
| sie | sie |
| es | es |
| wir | uns |
| ihr | euch |
| sie/Sie | sie/Sie |

**Beispiel:** Ich liebe **dich**. Sie sieht **ihn**. Er versteht **uns** nicht.`,
      explanationEn: `## The accusative: pronouns

Personal pronouns also have an accusative form. Only "sie", "es" and "Sie" stay the same.

| Nominative | Accusative |
| ---------- | ---------- |
| ich | mich (me) |
| du | dich (you) |
| er | ihn (him) |
| sie | sie (her) |
| es | es (it) |
| wir | uns (us) |
| ihr | euch (you pl.) |
| sie/Sie | sie/Sie (them/you) |

**Example:** Ich liebe **dich**. (I love you.) Sie sieht **ihn**. (She sees him.) Er versteht **uns** nicht. (He doesn't understand us.)`,
      explanationTr: `## Akkusatif: zamirler

Şahıs zamirlerinin de bir akkusatif biçimi vardır. Sadece „sie", „es" ve „Sie" aynı kalır.

| Nominatif | Akkusatif |
| --------- | --------- |
| ich | mich (beni) |
| du | dich (seni) |
| er | ihn (onu) |
| sie | sie (onu) |
| es | es (onu) |
| wir | uns (bizi) |
| ihr | euch (sizi) |
| sie/Sie | sie/Sie (onları/sizi) |

**Örnek:** Ich liebe **dich**. (Seni seviyorum.) Sie sieht **ihn**. (O, onu görüyor.) Er versteht **uns** nicht. (O bizi anlamıyor.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit6Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich liebe ___. (him)', options: ['er', 'ihn', 'ihm', 'sie'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"er" wird im Akkusativ zu "ihn".',
      },
      {
        lessonId: a1Unit6Lesson2.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['ich', 'du', 'er'], rights: ['ihn', 'mich', 'dich'] },
        correctAnswer: {
          pairs: [
            { left: 'ich', right: 'mich' },
            { left: 'du', right: 'dich' },
            { left: 'er', right: 'ihn' },
          ],
        },
        explanation: 'Akkusativpronomen.',
      },
    ],
  })

  const a1Unit6Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit6.id,
      order: 3,
      grammarTopic: 'Verben mit Akkusativ',
      explanationDe: `## Verben mit Akkusativ

Viele Verben brauchen ein Akkusativobjekt. Nach diesen Verben wird „ein" bei maskulinen Nomen zu **einen**.

| Verb | Beispiel |
| -------- | -------- |
| haben | Ich habe **einen** Hund. |
| brauchen | Ich brauche **einen** Stift. |
| möchten | Ich möchte **einen** Kaffee. |
| kaufen | Ich kaufe **einen** Apfel. |

**Beispiel:** Ich brauche **einen** Stift und **eine** Tasche.`,
      explanationEn: `## Verbs with the accusative

Many verbs need an accusative object. After these verbs, "ein" becomes **einen** with masculine nouns.

| Verb | Example |
| -------- | -------- |
| haben (to have) | Ich habe **einen** Hund. |
| brauchen (to need) | Ich brauche **einen** Stift. |
| möchten (would like) | Ich möchte **einen** Kaffee. |
| kaufen (to buy) | Ich kaufe **einen** Apfel. |

**Example:** Ich brauche **einen** Stift und **eine** Tasche. (I need a pen and a bag.)`,
      explanationTr: `## Akkusatif alan fiiller

Birçok fiil akkusatif nesne alır. Bu fiillerden sonra eril isimlerde „ein" → **einen** olur.

| Fiil | Örnek |
| -------- | ----- |
| haben (sahip olmak) | Ich habe **einen** Hund. |
| brauchen (ihtiyacı olmak) | Ich brauche **einen** Stift. |
| möchten (istemek) | Ich möchte **einen** Kaffee. |
| kaufen (satın almak) | Ich kaufe **einen** Apfel. |

**Örnek:** Ich brauche **einen** Stift und **eine** Tasche. (Bir kaleme ve bir çantaya ihtiyacım var.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit6Lesson3.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich brauche ___ Stift. (maskulin, Akkusativ)' },
        correctAnswer: { accepted: ['einen'] },
        explanation: 'Maskulin im Akkusativ: einen Stift.',
      },
      {
        lessonId: a1Unit6Lesson3.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich möchte ___ Kaffee.', options: ['ein', 'eine', 'einen', 'der'] },
        correctAnswer: { correctIndex: 2 },
        explanation: '"Kaffee" ist maskulin: einen Kaffee.',
      },
    ],
  })

  const a1Unit6Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit6.id,
      order: 4,
      grammarTopic: 'Verneinung mit "nicht"',
      explanationDe: `## Verneinung mit „nicht"

Mit **nicht** verneinst du Verben, Adjektive oder ganze Sätze. „nicht" steht meist am Satzende oder direkt vor dem Wort, das du verneinst.

| Verneint … | Beispiel |
| ----------- | -------- |
| ein Verb | Ich verstehe das **nicht**. |
| ein Adjektiv | Das ist **nicht** richtig. |
| einen Ort | Er wohnt **nicht** hier. |

**kein oder nicht?** Nomen mit unbestimmtem Artikel verneinst du mit **kein**, alles andere mit **nicht**.`,
      explanationEn: `## Negation with "nicht"

You use **nicht** to negate verbs, adjectives or whole sentences. "nicht" usually goes at the end of the sentence or right before the word you negate.

| Negates … | Example |
| ---------- | -------- |
| a verb | Ich verstehe das **nicht**. (I don't understand that.) |
| an adjective | Das ist **nicht** richtig. (That's not correct.) |
| a place | Er wohnt **nicht** hier. (He doesn't live here.) |

**kein or nicht?** Negate nouns with an indefinite article using **kein**, everything else with **nicht**.`,
      explanationTr: `## „nicht" ile olumsuzlama

**nicht** ile fiilleri, sıfatları ya da tüm cümleyi olumsuz yaparsın. „nicht" genellikle cümlenin sonuna ya da olumsuzladığın kelimenin hemen önüne gelir.

| Neyi olumsuzlar | Örnek |
| --------------- | ----- |
| bir fiili | Ich verstehe das **nicht**. (Bunu anlamıyorum.) |
| bir sıfatı | Das ist **nicht** richtig. (Bu doğru değil.) |
| bir yeri | Er wohnt **nicht** hier. (O burada yaşamıyor.) |

**kein mi, nicht mi?** Belirsiz tanımlıklı isimleri **kein** ile, diğer her şeyi **nicht** ile olumsuz yaparsın.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit6Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich verstehe das ___.', options: ['kein', 'keine', 'nicht', 'nichts'] },
        correctAnswer: { correctIndex: 2 },
        explanation: 'Verben werden mit "nicht" verneint.',
      },
      {
        lessonId: a1Unit6Lesson4.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['richtig', 'das', 'nicht', 'ist'] },
        correctAnswer: { order: ['das', 'ist', 'nicht', 'richtig'] },
        explanation: 'Reihenfolge: Subjekt, Verb, "nicht", Adjektiv.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit6Lesson1.id, word: 'sehen', translationEn: 'to see', translationTr: 'görmek', exampleSentence: 'Ich sehe den Mann.' },
      { lessonId: a1Unit6Lesson1.id, word: 'der Apfel', translationEn: 'the apple', translationTr: 'elma', exampleSentence: 'Ich sehe den Apfel.' },
      { lessonId: a1Unit6Lesson2.id, word: 'lieben', translationEn: 'to love', translationTr: 'sevmek', exampleSentence: 'Ich liebe ihn.' },
      { lessonId: a1Unit6Lesson2.id, word: 'kennen', translationEn: 'to know', translationTr: 'tanımak', exampleSentence: 'Ich kenne sie.' },
      { lessonId: a1Unit6Lesson3.id, word: 'der Stift', translationEn: 'the pen', translationTr: 'kalem', exampleSentence: 'Ich brauche einen Stift.' },
      { lessonId: a1Unit6Lesson3.id, word: 'kaufen', translationEn: 'to buy', translationTr: 'satın almak', exampleSentence: 'Ich kaufe einen Stift.' },
      { lessonId: a1Unit6Lesson4.id, word: 'verstehen', translationEn: 'to understand', translationTr: 'anlamak', exampleSentence: 'Ich verstehe das nicht.' },
      { lessonId: a1Unit6Lesson4.id, word: 'richtig', translationEn: 'correct', translationTr: 'doğru', exampleSentence: 'Das ist richtig.' },
    ],
  })

  // --- A1 Unit 7: Modalverben (4 lessons) ---
  const a1Unit7 = await prisma.unit.create({
    data: { levelId: a1.id, order: 7, titleDe: 'Modalverben', titleEn: 'Modal Verbs', titleTr: 'Kip Fiilleri' },
  })

  const a1Unit7Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit7.id,
      order: 1,
      grammarTopic: 'können/müssen',
      explanationDe: `## Modalverben: können / müssen

Modalverben verändern die Bedeutung eines anderen Verbs. **können** = Fähigkeit, **müssen** = Notwendigkeit. Sie sind unregelmäßig (ich- und er-Form sind gleich).

| Person | können | müssen |
| --------- | ------ | ------ |
| ich | kann | muss |
| du | kannst | musst |
| er/sie/es | kann | muss |
| wir | können | müssen |
| ihr | könnt | müsst |
| sie/Sie | können | müssen |

**Beispiel:** Ich **kann** schwimmen. Du **musst** arbeiten. Der Infinitiv steht am Satzende.`,
      explanationEn: `## Modal verbs: können / müssen

Modal verbs change the meaning of another verb. **können** = ability, **müssen** = necessity. They are irregular (the ich- and er-forms are identical).

| Person | können | müssen |
| --------- | ------ | ------ |
| ich | kann | muss |
| du | kannst | musst |
| er/sie/es | kann | muss |
| wir | können | müssen |
| ihr | könnt | müsst |
| sie/Sie | können | müssen |

**Example:** Ich **kann** schwimmen. (I can swim.) Du **musst** arbeiten. (You must work.) The infinitive goes at the end of the sentence.`,
      explanationTr: `## Kip fiilleri: können / müssen

Kip fiilleri başka bir fiilin anlamını değiştirir. **können** = yetenek, **müssen** = zorunluluk. Düzensizdirler (ich ve er biçimleri aynıdır).

| Kişi | können | müssen |
| --------- | ------ | ------ |
| ich | kann | muss |
| du | kannst | musst |
| er/sie/es | kann | muss |
| wir | können | müssen |
| ihr | könnt | müsst |
| sie/Sie | können | müssen |

**Örnek:** Ich **kann** schwimmen. (Yüzebilirim.) Du **musst** arbeiten. (Çalışmak zorundasın.) Mastar cümlenin sonunda yer alır.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit7Lesson1.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich ___ (können) gut schwimmen.' },
        correctAnswer: { accepted: ['kann'] },
        explanation: 'Mit "ich" benutzt man "kann".',
      },
      {
        lessonId: a1Unit7Lesson1.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Du ___ jetzt arbeiten.', options: ['musst', 'muss', 'müssen', 'müsst'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "du" benutzt man "musst".',
      },
    ],
  })

  const a1Unit7Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit7.id,
      order: 2,
      grammarTopic: 'wollen/möchten/dürfen',
      explanationDe: `## Modalverben: wollen / möchten / dürfen

Diese drei Modalverben drücken Wunsch und Erlaubnis aus:

| Verb | Bedeutung | Beispiel |
| -------- | ---------- | -------- |
| wollen | starker Wunsch | Ich **will** Pizza essen. |
| möchten | höflicher Wunsch | Ich **möchte** einen Kaffee. |
| dürfen | Erlaubnis | **Darf** ich rauchen? |

**Tipp:** „möchten" ist die höfliche Form von „wollen" – benutze sie im Restaurant oder bei Bitten.`,
      explanationEn: `## Modal verbs: wollen / möchten / dürfen

These three modal verbs express wishes and permission:

| Verb | Meaning | Example |
| -------- | ---------- | -------- |
| wollen | strong want | Ich **will** Pizza essen. |
| möchten | polite wish | Ich **möchte** einen Kaffee. |
| dürfen | permission | **Darf** ich rauchen? |

**Tip:** "möchten" is the polite form of "wollen" – use it in restaurants or when making requests.`,
      explanationTr: `## Kip fiilleri: wollen / möchten / dürfen

Bu üç kip fiili istek ve izin ifade eder:

| Fiil | Anlamı | Örnek |
| -------- | --------- | ----- |
| wollen | güçlü istek | Ich **will** Pizza essen. |
| möchten | kibar istek | Ich **möchte** einen Kaffee. |
| dürfen | izin | **Darf** ich rauchen? |

**İpucu:** „möchten", „wollen" fiilinin kibar biçimidir – restoranda ya da rica ederken kullan.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit7Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ ich hier rauchen?', options: ['Darf', 'Kann', 'Will', 'Muss'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Dürfen" fragt nach Erlaubnis.',
      },
      {
        lessonId: a1Unit7Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man höflich auf Deutsch: 'I would like a coffee'?" },
        correctAnswer: { accepted: ['ich möchte einen kaffee'] },
        explanation: '"Ich möchte einen Kaffee" ist die höfliche Form.',
      },
    ],
  })

  const a1Unit7Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit7.id,
      order: 3,
      grammarTopic: 'Satzstruktur mit Modalverben',
      explanationDe: `## Satzstruktur mit Modalverben

Im Satz bilden Modalverb und Infinitiv eine **Klammer**: Das Modalverb steht an **Position 2**, der Infinitiv ganz am **Ende**.

| Pos. 1 | Pos. 2 (Modalverb) | Mitte | Ende (Infinitiv) |
| ------ | ------------------ | ----- | ---------------- |
| Ich | möchte | heute Abend ins Kino | gehen. |
| Er | kann | sehr gut Deutsch | sprechen. |

**Beispiel:** Ich **möchte** heute Abend ins Kino **gehen**.`,
      explanationEn: `## Sentence structure with modal verbs

In the sentence, the modal verb and the infinitive form a **bracket**: the modal verb is in **position 2**, the infinitive goes right at the **end**.

| Pos. 1 | Pos. 2 (modal) | middle | end (infinitive) |
| ------ | -------------- | ------ | ---------------- |
| Ich | möchte | heute Abend ins Kino | gehen. |
| Er | kann | sehr gut Deutsch | sprechen. |

**Example:** Ich **möchte** heute Abend ins Kino **gehen**. (I'd like to go to the cinema tonight.)`,
      explanationTr: `## Kip fiilleriyle cümle yapısı

Cümlede kip fiili ile mastar bir **çerçeve** oluşturur: Kip fiili **2. konumda**, mastar ise en **sonda** yer alır.

| Konum 1 | Konum 2 (kip fiili) | orta | son (mastar) |
| ------- | ------------------- | ---- | ------------ |
| Ich | möchte | heute Abend ins Kino | gehen. |
| Er | kann | sehr gut Deutsch | sprechen. |

**Örnek:** Ich **möchte** heute Abend ins Kino **gehen**. (Bu akşam sinemaya gitmek istiyorum.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit7Lesson3.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['gehen', 'möchte', 'ich', 'schwimmen'] },
        correctAnswer: { order: ['ich', 'möchte', 'schwimmen', 'gehen'] },
        explanation: 'Modalverb Position 2, Infinitiv am Ende.',
      },
      {
        lessonId: a1Unit7Lesson3.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich kann gut Deutsch ___.', options: ['spreche', 'sprechen', 'spricht', 'sprichst'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Nach Modalverben steht der Infinitiv.',
      },
    ],
  })

  const a1Unit7Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit7.id,
      order: 4,
      grammarTopic: 'Bestellungen ("Ich möchte...")',
      explanationDe: `## Bestellungen: „Ich möchte …"

Im Restaurant oder Café bestellst du höflich mit **„Ich möchte …"** oder **„Ich hätte gern …"**. Vergiss „bitte" nicht.

| Formel | Beispiel |
| ------------------ | -------- |
| Ich möchte … | Ich **möchte** ein Wasser, bitte. |
| Ich hätte gern … | Ich **hätte gern** einen Kaffee. |
| Ich nehme … | Ich **nehme** die Suppe. |

**Beispiel:** Ich **möchte** einen Tee und ein Stück Kuchen, **bitte**.`,
      explanationEn: `## Ordering: "Ich möchte …"

In a restaurant or café you order politely with **"Ich möchte …"** or **"Ich hätte gern …"**. Don't forget "bitte" (please).

| Phrase | Example |
| ------------------ | -------- |
| Ich möchte … | Ich **möchte** ein Wasser, bitte. |
| Ich hätte gern … | Ich **hätte gern** einen Kaffee. |
| Ich nehme … | Ich **nehme** die Suppe. |

**Example:** Ich **möchte** einen Tee und ein Stück Kuchen, **bitte**. (I'd like a tea and a piece of cake, please.)`,
      explanationTr: `## Sipariş verme: „Ich möchte …"

Restoranda ya da kafede kibarca **„Ich möchte …"** ya da **„Ich hätte gern …"** ile sipariş verirsin. „bitte" (lütfen) demeyi unutma.

| Kalıp | Örnek |
| ------------------ | ----- |
| Ich möchte … | Ich **möchte** ein Wasser, bitte. |
| Ich hätte gern … | Ich **hätte gern** einen Kaffee. |
| Ich nehme … | Ich **nehme** die Suppe. |

**Örnek:** Ich **möchte** einen Tee und ein Stück Kuchen, **bitte**. (Bir çay ve bir dilim pasta istiyorum, lütfen.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit7Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich ___ ein Wasser, bitte.' },
        correctAnswer: { accepted: ['möchte'] },
        explanation: '"Ich möchte" ist die höfliche Bestellform.',
      },
      {
        lessonId: a1Unit7Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'Was sagt man höflich im Café?',
          options: ['Gib mir Kaffee!', 'Ich möchte einen Kaffee, bitte.', 'Kaffee!', 'Ich habe Kaffee.'],
        },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Ich möchte..., bitte" ist höflich.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit7Lesson1.id, word: 'können', translationEn: 'can / to be able to', translationTr: '-abilmek', exampleSentence: 'Ich kann schwimmen.' },
      { lessonId: a1Unit7Lesson1.id, word: 'müssen', translationEn: 'must / to have to', translationTr: 'zorunda olmak', exampleSentence: 'Du musst arbeiten.' },
      { lessonId: a1Unit7Lesson2.id, word: 'wollen', translationEn: 'to want', translationTr: 'istemek', exampleSentence: 'Ich will Pizza essen.' },
      { lessonId: a1Unit7Lesson2.id, word: 'dürfen', translationEn: 'may / to be allowed to', translationTr: 'izinli olmak', exampleSentence: 'Darf ich rauchen?' },
      { lessonId: a1Unit7Lesson3.id, word: 'sprechen', translationEn: 'to speak', translationTr: 'konuşmak', exampleSentence: 'Ich kann gut Deutsch sprechen.' },
      { lessonId: a1Unit7Lesson3.id, word: 'gehen', translationEn: 'to go', translationTr: 'gitmek', exampleSentence: 'Ich möchte schwimmen gehen.' },
      { lessonId: a1Unit7Lesson4.id, word: 'das Wasser', translationEn: 'water', translationTr: 'su', exampleSentence: 'Ich möchte ein Wasser, bitte.' },
      { lessonId: a1Unit7Lesson4.id, word: 'bitte', translationEn: 'please', translationTr: 'lütfen', exampleSentence: 'Ein Wasser, bitte.' },
    ],
  })

  // --- A1 Unit 8: Trennbare Verben & Alltag (4 lessons) ---
  const a1Unit8 = await prisma.unit.create({
    data: { levelId: a1.id, order: 8, titleDe: 'Trennbare Verben & Alltag', titleEn: 'Separable Verbs & Daily Life', titleTr: 'Ayrılabilir Fiiller ve Günlük Hayat' },
  })

  const a1Unit8Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit8.id,
      order: 1,
      grammarTopic: 'Trennbare Verben (Einführung)',
      explanationDe: `## Trennbare Verben (Einführung)

Viele Verben haben ein **trennbares Präfix**. Im Präsens trennt sich das Präfix ab und wandert ans **Satzende**. Der Wortstamm wird ganz normal konjugiert.

| Infinitiv | Präfix | Satz |
| ---------- | ------ | ---- |
| **auf**stehen | auf | Ich stehe früh **auf**. |
| **an**kommen | an | Der Zug kommt spät **an**. |

**Beispiel:** „aufstehen" → Ich **stehe** um sieben Uhr **auf**.`,
      explanationEn: `## Separable verbs (introduction)

Many verbs have a **separable prefix**. In the present tense the prefix splits off and moves to the **end of the sentence**. The stem is conjugated as normal.

| Infinitive | Prefix | Sentence |
| ---------- | ------ | -------- |
| **auf**stehen (get up) | auf | Ich stehe früh **auf**. |
| **an**kommen (arrive) | an | Der Zug kommt spät **an**. |

**Example:** "aufstehen" → Ich **stehe** um sieben Uhr **auf**. (I get up at seven o'clock.)`,
      explanationTr: `## Ayrılabilen fiiller (giriş)

Birçok fiilin **ayrılabilen bir ön eki** vardır. Geniş zamanda ön ek ayrılıp **cümlenin sonuna** gider. Gövde normal şekilde çekimlenir.

| Mastar | Ön ek | Cümle |
| ------ | ----- | ----- |
| **auf**stehen (kalkmak) | auf | Ich stehe früh **auf**. |
| **an**kommen (varmak) | an | Der Zug kommt spät **an**. |

**Örnek:** „aufstehen" → Ich **stehe** um sieben Uhr **auf**. (Saat yedide kalkarım.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit8Lesson1.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['auf', 'ich', 'stehe', 'früh'] },
        correctAnswer: { order: ['ich', 'stehe', 'früh', 'auf'] },
        explanation: 'Das Präfix "auf" steht am Satzende.',
      },
      {
        lessonId: a1Unit8Lesson1.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich stehe um sieben Uhr ___.', options: ['auf', 'aufstehen', 'stehe auf', 'aufgestanden'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Nur das Präfix steht am Ende: auf.',
      },
    ],
  })

  const a1Unit8Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit8.id,
      order: 2,
      grammarTopic: 'Weitere trennbare Verben (einkaufen, fernsehen)',
      explanationDe: `## Weitere trennbare Verben

Viele Alltagsverben sind trennbar. Das Präfix steht immer am Satzende:

| Infinitiv | Bedeutung | Satz |
| ------------ | ---------- | ---- |
| einkaufen | to shop | Ich kaufe Gemüse **ein**. |
| fernsehen | to watch TV | Er sieht abends **fern**. |
| anrufen | to call | Sie ruft ihre Mutter **an**. |
| aufräumen | to tidy up | Wir räumen das Zimmer **auf**. |

**Beispiel:** Ich **kaufe** am Samstag **ein** und **sehe** abends **fern**.`,
      explanationEn: `## More separable verbs

Many everyday verbs are separable. The prefix always goes at the end of the sentence:

| Infinitive | Meaning | Sentence |
| ------------ | ---------- | -------- |
| einkaufen | to shop | Ich kaufe Gemüse **ein**. |
| fernsehen | to watch TV | Er sieht abends **fern**. |
| anrufen | to call | Sie ruft ihre Mutter **an**. |
| aufräumen | to tidy up | Wir räumen das Zimmer **auf**. |

**Example:** Ich **kaufe** am Samstag **ein** und **sehe** abends **fern**. (I shop on Saturday and watch TV in the evening.)`,
      explanationTr: `## Diğer ayrılabilen fiiller

Birçok günlük fiil ayrılabilir. Ön ek her zaman cümlenin sonunda yer alır:

| Mastar | Anlamı | Cümle |
| ------------ | --------- | ----- |
| einkaufen | alışveriş yapmak | Ich kaufe Gemüse **ein**. |
| fernsehen | televizyon izlemek | Er sieht abends **fern**. |
| anrufen | aramak | Sie ruft ihre Mutter **an**. |
| aufräumen | toplamak | Wir räumen das Zimmer **auf**. |

**Örnek:** Ich **kaufe** am Samstag **ein** und **sehe** abends **fern**. (Cumartesi alışveriş yaparım ve akşam televizyon izlerim.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit8Lesson2.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er sieht abends ___. (fernsehen)' },
        correctAnswer: { accepted: ['fern'] },
        explanation: 'Präfix "fern" steht am Satzende.',
      },
      {
        lessonId: a1Unit8Lesson2.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich kaufe Gemüse ___.', options: ['ein', 'einkaufen', 'kaufe ein', 'eingekauft'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Präfix "ein" steht am Ende: ich kaufe ein.',
      },
    ],
  })

  const a1Unit8Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit8.id,
      order: 3,
      grammarTopic: 'Satzstellung mit trennbaren Verben und Zeit',
      explanationDe: `## Satzstellung: trennbare Verben und Zeit

Das konjugierte Verb bleibt an **Position 2**, das Präfix am **Ende**. Zeitangaben stehen dazwischen – meist direkt nach dem Verb.

| Position 1 | Verb (2) | Zeit | Ende (Präfix) |
| ---------- | -------- | ---- | ------------- |
| Ich | stehe | täglich um sieben Uhr | auf. |
| Sie | ruft | jeden Abend | an. |

**Beispiel:** Ich **stehe** täglich um sieben Uhr **auf**.`,
      explanationEn: `## Word order: separable verbs and time

The conjugated verb stays in **position 2**, the prefix at the **end**. Time expressions go in between – usually right after the verb.

| Position 1 | Verb (2) | Time | End (prefix) |
| ---------- | -------- | ---- | ------------ |
| Ich | stehe | täglich um sieben Uhr | auf. |
| Sie | ruft | jeden Abend | an. |

**Example:** Ich **stehe** täglich um sieben Uhr **auf**. (I get up at seven o'clock every day.)`,
      explanationTr: `## Cümle dizilişi: ayrılabilen fiiller ve zaman

Çekimli fiil **2. konumda**, ön ek **sonda** kalır. Zaman ifadeleri araya girer – çoğunlukla fiilin hemen ardından.

| Konum 1 | Fiil (2) | Zaman | Son (ön ek) |
| ------- | -------- | ----- | ----------- |
| Ich | stehe | täglich um sieben Uhr | auf. |
| Sie | ruft | jeden Abend | an. |

**Örnek:** Ich **stehe** täglich um sieben Uhr **auf**. (Her gün saat yedide kalkarım.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit8Lesson3.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['auf', 'täglich', 'ich', 'stehe'] },
        correctAnswer: { order: ['ich', 'stehe', 'täglich', 'auf'] },
        explanation: 'Reihenfolge: Subjekt, Verb, Zeitangabe, Präfix.',
      },
      {
        lessonId: a1Unit8Lesson3.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich rufe meine Mutter oft ___.', options: ['an', 'anrufen', 'rief an', 'rufe an'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Präfix "an" steht am Satzende.',
      },
    ],
  })

  const a1Unit8Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit8.id,
      order: 4,
      grammarTopic: 'Übung (trennbare Verben Wiederholung)',
      explanationDe: `## Übung: trennbare Verben im Alltag

In dieser Lektion wiederholst du trennbare Verben. Denk an die Regel: **Verb an Position 2, Präfix am Ende.**

Typische Fragen und Antworten:

- **Wann** stehst du **auf**? – Ich stehe um acht Uhr **auf**.
- **Was** kaufst du **ein**? – Ich kaufe Brot und Milch **ein**.
- **Wann** rufst du deine Mutter **an**? – Ich rufe sie am Abend **an**.

**Beispiel:** Ich **stehe** um acht Uhr **auf** und **kaufe** dann Brot **ein**.`,
      explanationEn: `## Practice: separable verbs in daily life

In this lesson you review separable verbs. Remember the rule: **verb in position 2, prefix at the end.**

Typical questions and answers:

- **Wann** stehst du **auf**? – Ich stehe um acht Uhr **auf**. (When do you get up? – I get up at eight.)
- **Was** kaufst du **ein**? – Ich kaufe Brot und Milch **ein**. (What do you buy? – I buy bread and milk.)
- **Wann** rufst du deine Mutter **an**? – Ich rufe sie am Abend **an**. (When do you call your mother? – I call her in the evening.)

**Example:** Ich **stehe** um acht Uhr **auf** und **kaufe** dann Brot **ein**.`,
      explanationTr: `## Alıştırma: günlük hayatta ayrılabilen fiiller

Bu derste ayrılabilen fiilleri tekrar edersin. Kuralı hatırla: **fiil 2. konumda, ön ek sonda.**

Tipik sorular ve cevaplar:

- **Wann** stehst du **auf**? – Ich stehe um acht Uhr **auf**. (Ne zaman kalkarsın? – Saat sekizde kalkarım.)
- **Was** kaufst du **ein**? – Ich kaufe Brot und Milch **ein**. (Ne alırsın? – Ekmek ve süt alırım.)
- **Wann** rufst du deine Mutter **an**? – Ich rufe sie am Abend **an**. (Anneni ne zaman ararsın? – Onu akşam ararım.)

**Örnek:** Ich **stehe** um acht Uhr **auf** und **kaufe** dann Brot **ein**.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit8Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wann ___ du auf?', options: ['stehst', 'steht', 'stehe', 'stehen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "du" benutzt man "stehst".',
      },
      {
        lessonId: a1Unit8Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I get up at eight o'clock'?" },
        correctAnswer: { accepted: ['ich stehe um acht uhr auf'] },
        explanation: '"Ich stehe um acht Uhr auf" bedeutet "I get up at eight o\'clock".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit8Lesson1.id, word: 'aufstehen', translationEn: 'to get up', translationTr: 'kalkmak', exampleSentence: 'Ich stehe früh auf.' },
      { lessonId: a1Unit8Lesson1.id, word: 'früh', translationEn: 'early', translationTr: 'erken', exampleSentence: 'Ich stehe früh auf.' },
      { lessonId: a1Unit8Lesson2.id, word: 'einkaufen', translationEn: 'to shop', translationTr: 'alışveriş yapmak', exampleSentence: 'Ich kaufe Gemüse ein.' },
      { lessonId: a1Unit8Lesson2.id, word: 'fernsehen', translationEn: 'to watch TV', translationTr: 'televizyon izlemek', exampleSentence: 'Er sieht abends fern.' },
      { lessonId: a1Unit8Lesson3.id, word: 'täglich', translationEn: 'daily', translationTr: 'her gün', exampleSentence: 'Ich stehe täglich um sieben Uhr auf.' },
      { lessonId: a1Unit8Lesson3.id, word: 'anrufen', translationEn: 'to call', translationTr: 'aramak', exampleSentence: 'Ich rufe meine Mutter an.' },
      { lessonId: a1Unit8Lesson4.id, word: 'das Brot', translationEn: 'bread', translationTr: 'ekmek', exampleSentence: 'Ich kaufe Brot ein.' },
      { lessonId: a1Unit8Lesson4.id, word: 'das Gemüse', translationEn: 'vegetables', translationTr: 'sebze', exampleSentence: 'Ich kaufe Gemüse ein.' },
    ],
  })

  // --- A1 Unit 9: Dativ & Präpositionen (4 lessons) ---
  const a1Unit9 = await prisma.unit.create({
    data: { levelId: a1.id, order: 9, titleDe: 'Dativ & Präpositionen', titleEn: 'Dative Case & Prepositions', titleTr: 'Datif (-e Hali) ve Edatlar' },
  })

  const a1Unit9Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit9.id,
      order: 1,
      grammarTopic: 'Dativ-Artikel',
      explanationDe: `## Der Dativ: Artikel

Der Dativ ist oft der „Empfänger" einer Handlung. Alle Artikel ändern sich (im Plural bekommt das Nomen zusätzlich ein **-n**).

| Genus | Nominativ | Dativ |
| -------- | --------- | ----- |
| maskulin | der | **dem** |
| feminin | die | **der** |
| neutral | das | **dem** |
| Plural | die | **den** (+ Nomen -n) |

**Beispiel:** Ich helfe **dem** Mann, **der** Frau und **den** Kindern.`,
      explanationEn: `## The dative: articles

The dative is often the "receiver" of an action. All articles change (in the plural the noun also gets an extra **-n**).

| Gender | Nominative | Dative |
| --------- | ---------- | ------ |
| masculine | der | **dem** |
| feminine | die | **der** |
| neuter | das | **dem** |
| plural | die | **den** (+ noun -n) |

**Example:** Ich helfe **dem** Mann, **der** Frau und **den** Kindern. (I help the man, the woman and the children.)`,
      explanationTr: `## Datif: tanımlıklar

Datif çoğu zaman bir eylemin „alıcısıdır". Bütün tanımlıklar değişir (çoğulda isim ayrıca **-n** eki alır).

| Cinsiyet | Nominatif | Datif |
| -------- | --------- | ----- |
| eril | der | **dem** |
| dişil | die | **der** |
| nötr | das | **dem** |
| çoğul | die | **den** (+ isim -n) |

**Örnek:** Ich helfe **dem** Mann, **der** Frau und **den** Kindern. (Adama, kadına ve çocuklara yardım ediyorum.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit9Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich helfe ___ Frau.', options: ['die', 'der', 'dem', 'den'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Feminin im Dativ: der Frau.',
      },
      {
        lessonId: a1Unit9Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich helfe ___ Kind. (neutral, Dativ)' },
        correctAnswer: { accepted: ['dem'] },
        explanation: 'Neutral im Dativ: dem Kind.',
      },
    ],
  })

  const a1Unit9Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit9.id,
      order: 2,
      grammarTopic: 'Präpositionen mit Dativ',
      explanationDe: `## Präpositionen mit Dativ

Nach diesen Präpositionen steht **immer** der Dativ:

| Präposition | Bedeutung | Beispiel |
| ----------- | --------- | -------- |
| aus | from/out of | Ich komme **aus der** Türkei. |
| bei | at/near | Ich bin **bei dem** (beim) Arzt. |
| mit | with | Ich fahre **mit dem** Bus. |
| nach | after/to | **nach der** Arbeit |
| seit | since | **seit einem** Jahr |
| von | from/of | ein Brief **von der** Mutter |
| zu | to | Ich gehe **zu dem** (zum) Arzt. |

**Merkhilfe:** aus, bei, mit, nach, seit, von, zu – am besten auswendig lernen.`,
      explanationEn: `## Prepositions with the dative

After these prepositions you **always** use the dative:

| Preposition | Meaning | Example |
| ----------- | ------- | -------- |
| aus | from/out of | Ich komme **aus der** Türkei. |
| bei | at/near | Ich bin **bei dem** (beim) Arzt. |
| mit | with | Ich fahre **mit dem** Bus. |
| nach | after/to | **nach der** Arbeit |
| seit | since | **seit einem** Jahr |
| von | from/of | ein Brief **von der** Mutter |
| zu | to | Ich gehe **zu dem** (zum) Arzt. |

**Memory aid:** aus, bei, mit, nach, seit, von, zu – best learned by heart.`,
      explanationTr: `## Datif alan edatlar

Bu edatlardan sonra **her zaman** datif kullanılır:

| Edat | Anlamı | Örnek |
| ---- | ------ | ----- |
| aus | -den (içinden) | Ich komme **aus der** Türkei. |
| bei | yanında/-de | Ich bin **bei dem** (beim) Arzt. |
| mit | ile | Ich fahre **mit dem** Bus. |
| nach | -den sonra/-e | **nach der** Arbeit |
| seit | -den beri | **seit einem** Jahr |
| von | -den/-in | ein Brief **von der** Mutter |
| zu | -e (birine/yere) | Ich gehe **zu dem** (zum) Arzt. |

**Hatırlatma:** aus, bei, mit, nach, seit, von, zu – en iyisi ezberlemek.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit9Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich fahre ___ dem Bus.', options: ['mit', 'für', 'ohne', 'durch'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Mit dem Bus" beschreibt ein Verkehrsmittel.',
      },
      {
        lessonId: a1Unit9Lesson2.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['aus', 'mit', 'nach'], rights: ['to', 'from', 'with'] },
        correctAnswer: {
          pairs: [
            { left: 'aus', right: 'from' },
            { left: 'mit', right: 'with' },
            { left: 'nach', right: 'to' },
          ],
        },
        explanation: 'Dativpräpositionen und ihre Bedeutung.',
      },
    ],
  })

  const a1Unit9Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit9.id,
      order: 3,
      grammarTopic: 'Wechselpräpositionen (Einführung)',
      explanationDe: `## Wechselpräpositionen (Einführung)

Wechselpräpositionen (in, an, auf, unter, über …) können **Akkusativ oder Dativ** verlangen. Die Frage entscheidet:

| Frage | Kasus | Beispiel |
| ------------- | --------- | -------- |
| wohin? (Bewegung) | Akkusativ | Ich gehe **in die** Küche. |
| wo? (Ort) | Dativ | Ich bin **in der** Küche. |

**Beispiel:** **Wohin?** Ich lege das Buch **auf den** Tisch. · **Wo?** Das Buch liegt **auf dem** Tisch.`,
      explanationEn: `## Two-way prepositions (introduction)

Two-way prepositions (in, an, auf, unter, über …) can take **accusative or dative**. The question decides:

| Question | Case | Example |
| ------------- | ---------- | -------- |
| wohin? (movement) | accusative | Ich gehe **in die** Küche. |
| wo? (location) | dative | Ich bin **in der** Küche. |

**Example:** **Wohin?** Ich lege das Buch **auf den** Tisch. · **Wo?** Das Buch liegt **auf dem** Tisch.`,
      explanationTr: `## İki yönlü edatlar (giriş)

İki yönlü edatlar (in, an, auf, unter, über …) hem **akkusatif hem datif** alabilir. Hangi soruya cevap verdiği belirler:

| Soru | Durum | Örnek |
| ------------- | -------- | ----- |
| wohin? (hareket) | akkusatif | Ich gehe **in die** Küche. |
| wo? (konum) | datif | Ich bin **in der** Küche. |

**Örnek:** **Wohin?** Ich lege das Buch **auf den** Tisch. (Kitabı masaya koyuyorum.) · **Wo?** Das Buch liegt **auf dem** Tisch. (Kitap masanın üstünde duruyor.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit9Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich bin in ___ Küche. (wo? Dativ)', options: ['die', 'der', 'dem', 'den'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Feminin im Dativ: der Küche.',
      },
      {
        lessonId: a1Unit9Lesson3.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich gehe in ___ Küche. (wohin? Akkusativ)', options: ['die', 'der', 'dem', 'den'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Feminin im Akkusativ bleibt gleich: die Küche.',
      },
    ],
  })

  const a1Unit9Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit9.id,
      order: 4,
      grammarTopic: 'Wohnung/Zimmer',
      explanationDe: `## Wohnung und Zimmer

Das sind die wichtigsten Räume einer Wohnung. Achte auf den Artikel:

| Deutsch | Englisch |
| ---------------- | ----------- |
| das Wohnzimmer | living room |
| das Schlafzimmer | bedroom |
| das Badezimmer | bathroom |
| die Küche | kitchen |
| der Balkon | balcony |

**Beispiel:** Ich koche **in der** Küche und schlafe **im** Schlafzimmer. (Kombiniere die Zimmer mit Wechselpräpositionen im Dativ.)`,
      explanationEn: `## Apartment and rooms

These are the most important rooms of an apartment. Pay attention to the article:

| German | English |
| ---------------- | ----------- |
| das Wohnzimmer | living room |
| das Schlafzimmer | bedroom |
| das Badezimmer | bathroom |
| die Küche | kitchen |
| der Balkon | balcony |

**Example:** Ich koche **in der** Küche und schlafe **im** Schlafzimmer. (I cook in the kitchen and sleep in the bedroom.) Combine the rooms with two-way prepositions in the dative.`,
      explanationTr: `## Daire ve odalar

Bunlar bir dairenin en önemli odalarıdır. Tanımlığa dikkat et:

| Almanca | Türkçe |
| ---------------- | -------------- |
| das Wohnzimmer | oturma odası |
| das Schlafzimmer | yatak odası |
| das Badezimmer | banyo |
| die Küche | mutfak |
| der Balkon | balkon |

**Örnek:** Ich koche **in der** Küche und schlafe **im** Schlafzimmer. (Mutfakta yemek yaparım ve yatak odasında uyurum.) Odaları datifteki iki yönlü edatlarla birleştir.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit9Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['das Schlafzimmer', 'das Badezimmer', 'der Balkon'], rights: ['balcony', 'bedroom', 'bathroom'] },
        correctAnswer: {
          pairs: [
            { left: 'das Schlafzimmer', right: 'bedroom' },
            { left: 'das Badezimmer', right: 'bathroom' },
            { left: 'der Balkon', right: 'balcony' },
          ],
        },
        explanation: 'Wohnungswörter und ihre Bedeutung.',
      },
      {
        lessonId: a1Unit9Lesson4.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich schlafe im ___. (bedroom)' },
        correctAnswer: { accepted: ['schlafzimmer'] },
        explanation: '"Schlafzimmer" ist das Zimmer zum Schlafen.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit9Lesson1.id, word: 'helfen', translationEn: 'to help', translationTr: 'yardım etmek', exampleSentence: 'Ich helfe dem Mann.' },
      { lessonId: a1Unit9Lesson1.id, word: 'danken', translationEn: 'to thank', translationTr: 'teşekkür etmek', exampleSentence: 'Ich danke dir.' },
      { lessonId: a1Unit9Lesson2.id, word: 'der Bus', translationEn: 'the bus', translationTr: 'otobüs', exampleSentence: 'Ich fahre mit dem Bus.' },
      { lessonId: a1Unit9Lesson2.id, word: 'fahren', translationEn: 'to drive / travel', translationTr: 'gitmek', exampleSentence: 'Ich fahre mit dem Bus.' },
      { lessonId: a1Unit9Lesson3.id, word: 'die Küche', translationEn: 'the kitchen', translationTr: 'mutfak', exampleSentence: 'Ich bin in der Küche.' },
      { lessonId: a1Unit9Lesson3.id, word: 'das Zimmer', translationEn: 'the room', translationTr: 'oda', exampleSentence: 'Das Zimmer ist groß.' },
      { lessonId: a1Unit9Lesson4.id, word: 'das Schlafzimmer', translationEn: 'the bedroom', translationTr: 'yatak odası', exampleSentence: 'Ich schlafe im Schlafzimmer.' },
      { lessonId: a1Unit9Lesson4.id, word: 'der Balkon', translationEn: 'the balcony', translationTr: 'balkon', exampleSentence: 'Wir sitzen auf dem Balkon.' },
    ],
  })

  // --- A1 Unit 10: Essen & Einkaufen (4 lessons) ---
  const a1Unit10 = await prisma.unit.create({
    data: { levelId: a1.id, order: 10, titleDe: 'Essen & Einkaufen', titleEn: 'Food & Shopping', titleTr: 'Yemek ve Alışveriş' },
  })

  const a1Unit10Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit10.id,
      order: 1,
      grammarTopic: 'Lebensmittel',
      explanationDe: `## Lebensmittel

Das sind wichtige Wörter zum Thema Essen. Achte auf den Artikel:

| Deutsch | Englisch |
| ---------- | ---------- |
| das Brot | bread |
| der Käse | cheese |
| die Milch | milk |
| das Obst | fruit |
| das Gemüse | vegetables |
| der Reis | rice |

**Beispiel:** Ich kaufe **Brot**, **Käse** und **Milch**.`,
      explanationEn: `## Food items

These are important words about food. Pay attention to the article:

| German | English |
| ---------- | ---------- |
| das Brot | bread |
| der Käse | cheese |
| die Milch | milk |
| das Obst | fruit |
| das Gemüse | vegetables |
| der Reis | rice |

**Example:** Ich kaufe **Brot**, **Käse** und **Milch**. (I buy bread, cheese and milk.)`,
      explanationTr: `## Gıda maddeleri

Bunlar yemekle ilgili önemli kelimelerdir. Tanımlığa dikkat et:

| Almanca | Türkçe |
| ---------- | ------ |
| das Brot | ekmek |
| der Käse | peynir |
| die Milch | süt |
| das Obst | meyve |
| das Gemüse | sebze |
| der Reis | pirinç |

**Örnek:** Ich kaufe **Brot**, **Käse** und **Milch**. (Ekmek, peynir ve süt alırım.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit10Lesson1.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['der Käse', 'die Milch', 'der Reis'], rights: ['rice', 'cheese', 'milk'] },
        correctAnswer: {
          pairs: [
            { left: 'der Käse', right: 'cheese' },
            { left: 'die Milch', right: 'milk' },
            { left: 'der Reis', right: 'rice' },
          ],
        },
        explanation: 'Lebensmittelwörter.',
      },
      {
        lessonId: a1Unit10Lesson1.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Wort bedeutet "fruit"?', options: ['das Gemüse', 'das Obst', 'das Brot', 'der Käse'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Obst" bedeutet "fruit".',
      },
    ],
  })

  const a1Unit10Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit10.id,
      order: 2,
      grammarTopic: '"Ich hätte gern" / Mengenangaben',
      explanationDe: `## „Ich hätte gern" und Mengenangaben

Beim Einkaufen bestellst du höflich mit **„Ich hätte gern …"**. Für Mengen benutzt du diese Wörter:

| Menge | Beispiel |
| -------- | -------- |
| ein Kilo | ein Kilo **Äpfel** |
| ein Liter | ein Liter **Milch** |
| ein Stück | ein Stück **Käse** |
| eine Flasche | eine Flasche **Wasser** |

**Beispiel:** Ich **hätte gern** ein Kilo Äpfel und einen Liter Milch, bitte.`,
      explanationEn: `## "Ich hätte gern" and quantities

When shopping you order politely with **"Ich hätte gern …"** (I'd like …). For amounts you use these words:

| Amount | Example |
| -------- | -------- |
| ein Kilo | ein Kilo **Äpfel** (a kilo of apples) |
| ein Liter | ein Liter **Milch** (a liter of milk) |
| ein Stück | ein Stück **Käse** (a piece of cheese) |
| eine Flasche | eine Flasche **Wasser** (a bottle of water) |

**Example:** Ich **hätte gern** ein Kilo Äpfel und einen Liter Milch, bitte. (I'd like a kilo of apples and a liter of milk, please.)`,
      explanationTr: `## „Ich hätte gern" ve miktar ifadeleri

Alışverişte kibarca **„Ich hätte gern …"** (… isterim) ile sipariş verirsin. Miktar için şu kelimeleri kullanırsın:

| Miktar | Örnek |
| -------- | ----- |
| ein Kilo | ein Kilo **Äpfel** (bir kilo elma) |
| ein Liter | ein Liter **Milch** (bir litre süt) |
| ein Stück | ein Stück **Käse** (bir parça peynir) |
| eine Flasche | eine Flasche **Wasser** (bir şişe su) |

**Örnek:** Ich **hätte gern** ein Kilo Äpfel und einen Liter Milch, bitte. (Bir kilo elma ve bir litre süt isterim, lütfen.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit10Lesson2.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich hätte gern ein Kilo ___. (apples)' },
        correctAnswer: { accepted: ['äpfel'] },
        explanation: '"Äpfel" ist der Plural von "Apfel".',
      },
      {
        lessonId: a1Unit10Lesson2.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'Wie bestellt man höflich?',
          options: ['Gib mir Käse!', 'Ich hätte gern ein Stück Käse.', 'Käse!', 'Ich habe Käse.'],
        },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Ich hätte gern..." ist höflich.',
      },
    ],
  })

  const a1Unit10Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit10.id,
      order: 3,
      grammarTopic: 'Im Restaurant',
      explanationDe: `## Im Restaurant

Ein typisches Gespräch im Restaurant läuft so ab:

| Wer | Satz |
| -------- | ---- |
| Kellner | Was möchten Sie? |
| Gast | Ich hätte gern die Suppe. |
| Kellner | Möchten Sie etwas trinken? |
| Gast | Ein Wasser, bitte. |
| Gast (am Ende) | Die Rechnung, bitte. |

**Beispiel:** „Ich **hätte gern** die Suppe und ein Wasser." – „**Die Rechnung, bitte.**"`,
      explanationEn: `## At the restaurant

A typical restaurant conversation goes like this:

| Who | Sentence |
| -------- | -------- |
| Waiter | Was möchten Sie? (What would you like?) |
| Guest | Ich hätte gern die Suppe. (I'd like the soup.) |
| Waiter | Möchten Sie etwas trinken? (Would you like something to drink?) |
| Guest | Ein Wasser, bitte. (A water, please.) |
| Guest (at the end) | Die Rechnung, bitte. (The bill, please.) |

**Example:** "Ich **hätte gern** die Suppe und ein Wasser." – "**Die Rechnung, bitte.**"`,
      explanationTr: `## Restoranda

Restoranda tipik bir konuşma şöyle geçer:

| Kim | Cümle |
| -------- | ----- |
| Garson | Was möchten Sie? (Ne istersiniz?) |
| Müşteri | Ich hätte gern die Suppe. (Çorba isterim.) |
| Garson | Möchten Sie etwas trinken? (İçecek bir şey ister misiniz?) |
| Müşteri | Ein Wasser, bitte. (Bir su, lütfen.) |
| Müşteri (sonda) | Die Rechnung, bitte. (Hesap, lütfen.) |

**Örnek:** „Ich **hätte gern** die Suppe und ein Wasser." – „**Die Rechnung, bitte.**"`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit10Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'Was sagt man am Ende im Restaurant?',
          options: ['Guten Appetit!', 'Die Rechnung, bitte.', 'Ich hätte gern...', 'Prost!'],
        },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Die Rechnung, bitte" bittet um die Rechnung.',
      },
      {
        lessonId: a1Unit10Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I would like the soup'?" },
        correctAnswer: { accepted: ['ich hätte gern die suppe'] },
        explanation: '"Ich hätte gern die Suppe" bedeutet "I would like the soup".',
      },
    ],
  })

  const a1Unit10Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit10.id,
      order: 4,
      grammarTopic: 'Übung (Essen & Einkaufen Wiederholung)',
      explanationDe: `## Übung: Essen & Einkaufen

In dieser Lektion wiederholst du das Einkaufen und Bestellen. Du kombinierst **Lebensmittel**, **Mengenangaben** und höfliche Formen wie „Ich hätte gern".

Ein kleiner Dialog:

- Ich **gehe einkaufen**. Ich **kaufe** Brot, Käse und Milch.
- Im Café: „Ich **hätte gern** einen Kaffee, bitte."
- „**Die Rechnung, bitte.**"

**Beispiel:** Ich **hätte gern** ein Kilo Äpfel und ein Stück Käse.`,
      explanationEn: `## Practice: food & shopping

In this lesson you review shopping and ordering. You combine **food words**, **quantities** and polite forms like "Ich hätte gern".

A short dialogue:

- Ich **gehe einkaufen**. Ich **kaufe** Brot, Käse und Milch. (I go shopping. I buy bread, cheese and milk.)
- At the café: "Ich **hätte gern** einen Kaffee, bitte." (I'd like a coffee, please.)
- "**Die Rechnung, bitte.**" (The bill, please.)

**Example:** Ich **hätte gern** ein Kilo Äpfel und ein Stück Käse.`,
      explanationTr: `## Alıştırma: yemek & alışveriş

Bu derste alışveriş ve sipariş vermeyi tekrar edersin. **Gıda kelimelerini**, **miktar ifadelerini** ve „Ich hätte gern" gibi kibar biçimleri birleştirirsin.

Kısa bir diyalog:

- Ich **gehe einkaufen**. Ich **kaufe** Brot, Käse und Milch. (Alışverişe giderim. Ekmek, peynir ve süt alırım.)
- Kafede: „Ich **hätte gern** einen Kaffee, bitte." (Bir kahve isterim, lütfen.)
- „**Die Rechnung, bitte.**" (Hesap, lütfen.)

**Örnek:** Ich **hätte gern** ein Kilo Äpfel und ein Stück Käse.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit10Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['Milch', 'ich', 'kaufe'] },
        correctAnswer: { order: ['ich', 'kaufe', 'Milch'] },
        explanation: 'Reihenfolge: Subjekt, Verb, Objekt.',
      },
      {
        lessonId: a1Unit10Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich gehe ___.', options: ['einkaufen', 'einkauft', 'kaufe ein', 'gekauft'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Einkaufen gehen" bedeutet "to go shopping".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit10Lesson1.id, word: 'der Käse', translationEn: 'cheese', translationTr: 'peynir', exampleSentence: 'Ich esse Käse.' },
      { lessonId: a1Unit10Lesson1.id, word: 'die Milch', translationEn: 'milk', translationTr: 'süt', exampleSentence: 'Ich trinke Milch.' },
      { lessonId: a1Unit10Lesson2.id, word: 'das Kilo', translationEn: 'the kilo', translationTr: 'kilo', exampleSentence: 'Ein Kilo Äpfel, bitte.' },
      { lessonId: a1Unit10Lesson2.id, word: 'das Stück', translationEn: 'the piece', translationTr: 'parça', exampleSentence: 'Ein Stück Käse, bitte.' },
      { lessonId: a1Unit10Lesson3.id, word: 'die Suppe', translationEn: 'the soup', translationTr: 'çorba', exampleSentence: 'Ich hätte gern die Suppe.' },
      { lessonId: a1Unit10Lesson3.id, word: 'die Rechnung', translationEn: 'the bill', translationTr: 'hesap', exampleSentence: 'Die Rechnung, bitte.' },
      { lessonId: a1Unit10Lesson4.id, word: 'der Kaffee', translationEn: 'coffee', translationTr: 'kahve', exampleSentence: 'Ich hätte gern einen Kaffee.' },
      { lessonId: a1Unit10Lesson4.id, word: 'teuer', translationEn: 'expensive', translationTr: 'pahalı', exampleSentence: 'Das ist teuer.' },
    ],
  })

  // --- A1 Unit 11: Perfekt (Einführung) (4 lessons) ---
  const a1Unit11 = await prisma.unit.create({
    data: { levelId: a1.id, order: 11, titleDe: 'Perfekt (Einführung)', titleEn: 'Perfekt (Introduction)', titleTr: 'Perfekt (Giriş)' },
  })

  const a1Unit11Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit11.id,
      order: 1,
      grammarTopic: 'Perfekt mit "haben"',
      explanationDe: `## Perfekt mit „haben"

Das Perfekt ist die wichtigste Vergangenheitsform beim Sprechen. Formel: **haben (konjugiert) + Partizip II** am Satzende. Die meisten Verben nehmen „haben".

| Person | Hilfsverb | Partizip II |
| --------- | --------- | ----------- |
| ich | habe | gegessen |
| du | hast | gearbeitet |
| er/sie/es | hat | gemacht |
| wir | haben | gespielt |

**Beispiel:** Ich **habe** Pizza **gegessen**. Du **hast** viel **gearbeitet**.`,
      explanationEn: `## Perfekt with "haben"

The Perfekt is the most important past tense in spoken German. Formula: **haben (conjugated) + past participle** at the end of the sentence. Most verbs take "haben".

| Person | Auxiliary | Past participle |
| --------- | --------- | --------------- |
| ich | habe | gegessen |
| du | hast | gearbeitet |
| er/sie/es | hat | gemacht |
| wir | haben | gespielt |

**Example:** Ich **habe** Pizza **gegessen**. (I ate pizza.) Du **hast** viel **gearbeitet**. (You worked a lot.)`,
      explanationTr: `## „haben" ile Perfekt

Perfekt, konuşmada en önemli geçmiş zaman biçimidir. Formül: **haben (çekimli) + Partizip II** cümlenin sonunda. Çoğu fiil „haben" alır.

| Kişi | Yardımcı fiil | Partizip II |
| --------- | ------------- | ----------- |
| ich | habe | gegessen |
| du | hast | gearbeitet |
| er/sie/es | hat | gemacht |
| wir | haben | gespielt |

**Örnek:** Ich **habe** Pizza **gegessen**. (Pizza yedim.) Du **hast** viel **gearbeitet**. (Çok çalıştın.)`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit11Lesson1.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich ___ Pizza gegessen. (haben)' },
        correctAnswer: { accepted: ['habe'] },
        explanation: 'Mit "ich" benutzt man "habe" im Perfekt.',
      },
      {
        lessonId: a1Unit11Lesson1.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Du ___ heute gearbeitet.', options: ['hast', 'habe', 'hat', 'haben'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "du" benutzt man "hast".',
      },
    ],
  })

  const a1Unit11Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit11.id,
      order: 2,
      grammarTopic: 'Perfekt mit "sein"',
      explanationDe: `## Perfekt mit „sein"

Verben der **Bewegung** (gehen, kommen, fahren) und der **Zustandsänderung** (aufstehen, einschlafen) bilden das Perfekt mit **„sein"**.

| Verb | Perfekt |
| ------ | ------- |
| gehen | ich **bin** gegangen |
| kommen | er **ist** gekommen |
| fahren | wir **sind** gefahren |
| bleiben | sie **ist** geblieben |

**Beispiel:** Ich **bin** nach Hause **gegangen**. Er **ist** spät **gekommen**. (Merke dir auch: „sein" und „bleiben" nehmen „sein".)`,
      explanationEn: `## Perfekt with "sein"

Verbs of **movement** (gehen, kommen, fahren) and **change of state** (aufstehen, einschlafen) form the Perfekt with **"sein"**.

| Verb | Perfekt |
| ------ | ------- |
| gehen | ich **bin** gegangen |
| kommen | er **ist** gekommen |
| fahren | wir **sind** gefahren |
| bleiben | sie **ist** geblieben |

**Example:** Ich **bin** nach Hause **gegangen**. (I went home.) Er **ist** spät **gekommen**. (He came late.) Note: "sein" and "bleiben" also take "sein".`,
      explanationTr: `## „sein" ile Perfekt

**Hareket** (gehen, kommen, fahren) ve **durum değişikliği** (aufstehen, einschlafen) bildiren fiiller Perfekt'i **„sein"** ile kurar.

| Fiil | Perfekt |
| ------ | ------- |
| gehen | ich **bin** gegangen |
| kommen | er **ist** gekommen |
| fahren | wir **sind** gefahren |
| bleiben | sie **ist** geblieben |

**Örnek:** Ich **bin** nach Hause **gegangen**. (Eve gittim.) Er **ist** spät **gekommen**. (Geç geldi.) Not: „sein" ve „bleiben" de „sein" alır.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit11Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ nach Hause gegangen.', options: ['habe', 'bin', 'hat', 'ist'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Gehen" bildet das Perfekt mit "sein".',
      },
      {
        lessonId: a1Unit11Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er ___ spät gekommen. (sein)' },
        correctAnswer: { accepted: ['ist'] },
        explanation: 'Mit "er" benutzt man "ist".',
      },
    ],
  })

  const a1Unit11Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit11.id,
      order: 3,
      grammarTopic: 'Partizip II (regelmäßig/unregelmäßig)',
      explanationDe: `## Partizip II (regelmäßig / unregelmäßig)

Das Partizip II ist der Kern des Perfekts. Es gibt zwei Muster:

| Typ | Muster | Beispiel |
| ------------- | ---------- | -------- |
| regelmäßig | ge-...-t | spielen → **gespielt** |
| unregelmäßig | ge-...-en | lesen → **gelesen** |
| unregelmäßig (Vokalwechsel) | ge-...-en | trinken → **getrunken** |

**Beispiel:** Ich habe Fußball **gespielt** und ein Buch **gelesen**. Unregelmäßige Formen lernst du am besten auswendig.`,
      explanationEn: `## Past participle (regular / irregular)

The past participle is the core of the Perfekt. There are two patterns:

| Type | Pattern | Example |
| ------------- | ---------- | -------- |
| regular | ge-...-t | spielen → **gespielt** |
| irregular | ge-...-en | lesen → **gelesen** |
| irregular (vowel change) | ge-...-en | trinken → **getrunken** |

**Example:** Ich habe Fußball **gespielt** und ein Buch **gelesen**. (I played football and read a book.) It's best to learn the irregular forms by heart.`,
      explanationTr: `## Partizip II (düzenli / düzensiz)

Partizip II, Perfekt'in çekirdeğidir. İki kalıbı vardır:

| Tür | Kalıp | Örnek |
| ------------- | -------- | ----- |
| düzenli | ge-...-t | spielen → **gespielt** |
| düzensiz | ge-...-en | lesen → **gelesen** |
| düzensiz (ünlü değişimi) | ge-...-en | trinken → **getrunken** |

**Örnek:** Ich habe Fußball **gespielt** und ein Buch **gelesen**. (Futbol oynadım ve bir kitap okudum.) Düzensiz biçimleri ezberlemen en iyisidir.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit11Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Partizip II von "spielen" ist ___.', options: ['gespielt', 'gespielen', 'spielt', 'gespielte'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Regelmäßig: ge-...-t → gespielt.',
      },
      {
        lessonId: a1Unit11Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er hat ein Glas Wasser ___. (trinken)' },
        correctAnswer: { accepted: ['getrunken'] },
        explanation: 'Unregelmäßig: trinken→getrunken.',
      },
    ],
  })

  const a1Unit11Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit11.id,
      order: 4,
      grammarTopic: 'Übung (Perfekt Wiederholung)',
      explanationDe: `## Übung: Perfekt Wiederholung

Hier wiederholst du das Perfekt. Denk an die Frage: **„haben" oder „sein"?** Bewegung/Zustandsänderung → „sein", sonst meist „haben".

Steht eine Zeitangabe (z. B. „gestern") am Anfang, folgt direkt das Hilfsverb:

- **Gestern bin** ich ins Kino **gegangen**.
- Ich **habe** einen Film **gesehen**.
- Wir **haben** Pizza **gegessen** und **sind** spät nach Hause **gekommen**.

**Beispiel:** Am Wochenende **habe** ich viel **gemacht**: Ich **bin** spazieren **gegangen** und **habe** Freunde **getroffen**.`,
      explanationEn: `## Practice: Perfekt review

Here you review the Perfekt. Remember the question: **"haben" or "sein"?** Movement/change of state → "sein", otherwise usually "haben".

If a time expression (e.g. "gestern" = yesterday) is at the start, the auxiliary verb comes right after:

- **Gestern bin** ich ins Kino **gegangen**. (Yesterday I went to the cinema.)
- Ich **habe** einen Film **gesehen**. (I watched a movie.)
- Wir **haben** Pizza **gegessen** und **sind** spät nach Hause **gekommen**. (We ate pizza and came home late.)

**Example:** Am Wochenende **habe** ich viel **gemacht**: Ich **bin** spazieren **gegangen** und **habe** Freunde **getroffen**.`,
      explanationTr: `## Alıştırma: Perfekt tekrarı

Burada Perfekt'i tekrar edersin. Soruyu hatırla: **„haben" mi „sein" mi?** Hareket/durum değişikliği → „sein", diğer durumlarda çoğunlukla „haben".

Bir zaman ifadesi (örn. „gestern" = dün) başta olduğunda, yardımcı fiil hemen ardından gelir:

- **Gestern bin** ich ins Kino **gegangen**. (Dün sinemaya gittim.)
- Ich **habe** einen Film **gesehen**. (Bir film izledim.)
- Wir **haben** Pizza **gegessen** und **sind** spät nach Hause **gekommen**. (Pizza yedik ve eve geç geldik.)

**Örnek:** Am Wochenende **habe** ich viel **gemacht**: Ich **bin** spazieren **gegangen** und **habe** Freunde **getroffen**.`,
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit11Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['gegangen', 'ich', 'bin', 'gestern'] },
        correctAnswer: { order: ['gestern', 'bin', 'ich', 'gegangen'] },
        explanation: 'Zeitangabe kann am Satzanfang stehen, dann folgt das Verb.',
      },
      {
        lessonId: a1Unit11Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich habe einen Film ___.', options: ['gesehen', 'sehen', 'sieht', 'gesehene'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Partizip II von "sehen" ist "gesehen".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit11Lesson1.id, word: 'schmecken', translationEn: 'to taste', translationTr: 'tatmak', exampleSentence: 'Die Suppe hat gut geschmeckt.' },
      { lessonId: a1Unit11Lesson1.id, word: 'kochen', translationEn: 'to cook', translationTr: 'pişirmek', exampleSentence: 'Ich habe Suppe gekocht.' },
      { lessonId: a1Unit11Lesson2.id, word: 'kommen', translationEn: 'to come', translationTr: 'gelmek', exampleSentence: 'Er ist gekommen.' },
      { lessonId: a1Unit11Lesson2.id, word: 'nach Hause', translationEn: 'home / homeward', translationTr: 'eve', exampleSentence: 'Ich bin nach Hause gegangen.' },
      { lessonId: a1Unit11Lesson3.id, word: 'trinken', translationEn: 'to drink', translationTr: 'içmek', exampleSentence: 'Er hat Wasser getrunken.' },
      { lessonId: a1Unit11Lesson3.id, word: 'das Glas', translationEn: 'the glass', translationTr: 'bardak', exampleSentence: 'Ein Glas Wasser, bitte.' },
      { lessonId: a1Unit11Lesson4.id, word: 'gestern', translationEn: 'yesterday', translationTr: 'dün', exampleSentence: 'Gestern bin ich ins Kino gegangen.' },
      { lessonId: a1Unit11Lesson4.id, word: 'der Film', translationEn: 'the movie', translationTr: 'film', exampleSentence: 'Ich habe einen Film gesehen.' },
    ],
  })

  // --- A1 Unit 12: Imperativ & Wegbeschreibung (4 lessons) ---
  const a1Unit12 = await prisma.unit.create({
    data: { levelId: a1.id, order: 12, titleDe: 'Imperativ & Wegbeschreibung', titleEn: 'Imperative & Giving Directions', titleTr: 'Emir Kipi ve Yol Tarifi' },
  })

  const a1Unit12Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit12.id,
      order: 1,
      grammarTopic: 'Imperativ (du)',
      explanationDe:
        'Der Imperativ für "du" benutzt den Verbstamm, oft ohne -st: "Komm!" "Geh!" "Iss!" (von "essen", mit Vokalwechsel).',
      explanationEn:
        'The imperative for "du" uses the verb stem, usually without -st: "Komm!" (Come!) "Geh!" (Go!) "Iss!" (Eat! — from "essen", with a vowel change).',
      explanationTr:
        '"du" için emir kipi fiil gövdesini kullanır, genellikle -st olmadan: "Komm!" (Gel!) "Geh!" (Git!) "Iss!" (Ye! — "essen"den, ünlü değişimiyle).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit12Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wie sagt man "Come!" zu einem Freund?', options: ['Kommst!', 'Komm!', 'Kommen!', 'Kommt!'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Imperativ "du": Komm!',
      },
      {
        lessonId: a1Unit12Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___! (Eat! - zu einem Freund)' },
        correctAnswer: { accepted: ['iss'] },
        explanation: 'Imperativ von "essen" mit Vokalwechsel: Iss!',
      },
    ],
  })

  const a1Unit12Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit12.id,
      order: 2,
      grammarTopic: 'Imperativ (ihr/Sie)',
      explanationDe:
        'Für "ihr" benutzt man die Verbform ohne Pronomen: "Kommt!" Für die höfliche Form "Sie" benutzt man Verb + Sie: "Kommen Sie!"',
      explanationEn:
        'For "ihr" (plural you), use the verb form without the pronoun: "Kommt!" For the polite "Sie" form, use verb + Sie: "Kommen Sie!"',
      explanationTr:
        '"ihr" için fiil zamirsiz kullanılır: "Kommt!" Kibar "Sie" formu için fiil + Sie kullanılır: "Kommen Sie!"',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit12Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Höfliche Form: "___ Sie bitte Platz!" (nehmen)', options: ['Nehmen', 'Nimm', 'Nehmt', 'Nehme'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Höflicher Imperativ: Verb + Sie.',
      },
      {
        lessonId: a1Unit12Lesson2.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['du', 'ihr', 'Sie'], rights: ['Kommen Sie!', 'Komm!', 'Kommt!'] },
        correctAnswer: {
          pairs: [
            { left: 'du', right: 'Komm!' },
            { left: 'ihr', right: 'Kommt!' },
            { left: 'Sie', right: 'Kommen Sie!' },
          ],
        },
        explanation: 'Imperativformen je nach Person.',
      },
    ],
  })

  const a1Unit12Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit12.id,
      order: 3,
      grammarTopic: 'Wegbeschreibung',
      explanationDe:
        'Wegbeschreibungen benutzen Imperativ und Richtungswörter: "Gehen Sie geradeaus. Biegen Sie links ab." "links" (left), "rechts" (right), "geradeaus" (straight ahead).',
      explanationEn:
        'Directions use the imperative and direction words: "Gehen Sie geradeaus." (Go straight ahead.) "Biegen Sie links ab." (Turn left.) "links" (left), "rechts" (right), "geradeaus" (straight ahead).',
      explanationTr:
        'Yol tarifi emir kipi ve yön kelimeleriyle yapılır: "Gehen Sie geradeaus." (Düz gidin.) "Biegen Sie links ab." (Sola dönün.) "links" (sol), "rechts" (sağ), "geradeaus" (düz).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit12Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Wort bedeutet "straight ahead"?', options: ['links', 'rechts', 'geradeaus', 'zurück'] },
        correctAnswer: { correctIndex: 2 },
        explanation: '"Geradeaus" bedeutet "straight ahead".',
      },
      {
        lessonId: a1Unit12Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Biegen Sie ___ ab. (left)' },
        correctAnswer: { accepted: ['links'] },
        explanation: '"Links" bedeutet "left".',
      },
    ],
  })

  const a1Unit12Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit12.id,
      order: 4,
      grammarTopic: 'Übung (Imperativ & Wegbeschreibung Wiederholung)',
      explanationDe:
        'Wiederholung: "Entschuldigung, wo ist der Bahnhof?" "Gehen Sie geradeaus und biegen Sie dann rechts ab."',
      explanationEn:
        'Review: "Entschuldigung, wo ist der Bahnhof?" (Excuse me, where is the train station?) "Gehen Sie geradeaus und biegen Sie dann rechts ab." (Go straight ahead and then turn right.)',
      explanationTr:
        'Tekrar: "Entschuldigung, wo ist der Bahnhof?" (Affedersiniz, tren istasyonu nerede?) "Gehen Sie geradeaus und biegen Sie dann rechts ab." (Düz gidin ve sonra sağa dönün.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit12Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['Sie', 'geradeaus', 'gehen'] },
        correctAnswer: { order: ['gehen', 'Sie', 'geradeaus'] },
        explanation: 'Imperativ Sie: Verb zuerst, dann Sie, dann Ortsangabe.',
      },
      {
        lessonId: a1Unit12Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'Excuse me, where is the train station?'?" },
        correctAnswer: { accepted: ['entschuldigung, wo ist der bahnhof', 'entschuldigung wo ist der bahnhof'] },
        explanation: '"Entschuldigung, wo ist der Bahnhof?" bedeutet "Excuse me, where is the train station?"',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit12Lesson1.id, word: 'warten', translationEn: 'to wait', translationTr: 'beklemek', exampleSentence: 'Warte hier!' },
      { lessonId: a1Unit12Lesson1.id, word: 'schauen', translationEn: 'to look', translationTr: 'bakmak', exampleSentence: 'Schau mal!' },
      { lessonId: a1Unit12Lesson2.id, word: 'nehmen', translationEn: 'to take', translationTr: 'almak', exampleSentence: 'Nehmen Sie bitte Platz!' },
      { lessonId: a1Unit12Lesson2.id, word: 'der Platz', translationEn: 'the seat / place', translationTr: 'yer', exampleSentence: 'Nehmen Sie Platz.' },
      { lessonId: a1Unit12Lesson3.id, word: 'links', translationEn: 'left', translationTr: 'sol', exampleSentence: 'Biegen Sie links ab.' },
      { lessonId: a1Unit12Lesson3.id, word: 'rechts', translationEn: 'right', translationTr: 'sağ', exampleSentence: 'Biegen Sie rechts ab.' },
      { lessonId: a1Unit12Lesson4.id, word: 'der Bahnhof', translationEn: 'the train station', translationTr: 'tren istasyonu', exampleSentence: 'Wo ist der Bahnhof?' },
      { lessonId: a1Unit12Lesson4.id, word: 'Entschuldigung', translationEn: 'excuse me', translationTr: 'affedersiniz', exampleSentence: 'Entschuldigung, wo ist der Bahnhof?' },
    ],
  })

  // --- A1 Unit 13: Adjektive & Vergleiche (4 lessons) ---
  const a1Unit13 = await prisma.unit.create({
    data: { levelId: a1.id, order: 13, titleDe: 'Adjektive & Vergleiche', titleEn: 'Adjectives & Comparisons', titleTr: 'Sıfatlar ve Karşılaştırmalar' },
  })

  const a1Unit13Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a1Unit13.id,
      order: 1,
      grammarTopic: 'Adjektivendungen nach bestimmtem Artikel',
      explanationDe:
        'Nach dem bestimmten Artikel (der/die/das) endet das Adjektiv im Nominativ meist auf -e: "der große Mann", "die kleine Frau", "das neue Auto".',
      explanationEn:
        'After the definite article (der/die/das), the adjective usually ends in -e in the nominative: "der große Mann" (the tall man), "die kleine Frau" (the small woman), "das neue Auto" (the new car).',
      explanationTr:
        'Belirli artikelden (der/die/das) sonra sıfat yalın halde genellikle -e ile biter: "der große Mann" (uzun adam), "die kleine Frau" (küçük kadın), "das neue Auto" (yeni araba).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit13Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der ___ Mann ist mein Vater. (groß)', options: ['große', 'großer', 'großes', 'großen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Nominativ maskulin nach "der": Adjektiv + -e.',
      },
      {
        lessonId: a1Unit13Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das ___ Auto ist teuer. (neu)' },
        correctAnswer: { accepted: ['neue'] },
        explanation: 'Nominativ neutrum nach "das": Adjektiv + -e.',
      },
    ],
  })

  const a1Unit13Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a1Unit13.id,
      order: 2,
      grammarTopic: 'Adjektivendungen nach unbestimmtem Artikel',
      explanationDe:
        'Nach dem unbestimmten Artikel (ein/eine) richtet sich die Endung nach dem Genus: "ein großer Mann", "eine kleine Frau", "ein neues Auto".',
      explanationEn:
        'After the indefinite article (ein/eine), the ending depends on gender: "ein großer Mann" (a tall man), "eine kleine Frau" (a small woman), "ein neues Auto" (a new car).',
      explanationTr:
        'Belirsiz artikelden (ein/eine) sonra sıfat eki cinsiyete göre değişir: "ein großer Mann" (uzun bir adam), "eine kleine Frau" (küçük bir kadın), "ein neues Auto" (yeni bir araba).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit13Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das ist ein ___ Auto. (neu)', options: ['neue', 'neuer', 'neues', 'neuen'] },
        correctAnswer: { correctIndex: 2 },
        explanation: 'Nominativ neutrum nach "ein": Adjektiv + -es.',
      },
      {
        lessonId: a1Unit13Lesson2.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['ein ___ Mann', 'eine ___ Frau', 'ein ___ Auto'], rights: ['großer', 'kleine', 'neues'] },
        correctAnswer: {
          pairs: [
            { left: 'ein ___ Mann', right: 'großer' },
            { left: 'eine ___ Frau', right: 'kleine' },
            { left: 'ein ___ Auto', right: 'neues' },
          ],
        },
        explanation: 'Adjektivendungen nach "ein/eine" je nach Genus.',
      },
    ],
  })

  const a1Unit13Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a1Unit13.id,
      order: 3,
      grammarTopic: 'Komparativ',
      explanationDe:
        'Der Komparativ wird meist mit -er gebildet: "schnell" -> "schneller". Unregelmäßig: "gut" -> "besser", "gern" -> "lieber", "viel" -> "mehr".',
      explanationEn:
        'The comparative is usually formed with -er: "schnell" (fast) -> "schneller" (faster). Irregular: "gut" (good) -> "besser" (better), "gern" (gladly) -> "lieber" (rather), "viel" (much) -> "mehr" (more).',
      explanationTr:
        'Karşılaştırma genelde -er ile yapılır: "schnell" (hızlı) -> "schneller" (daha hızlı). Düzensiz: "gut" (iyi) -> "besser" (daha iyi), "gern" (seve seve) -> "lieber" (tercihen), "viel" (çok) -> "mehr" (daha çok).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit13Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Komparativ von "gut"?', options: ['guter', 'gutter', 'besser', 'mehr'] },
        correctAnswer: { correctIndex: 2 },
        explanation: '"gut" ist unregelmäßig: besser.',
      },
      {
        lessonId: a1Unit13Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Mein Auto ist ___ als deins. (schnell)' },
        correctAnswer: { accepted: ['schneller'] },
        explanation: 'Komparativ: schnell + -er.',
      },
    ],
  })

  const a1Unit13Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a1Unit13.id,
      order: 4,
      grammarTopic: 'Superlativ',
      explanationDe:
        'Der Superlativ wird mit "am -sten" gebildet: "am schnellsten". Unregelmäßig: "gut" -> "am besten", "gern" -> "am liebsten".',
      explanationEn:
        'The superlative is formed with "am -sten": "am schnellsten" (the fastest). Irregular: "gut" -> "am besten" (best), "gern" -> "am liebsten" (most preferred).',
      explanationTr:
        'Üstünlük derecesi "am -sten" ile yapılır: "am schnellsten" (en hızlı). Düzensiz: "gut" -> "am besten" (en iyi), "gern" -> "am liebsten" (en çok tercih edilen).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a1Unit13Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['ist', 'am', 'schnellsten', 'er'] },
        correctAnswer: { order: ['er', 'ist', 'am', 'schnellsten'] },
        explanation: 'Superlativ: Subjekt + Verb + am + Adjektiv-sten.',
      },
      {
        lessonId: a1Unit13Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'the best' (superlative of 'good', with 'am')?" },
        correctAnswer: { accepted: ['am besten'] },
        explanation: '"am besten" ist der Superlativ von "gut".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a1Unit13Lesson1.id, word: 'groß', translationEn: 'big / tall', translationTr: 'büyük', exampleSentence: 'Der große Mann ist mein Vater.' },
      { lessonId: a1Unit13Lesson1.id, word: 'klein', translationEn: 'small', translationTr: 'küçük', exampleSentence: 'Die kleine Frau ist meine Mutter.' },
      { lessonId: a1Unit13Lesson2.id, word: 'neu', translationEn: 'new', translationTr: 'yeni', exampleSentence: 'Ein neues Auto ist teuer.' },
      { lessonId: a1Unit13Lesson2.id, word: 'alt', translationEn: 'old', translationTr: 'eski', exampleSentence: 'Ein altes Auto ist billig.' },
      { lessonId: a1Unit13Lesson3.id, word: 'schnell', translationEn: 'fast', translationTr: 'hızlı', exampleSentence: 'Mein Auto ist schneller als deins.' },
      { lessonId: a1Unit13Lesson3.id, word: 'langsam', translationEn: 'slow', translationTr: 'yavaş', exampleSentence: 'Die Schnecke ist langsam.' },
      { lessonId: a1Unit13Lesson4.id, word: 'besser', translationEn: 'better', translationTr: 'daha iyi', exampleSentence: 'Das ist besser als das.' },
      { lessonId: a1Unit13Lesson4.id, word: 'am besten', translationEn: 'best', translationTr: 'en iyi', exampleSentence: 'Das schmeckt am besten.' },
    ],
  })

  // --- A2: Vergangenheit (1 sample lesson) ---
  const a2Unit = await prisma.unit.create({
    data: { levelId: a2.id, order: 1, titleDe: 'Vergangenheit', titleEn: 'Past Tense', titleTr: 'Geçmiş Zaman' },
  })
  const a2Lesson = await prisma.lesson.create({
    data: {
      unitId: a2Unit.id,
      order: 1,
      grammarTopic: "Perfekt mit 'haben'",
      explanationDe: 'Die meisten Verben bilden das Perfekt mit "haben" + Partizip II, z. B. "Ich habe gegessen."',
      explanationEn: 'Most verbs form the Perfekt (past tense) with "haben" + past participle, e.g. "Ich habe gegessen" (I have eaten).',
      explanationTr: 'Çoğu fiil Perfekt (geçmiş zaman) yapısını "haben" + Partizip II ile kurar, örn. "Ich habe gegessen" (Yedim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ gestern Pizza gegessen.', options: ['bin', 'habe', 'hat', 'haben'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Mit "ich" benutzt man "habe" im Perfekt.',
      },
      {
        lessonId: a2Lesson.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er hat ein Buch ___ (lesen).' },
        correctAnswer: { accepted: ['gelesen'] },
        explanation: 'Das Partizip II von "lesen" ist "gelesen".',
      },
    ],
  })

  const a2Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit.id,
      order: 2,
      grammarTopic: "Perfekt mit 'sein'",
      explanationDe:
        'Bewegungsverben und Verben, die eine Zustandsveränderung ausdrücken, bilden das Perfekt mit "sein" statt "haben", z. B. "Ich bin nach Berlin gefahren." "Er ist zu Hause geblieben."',
      explanationEn:
        'Verbs of motion and verbs expressing a change of state form the Perfekt with "sein" instead of "haben", e.g. "Ich bin nach Berlin gefahren" (I went to Berlin). "Er ist zu Hause geblieben" (He stayed home).',
      explanationTr:
        'Hareket bildiren fiiller ve durum değişikliği ifade eden fiiller Perfekt zamanını "haben" yerine "sein" ile kurar, örn. "Ich bin nach Berlin gefahren" (Berlin\'e gittim). "Er ist zu Hause geblieben" (Evde kaldı).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ nach Berlin gefahren.', options: ['bin', 'habe', 'hat', 'haben'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Fahren" ist ein Bewegungsverb, deshalb benutzt man "sein" im Perfekt.',
      },
      {
        lessonId: a2Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er ist zu Hause ___ (bleiben).' },
        correctAnswer: { accepted: ['geblieben'] },
        explanation: 'Das Partizip II von "bleiben" ist "geblieben", gebildet mit "sein".',
      },
    ],
  })

  const a2Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit.id,
      order: 3,
      grammarTopic: 'Zeitangaben der Vergangenheit',
      explanationDe:
        'Wichtige Zeitausdrücke für die Vergangenheit: gestern, letzte Woche, vor zwei Tagen, letztes Jahr. Beispiel: "Vor zwei Tagen habe ich meine Oma besucht."',
      explanationEn:
        'Important time expressions for the past: gestern (yesterday), letzte Woche (last week), vor zwei Tagen (two days ago), letztes Jahr (last year). Example: "Vor zwei Tagen habe ich meine Oma besucht" (Two days ago I visited my grandma).',
      explanationTr:
        'Geçmiş zaman için önemli zaman ifadeleri: gestern (dün), letzte Woche (geçen hafta), vor zwei Tagen (iki gün önce), letztes Jahr (geçen yıl). Örnek: "Vor zwei Tagen habe ich meine Oma besucht" (İki gün önce büyükannemi ziyaret ettim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: '___ habe ich meine Oma besucht. (two days ago)',
          options: ['Vor zwei Tagen', 'Letzte Woche', 'Nächstes Jahr', 'Morgen'],
        },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Vor zwei Tagen" bedeutet "two days ago".',
      },
      {
        lessonId: a2Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ Woche war ich krank.' },
        correctAnswer: { accepted: ['letzte'] },
        explanation: '"Letzte Woche" bedeutet "last week".',
      },
    ],
  })

  const a2Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit.id,
      order: 4,
      grammarTopic: 'Wiederholung: Alltag erzählen',
      explanationDe:
        'Kombiniere Perfekt mit "haben" und "sein", um deinen Alltag zu erzählen: "Ich bin aufgestanden, habe gefrühstückt und bin zur Arbeit gefahren."',
      explanationEn:
        'Combine Perfekt with "haben" and "sein" to narrate your day: "Ich bin aufgestanden, habe gefrühstückt und bin zur Arbeit gefahren" (I got up, had breakfast, and drove to work).',
      explanationTr:
        'Gününü anlatmak için "haben" ve "sein" ile kurulan Perfekt yapılarını birleştir: "Ich bin aufgestanden, habe gefrühstückt und bin zur Arbeit gefahren" (Kalktım, kahvaltı yaptım ve işe gittim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['gefrühstückt', 'ich', 'habe'] },
        correctAnswer: { order: ['ich', 'habe', 'gefrühstückt'] },
        explanation: 'Position 2 ist das konjugierte Verb ("habe"), das Partizip II steht am Ende.',
      },
      {
        lessonId: a2Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I went to work' (mit 'fahren', im Perfekt)?" },
        correctAnswer: { accepted: ['ich bin zur arbeit gefahren'] },
        explanation: '"Ich bin zur Arbeit gefahren" bedeutet "I went to work" - "fahren" braucht "sein".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Lesson2.id, word: 'bleiben', translationEn: 'to stay', translationTr: 'kalmak', exampleSentence: 'Er ist zu Hause geblieben.' },
      { lessonId: a2Lesson2.id, word: 'aufwachen', translationEn: 'to wake up', translationTr: 'uyanmak', exampleSentence: 'Ich bin früh aufgewacht.' },
      { lessonId: a2Lesson3.id, word: 'letzte Woche', translationEn: 'last week', translationTr: 'geçen hafta', exampleSentence: 'Letzte Woche war ich krank.' },
      { lessonId: a2Lesson3.id, word: 'besuchen', translationEn: 'to visit', translationTr: 'ziyaret etmek', exampleSentence: 'Vor zwei Tagen habe ich meine Oma besucht.' },
      { lessonId: a2Lesson4.id, word: 'die Arbeit', translationEn: 'work / job', translationTr: 'iş', exampleSentence: 'Ich bin zur Arbeit gefahren.' },
      { lessonId: a2Lesson4.id, word: 'frühstücken', translationEn: 'to have breakfast', translationTr: 'kahvaltı yapmak', exampleSentence: 'Ich habe gefrühstückt.' },
    ],
  })

  // --- A2 Unit 2: Perfekt Vertiefung (4 lessons) ---
  const a2Unit2 = await prisma.unit.create({
    data: { levelId: a2.id, order: 2, titleDe: 'Perfekt Vertiefung', titleEn: 'Perfekt in Depth', titleTr: 'Perfekt Zamanı Derinlemesine' },
  })

  const a2Unit2Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit2.id,
      order: 1,
      grammarTopic: 'haben oder sein? (Regel)',
      explanationDe:
        'Die meisten Verben bilden das Perfekt mit "haben". Nur Verben der Bewegung (gehen, fahren) oder Zustandsänderung (aufwachen, sterben) sowie "sein" und "bleiben" selbst benutzen "sein". Beispiel: "Ich habe gearbeitet." aber "Ich bin gelaufen."',
      explanationEn:
        'Most verbs form the Perfekt with "haben". Only verbs of motion (gehen, fahren) or change of state (aufwachen, sterben), plus "sein" and "bleiben" themselves, use "sein". Example: "Ich habe gearbeitet" (I worked) but "Ich bin gelaufen" (I ran).',
      explanationTr:
        'Çoğu fiil Perfekt zamanını "haben" ile kurar. Sadece hareket fiilleri (gehen, fahren) veya durum değişikliği fiilleri (aufwachen, sterben) ile "sein" ve "bleiben" fiillerinin kendisi "sein" kullanır. Örnek: "Ich habe gearbeitet" (Çalıştım) ama "Ich bin gelaufen" (Koştum).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit2Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ gelaufen.', options: ['habe', 'bin', 'hat', 'ist'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Laufen" ist ein Bewegungsverb, deshalb benutzt man "sein".',
      },
      {
        lessonId: a2Unit2Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich ___ heute viel gearbeitet.' },
        correctAnswer: { accepted: ['habe'] },
        explanation: '"Arbeiten" ist kein Bewegungsverb, deshalb benutzt man "haben".',
      },
    ],
  })

  const a2Unit2Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit2.id,
      order: 2,
      grammarTopic: 'Partizip II unregelmäßiger Verben',
      explanationDe:
        'Viele unregelmäßige Verben ändern den Stammvokal im Partizip II: schreiben → geschrieben, nehmen → genommen, finden → gefunden. Diese Formen muss man auswendig lernen.',
      explanationEn:
        'Many irregular verbs change their stem vowel in the past participle: schreiben → geschrieben (written), nehmen → genommen (taken), finden → gefunden (found). These forms have to be memorized.',
      explanationTr:
        'Birçok düzensiz fiil Partizip II biçiminde kök ünlüsünü değiştirir: schreiben → geschrieben (yazılmış), nehmen → genommen (alınmış), finden → gefunden (bulunmuş). Bu biçimler ezbere öğrenilmelidir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit2Lesson2.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['schreiben', 'nehmen', 'finden'], rights: ['gefunden', 'geschrieben', 'genommen'] },
        correctAnswer: {
          pairs: [
            { left: 'schreiben', right: 'geschrieben' },
            { left: 'nehmen', right: 'genommen' },
            { left: 'finden', right: 'gefunden' },
          ],
        },
        explanation: 'Partizip II: schreiben→geschrieben, nehmen→genommen, finden→gefunden.',
      },
      {
        lessonId: a2Unit2Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich habe einen Brief ___ (schreiben).' },
        correctAnswer: { accepted: ['geschrieben'] },
        explanation: 'Das Partizip II von "schreiben" ist "geschrieben".',
      },
    ],
  })

  const a2Unit2Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit2.id,
      order: 3,
      grammarTopic: 'Trennbare Verben im Perfekt',
      explanationDe:
        'Bei trennbaren Verben steht "ge" zwischen Präfix und Stamm: aufstehen → aufgestanden, anrufen → angerufen, mitbringen → mitgebracht. Beispiel: "Ich bin um sieben Uhr aufgestanden."',
      explanationEn:
        'With separable-prefix verbs, "ge" is inserted between the prefix and the stem: aufstehen → aufgestanden (got up), anrufen → angerufen (called), mitbringen → mitgebracht (brought along). Example: "Ich bin um sieben Uhr aufgestanden" (I got up at seven o\'clock).',
      explanationTr:
        'Ayrılabilen fiillerde "ge" öneki ile gövde arasına girer: aufstehen → aufgestanden (kalktı), anrufen → angerufen (aradı), mitbringen → mitgebracht (yanında getirdi). Örnek: "Ich bin um sieben Uhr aufgestanden" (Saat yedide kalktım).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit2Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich bin um sieben Uhr ___.', options: ['aufgestanden', 'aufstehen', 'stehe auf', 'aufgestehen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Das Partizip II von "aufstehen" ist "aufgestanden".',
      },
      {
        lessonId: a2Unit2Lesson3.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['angerufen', 'ich', 'habe', 'dich'] },
        correctAnswer: { order: ['ich', 'habe', 'dich', 'angerufen'] },
        explanation: 'Position 2 ist das Verb ("habe"), das Partizip II ("angerufen") steht am Satzende.',
      },
    ],
  })

  const a2Unit2Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit2.id,
      order: 4,
      grammarTopic: "Nicht-trennbare & '-ieren'-Verben im Perfekt",
      explanationDe:
        'Verben mit den Präfixen be-, ge-, er-, ver-, zer-, ent-, emp- sowie Verben auf "-ieren" bilden das Partizip II OHNE "ge-": besuchen → besucht, studieren → studiert.',
      explanationEn:
        'Verbs with the prefixes be-, ge-, er-, ver-, zer-, ent-, emp- and verbs ending in "-ieren" form the past participle WITHOUT "ge-": besuchen → besucht (visited), studieren → studiert (studied).',
      explanationTr:
        'be-, ge-, er-, ver-, zer-, ent-, emp- önekli fiiller ve "-ieren" ile biten fiiller Partizip II\'yi "ge-" OLMADAN kurar: besuchen → besucht (ziyaret edildi), studieren → studiert (okundu).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit2Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich habe Medizin ___.', options: ['studiert', 'gestudiert', 'studieren', 'studierte'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"-ieren"-Verben bilden das Partizip II ohne "ge-": studiert.',
      },
      {
        lessonId: a2Unit2Lesson4.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er hat seine Oma ___ (besuchen).' },
        correctAnswer: { accepted: ['besucht'] },
        explanation: 'Das Partizip II von "besuchen" ist "besucht" (kein "ge-").',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit2Lesson1.id, word: 'laufen', translationEn: 'to run / to walk', translationTr: 'koşmak / yürümek', exampleSentence: 'Ich bin gelaufen.' },
      { lessonId: a2Unit2Lesson1.id, word: 'die Regel', translationEn: 'the rule', translationTr: 'kural', exampleSentence: 'Das ist eine wichtige Regel.' },
      { lessonId: a2Unit2Lesson2.id, word: 'schreiben', translationEn: 'to write', translationTr: 'yazmak', exampleSentence: 'Ich habe einen Brief geschrieben.' },
      { lessonId: a2Unit2Lesson2.id, word: 'finden', translationEn: 'to find', translationTr: 'bulmak', exampleSentence: 'Ich habe meinen Schlüssel gefunden.' },
      { lessonId: a2Unit2Lesson3.id, word: 'mitbringen', translationEn: 'to bring along', translationTr: 'yanında getirmek', exampleSentence: 'Ich habe einen Kuchen mitgebracht.' },
      { lessonId: a2Unit2Lesson3.id, word: 'ausgehen', translationEn: 'to go out', translationTr: 'dışarı çıkmak', exampleSentence: 'Wir sind gestern ausgegangen.' },
      { lessonId: a2Unit2Lesson4.id, word: 'studieren', translationEn: 'to study (at university)', translationTr: 'üniversitede okumak', exampleSentence: 'Ich habe Medizin studiert.' },
      { lessonId: a2Unit2Lesson4.id, word: 'erklären', translationEn: 'to explain', translationTr: 'açıklamak', exampleSentence: 'Der Lehrer hat die Regel erklärt.' },
    ],
  })

  // --- A2 Unit 3: Komparativ & Superlativ (4 lessons) ---
  const a2Unit3 = await prisma.unit.create({
    data: { levelId: a2.id, order: 3, titleDe: 'Komparativ & Superlativ', titleEn: 'Comparative & Superlative', titleTr: 'Karşılaştırma ve Üstünlük Derecesi' },
  })

  const a2Unit3Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit3.id,
      order: 1,
      grammarTopic: 'Komparativ (regelmäßig)',
      explanationDe:
        'Der Komparativ wird mit "-er" gebildet und vergleicht mit "als": schnell → schneller, klein → kleiner. Beispiel: "Der Zug ist schneller als das Auto."',
      explanationEn:
        'The comparative is formed with "-er" and compares using "als" (than): schnell → schneller (faster), klein → kleiner (smaller). Example: "Der Zug ist schneller als das Auto" (The train is faster than the car).',
      explanationTr:
        'Karşılaştırma sıfatı "-er" eki ile kurulur ve "als" (-den) ile karşılaştırılır: schnell → schneller (daha hızlı), klein → kleiner (daha küçük). Örnek: "Der Zug ist schneller als das Auto" (Tren arabadan daha hızlıdır).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit3Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der Zug ist ___ als das Auto. (schnell)', options: ['schnell', 'schneller', 'am schnellsten', 'schnellst'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Der Komparativ von "schnell" ist "schneller".',
      },
      {
        lessonId: a2Unit3Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Mein Haus ist ___ als deins. (klein)' },
        correctAnswer: { accepted: ['kleiner'] },
        explanation: 'Der Komparativ von "klein" ist "kleiner".',
      },
    ],
  })

  const a2Unit3Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit3.id,
      order: 2,
      grammarTopic: 'Komparativ mit Umlaut',
      explanationDe:
        'Einsilbige Adjektive mit a, o oder u bekommen oft einen Umlaut im Komparativ: groß → größer, jung → jünger, alt → älter. Beispiel: "Meine Schwester ist jünger als ich."',
      explanationEn:
        'Single-syllable adjectives with a, o, or u often take an umlaut in the comparative: groß → größer (bigger), jung → jünger (younger), alt → älter (older). Example: "Meine Schwester ist jünger als ich" (My sister is younger than me).',
      explanationTr:
        'a, o, u ünlüsü içeren tek heceli sıfatlar genellikle karşılaştırmada umlaut alır: groß → größer (daha büyük), jung → jünger (daha genç), alt → älter (daha yaşlı). Örnek: "Meine Schwester ist jünger als ich" (Kız kardeşim benden daha genç).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit3Lesson2.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['groß', 'jung', 'alt'], rights: ['älter', 'größer', 'jünger'] },
        correctAnswer: {
          pairs: [
            { left: 'groß', right: 'größer' },
            { left: 'jung', right: 'jünger' },
            { left: 'alt', right: 'älter' },
          ],
        },
        explanation: 'Komparativ mit Umlaut: groß→größer, jung→jünger, alt→älter.',
      },
      {
        lessonId: a2Unit3Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Mein Opa ist ___ als mein Vater. (alt)' },
        correctAnswer: { accepted: ['älter'] },
        explanation: 'Der Komparativ von "alt" ist "älter".',
      },
    ],
  })

  const a2Unit3Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit3.id,
      order: 3,
      grammarTopic: "Superlativ mit 'am ...sten'",
      explanationDe:
        'Der Superlativ wird mit "am" + Adjektiv + "-sten" gebildet: schnell → am schnellsten, groß → am größten. Beispiel: "Der ICE ist am schnellsten."',
      explanationEn:
        'The superlative is formed with "am" + adjective + "-sten": schnell → am schnellsten (fastest), groß → am größten (biggest). Example: "Der ICE ist am schnellsten" (The ICE train is the fastest).',
      explanationTr:
        'Üstünlük derecesi "am" + sıfat + "-sten" ile kurulur: schnell → am schnellsten (en hızlı), groß → am größten (en büyük). Örnek: "Der ICE ist am schnellsten" (ICE treni en hızlısıdır).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit3Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der ICE ist ___. (schnell)', options: ['am schnellsten', 'schneller', 'so schnell', 'am schnell'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Der Superlativ von "schnell" ist "am schnellsten".',
      },
      {
        lessonId: a2Unit3Lesson3.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['Berg', 'ist', 'der', 'am', 'größten'] },
        correctAnswer: { order: ['der', 'Berg', 'ist', 'am', 'größten'] },
        explanation: 'Reihenfolge: Artikel, Subjekt, Verb, "am" + Superlativ.',
      },
    ],
  })

  const a2Unit3Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit3.id,
      order: 4,
      grammarTopic: 'Unregelmäßige Steigerungsformen',
      explanationDe:
        'Einige Adjektive/Adverbien haben unregelmäßige Steigerungsformen: gut → besser → am besten, viel → mehr → am meisten, gern → lieber → am liebsten. Beispiel: "Ich trinke gern Tee, aber ich trinke lieber Kaffee."',
      explanationEn:
        'Some adjectives/adverbs have irregular comparison forms: gut → besser → am besten (good/better/best), viel → mehr → am meisten (much/more/most), gern → lieber → am liebsten (gladly/preferably/most preferred). Example: "Ich trinke gern Tee, aber ich trinke lieber Kaffee" (I like drinking tea, but I prefer coffee).',
      explanationTr:
        'Bazı sıfat/zarfların düzensiz karşılaştırma biçimleri vardır: gut → besser → am besten (iyi/daha iyi/en iyi), viel → mehr → am meisten (çok/daha çok/en çok), gern → lieber → am liebsten (seve seve/tercihen/en çok tercih edilen). Örnek: "Ich trinke gern Tee, aber ich trinke lieber Kaffee" (Çayı severim ama kahveyi tercih ederim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit3Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Essen hier ist ___ als zu Hause. (gut)', options: ['guter', 'besser', 'am besten', 'guter'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Der Komparativ von "gut" ist unregelmäßig: "besser".',
      },
      {
        lessonId: a2Unit3Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I prefer coffee' (mit 'lieber')?" },
        correctAnswer: { accepted: ['ich trinke lieber kaffee'] },
        explanation: '"Ich trinke lieber Kaffee" bedeutet "I prefer coffee".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit3Lesson1.id, word: 'schnell', translationEn: 'fast', translationTr: 'hızlı', exampleSentence: 'Der Zug ist schnell.' },
      { lessonId: a2Unit3Lesson1.id, word: 'klein', translationEn: 'small', translationTr: 'küçük', exampleSentence: 'Mein Haus ist klein.' },
      { lessonId: a2Unit3Lesson2.id, word: 'groß', translationEn: 'big / tall', translationTr: 'büyük', exampleSentence: 'Das Haus ist groß.' },
      { lessonId: a2Unit3Lesson2.id, word: 'jung', translationEn: 'young', translationTr: 'genç', exampleSentence: 'Meine Schwester ist jung.' },
      { lessonId: a2Unit3Lesson3.id, word: 'der Berg', translationEn: 'the mountain', translationTr: 'dağ', exampleSentence: 'Der Berg ist am größten.' },
      { lessonId: a2Unit3Lesson3.id, word: 'der Zug', translationEn: 'the train', translationTr: 'tren', exampleSentence: 'Der Zug ist am schnellsten.' },
      { lessonId: a2Unit3Lesson4.id, word: 'besser', translationEn: 'better', translationTr: 'daha iyi', exampleSentence: 'Das Essen hier ist besser.' },
      { lessonId: a2Unit3Lesson4.id, word: 'am liebsten', translationEn: 'most of all / favorite', translationTr: 'en çok tercih edilen', exampleSentence: 'Ich trinke am liebsten Tee.' },
    ],
  })

  // --- A2 Unit 4: Nebensätze mit "dass" und "weil" (4 lessons) ---
  const a2Unit4 = await prisma.unit.create({
    data: { levelId: a2.id, order: 4, titleDe: 'Nebensätze mit "dass" und "weil"', titleEn: '"dass" and "weil" Clauses', titleTr: '"dass" ve "weil" Yan Cümleleri' },
  })

  const a2Unit4Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit4.id,
      order: 1,
      grammarTopic: "Nebensätze mit 'dass'",
      explanationDe:
        'Der Nebensatz mit "dass" gibt an, was jemand denkt, sagt oder weiß. Das konjugierte Verb steht am Ende: "Ich glaube, dass er Recht hat."',
      explanationEn:
        'A "dass" (that) clause states what someone thinks, says, or knows. The conjugated verb moves to the end: "Ich glaube, dass er Recht hat" (I believe that he is right).',
      explanationTr:
        '"Dass" (ki) cümlesi birinin düşündüğünü, söylediğini ya da bildiğini belirtir. Çekimli fiil cümlenin sonuna gider: "Ich glaube, dass er Recht hat" (Haklı olduğuna inanıyorum).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit4Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich glaube, dass er Recht ___.', options: ['hat', 'ist', 'habe', 'haben'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Im Nebensatz steht das konjugierte Verb ("hat") am Ende.',
      },
      {
        lessonId: a2Unit4Lesson1.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['Zeit', 'habe', 'dass', 'ich', 'keine'] },
        correctAnswer: { order: ['dass', 'ich', 'keine', 'Zeit', 'habe'] },
        explanation: 'Im Nebensatz steht das Verb am Ende: "dass ich keine Zeit habe".',
      },
    ],
  })

  const a2Unit4Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit4.id,
      order: 2,
      grammarTopic: "Nebensätze mit 'weil'",
      explanationDe:
        'Genau wie bei "dass" steht bei "weil" das konjugierte Verb am Ende des Nebensatzes. "weil" nennt einen Grund. Beispiel: "Ich lerne Deutsch, weil ich in Berlin arbeiten möchte."',
      explanationEn:
        'Just like with "dass", the conjugated verb in a "weil" (because) clause moves to the end. "weil" gives a reason. Example: "Ich lerne Deutsch, weil ich in Berlin arbeiten möchte" (I\'m learning German because I want to work in Berlin).',
      explanationTr:
        '"Dass" ile aynı şekilde, "weil" (çünkü) cümlesinde de çekimli fiil cümlenin sonuna gider. "weil" bir sebep bildirir. Örnek: "Ich lerne Deutsch, weil ich in Berlin arbeiten möchte" (Almanca öğreniyorum çünkü Berlin\'de çalışmak istiyorum).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit4Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich lerne Deutsch, weil ich in Berlin arbeiten ___.', options: ['möchte', 'möchtest', 'möchten', 'möchtet'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" benutzt man "möchte".',
      },
      {
        lessonId: a2Unit4Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich bin müde, ___ ich wenig geschlafen habe.' },
        correctAnswer: { accepted: ['weil'] },
        explanation: '"Weil" leitet den Grund ein.',
      },
    ],
  })

  const a2Unit4Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit4.id,
      order: 3,
      grammarTopic: "'dass' vs. 'weil'",
      explanationDe:
        '"dass" leitet einen Inhalt ein (was jemand denkt/sagt), "weil" leitet einen Grund ein (warum). Beide haben Verb-Ende-Stellung: "Ich weiß, dass du müde bist." / "Du bist müde, weil du wenig geschlafen hast."',
      explanationEn:
        '"dass" introduces content (what someone thinks or says), "weil" introduces a reason (why). Both have verb-final word order: "Ich weiß, dass du müde bist" (I know that you\'re tired). / "Du bist müde, weil du wenig geschlafen hast" (You\'re tired because you slept little).',
      explanationTr:
        '"dass" bir içeriği (birinin ne düşündüğünü/söylediğini) tanıtır, "weil" bir sebebi (neden) tanıtır. İkisi de fiil-sonu sırasına sahiptir: "Ich weiß, dass du müde bist." / "Du bist müde, weil du wenig geschlafen hast."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit4Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich weiß, ___ du müde bist.', options: ['dass', 'weil', 'wenn', 'ob'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"dass" leitet hier den Inhalt des Wissens ein.',
      },
      {
        lessonId: a2Unit4Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welches Wort passt: 'Du bist müde, ___ du wenig geschlafen hast.' (dass oder weil)?" },
        correctAnswer: { accepted: ['weil'] },
        explanation: '"weil" nennt den Grund für die Müdigkeit.',
      },
    ],
  })

  const a2Unit4Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit4.id,
      order: 4,
      grammarTopic: "Verben mit 'dass'-Sätzen",
      explanationDe:
        'Viele Verben werden oft mit einem "dass"-Satz kombiniert: glauben, denken, wissen, hoffen, sagen. Beispiel: "Ich hoffe, dass das Wetter morgen gut ist."',
      explanationEn:
        'Many verbs are often combined with a "dass" clause: glauben (believe), denken (think), wissen (know), hoffen (hope), sagen (say). Example: "Ich hoffe, dass das Wetter morgen gut ist" (I hope that the weather is good tomorrow).',
      explanationTr:
        'Birçok fiil sıklıkla bir "dass" cümlesiyle birlikte kullanılır: glauben (inanmak), denken (düşünmek), wissen (bilmek), hoffen (ummak), sagen (söylemek). Örnek: "Ich hoffe, dass das Wetter morgen gut ist" (Umarım yarın hava güzel olur).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit4Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich ___, dass das Wetter morgen gut ist. (hoffen)' },
        correctAnswer: { accepted: ['hoffe'] },
        explanation: 'Mit "ich" benutzt man "hoffe".',
      },
      {
        lessonId: a2Unit4Lesson4.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['gut', 'das', 'Wetter', 'ist', 'dass'] },
        correctAnswer: { order: ['dass', 'das', 'Wetter', 'gut', 'ist'] },
        explanation: 'Nebensatz-Wortstellung: Konjunktion, Subjekt, Ergänzung, Verb.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit4Lesson1.id, word: 'glauben', translationEn: 'to believe', translationTr: 'inanmak', exampleSentence: 'Ich glaube, dass er Recht hat.' },
      { lessonId: a2Unit4Lesson1.id, word: 'Recht haben', translationEn: 'to be right', translationTr: 'haklı olmak', exampleSentence: 'Er hat Recht.' },
      { lessonId: a2Unit4Lesson2.id, word: 'der Grund', translationEn: 'the reason', translationTr: 'sebep', exampleSentence: 'Das ist der Grund.' },
      { lessonId: a2Unit4Lesson2.id, word: 'schlafen', translationEn: 'to sleep', translationTr: 'uyumak', exampleSentence: 'Ich habe wenig geschlafen.' },
      { lessonId: a2Unit4Lesson3.id, word: 'wissen', translationEn: 'to know', translationTr: 'bilmek', exampleSentence: 'Ich weiß, dass du müde bist.' },
      { lessonId: a2Unit4Lesson3.id, word: 'der Unterschied', translationEn: 'the difference', translationTr: 'fark', exampleSentence: 'Kennst du den Unterschied zwischen "dass" und "weil"?' },
      { lessonId: a2Unit4Lesson4.id, word: 'hoffen', translationEn: 'to hope', translationTr: 'ummak', exampleSentence: 'Ich hoffe, dass das Wetter morgen gut ist.' },
      { lessonId: a2Unit4Lesson4.id, word: 'denken', translationEn: 'to think', translationTr: 'düşünmek', exampleSentence: 'Ich denke, dass das richtig ist.' },
    ],
  })

  // --- A2 Unit 5: Nebensätze mit "wenn" (4 lessons) ---
  const a2Unit5 = await prisma.unit.create({
    data: { levelId: a2.id, order: 5, titleDe: 'Nebensätze mit "wenn"', titleEn: '"wenn" Clauses', titleTr: '"wenn" Yan Cümleleri' },
  })

  const a2Unit5Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit5.id,
      order: 1,
      grammarTopic: "'wenn' für wiederholte Ereignisse",
      explanationDe:
        '"wenn" beschreibt wiederholte oder zukünftige Ereignisse in der Zeit. Das Verb steht am Ende des Nebensatzes: "Wenn ich Zeit habe, gehe ich schwimmen."',
      explanationEn:
        '"wenn" (when/whenever) describes repeated or future events in time. The verb moves to the end of the subordinate clause: "Wenn ich Zeit habe, gehe ich schwimmen" (Whenever I have time, I go swimming).',
      explanationTr:
        '"wenn" (ne zaman/-dığında) tekrar eden ya da gelecekteki olayları anlatır. Fiil yan cümlenin sonuna gider: "Wenn ich Zeit habe, gehe ich schwimmen" (Vaktim olduğunda yüzmeye giderim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit5Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wenn ich Zeit ___, gehe ich schwimmen.', options: ['habe', 'hat', 'habt', 'haben'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" benutzt man "habe".',
      },
      {
        lessonId: a2Unit5Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ es regnet, bleibe ich zu Hause.' },
        correctAnswer: { accepted: ['wenn'] },
        explanation: '"Wenn" leitet den Nebensatz ein.',
      },
    ],
  })

  const a2Unit5Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit5.id,
      order: 2,
      grammarTopic: "'wenn' als Bedingung",
      explanationDe:
        '"wenn" leitet auch reale Bedingungssätze ein: "Wenn du müde bist, solltest du schlafen gehen." Der Hauptsatz beschreibt die Folge.',
      explanationEn:
        '"wenn" also introduces real conditional clauses: "Wenn du müde bist, solltest du schlafen gehen" (If you\'re tired, you should go to sleep). The main clause describes the consequence.',
      explanationTr:
        '"wenn" gerçek koşul cümlelerini de tanıtır: "Wenn du müde bist, solltest du schlafen gehen" (Yorgunsan uyumaya gitmelisin). Ana cümle sonucu anlatır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit5Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wenn du müde bist, ___ du schlafen gehen.', options: ['solltest', 'sollte', 'sollten', 'sollt'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "du" benutzt man "solltest".',
      },
      {
        lessonId: a2Unit5Lesson2.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['bist', 'du', 'krank', 'wenn'] },
        correctAnswer: { order: ['wenn', 'du', 'krank', 'bist'] },
        explanation: 'Im wenn-Satz steht das Verb am Ende: "wenn du krank bist".',
      },
    ],
  })

  const a2Unit5Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit5.id,
      order: 3,
      grammarTopic: "'wenn' vs. 'wann'",
      explanationDe:
        '"wenn" ist eine Konjunktion (zeitlich/bedingend), "wann" ist ein Fragewort für die Zeit. Vergleiche: "Wann kommst du?" (Frage) / "Ich weiß nicht, wann er kommt." (indirekte Frage) vs. "Wenn er kommt, freue ich mich." (Bedingung).',
      explanationEn:
        '"wenn" is a conjunction (temporal/conditional), "wann" is a question word asking about time. Compare: "Wann kommst du?" (When are you coming?) / "Ich weiß nicht, wann er kommt" (I don\'t know when he\'s coming) vs. "Wenn er kommt, freue ich mich" (When/if he comes, I\'ll be happy).',
      explanationTr:
        '"wenn" bir bağlaçtır (zamansal/koşullu), "wann" zaman soran bir soru sözcüğüdür. Karşılaştır: "Wann kommst du?" (soru) / "Ich weiß nicht, wann er kommt." (dolaylı soru) vs. "Wenn er kommt, freue ich mich." (koşul).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit5Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ kommst du morgen?', options: ['Wann', 'Wenn', 'Ob', 'Dass'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Wann" fragt nach der Zeit.',
      },
      {
        lessonId: a2Unit5Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ er kommt, freue ich mich.' },
        correctAnswer: { accepted: ['wenn'] },
        explanation: '"Wenn" leitet hier eine Bedingung ein.',
      },
    ],
  })

  const a2Unit5Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit5.id,
      order: 4,
      grammarTopic: 'Wortstellung: Nebensatz zuerst',
      explanationDe:
        'Beginnt der Satz mit dem Nebensatz (wenn...), steht das Verb im Hauptsatz direkt danach (Verb-Verb-Stellung): "Wenn es regnet, bleibe ich zu Hause." Beide Verben stehen nebeneinander um das Komma.',
      explanationEn:
        'When the sentence starts with the subordinate clause (wenn...), the verb in the main clause comes right after it (verb-verb word order): "Wenn es regnet, bleibe ich zu Hause" (If it rains, I stay home). Both verbs sit next to each other around the comma.',
      explanationTr:
        'Cümle yan cümleyle (wenn...) başlarsa, ana cümledeki fiil hemen ardından gelir (fiil-fiil sırası): "Wenn es regnet, bleibe ich zu Hause." İki fiil de virgülün etrafında yan yana durur.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit5Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['regnet', 'es', 'wenn', 'bleibe', 'ich'] },
        correctAnswer: { order: ['wenn', 'es', 'regnet', 'bleibe', 'ich'] },
        explanation: 'Nebensatz zuerst: Verb am Ende des Nebensatzes ("regnet"), dann direkt das Verb des Hauptsatzes ("bleibe").',
      },
      {
        lessonId: a2Unit5Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wenn es regnet, ___ ich zu Hause.', options: ['bleibe', 'bleibst', 'bleibt', 'bleiben'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Nach dem Komma folgt direkt das Verb des Hauptsatzes: "bleibe".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit5Lesson1.id, word: 'regnen', translationEn: 'to rain', translationTr: 'yağmur yağmak', exampleSentence: 'Wenn es regnet, bleibe ich zu Hause.' },
      { lessonId: a2Unit5Lesson1.id, word: 'schwimmen', translationEn: 'to swim', translationTr: 'yüzmek', exampleSentence: 'Ich gehe schwimmen.' },
      { lessonId: a2Unit5Lesson2.id, word: 'die Bedingung', translationEn: 'the condition', translationTr: 'koşul', exampleSentence: 'Das ist die Bedingung.' },
      { lessonId: a2Unit5Lesson2.id, word: 'sollen', translationEn: 'should / to be supposed to', translationTr: '-meli/-malı', exampleSentence: 'Du solltest schlafen gehen.' },
      { lessonId: a2Unit5Lesson3.id, word: 'sich freuen', translationEn: 'to be glad / happy', translationTr: 'sevinmek', exampleSentence: 'Wenn er kommt, freue ich mich.' },
      { lessonId: a2Unit5Lesson3.id, word: 'morgen', translationEn: 'tomorrow', translationTr: 'yarın', exampleSentence: 'Wann kommst du morgen?' },
      { lessonId: a2Unit5Lesson4.id, word: 'zu Hause', translationEn: 'at home', translationTr: 'evde', exampleSentence: 'Ich bleibe zu Hause.' },
      { lessonId: a2Unit5Lesson4.id, word: 'die Wortstellung', translationEn: 'word order', translationTr: 'sözcük sırası', exampleSentence: 'Die Wortstellung im Nebensatz ist wichtig.' },
    ],
  })

  // --- A2 Unit 6: Indirekte Fragesätze (4 lessons) ---
  const a2Unit6 = await prisma.unit.create({
    data: { levelId: a2.id, order: 6, titleDe: 'Indirekte Fragesätze', titleEn: 'Indirect Questions', titleTr: 'Dolaylı Sorular' },
  })

  const a2Unit6Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit6.id,
      order: 1,
      grammarTopic: "Indirekte Fragen mit 'ob'",
      explanationDe:
        'Bei indirekten Ja/Nein-Fragen benutzt man "ob" statt einer direkten Frage. Das Verb steht am Ende: "Weißt du, ob er kommt?" statt "Kommt er?"',
      explanationEn:
        'For indirect yes/no questions, use "ob" (whether/if) instead of asking directly. The verb moves to the end: "Weißt du, ob er kommt?" (Do you know whether he\'s coming?) instead of "Kommt er?" (Is he coming?)',
      explanationTr:
        'Dolaylı evet/hayır sorularında doğrudan soru yerine "ob" (-ip -ipmediği) kullanılır. Fiil sona gider: "Weißt du, ob er kommt?" (Gelip gelmeyeceğini biliyor musun?) yerine "Kommt er?" (Geliyor mu?)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit6Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Weißt du, ___ er kommt?', options: ['ob', 'dass', 'weil', 'wenn'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Bei einer indirekten Ja/Nein-Frage benutzt man "ob".',
      },
      {
        lessonId: a2Unit6Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich weiß nicht, ___ das Geschäft heute offen ist.' },
        correctAnswer: { accepted: ['ob'] },
        explanation: '"Ob" leitet die indirekte Ja/Nein-Frage ein.',
      },
    ],
  })

  const a2Unit6Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit6.id,
      order: 2,
      grammarTopic: 'Indirekte W-Fragen',
      explanationDe:
        'Bei indirekten W-Fragen bleibt das Fragewort (wo, wann, warum, was...) erhalten, aber das Verb wandert ans Ende: "Ich weiß nicht, wo der Bahnhof ist." statt "Wo ist der Bahnhof?"',
      explanationEn:
        'In indirect W-questions, the question word (wo, wann, warum, was...) stays, but the verb moves to the end: "Ich weiß nicht, wo der Bahnhof ist" (I don\'t know where the train station is) instead of "Wo ist der Bahnhof?" (Where is the train station?)',
      explanationTr:
        'Dolaylı W-sorularında soru sözcüğü (wo, wann, warum, was...) kalır, ama fiil sona gider: "Ich weiß nicht, wo der Bahnhof ist." yerine "Wo ist der Bahnhof?"',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit6Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich weiß nicht, wo der Bahnhof ___.', options: ['ist', 'ist er', 'er ist', 'sei'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Das Verb "ist" steht am Ende des Nebensatzes.',
      },
      {
        lessonId: a2Unit6Lesson2.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['bist', 'warum', 'traurig', 'du'] },
        correctAnswer: { order: ['warum', 'du', 'traurig', 'bist'] },
        explanation: 'Fragewort zuerst, dann Subjekt, dann Ergänzung, dann Verb am Ende.',
      },
    ],
  })

  const a2Unit6Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit6.id,
      order: 3,
      grammarTopic: 'Einleitende Ausdrücke für indirekte Fragen',
      explanationDe:
        'Häufige Einleitungen für indirekte Fragen: "Ich weiß nicht, ob/wann/wo...", "Kannst du mir sagen, ob/wann/wo...?", "Ich frage mich, ob/wann/wo...". Beispiel: "Kannst du mir sagen, wann der Zug fährt?"',
      explanationEn:
        'Common phrases that introduce indirect questions: "Ich weiß nicht, ob/wann/wo..." (I don\'t know whether/when/where...), "Kannst du mir sagen, ob/wann/wo...?" (Can you tell me whether/when/where...?), "Ich frage mich, ob/wann/wo..." (I wonder whether/when/where...). Example: "Kannst du mir sagen, wann der Zug fährt?" (Can you tell me when the train leaves?)',
      explanationTr:
        'Dolaylı soruları başlatan yaygın ifadeler: "Ich weiß nicht, ob/wann/wo..." (bilmiyorum...), "Kannst du mir sagen, ob/wann/wo...?" (söyleyebilir misin...?), "Ich frage mich, ob/wann/wo..." (merak ediyorum...). Örnek: "Kannst du mir sagen, wann der Zug fährt?" (Trenin ne zaman kalktığını söyleyebilir misin?)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit6Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Kannst du mir sagen, ___ der Zug fährt?', options: ['wann', 'wenn', 'dass', 'weil'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Wann" fragt nach der Zeit der Abfahrt.',
      },
      {
        lessonId: a2Unit6Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I wonder whether he is coming' (mit 'Ich frage mich')?" },
        correctAnswer: { accepted: ['ich frage mich, ob er kommt', 'ich frage mich ob er kommt'] },
        explanation: '"Ich frage mich, ob er kommt" bedeutet "I wonder whether he is coming".',
      },
    ],
  })

  const a2Unit6Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit6.id,
      order: 4,
      grammarTopic: 'Direkte in indirekte Fragen umwandeln',
      explanationDe:
        'Um eine direkte Frage in eine indirekte umzuwandeln: Ja/Nein-Frage → "ob" + Verb-Ende; W-Frage → Fragewort bleibt + Verb-Ende. "Isst du gern Pizza?" → "Ich möchte wissen, ob du gern Pizza isst."',
      explanationEn:
        'To turn a direct question into an indirect one: yes/no question → "ob" + verb-final; W-question → question word stays + verb-final. "Isst du gern Pizza?" (Do you like eating pizza?) → "Ich möchte wissen, ob du gern Pizza isst" (I\'d like to know whether you like eating pizza).',
      explanationTr:
        'Doğrudan bir soruyu dolaylıya çevirmek için: evet/hayır sorusu → "ob" + fiil sonda; W-sorusu → soru sözcüğü kalır + fiil sonda. "Isst du gern Pizza?" → "Ich möchte wissen, ob du gern Pizza isst."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit6Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich möchte wissen, ___ du gern Pizza isst.' },
        correctAnswer: { accepted: ['ob'] },
        explanation: 'Eine Ja/Nein-Frage wird indirekt mit "ob" eingeleitet.',
      },
      {
        lessonId: a2Unit6Lesson4.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['möchtest', 'du', 'essen', 'was'] },
        correctAnswer: { order: ['was', 'du', 'essen', 'möchtest'] },
        explanation: 'Das Fragewort bleibt ("was"), das Verb wandert ans Ende ("möchtest").',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit6Lesson1.id, word: 'das Geschäft', translationEn: 'the shop / business', translationTr: 'dükkan / iş', exampleSentence: 'Ich weiß nicht, ob das Geschäft heute offen ist.' },
      { lessonId: a2Unit6Lesson1.id, word: 'offen', translationEn: 'open', translationTr: 'açık', exampleSentence: 'Das Geschäft ist offen.' },
      { lessonId: a2Unit6Lesson2.id, word: 'traurig', translationEn: 'sad', translationTr: 'üzgün', exampleSentence: 'Ich weiß nicht, warum du traurig bist.' },
      { lessonId: a2Unit6Lesson2.id, word: 'warum', translationEn: 'why', translationTr: 'neden', exampleSentence: 'Warum bist du traurig?' },
      { lessonId: a2Unit6Lesson3.id, word: 'sich fragen', translationEn: 'to wonder', translationTr: 'merak etmek', exampleSentence: 'Ich frage mich, ob er kommt.' },
      { lessonId: a2Unit6Lesson3.id, word: 'abfahren', translationEn: 'to depart', translationTr: 'kalkmak (araç)', exampleSentence: 'Der Zug fährt um acht Uhr ab.' },
      { lessonId: a2Unit6Lesson4.id, word: 'die Frage', translationEn: 'the question', translationTr: 'soru', exampleSentence: 'Das ist eine gute Frage.' },
      { lessonId: a2Unit6Lesson4.id, word: 'umwandeln', translationEn: 'to convert / transform', translationTr: 'dönüştürmek', exampleSentence: 'Wandle die Frage in eine indirekte Frage um.' },
    ],
  })

  // --- A2 Unit 7: Präteritum der Modalverben und "sein"/"haben" (4 lessons) ---
  const a2Unit7 = await prisma.unit.create({
    data: { levelId: a2.id, order: 7, titleDe: 'Präteritum der Modalverben', titleEn: 'Präteritum of Modal Verbs', titleTr: 'Modal Fiillerin Präteritum Hali' },
  })

  const a2Unit7Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit7.id,
      order: 1,
      grammarTopic: "Präteritum von 'sein' und 'haben'",
      explanationDe:
        'Im Präteritum: "sein" → ich war, du warst, er war, wir waren, ihr wart, sie waren. "haben" → ich hatte, du hattest, er hatte, wir hatten, ihr hattet, sie hatten. Beispiel: "Ich war müde. Ich hatte keine Zeit."',
      explanationEn:
        'In the Präteritum: "sein" → ich war, du warst, er war, wir waren, ihr wart, sie waren (was/were). "haben" → ich hatte, du hattest, er hatte, wir hatten, ihr hattet, sie hatten (had). Example: "Ich war müde. Ich hatte keine Zeit" (I was tired. I had no time).',
      explanationTr:
        'Präteritumda: "sein" → ich war, du warst, er war, wir waren, ihr wart, sie waren (idi). "haben" → ich hatte, du hattest, er hatte, wir hatten, ihr hattet, sie hatten (sahipti). Örnek: "Ich war müde. Ich hatte keine Zeit" (Yorgundum. Vaktim yoktu).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit7Lesson1.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['ich', 'du', 'wir'], rights: ['waren', 'war', 'warst'] },
        correctAnswer: {
          pairs: [
            { left: 'ich', right: 'war' },
            { left: 'du', right: 'warst' },
            { left: 'wir', right: 'waren' },
          ],
        },
        explanation: 'Präteritum von "sein": ich war, du warst, wir waren.',
      },
      {
        lessonId: a2Unit7Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich ___ gestern keine Zeit.' },
        correctAnswer: { accepted: ['hatte'] },
        explanation: 'Das Präteritum von "haben" für "ich" ist "hatte".',
      },
    ],
  })

  const a2Unit7Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit7.id,
      order: 2,
      grammarTopic: 'Präteritum der Modalverben',
      explanationDe:
        'Die Modalverben verlieren im Präteritum den Umlaut: können → konnte, müssen → musste, wollen → wollte, dürfen → durfte. Beispiel: "Ich konnte gestern nicht kommen, weil ich arbeiten musste."',
      explanationEn:
        'Modal verbs lose their umlaut in the Präteritum: können → konnte (could), müssen → musste (had to), wollen → wollte (wanted to), dürfen → durfte (was allowed to). Example: "Ich konnte gestern nicht kommen, weil ich arbeiten musste" (I couldn\'t come yesterday because I had to work).',
      explanationTr:
        'Modal fiiller Präteritumda umlautlarını kaybeder: können → konnte (yapabildi), müssen → musste (zorunda kaldı), wollen → wollte (istedi), dürfen → durfte (izinliydi). Örnek: "Ich konnte gestern nicht kommen, weil ich arbeiten musste" (Dün gelemedim çünkü çalışmak zorundaydım).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit7Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ gestern nicht kommen. (können, Präteritum)', options: ['konnte', 'kann', 'könnte', 'gekonnt'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Das Präteritum von "können" für "ich" ist "konnte".',
      },
      {
        lessonId: a2Unit7Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er ___ gestern arbeiten. (müssen, Präteritum)' },
        correctAnswer: { accepted: ['musste'] },
        explanation: 'Das Präteritum von "müssen" für "er" ist "musste".',
      },
    ],
  })

  const a2Unit7Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit7.id,
      order: 3,
      grammarTopic: "Präteritum: 'mochte' und 'sollte'",
      explanationDe:
        '"mögen" wird im Präteritum zu "mochte" (ich mochte, du mochtest...), "sollen" wird zu "sollte" (ich sollte, du solltest...). Diese Formen benutzt man oft beim Erzählen von Geschichten. Beispiel: "Als Kind mochte ich keinen Fisch."',
      explanationEn:
        '"mögen" (to like) becomes "mochte" in the Präteritum (ich mochte, du mochtest...), "sollen" (should) becomes "sollte" (ich sollte, du solltest...). These forms are often used when narrating stories. Example: "Als Kind mochte ich keinen Fisch" (As a child I didn\'t like fish).',
      explanationTr:
        '"mögen" (sevmek) Präteritumda "mochte" olur (ich mochte, du mochtest...), "sollen" ise "sollte" olur (ich sollte, du solltest...). Bu biçimler genellikle hikaye anlatırken kullanılır. Örnek: "Als Kind mochte ich keinen Fisch" (Çocukken balık sevmezdim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit7Lesson3.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Als Kind ___ ich keinen Fisch. (mögen, Präteritum)' },
        correctAnswer: { accepted: ['mochte'] },
        explanation: 'Das Präteritum von "mögen" für "ich" ist "mochte".',
      },
      {
        lessonId: a2Unit7Lesson3.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Du ___ früher ins Bett gehen. (sollen, Präteritum)', options: ['solltest', 'sollte', 'solltet', 'sollten'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "du" benutzt man "solltest".',
      },
    ],
  })

  const a2Unit7Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit7.id,
      order: 4,
      grammarTopic: 'Präteritum vs. Perfekt',
      explanationDe:
        'Im gesprochenen Deutsch benutzt man meist das Perfekt, aber "sein", "haben" und die Modalverben werden auch mündlich oft im Präteritum benutzt: "Ich war müde" (nicht "Ich bin müde gewesen"). Im Schriftlichen (Geschichten, Nachrichten) ist das Präteritum häufiger.',
      explanationEn:
        'In spoken German, the Perfekt is usually preferred, but "sein", "haben", and the modal verbs are often used in the Präteritum even in speech: "Ich war müde" (not "Ich bin müde gewesen"). In writing (stories, news), the Präteritum is more common.',
      explanationTr:
        'Konuşma dilinde genellikle Perfekt tercih edilir, ancak "sein", "haben" ve modal fiiller konuşmada da sıklıkla Präteritumda kullanılır: "Ich war müde" (Ich bin müde gewesen değil). Yazı dilinde (hikayeler, haberler) Präteritum daha yaygındır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit7Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ gestern sehr müde. (gesprochene Form mit "sein")', options: ['war', 'bin gewesen', 'habe gewesen', 'wäre'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"sein" benutzt man auch mündlich meist im Präteritum: "war".',
      },
      {
        lessonId: a2Unit7Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I had no time' (mit 'haben', im Präteritum)?" },
        correctAnswer: { accepted: ['ich hatte keine zeit'] },
        explanation: '"Ich hatte keine Zeit" bedeutet "I had no time".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit7Lesson1.id, word: 'damals', translationEn: 'back then / at that time', translationTr: 'o zamanlar', exampleSentence: 'Damals war ich Student.' },
      { lessonId: a2Unit7Lesson1.id, word: 'der Student', translationEn: 'the student', translationTr: 'öğrenci', exampleSentence: 'Damals war ich Student.' },
      { lessonId: a2Unit7Lesson2.id, word: 'der Chef', translationEn: 'the boss', translationTr: 'patron', exampleSentence: 'Der Chef wollte mich sprechen.' },
      { lessonId: a2Unit7Lesson2.id, word: 'die Erlaubnis', translationEn: 'the permission', translationTr: 'izin', exampleSentence: 'Ich hatte keine Erlaubnis.' },
      { lessonId: a2Unit7Lesson3.id, word: 'der Fisch', translationEn: 'the fish', translationTr: 'balık', exampleSentence: 'Als Kind mochte ich keinen Fisch.' },
      { lessonId: a2Unit7Lesson3.id, word: 'das Bett', translationEn: 'the bed', translationTr: 'yatak', exampleSentence: 'Du solltest früher ins Bett gehen.' },
      { lessonId: a2Unit7Lesson4.id, word: 'die Nachricht', translationEn: 'the news / message', translationTr: 'haber / mesaj', exampleSentence: 'Das steht in den Nachrichten.' },
      { lessonId: a2Unit7Lesson4.id, word: 'die Geschichte', translationEn: 'the story / history', translationTr: 'hikaye / tarih', exampleSentence: 'Das ist eine spannende Geschichte.' },
    ],
  })

  // --- A2 Unit 8: Wechselpräpositionen Vertiefung (4 lessons) ---
  const a2Unit8 = await prisma.unit.create({
    data: { levelId: a2.id, order: 8, titleDe: 'Wechselpräpositionen Vertiefung', titleEn: 'Two-Way Prepositions in Depth', titleTr: 'Wechselpräpositionen Derinlemesine' },
  })

  const a2Unit8Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit8.id,
      order: 1,
      grammarTopic: 'Wechselpräpositionen: Wo? = Dativ',
      explanationDe:
        'Die neun Wechselpräpositionen sind: in, an, auf, unter, über, vor, hinter, neben, zwischen. Bei der Frage "Wo?" (Position, keine Bewegung) benutzt man den Dativ: "Das Buch liegt auf dem Tisch."',
      explanationEn:
        'The nine two-way prepositions are: in, an, auf, unter, über, vor, hinter, neben, zwischen. When answering "Wo?" (location, no movement), use the dative: "Das Buch liegt auf dem Tisch" (The book is lying on the table).',
      explanationTr:
        'Dokuz "Wechselpräposition" şunlardır: in, an, auf, unter, über, vor, hinter, neben, zwischen. "Wo?" (konum, hareket yok) sorusuna cevapta Dativ kullanılır: "Das Buch liegt auf dem Tisch" (Kitap masanın üzerinde duruyor).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit8Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Buch liegt auf ___ Tisch. (Dativ, maskulin)', options: ['dem', 'den', 'der', 'das'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Dativ maskulin: dem Tisch.',
      },
      {
        lessonId: a2Unit8Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Lampe hängt über ___ Bett. (Dativ, neutral)' },
        correctAnswer: { accepted: ['dem'] },
        explanation: 'Dativ neutral: dem Bett.',
      },
    ],
  })

  const a2Unit8Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit8.id,
      order: 2,
      grammarTopic: 'Wechselpräpositionen: Wohin? = Akkusativ',
      explanationDe:
        'Bei der Frage "Wohin?" (Richtung, Bewegung) benutzt man den Akkusativ: "Ich lege das Buch auf den Tisch." Das Verb zeigt oft die Bewegung an (legen, stellen, hängen).',
      explanationEn:
        'When answering "Wohin?" (direction, movement), use the accusative: "Ich lege das Buch auf den Tisch" (I put the book onto the table). The verb often signals the movement (legen, stellen, hängen).',
      explanationTr:
        '"Wohin?" (yön, hareket) sorusuna cevapta Akkusativ kullanılır: "Ich lege das Buch auf den Tisch" (Kitabı masanın üzerine koyuyorum). Fiil genellikle hareketi belirtir (legen, stellen, hängen).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit8Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich lege das Buch auf ___ Tisch. (Akkusativ, maskulin)', options: ['den', 'dem', 'der', 'das'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Akkusativ maskulin: den Tisch.',
      },
      {
        lessonId: a2Unit8Lesson2.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['Vase', 'die', 'stelle', 'ich', 'den', 'Tisch', 'auf'] },
        correctAnswer: { order: ['ich', 'stelle', 'die', 'Vase', 'auf', 'den', 'Tisch'] },
        explanation: 'Position 2 ist das Verb, dann Akkusativobjekt, dann Präposition + Akkusativ (Richtung).',
      },
    ],
  })

  const a2Unit8Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit8.id,
      order: 3,
      grammarTopic: 'Wo vs. Wohin: Kontrastübung',
      explanationDe:
        'Vergleiche: "Die Vase steht auf dem Tisch." (Wo? = Dativ, Zustand) vs. "Ich stelle die Vase auf den Tisch." (Wohin? = Akkusativ, Bewegung). Das Verb entscheidet oft mit: stehen/liegen/hängen (Zustand) vs. stellen/legen/hängen (Bewegung).',
      explanationEn:
        'Compare: "Die Vase steht auf dem Tisch" (Wo? = dative, state) vs. "Ich stelle die Vase auf den Tisch" (Wohin? = accusative, movement). The verb often decides: stehen/liegen/hängen (state) vs. stellen/legen/hängen (movement).',
      explanationTr:
        'Karşılaştır: "Die Vase steht auf dem Tisch." (Wo? = Dativ, durum) vs. "Ich stelle die Vase auf den Tisch." (Wohin? = Akkusativ, hareket). Fiil genellikle belirleyicidir: stehen/liegen/hängen (durum) vs. stellen/legen/hängen (hareket).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit8Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Vase steht auf ___ Tisch. (Zustand)', options: ['dem', 'den', 'der', 'die'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Zustand = Dativ: dem Tisch.',
      },
      {
        lessonId: a2Unit8Lesson3.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['stehen', 'stellen'], rights: ['Akkusativ', 'Dativ'] },
        correctAnswer: {
          pairs: [
            { left: 'stehen', right: 'Dativ' },
            { left: 'stellen', right: 'Akkusativ' },
          ],
        },
        explanation: '"stehen" beschreibt einen Zustand (Dativ), "stellen" eine Bewegung (Akkusativ).',
      },
    ],
  })

  const a2Unit8Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit8.id,
      order: 4,
      grammarTopic: 'Feste Ausdrücke mit Wechselpräpositionen',
      explanationDe:
        'Manche Verben werden fest mit einer Präposition kombiniert, unabhängig von "wo/wohin": warten auf (+Akkusativ), sich freuen auf (+Akkusativ), denken an (+Akkusativ). Beispiel: "Ich warte auf den Bus."',
      explanationEn:
        'Some verbs are fixed with a particular preposition, regardless of "wo/wohin": warten auf (+accusative, wait for), sich freuen auf (+accusative, look forward to), denken an (+accusative, think of). Example: "Ich warte auf den Bus" (I\'m waiting for the bus).',
      explanationTr:
        'Bazı fiiller "wo/wohin"dan bağımsız olarak belirli bir edatla sabit kullanılır: warten auf (+Akkusativ, beklemek), sich freuen auf (+Akkusativ, dört gözle beklemek), denken an (+Akkusativ, düşünmek). Örnek: "Ich warte auf den Bus" (Otobüsü bekliyorum).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit8Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich warte ___ den Bus.' },
        correctAnswer: { accepted: ['auf'] },
        explanation: '"Warten auf" + Akkusativ.',
      },
      {
        lessonId: a2Unit8Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich freue mich ___ den Urlaub.', options: ['auf', 'über', 'für', 'mit'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"sich freuen auf" + Akkusativ (Vorfreude).',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit8Lesson1.id, word: 'liegen', translationEn: 'to lie (be in a lying position)', translationTr: 'yatay durmak', exampleSentence: 'Das Buch liegt auf dem Tisch.' },
      { lessonId: a2Unit8Lesson1.id, word: 'hängen', translationEn: 'to hang', translationTr: 'asılı olmak', exampleSentence: 'Die Lampe hängt über dem Bett.' },
      { lessonId: a2Unit8Lesson2.id, word: 'legen', translationEn: 'to lay / put (flat)', translationTr: 'yatay koymak', exampleSentence: 'Ich lege das Buch auf den Tisch.' },
      { lessonId: a2Unit8Lesson2.id, word: 'stellen', translationEn: 'to put / place (upright)', translationTr: 'dikey koymak', exampleSentence: 'Ich stelle die Vase auf den Tisch.' },
      { lessonId: a2Unit8Lesson3.id, word: 'stehen', translationEn: 'to stand', translationTr: 'dikey durmak', exampleSentence: 'Die Vase steht auf dem Tisch.' },
      { lessonId: a2Unit8Lesson3.id, word: 'die Vase', translationEn: 'the vase', translationTr: 'vazo', exampleSentence: 'Die Vase steht auf dem Tisch.' },
      { lessonId: a2Unit8Lesson4.id, word: 'der Urlaub', translationEn: 'the vacation', translationTr: 'tatil', exampleSentence: 'Ich freue mich auf den Urlaub.' },
      { lessonId: a2Unit8Lesson4.id, word: 'denken an', translationEn: 'to think of / about', translationTr: 'düşünmek (biri/bir şey hakkında)', exampleSentence: 'Ich denke an dich.' },
    ],
  })

  // --- A2 Unit 9: Adjektivdeklination (4 lessons) ---
  const a2Unit9 = await prisma.unit.create({
    data: { levelId: a2.id, order: 9, titleDe: 'Adjektivdeklination', titleEn: 'Adjective Declension', titleTr: 'Sıfat Çekimi' },
  })

  const a2Unit9Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit9.id,
      order: 1,
      grammarTopic: 'Adjektivendungen im Nominativ (bestimmter Artikel)',
      explanationDe:
        'Nach dem bestimmten Artikel im Nominativ endet das Adjektiv meist auf "-e": der neue Mann, die neue Frau, das neue Auto. Beispiel: "Der neue Kollege heißt Tom."',
      explanationEn:
        'After the definite article in the nominative, the adjective usually ends in "-e": der neue Mann (the new man), die neue Frau (the new woman), das neue Auto (the new car). Example: "Der neue Kollege heißt Tom" (The new colleague is called Tom).',
      explanationTr:
        'Belirli tanımlıktan sonra Nominativ\'de sıfat genellikle "-e" ile biter: der neue Mann, die neue Frau, das neue Auto. Örnek: "Der neue Kollege heißt Tom" (Yeni meslektaş Tom adında).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit9Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der ___ Kollege heißt Tom. (neu)', options: ['neue', 'neuer', 'neuen', 'neues'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Nominativ maskulin nach "der": neue.',
      },
      {
        lessonId: a2Unit9Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die ___ Frau wohnt hier. (neu)' },
        correctAnswer: { accepted: ['neue'] },
        explanation: 'Nominativ feminin nach "die": neue.',
      },
    ],
  })

  const a2Unit9Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit9.id,
      order: 2,
      grammarTopic: 'Adjektivendungen im Akkusativ (bestimmter Artikel)',
      explanationDe:
        'Im Akkusativ ändert sich die Adjektivendung nur beim maskulinen Artikel zu "-en": den neuen Mann. Feminin und neutral bleiben wie im Nominativ: die neue Frau, das neue Auto. Beispiel: "Ich sehe den neuen Kollegen."',
      explanationEn:
        'In the accusative, the adjective ending changes to "-en" only with the masculine article: den neuen Mann (the new man). Feminine and neuter stay like the nominative: die neue Frau, das neue Auto. Example: "Ich sehe den neuen Kollegen" (I see the new colleague).',
      explanationTr:
        'Akkusativ\'de sıfat eki sadece eril tanımlıkla "-en" olur: den neuen Mann. Dişil ve nötr Nominativ\'deki gibi kalır: die neue Frau, das neue Auto. Örnek: "Ich sehe den neuen Kollegen" (Yeni meslektaşı görüyorum).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit9Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich sehe den ___ Kollegen. (neu, Akkusativ)', options: ['neuen', 'neue', 'neuer', 'neues'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Akkusativ maskulin: neuen.',
      },
      {
        lessonId: a2Unit9Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich kaufe die ___ Tasche. (neu, Akkusativ feminin)' },
        correctAnswer: { accepted: ['neue'] },
        explanation: 'Akkusativ feminin bleibt wie Nominativ: neue.',
      },
    ],
  })

  const a2Unit9Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit9.id,
      order: 3,
      grammarTopic: 'Adjektivdeklination: feminin, neutral, Plural',
      explanationDe:
        'Feminin und neutral haben im Nominativ und Akkusativ die gleiche Adjektivendung "-e": die neue Frau, das neue Auto. Im Plural endet das Adjektiv nach "die" auf "-en": die neuen Autos. Beispiel: "Die neuen Autos sind teuer."',
      explanationEn:
        'Feminine and neuter have the same adjective ending "-e" in both nominative and accusative: die neue Frau, das neue Auto. In the plural, the adjective ends in "-en" after "die": die neuen Autos. Example: "Die neuen Autos sind teuer" (The new cars are expensive).',
      explanationTr:
        'Dişil ve nötr, Nominativ ve Akkusativ\'de aynı "-e" sıfat ekini alır: die neue Frau, das neue Auto. Çoğulda "die"den sonra sıfat "-en" ile biter: die neuen Autos. Örnek: "Die neuen Autos sind teuer" (Yeni arabalar pahalı).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit9Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die ___ Autos sind teuer. (neu, Plural)', options: ['neuen', 'neue', 'neuer', 'neues'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Plural nach "die": neuen.',
      },
      {
        lessonId: a2Unit9Lesson3.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['der neue Mann', 'das neue Auto', 'die neuen Autos'], rights: ['the new cars', 'the new man', 'the new car'] },
        correctAnswer: {
          pairs: [
            { left: 'der neue Mann', right: 'the new man' },
            { left: 'das neue Auto', right: 'the new car' },
            { left: 'die neuen Autos', right: 'the new cars' },
          ],
        },
        explanation: 'Adjektivendungen: der neue Mann (Singular mask.), das neue Auto (Singular neutr.), die neuen Autos (Plural).',
      },
    ],
  })

  const a2Unit9Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit9.id,
      order: 4,
      grammarTopic: 'Übung: Adjektivdeklination in Sätzen',
      explanationDe:
        'Wiederholung: Nominativ maskulin/neutral = "-e", Akkusativ maskulin = "-en", alle anderen bleiben "-e" (Singular) oder "-en" (Plural). Beispiel: "Der alte Baum steht im Garten. Ich sehe den alten Baum."',
      explanationEn:
        'Review: nominative masculine/neuter = "-e", accusative masculine = "-en", everything else stays "-e" (singular) or "-en" (plural). Example: "Der alte Baum steht im Garten. Ich sehe den alten Baum" (The old tree stands in the garden. I see the old tree).',
      explanationTr:
        'Tekrar: Nominativ eril/nötr = "-e", Akkusativ eril = "-en", diğerleri "-e" (tekil) ya da "-en" (çoğul) olarak kalır. Örnek: "Der alte Baum steht im Garten. Ich sehe den alten Baum" (Yaşlı ağaç bahçede duruyor. Yaşlı ağacı görüyorum).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit9Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich sehe den ___ Baum. (alt, Akkusativ)' },
        correctAnswer: { accepted: ['alten'] },
        explanation: 'Akkusativ maskulin: alten.',
      },
      {
        lessonId: a2Unit9Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'The old tree stands in the garden' (mit 'stehen')?" },
        correctAnswer: { accepted: ['der alte baum steht im garten'] },
        explanation: '"Der alte Baum steht im Garten" bedeutet "The old tree stands in the garden".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit9Lesson1.id, word: 'neu', translationEn: 'new', translationTr: 'yeni', exampleSentence: 'Der neue Kollege heißt Tom.' },
      { lessonId: a2Unit9Lesson1.id, word: 'der Kollege', translationEn: 'the colleague', translationTr: 'meslektaş', exampleSentence: 'Der neue Kollege heißt Tom.' },
      { lessonId: a2Unit9Lesson2.id, word: 'die Tasche', translationEn: 'the bag', translationTr: 'çanta', exampleSentence: 'Ich kaufe die neue Tasche.' },
      { lessonId: a2Unit9Lesson2.id, word: 'kennenlernen', translationEn: 'to get to know / meet', translationTr: 'tanışmak', exampleSentence: 'Ich möchte den neuen Kollegen kennenlernen.' },
      { lessonId: a2Unit9Lesson3.id, word: 'das Auto', translationEn: 'the car', translationTr: 'araba', exampleSentence: 'Die neuen Autos sind teuer.' },
      { lessonId: a2Unit9Lesson3.id, word: 'billig', translationEn: 'cheap', translationTr: 'ucuz', exampleSentence: 'Das alte Auto war billig.' },
      { lessonId: a2Unit9Lesson4.id, word: 'der Baum', translationEn: 'the tree', translationTr: 'ağaç', exampleSentence: 'Der alte Baum steht im Garten.' },
      { lessonId: a2Unit9Lesson4.id, word: 'der Garten', translationEn: 'the garden', translationTr: 'bahçe', exampleSentence: 'Der Baum steht im Garten.' },
    ],
  })

  // --- A2 Unit 10: Reflexive Verben (4 lessons) ---
  const a2Unit10 = await prisma.unit.create({
    data: { levelId: a2.id, order: 10, titleDe: 'Reflexive Verben', titleEn: 'Reflexive Verbs', titleTr: 'Dönüşlü Fiiller' },
  })

  const a2Unit10Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit10.id,
      order: 1,
      grammarTopic: 'Reflexivpronomen im Akkusativ',
      explanationDe:
        'Reflexivpronomen im Akkusativ: mich, dich, sich, uns, euch, sich. Sie stehen bei reflexiven Verben: "Ich wasche mich." "Er freut sich."',
      explanationEn:
        'Accusative reflexive pronouns: mich, dich, sich, uns, euch, sich. They are used with reflexive verbs: "Ich wasche mich" (I wash myself). "Er freut sich" (He is happy).',
      explanationTr:
        'Akkusativ dönüşlü zamirler: mich, dich, sich, uns, euch, sich. Dönüşlü fiillerle kullanılır: "Ich wasche mich." (Kendimi yıkarım.) "Er freut sich." (Sevinir.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit10Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich wasche ___ jeden Morgen.', options: ['mich', 'dich', 'sich', 'uns'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" benutzt man "mich".',
      },
      {
        lessonId: a2Unit10Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er freut ___ über das Geschenk.' },
        correctAnswer: { accepted: ['sich'] },
        explanation: 'Mit "er" benutzt man "sich".',
      },
    ],
  })

  const a2Unit10Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit10.id,
      order: 2,
      grammarTopic: 'Häufige reflexive Verben',
      explanationDe:
        'Häufige reflexive Verben: sich freuen (über/auf), sich interessieren (für), sich fühlen. Beispiel: "Ich interessiere mich für Musik." "Ich fühle mich gut."',
      explanationEn:
        'Common reflexive verbs: sich freuen (über/auf, to be happy about / look forward to), sich interessieren (für, to be interested in), sich fühlen (to feel). Example: "Ich interessiere mich für Musik" (I\'m interested in music). "Ich fühle mich gut" (I feel good).',
      explanationTr:
        'Yaygın dönüşlü fiiller: sich freuen (über/auf, sevinmek/dört gözle beklemek), sich interessieren (für, ilgilenmek), sich fühlen (hissetmek). Örnek: "Ich interessiere mich für Musik." "Ich fühle mich gut."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit10Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich interessiere ___ für Musik.', options: ['mich', 'dich', 'sich', 'euch'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" benutzt man "mich".',
      },
      {
        lessonId: a2Unit10Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Wie fühlst du ___ heute?' },
        correctAnswer: { accepted: ['dich'] },
        explanation: 'Mit "du" benutzt man "dich".',
      },
    ],
  })

  const a2Unit10Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit10.id,
      order: 3,
      grammarTopic: 'Reflexivpronomen im Dativ',
      explanationDe:
        'Bei manchen reflexiven Verben steht das Reflexivpronomen im Dativ, oft mit einem zusätzlichen Akkusativobjekt: mir, dir, sich, uns, euch, sich. Beispiel: "Ich kaufe mir ein neues Handy." "Ich stelle mir das vor."',
      explanationEn:
        'With some reflexive verbs, the reflexive pronoun is in the dative, often with an additional accusative object: mir, dir, sich, uns, euch, sich. Example: "Ich kaufe mir ein neues Handy" (I\'m buying myself a new phone). "Ich stelle mir das vor" (I imagine that).',
      explanationTr:
        'Bazı dönüşlü fiillerde dönüşlü zamir Dativ\'dedir, genellikle ek bir Akkusativ nesnesiyle birlikte: mir, dir, sich, uns, euch, sich. Örnek: "Ich kaufe mir ein neues Handy." "Ich stelle mir das vor."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit10Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich kaufe ___ ein neues Handy.', options: ['mir', 'mich', 'dir', 'sich'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" + Akkusativobjekt benutzt man den Dativ "mir".',
      },
      {
        lessonId: a2Unit10Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Kannst du ___ das vorstellen? (du, Dativ)' },
        correctAnswer: { accepted: ['dir'] },
        explanation: 'Mit "du" benutzt man "dir".',
      },
    ],
  })

  const a2Unit10Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit10.id,
      order: 4,
      grammarTopic: 'Übung: Reflexive Verben im Alltag',
      explanationDe:
        'Reflexive Verben beschreiben oft tägliche Routinen und Gefühle: sich duschen, sich anziehen, sich entspannen. Beispiel: "Ich dusche mich und ziehe mich an."',
      explanationEn:
        'Reflexive verbs often describe daily routines and feelings: sich duschen (to shower), sich anziehen (to get dressed), sich entspannen (to relax). Example: "Ich dusche mich und ziehe mich an" (I shower and get dressed).',
      explanationTr:
        'Dönüşlü fiiller genellikle günlük rutinleri ve duyguları anlatır: sich duschen (duş almak), sich anziehen (giyinmek), sich entspannen (rahatlamak). Örnek: "Ich dusche mich und ziehe mich an."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit10Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['mich', 'jeden', 'dusche', 'ich', 'Morgen'] },
        correctAnswer: { order: ['ich', 'dusche', 'mich', 'jeden', 'Morgen'] },
        explanation: 'Reihenfolge: Subjekt, Verb, Reflexivpronomen, Zeitangabe.',
      },
      {
        lessonId: a2Unit10Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I relax on the weekend' (mit 'sich entspannen')?" },
        correctAnswer: { accepted: ['ich entspanne mich am wochenende'] },
        explanation: '"Ich entspanne mich am Wochenende" bedeutet "I relax on the weekend".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit10Lesson1.id, word: 'sich waschen', translationEn: 'to wash oneself', translationTr: 'yıkanmak', exampleSentence: 'Ich wasche mich jeden Morgen.' },
      { lessonId: a2Unit10Lesson1.id, word: 'das Geschenk', translationEn: 'the gift', translationTr: 'hediye', exampleSentence: 'Er freut sich über das Geschenk.' },
      { lessonId: a2Unit10Lesson2.id, word: 'sich interessieren', translationEn: 'to be interested (in)', translationTr: 'ilgilenmek', exampleSentence: 'Ich interessiere mich für Musik.' },
      { lessonId: a2Unit10Lesson2.id, word: 'die Musik', translationEn: 'music', translationTr: 'müzik', exampleSentence: 'Ich interessiere mich für Musik.' },
      { lessonId: a2Unit10Lesson3.id, word: 'das Handy', translationEn: 'the mobile phone', translationTr: 'cep telefonu', exampleSentence: 'Ich kaufe mir ein neues Handy.' },
      { lessonId: a2Unit10Lesson3.id, word: 'sich vorstellen', translationEn: 'to imagine', translationTr: 'hayal etmek', exampleSentence: 'Ich kann mir das gut vorstellen.' },
      { lessonId: a2Unit10Lesson4.id, word: 'sich entspannen', translationEn: 'to relax', translationTr: 'rahatlamak', exampleSentence: 'Ich entspanne mich am Wochenende.' },
      { lessonId: a2Unit10Lesson4.id, word: 'das Wochenende', translationEn: 'the weekend', translationTr: 'hafta sonu', exampleSentence: 'Ich entspanne mich am Wochenende.' },
    ],
  })

  // --- A2 Unit 11: Zukunft mit "werden" (4 lessons) ---
  const a2Unit11 = await prisma.unit.create({
    data: { levelId: a2.id, order: 11, titleDe: 'Zukunft mit "werden"', titleEn: 'Future with "werden"', titleTr: '"werden" ile Gelecek Zaman' },
  })

  const a2Unit11Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit11.id,
      order: 1,
      grammarTopic: "Futur I: Bildung mit 'werden' + Infinitiv",
      explanationDe:
        'Futur I bildet man mit "werden" (konjugiert) + Infinitiv am Satzende: ich werde, du wirst, er wird, wir werden, ihr werdet, sie werden. Beispiel: "Ich werde morgen ins Kino gehen."',
      explanationEn:
        'Futur I is formed with "werden" (conjugated) + infinitive at the end of the sentence: ich werde, du wirst, er wird, wir werden, ihr werdet, sie werden. Example: "Ich werde morgen ins Kino gehen" (I will go to the cinema tomorrow).',
      explanationTr:
        'Futur I, "werden" (çekimli) + cümle sonunda mastar ile kurulur: ich werde, du wirst, er wird, wir werden, ihr werdet, sie werden. Örnek: "Ich werde morgen ins Kino gehen" (Yarın sinemaya gideceğim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit11Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ morgen ins Kino gehen.', options: ['werde', 'wirst', 'wird', 'werdet'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" benutzt man "werde".',
      },
      {
        lessonId: a2Unit11Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er ___ nächstes Jahr nach Spanien reisen. (werden)' },
        correctAnswer: { accepted: ['wird'] },
        explanation: 'Mit "er" benutzt man "wird".',
      },
    ],
  })

  const a2Unit11Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit11.id,
      order: 2,
      grammarTopic: 'Futur I für Vorhersagen und Vermutungen',
      explanationDe:
        'Futur I benutzt man oft für Vorhersagen und Vermutungen über die Zukunft, manchmal mit "wohl" oder "wahrscheinlich": "Es wird morgen wohl regnen." "Die Preise werden wahrscheinlich steigen."',
      explanationEn:
        'Futur I is often used for predictions and assumptions about the future, sometimes with "wohl" or "wahrscheinlich" (probably): "Es wird morgen wohl regnen" (It will probably rain tomorrow). "Die Preise werden wahrscheinlich steigen" (Prices will probably rise).',
      explanationTr:
        'Futur I genellikle gelecekle ilgili tahmin ve varsayımlar için kullanılır, bazen "wohl" ya da "wahrscheinlich" (muhtemelen) ile: "Es wird morgen wohl regnen." "Die Preise werden wahrscheinlich steigen."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit11Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Es ___ morgen wohl regnen.', options: ['wird', 'werde', 'wirst', 'werdet'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "es" benutzt man "wird".',
      },
      {
        lessonId: a2Unit11Lesson2.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['steigen', 'werden', 'Preise', 'die'] },
        correctAnswer: { order: ['die', 'Preise', 'werden', 'steigen'] },
        explanation: 'Reihenfolge: Subjekt, "werden", Infinitiv am Ende.',
      },
    ],
  })

  const a2Unit11Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit11.id,
      order: 3,
      grammarTopic: 'Futur I vs. Präsens mit Zeitangabe',
      explanationDe:
        'Für geplante Zukunft benutzt man oft einfach das Präsens mit einer Zeitangabe: "Ich fliege nächste Woche nach Rom." Futur I betont stärker eine Vorhersage oder Absicht: "Ich werde nächste Woche nach Rom fliegen."',
      explanationEn:
        'For planned future events, German often simply uses the present tense with a time expression: "Ich fliege nächste Woche nach Rom" (I\'m flying to Rome next week). Futur I emphasizes a prediction or intention more strongly: "Ich werde nächste Woche nach Rom fliegen" (I will fly to Rome next week).',
      explanationTr:
        'Planlanmış gelecek olaylar için Almanca genellikle zaman ifadesiyle birlikte şimdiki zamanı kullanır: "Ich fliege nächste Woche nach Rom." Futur I ise bir tahmin ya da niyeti daha güçlü vurgular: "Ich werde nächste Woche nach Rom fliegen."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit11Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ nächste Woche nach Rom. (Präsens für Zukunft)', options: ['fliege', 'werde fliegen', 'geflogen', 'fliegen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Präsens + Zeitangabe drückt auch die Zukunft aus.',
      },
      {
        lessonId: a2Unit11Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich ___ nächste Woche nach Rom fliegen. (werden, Betonung der Absicht)' },
        correctAnswer: { accepted: ['werde'] },
        explanation: 'Futur I betont die Absicht: werde fliegen.',
      },
    ],
  })

  const a2Unit11Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit11.id,
      order: 4,
      grammarTopic: 'Übung: Pläne und Vorhersagen im Futur I',
      explanationDe:
        'Kombiniere Futur I mit Zeitangaben, um über Pläne und Vorhersagen zu sprechen: "Nächstes Jahr werde ich mehr Sport machen." Bei vorangestellter Zeitangabe steht "werde" direkt danach.',
      explanationEn:
        'Combine Futur I with time expressions to talk about plans and predictions: "Nächstes Jahr werde ich mehr Sport machen" (Next year I will do more sports). When the time expression comes first, "werde" comes right after it.',
      explanationTr:
        'Planlar ve tahminler hakkında konuşmak için Futur I\'i zaman ifadeleriyle birleştir: "Nächstes Jahr werde ich mehr Sport machen." Zaman ifadesi öne alındığında "werde" hemen ardından gelir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit11Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['ich', 'Jahr', 'werde', 'machen', 'nächstes', 'mehr', 'Sport'] },
        correctAnswer: { order: ['nächstes', 'Jahr', 'werde', 'ich', 'mehr', 'Sport', 'machen'] },
        explanation: 'Zeitangabe zuerst, dann "werde", dann Subjekt, dann Rest, Infinitiv am Ende.',
      },
      {
        lessonId: a2Unit11Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I will do more sports' (mit 'werden')?" },
        correctAnswer: { accepted: ['ich werde mehr sport machen'] },
        explanation: '"Ich werde mehr Sport machen" bedeutet "I will do more sports".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit11Lesson1.id, word: 'reisen', translationEn: 'to travel', translationTr: 'seyahat etmek', exampleSentence: 'Er wird nächstes Jahr nach Spanien reisen.' },
      { lessonId: a2Unit11Lesson1.id, word: 'das Kino', translationEn: 'the cinema', translationTr: 'sinema', exampleSentence: 'Ich werde morgen ins Kino gehen.' },
      { lessonId: a2Unit11Lesson2.id, word: 'steigen', translationEn: 'to rise / climb', translationTr: 'yükselmek', exampleSentence: 'Die Preise werden wahrscheinlich steigen.' },
      { lessonId: a2Unit11Lesson2.id, word: 'wahrscheinlich', translationEn: 'probably', translationTr: 'muhtemelen', exampleSentence: 'Die Preise werden wahrscheinlich steigen.' },
      { lessonId: a2Unit11Lesson3.id, word: 'fliegen', translationEn: 'to fly', translationTr: 'uçmak', exampleSentence: 'Ich fliege nächste Woche nach Rom.' },
      { lessonId: a2Unit11Lesson3.id, word: 'die Absicht', translationEn: 'the intention', translationTr: 'niyet', exampleSentence: 'Futur I betont die Absicht.' },
      { lessonId: a2Unit11Lesson4.id, word: 'der Sport', translationEn: 'sport', translationTr: 'spor', exampleSentence: 'Ich werde mehr Sport machen.' },
      { lessonId: a2Unit11Lesson4.id, word: 'der Plan', translationEn: 'the plan', translationTr: 'plan', exampleSentence: 'Das ist mein Plan für nächstes Jahr.' },
    ],
  })

  // --- A2 Unit 12: Beruf & Bewerbung (4 lessons) ---
  const a2Unit12 = await prisma.unit.create({
    data: { levelId: a2.id, order: 12, titleDe: 'Beruf & Bewerbung', titleEn: 'Profession & Application', titleTr: 'Meslek & İş Başvurusu' },
  })

  const a2Unit12Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit12.id,
      order: 1,
      grammarTopic: 'Berufe: Wortschatz',
      explanationDe:
        'Viele Berufsbezeichnungen haben eine maskuline und eine feminine Form, oft mit der Endung "-in": der Lehrer / die Lehrerin, der Arzt / die Ärztin. Beispiel: "Er ist Lehrer. Sie ist Ärztin."',
      explanationEn:
        'Many profession names have a masculine and a feminine form, often with the ending "-in": der Lehrer / die Lehrerin (teacher), der Arzt / die Ärztin (doctor). Example: "Er ist Lehrer. Sie ist Ärztin" (He is a teacher. She is a doctor).',
      explanationTr:
        'Birçok meslek adının eril ve dişil bir biçimi vardır, genellikle "-in" ekiyle: der Lehrer / die Lehrerin (öğretmen), der Arzt / die Ärztin (doktor). Örnek: "Er ist Lehrer. Sie ist Ärztin" (O bir öğretmen. O bir doktor).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit12Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Meine Schwester ist ___. Sie arbeitet im Krankenhaus.', options: ['Ärztin', 'Lehrer', 'Kellner', 'Verkäufer'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Im Krankenhaus arbeitet eine Ärztin.',
      },
      {
        lessonId: a2Unit12Lesson1.id,
        order: 2,
        type: 'MATCHING',
        data: {
          lefts: ['der Lehrer', 'die Ärztin', 'der Kellner'],
          rights: ['im Krankenhaus', 'im Restaurant', 'in der Schule'],
        },
        correctAnswer: {
          pairs: [
            { left: 'der Lehrer', right: 'in der Schule' },
            { left: 'die Ärztin', right: 'im Krankenhaus' },
            { left: 'der Kellner', right: 'im Restaurant' },
          ],
        },
        explanation: 'Der Lehrer arbeitet in der Schule, die Ärztin im Krankenhaus, der Kellner im Restaurant.',
      },
    ],
  })

  const a2Unit12Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit12.id,
      order: 2,
      grammarTopic: 'Über den Beruf sprechen',
      explanationDe:
        'Um über den eigenen Beruf zu sprechen, benutzt man "Ich arbeite als + Beruf" oder "Ich bin von Beruf + Beruf" (ohne Artikel). Beispiel: "Ich arbeite als Ingenieur." "Ich bin von Beruf Verkäuferin."',
      explanationEn:
        'To talk about your own profession, use "Ich arbeite als + profession" or "Ich bin von Beruf + profession" (without an article). Example: "Ich arbeite als Ingenieur" (I work as an engineer). "Ich bin von Beruf Verkäuferin" (I am a saleswoman by profession).',
      explanationTr:
        'Kendi mesleğinden bahsetmek için "Ich arbeite als + meslek" ya da "Ich bin von Beruf + meslek" (artikelsiz) kullanılır. Örnek: "Ich arbeite als Ingenieur." "Ich bin von Beruf Verkäuferin."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit12Lesson2.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich arbeite ___ Ingenieur.' },
        correctAnswer: { accepted: ['als'] },
        explanation: '"Arbeiten als" + Beruf ohne Artikel.',
      },
      {
        lessonId: a2Unit12Lesson2.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['bin', 'ich', 'Beruf', 'von', 'Verkäuferin'] },
        correctAnswer: { order: ['ich', 'bin', 'von', 'Beruf', 'Verkäuferin'] },
        explanation: 'Reihenfolge: Subjekt, Verb, "von Beruf", Berufsbezeichnung.',
      },
    ],
  })

  const a2Unit12Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit12.id,
      order: 3,
      grammarTopic: 'Lebenslauf & Bewerbung: Wortschatz',
      explanationDe:
        'Wichtige Wörter für Lebenslauf und Bewerbung: die Erfahrung, die Bewerbung, das Vorstellungsgespräch. Beispiel: "Ich schreibe eine Bewerbung. Ich habe drei Jahre Erfahrung."',
      explanationEn:
        'Important words for a résumé and job application: die Erfahrung (experience), die Bewerbung (application), das Vorstellungsgespräch (job interview). Example: "Ich schreibe eine Bewerbung. Ich habe drei Jahre Erfahrung" (I am writing an application. I have three years of experience).',
      explanationTr:
        'Özgeçmiş ve iş başvurusu için önemli kelimeler: die Erfahrung (deneyim), die Bewerbung (başvuru), das Vorstellungsgespräch (iş görüşmesi). Örnek: "Ich schreibe eine Bewerbung. Ich habe drei Jahre Erfahrung" (Bir başvuru yazıyorum. Üç yıllık deneyimim var).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit12Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich schreibe eine ___ für die neue Stelle.', options: ['Bewerbung', 'Erfahrung', 'Frage', 'Antwort'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Man schreibt eine Bewerbung für eine Stelle.',
      },
      {
        lessonId: a2Unit12Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I have three years of experience' (mit 'Erfahrung')?" },
        correctAnswer: { accepted: ['ich habe drei jahre erfahrung'] },
        explanation: '"Ich habe drei Jahre Erfahrung" bedeutet "I have three years of experience".',
      },
    ],
  })

  const a2Unit12Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit12.id,
      order: 4,
      grammarTopic: 'Im Vorstellungsgespräch: Fragen und Antworten',
      explanationDe:
        'Im Vorstellungsgespräch benutzt man oft Modalverben in der höflichen "Sie"-Form: "Können Sie mir Ihre Stärken beschreiben?" "Wann können Sie beginnen?" Wiederholung: das Modalverb steht konjugiert an Position 2, der Infinitiv am Satzende.',
      explanationEn:
        'Job interviews often use modal verbs in the polite "Sie" form: "Können Sie mir Ihre Stärken beschreiben?" (Can you describe your strengths?) "Wann können Sie beginnen?" (When can you start?) Review: the conjugated modal verb is in position 2, the infinitive at the end of the sentence.',
      explanationTr:
        'İş görüşmelerinde genellikle saygılı "Sie" biçiminde kip fiilleri kullanılır: "Können Sie mir Ihre Stärken beschreiben?" (Güçlü yönlerinizi anlatabilir misiniz?) "Wann können Sie beginnen?" (Ne zaman başlayabilirsiniz?) Tekrar: çekimli kip fiili 2. sırada, mastar cümle sonunda yer alır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit12Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ Sie mir bitte Ihre Stärken beschreiben?', options: ['Können', 'Kann', 'Kannst', 'Könnt'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit der höflichen Anrede "Sie" benutzt man "Können".',
      },
      {
        lessonId: a2Unit12Lesson4.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['beginnen', 'Sie', 'wann', 'können'] },
        correctAnswer: { order: ['wann', 'können', 'Sie', 'beginnen'] },
        explanation: 'Reihenfolge: Fragewort, Modalverb, Subjekt, Infinitiv am Ende.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit12Lesson1.id, word: 'der Lehrer', translationEn: 'the teacher', translationTr: 'öğretmen', exampleSentence: 'Der Lehrer arbeitet in der Schule.' },
      { lessonId: a2Unit12Lesson1.id, word: 'die Ärztin', translationEn: 'the (female) doctor', translationTr: 'kadın doktor', exampleSentence: 'Die Ärztin arbeitet im Krankenhaus.' },
      { lessonId: a2Unit12Lesson2.id, word: 'der Beruf', translationEn: 'the profession / job', translationTr: 'meslek', exampleSentence: 'Was bist du von Beruf?' },
      { lessonId: a2Unit12Lesson2.id, word: 'verdienen', translationEn: 'to earn', translationTr: 'kazanmak', exampleSentence: 'Ich verdiene gut in meinem Beruf.' },
      { lessonId: a2Unit12Lesson3.id, word: 'die Erfahrung', translationEn: 'the experience', translationTr: 'deneyim', exampleSentence: 'Ich habe drei Jahre Erfahrung.' },
      { lessonId: a2Unit12Lesson3.id, word: 'die Bewerbung', translationEn: 'the application', translationTr: 'iş başvurusu', exampleSentence: 'Ich schreibe eine Bewerbung für die neue Stelle.' },
      { lessonId: a2Unit12Lesson4.id, word: 'das Vorstellungsgespräch', translationEn: 'the job interview', translationTr: 'iş görüşmesi', exampleSentence: 'Ich habe morgen ein Vorstellungsgespräch.' },
      { lessonId: a2Unit12Lesson4.id, word: 'die Stärke', translationEn: 'the strength', translationTr: 'güçlü yön', exampleSentence: 'Können Sie mir Ihre Stärken beschreiben?' },
    ],
  })

  // --- A2 Unit 13: Ordinalzahlen & Datumsangaben (4 lessons) ---
  const a2Unit13 = await prisma.unit.create({
    data: { levelId: a2.id, order: 13, titleDe: 'Ordinalzahlen & Datumsangaben', titleEn: 'Ordinal Numbers & Dates', titleTr: 'Sıra Sayıları ve Tarihler' },
  })

  const a2Unit13Lesson1 = await prisma.lesson.create({
    data: {
      unitId: a2Unit13.id,
      order: 1,
      grammarTopic: 'Ordinalzahlen (1.-19.)',
      explanationDe:
        'Ordinalzahlen bis 19 werden mit -te gebildet: "der dritte" (3.), "der siebte" (7.). Unregelmäßig: "der erste" (1.), "der dritte" (3.), "der siebte" (7.).',
      explanationEn:
        'Ordinal numbers up to 19 are formed with -te: "der dritte" (the third), "der siebte" (the seventh). Irregular: "der erste" (first), "der dritte" (third), "der siebte" (seventh).',
      explanationTr:
        '19\'a kadar sıra sayıları -te ekiyle yapılır: "der dritte" (üçüncü), "der siebte" (yedinci). Düzensiz: "der erste" (birinci), "der dritte" (üçüncü), "der siebte" (yedinci).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit13Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wie heißt die Ordinalzahl für "3" (der ___)?', options: ['dreite', 'dritte', 'drittste', 'dreiste'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"3" ist unregelmäßig: der dritte.',
      },
      {
        lessonId: a2Unit13Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das ist mein ___ (1.) Deutschkurs.' },
        correctAnswer: { accepted: ['erster'] },
        explanation: '"1." ist unregelmäßig: erster.',
      },
    ],
  })

  const a2Unit13Lesson2 = await prisma.lesson.create({
    data: {
      unitId: a2Unit13.id,
      order: 2,
      grammarTopic: 'Ordinalzahlen (20.+)',
      explanationDe:
        'Ab 20 werden Ordinalzahlen mit -ste gebildet: "der zwanzigste" (20.), "der einundzwanzigste" (21.).',
      explanationEn:
        'From 20 onward, ordinal numbers are formed with -ste: "der zwanzigste" (the twentieth), "der einundzwanzigste" (the twenty-first).',
      explanationTr:
        '20\'den itibaren sıra sayıları -ste ekiyle yapılır: "der zwanzigste" (yirminci), "der einundzwanzigste" (yirmi birinci).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit13Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wie heißt die Ordinalzahl für "20" (der ___)?', options: ['zwanzigte', 'zwanzigste', 'zwanzste', 'zwanzigerste'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Ab 20 benutzt man -ste: der zwanzigste.',
      },
      {
        lessonId: a2Unit13Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'the thirty-first' (der ___)?" },
        correctAnswer: { accepted: ['einunddreißigste', 'der einunddreißigste'] },
        explanation: '"31." ist "der einunddreißigste".',
      },
    ],
  })

  const a2Unit13Lesson3 = await prisma.lesson.create({
    data: {
      unitId: a2Unit13.id,
      order: 3,
      grammarTopic: 'Das Datum',
      explanationDe:
        'Das Datum bildet man mit "am" + Ordinalzahl + Monat: "Ich habe am dritten Mai Geburtstag." Schriftlich: "3. Mai" (mit Punkt).',
      explanationEn:
        'Dates are formed with "am" + ordinal number + month: "Ich habe am dritten Mai Geburtstag" (My birthday is on May 3rd). In writing: "3. Mai" (with a period).',
      explanationTr:
        'Tarih "am" + sıra sayısı + ay ile kurulur: "Ich habe am dritten Mai Geburtstag" (Doğum günüm 3 Mayıs\'ta). Yazılışta: "3. Mai" (noktayla).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit13Lesson3.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich habe ___ dritten Mai Geburtstag.' },
        correctAnswer: { accepted: ['am'] },
        explanation: 'Datum mit "am" + Ordinalzahl.',
      },
      {
        lessonId: a2Unit13Lesson3.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['1. Januar', '3. Mai', '20. Juli'], rights: ['am zwanzigsten Juli', 'am ersten Januar', 'am dritten Mai'] },
        correctAnswer: {
          pairs: [
            { left: '1. Januar', right: 'am ersten Januar' },
            { left: '3. Mai', right: 'am dritten Mai' },
            { left: '20. Juli', right: 'am zwanzigsten Juli' },
          ],
        },
        explanation: 'Datum: "am" + Ordinalzahl + Monat.',
      },
    ],
  })

  const a2Unit13Lesson4 = await prisma.lesson.create({
    data: {
      unitId: a2Unit13.id,
      order: 4,
      grammarTopic: 'Übung: Geburtstage & Termine',
      explanationDe:
        'Wiederholung: "Wann hast du Geburtstag?" "Ich habe am zehnten Oktober Geburtstag." Auch für Termine: "Der Termin ist am fünfzehnten Juni."',
      explanationEn:
        'Review: "Wann hast du Geburtstag?" (When is your birthday?) "Ich habe am zehnten Oktober Geburtstag" (My birthday is on October 10th). Also for appointments: "Der Termin ist am fünfzehnten Juni" (The appointment is on June 15th).',
      explanationTr:
        'Tekrar: "Wann hast du Geburtstag?" (Doğum günün ne zaman?) "Ich habe am zehnten Oktober Geburtstag" (Doğum günüm 10 Ekim\'de). Randevular için de: "Der Termin ist am fünfzehnten Juni" (Randevu 15 Haziran\'da).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: a2Unit13Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['Geburtstag', 'zehnten', 'Oktober', 'am', 'ich', 'habe'] },
        correctAnswer: { order: ['ich', 'habe', 'am', 'zehnten', 'Oktober', 'Geburtstag'] },
        explanation: 'Wortstellung: Subjekt, Verb, "am" + Ordinalzahl + Monat, Objekt.',
      },
      {
        lessonId: a2Unit13Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'When is your birthday?'?" },
        correctAnswer: { accepted: ['wann hast du geburtstag'] },
        explanation: '"Wann hast du Geburtstag?" bedeutet "When is your birthday?"',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: a2Unit13Lesson1.id, word: 'der erste', translationEn: 'the first', translationTr: 'birinci', exampleSentence: 'Heute ist der erste Mai.' },
      { lessonId: a2Unit13Lesson1.id, word: 'der dritte', translationEn: 'the third', translationTr: 'üçüncü', exampleSentence: 'Er kommt am dritten Tag.' },
      { lessonId: a2Unit13Lesson2.id, word: 'der zwanzigste', translationEn: 'the twentieth', translationTr: 'yirminci', exampleSentence: 'Wir treffen uns am zwanzigsten Juli.' },
      { lessonId: a2Unit13Lesson2.id, word: 'zwischen', translationEn: 'between', translationTr: 'arasında', exampleSentence: 'Der Termin ist zwischen dem 10. und 15. Mai.' },
      { lessonId: a2Unit13Lesson3.id, word: 'der Geburtstag', translationEn: 'the birthday', translationTr: 'doğum günü', exampleSentence: 'Wann hast du Geburtstag?' },
      { lessonId: a2Unit13Lesson3.id, word: 'der Monat', translationEn: 'the month', translationTr: 'ay', exampleSentence: 'Mai ist mein Lieblingsmonat.' },
      { lessonId: a2Unit13Lesson4.id, word: 'der Termin', translationEn: 'the appointment', translationTr: 'randevu', exampleSentence: 'Der Termin ist am fünfzehnten Juni.' },
      { lessonId: a2Unit13Lesson4.id, word: 'das Jahr', translationEn: 'the year', translationTr: 'yıl', exampleSentence: 'Nächstes Jahr fahre ich nach Deutschland.' },
    ],
  })

  // --- B1: Nebensätze (1 sample lesson) ---
  const b1Unit = await prisma.unit.create({
    data: { levelId: b1.id, order: 1, titleDe: 'Nebensätze', titleEn: 'Subordinate Clauses', titleTr: 'Yan Cümleler' },
  })
  const b1Lesson = await prisma.lesson.create({
    data: {
      unitId: b1Unit.id,
      order: 1,
      grammarTopic: "Nebensätze mit 'weil'",
      explanationDe: 'In "weil"-Sätzen steht das konjugierte Verb am Ende des Nebensatzes, z. B. "..., weil ich krank bin."',
      explanationEn: 'In "weil" (because) clauses, the conjugated verb moves to the end of the clause, e.g. "..., weil ich krank bin" (..., because I am sick).',
      explanationTr: '"Weil" (çünkü) cümlelerinde çekimli fiil cümlenin sonuna gider, örn. "..., weil ich krank bin" (..., çünkü hastayım).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich bleibe zu Hause, weil ich krank ___.', options: ['bin', 'ist', 'bist', 'sind'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "ich" benutzt man "bin".',
      },
      {
        lessonId: b1Lesson.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['bin', 'weil', 'krank', 'ich'] },
        correctAnswer: { order: ['weil', 'ich', 'krank', 'bin'] },
        explanation: 'Im Nebensatz steht das Verb am Ende: "weil ich krank bin".',
      },
    ],
  })

  const b1Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit.id,
      order: 2,
      grammarTopic: "Nebensätze mit 'dass'",
      explanationDe:
        'Nebensätze mit "dass" leiten eine indirekte Aussage oder Meinung ein; das konjugierte Verb steht am Ende des Nebensatzes, z. B. "Ich glaube, dass er Recht hat."',
      explanationEn:
        '"Dass" (that) clauses introduce a reported statement or opinion; the conjugated verb moves to the end of the clause, e.g. "Ich glaube, dass er Recht hat" (I believe that he is right).',
      explanationTr:
        '"Dass" (ki/-dığı) cümleleri aktarılan bir ifadeyi ya da görüşü tanıtır; çekimli fiil cümlenin sonuna gider, örn. "Ich glaube, dass er Recht hat" (Onun haklı olduğuna inanıyorum).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich glaube, dass er Recht ___.', options: ['hat', 'habe', 'haben', 'hast'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Im dass-Satz bleibt das Verb konjugiert und steht am Ende: "er hat".',
      },
      {
        lessonId: b1Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie sagt, dass sie morgen ___. (kommen)' },
        correctAnswer: { accepted: ['kommt'] },
        explanation: 'Mit "sie" (Einzahl) benutzt man im dass-Satz "kommt".',
      },
    ],
  })

  const b1Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit.id,
      order: 3,
      grammarTopic: "Nebensätze mit 'wenn'",
      explanationDe:
        'Nebensätze mit "wenn" drücken eine Bedingung oder ein wiederholtes Ereignis aus; das Verb steht am Ende, z. B. "Wenn es regnet, bleibe ich zu Hause."',
      explanationEn:
        '"Wenn" (if/when) clauses express a condition or a repeated event; the verb moves to the end, e.g. "Wenn es regnet, bleibe ich zu Hause" (If it rains, I stay home).',
      explanationTr:
        '"Wenn" (eğer/-dığında) cümleleri bir koşulu ya da tekrarlanan bir olayı ifade eder; fiil cümlenin sonuna gider, örn. "Wenn es regnet, bleibe ich zu Hause" (Yağmur yağarsa evde kalırım).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Lesson3.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['regnet', 'wenn', 'es'] },
        correctAnswer: { order: ['wenn', 'es', 'regnet'] },
        explanation: 'Im wenn-Satz steht das Verb am Ende: "wenn es regnet".',
      },
      {
        lessonId: b1Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Wenn es kalt ___, ziehe ich eine Jacke an. (sein)' },
        correctAnswer: { accepted: ['ist'] },
        explanation: 'Im wenn-Satz benutzt man für "es" die Form "ist".',
      },
    ],
  })

  const b1Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit.id,
      order: 4,
      grammarTopic: 'Wiederholung: weil/dass/wenn',
      explanationDe:
        'Wiederholung: "weil" nennt einen Grund, "dass" leitet eine Aussage ein, "wenn" nennt eine Bedingung. In allen drei Nebensätzen steht das Verb am Ende, z. B. "..., weil es regnet."',
      explanationEn:
        'Review: "weil" gives a reason, "dass" introduces a statement, "wenn" gives a condition. In all three subordinate clauses the verb goes to the end, e.g. "..., weil es regnet" (..., because it is raining).',
      explanationTr:
        'Tekrar: "weil" bir sebep bildirir, "dass" bir ifadeyi tanıtır, "wenn" bir koşul bildirir. Bu üç yan cümlede de fiil sona gider, örn. "..., weil es regnet" (..., çünkü yağmur yağıyor).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: {
          lefts: ['weil', 'dass', 'wenn'],
          rights: ['Bedingung', 'Grund', 'Aussage'],
        },
        correctAnswer: {
          pairs: [
            { left: 'weil', right: 'Grund' },
            { left: 'dass', right: 'Aussage' },
            { left: 'wenn', right: 'Bedingung' },
          ],
        },
        explanation: '"Weil" = Grund, "dass" = Aussage, "wenn" = Bedingung.',
      },
      {
        lessonId: b1Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welches Wort benutzt man, um einen Grund zu nennen: 'weil', 'dass' oder 'wenn'?" },
        correctAnswer: { accepted: ['weil'] },
        explanation: '"Weil" gibt einen Grund an.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Lesson.id, word: 'der Grund', translationEn: 'the reason', translationTr: 'sebep', exampleSentence: 'Der Grund für die Verspätung war der Stau.' },
      { lessonId: b1Lesson.id, word: 'die Erkältung', translationEn: 'the cold (illness)', translationTr: 'nezle', exampleSentence: 'Ich habe eine Erkältung und bleibe im Bett.' },
      { lessonId: b1Lesson2.id, word: 'glauben', translationEn: 'to believe', translationTr: 'inanmak', exampleSentence: 'Ich glaube, dass er Recht hat.' },
      { lessonId: b1Lesson2.id, word: 'die Meinung', translationEn: 'the opinion', translationTr: 'görüş', exampleSentence: 'Er sagt seine Meinung immer offen.' },
      { lessonId: b1Lesson3.id, word: 'regnen', translationEn: 'to rain', translationTr: 'yağmur yağmak', exampleSentence: 'Wenn es regnet, bleibe ich zu Hause.' },
      { lessonId: b1Lesson3.id, word: 'die Bedingung', translationEn: 'the condition', translationTr: 'koşul', exampleSentence: 'Das ist eine wichtige Bedingung.' },
      { lessonId: b1Lesson4.id, word: 'wiederholen', translationEn: 'to repeat / review', translationTr: 'tekrar etmek', exampleSentence: 'Wir wiederholen die Grammatik.' },
      { lessonId: b1Lesson4.id, word: 'die Ausrede', translationEn: 'the excuse', translationTr: 'bahane', exampleSentence: 'Das ist keine gute Ausrede.' },
    ],
  })

  // --- B1 Unit 2: Konjunktiv II (4 lessons) ---
  const b1Unit2 = await prisma.unit.create({
    data: { levelId: b1.id, order: 2, titleDe: 'Konjunktiv II', titleEn: 'Subjunctive II (Konjunktiv II)', titleTr: 'Konjunktiv II (Dilek Kipi II)' },
  })

  const b1Unit2Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit2.id,
      order: 1,
      grammarTopic: "Konjunktiv II mit 'würde' + Infinitiv",
      explanationDe:
        'Mit "würde" + Infinitiv drückt man höfliche Wünsche oder irreale Situationen aus, z. B. "Ich würde gern reisen."',
      explanationEn:
        '"Würde" + infinitive expresses polite wishes or unreal/hypothetical situations, e.g. "Ich würde gern reisen" (I would like to travel).',
      explanationTr:
        '"Würde" + mastar, kibar dilekleri ya da gerçek dışı durumları ifade eder, örn. "Ich würde gern reisen" (Seyahat etmek isterdim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit2Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ gern ins Kino gehen.', options: ['würde', 'werde', 'wurde', 'würden'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Würde" + Infinitiv für "ich" drückt einen Wunsch aus.',
      },
      {
        lessonId: b1Unit2Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie ___ gern nach Berlin reisen. (würde)' },
        correctAnswer: { accepted: ['würde'] },
        explanation: 'Mit "sie" (Einzahl) benutzt man "würde".',
      },
    ],
  })

  const b1Unit2Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit2.id,
      order: 2,
      grammarTopic: "Konjunktiv II von 'sein': wäre",
      explanationDe:
        'Konjunktiv II von "sein" ist "wäre" (ich wäre, du wärst, er/sie/es wäre...). Es drückt einen irrealen oder hypothetischen Zustand aus, z. B. "Ich wäre gern reich."',
      explanationEn:
        'The Konjunktiv II of "sein" is "wäre" (ich wäre, du wärst, er/sie/es wäre...). It expresses an unreal or hypothetical state, e.g. "Ich wäre gern reich" (I would like to be rich).',
      explanationTr:
        '"Sein" fiilinin Konjunktiv II hali "wäre"dir (ich wäre, du wärst, er/sie/es wäre...). Gerçek dışı ya da varsayımsal bir durumu ifade eder, örn. "Ich wäre gern reich" (Zengin olmak isterdim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit2Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ gern reich.', options: ['wäre', 'bin', 'war', 'werde'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Konjunktiv II von "sein" für "ich" ist "wäre".',
      },
      {
        lessonId: b1Unit2Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie lautet die Konjunktiv-II-Form von 'sein' für 'du'?" },
        correctAnswer: { accepted: ['wärst', 'du wärst'] },
        explanation: 'Konjunktiv II von "sein" für "du" ist "wärst".',
      },
    ],
  })

  const b1Unit2Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit2.id,
      order: 3,
      grammarTopic: "Konjunktiv II von 'haben': hätte",
      explanationDe:
        'Konjunktiv II von "haben" ist "hätte" (ich hätte, du hättest, er/sie/es hätte...). Man benutzt es für Wünsche, z. B. "Ich hätte gern mehr Freizeit."',
      explanationEn:
        'The Konjunktiv II of "haben" is "hätte" (ich hätte, du hättest, er/sie/es hätte...). It is used for wishes, e.g. "Ich hätte gern mehr Freizeit" (I would like to have more free time).',
      explanationTr:
        '"Haben" fiilinin Konjunktiv II hali "hätte"dir (ich hätte, du hättest, er/sie/es hätte...). Dilekler için kullanılır, örn. "Ich hätte gern mehr Freizeit" (Daha fazla boş zamanım olsun isterdim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit2Lesson3.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich ___ gern mehr Freizeit. (haben, Konjunktiv II)' },
        correctAnswer: { accepted: ['hätte'] },
        explanation: 'Konjunktiv II von "haben" für "ich" ist "hätte".',
      },
      {
        lessonId: b1Unit2Lesson3.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['hätte', 'gern', 'ich', 'Zeit'] },
        correctAnswer: { order: ['ich', 'hätte', 'gern', 'Zeit'] },
        explanation: 'Wortstellung: Subjekt, Verb, dann "gern" + Objekt.',
      },
    ],
  })

  const b1Unit2Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit2.id,
      order: 4,
      grammarTopic: 'Höfliche Bitten & Wünsche mit Konjunktiv II',
      explanationDe:
        'Konjunktiv II macht Bitten höflicher, z. B. "Könnten Sie mir bitte helfen?" statt "Können Sie mir helfen?"',
      explanationEn:
        'Konjunktiv II makes requests more polite, e.g. "Könnten Sie mir bitte helfen?" (Could you please help me?) instead of "Können Sie mir helfen?"',
      explanationTr:
        'Konjunktiv II, ricaları daha kibar yapar, örn. "Können Sie mir helfen?" yerine "Könnten Sie mir bitte helfen?" (Bana yardım edebilir misiniz, lütfen?)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit2Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ Sie mir bitte helfen?', options: ['Könnten', 'Können', 'Konnten', 'Kann'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Könnten" ist die höfliche Konjunktiv-II-Form von "können".',
      },
      {
        lessonId: b1Unit2Lesson4.id,
        order: 2,
        type: 'MATCHING',
        data: {
          lefts: ['können', 'mögen', 'dürfen'],
          rights: ['möchten', 'dürften', 'könnten'],
        },
        correctAnswer: {
          pairs: [
            { left: 'können', right: 'könnten' },
            { left: 'mögen', right: 'möchten' },
            { left: 'dürfen', right: 'dürften' },
          ],
        },
        explanation: 'Das sind die höflichen Konjunktiv-II-Formen von können, mögen, dürfen.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit2Lesson1.id, word: 'reisen', translationEn: 'to travel', translationTr: 'seyahat etmek', exampleSentence: 'Ich würde gern nach Italien reisen.' },
      { lessonId: b1Unit2Lesson1.id, word: 'mehr', translationEn: 'more', translationTr: 'daha fazla', exampleSentence: 'Ich möchte mehr Zeit haben.' },
      { lessonId: b1Unit2Lesson2.id, word: 'reich', translationEn: 'rich', translationTr: 'zengin', exampleSentence: 'Ich wäre gern reich.' },
      { lessonId: b1Unit2Lesson2.id, word: 'der Zustand', translationEn: 'the state / condition', translationTr: 'durum', exampleSentence: 'Das ist ein guter Zustand.' },
      { lessonId: b1Unit2Lesson3.id, word: 'die Freizeit', translationEn: 'the free time', translationTr: 'boş zaman', exampleSentence: 'Ich hätte gern mehr Freizeit.' },
      { lessonId: b1Unit2Lesson3.id, word: 'die Lust', translationEn: 'the desire / fancy', translationTr: 'istek', exampleSentence: 'Ich hätte Lust auf Kaffee.' },
      { lessonId: b1Unit2Lesson4.id, word: 'die Bitte', translationEn: 'the request', translationTr: 'rica', exampleSentence: 'Das ist eine höfliche Bitte.' },
      { lessonId: b1Unit2Lesson4.id, word: 'höflich', translationEn: 'polite', translationTr: 'kibar', exampleSentence: 'Das ist eine höfliche Frage.' },
    ],
  })

  // --- B1 Unit 3: Passiv im Präsens und Präteritum (4 lessons) ---
  const b1Unit3 = await prisma.unit.create({
    data: { levelId: b1.id, order: 3, titleDe: 'Passiv im Präsens und Präteritum', titleEn: 'Passive Voice (Present & Simple Past)', titleTr: 'Edilgen Çatı (Şimdiki ve Geçmiş Zaman)' },
  })

  const b1Unit3Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit3.id,
      order: 1,
      grammarTopic: 'Passiv im Präsens',
      explanationDe:
        'Das Vorgangspassiv im Präsens wird mit "werden" + Partizip II gebildet, z. B. "Der Brief wird geschrieben."',
      explanationEn:
        'The present-tense passive is formed with "werden" + past participle, e.g. "Der Brief wird geschrieben" (The letter is being written).',
      explanationTr:
        'Şimdiki zaman edilgen çatı "werden" + Partizip II ile kurulur, örn. "Der Brief wird geschrieben" (Mektup yazılıyor).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit3Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der Brief ___ geschrieben.', options: ['wird', 'ist', 'hat', 'wurde'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Präsens Passiv: "wird" + Partizip II.',
      },
      {
        lessonId: b1Unit3Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das Essen ___ gekocht. (Präsens Passiv von kochen)' },
        correctAnswer: { accepted: ['wird'] },
        explanation: 'Präsens Passiv von "kochen": "wird gekocht".',
      },
    ],
  })

  const b1Unit3Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit3.id,
      order: 2,
      grammarTopic: 'Passiv im Präteritum',
      explanationDe:
        'Das Passiv im Präteritum wird mit "wurde" + Partizip II gebildet, z. B. "Das Haus wurde 1990 gebaut."',
      explanationEn:
        'The simple-past passive is formed with "wurde" + past participle, e.g. "Das Haus wurde 1990 gebaut" (The house was built in 1990).',
      explanationTr:
        'Geçmiş zaman (Präteritum) edilgen çatı "wurde" + Partizip II ile kurulur, örn. "Das Haus wurde 1990 gebaut" (Ev 1990\'da inşa edildi).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit3Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Haus ___ 1990 gebaut.', options: ['wurde', 'wird', 'ist', 'war'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Präteritum Passiv: "wurde" + Partizip II.',
      },
      {
        lessonId: b1Unit3Lesson2.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['gebaut', 'Haus', 'wurde', 'Das'] },
        correctAnswer: { order: ['Das', 'Haus', 'wurde', 'gebaut'] },
        explanation: 'Wortstellung im Passiv Präteritum: Subjekt, "wurde", ..., Partizip II am Ende.',
      },
    ],
  })

  const b1Unit3Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit3.id,
      order: 3,
      grammarTopic: 'Passiv mit Modalverben',
      explanationDe:
        'Im Passiv mit Modalverben steht das Modalverb konjugiert, das Partizip II und "werden" (Infinitiv) stehen am Satzende, z. B. "Das Auto muss repariert werden."',
      explanationEn:
        'In the passive with modal verbs, the modal verb is conjugated while the past participle and "werden" (infinitive) go to the end of the sentence, e.g. "Das Auto muss repariert werden" (The car must be repaired).',
      explanationTr:
        'Modal fiilli edilgen çatıda modal fiil çekimli olur, Partizip II ve "werden" (mastar) cümlenin sonuna gider, örn. "Das Auto muss repariert werden" (Araba tamir edilmeli).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit3Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Auto muss repariert ___.', options: ['werden', 'wird', 'worden', 'sein'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Passiv mit Modalverb: Partizip II + "werden" am Satzende.',
      },
      {
        lessonId: b1Unit3Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Aufgabe kann heute nicht ___ werden. (lösen)' },
        correctAnswer: { accepted: ['gelöst'] },
        explanation: 'Partizip II von "lösen" ist "gelöst".',
      },
    ],
  })

  const b1Unit3Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit3.id,
      order: 4,
      grammarTopic: 'Wiederholung: Passiv',
      explanationDe:
        'Wiederholung: Passiv Präsens ("wird" + Partizip II), Präteritum ("wurde" + Partizip II), mit Modalverben (Modalverb + Partizip II + "werden").',
      explanationEn:
        'Review: present passive ("wird" + past participle), simple-past passive ("wurde" + past participle), with modal verbs (modal + past participle + "werden").',
      explanationTr:
        'Tekrar: Şimdiki zaman edilgen ("wird" + Partizip II), geçmiş zaman edilgen ("wurde" + Partizip II), modal fiilli edilgen (modal fiil + Partizip II + "werden").',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit3Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: {
          lefts: ['Präsens Passiv', 'Präteritum Passiv', 'Passiv mit Modalverb'],
          rights: ['muss gebaut werden', 'wird gebaut', 'wurde gebaut'],
        },
        correctAnswer: {
          pairs: [
            { left: 'Präsens Passiv', right: 'wird gebaut' },
            { left: 'Präteritum Passiv', right: 'wurde gebaut' },
            { left: 'Passiv mit Modalverb', right: 'muss gebaut werden' },
          ],
        },
        explanation: 'Präsens: wird + Partizip II; Präteritum: wurde + Partizip II; mit Modalverb: Modalverb + Partizip II + werden.',
      },
      {
        lessonId: b1Unit3Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Ergänzen Sie: Passiv Präteritum = 'wurde' + ___ (Partizip II von 'bauen')" },
        correctAnswer: { accepted: ['gebaut'] },
        explanation: 'Partizip II von "bauen" ist "gebaut": "wurde gebaut".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit3Lesson1.id, word: 'der Brief', translationEn: 'the letter', translationTr: 'mektup', exampleSentence: 'Der Brief wird geschrieben.' },
      { lessonId: b1Unit3Lesson1.id, word: 'schreiben', translationEn: 'to write', translationTr: 'yazmak', exampleSentence: 'Ich schreibe einen Brief.' },
      { lessonId: b1Unit3Lesson2.id, word: 'bauen', translationEn: 'to build', translationTr: 'inşa etmek', exampleSentence: 'Das Haus wurde 1990 gebaut.' },
      { lessonId: b1Unit3Lesson2.id, word: 'das Jahr', translationEn: 'the year', translationTr: 'yıl', exampleSentence: 'In welchem Jahr wurde das Haus gebaut?' },
      { lessonId: b1Unit3Lesson3.id, word: 'die Aufgabe', translationEn: 'the task', translationTr: 'görev', exampleSentence: 'Die Aufgabe muss gelöst werden.' },
      { lessonId: b1Unit3Lesson3.id, word: 'lösen', translationEn: 'to solve', translationTr: 'çözmek', exampleSentence: 'Ich kann das Problem lösen.' },
      { lessonId: b1Unit3Lesson4.id, word: 'das Problem', translationEn: 'the problem', translationTr: 'sorun', exampleSentence: 'Wir müssen das Problem lösen.' },
      { lessonId: b1Unit3Lesson4.id, word: 'die Reparatur', translationEn: 'the repair', translationTr: 'tamirat', exampleSentence: 'Die Reparatur dauert zwei Stunden.' },
    ],
  })

  // --- B1 Unit 4: Relativsätze (4 lessons) ---
  const b1Unit4 = await prisma.unit.create({
    data: { levelId: b1.id, order: 4, titleDe: 'Relativsätze', titleEn: 'Relative Clauses', titleTr: 'İlgi Cümleleri' },
  })

  const b1Unit4Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit4.id,
      order: 1,
      grammarTopic: 'Relativpronomen im Nominativ',
      explanationDe:
        'Relativsätze beschreiben ein Nomen näher. Im Nominativ richtet sich das Relativpronomen nach Genus und Numerus des Bezugsworts, z. B. "Der Mann, der dort steht, ist mein Lehrer."',
      explanationEn:
        'Relative clauses give more information about a noun. In the nominative, the relative pronoun matches the gender and number of the noun it refers to, e.g. "Der Mann, der dort steht, ist mein Lehrer" (The man who is standing there is my teacher).',
      explanationTr:
        'İlgi cümleleri bir ismi daha ayrıntılı tanımlar. Yalın halde ilgi zamiri, atıfta bulunduğu ismin cinsiyet ve sayısına göre değişir, örn. "Der Mann, der dort steht, ist mein Lehrer" (Orada duran adam benim öğretmenim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit4Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der Mann, ___ dort steht, ist mein Lehrer.', options: ['der', 'die', 'das', 'den'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Der Mann" ist maskulin, im Nominativ benutzt man "der".',
      },
      {
        lessonId: b1Unit4Lesson1.id,
        order: 2,
        type: 'MATCHING',
        data: {
          lefts: ['der Mann', 'die Frau', 'das Kind'],
          rights: ['das', 'der', 'die'],
        },
        correctAnswer: {
          pairs: [
            { left: 'der Mann', right: 'der' },
            { left: 'die Frau', right: 'die' },
            { left: 'das Kind', right: 'das' },
          ],
        },
        explanation: 'Relativpronomen im Nominativ: maskulin = der, feminin = die, neutral = das.',
      },
    ],
  })

  const b1Unit4Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit4.id,
      order: 2,
      grammarTopic: 'Relativpronomen im Akkusativ',
      explanationDe:
        'Im Akkusativ ändert sich nur das maskuline Relativpronomen zu "den", z. B. "Das Buch, das ich lese, ist spannend." / "Der Film, den ich sehe, ist neu."',
      explanationEn:
        'In the accusative, only the masculine relative pronoun changes, to "den", e.g. "Das Buch, das ich lese, ist spannend" / "Der Film, den ich sehe, ist neu" (The movie that I am watching is new).',
      explanationTr:
        '-i halinde sadece eril ilgi zamiri "den" olarak değişir, örn. "Das Buch, das ich lese, ist spannend" / "Der Film, den ich sehe, ist neu" (İzlediğim film yeni).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit4Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der Film, ___ ich sehe, ist neu.', options: ['den', 'der', 'die', 'das'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Maskulines Relativpronomen im Akkusativ: "den".',
      },
      {
        lessonId: b1Unit4Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das Buch, ___ ich lese, ist spannend. (Relativpronomen, neutral, Akkusativ)' },
        correctAnswer: { accepted: ['das'] },
        explanation: 'Neutrales Relativpronomen im Akkusativ bleibt "das".',
      },
    ],
  })

  const b1Unit4Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit4.id,
      order: 3,
      grammarTopic: 'Relativsätze mit Präpositionen',
      explanationDe:
        'Nach einer Präposition steht das Relativpronomen im entsprechenden Kasus, z. B. "Das ist die Kollegin, mit der ich arbeite." / "Das ist der Tisch, auf dem das Buch liegt."',
      explanationEn:
        'After a preposition, the relative pronoun takes the case that preposition requires, e.g. "Das ist die Kollegin, mit der ich arbeite" (That is the colleague I work with) / "Das ist der Tisch, auf dem das Buch liegt" (That is the table the book is lying on).',
      explanationTr:
        'Bir edattan sonra ilgi zamiri, o edatın gerektirdiği hal ile kullanılır, örn. "Das ist die Kollegin, mit der ich arbeite" / "Das ist der Tisch, auf dem das Buch liegt".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit4Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das ist die Kollegin, mit ___ ich arbeite.', options: ['der', 'die', 'dem', 'den'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Mit" verlangt den Dativ; feminines Relativpronomen im Dativ ist "der".',
      },
      {
        lessonId: b1Unit4Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Das ist der Tisch, auf ___ das Buch liegt. (Relativpronomen, maskulin, Dativ nach 'auf')" },
        correctAnswer: { accepted: ['dem'] },
        explanation: 'Maskulines Relativpronomen im Dativ ist "dem".',
      },
    ],
  })

  const b1Unit4Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit4.id,
      order: 4,
      grammarTopic: 'Übung: Relativsätze',
      explanationDe:
        'Wiederholung: Relativpronomen richten sich nach Genus/Numerus des Bezugsworts (Nominativ, Akkusativ) und nach der Präposition (z. B. Dativ). "Das ist der Kollege, der mir hilft und mit dem ich gern arbeite."',
      explanationEn:
        'Review: relative pronouns match the gender/number of the noun (nominative, accusative) and the case required by any preposition (e.g. dative). "Das ist der Kollege, der mir hilft und mit dem ich gern arbeite" (That is the colleague who helps me and with whom I like to work).',
      explanationTr:
        'Tekrar: İlgi zamirleri ismin cinsiyet/sayısına (yalın, -i hali) ve edatın gerektirdiği hale (örn. -e hali) göre değişir. "Das ist der Kollege, der mir hilft und mit dem ich gern arbeite".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit4Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['hilft', 'der', 'mir'] },
        correctAnswer: { order: ['der', 'mir', 'hilft'] },
        explanation: 'Im Relativsatz steht das Verb am Ende: "der mir hilft".',
      },
      {
        lessonId: b1Unit4Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das ist der Kollege, ___ mir hilft.', options: ['der', 'die', 'das', 'den'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Der Kollege" ist maskulin, im Nominativ benutzt man "der".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit4Lesson1.id, word: 'der Lehrer', translationEn: 'the (male) teacher', translationTr: 'öğretmen', exampleSentence: 'Der Mann, der dort steht, ist mein Lehrer.' },
      { lessonId: b1Unit4Lesson1.id, word: 'stehen', translationEn: 'to stand', translationTr: 'ayakta durmak', exampleSentence: 'Er steht dort.' },
      { lessonId: b1Unit4Lesson2.id, word: 'spannend', translationEn: 'exciting', translationTr: 'heyecanlı', exampleSentence: 'Das Buch ist sehr spannend.' },
      { lessonId: b1Unit4Lesson2.id, word: 'neu', translationEn: 'new', translationTr: 'yeni', exampleSentence: 'Der Film, den ich sehe, ist neu.' },
      { lessonId: b1Unit4Lesson3.id, word: 'die Kollegin', translationEn: 'the (female) colleague', translationTr: 'meslektaş (kadın)', exampleSentence: 'Das ist die Kollegin, mit der ich arbeite.' },
      { lessonId: b1Unit4Lesson3.id, word: 'liegen', translationEn: 'to lie / be located', translationTr: 'yatmak / bulunmak', exampleSentence: 'Das Buch liegt auf dem Tisch.' },
      { lessonId: b1Unit4Lesson4.id, word: 'der Kollege', translationEn: 'the (male) colleague', translationTr: 'meslektaş (erkek)', exampleSentence: 'Das ist der Kollege, der mir hilft.' },
      { lessonId: b1Unit4Lesson4.id, word: 'die Hilfe', translationEn: 'the help', translationTr: 'yardım', exampleSentence: 'Ich brauche deine Hilfe.' },
    ],
  })

  // --- B1 Unit 5: Genitiv (4 lessons) ---
  const b1Unit5 = await prisma.unit.create({
    data: { levelId: b1.id, order: 5, titleDe: 'Genitiv', titleEn: 'Genitive Case', titleTr: 'Tamlayan Hâli' },
  })

  const b1Unit5Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit5.id,
      order: 1,
      grammarTopic: 'Genitivartikel',
      explanationDe:
        'Der Genitiv zeigt Besitz oder Zugehörigkeit. Artikel: "des" (maskulin/neutrum, + -s/-es am Nomen), "der" (feminin/Plural), z. B. "das Auto des Mannes", "die Farbe der Tasche".',
      explanationEn:
        'The genitive shows possession or belonging. Articles: "des" (masculine/neuter, + -s/-es on the noun), "der" (feminine/plural), e.g. "das Auto des Mannes" (the man\'s car), "die Farbe der Tasche" (the color of the bag).',
      explanationTr:
        'Tamlayan hâli sahiplik veya aidiyeti gösterir. Artikeller: "des" (eril/nötr, isimde + -s/-es), "der" (dişil/çoğul), örn. "das Auto des Mannes" (adamın arabası), "die Farbe der Tasche" (çantanın rengi).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit5Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Auto ___ Mannes ist neu.', options: ['des', 'der', 'dem', 'den'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Maskulin Genitiv: "des" + Nomen mit -es.',
      },
      {
        lessonId: b1Unit5Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Farbe ___ Tasche gefällt mir. (die Tasche, Genitiv)' },
        correctAnswer: { accepted: ['der'] },
        explanation: 'Feminin Genitiv: "der".',
      },
    ],
  })

  const b1Unit5Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit5.id,
      order: 2,
      grammarTopic: 'Genitivpräpositionen',
      explanationDe:
        'Manche Präpositionen verlangen den Genitiv: "wegen" (because of), "trotz" (despite), "während" (during), z. B. "wegen des Regens", "trotz der Kälte".',
      explanationEn:
        'Some prepositions require the genitive: "wegen" (because of), "trotz" (despite), "während" (during), e.g. "wegen des Regens" (because of the rain), "trotz der Kälte" (despite the cold).',
      explanationTr:
        'Bazı edatlar tamlayan hâli gerektirir: "wegen" (yüzünden), "trotz" (rağmen), "während" (esnasında), örn. "wegen des Regens" (yağmur yüzünden), "trotz der Kälte" (soğuğa rağmen).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit5Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wir bleiben zu Hause ___ des Regens.', options: ['wegen', 'trotz', 'während', 'für'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Wegen" (because of) + Genitiv.',
      },
      {
        lessonId: b1Unit5Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'despite the cold' (trotz + die Kälte)?" },
        correctAnswer: { accepted: ['trotz der kälte'] },
        explanation: '"Trotz" + Genitiv feminin: "trotz der Kälte".',
      },
    ],
  })

  const b1Unit5Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit5.id,
      order: 3,
      grammarTopic: 'Possessiver Genitiv bei Namen',
      explanationDe:
        'Bei Eigennamen wird der Genitiv oft mit -s ohne Artikel gebildet: "Annas Buch", "Peters Auto". Bei Namen auf -s: "Klaus\' Auto".',
      explanationEn:
        'With proper names, the genitive is often formed with -s and no article: "Annas Buch" (Anna\'s book), "Peters Auto" (Peter\'s car). For names ending in -s: "Klaus\' Auto".',
      explanationTr:
        'Özel isimlerle tamlayan hâli genellikle artikelsiz -s ile kurulur: "Annas Buch" (Anna\'nın kitabı), "Peters Auto" (Peter\'in arabası). -s ile biten isimlerde: "Klaus\' Auto".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit5Lesson3.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ Buch ist interessant. (Anna)' },
        correctAnswer: { accepted: ['annas'] },
        explanation: 'Possessiver Genitiv bei Namen: Anna + -s.',
      },
      {
        lessonId: b1Unit5Lesson3.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['Annas', 'Peters', "Klaus'"], rights: ['Buch', 'Auto', 'Haus'] },
        correctAnswer: {
          pairs: [
            { left: 'Annas', right: 'Buch' },
            { left: 'Peters', right: 'Auto' },
            { left: "Klaus'", right: 'Haus' },
          ],
        },
        explanation: 'Possessiver Genitiv bei verschiedenen Namen.',
      },
    ],
  })

  const b1Unit5Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit5.id,
      order: 4,
      grammarTopic: 'Übung: Genitiv',
      explanationDe:
        'Wiederholung: Genitivartikel (des/der), Genitivpräpositionen (wegen/trotz/während) und possessiver Genitiv bei Namen. "Wegen des Wetters bleibt Annas Familie zu Hause."',
      explanationEn:
        'Review: genitive articles (des/der), genitive prepositions (wegen/trotz/während), and possessive genitive with names. "Wegen des Wetters bleibt Annas Familie zu Hause" (Because of the weather, Anna\'s family stays home).',
      explanationTr:
        'Tekrar: tamlayan hâli artikelleri (des/der), tamlayan hâli edatları (wegen/trotz/während) ve isimlerle possessif tamlayan hâli. "Wegen des Wetters bleibt Annas Familie zu Hause".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit5Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['des', 'wegen', 'Wetters', 'bleiben', 'wir', 'zu', 'Hause'] },
        correctAnswer: { order: ['wegen', 'des', 'Wetters', 'bleiben', 'wir', 'zu', 'Hause'] },
        explanation: 'Genitivpräposition "wegen" steht vor dem Genitivobjekt.',
      },
      {
        lessonId: b1Unit5Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Während ___ Woche arbeite ich viel.', options: ['der', 'die', 'des', 'dem'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Während" + Genitiv feminin: "der Woche".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit5Lesson1.id, word: 'die Tasche', translationEn: 'the bag', translationTr: 'çanta', exampleSentence: 'Die Farbe der Tasche gefällt mir.' },
      { lessonId: b1Unit5Lesson1.id, word: 'gefallen', translationEn: 'to please / like', translationTr: 'hoşlanmak', exampleSentence: 'Das Auto gefällt mir.' },
      { lessonId: b1Unit5Lesson2.id, word: 'der Regen', translationEn: 'the rain', translationTr: 'yağmur', exampleSentence: 'Wegen des Regens bleiben wir zu Hause.' },
      { lessonId: b1Unit5Lesson2.id, word: 'die Kälte', translationEn: 'the cold', translationTr: 'soğuk', exampleSentence: 'Trotz der Kälte gehen wir spazieren.' },
      { lessonId: b1Unit5Lesson3.id, word: 'interessant', translationEn: 'interesting', translationTr: 'ilginç', exampleSentence: 'Annas Buch ist interessant.' },
      { lessonId: b1Unit5Lesson3.id, word: 'das Haus', translationEn: 'the house', translationTr: 'ev', exampleSentence: "Klaus' Haus ist groß." },
      { lessonId: b1Unit5Lesson4.id, word: 'das Wetter', translationEn: 'the weather', translationTr: 'hava durumu', exampleSentence: 'Wegen des Wetters bleiben wir zu Hause.' },
      { lessonId: b1Unit5Lesson4.id, word: 'die Woche', translationEn: 'the week', translationTr: 'hafta', exampleSentence: 'Während der Woche arbeite ich viel.' },
    ],
  })

  // --- B1 Unit 6: Plusquamperfekt (4 lessons) ---
  const b1Unit6 = await prisma.unit.create({
    data: { levelId: b1.id, order: 6, titleDe: 'Plusquamperfekt', titleEn: 'Past Perfect', titleTr: 'Miş\'li Geçmişin Hikâyesi' },
  })

  const b1Unit6Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit6.id,
      order: 1,
      grammarTopic: 'Plusquamperfekt mit "hatte"',
      explanationDe:
        'Das Plusquamperfekt beschreibt ein Ereignis vor einem anderen Ereignis in der Vergangenheit: "hatte" + Partizip II, z. B. "Ich hatte schon gegessen, als er kam."',
      explanationEn:
        'The past perfect describes an event before another past event: "hatte" + past participle, e.g. "Ich hatte schon gegessen, als er kam" (I had already eaten when he arrived).',
      explanationTr:
        'Miş\'li geçmişin hikâyesi, geçmişteki başka bir olaydan önceki olayı anlatır: "hatte" + Partizip II, örn. "Ich hatte schon gegessen, als er kam" (O geldiğinde ben zaten yemiştim).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit6Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ schon gegessen, als er kam.', options: ['habe', 'hatte', 'hätte', 'haben'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Plusquamperfekt: "hatte" + Partizip II.',
      },
      {
        lessonId: b1Unit6Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er ___ den Brief schon geschrieben, bevor ich kam. (haben)' },
        correctAnswer: { accepted: ['hatte'] },
        explanation: 'Plusquamperfekt mit "hatte".',
      },
    ],
  })

  const b1Unit6Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit6.id,
      order: 2,
      grammarTopic: 'Plusquamperfekt mit "war"',
      explanationDe:
        'Bewegungs- und Zustandsverben bilden das Plusquamperfekt mit "war" + Partizip II, z. B. "Sie war schon gegangen, als ich anrief."',
      explanationEn:
        'Movement and state verbs form the past perfect with "war" + past participle, e.g. "Sie war schon gegangen, als ich anrief" (She had already left when I called).',
      explanationTr:
        'Hareket ve durum fiilleri miş\'li geçmişin hikâyesini "war" + Partizip II ile kurar, örn. "Sie war schon gegangen, als ich anrief" (Ben aradığımda o zaten gitmişti).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit6Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Sie ___ schon gegangen, als ich anrief.', options: ['hatte', 'war', 'ist', 'hat'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"gehen" bildet das Plusquamperfekt mit "war".',
      },
      {
        lessonId: b1Unit6Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man: 'I had already arrived' (ankommen, ich)?" },
        correctAnswer: { accepted: ['ich war schon angekommen'] },
        explanation: '"ankommen" braucht "war": "Ich war schon angekommen."',
      },
    ],
  })

  const b1Unit6Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit6.id,
      order: 3,
      grammarTopic: 'Plusquamperfekt mit "nachdem"',
      explanationDe:
        '"Nachdem" verbindet zwei Vergangenheitsereignisse: der Nebensatz mit "nachdem" steht im Plusquamperfekt, der Hauptsatz im Perfekt/Präteritum. "Nachdem ich gegessen hatte, ging ich spazieren."',
      explanationEn:
        '"Nachdem" (after) connects two past events: the "nachdem" clause uses the past perfect, the main clause uses Perfekt/Präteritum. "Nachdem ich gegessen hatte, ging ich spazieren" (After I had eaten, I went for a walk).',
      explanationTr:
        '"Nachdem" (sonra) iki geçmiş olayı bağlar: "nachdem" cümleciği miş\'li geçmişin hikâyesinde, ana cümle Perfekt/Präteritum\'da olur. "Nachdem ich gegessen hatte, ging ich spazieren".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit6Lesson3.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['gegessen', 'ich', 'nachdem', 'hatte'] },
        correctAnswer: { order: ['nachdem', 'ich', 'gegessen', 'hatte'] },
        explanation: 'Im Nebensatz mit "nachdem" steht das Verb am Ende.',
      },
      {
        lessonId: b1Unit6Lesson3.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Nachdem ich gegessen hatte, ___ ich spazieren.', options: ['ging', 'gehe', 'gegangen', 'gehen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Hauptsatz im Präteritum: "ging".',
      },
    ],
  })

  const b1Unit6Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit6.id,
      order: 4,
      grammarTopic: 'Übung: Plusquamperfekt',
      explanationDe:
        'Wiederholung: Plusquamperfekt mit "hatte"/"war" beschreibt Vorzeitigkeit. "Nachdem sie angekommen war, hatte sie schon alles vorbereitet."',
      explanationEn:
        'Review: past perfect with "hatte"/"war" expresses an earlier past event. "Nachdem sie angekommen war, hatte sie schon alles vorbereitet" (After she had arrived, she had already prepared everything).',
      explanationTr:
        'Tekrar: "hatte"/"war" ile miş\'li geçmişin hikâyesi önceki bir geçmiş olayı ifade eder. "Nachdem sie angekommen war, hatte sie schon alles vorbereitet".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit6Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Nachdem sie angekommen ___, hatte sie schon alles vorbereitet. (sein)' },
        correctAnswer: { accepted: ['war'] },
        explanation: '"ankommen" + Plusquamperfekt mit "war".',
      },
      {
        lessonId: b1Unit6Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man: 'everything' auf Deutsch (aus dem Beispielsatz)?" },
        correctAnswer: { accepted: ['alles'] },
        explanation: '"Alles" bedeutet "everything".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit6Lesson1.id, word: 'die E-Mail', translationEn: 'the email', translationTr: 'e-posta', exampleSentence: 'Ich hatte die E-Mail schon gesendet.' },
      { lessonId: b1Unit6Lesson1.id, word: 'senden', translationEn: 'to send', translationTr: 'göndermek', exampleSentence: 'Ich sende dir eine E-Mail.' },
      { lessonId: b1Unit6Lesson2.id, word: 'anrufen', translationEn: 'to call (phone)', translationTr: 'aramak', exampleSentence: 'Ich rufe dich später an.' },
      { lessonId: b1Unit6Lesson2.id, word: 'ankommen', translationEn: 'to arrive', translationTr: 'varmak', exampleSentence: 'Der Zug ist schon angekommen.' },
      { lessonId: b1Unit6Lesson3.id, word: 'spazieren', translationEn: 'to walk / stroll', translationTr: 'gezinmek', exampleSentence: 'Ich gehe gern spazieren.' },
      { lessonId: b1Unit6Lesson3.id, word: 'nachdem', translationEn: 'after (conjunction)', translationTr: '-dikten sonra', exampleSentence: 'Nachdem ich gegessen hatte, ging ich spazieren.' },
      { lessonId: b1Unit6Lesson4.id, word: 'vorbereiten', translationEn: 'to prepare', translationTr: 'hazırlamak', exampleSentence: 'Sie hatte alles vorbereitet.' },
      { lessonId: b1Unit6Lesson4.id, word: 'alles', translationEn: 'everything', translationTr: 'her şey', exampleSentence: 'Sie hatte schon alles vorbereitet.' },
    ],
  })

  // --- B1 Unit 7: Doppelkonjunktionen (4 lessons) ---
  const b1Unit7 = await prisma.unit.create({
    data: { levelId: b1.id, order: 7, titleDe: 'Doppelkonjunktionen', titleEn: 'Paired Conjunctions', titleTr: 'Çift Bağlaçlar' },
  })

  const b1Unit7Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit7.id,
      order: 1,
      grammarTopic: 'je...desto',
      explanationDe:
        '"Je...desto" beschreibt eine proportionale Steigerung; beide Teile stehen mit Komparativ: "Je mehr ich lerne, desto besser verstehe ich."',
      explanationEn:
        '"Je...desto" (the...the) expresses proportional increase; both parts use the comparative: "Je mehr ich lerne, desto besser verstehe ich" (The more I study, the better I understand).',
      explanationTr:
        '"Je...desto" (ne kadar...o kadar) orantılı bir artışı ifade eder; her iki kısım da karşılaştırma hâlinde olur: "Je mehr ich lerne, desto besser verstehe ich".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit7Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Je mehr ich lerne, ___ besser verstehe ich.', options: ['desto', 'dass', 'weil', 'ob'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Je...desto" ist ein Paar; nach "je" folgt "desto".',
      },
      {
        lessonId: b1Unit7Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Je älter er wird, ___ ruhiger wird er. (desto)' },
        correctAnswer: { accepted: ['desto'] },
        explanation: '"Je...desto" mit Komparativ auf beiden Seiten.',
      },
    ],
  })

  const b1Unit7Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit7.id,
      order: 2,
      grammarTopic: 'sowohl...als auch',
      explanationDe:
        '"Sowohl...als auch" bedeutet "both...and": "Sie spricht sowohl Deutsch als auch Englisch." Beide Elemente werden gleichermaßen betont.',
      explanationEn:
        '"Sowohl...als auch" means "both...and": "Sie spricht sowohl Deutsch als auch Englisch" (She speaks both German and English). Both elements are equally emphasized.',
      explanationTr:
        '"Sowohl...als auch" "hem...hem de" anlamına gelir: "Sie spricht sowohl Deutsch als auch Englisch" (O hem Almanca hem de İngilizce konuşuyor).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit7Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Sie spricht sowohl Deutsch ___ auch Englisch.', options: ['als', 'wie', 'oder', 'und'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Sowohl...als auch" ist die feste Kombination.',
      },
      {
        lessonId: b1Unit7Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'both...and'?" },
        correctAnswer: { accepted: ['sowohl...als auch', 'sowohl als auch'] },
        explanation: '"Sowohl...als auch" bedeutet "both...and".',
      },
    ],
  })

  const b1Unit7Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit7.id,
      order: 3,
      grammarTopic: 'weder...noch / entweder...oder',
      explanationDe:
        '"Weder...noch" bedeutet "neither...nor": "Er trinkt weder Kaffee noch Tee." "Entweder...oder" bedeutet "either...or": "Entweder du kommst, oder ich gehe."',
      explanationEn:
        '"Weder...noch" means "neither...nor": "Er trinkt weder Kaffee noch Tee" (He drinks neither coffee nor tea). "Entweder...oder" means "either...or": "Entweder du kommst, oder ich gehe" (Either you come, or I go).',
      explanationTr:
        '"Weder...noch" "ne...ne de" anlamına gelir: "Er trinkt weder Kaffee noch Tee". "Entweder...oder" "ya...ya da" anlamına gelir: "Entweder du kommst, oder ich gehe".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit7Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er trinkt weder Kaffee ___ Tee.', options: ['noch', 'oder', 'und', 'als'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Weder...noch" ist die feste Kombination.',
      },
      {
        lessonId: b1Unit7Lesson3.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['weder', 'entweder', 'sowohl', 'je'], rights: ['noch', 'oder', 'als auch', 'desto'] },
        correctAnswer: {
          pairs: [
            { left: 'weder', right: 'noch' },
            { left: 'entweder', right: 'oder' },
            { left: 'sowohl', right: 'als auch' },
            { left: 'je', right: 'desto' },
          ],
        },
        explanation: 'Doppelkonjunktionen und ihre Partnerwörter.',
      },
    ],
  })

  const b1Unit7Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit7.id,
      order: 4,
      grammarTopic: 'Übung: Doppelkonjunktionen',
      explanationDe:
        'Wiederholung: je...desto, sowohl...als auch, weder...noch, entweder...oder verbinden Satzteile mit besonderer Bedeutung.',
      explanationEn:
        'Review: je...desto, sowohl...als auch, weder...noch, entweder...oder connect clause parts with special meaning.',
      explanationTr:
        'Tekrar: je...desto, sowohl...als auch, weder...noch, entweder...oder özel anlamla cümle parçalarını bağlar.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit7Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['oder', 'oder', 'entweder', 'Tee', 'Kaffee'] },
        correctAnswer: { order: ['entweder', 'Kaffee', 'oder', 'Tee'] },
        explanation: '"Entweder...oder" verbindet zwei Alternativen.',
      },
      {
        lessonId: b1Unit7Lesson4.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Weder er ___ sie kommt heute. (noch)' },
        correctAnswer: { accepted: ['noch'] },
        explanation: '"Weder...noch" für zwei negierte Alternativen.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit7Lesson1.id, word: 'ruhig', translationEn: 'calm', translationTr: 'sakin', exampleSentence: 'Je älter er wird, desto ruhiger wird er.' },
      { lessonId: b1Unit7Lesson1.id, word: 'verstehen', translationEn: 'to understand', translationTr: 'anlamak', exampleSentence: 'Ich verstehe das gut.' },
      { lessonId: b1Unit7Lesson2.id, word: 'sprechen', translationEn: 'to speak', translationTr: 'konuşmak', exampleSentence: 'Sie spricht sowohl Deutsch als auch Englisch.' },
      { lessonId: b1Unit7Lesson2.id, word: 'die Sprache', translationEn: 'the language', translationTr: 'dil', exampleSentence: 'Deutsch ist eine schwere Sprache.' },
      { lessonId: b1Unit7Lesson3.id, word: 'der Kaffee', translationEn: 'the coffee', translationTr: 'kahve', exampleSentence: 'Er trinkt weder Kaffee noch Tee.' },
      { lessonId: b1Unit7Lesson3.id, word: 'der Tee', translationEn: 'the tea', translationTr: 'çay', exampleSentence: 'Möchtest du Tee oder Kaffee?' },
      { lessonId: b1Unit7Lesson4.id, word: 'die Alternative', translationEn: 'the alternative', translationTr: 'alternatif', exampleSentence: 'Wir haben keine andere Alternative.' },
      { lessonId: b1Unit7Lesson4.id, word: 'verbinden', translationEn: 'to connect', translationTr: 'bağlamak', exampleSentence: 'Diese Konjunktion verbindet zwei Sätze.' },
    ],
  })

  // --- B1 Unit 8: Infinitiv mit "zu" (4 lessons) ---
  const b1Unit8 = await prisma.unit.create({
    data: { levelId: b1.id, order: 8, titleDe: 'Infinitiv mit "zu"', titleEn: 'Infinitive with "zu"', titleTr: '"zu" ile Mastar' },
  })

  const b1Unit8Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit8.id,
      order: 1,
      grammarTopic: 'Infinitiv mit "zu" nach Verben',
      explanationDe:
        'Nach vielen Verben (versuchen, hoffen, vergessen) steht der Infinitiv mit "zu": "Ich versuche, früh aufzustehen." Bei trennbaren Verben steht "zu" zwischen Präfix und Verb.',
      explanationEn:
        'After many verbs (versuchen/try, hoffen/hope, vergessen/forget), the infinitive takes "zu": "Ich versuche, früh aufzustehen" (I try to get up early). With separable verbs, "zu" goes between the prefix and verb.',
      explanationTr:
        'Birçok fiilden sonra (versuchen/denemek, hoffen/ummak, vergessen/unutmak) mastar "zu" ile kullanılır: "Ich versuche, früh aufzustehen". Ayrılabilir fiillerde "zu" önek ile fiil arasına girer.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit8Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich versuche, früh ___ . (aufstehen)', options: ['aufzustehen', 'zu aufstehen', 'aufstehen zu', 'aufgestehen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Bei trennbaren Verben: Präfix + zu + Verb = "aufzustehen".',
      },
      {
        lessonId: b1Unit8Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er hofft, die Prüfung ___ bestehen. (zu)' },
        correctAnswer: { accepted: ['zu'] },
        explanation: '"Hoffen" + Infinitiv mit "zu".',
      },
    ],
  })

  const b1Unit8Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit8.id,
      order: 2,
      grammarTopic: '"um...zu" (Zweck)',
      explanationDe:
        '"Um...zu" drückt einen Zweck aus: "Ich lerne Deutsch, um in Deutschland zu arbeiten." Das Subjekt von Haupt- und Nebensatz muss gleich sein.',
      explanationEn:
        '"Um...zu" expresses purpose: "Ich lerne Deutsch, um in Deutschland zu arbeiten" (I\'m learning German in order to work in Germany). The subject of both clauses must be the same.',
      explanationTr:
        '"Um...zu" amaç ifade eder: "Ich lerne Deutsch, um in Deutschland zu arbeiten" (Almanya\'da çalışmak için Almanca öğreniyorum). Her iki cümlenin öznesi aynı olmalı.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit8Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich lerne Deutsch, ___ in Deutschland zu arbeiten.', options: ['um', 'ohne', 'weil', 'dass'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Um...zu" drückt einen Zweck aus.',
      },
      {
        lessonId: b1Unit8Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man: 'in order to' auf Deutsch?" },
        correctAnswer: { accepted: ['um...zu', 'um zu'] },
        explanation: '"Um...zu" bedeutet "in order to".',
      },
    ],
  })

  const b1Unit8Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit8.id,
      order: 3,
      grammarTopic: '"ohne...zu" (Verzicht)',
      explanationDe:
        '"Ohne...zu" bedeutet "without ...ing": "Er ging weg, ohne sich zu verabschieden." Auch hier ist das Subjekt beider Teile gleich.',
      explanationEn:
        '"Ohne...zu" means "without ...ing": "Er ging weg, ohne sich zu verabschieden" (He left without saying goodbye). Again, the subject of both parts is the same.',
      explanationTr:
        '"Ohne...zu" "...madan" anlamına gelir: "Er ging weg, ohne sich zu verabschieden" (Vedalaşmadan gitti). Burada da her iki kısmın öznesi aynıdır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit8Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er ging weg, ___ sich zu verabschieden.', options: ['ohne', 'um', 'statt', 'bevor'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Ohne...zu" bedeutet "without ...ing".',
      },
      {
        lessonId: b1Unit8Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie verließ das Haus, ohne die Tür ___ schließen. (zu)' },
        correctAnswer: { accepted: ['zu'] },
        explanation: '"Ohne...zu" + Infinitiv.',
      },
    ],
  })

  const b1Unit8Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit8.id,
      order: 4,
      grammarTopic: 'Übung: Infinitiv mit "zu"',
      explanationDe:
        'Wiederholung: Infinitiv mit "zu" nach Verben, "um...zu" (Zweck) und "ohne...zu" (Verzicht). "Ich rufe an, um dir zu helfen, ohne zu stören."',
      explanationEn:
        'Review: infinitive with "zu" after verbs, "um...zu" (purpose), and "ohne...zu" (without). "Ich rufe an, um dir zu helfen, ohne zu stören" (I\'m calling to help you, without disturbing you).',
      explanationTr:
        'Tekrar: fiillerden sonra "zu" ile mastar, "um...zu" (amaç) ve "ohne...zu" (-madan). "Ich rufe an, um dir zu helfen, ohne zu stören".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit8Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['zu', 'helfen', 'dir', 'um'] },
        correctAnswer: { order: ['um', 'dir', 'zu', 'helfen'] },
        explanation: '"Um" + Subjekt/Objekt + "zu" + Infinitiv am Ende.',
      },
      {
        lessonId: b1Unit8Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er hilft mir, ___ zu stören.', options: ['ohne', 'um', 'weil', 'dass'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Ohne...zu" für "without ...ing".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit8Lesson1.id, word: 'aufstehen', translationEn: 'to get up', translationTr: 'kalkmak', exampleSentence: 'Ich versuche, früh aufzustehen.' },
      { lessonId: b1Unit8Lesson1.id, word: 'die Prüfung', translationEn: 'the exam', translationTr: 'sınav', exampleSentence: 'Er hofft, die Prüfung zu bestehen.' },
      { lessonId: b1Unit8Lesson2.id, word: 'arbeiten', translationEn: 'to work', translationTr: 'çalışmak', exampleSentence: 'Ich möchte in Deutschland arbeiten.' },
      { lessonId: b1Unit8Lesson2.id, word: 'der Zweck', translationEn: 'the purpose', translationTr: 'amaç', exampleSentence: 'Was ist der Zweck dieser Übung?' },
      { lessonId: b1Unit8Lesson3.id, word: 'sich verabschieden', translationEn: 'to say goodbye', translationTr: 'vedalaşmak', exampleSentence: 'Er ging, ohne sich zu verabschieden.' },
      { lessonId: b1Unit8Lesson3.id, word: 'schließen', translationEn: 'to close', translationTr: 'kapatmak', exampleSentence: 'Bitte schließen Sie die Tür.' },
      { lessonId: b1Unit8Lesson4.id, word: 'stören', translationEn: 'to disturb', translationTr: 'rahatsız etmek', exampleSentence: 'Ich möchte dich nicht stören.' },
      { lessonId: b1Unit8Lesson4.id, word: 'helfen', translationEn: 'to help', translationTr: 'yardım etmek', exampleSentence: 'Ich rufe an, um dir zu helfen.' },
    ],
  })

  // --- B1 Unit 9: Adjektivdeklination (4 lessons) ---
  const b1Unit9 = await prisma.unit.create({
    data: { levelId: b1.id, order: 9, titleDe: 'Adjektivdeklination', titleEn: 'Adjective Declension', titleTr: 'Sıfat Çekimi' },
  })

  const b1Unit9Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit9.id,
      order: 1,
      grammarTopic: 'Adjektivdeklination im Nominativ und Akkusativ',
      explanationDe:
        'Nach bestimmtem Artikel im Akkusativ ändert sich nur die maskuline Form: "Ich sehe den großen Mann" (vs. Nominativ "der große Mann"). Feminin/neutrum/Plural bleiben wie im Nominativ.',
      explanationEn:
        'After the definite article in the accusative, only the masculine form changes: "Ich sehe den großen Mann" (I see the tall man) vs. nominative "der große Mann". Feminine/neuter/plural stay the same as the nominative.',
      explanationTr:
        'Belirli artikelle -i hâlinde sadece eril biçim değişir: "Ich sehe den großen Mann" (yalın hâl "der große Mann"). Dişil/nötr/çoğul yalın hâldeki gibi kalır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit9Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich sehe den ___ Mann. (groß, Akkusativ)', options: ['große', 'großen', 'großer', 'großes'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Akkusativ maskulin nach "den": Adjektiv + -en.',
      },
      {
        lessonId: b1Unit9Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich kaufe die ___ Tasche. (rot, Akkusativ feminin)' },
        correctAnswer: { accepted: ['rote'] },
        explanation: 'Akkusativ feminin bleibt wie Nominativ: Adjektiv + -e.',
      },
    ],
  })

  const b1Unit9Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit9.id,
      order: 2,
      grammarTopic: 'Adjektivdeklination im Dativ',
      explanationDe:
        'Im Dativ endet das Adjektiv nach bestimmtem und unbestimmtem Artikel immer auf -en: "mit dem großen Mann", "mit einem großen Mann".',
      explanationEn:
        'In the dative, the adjective always ends in -en after both definite and indefinite articles: "mit dem großen Mann" (with the tall man), "mit einem großen Mann" (with a tall man).',
      explanationTr:
        '-e hâlinde sıfat, belirli ve belirsiz artikelden sonra her zaman -en ile biter: "mit dem großen Mann", "mit einem großen Mann".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit9Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich spreche mit dem ___ Mann. (groß, Dativ)', options: ['große', 'großen', 'großer', 'großes'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Dativ: Adjektiv immer + -en.',
      },
      {
        lessonId: b1Unit9Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welche Endung hat das Adjektiv im Dativ IMMER (nach dem/einem/der/einer)?" },
        correctAnswer: { accepted: ['-en', 'en'] },
        explanation: 'Dativ-Adjektivendung ist immer "-en".',
      },
    ],
  })

  const b1Unit9Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit9.id,
      order: 3,
      grammarTopic: 'Adjektivdeklination ohne Artikel',
      explanationDe:
        'Ohne Artikel trägt das Adjektiv die Endung, die sonst der Artikel hätte (starke Deklination): "frisches Brot" (wie "das"), "guter Wein" (wie "der"), "kalte Milch" (wie "die").',
      explanationEn:
        'Without an article, the adjective takes the ending the article would have had (strong declension): "frisches Brot" (fresh bread, like "das"), "guter Wein" (good wine, like "der"), "kalte Milch" (cold milk, like "die").',
      explanationTr:
        'Artikelsiz sıfat, artikelin taşıyacağı eki alır (güçlü çekim): "frisches Brot" ("das" gibi), "guter Wein" ("der" gibi), "kalte Milch" ("die" gibi).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit9Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ Brot schmeckt gut. (frisch, ohne Artikel)', options: ['Frisches', 'Frische', 'Frischen', 'Frischer'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Ohne Artikel neutral: Adjektiv + -es (wie "das").',
      },
      {
        lessonId: b1Unit9Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ Wein ist teuer. (gut, ohne Artikel, maskulin)' },
        correctAnswer: { accepted: ['guter'] },
        explanation: 'Ohne Artikel maskulin: Adjektiv + -er (wie "der").',
      },
    ],
  })

  const b1Unit9Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit9.id,
      order: 4,
      grammarTopic: 'Übung: Adjektivdeklination',
      explanationDe:
        'Wiederholung: Nominativ/Akkusativ, Dativ (immer -en) und Deklination ohne Artikel. "Der freundliche Mann gibt dem kleinen Kind frisches Obst."',
      explanationEn:
        'Review: nominative/accusative, dative (always -en), and declension without an article. "Der freundliche Mann gibt dem kleinen Kind frisches Obst" (The friendly man gives the small child fresh fruit).',
      explanationTr:
        'Tekrar: yalın/-i hâli, -e hâli (her zaman -en) ve artikelsiz çekim. "Der freundliche Mann gibt dem kleinen Kind frisches Obst".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit9Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['Kind', 'dem', 'kleinen', 'ich', 'helfe'] },
        correctAnswer: { order: ['ich', 'helfe', 'dem', 'kleinen', 'Kind'] },
        explanation: '"Helfen" + Dativ: "dem kleinen Kind".',
      },
      {
        lessonId: b1Unit9Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der freundliche Mann gibt dem kleinen Kind ___ Obst. (frisch, ohne Artikel)', options: ['frisches', 'frische', 'frischen', 'frischer'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Ohne Artikel neutral Akkusativ: Adjektiv + -es.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit9Lesson1.id, word: 'kaufen', translationEn: 'to buy', translationTr: 'satın almak', exampleSentence: 'Ich kaufe die rote Tasche.' },
      { lessonId: b1Unit9Lesson1.id, word: 'sehen', translationEn: 'to see', translationTr: 'görmek', exampleSentence: 'Ich sehe den großen Mann.' },
      { lessonId: b1Unit9Lesson2.id, word: 'sprechen mit', translationEn: 'to talk to/with', translationTr: 'konuşmak (biriyle)', exampleSentence: 'Ich spreche mit dem großen Mann.' },
      { lessonId: b1Unit9Lesson2.id, word: 'geben', translationEn: 'to give', translationTr: 'vermek', exampleSentence: 'Ich gebe dem Kind ein Geschenk.' },
      { lessonId: b1Unit9Lesson3.id, word: 'das Brot', translationEn: 'the bread', translationTr: 'ekmek', exampleSentence: 'Frisches Brot schmeckt gut.' },
      { lessonId: b1Unit9Lesson3.id, word: 'der Wein', translationEn: 'the wine', translationTr: 'şarap', exampleSentence: 'Guter Wein ist teuer.' },
      { lessonId: b1Unit9Lesson4.id, word: 'freundlich', translationEn: 'friendly', translationTr: 'arkadaş canlısı', exampleSentence: 'Der freundliche Mann hilft mir.' },
      { lessonId: b1Unit9Lesson4.id, word: 'das Obst', translationEn: 'the fruit', translationTr: 'meyve', exampleSentence: 'Ich esse gern frisches Obst.' },
    ],
  })

  // --- B1 Unit 10: obwohl/während/nachdem (4 lessons) ---
  const b1Unit10 = await prisma.unit.create({
    data: { levelId: b1.id, order: 10, titleDe: 'obwohl / während / nachdem', titleEn: 'although / while / after', titleTr: 'her ne kadar / esnasında / -dikten sonra' },
  })

  const b1Unit10Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit10.id,
      order: 1,
      grammarTopic: '"obwohl" (Konzessivsatz)',
      explanationDe:
        '"Obwohl" (although) leitet einen konzessiven Nebensatz ein, das Verb steht am Ende: "Ich gehe spazieren, obwohl es regnet."',
      explanationEn:
        '"Obwohl" (although) introduces a concessive clause, with the verb at the end: "Ich gehe spazieren, obwohl es regnet" (I\'m going for a walk although it\'s raining).',
      explanationTr:
        '"Obwohl" (her ne kadar) bir zıtlık cümleciği başlatır, fiil sonda yer alır: "Ich gehe spazieren, obwohl es regnet".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit10Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich gehe spazieren, ___ es regnet.', options: ['obwohl', 'weil', 'dass', 'wenn'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Obwohl" (although) drückt einen Gegensatz aus.',
      },
      {
        lessonId: b1Unit10Lesson1.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['regnet', 'es', 'obwohl'] },
        correctAnswer: { order: ['obwohl', 'es', 'regnet'] },
        explanation: 'Verb am Ende im Nebensatz mit "obwohl".',
      },
    ],
  })

  const b1Unit10Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit10.id,
      order: 2,
      grammarTopic: '"während" (Temporal/Gegensatz)',
      explanationDe:
        '"Während" kann Gleichzeitigkeit ("while") oder Gegensatz ("whereas") ausdrücken: "Während ich koche, liest sie." / "Er ist ruhig, während sie laut ist."',
      explanationEn:
        '"Während" can express simultaneity ("while") or contrast ("whereas"): "Während ich koche, liest sie" (While I cook, she reads). / "Er ist ruhig, während sie laut ist" (He is quiet, whereas she is loud).',
      explanationTr:
        '"Während" eşzamanlılık ("iken") veya zıtlık ("oysa") ifade edebilir: "Während ich koche, liest sie." / "Er ist ruhig, während sie laut ist."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit10Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ ich koche, liest sie ein Buch.', options: ['Während', 'Obwohl', 'Nachdem', 'Weil'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Während" drückt Gleichzeitigkeit aus.',
      },
      {
        lessonId: b1Unit10Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er ist ruhig, ___ sie laut ist. (während)' },
        correctAnswer: { accepted: ['während'] },
        explanation: '"Während" kann auch Gegensatz ausdrücken.',
      },
    ],
  })

  const b1Unit10Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit10.id,
      order: 3,
      grammarTopic: '"nachdem" (Vorzeitigkeit) – Wiederholung',
      explanationDe:
        '"Nachdem" zeigt, dass eine Handlung vor einer anderen passiert (siehe Plusquamperfekt): "Nachdem wir gegessen hatten, räumten wir auf."',
      explanationEn:
        '"Nachdem" (after) shows that one action happened before another (see past perfect): "Nachdem wir gegessen hatten, räumten wir auf" (After we had eaten, we cleaned up).',
      explanationTr:
        '"Nachdem" bir eylemin diğerinden önce olduğunu gösterir (bkz. miş\'li geçmişin hikâyesi): "Nachdem wir gegessen hatten, räumten wir auf".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit10Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ wir gegessen hatten, räumten wir auf.', options: ['Nachdem', 'Während', 'Obwohl', 'Bevor'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Nachdem" + Plusquamperfekt für Vorzeitigkeit.',
      },
      {
        lessonId: b1Unit10Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welches Tempus benutzt man im 'nachdem'-Satz, wenn der Hauptsatz im Präteritum steht?" },
        correctAnswer: { accepted: ['plusquamperfekt'] },
        explanation: 'Der "nachdem"-Satz steht im Plusquamperfekt (Vorzeitigkeit).',
      },
    ],
  })

  const b1Unit10Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit10.id,
      order: 4,
      grammarTopic: 'Übung: obwohl / während / nachdem',
      explanationDe:
        'Wiederholung: "obwohl" (Gegensatz), "während" (gleichzeitig/Gegensatz), "nachdem" (vorher). "Obwohl es regnete, gingen wir spazieren, nachdem wir gegessen hatten."',
      explanationEn:
        'Review: "obwohl" (contrast), "während" (simultaneous/contrast), "nachdem" (before). "Obwohl es regnete, gingen wir spazieren, nachdem wir gegessen hatten" (Although it was raining, we went for a walk after we had eaten).',
      explanationTr:
        'Tekrar: "obwohl" (zıtlık), "während" (eşzamanlı/zıtlık), "nachdem" (önce). "Obwohl es regnete, gingen wir spazieren, nachdem wir gegessen hatten".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit10Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['obwohl', 'während', 'nachdem'], rights: ['Gegensatz', 'Gleichzeitigkeit', 'Vorzeitigkeit'] },
        correctAnswer: {
          pairs: [
            { left: 'obwohl', right: 'Gegensatz' },
            { left: 'während', right: 'Gleichzeitigkeit' },
            { left: 'nachdem', right: 'Vorzeitigkeit' },
          ],
        },
        explanation: 'Bedeutung der drei Konjunktionen.',
      },
      {
        lessonId: b1Unit10Lesson4.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ es regnete, gingen wir spazieren. (obwohl)' },
        correctAnswer: { accepted: ['obwohl'] },
        explanation: '"Obwohl" für einen Gegensatz.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit10Lesson1.id, word: 'der Regenschirm', translationEn: 'the umbrella', translationTr: 'şemsiye', exampleSentence: 'Ich brauche einen Regenschirm.' },
      { lessonId: b1Unit10Lesson1.id, word: 'nass', translationEn: 'wet', translationTr: 'ıslak', exampleSentence: 'Meine Schuhe sind nass.' },
      { lessonId: b1Unit10Lesson2.id, word: 'kochen', translationEn: 'to cook', translationTr: 'yemek pişirmek', exampleSentence: 'Während ich koche, liest sie.' },
      { lessonId: b1Unit10Lesson2.id, word: 'laut', translationEn: 'loud', translationTr: 'gürültülü', exampleSentence: 'Die Musik ist zu laut.' },
      { lessonId: b1Unit10Lesson3.id, word: 'aufräumen', translationEn: 'to clean up / tidy', translationTr: 'toplamak (düzenlemek)', exampleSentence: 'Wir räumen die Küche auf.' },
      { lessonId: b1Unit10Lesson3.id, word: 'bevor', translationEn: 'before (conjunction)', translationTr: '-meden önce', exampleSentence: 'Bevor ich gehe, rufe ich an.' },
      { lessonId: b1Unit10Lesson4.id, word: 'die Gleichzeitigkeit', translationEn: 'simultaneity', translationTr: 'eşzamanlılık', exampleSentence: 'Während drückt Gleichzeitigkeit aus.' },
      { lessonId: b1Unit10Lesson4.id, word: 'der Gegensatz', translationEn: 'the contrast', translationTr: 'zıtlık', exampleSentence: 'Obwohl drückt einen Gegensatz aus.' },
    ],
  })

  // --- B1 Unit 11: Konnektoren (4 lessons) ---
  const b1Unit11 = await prisma.unit.create({
    data: { levelId: b1.id, order: 11, titleDe: 'Konnektoren', titleEn: 'Connectors', titleTr: 'Bağlaçlar' },
  })

  const b1Unit11Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit11.id,
      order: 1,
      grammarTopic: '"trotzdem" (Adverb, Position 1)',
      explanationDe:
        '"Trotzdem" ist ein Adverb, kein Nebensatz-Konnektor: es steht auf Position 1 und das Verb folgt direkt danach. "Es regnet. Trotzdem gehen wir spazieren."',
      explanationEn:
        '"Trotzdem" (nevertheless) is an adverb, not a subordinating conjunction: it takes position 1, and the verb follows directly. "Es regnet. Trotzdem gehen wir spazieren" (It\'s raining. Nevertheless, we\'re going for a walk).',
      explanationTr:
        '"Trotzdem" (yine de) bir zarf bağlaçtır, yan cümle bağlacı değildir: birinci konumda yer alır ve fiil hemen ardından gelir. "Es regnet. Trotzdem gehen wir spazieren."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit11Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Es regnet. ___ gehen wir spazieren.', options: ['Trotzdem', 'Obwohl', 'Weil', 'Dass'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Trotzdem" als Adverb-Konnektor zwischen zwei Hauptsätzen.',
      },
      {
        lessonId: b1Unit11Lesson1.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['gehen', 'wir', 'trotzdem', 'spazieren'] },
        correctAnswer: { order: ['trotzdem', 'gehen', 'wir', 'spazieren'] },
        explanation: '"Trotzdem" auf Position 1, Verb direkt danach.',
      },
    ],
  })

  const b1Unit11Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit11.id,
      order: 2,
      grammarTopic: '"deshalb" (Konsequenz)',
      explanationDe:
        '"Deshalb" (therefore) drückt eine Folge aus und steht auf Position 1: "Ich bin krank, deshalb bleibe ich zu Hause."',
      explanationEn:
        '"Deshalb" (therefore) expresses a consequence and takes position 1: "Ich bin krank, deshalb bleibe ich zu Hause" (I\'m sick, therefore I\'m staying home).',
      explanationTr:
        '"Deshalb" (bu yüzden) bir sonucu ifade eder ve birinci konumda yer alır: "Ich bin krank, deshalb bleibe ich zu Hause."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit11Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich bin krank, ___ bleibe ich zu Hause.', options: ['deshalb', 'obwohl', 'während', 'als'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Deshalb" drückt eine Konsequenz aus.',
      },
      {
        lessonId: b1Unit11Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie hat keine Zeit, ___ kommt sie nicht. (deshalb)' },
        correctAnswer: { accepted: ['deshalb'] },
        explanation: '"Deshalb" für eine logische Folge.',
      },
    ],
  })

  const b1Unit11Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit11.id,
      order: 3,
      grammarTopic: '"außerdem" und "allerdings"',
      explanationDe:
        '"Außerdem" (furthermore) fügt Information hinzu: "Die Wohnung ist schön. Außerdem ist sie günstig." "Allerdings" (however) schränkt ein: "Die Wohnung ist schön, allerdings weit weg."',
      explanationEn:
        '"Außerdem" (furthermore) adds information: "Die Wohnung ist schön. Außerdem ist sie günstig" (The apartment is nice. Furthermore, it\'s affordable). "Allerdings" (however) adds a restriction: "Die Wohnung ist schön, allerdings weit weg" (The apartment is nice, however far away).',
      explanationTr:
        '"Außerdem" (ayrıca) bilgi ekler: "Die Wohnung ist schön. Außerdem ist sie günstig." "Allerdings" (ancak) bir sınırlama getirir: "Die Wohnung ist schön, allerdings weit weg."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit11Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Wohnung ist schön. ___ ist sie günstig.', options: ['Außerdem', 'Allerdings', 'Trotzdem', 'Deshalb'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Außerdem" fügt eine weitere positive Information hinzu.',
      },
      {
        lessonId: b1Unit11Lesson3.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['trotzdem', 'deshalb', 'außerdem', 'allerdings'], rights: ['Gegensatz', 'Folge', 'Ergänzung', 'Einschränkung'] },
        correctAnswer: {
          pairs: [
            { left: 'trotzdem', right: 'Gegensatz' },
            { left: 'deshalb', right: 'Folge' },
            { left: 'außerdem', right: 'Ergänzung' },
            { left: 'allerdings', right: 'Einschränkung' },
          ],
        },
        explanation: 'Bedeutung der vier Konnektoren.',
      },
    ],
  })

  const b1Unit11Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit11.id,
      order: 4,
      grammarTopic: 'Übung: Konnektoren',
      explanationDe:
        'Wiederholung: "trotzdem" (Gegensatz), "deshalb" (Folge), "außerdem" (Ergänzung), "allerdings" (Einschränkung) — alle auf Position 1, Verb folgt direkt.',
      explanationEn:
        'Review: "trotzdem" (contrast), "deshalb" (consequence), "außerdem" (addition), "allerdings" (restriction) — all take position 1, with the verb immediately following.',
      explanationTr:
        'Tekrar: "trotzdem" (zıtlık), "deshalb" (sonuç), "außerdem" (ekleme), "allerdings" (sınırlama) — hepsi birinci konumda, fiil hemen ardından gelir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit11Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er hat viel Geld, ___ ist er nicht glücklich. (allerdings)' },
        correctAnswer: { accepted: ['allerdings'] },
        explanation: '"Allerdings" schränkt die vorherige Aussage ein.',
      },
      {
        lessonId: b1Unit11Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welcher Konnektor drückt eine Konsequenz aus: 'deshalb' oder 'außerdem'?" },
        correctAnswer: { accepted: ['deshalb'] },
        explanation: '"Deshalb" drückt eine Folge/Konsequenz aus.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit11Lesson1.id, word: 'krank', translationEn: 'sick', translationTr: 'hasta', exampleSentence: 'Ich bin krank.' },
      { lessonId: b1Unit11Lesson1.id, word: 'bleiben', translationEn: 'to stay', translationTr: 'kalmak', exampleSentence: 'Ich bleibe zu Hause.' },
      { lessonId: b1Unit11Lesson2.id, word: 'die Zeit', translationEn: 'the time', translationTr: 'zaman', exampleSentence: 'Sie hat keine Zeit.' },
      { lessonId: b1Unit11Lesson2.id, word: 'die Folge', translationEn: 'the consequence', translationTr: 'sonuç', exampleSentence: 'Das hat eine Folge.' },
      { lessonId: b1Unit11Lesson3.id, word: 'die Wohnung', translationEn: 'the apartment', translationTr: 'daire', exampleSentence: 'Die Wohnung ist schön.' },
      { lessonId: b1Unit11Lesson3.id, word: 'günstig', translationEn: 'affordable', translationTr: 'uygun fiyatlı', exampleSentence: 'Die Wohnung ist günstig.' },
      { lessonId: b1Unit11Lesson4.id, word: 'glücklich', translationEn: 'happy', translationTr: 'mutlu', exampleSentence: 'Er ist nicht glücklich.' },
      { lessonId: b1Unit11Lesson4.id, word: 'das Geld', translationEn: 'the money', translationTr: 'para', exampleSentence: 'Er hat viel Geld.' },
    ],
  })

  // --- B1 Unit 12: Indirekte Rede & Nomen-Verb-Verbindungen (4 lessons) ---
  const b1Unit12 = await prisma.unit.create({
    data: { levelId: b1.id, order: 12, titleDe: 'Indirekte Rede & Nomen-Verb-Verbindungen', titleEn: 'Reported Speech & Verb-Noun Collocations', titleTr: 'Dolaylı Anlatım ve İsim-Fiil Kalıpları' },
  })

  const b1Unit12Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit12.id,
      order: 1,
      grammarTopic: 'Indirekte Rede mit "dass"',
      explanationDe:
        'Auf B1-Niveau bildet man indirekte Rede oft einfach mit "dass" + Indikativ: "Er sagt, dass er müde ist." (Der Konjunktiv I folgt erst auf C1.)',
      explanationEn:
        'At B1 level, reported speech is often formed simply with "dass" + indicative: "Er sagt, dass er müde ist" (He says that he is tired). (Konjunktiv I comes later, at C1.)',
      explanationTr:
        'B1 seviyesinde dolaylı anlatım genellikle basitçe "dass" + bildirme kipiyle kurulur: "Er sagt, dass er müde ist." (Konjunktiv I ancak C1\'de gelir.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit12Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er sagt, ___ er müde ist.', options: ['dass', 'ob', 'weil', 'wenn'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Indirekte Rede auf B1-Niveau mit "dass".',
      },
      {
        lessonId: b1Unit12Lesson1.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['ist', 'dass', 'müde', 'er'] },
        correctAnswer: { order: ['dass', 'er', 'müde', 'ist'] },
        explanation: 'Verb am Ende im "dass"-Satz.',
      },
    ],
  })

  const b1Unit12Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit12.id,
      order: 2,
      grammarTopic: 'Nomen-Verb-Verbindungen (1)',
      explanationDe:
        'Feste Nomen-Verb-Verbindungen ersetzen oft ein einfaches Verb: "eine Entscheidung treffen" (= entscheiden), "Rücksicht nehmen" (= rücksichtsvoll sein).',
      explanationEn:
        'Fixed noun-verb collocations often replace a simple verb: "eine Entscheidung treffen" (to make a decision, = entscheiden), "Rücksicht nehmen" (to be considerate, = rücksichtsvoll sein).',
      explanationTr:
        'Sabit isim-fiil kalıpları genellikle basit bir fiilin yerini alır: "eine Entscheidung treffen" (karar vermek, = entscheiden), "Rücksicht nehmen" (anlayışlı olmak, = rücksichtsvoll sein).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit12Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Eine Entscheidung ___ = entscheiden.', options: ['treffen', 'machen', 'nehmen', 'geben'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Eine Entscheidung treffen" bedeutet "to make a decision".',
      },
      {
        lessonId: b1Unit12Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'to make a decision' (Nomen-Verb-Verbindung)?" },
        correctAnswer: { accepted: ['eine entscheidung treffen'] },
        explanation: '"Eine Entscheidung treffen" = "to make a decision".',
      },
    ],
  })

  const b1Unit12Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit12.id,
      order: 3,
      grammarTopic: 'Nomen-Verb-Verbindungen (2)',
      explanationDe:
        'Weitere Beispiele: "Kritik üben" (kritisieren), "in Kontakt stehen" (kontaktieren), "zur Verfügung stehen" (verfügbar sein).',
      explanationEn:
        'More examples: "Kritik üben" (to criticize, lit. "exercise criticism"), "in Kontakt stehen" (to be in contact), "zur Verfügung stehen" (to be available).',
      explanationTr:
        'Daha fazla örnek: "Kritik üben" (eleştirmek), "in Kontakt stehen" (iletişimde olmak), "zur Verfügung stehen" (kullanıma hazır olmak).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit12Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Kritik ___ = kritisieren.', options: ['üben', 'machen', 'sein', 'stehen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Kritik üben" bedeutet "to criticize".',
      },
      {
        lessonId: b1Unit12Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das Team steht zur ___. (Verfügung)' },
        correctAnswer: { accepted: ['verfügung'] },
        explanation: '"Zur Verfügung stehen" = "to be available".',
      },
    ],
  })

  const b1Unit12Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit12.id,
      order: 4,
      grammarTopic: 'Abschlusswiederholung B1',
      explanationDe:
        'Wiederholung des gesamten B1-Niveaus: Nebensätze, Konjunktiv II, Passiv, Relativsätze, Genitiv, Plusquamperfekt, Doppelkonjunktionen, Infinitiv mit zu, Adjektivdeklination, Konnektoren und indirekte Rede.',
      explanationEn:
        'Review of the whole B1 level: subordinate clauses, Konjunktiv II, passive voice, relative clauses, genitive, past perfect, paired conjunctions, infinitive with zu, adjective declension, connectors, and reported speech.',
      explanationTr:
        'Tüm B1 seviyesinin tekrarı: yan cümleler, Konjunktiv II, edilgen çatı, ilgi cümleleri, tamlayan hâli, miş\'li geçmişin hikâyesi, çift bağlaçlar, zu ile mastar, sıfat çekimi, bağlaçlar ve dolaylı anlatım.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit12Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er sagt, ___ er krank ist, ___ bleibt er zu Hause.', options: ['dass / deshalb', 'ob / trotzdem', 'weil / während', 'wenn / obwohl'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Indirekte Rede mit "dass" + logische Folge mit "deshalb".',
      },
      {
        lessonId: b1Unit12Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne eine Nomen-Verb-Verbindung, die 'entscheiden' bedeutet." },
        correctAnswer: { accepted: ['eine entscheidung treffen'] },
        explanation: '"Eine Entscheidung treffen" bedeutet "entscheiden".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit12Lesson1.id, word: 'müde', translationEn: 'tired', translationTr: 'yorgun', exampleSentence: 'Er sagt, dass er müde ist.' },
      { lessonId: b1Unit12Lesson1.id, word: 'sagen', translationEn: 'to say', translationTr: 'söylemek', exampleSentence: 'Er sagt die Wahrheit.' },
      { lessonId: b1Unit12Lesson2.id, word: 'die Entscheidung', translationEn: 'the decision', translationTr: 'karar', exampleSentence: 'Ich treffe eine Entscheidung.' },
      { lessonId: b1Unit12Lesson2.id, word: 'die Rücksicht', translationEn: 'the consideration', translationTr: 'anlayış', exampleSentence: 'Er nimmt Rücksicht auf andere.' },
      { lessonId: b1Unit12Lesson3.id, word: 'die Kritik', translationEn: 'the criticism', translationTr: 'eleştiri', exampleSentence: 'Er übt Kritik an dem Plan.' },
      { lessonId: b1Unit12Lesson3.id, word: 'die Verfügung', translationEn: 'the availability / disposal', translationTr: 'kullanıma hazır olma', exampleSentence: 'Das Team steht zur Verfügung.' },
      { lessonId: b1Unit12Lesson4.id, word: 'die Wahrheit', translationEn: 'the truth', translationTr: 'gerçek', exampleSentence: 'Er sagt die Wahrheit.' },
      { lessonId: b1Unit12Lesson4.id, word: 'insgesamt', translationEn: 'overall', translationTr: 'toplamda', exampleSentence: 'Insgesamt war der Kurs sehr gut.' },
    ],
  })

  // --- B1 Unit 13: Wortstellung: Tekamolo (4 lessons) ---
  const b1Unit13 = await prisma.unit.create({
    data: { levelId: b1.id, order: 13, titleDe: 'Wortstellung: Tekamolo', titleEn: 'Word Order: Time-Cause-Manner-Place', titleTr: 'Sözcük Dizilimi: Zaman-Sebep-Tarz-Yer' },
  })

  const b1Unit13Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b1Unit13.id,
      order: 1,
      grammarTopic: 'Tekamolo: Temporal vor Kausal',
      explanationDe:
        'Wenn mehrere Angaben im Satz stehen, gilt die Reihenfolge "Tekamolo": Temporal (wann) - Kausal (warum) - Modal (wie) - Lokal (wo). "Ich fahre heute wegen der Ferien mit dem Auto nach Berlin."',
      explanationEn:
        'When a sentence has several adverbials, the order follows "Tekamolo": Temporal (when) - Kausal (why) - Modal (how) - Lokal (where). "Ich fahre heute wegen der Ferien mit dem Auto nach Berlin" (I\'m driving to Berlin today because of the holidays by car).',
      explanationTr:
        'Cümlede birden fazla zarf tümleci varsa "Tekamolo" sırası geçerlidir: Zaman - Sebep - Tarz - Yer. "Ich fahre heute wegen der Ferien mit dem Auto nach Berlin."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit13Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welche Reihenfolge ist korrekt (Tekamolo)?', options: ['Temporal - Kausal - Modal - Lokal', 'Lokal - Modal - Kausal - Temporal', 'Modal - Temporal - Lokal - Kausal', 'Kausal - Lokal - Temporal - Modal'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Tekamolo: Temporal, Kausal, Modal, Lokal.',
      },
      {
        lessonId: b1Unit13Lesson1.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['heute', 'ich', 'fahre', 'nach', 'Berlin'] },
        correctAnswer: { order: ['ich', 'fahre', 'heute', 'nach', 'Berlin'] },
        explanation: 'Verb Position 2, dann Temporal ("heute"), dann Lokal ("nach Berlin").',
      },
    ],
  })

  const b1Unit13Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b1Unit13.id,
      order: 2,
      grammarTopic: 'Tekamolo: Modal vor Lokal',
      explanationDe:
        'Die Modalangabe (wie) steht vor der Lokalangabe (wo): "Sie fährt mit dem Zug nach München" — nicht "nach München mit dem Zug".',
      explanationEn:
        'The manner adverbial (how) comes before the place adverbial (where): "Sie fährt mit dem Zug nach München" (She travels by train to Munich) — not "nach München mit dem Zug".',
      explanationTr:
        'Tarz zarfı (nasıl), yer zarfından (nerede) önce gelir: "Sie fährt mit dem Zug nach München" — "nach München mit dem Zug" değil.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit13Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welcher Satz hat die korrekte Wortstellung?', options: ['Sie fährt mit dem Zug nach München.', 'Sie fährt nach München mit dem Zug.', 'Sie fährt nach mit dem Zug München.', 'Mit dem Zug sie fährt nach München.'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Modal ("mit dem Zug") steht vor Lokal ("nach München").',
      },
      {
        lessonId: b1Unit13Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er geht ___ (schnell) ___ (zur Arbeit). (Modal zuerst, dann Lokal)' },
        correctAnswer: { accepted: ['schnell zur arbeit'] },
        explanation: 'Modal vor Lokal: "schnell zur Arbeit".',
      },
    ],
  })

  const b1Unit13Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b1Unit13.id,
      order: 3,
      grammarTopic: 'Tekamolo mit allen vier Angaben',
      explanationDe:
        'Ein vollständiges Beispiel: "Wir fliegen morgen (temporal) wegen der Konferenz (kausal) mit dem Flugzeug (modal) nach Wien (lokal)."',
      explanationEn:
        'A complete example: "Wir fliegen morgen (temporal) wegen der Konferenz (kausal) mit dem Flugzeug (modal) nach Wien (lokal)" (We are flying tomorrow because of the conference by plane to Vienna).',
      explanationTr:
        'Tam bir örnek: "Wir fliegen morgen (zaman) wegen der Konferenz (sebep) mit dem Flugzeug (tarz) nach Wien (yer)."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit13Lesson3.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['morgen', 'wir', 'fliegen', 'nach', 'Wien'] },
        correctAnswer: { order: ['wir', 'fliegen', 'morgen', 'nach', 'Wien'] },
        explanation: 'Verb Position 2, dann Temporal, dann Lokal.',
      },
      {
        lessonId: b1Unit13Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "In Tekamolo, was kommt vor 'Modal' (wie)?" },
        correctAnswer: { accepted: ['kausal'] },
        explanation: 'Reihenfolge: Temporal, Kausal, Modal, Lokal.',
      },
    ],
  })

  const b1Unit13Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b1Unit13.id,
      order: 4,
      grammarTopic: 'Abschlussübung: Tekamolo',
      explanationDe:
        'Wiederholung der Tekamolo-Regel: Temporal - Kausal - Modal - Lokal. Diese Reihenfolge hilft, klare und natürliche Sätze zu bilden.',
      explanationEn:
        'Review of the Tekamolo rule: Temporal - Kausal - Modal - Lokal. This order helps form clear, natural sentences.',
      explanationTr:
        'Tekamolo kuralının tekrarı: Zaman - Sebep - Tarz - Yer. Bu sıralama net ve doğal cümleler kurmaya yardımcı olur.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b1Unit13Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich gehe ___ ins Kino. (heute Abend, aus Langeweile, zu Fuß — welche Reihenfolge?)', options: ['heute Abend aus Langeweile zu Fuß', 'zu Fuß aus Langeweile heute Abend', 'aus Langeweile zu Fuß heute Abend', 'zu Fuß heute Abend aus Langeweile'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Tekamolo: Temporal (heute Abend), Kausal (aus Langeweile), Modal (zu Fuß).',
      },
      {
        lessonId: b1Unit13Lesson4.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['Temporal', 'Kausal', 'Modal', 'Lokal'], rights: ['heute', 'wegen der Ferien', 'mit dem Auto', 'nach Berlin'] },
        correctAnswer: {
          pairs: [
            { left: 'Temporal', right: 'heute' },
            { left: 'Kausal', right: 'wegen der Ferien' },
            { left: 'Modal', right: 'mit dem Auto' },
            { left: 'Lokal', right: 'nach Berlin' },
          ],
        },
        explanation: 'Beispiele für jede Tekamolo-Kategorie.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b1Unit13Lesson1.id, word: 'die Ferien', translationEn: 'the holidays', translationTr: 'tatil', exampleSentence: 'Wir fahren wegen der Ferien nach Berlin.' },
      { lessonId: b1Unit13Lesson1.id, word: 'fahren', translationEn: 'to drive / travel', translationTr: 'gitmek (araçla)', exampleSentence: 'Ich fahre heute nach Berlin.' },
      { lessonId: b1Unit13Lesson2.id, word: 'der Zug', translationEn: 'the train', translationTr: 'tren', exampleSentence: 'Sie fährt mit dem Zug nach München.' },
      { lessonId: b1Unit13Lesson2.id, word: 'die Arbeit', translationEn: 'the work', translationTr: 'iş', exampleSentence: 'Er geht schnell zur Arbeit.' },
      { lessonId: b1Unit13Lesson3.id, word: 'die Konferenz', translationEn: 'the conference', translationTr: 'konferans', exampleSentence: 'Wir fliegen wegen der Konferenz nach Wien.' },
      { lessonId: b1Unit13Lesson3.id, word: 'das Flugzeug', translationEn: 'the airplane', translationTr: 'uçak', exampleSentence: 'Wir fliegen mit dem Flugzeug.' },
      { lessonId: b1Unit13Lesson4.id, word: 'die Langeweile', translationEn: 'the boredom', translationTr: 'sıkıntı', exampleSentence: 'Ich gehe aus Langeweile ins Kino.' },
      { lessonId: b1Unit13Lesson4.id, word: 'zu Fuß', translationEn: 'on foot', translationTr: 'yürüyerek', exampleSentence: 'Ich gehe zu Fuß zur Arbeit.' },
    ],
  })

  // --- B2: Passiv (1 sample lesson) ---
  const b2Unit = await prisma.unit.create({
    data: { levelId: b2.id, order: 1, titleDe: 'Passiv', titleEn: 'Passive Voice', titleTr: 'Edilgen Çatı' },
  })
  const b2Lesson = await prisma.lesson.create({
    data: {
      unitId: b2Unit.id,
      order: 1,
      grammarTopic: 'Vorgangspassiv im Präsens',
      explanationDe: 'Das Vorgangspassiv wird mit "werden" + Partizip II gebildet, z. B. "Das Haus wird gebaut."',
      explanationEn: 'The passive voice is formed with "werden" + past participle, e.g. "Das Haus wird gebaut" (The house is being built).',
      explanationTr: 'Edilgen çatı "werden" + Partizip II ile kurulur, örn. "Das Haus wird gebaut" (Ev inşa ediliyor).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Auto ___ repariert.', options: ['wird', 'ist', 'hat', 'wurde'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Präsens Passiv: "wird" + Partizip II.',
      },
      {
        lessonId: b2Lesson.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Tür ___ geöffnet.' },
        correctAnswer: { accepted: ['wird'] },
        explanation: 'Präsens Passiv von "öffnen": "wird geöffnet".',
      },
    ],
  })

  const b2Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit.id,
      order: 2,
      grammarTopic: 'Vorgangspassiv im Präteritum',
      explanationDe:
        'Das Vorgangspassiv im Präteritum wird mit "wurde" + Partizip II gebildet, z. B. "Das Haus wurde gebaut." Es beschreibt einen abgeschlossenen Vorgang in der Vergangenheit.',
      explanationEn:
        'The passive voice in the simple past (Präteritum) is formed with "wurde" + past participle, e.g. "Das Haus wurde gebaut" (The house was built). It describes a completed process in the past.',
      explanationTr:
        'Präteritum\'da edilgen çatı "wurde" + Partizip II ile kurulur, örn. "Das Haus wurde gebaut" (Ev inşa edildi). Geçmişte tamamlanmış bir süreci anlatır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der Brief ___ gestern geschrieben.', options: ['wurde', 'wird', 'ist', 'hat'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Präteritum Passiv: "wurde" + Partizip II.',
      },
      {
        lessonId: b2Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das Auto ___ letzte Woche repariert.' },
        correctAnswer: { accepted: ['wurde'] },
        explanation: 'Präteritum Passiv von "reparieren": "wurde repariert".',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Lesson2.id, word: 'schreiben', translationEn: 'to write', translationTr: 'yazmak', exampleSentence: 'Der Brief wurde gestern geschrieben.' },
      { lessonId: b2Lesson2.id, word: 'der Brief', translationEn: 'the letter', translationTr: 'mektup', exampleSentence: 'Ich habe einen Brief geschrieben.' },
    ],
  })

  const b2Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit.id,
      order: 3,
      grammarTopic: 'Zustandspassiv',
      explanationDe:
        'Das Zustandspassiv wird mit "sein" + Partizip II gebildet und beschreibt das Ergebnis einer Handlung, nicht den Vorgang selbst, z. B. "Die Tür ist geöffnet." (Zustand, nicht Vorgang).',
      explanationEn:
        'The stative passive is formed with "sein" + past participle and describes the result of an action, not the process itself, e.g. "Die Tür ist geöffnet" (The door is open — a state, not a process).',
      explanationTr:
        'Zustandspassiv "sein" + Partizip II ile kurulur ve eylemin kendisini değil sonucunu anlatır, örn. "Die Tür ist geöffnet" (Kapı açık — süreç değil durum).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der Laden ___ schon geschlossen.', options: ['ist', 'wird', 'wurde', 'hat'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Zustandspassiv: "sein" + Partizip II beschreibt den Zustand.',
      },
      {
        lessonId: b2Lesson3.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['Tür', 'ist', 'geöffnet', 'die'] },
        correctAnswer: { order: ['die', 'Tür', 'ist', 'geöffnet'] },
        explanation: 'Reihenfolge: Artikel + Nomen, Verb "sein", Partizip II.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Lesson3.id, word: 'schließen', translationEn: 'to close', translationTr: 'kapatmak', exampleSentence: 'Der Laden ist schon geschlossen.' },
      { lessonId: b2Lesson3.id, word: 'der Laden', translationEn: 'the shop', translationTr: 'dükkan', exampleSentence: 'Der Laden ist geöffnet.' },
    ],
  })

  const b2Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit.id,
      order: 4,
      grammarTopic: 'Passiv im Perfekt',
      explanationDe:
        'Das Vorgangspassiv im Perfekt wird mit "sein" + Partizip II + "worden" gebildet, z. B. "Das Haus ist gebaut worden." Im Perfekt Passiv steht "worden" statt "geworden".',
      explanationEn:
        'The passive voice in the perfect tense is formed with "sein" + past participle + "worden", e.g. "Das Haus ist gebaut worden" (The house has been built). In the perfect passive, "worden" is used instead of "geworden".',
      explanationTr:
        'Perfekt\'te edilgen çatı "sein" + Partizip II + "worden" ile kurulur, örn. "Das Haus ist gebaut worden" (Ev inşa edilmiş oldu). Perfekt Passiv\'de "geworden" yerine "worden" kullanılır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Projekt ist gestern beendet ___.', options: ['worden', 'geworden', 'wurde', 'wird'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Perfekt Passiv benutzt "worden", nicht "geworden".',
      },
      {
        lessonId: b2Lesson4.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Rechnung ist bereits bezahlt ___.' },
        correctAnswer: { accepted: ['worden'] },
        explanation: 'Perfekt Passiv: "ist bezahlt worden".',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Lesson4.id, word: 'beenden', translationEn: 'to finish / end', translationTr: 'bitirmek', exampleSentence: 'Das Projekt ist gestern beendet worden.' },
      { lessonId: b2Lesson4.id, word: 'bezahlen', translationEn: 'to pay', translationTr: 'ödemek', exampleSentence: 'Die Rechnung ist bereits bezahlt worden.' },
    ],
  })

  // --- B2 Unit 2: Konjunktiv I (formelle indirekte Rede) (4 lessons) ---
  const b2Unit2 = await prisma.unit.create({
    data: { levelId: b2.id, order: 2, titleDe: 'Konjunktiv I', titleEn: 'Subjunctive I', titleTr: 'Konjunktiv I (Dolaylı Anlatım)' },
  })

  const b2Unit2Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit2.id,
      order: 1,
      grammarTopic: 'Konjunktiv-I-Formen (regelmäßige Verben)',
      explanationDe:
        'Der Konjunktiv I wird bei regelmäßigen Verben aus dem Verbstamm + Endungen (-e, -est, -e, -en, -et, -en) gebildet, z. B. "er sage" (von "sagen"). Er wird vor allem in der formellen indirekten Rede verwendet.',
      explanationEn:
        'For regular verbs, Konjunktiv I is formed from the verb stem + endings (-e, -est, -e, -en, -et, -en), e.g. "er sage" (from "sagen", to say). It is mainly used in formal reported speech.',
      explanationTr:
        'Düzenli fiillerde Konjunktiv I, fiil kökü + ekler (-e, -est, -e, -en, -et, -en) ile kurulur, örn. "er sage" ("sagen"den, söylemek). Öncelikle resmi dolaylı anlatımda kullanılır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit2Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er sagt, er ___ (arbeiten) viel. (Konjunktiv I)', options: ['arbeite', 'arbeitet', 'arbeitete', 'arbeiten'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Konjunktiv I von "arbeiten" für "er": arbeite (Stamm + -e).',
      },
      {
        lessonId: b2Unit2Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie behauptet, sie ___ (glauben) das nicht.' },
        correctAnswer: { accepted: ['glaube'] },
        explanation: 'Konjunktiv I von "glauben" für "sie": glaube.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit2Lesson1.id, word: 'behaupten', translationEn: 'to claim', translationTr: 'iddia etmek', exampleSentence: 'Sie behauptet, sie glaube das nicht.' },
      { lessonId: b2Unit2Lesson1.id, word: 'glauben', translationEn: 'to believe', translationTr: 'inanmak', exampleSentence: 'Sie glaubt das nicht.' },
    ],
  })

  const b2Unit2Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit2.id,
      order: 2,
      grammarTopic: 'Konjunktiv I von sein/haben/Modalverben',
      explanationDe:
        'Die wichtigsten unregelmäßigen Konjunktiv-I-Formen: "sein" → ich sei, du seiest, er sei; "haben" → er habe; Modalverben wie "können" → er könne, "müssen" → er müsse.',
      explanationEn:
        'The most important irregular Konjunktiv I forms: "sein" (to be) → ich sei, du seiest, er sei; "haben" (to have) → er habe; modal verbs like "können" → er könne, "müssen" → er müsse.',
      explanationTr:
        'En önemli düzensiz Konjunktiv I biçimleri: "sein" (olmak) → ich sei, du seiest, er sei; "haben" (sahip olmak) → er habe; "können" gibi kip fiilleri → er könne, "müssen" → er müsse.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit2Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der Chef sagt, er ___ heute keine Zeit. (Konjunktiv I von "haben")', options: ['habe', 'hat', 'hätte', 'haben'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Konjunktiv I von "haben" für "er": habe.',
      },
      {
        lessonId: b2Unit2Lesson2.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['ich (sein)', 'er (müssen)', 'wir (haben)'], rights: ['müsse', 'haben', 'sei'] },
        correctAnswer: {
          pairs: [
            { left: 'ich (sein)', right: 'sei' },
            { left: 'er (müssen)', right: 'müsse' },
            { left: 'wir (haben)', right: 'haben' },
          ],
        },
        explanation: 'Konjunktiv-I-Formen: sein → sei, müssen → müsse, haben (wir) → haben.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit2Lesson2.id, word: 'der Chef', translationEn: 'the boss', translationTr: 'patron', exampleSentence: 'Der Chef sagt, er habe heute keine Zeit.' },
      { lessonId: b2Unit2Lesson2.id, word: 'die Firma', translationEn: 'the company', translationTr: 'şirket', exampleSentence: 'Er arbeitet für eine große Firma.' },
    ],
  })

  const b2Unit2Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit2.id,
      order: 3,
      grammarTopic: 'Ersatzform mit "würde"',
      explanationDe:
        'Wenn der Konjunktiv I mit dem Indikativ identisch ist (meist bei "wir" und "sie/Sie"), benutzt man stattdessen die Ersatzform mit "würde" + Infinitiv, z. B. "Sie sagen, sie würden kommen" statt "sie kommen".',
      explanationEn:
        'When Konjunktiv I is identical to the indicative (usually with "wir" and "sie/Sie"), the substitute form with "würde" + infinitive is used instead, e.g. "Sie sagen, sie würden kommen" (They say they would come) instead of "sie kommen".',
      explanationTr:
        'Konjunktiv I, bildirme kipiyle aynı olduğunda (genellikle "wir" ve "sie/Sie" ile), onun yerine "würde" + mastar ile yapılan yedek biçim kullanılır, örn. "Sie sagen, sie würden kommen" ("sie kommen" yerine).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit2Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Kollegen sagen, sie ___ morgen kommen. (Ersatzform)', options: ['würden', 'werden', 'würde', 'sind'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Bei "sie" (Plural) benutzt man die Ersatzform: würden + Infinitiv.',
      },
      {
        lessonId: b2Unit2Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er meint, sie ___ das Projekt unterstützen. (würde-Form)' },
        correctAnswer: { accepted: ['würden'] },
        explanation: 'Ersatzform für "sie" (Plural): würden.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit2Lesson3.id, word: 'unterstützen', translationEn: 'to support', translationTr: 'desteklemek', exampleSentence: 'Sie würden das Projekt unterstützen.' },
      { lessonId: b2Unit2Lesson3.id, word: 'die Kollegen', translationEn: 'the colleagues', translationTr: 'meslektaşlar', exampleSentence: 'Die Kollegen sagen, sie würden morgen kommen.' },
    ],
  })

  const b2Unit2Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit2.id,
      order: 4,
      grammarTopic: 'Indirekte Fragen/Aufforderungen',
      explanationDe:
        'In indirekten Fragen steht das Fragewort oder "ob" am Satzanfang, das Verb im Konjunktiv I am Ende: "Er fragt, ob sie Zeit habe." Indirekte Aufforderungen werden mit "sollen" wiedergegeben: "Er sagt, sie solle warten."',
      explanationEn:
        'In indirect questions, the question word or "ob" (whether) starts the clause and the verb (in Konjunktiv I) comes at the end: "Er fragt, ob sie Zeit habe." (He asks whether she has time.) Indirect commands are reported with "sollen": "Er sagt, sie solle warten." (He says she should wait.)',
      explanationTr:
        'Dolaylı sorularda soru kelimesi ya da "ob" cümle başında yer alır, fiil (Konjunktiv I\'de) sonda gelir: "Er fragt, ob sie Zeit habe." (Vakti olup olmadığını soruyor.) Dolaylı emirler "sollen" ile aktarılır: "Er sagt, sie solle warten." (Beklemesi gerektiğini söylüyor.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit2Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['ob', 'Zeit', 'habe', 'sie'] },
        correctAnswer: { order: ['ob', 'sie', 'Zeit', 'habe'] },
        explanation: 'Im indirekten Fragesatz: "ob" + Subjekt + ... + Verb (Konjunktiv I) am Ende.',
      },
      {
        lessonId: b2Unit2Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie lautet die indirekte Aufforderung für 'Warte!' mit 'Er sagt, sie...'?" },
        correctAnswer: { accepted: ['sie solle warten'] },
        explanation: 'Indirekte Aufforderung mit "sollen": sie solle warten.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit2Lesson4.id, word: 'die Aufforderung', translationEn: 'the request / command', translationTr: 'istek / emir', exampleSentence: 'Das ist eine indirekte Aufforderung.' },
      { lessonId: b2Unit2Lesson4.id, word: 'die Frage', translationEn: 'the question', translationTr: 'soru', exampleSentence: 'Er fragt, ob sie Zeit habe.' },
    ],
  })

  // --- B2 Unit 3: Passiv mit Modalverben (4 lessons) ---
  const b2Unit3 = await prisma.unit.create({
    data: { levelId: b2.id, order: 3, titleDe: 'Passiv mit Modalverben', titleEn: 'Passive with Modal Verbs', titleTr: 'Kip Fiilleriyle Edilgen Çatı' },
  })

  const b2Unit3Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit3.id,
      order: 1,
      grammarTopic: 'Passiv mit Modalverben im Präsens',
      explanationDe:
        'Im Passiv mit Modalverben steht das Modalverb konjugiert, das Vollverb als Partizip II und "werden" als Infinitiv am Satzende: "Die Arbeit muss gemacht werden." (Präsens)',
      explanationEn:
        'In the passive with modal verbs, the modal verb is conjugated, the main verb appears as a past participle, and "werden" stands as an infinitive at the end of the clause: "Die Arbeit muss gemacht werden." (The work must be done.) (present tense)',
      explanationTr:
        'Kip fiilleriyle edilgen çatıda kip fiili çekimli, ana fiil Partizip II olarak, "werden" ise mastar halinde cümle sonunda yer alır: "Die Arbeit muss gemacht werden." (İş yapılmalı.) (şimdiki zaman)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit3Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Formular ___ ausgefüllt werden.', options: ['muss', 'musste', 'ist', 'wird'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Präsens Passiv mit Modalverb: "muss" + Partizip II + "werden".',
      },
      {
        lessonId: b2Unit3Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Fenster ___ geputzt werden. (müssen)' },
        correctAnswer: { accepted: ['müssen'] },
        explanation: 'Mit "die Fenster" (Plural) benutzt man "müssen".',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit3Lesson1.id, word: 'ausfüllen', translationEn: 'to fill out', translationTr: 'doldurmak', exampleSentence: 'Das Formular muss ausgefüllt werden.' },
      { lessonId: b2Unit3Lesson1.id, word: 'putzen', translationEn: 'to clean', translationTr: 'temizlemek', exampleSentence: 'Die Fenster müssen geputzt werden.' },
    ],
  })

  const b2Unit3Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit3.id,
      order: 2,
      grammarTopic: 'Passiv mit Modalverben im Präteritum',
      explanationDe:
        'Im Präteritum Passiv mit Modalverben wird das Modalverb im Präteritum konjugiert: "Die Arbeit musste gemacht werden." (Vergangenheit)',
      explanationEn:
        'In the simple past passive with modal verbs, the modal verb is conjugated in the Präteritum: "Die Arbeit musste gemacht werden." (The work had to be done.) (past)',
      explanationTr:
        'Kip fiilleriyle Präteritum edilgen çatıda kip fiili Präteritum\'da çekimlenir: "Die Arbeit musste gemacht werden." (İş yapılmalıydı.) (geçmiş)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit3Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der Bericht ___ gestern geschrieben werden.', options: ['musste', 'muss', 'wurde', 'ist'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Präteritum Passiv mit Modalverb: "musste" + Partizip II + "werden".',
      },
      {
        lessonId: b2Unit3Lesson2.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['werden', 'musste', 'repariert', 'das', 'Auto'] },
        correctAnswer: { order: ['das', 'Auto', 'musste', 'repariert', 'werden'] },
        explanation: 'Wortstellung: Subjekt, Modalverb (Präteritum), Partizip II, "werden".',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit3Lesson2.id, word: 'der Bericht', translationEn: 'the report', translationTr: 'rapor', exampleSentence: 'Der Bericht musste gestern geschrieben werden.' },
      { lessonId: b2Unit3Lesson2.id, word: 'die Reparatur', translationEn: 'the repair', translationTr: 'tamir', exampleSentence: 'Das Auto musste repariert werden.' },
    ],
  })

  const b2Unit3Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit3.id,
      order: 3,
      grammarTopic: 'Negation im Passiv mit Modalverben',
      explanationDe:
        'Die Negation steht meist vor dem Partizip II oder vor "werden": "Das darf nicht gemacht werden." / "Das Auto darf hier nicht geparkt werden."',
      explanationEn:
        'The negation usually stands before the past participle or before "werden": "Das darf nicht gemacht werden." (That must not be done.) / "Das Auto darf hier nicht geparkt werden." (The car may not be parked here.)',
      explanationTr:
        'Olumsuzluk genellikle Partizip II\'den ya da "werden"den önce yer alır: "Das darf nicht gemacht werden." (Bu yapılmamalı.) / "Das Auto darf hier nicht geparkt werden." (Araba burada park edilmemeli.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit3Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Hier ___ nicht geraucht werden.', options: ['darf', 'muss', 'kann', 'soll'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Darf nicht" drückt ein Verbot aus.',
      },
      {
        lessonId: b2Unit3Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das Auto darf hier nicht ___ werden. (parken)' },
        correctAnswer: { accepted: ['geparkt'] },
        explanation: 'Partizip II von "parken": geparkt.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit3Lesson3.id, word: 'rauchen', translationEn: 'to smoke', translationTr: 'sigara içmek', exampleSentence: 'Hier darf nicht geraucht werden.' },
      { lessonId: b2Unit3Lesson3.id, word: 'parken', translationEn: 'to park', translationTr: 'park etmek', exampleSentence: 'Das Auto darf hier nicht geparkt werden.' },
    ],
  })

  const b2Unit3Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit3.id,
      order: 4,
      grammarTopic: 'Wiederholung: Passiv mit Modalverben',
      explanationDe:
        'Wiederholung: Passiv mit Modalverben in Präsens, Präteritum und Negation. Merke: Modalverb konjugiert + Partizip II + "werden" am Satzende.',
      explanationEn:
        'Review: passive with modal verbs in present, simple past, and negation. Remember: conjugated modal verb + past participle + "werden" at the end of the clause.',
      explanationTr:
        'Tekrar: kip fiilleriyle şimdiki zaman, geçmiş zaman ve olumsuzlukta edilgen çatı. Unutma: çekimli kip fiili + Partizip II + cümle sonunda "werden".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit3Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Regeln ___ beachtet werden. (müssen, Präsens)', options: ['müssen', 'mussten', 'muss', 'musste'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Mit "die Regeln" (Plural) benutzt man "müssen".',
      },
      {
        lessonId: b2Unit3Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'The letter had to be sent'? (Passiv mit Modalverb, Präteritum)" },
        correctAnswer: { accepted: ['der brief musste geschickt werden'] },
        explanation: '"Der Brief musste geschickt werden" ist die richtige Übersetzung.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit3Lesson4.id, word: 'beachten', translationEn: 'to observe / pay attention to', translationTr: 'dikkat etmek', exampleSentence: 'Die Regeln müssen beachtet werden.' },
      { lessonId: b2Unit3Lesson4.id, word: 'die Regel', translationEn: 'the rule', translationTr: 'kural', exampleSentence: 'Die Regeln müssen beachtet werden.' },
    ],
  })

  // --- B2 Unit 4: Partizipialattribute (4 lessons) ---
  const b2Unit4 = await prisma.unit.create({
    data: { levelId: b2.id, order: 4, titleDe: 'Partizipialattribute', titleEn: 'Participial Attributes', titleTr: 'Partisip Sıfatları' },
  })

  const b2Unit4Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit4.id,
      order: 1,
      grammarTopic: 'Partizip I als Adjektiv',
      explanationDe:
        'Partizip I (Infinitiv + d) wird wie ein Adjektiv dekliniert und drückt eine gleichzeitige, aktive Handlung aus: "der schlafende Mann" (der Mann, der schläft).',
      explanationEn:
        'Partizip I (infinitive + d) is declined like an adjective and expresses a simultaneous, active action: "der schlafende Mann" (the sleeping man = the man who is sleeping).',
      explanationTr:
        'Partizip I (mastar + d), sıfat gibi çekimlenir ve eşzamanlı, etken bir eylemi ifade eder: "der schlafende Mann" (uyuyan adam = uyumakta olan adam).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit4Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das ___ Kind spielt im Garten. (spielen, Partizip I)', options: ['spielende', 'gespielte', 'spielend', 'spielte'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Partizip I: Infinitiv + d + Adjektivendung: spielende.',
      },
      {
        lessonId: b2Unit4Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Der ___ Hund bellt laut. (bellen, Partizip I)' },
        correctAnswer: { accepted: ['bellende'] },
        explanation: 'Partizip I von "bellen": bellende.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit4Lesson1.id, word: 'der Garten', translationEn: 'the garden', translationTr: 'bahçe', exampleSentence: 'Das Kind spielt im Garten.' },
      { lessonId: b2Unit4Lesson1.id, word: 'bellen', translationEn: 'to bark', translationTr: 'havlamak', exampleSentence: 'Der bellende Hund läuft schnell.' },
    ],
  })

  const b2Unit4Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit4.id,
      order: 2,
      grammarTopic: 'Partizip II als Adjektiv',
      explanationDe:
        'Partizip II wird ebenfalls wie ein Adjektiv dekliniert und drückt meist eine abgeschlossene, passive Handlung aus: "der reparierte Wagen" (der Wagen, der repariert wurde).',
      explanationEn:
        'Partizip II is also declined like an adjective and usually expresses a completed, passive action: "der reparierte Wagen" (the repaired car = the car that was repaired).',
      explanationTr:
        'Partizip II de sıfat gibi çekimlenir ve genellikle tamamlanmış, edilgen bir eylemi ifade eder: "der reparierte Wagen" (tamir edilmiş araba = tamir edilen araba).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit4Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die ___ Tür war kaputt. (öffnen, Partizip II)', options: ['geöffnete', 'öffnende', 'offene', 'öffnete'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Partizip II von "öffnen": geöffnete.',
      },
      {
        lessonId: b2Unit4Lesson2.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['gekocht', 'geschrieben', 'verkauft'], rights: ['written', 'sold', 'cooked'] },
        correctAnswer: {
          pairs: [
            { left: 'gekocht', right: 'cooked' },
            { left: 'geschrieben', right: 'written' },
            { left: 'verkauft', right: 'sold' },
          ],
        },
        explanation: 'Partizip-II-Formen und ihre Bedeutung.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit4Lesson2.id, word: 'kaputt', translationEn: 'broken', translationTr: 'bozuk', exampleSentence: 'Die geöffnete Tür war kaputt.' },
      { lessonId: b2Unit4Lesson2.id, word: 'verkaufen', translationEn: 'to sell', translationTr: 'satmak', exampleSentence: 'Das verkaufte Haus war teuer.' },
    ],
  })

  const b2Unit4Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit4.id,
      order: 3,
      grammarTopic: 'Erweiterte Partizipialattribute',
      explanationDe:
        'Erweiterte Partizipialattribute enthalten zusätzliche Informationen vor dem Partizip: "der von vielen Menschen geliebte Sänger" (der Sänger, der von vielen Menschen geliebt wird). Typisch für formelle, schriftliche Texte.',
      explanationEn:
        'Extended participial attributes include additional information before the participle: "der von vielen Menschen geliebte Sänger" (the singer loved by many people). Typical of formal, written texts.',
      explanationTr:
        'Genişletilmiş partisip sıfatları, partisipten önce ek bilgi içerir: "der von vielen Menschen geliebte Sänger" (birçok insan tarafından sevilen şarkıcı). Resmi, yazılı metinlerde tipiktir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit4Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der ___ Bericht wurde veröffentlicht. (gestern geschrieben)', options: ['gestern geschriebene', 'geschriebene gestern', 'schreibende gestern', 'geschrieben gestern'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Erweitertes Partizipialattribut: Zeitangabe + Partizip II + Nomen.',
      },
      {
        lessonId: b2Unit4Lesson3.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['gelesene', 'das', 'Buch', 'viel'] },
        correctAnswer: { order: ['das', 'viel', 'gelesene', 'Buch'] },
        explanation: 'Reihenfolge: Artikel, Zusatzinformation, Partizip, Nomen.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit4Lesson3.id, word: 'veröffentlichen', translationEn: 'to publish', translationTr: 'yayınlamak', exampleSentence: 'Der Bericht wurde veröffentlicht.' },
      { lessonId: b2Unit4Lesson3.id, word: 'beliebt', translationEn: 'popular', translationTr: 'popüler', exampleSentence: 'Das ist ein beliebtes Buch.' },
    ],
  })

  const b2Unit4Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit4.id,
      order: 4,
      grammarTopic: 'Umwandlung zu Relativsätzen',
      explanationDe:
        'Partizipialattribute lassen sich in Relativsätze umwandeln: "der schlafende Mann" → "der Mann, der schläft"; "das reparierte Auto" → "das Auto, das repariert wurde".',
      explanationEn:
        'Participial attributes can be converted into relative clauses: "der schlafende Mann" → "der Mann, der schläft" (the man who is sleeping); "das reparierte Auto" → "das Auto, das repariert wurde" (the car that was repaired).',
      explanationTr:
        'Partisip sıfatları ilgi cümlelerine dönüştürülebilir: "der schlafende Mann" → "der Mann, der schläft" (uyuyan adam); "das reparierte Auto" → "das Auto, das repariert wurde" (tamir edilen araba).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit4Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '"Der lachende Junge" bedeutet als Relativsatz: "Der Junge, der ___."', options: ['lacht', 'lachte', 'gelacht hat', 'lachen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Partizip I entspricht dem Präsens im Relativsatz: der lacht.',
      },
      {
        lessonId: b2Unit4Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wandle um: 'das gebaute Haus' → 'das Haus, das ___' (Relativsatz mit Passiv)" },
        correctAnswer: { accepted: ['gebaut wurde'] },
        explanation: 'Partizip II entspricht dem Passiv im Relativsatz: das gebaut wurde.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit4Lesson4.id, word: 'lachen', translationEn: 'to laugh', translationTr: 'gülmek', exampleSentence: 'Der lachende Junge spielt draußen.' },
      { lessonId: b2Unit4Lesson4.id, word: 'bauen', translationEn: 'to build', translationTr: 'inşa etmek', exampleSentence: 'Das gebaute Haus ist neu.' },
    ],
  })

  // --- B2 Unit 5: Nominalisierung (4 lessons) ---
  const b2Unit5 = await prisma.unit.create({
    data: { levelId: b2.id, order: 5, titleDe: 'Nominalisierung', titleEn: 'Nominalization', titleTr: 'İsimleştirme' },
  })

  const b2Unit5Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit5.id,
      order: 1,
      grammarTopic: 'Verben zu Nomen (-ung)',
      explanationDe:
        'Viele Verben werden durch das Suffix "-ung" zu femininen Nomen: entwickeln → die Entwicklung, untersuchen → die Untersuchung. Diese Nominalisierung ist typisch für formelle Texte.',
      explanationEn:
        'Many verbs become feminine nouns with the suffix "-ung": entwickeln (to develop) → die Entwicklung (the development), untersuchen (to examine) → die Untersuchung (the examination). This nominalization is typical of formal texts.',
      explanationTr:
        '"-ung" eki ile birçok fiil dişil isme dönüşür: entwickeln (geliştirmek) → die Entwicklung (gelişim), untersuchen (incelemek) → die Untersuchung (inceleme). Bu isimleştirme resmi metinlerde tipiktir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit5Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Nomen von "entwickeln" lautet ___.', options: ['die Entwicklung', 'der Entwickler', 'das Entwickeln', 'die Entwickelung'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Entwickeln" + "-ung" = die Entwicklung.',
      },
      {
        lessonId: b2Unit5Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die ___ (untersuchen) dauerte drei Stunden.' },
        correctAnswer: { accepted: ['Untersuchung'] },
        explanation: '"Untersuchen" + "-ung" = die Untersuchung.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit5Lesson1.id, word: 'entwickeln', translationEn: 'to develop', translationTr: 'geliştirmek', exampleSentence: 'Die Entwicklung dauert lange.' },
      { lessonId: b2Unit5Lesson1.id, word: 'untersuchen', translationEn: 'to examine', translationTr: 'incelemek', exampleSentence: 'Die Untersuchung dauerte drei Stunden.' },
    ],
  })

  const b2Unit5Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit5.id,
      order: 2,
      grammarTopic: 'Adjektive zu Nomen (-heit/-keit)',
      explanationDe:
        'Adjektive werden mit "-heit" oder "-keit" zu femininen Nomen: frei → die Freiheit, möglich → die Möglichkeit, schön → die Schönheit.',
      explanationEn:
        'Adjectives become feminine nouns with "-heit" or "-keit": frei (free) → die Freiheit (freedom), möglich (possible) → die Möglichkeit (possibility), schön (beautiful) → die Schönheit (beauty).',
      explanationTr:
        'Sıfatlar "-heit" ya da "-keit" ekiyle dişil isme dönüşür: frei (özgür) → die Freiheit (özgürlük), möglich (mümkün) → die Möglichkeit (olasılık), schön (güzel) → die Schönheit (güzellik).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit5Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Nomen von "möglich" lautet ___.', options: ['die Möglichkeit', 'die Möglichheit', 'der Mögliche', 'das Möglichsein'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Möglich" + "-keit" = die Möglichkeit.',
      },
      {
        lessonId: b2Unit5Lesson2.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['frei', 'schön', 'möglich'], rights: ['Schönheit', 'Möglichkeit', 'Freiheit'] },
        correctAnswer: {
          pairs: [
            { left: 'frei', right: 'Freiheit' },
            { left: 'schön', right: 'Schönheit' },
            { left: 'möglich', right: 'Möglichkeit' },
          ],
        },
        explanation: 'Adjektive + "-heit"/"-keit" = Nomen.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit5Lesson2.id, word: 'frei', translationEn: 'free', translationTr: 'özgür', exampleSentence: 'Die Freiheit ist wichtig.' },
      { lessonId: b2Unit5Lesson2.id, word: 'möglich', translationEn: 'possible', translationTr: 'mümkün', exampleSentence: 'Das ist eine gute Möglichkeit.' },
    ],
  })

  const b2Unit5Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit5.id,
      order: 3,
      grammarTopic: 'Infinitiv als Nomen',
      explanationDe:
        'Jeder Infinitiv kann als neutrales Nomen benutzt werden, großgeschrieben: rauchen → das Rauchen, lesen → das Lesen. Diese Form beschreibt die Handlung allgemein.',
      explanationEn:
        'Any infinitive can be used as a neuter noun, capitalized: rauchen (to smoke) → das Rauchen (smoking), lesen (to read) → das Lesen (reading). This form describes the action in general.',
      explanationTr:
        'Her mastar büyük harfle yazılarak nötr isim olarak kullanılabilir: rauchen (sigara içmek) → das Rauchen (sigara içme), lesen (okumak) → das Lesen (okuma). Bu biçim eylemi genel olarak anlatır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit5Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ ist hier verboten. (rauchen, als Nomen)', options: ['Das Rauchen', 'Rauchen', 'Der Raucher', 'Das Geraucht'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Der Infinitiv als Nomen: das Rauchen (großgeschrieben, mit Artikel "das").',
      },
      {
        lessonId: b2Unit5Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Bilde das Nomen aus dem Infinitiv 'schwimmen'." },
        correctAnswer: { accepted: ['das schwimmen'] },
        explanation: '"Schwimmen" als Nomen: das Schwimmen.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit5Lesson3.id, word: 'verboten', translationEn: 'forbidden', translationTr: 'yasak', exampleSentence: 'Rauchen ist hier verboten.' },
      { lessonId: b2Unit5Lesson3.id, word: 'das Schwimmen', translationEn: 'swimming', translationTr: 'yüzme', exampleSentence: 'Das Schwimmen macht Spaß.' },
    ],
  })

  const b2Unit5Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit5.id,
      order: 4,
      grammarTopic: 'Nominalisierung in formellen Texten',
      explanationDe:
        'In formellen Texten (Berichten, Amtsdeutsch) wird oft nominalisiert statt Verben zu benutzen: "Nach Abschluss der Untersuchung..." statt "Nachdem die Untersuchung abgeschlossen wurde...". Das wirkt kompakter und offizieller.',
      explanationEn:
        'In formal texts (reports, official German), nominalization is often used instead of verbs: "Nach Abschluss der Untersuchung..." (After completion of the investigation...) instead of "Nachdem die Untersuchung abgeschlossen wurde..." (After the investigation was completed...). This sounds more compact and official.',
      explanationTr:
        'Resmi metinlerde (raporlar, resmi dil) fiiller yerine sık sık isimleştirme kullanılır: "Nach Abschluss der Untersuchung..." ("İncelemenin tamamlanmasından sonra...") ifadesi, "Nachdem die Untersuchung abgeschlossen wurde..." ("İnceleme tamamlandıktan sonra...") yerine kullanılır. Bu daha derli toplu ve resmi görünür.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit5Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '"Nach ___ der Arbeit gehen wir nach Hause." (Abschluss/beenden)', options: ['Abschluss', 'Beenden', 'Abschließen', 'Beendung'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Abschluss" ist das gebräuchliche Nomen für "beenden" in formellen Texten.',
      },
      {
        lessonId: b2Unit5Lesson4.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die ___ (entscheiden) fiel schwer.' },
        correctAnswer: { accepted: ['Entscheidung'] },
        explanation: '"Entscheiden" + "-ung" = die Entscheidung.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit5Lesson4.id, word: 'der Abschluss', translationEn: 'the completion / conclusion', translationTr: 'tamamlama', exampleSentence: 'Nach Abschluss der Arbeit gehen wir nach Hause.' },
      { lessonId: b2Unit5Lesson4.id, word: 'entscheiden', translationEn: 'to decide', translationTr: 'karar vermek', exampleSentence: 'Die Entscheidung fiel schwer.' },
    ],
  })

  // --- B2 Unit 6: Komplexe Konnektoren (4 lessons) ---
  const b2Unit6 = await prisma.unit.create({
    data: { levelId: b2.id, order: 6, titleDe: 'Komplexe Konnektoren', titleEn: 'Complex Connectors', titleTr: 'Karmaşık Bağlaçlar' },
  })

  const b2Unit6Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit6.id,
      order: 1,
      grammarTopic: 'dennoch/trotzdem',
      explanationDe:
        '"Dennoch" und "trotzdem" drücken einen Gegensatz aus und stehen meist am Satzanfang mit Verb-Zweit-Stellung: "Es regnete stark. Trotzdem gingen wir spazieren."',
      explanationEn:
        '"Dennoch" and "trotzdem" (nevertheless) express a contrast and usually stand at the start of the clause with the verb in second position: "Es regnete stark. Trotzdem gingen wir spazieren." (It rained heavily. Nevertheless, we went for a walk.)',
      explanationTr:
        '"Dennoch" ve "trotzdem" (yine de) bir zıtlık ifade eder ve genellikle cümle başında, fiil ikinci sırada olacak şekilde yer alır: "Es regnete stark. Trotzdem gingen wir spazieren." (Şiddetli yağmur yağıyordu. Yine de yürüyüşe çıktık.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit6Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er war krank. ___ ging er zur Arbeit.', options: ['Trotzdem', 'Deshalb', 'Weil', 'Obwohl'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Trotzdem" drückt einen Gegensatz zwischen Krankheit und Arbeit aus.',
      },
      {
        lessonId: b2Unit6Lesson1.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['trotzdem', 'wir', 'spazieren', 'gingen'] },
        correctAnswer: { order: ['trotzdem', 'gingen', 'wir', 'spazieren'] },
        explanation: '"Trotzdem" steht an Position 1, danach folgt das Verb.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit6Lesson1.id, word: 'spazieren gehen', translationEn: 'to go for a walk', translationTr: 'yürüyüşe çıkmak', exampleSentence: 'Wir gingen trotzdem spazieren.' },
      { lessonId: b2Unit6Lesson1.id, word: 'regnen', translationEn: 'to rain', translationTr: 'yağmur yağmak', exampleSentence: 'Es regnete stark.' },
    ],
  })

  const b2Unit6Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit6.id,
      order: 2,
      grammarTopic: 'gleichwohl',
      explanationDe:
        '"Gleichwohl" ist ein formelles Synonym für "dennoch/trotzdem" und wird vor allem in geschriebener, gehobener Sprache verwendet: "Die Lage war schwierig, gleichwohl fand man eine Lösung."',
      explanationEn:
        '"Gleichwohl" is a formal synonym for "dennoch/trotzdem" (nevertheless) used mainly in written, elevated language: "Die Lage war schwierig, gleichwohl fand man eine Lösung." (The situation was difficult; nevertheless, a solution was found.)',
      explanationTr:
        '"Gleichwohl", "dennoch/trotzdem" için resmi bir eş anlamlıdır ve öncelikle yazılı, seçkin dilde kullanılır: "Die Lage war schwierig, gleichwohl fand man eine Lösung." (Durum zordu, yine de bir çözüm bulundu.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit6Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Verhandlungen waren schwierig; ___ einigte man sich. (formell)', options: ['gleichwohl', 'weil', 'damit', 'falls'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Gleichwohl" passt formell für einen Gegensatz.',
      },
      {
        lessonId: b2Unit6Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Der Plan war riskant, ___ wurde er umgesetzt.' },
        correctAnswer: { accepted: ['gleichwohl'] },
        explanation: '"Gleichwohl" verbindet Risiko und Umsetzung als Gegensatz.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit6Lesson2.id, word: 'die Verhandlung', translationEn: 'the negotiation', translationTr: 'müzakere', exampleSentence: 'Die Verhandlungen waren schwierig.' },
      { lessonId: b2Unit6Lesson2.id, word: 'umsetzen', translationEn: 'to implement', translationTr: 'uygulamak', exampleSentence: 'Der Plan wurde umgesetzt.' },
    ],
  })

  const b2Unit6Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit6.id,
      order: 3,
      grammarTopic: 'insofern (als)',
      explanationDe:
        '"Insofern (als)" leitet einen einschränkenden Nebensatz ein und bedeutet "in dem Maße, wie": "Der Vorschlag ist gut, insofern als er realistisch ist."',
      explanationEn:
        '"Insofern (als)" introduces a limiting subordinate clause and means "to the extent that": "Der Vorschlag ist gut, insofern als er realistisch ist." (The proposal is good insofar as it is realistic.)',
      explanationTr:
        '"Insofern (als)", sınırlayıcı bir yan cümle başlatır ve "şu ölçüde ki" anlamına gelir: "Der Vorschlag ist gut, insofern als er realistisch ist." (Öneri, gerçekçi olduğu ölçüde iyidir.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit6Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Idee ist interessant, ___ als sie neu ist.', options: ['insofern', 'obwohl', 'damit', 'falls'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Insofern als" schränkt die Aussage ein.',
      },
      {
        lessonId: b2Unit6Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'to the extent that / insofar as'?" },
        correctAnswer: { accepted: ['insofern als', 'insofern'] },
        explanation: '"Insofern (als)" bedeutet "to the extent that".',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit6Lesson3.id, word: 'realistisch', translationEn: 'realistic', translationTr: 'gerçekçi', exampleSentence: 'Der Vorschlag ist realistisch.' },
      { lessonId: b2Unit6Lesson3.id, word: 'der Vorschlag', translationEn: 'the proposal', translationTr: 'öneri', exampleSentence: 'Die Idee ist interessant.' },
    ],
  })

  const b2Unit6Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit6.id,
      order: 4,
      grammarTopic: 'zumal',
      explanationDe:
        '"Zumal" begründet eine Aussage zusätzlich und bedeutet "besonders weil/da": "Wir bleiben zu Hause, zumal es stark regnet." Es steht am Anfang eines Nebensatzes, das Verb am Ende.',
      explanationEn:
        '"Zumal" gives an additional reason and means "especially because/since": "Wir bleiben zu Hause, zumal es stark regnet." (We are staying home, especially since it is raining heavily.) It starts a subordinate clause, with the verb at the end.',
      explanationTr:
        '"Zumal" ek bir gerekçe sunar ve "özellikle çünkü/madem ki" anlamına gelir: "Wir bleiben zu Hause, zumal es stark regnet." (Evde kalıyoruz, özellikle şiddetli yağmur yağdığından.) Bir yan cümle başlatır, fiil sonda yer alır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit6Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wir bleiben zu Hause, ___ es stark regnet.', options: ['zumal', 'obwohl', 'damit', 'bevor'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Zumal" begründet zusätzlich: besonders weil es regnet.',
      },
      {
        lessonId: b2Unit6Lesson4.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['stark', 'regnet', 'es', 'zumal'] },
        correctAnswer: { order: ['zumal', 'es', 'stark', 'regnet'] },
        explanation: 'Nebensatz mit "zumal": Konjunktion + Subjekt + ... + Verb am Ende.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit6Lesson4.id, word: 'zu Hause', translationEn: 'at home', translationTr: 'evde', exampleSentence: 'Wir bleiben zu Hause.' },
      { lessonId: b2Unit6Lesson4.id, word: 'stark', translationEn: 'strong / heavily', translationTr: 'güçlü / şiddetli', exampleSentence: 'Es regnet stark.' },
    ],
  })

  // --- B2 Unit 7: Funktionsverbgefüge (4 lessons) ---
  const b2Unit7 = await prisma.unit.create({
    data: { levelId: b2.id, order: 7, titleDe: 'Funktionsverbgefüge', titleEn: 'Support Verb Constructions', titleTr: 'Fiil-İsim Kalıpları' },
  })

  const b2Unit7Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit7.id,
      order: 1,
      grammarTopic: 'in Frage stellen / zur Verfügung stehen',
      explanationDe:
        'Funktionsverbgefüge bestehen aus einem "leeren" Verb + Nomen und ersetzen oft ein einfaches Verb: "in Frage stellen" (= bezweifeln), "zur Verfügung stehen" (= verfügbar sein). Typisch für formelle Sprache.',
      explanationEn:
        'Support verb constructions consist of a "light" verb + noun and often replace a simple verb: "in Frage stellen" (to call into question, = bezweifeln), "zur Verfügung stehen" (to be available, = verfügbar sein). Typical of formal language.',
      explanationTr:
        'Funktionsverbgefüge (fiil-isim kalıpları), "hafif" bir fiil + isimden oluşur ve genellikle basit bir fiilin yerini alır: "in Frage stellen" (sorgulamak, = bezweifeln), "zur Verfügung stehen" (hazır/kullanılabilir olmak, = verfügbar sein). Resmi dilde tipiktir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit7Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Ergebnisse werden von Experten ___ gestellt. (bezweifelt)', options: ['in Frage', 'zur Verfügung', 'in Betracht', 'zum Ausdruck'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"In Frage stellen" bedeutet "bezweifeln".',
      },
      {
        lessonId: b2Unit7Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Der Berater steht dem Team jederzeit zur ___.' },
        correctAnswer: { accepted: ['Verfügung'] },
        explanation: '"Zur Verfügung stehen" = verfügbar sein.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit7Lesson1.id, word: 'bezweifeln', translationEn: 'to doubt', translationTr: 'şüphe etmek', exampleSentence: 'Die Ergebnisse werden bezweifelt.' },
      { lessonId: b2Unit7Lesson1.id, word: 'der Berater', translationEn: 'the consultant / advisor', translationTr: 'danışman', exampleSentence: 'Der Berater steht dem Team zur Verfügung.' },
    ],
  })

  const b2Unit7Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit7.id,
      order: 2,
      grammarTopic: 'Anwendung finden / Rücksicht nehmen',
      explanationDe:
        '"Anwendung finden" bedeutet "angewendet werden", "Rücksicht nehmen (auf)" bedeutet "sich rücksichtsvoll verhalten (gegenüber)": "Die neue Methode findet in der Praxis Anwendung." "Man sollte auf ältere Menschen Rücksicht nehmen."',
      explanationEn:
        '"Anwendung finden" means "to be applied", "Rücksicht nehmen (auf)" means "to be considerate (of)": "Die neue Methode findet in der Praxis Anwendung." (The new method is applied in practice.) "Man sollte auf ältere Menschen Rücksicht nehmen." (One should be considerate of older people.)',
      explanationTr:
        '"Anwendung finden" "uygulanmak" anlamına gelir, "Rücksicht nehmen (auf)" ise "(birine) saygılı davranmak" anlamına gelir: "Die neue Methode findet in der Praxis Anwendung." (Yeni yöntem pratikte uygulanıyor.) "Man sollte auf ältere Menschen Rücksicht nehmen." (Yaşlı insanlara karşı saygılı olunmalı.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit7Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die neue Methode ___ in der Praxis Anwendung.', options: ['findet', 'macht', 'nimmt', 'stellt'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Anwendung finden" = angewendet werden.',
      },
      {
        lessonId: b2Unit7Lesson2.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['Rücksicht', 'sollte', 'man', 'nehmen'] },
        correctAnswer: { order: ['man', 'sollte', 'Rücksicht', 'nehmen'] },
        explanation: 'Wortstellung: Subjekt, Modalverb, Nomen, Infinitiv am Ende.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit7Lesson2.id, word: 'die Praxis', translationEn: 'practice', translationTr: 'uygulama / pratik', exampleSentence: 'Die Methode findet in der Praxis Anwendung.' },
      { lessonId: b2Unit7Lesson2.id, word: 'älter', translationEn: 'older', translationTr: 'daha yaşlı', exampleSentence: 'Man sollte auf ältere Menschen Rücksicht nehmen.' },
    ],
  })

  const b2Unit7Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit7.id,
      order: 3,
      grammarTopic: 'zum Ausdruck bringen / in Betracht ziehen',
      explanationDe:
        '"Zum Ausdruck bringen" bedeutet "ausdrücken", "in Betracht ziehen" bedeutet "berücksichtigen/erwägen": "Sie brachte ihre Freude zum Ausdruck." "Wir sollten alle Optionen in Betracht ziehen."',
      explanationEn:
        '"Zum Ausdruck bringen" means "to express", "in Betracht ziehen" means "to consider": "Sie brachte ihre Freude zum Ausdruck." (She expressed her joy.) "Wir sollten alle Optionen in Betracht ziehen." (We should consider all options.)',
      explanationTr:
        '"Zum Ausdruck bringen" "ifade etmek" anlamına gelir, "in Betracht ziehen" ise "göz önünde bulundurmak/değerlendirmek" anlamına gelir: "Sie brachte ihre Freude zum Ausdruck." (Sevincini ifade etti.) "Wir sollten alle Optionen in Betracht ziehen." (Tüm seçenekleri değerlendirmeliyiz.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit7Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wir sollten alle Optionen in ___ ziehen.', options: ['Betracht', 'Frage', 'Anwendung', 'Ausdruck'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"In Betracht ziehen" = berücksichtigen.',
      },
      {
        lessonId: b2Unit7Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie brachte ihre Freude zum ___.' },
        correctAnswer: { accepted: ['Ausdruck'] },
        explanation: '"Zum Ausdruck bringen" = ausdrücken.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit7Lesson3.id, word: 'die Freude', translationEn: 'the joy', translationTr: 'sevinç', exampleSentence: 'Sie brachte ihre Freude zum Ausdruck.' },
      { lessonId: b2Unit7Lesson3.id, word: 'die Option', translationEn: 'the option', translationTr: 'seçenek', exampleSentence: 'Wir sollten alle Optionen in Betracht ziehen.' },
    ],
  })

  const b2Unit7Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit7.id,
      order: 4,
      grammarTopic: 'Wiederholung: Funktionsverbgefüge',
      explanationDe:
        'Wiederholung der Funktionsverbgefüge: in Frage stellen, zur Verfügung stehen, Anwendung finden, Rücksicht nehmen, zum Ausdruck bringen, in Betracht ziehen. Merke: leeres Verb + festes Nomen ersetzt ein einfaches Verb.',
      explanationEn:
        'Review of support verb constructions: in Frage stellen, zur Verfügung stehen, Anwendung finden, Rücksicht nehmen, zum Ausdruck bringen, in Betracht ziehen. Remember: light verb + fixed noun replaces a simple verb.',
      explanationTr:
        'Fiil-isim kalıplarının tekrarı: in Frage stellen, zur Verfügung stehen, Anwendung finden, Rücksicht nehmen, zum Ausdruck bringen, in Betracht ziehen. Unutma: hafif fiil + sabit isim, basit bir fiilin yerini alır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit7Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['in Frage stellen', 'zur Verfügung stehen', 'in Betracht ziehen'], rights: ['verfügbar sein', 'berücksichtigen', 'bezweifeln'] },
        correctAnswer: {
          pairs: [
            { left: 'in Frage stellen', right: 'bezweifeln' },
            { left: 'zur Verfügung stehen', right: 'verfügbar sein' },
            { left: 'in Betracht ziehen', right: 'berücksichtigen' },
          ],
        },
        explanation: 'Funktionsverbgefüge und ihre einfachen Verb-Entsprechungen.',
      },
      {
        lessonId: b2Unit7Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man einfacher für 'zum Ausdruck bringen'?" },
        correctAnswer: { accepted: ['ausdrücken'] },
        explanation: '"Zum Ausdruck bringen" = ausdrücken.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit7Lesson4.id, word: 'berücksichtigen', translationEn: 'to take into account', translationTr: 'göz önünde bulundurmak', exampleSentence: 'Wir müssen alle Faktoren berücksichtigen.' },
      { lessonId: b2Unit7Lesson4.id, word: 'verfügbar', translationEn: 'available', translationTr: 'kullanılabilir', exampleSentence: 'Der Berater ist verfügbar.' },
    ],
  })

  // --- B2 Unit 8: Textkohärenz (4 lessons) ---
  const b2Unit8 = await prisma.unit.create({
    data: { levelId: b2.id, order: 8, titleDe: 'Textkohärenz', titleEn: 'Textual Coherence', titleTr: 'Metin Bütünlüğü' },
  })

  const b2Unit8Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit8.id,
      order: 1,
      grammarTopic: 'Personalpronomen als Verweiswörter',
      explanationDe:
        'Personalpronomen (er, sie, es, ihn, ihm...) verweisen im Text auf bereits genannte Nomen und vermeiden Wiederholungen: "Der Chef kam spät. Er entschuldigte sich."',
      explanationEn:
        'Personal pronouns (er, sie, es, ihn, ihm...) refer back to nouns already mentioned in the text, avoiding repetition: "Der Chef kam spät. Er entschuldigte sich." (The boss arrived late. He apologized.)',
      explanationTr:
        'Şahıs zamirleri (er, sie, es, ihn, ihm...) metinde daha önce geçen isimlere gönderme yapar ve tekrarı önler: "Der Chef kam spät. Er entschuldigte sich." (Patron geç geldi. Özür diledi.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit8Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Studentin gab die Arbeit ab. ___ war erleichtert.', options: ['Sie', 'Er', 'Es', 'Ihr'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Die Studentin" ist feminin, daher "sie".',
      },
      {
        lessonId: b2Unit8Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das Projekt ist fertig. Wir haben lange an ___ gearbeitet.' },
        correctAnswer: { accepted: ['ihm'] },
        explanation: '"Das Projekt" ist neutral, im Dativ nach "an": ihm.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit8Lesson1.id, word: 'die Studentin', translationEn: 'the (female) student', translationTr: 'kadın öğrenci', exampleSentence: 'Die Studentin gab die Arbeit ab.' },
      { lessonId: b2Unit8Lesson1.id, word: 'erleichtert', translationEn: 'relieved', translationTr: 'rahatlamış', exampleSentence: 'Sie war erleichtert.' },
    ],
  })

  const b2Unit8Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit8.id,
      order: 2,
      grammarTopic: 'Demonstrativpronomen als Verweis',
      explanationDe:
        'Demonstrativpronomen wie "dieser/diese/dieses" verweisen stärker auf etwas Genanntes als Personalpronomen: "Ich traf meinen alten Lehrer. Dieser erkannte mich sofort."',
      explanationEn:
        'Demonstrative pronouns like "dieser/diese/dieses" refer back more emphatically than personal pronouns: "Ich traf meinen alten Lehrer. Dieser erkannte mich sofort." (I met my old teacher. He/this one recognized me immediately.)',
      explanationTr:
        '"Dieser/diese/dieses" gibi işaret zamirleri, şahıs zamirlerinden daha güçlü biçimde daha önce söylenene gönderme yapar: "Ich traf meinen alten Lehrer. Dieser erkannte mich sofort." (Eski öğretmenimle karşılaştım. O beni hemen tanıdı.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit8Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich sprach mit der Ärztin. ___ gab mir gute Ratschläge.', options: ['Diese', 'Dieser', 'Dieses', 'Die'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Die Ärztin" ist feminin: diese.',
      },
      {
        lessonId: b2Unit8Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welches Demonstrativpronomen passt als Verweis auf 'der Lehrer'?" },
        correctAnswer: { accepted: ['dieser'] },
        explanation: '"Der Lehrer" ist maskulin: dieser.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit8Lesson2.id, word: 'die Ärztin', translationEn: 'the (female) doctor', translationTr: 'kadın doktor', exampleSentence: 'Ich sprach mit der Ärztin.' },
      { lessonId: b2Unit8Lesson2.id, word: 'der Ratschlag', translationEn: 'the piece of advice', translationTr: 'tavsiye', exampleSentence: 'Sie gab mir gute Ratschläge.' },
    ],
  })

  const b2Unit8Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit8.id,
      order: 3,
      grammarTopic: 'Konnektoren zur Textverknüpfung',
      explanationDe:
        'Konnektoren wie "außerdem, jedoch, deshalb, schließlich" verknüpfen Sätze logisch und schaffen einen kohärenten Text: "Er war müde. Außerdem hatte er Kopfschmerzen. Deshalb ging er früh ins Bett."',
      explanationEn:
        'Connectors like "außerdem, jedoch, deshalb, schließlich" (moreover, however, therefore, finally) link sentences logically and create a coherent text: "Er war müde. Außerdem hatte er Kopfschmerzen. Deshalb ging er früh ins Bett." (He was tired. Moreover, he had a headache. Therefore, he went to bed early.)',
      explanationTr:
        '"Außerdem, jedoch, deshalb, schließlich" (ayrıca, ancak, bu yüzden, sonunda) gibi bağlaçlar cümleleri mantıksal olarak bağlar ve tutarlı bir metin oluşturur: "Er war müde. Außerdem hatte er Kopfschmerzen. Deshalb ging er früh ins Bett." (Yorgundu. Ayrıca başı ağrıyordu. Bu yüzden erken yattı.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit8Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er war müde. ___ hatte er Kopfschmerzen.', options: ['Außerdem', 'Deshalb', 'Obwohl', 'Damit'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Außerdem" fügt eine zusätzliche Information hinzu.',
      },
      {
        lessonId: b2Unit8Lesson3.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['früh', 'ging', 'er', 'deshalb', 'ins', 'Bett'] },
        correctAnswer: { order: ['deshalb', 'ging', 'er', 'früh', 'ins', 'Bett'] },
        explanation: '"Deshalb" steht an Position 1, danach das Verb.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit8Lesson3.id, word: 'die Kopfschmerzen', translationEn: 'headache', translationTr: 'baş ağrısı', exampleSentence: 'Er hatte Kopfschmerzen.' },
      { lessonId: b2Unit8Lesson3.id, word: 'schließlich', translationEn: 'finally', translationTr: 'sonunda', exampleSentence: 'Schließlich ging er ins Bett.' },
    ],
  })

  const b2Unit8Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit8.id,
      order: 4,
      grammarTopic: 'Verweiswörter (dabei/dazu/damit)',
      explanationDe:
        'Pronominaladverbien wie "dabei, dazu, damit" verweisen auf zuvor Genanntes und ersetzen Präposition + Nomen: "Sie lernt Deutsch. Dabei hilft ihr eine App." (= bei dem Lernen)',
      explanationEn:
        'Pronominal adverbs like "dabei, dazu, damit" refer back to something previously mentioned and replace preposition + noun: "Sie lernt Deutsch. Dabei hilft ihr eine App." (She is learning German. An app helps her with that = with learning.)',
      explanationTr:
        '"Dabei, dazu, damit" gibi zamirli zarflar daha önce söylenene gönderme yapar ve edat + isim yapısının yerini alır: "Sie lernt Deutsch. Dabei hilft ihr eine App." (Almanca öğreniyor. Bu konuda bir uygulama ona yardımcı oluyor.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit8Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er will die Prüfung bestehen. ___ lernt er jeden Tag.', options: ['Dazu', 'Dabei', 'Damit', 'Daran'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Dazu" verweist auf das Ziel: für die Prüfung.',
      },
      {
        lessonId: b2Unit8Lesson4.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie nutzt eine App. ___ lernt sie schneller Deutsch. (dabei)' },
        correctAnswer: { accepted: ['Dabei'] },
        explanation: '"Dabei" verweist auf die Nutzung der App.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit8Lesson4.id, word: 'die Prüfung', translationEn: 'the exam', translationTr: 'sınav', exampleSentence: 'Er will die Prüfung bestehen.' },
      { lessonId: b2Unit8Lesson4.id, word: 'bestehen', translationEn: 'to pass (an exam)', translationTr: 'geçmek (sınav)', exampleSentence: 'Er will die Prüfung bestehen.' },
    ],
  })

  // --- B2 Unit 9: Konjunktiv II der Vergangenheit (4 lessons) ---
  const b2Unit9 = await prisma.unit.create({
    data: { levelId: b2.id, order: 9, titleDe: 'Konjunktiv II der Vergangenheit', titleEn: 'Past Subjunctive II', titleTr: 'Geçmiş Zaman Konjunktiv II' },
  })

  const b2Unit9Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit9.id,
      order: 1,
      grammarTopic: 'Bildung mit "hätte" + Partizip II',
      explanationDe:
        'Der Konjunktiv II der Vergangenheit wird mit "hätte" (Konjunktiv II von "haben") + Partizip II gebildet: "Ich hätte das Buch gelesen." Er beschreibt irreale Situationen in der Vergangenheit.',
      explanationEn:
        'The past Konjunktiv II is formed with "hätte" (Konjunktiv II of "haben") + past participle: "Ich hätte das Buch gelesen." (I would have read the book.) It describes unreal (hypothetical) situations in the past.',
      explanationTr:
        'Geçmiş zaman Konjunktiv II, "hätte" ("haben"in Konjunktiv II biçimi) + Partizip II ile kurulur: "Ich hätte das Buch gelesen." (Kitabı okumuş olurdum.) Geçmişteki gerçek dışı durumları anlatır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit9Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich ___ das Buch gelesen, wenn ich Zeit gehabt hätte.', options: ['hätte', 'habe', 'hatte', 'würde'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Konjunktiv II der Vergangenheit: "hätte" + Partizip II.',
      },
      {
        lessonId: b2Unit9Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie ___ die Prüfung bestanden, wenn sie gelernt hätte. (haben)' },
        correctAnswer: { accepted: ['hätte'] },
        explanation: 'Konjunktiv II der Vergangenheit für "sie": hätte.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit9Lesson1.id, word: 'die Gelegenheit', translationEn: 'the opportunity', translationTr: 'fırsat', exampleSentence: 'Ich hätte die Gelegenheit genutzt.' },
      { lessonId: b2Unit9Lesson1.id, word: 'nutzen', translationEn: 'to use / utilize', translationTr: 'kullanmak', exampleSentence: 'Ich hätte die Gelegenheit genutzt.' },
    ],
  })

  const b2Unit9Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit9.id,
      order: 2,
      grammarTopic: 'Bildung mit "wäre" + Partizip II',
      explanationDe:
        'Bei Verben der Bewegung oder Zustandsänderung (die im Perfekt "sein" benutzen) wird der Konjunktiv II der Vergangenheit mit "wäre" + Partizip II gebildet: "Ich wäre gekommen, wenn ich Zeit gehabt hätte."',
      explanationEn:
        'For verbs of motion or change of state (which use "sein" in the perfect tense), the past Konjunktiv II is formed with "wäre" + past participle: "Ich wäre gekommen, wenn ich Zeit gehabt hätte." (I would have come if I had had time.)',
      explanationTr:
        'Hareket ya da durum değişikliği bildiren fiillerde (Perfekt\'te "sein" kullananlar), geçmiş zaman Konjunktiv II "wäre" + Partizip II ile kurulur: "Ich wäre gekommen, wenn ich Zeit gehabt hätte." (Vaktim olsaydı gelmiş olurdum.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit9Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er ___ früher gegangen, wenn er gewusst hätte, dass es regnet.', options: ['wäre', 'hätte', 'war', 'würde'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Gehen" bildet das Perfekt mit "sein": wäre gegangen.',
      },
      {
        lessonId: b2Unit9Lesson2.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['kommen', 'gehen', 'bleiben'], rights: ['wäre gegangen', 'wäre geblieben', 'wäre gekommen'] },
        correctAnswer: {
          pairs: [
            { left: 'kommen', right: 'wäre gekommen' },
            { left: 'gehen', right: 'wäre gegangen' },
            { left: 'bleiben', right: 'wäre geblieben' },
          ],
        },
        explanation: 'Bewegungsverben bilden den Konjunktiv II der Vergangenheit mit "wäre" + Partizip II.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit9Lesson2.id, word: 'bleiben', translationEn: 'to stay', translationTr: 'kalmak', exampleSentence: 'Ich wäre geblieben, wenn ich Zeit gehabt hätte.' },
      { lessonId: b2Unit9Lesson2.id, word: 'wissen', translationEn: 'to know', translationTr: 'bilmek', exampleSentence: 'Er wäre früher gegangen, wenn er es gewusst hätte.' },
    ],
  })

  const b2Unit9Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit9.id,
      order: 3,
      grammarTopic: 'Irreale Bedingungssätze der Vergangenheit',
      explanationDe:
        'Irreale Bedingungssätze der Vergangenheit bestehen aus einem "wenn"-Satz und einem Hauptsatz, beide im Konjunktiv II der Vergangenheit: "Wenn ich Zeit gehabt hätte, wäre ich gekommen."',
      explanationEn:
        'Unreal conditional clauses in the past consist of a "wenn" clause and a main clause, both in the past Konjunktiv II: "Wenn ich Zeit gehabt hätte, wäre ich gekommen." (If I had had time, I would have come.)',
      explanationTr:
        'Geçmiş zamanın gerçek dışı koşul cümleleri, hem "wenn" cümlesinin hem de ana cümlenin geçmiş zaman Konjunktiv II\'de olduğu bir yapıdan oluşur: "Wenn ich Zeit gehabt hätte, wäre ich gekommen." (Vaktim olsaydı gelmiş olurdum.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit9Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wenn ich das gewusst ___, hätte ich anders reagiert.', options: ['hätte', 'wäre', 'habe', 'war'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Wissen" bildet das Perfekt mit "haben": hätte gewusst.',
      },
      {
        lessonId: b2Unit9Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Wenn ich Zeit gehabt hätte, ___ ich gekommen.' },
        correctAnswer: { accepted: ['wäre'] },
        explanation: 'Der Hauptsatz braucht "wäre" für "kommen".',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit9Lesson3.id, word: 'reagieren', translationEn: 'to react', translationTr: 'tepki vermek', exampleSentence: 'Ich hätte anders reagiert.' },
      { lessonId: b2Unit9Lesson3.id, word: 'die Bedingung', translationEn: 'the condition', translationTr: 'koşul', exampleSentence: 'Das ist ein irrealer Bedingungssatz.' },
    ],
  })

  const b2Unit9Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit9.id,
      order: 4,
      grammarTopic: 'Wiederholung: Konjunktiv II der Vergangenheit',
      explanationDe:
        'Wiederholung: Konjunktiv II der Vergangenheit mit "hätte"/"wäre" + Partizip II, benutzt für irreale Bedingungssätze und Vermutungen über die Vergangenheit.',
      explanationEn:
        'Review: past Konjunktiv II with "hätte"/"wäre" + past participle, used for unreal conditional sentences and assumptions about the past.',
      explanationTr:
        'Tekrar: "hätte"/"wäre" + Partizip II ile geçmiş zaman Konjunktiv II, gerçek dışı koşul cümleleri ve geçmişe dair varsayımlar için kullanılır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit9Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wenn wir das gewusst hätten, ___ wir anders geplant.', options: ['hätten', 'wären', 'haben', 'waren'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Planen" bildet das Perfekt mit "haben": hätten geplant.',
      },
      {
        lessonId: b2Unit9Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I would have helped'?" },
        correctAnswer: { accepted: ['ich hätte geholfen'] },
        explanation: '"Ich hätte geholfen" ist die richtige Übersetzung.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit9Lesson4.id, word: 'planen', translationEn: 'to plan', translationTr: 'planlamak', exampleSentence: 'Wir hätten anders geplant.' },
      { lessonId: b2Unit9Lesson4.id, word: 'die Vermutung', translationEn: 'the assumption', translationTr: 'varsayım', exampleSentence: 'Das ist nur eine Vermutung über die Vergangenheit.' },
    ],
  })

  // --- B2 Unit 10: Passiversatzformen (4 lessons) ---
  const b2Unit10 = await prisma.unit.create({
    data: { levelId: b2.id, order: 10, titleDe: 'Passiversatzformen', titleEn: 'Passive Substitute Forms', titleTr: 'Edilgen Çatı Alternatifleri' },
  })

  const b2Unit10Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit10.id,
      order: 1,
      grammarTopic: '"sich lassen" + Infinitiv',
      explanationDe:
        '"sich lassen" + Infinitiv drückt aus, dass etwas möglich ist, ähnlich wie ein Passiv mit "können": "Das Fenster lässt sich öffnen." (= Das Fenster kann geöffnet werden.)',
      explanationEn:
        '"sich lassen" + infinitive expresses that something is possible, similar to a passive with "können": "Das Fenster lässt sich öffnen." (The window can be opened.)',
      explanationTr:
        '"sich lassen" + Infinitiv, bir şeyin mümkün olduğunu ifade eder, "können" ile edilgen çatıya benzer: "Das Fenster lässt sich öffnen." (Pencere açılabilir.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit10Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Tür ___ sich leicht öffnen.', options: ['lässt', 'lasst', 'lasse', 'lässst'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"lassen" wird bei "er/sie/es" zu "lässt".',
      },
      {
        lessonId: b2Unit10Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das Problem ___ sich lösen. (lassen)' },
        correctAnswer: { accepted: ['lässt'] },
        explanation: '3. Person Singular von "lassen": lässt.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit10Lesson1.id, word: 'lösen', translationEn: 'to solve', translationTr: 'çözmek', exampleSentence: 'Das Problem lässt sich lösen.' },
      { lessonId: b2Unit10Lesson1.id, word: 'die Tür', translationEn: 'the door', translationTr: 'kapı', exampleSentence: 'Die Tür lässt sich leicht öffnen.' },
    ],
  })

  const b2Unit10Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit10.id,
      order: 2,
      grammarTopic: 'man-Konstruktion als Passiversatz',
      explanationDe:
        'Die man-Konstruktion ersetzt das Passiv durch einen Aktivsatz: "Man repariert das Auto." (= Das Auto wird repariert.) "Man" bleibt unbestimmt und wird nicht genannt.',
      explanationEn:
        'The man-construction replaces the passive with an active sentence: "Man repariert das Auto." (The car is being repaired.) "Man" stays indefinite and is never named.',
      explanationTr:
        'man-yapısı, edilgen cümlenin yerine etken bir cümle kullanır: "Man repariert das Auto." (Araba tamir ediliyor.) "Man" belirsiz kalır ve isim verilmez.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit10Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Passiv: "Das Auto wird repariert." Aktiv mit man-Konstruktion: "___ repariert das Auto."', options: ['Man', 'Er', 'Sie', 'Ich'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Die man-Konstruktion ersetzt das unpersönliche Passiv.',
      },
      {
        lessonId: b2Unit10Lesson2.id,
        order: 2,
        type: 'MATCHING',
        data: {
          lefts: ['Das Brot wird gebacken.', 'Die Fenster werden geputzt.', 'Der Brief wird geschrieben.'],
          rights: ['Man putzt die Fenster.', 'Man schreibt den Brief.', 'Man backt das Brot.'],
        },
        correctAnswer: {
          pairs: [
            { left: 'Das Brot wird gebacken.', right: 'Man backt das Brot.' },
            { left: 'Die Fenster werden geputzt.', right: 'Man putzt die Fenster.' },
            { left: 'Der Brief wird geschrieben.', right: 'Man schreibt den Brief.' },
          ],
        },
        explanation: 'Jedes Passiv lässt sich mit "man" + Aktivverb umformulieren.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit10Lesson2.id, word: 'backen', translationEn: 'to bake', translationTr: 'pişirmek (fırında)', exampleSentence: 'Man backt das Brot.' },
      { lessonId: b2Unit10Lesson2.id, word: 'das Fenster', translationEn: 'the window', translationTr: 'pencere', exampleSentence: 'Man putzt die Fenster.' },
    ],
  })

  const b2Unit10Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit10.id,
      order: 3,
      grammarTopic: '"sein" + zu + Infinitiv',
      explanationDe:
        '"sein" + zu + Infinitiv drückt eine Möglichkeit oder Notwendigkeit aus, oft in formellem Stil: "Die Regeln sind zu beachten." (= Die Regeln müssen/können beachtet werden.)',
      explanationEn:
        '"sein" + zu + infinitive expresses a possibility or necessity, often in a formal register: "Die Regeln sind zu beachten." (The rules must/can be observed.)',
      explanationTr:
        '"sein" + zu + Infinitiv, genellikle resmi bir üslupta olasılık ya da zorunluluk ifade eder: "Die Regeln sind zu beachten." (Kurallara uyulmalı/uyulabilir.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit10Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Aufgabe ist noch ___ erledigen.', options: ['zu', 'zum', 'zur', 'zuerst'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"sein" + zu + Infinitiv: "ist zu erledigen".',
      },
      {
        lessonId: b2Unit10Lesson3.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['zu', 'Regeln', 'sind', 'Die', 'beachten'] },
        correctAnswer: { order: ['Die', 'Regeln', 'sind', 'zu', 'beachten'] },
        explanation: 'Reihenfolge: Artikel, Nomen, "sein"-Form, "zu", Infinitiv.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit10Lesson3.id, word: 'erledigen', translationEn: 'to take care of / finish', translationTr: 'halletmek', exampleSentence: 'Die Aufgabe ist noch zu erledigen.' },
      { lessonId: b2Unit10Lesson3.id, word: 'die Aufgabe', translationEn: 'the task', translationTr: 'görev', exampleSentence: 'Ich habe heute viele Aufgaben.' },
    ],
  })

  const b2Unit10Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit10.id,
      order: 4,
      grammarTopic: 'Wiederholung: Passiversatzformen im Vergleich',
      explanationDe:
        'Wiederholung: "sich lassen" + Infinitiv, die man-Konstruktion und "sein" + zu + Infinitiv sind drei Alternativen zum Passiv, oft mit "können" oder "müssen": "Das lässt sich machen." = "Man kann das machen." = "Das ist zu machen."',
      explanationEn:
        'Review: "sich lassen" + infinitive, the man-construction, and "sein" + zu + infinitive are three alternatives to the passive, often meaning "können" or "müssen": "Das lässt sich machen." = "Man kann das machen." = "Das ist zu machen." (all: "This can be done.")',
      explanationTr:
        'Tekrar: "sich lassen" + Infinitiv, man-yapısı ve "sein" + zu + Infinitiv, genellikle "können" veya "müssen" anlamına gelen üç edilgen çatı alternatifidir: "Das lässt sich machen." = "Man kann das machen." = "Das ist zu machen." (hepsi: "Bu yapılabilir.")',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit10Lesson4.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welche Passiversatzform passt zu "Das Problem kann gelöst werden."?', options: ['Das Problem lässt sich lösen.', 'Das Problem hat sich gelöst.', 'Das Problem wird lösen.', 'Das Problem löst sich selbst.'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"sich lassen" + Infinitiv ersetzt "können" + Passiv.',
      },
      {
        lessonId: b2Unit10Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch mit der man-Konstruktion: 'The window is being cleaned'?" },
        correctAnswer: { accepted: ['man putzt das fenster'] },
        explanation: '"Man putzt das Fenster." ist die man-Konstruktion für das Passiv.',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit10Lesson4.id, word: 'die Lösung', translationEn: 'the solution', translationTr: 'çözüm', exampleSentence: 'Für jedes Problem gibt es eine Lösung.' },
      { lessonId: b2Unit10Lesson4.id, word: 'notwendig', translationEn: 'necessary', translationTr: 'gerekli', exampleSentence: 'Es ist notwendig, die Regeln zu beachten.' },
    ],
  })

  // --- B2 Unit 11: Relativsätze mit Präpositionen (4 lessons) ---
  const b2Unit11 = await prisma.unit.create({
    data: { levelId: b2.id, order: 11, titleDe: 'Relativsätze mit Präpositionen', titleEn: 'Relative Clauses with Prepositions', titleTr: 'Edatlı İlgi Cümleleri' },
  })

  const b2Unit11Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit11.id,
      order: 1,
      grammarTopic: 'Präposition + Relativpronomen (Akkusativ)',
      explanationDe:
        'Steht eine Präposition vor dem Relativpronomen, richtet sich der Kasus nach der Präposition, nicht nach der Funktion im Hauptsatz: "Das ist das Projekt, für das ich verantwortlich bin."',
      explanationEn:
        'When a preposition precedes the relative pronoun, its case is determined by the preposition, not by the function in the main clause: "Das ist das Projekt, für das ich verantwortlich bin." (That is the project I am responsible for.)',
      explanationTr:
        'İlgi zamirinden önce bir edat varsa, hal edata göre belirlenir, ana cümledeki işleve göre değil: "Das ist das Projekt, für das ich verantwortlich bin." (Sorumlu olduğum proje bu.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit11Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das ist das Projekt, für ___ ich verantwortlich bin.', options: ['der', 'die', 'das', 'dem'] },
        correctAnswer: { correctIndex: 2 },
        explanation: '"Das Projekt" ist neutrum; "für" verlangt den Akkusativ: "für das".',
      },
      {
        lessonId: b2Unit11Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das ist der Grund, ___ ich mich beworben habe. (für)' },
        correctAnswer: { accepted: ['für den'] },
        explanation: '"Der Grund" ist maskulin; "für" verlangt den Akkusativ: "für den".',
      },
    ],
  })

  const b2Unit11Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit11.id,
      order: 2,
      grammarTopic: 'Präposition + Relativpronomen (Dativ)',
      explanationDe:
        'Präpositionen wie "mit", "bei", "von" verlangen den Dativ: "Das ist die Firma, bei der ich arbeite." "Das sind die Kollegen, mit denen ich zusammenarbeite."',
      explanationEn:
        'Prepositions like "mit", "bei", "von" require the dative: "Das ist die Firma, bei der ich arbeite." (That is the company I work at.) "Das sind die Kollegen, mit denen ich zusammenarbeite." (Those are the colleagues I work with.)',
      explanationTr:
        '"mit", "bei", "von" gibi edatlar -e halini gerektirir: "Das ist die Firma, bei der ich arbeite." "Das sind die Kollegen, mit denen ich zusammenarbeite."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit11Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das sind die Kollegen, mit ___ ich zusammenarbeite.', options: ['die', 'denen', 'der', 'dem'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Plural Dativ Relativpronomen ist "denen".',
      },
      {
        lessonId: b2Unit11Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Das ist die Firma, bei ___ ich arbeite. (Relativpronomen, feminin, Dativ)" },
        correctAnswer: { accepted: ['der'] },
        explanation: 'Feminines Relativpronomen im Dativ ist "der".',
      },
    ],
  })

  const b2Unit11Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit11.id,
      order: 3,
      grammarTopic: '"was" und "wo(r)+Präposition"',
      explanationDe:
        'Bezieht sich der Relativsatz auf einen ganzen Satz oder ein unbestimmtes Wort (alles, nichts, etwas), benutzt man "was": "Er kam zu spät, was mich ärgerte." Bei Präpositionen mit Sachen benutzt man "wo(r)+Präposition": "Das Thema, worüber wir sprechen, ist wichtig."',
      explanationEn:
        'When the relative clause refers to a whole sentence or an indefinite word (alles, nichts, etwas), use "was": "Er kam zu spät, was mich ärgerte." (He arrived late, which annoyed me.) For prepositions referring to things, use "wo(r)+preposition": "Das Thema, worüber wir sprechen, ist wichtig." (The topic we are talking about is important.)',
      explanationTr:
        'İlgi cümlesi bütün bir cümleye veya belirsiz bir kelimeye (alles, nichts, etwas) atıfta bulunuyorsa "was" kullanılır: "Er kam zu spät, was mich ärgerte." Nesnelerle ilgili edatlarda "wo(r)+edat" kullanılır: "Das Thema, worüber wir sprechen, ist wichtig."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit11Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das Thema, ___ wir sprechen, ist wichtig. (worüber vs. über das)', options: ['worüber', 'wofür', 'womit', 'wobei'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"sprechen über" + Sache -> "worüber".',
      },
      {
        lessonId: b2Unit11Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er hat mir geholfen, ___ ich sehr dankbar bin. (was)' },
        correctAnswer: { accepted: ['was'] },
        explanation: 'Bezug auf den ganzen Satz: "was".',
      },
    ],
  })

  const b2Unit11Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit11.id,
      order: 4,
      grammarTopic: 'Wiederholung: Relativsätze mit Präpositionen',
      explanationDe:
        'Wiederholung: Der Kasus nach der Präposition richtet sich nach der Präposition selbst; bei Sachen mit Präposition oft "wo(r)+Präposition" statt "Präposition + das/die/der".',
      explanationEn:
        'Review: the case after a preposition is governed by the preposition itself; for things, "wo(r)+preposition" is often preferred over "preposition + das/die/der".',
      explanationTr:
        'Tekrar: edattan sonraki hal, edatın kendisine göre belirlenir; nesnelerde genellikle "edat + das/die/der" yerine "wo(r)+edat" tercih edilir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit11Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['bin', 'verantwortlich', 'ich', 'das Projekt', 'für'] },
        correctAnswer: { order: ['ich', 'bin', 'für', 'das Projekt', 'verantwortlich'] },
        explanation: 'Grundwortstellung: Subjekt, Verb, Präpositionalobjekt, Prädikativ.',
      },
      {
        lessonId: b2Unit11Lesson4.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['für + Akkusativ', 'bei + Dativ', 'über (Sache)'], rights: ['für das/den/die', 'bei dem/der', 'worüber'] },
        correctAnswer: {
          pairs: [
            { left: 'für + Akkusativ', right: 'für das/den/die' },
            { left: 'bei + Dativ', right: 'bei dem/der' },
            { left: 'über (Sache)', right: 'worüber' },
          ],
        },
        explanation: 'Übersicht: Präposition + Relativpronomen bzw. wo(r)-Form.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit11Lesson1.id, word: 'verantwortlich', translationEn: 'responsible', translationTr: 'sorumlu', exampleSentence: 'Ich bin für das Projekt verantwortlich.' },
      { lessonId: b2Unit11Lesson1.id, word: 'der Grund', translationEn: 'the reason', translationTr: 'sebep', exampleSentence: 'Das ist der Grund für meine Entscheidung.' },
      { lessonId: b2Unit11Lesson2.id, word: 'zusammenarbeiten', translationEn: 'to collaborate', translationTr: 'birlikte çalışmak', exampleSentence: 'Wir arbeiten gut zusammen.' },
      { lessonId: b2Unit11Lesson2.id, word: 'das Unternehmen', translationEn: 'the company/enterprise', translationTr: 'işletme', exampleSentence: 'Das Unternehmen wächst schnell.' },
      { lessonId: b2Unit11Lesson3.id, word: 'ärgern', translationEn: 'to annoy', translationTr: 'sinirlendirmek', exampleSentence: 'Das ärgert mich sehr.' },
      { lessonId: b2Unit11Lesson3.id, word: 'dankbar', translationEn: 'grateful', translationTr: 'minnettar', exampleSentence: 'Ich bin dir sehr dankbar.' },
      { lessonId: b2Unit11Lesson4.id, word: 'die Entscheidung', translationEn: 'the decision', translationTr: 'karar', exampleSentence: 'Das war eine schwere Entscheidung.' },
      { lessonId: b2Unit11Lesson4.id, word: 'wachsen', translationEn: 'to grow', translationTr: 'büyümek', exampleSentence: 'Die Firma wächst schnell.' },
    ],
  })

  // --- B2 Unit 12: Redewiedergabe & formelle Stilmittel (4 lessons) ---
  const b2Unit12 = await prisma.unit.create({
    data: { levelId: b2.id, order: 12, titleDe: 'Redewiedergabe & formelle Stilmittel', titleEn: 'Reported Speech & Formal Style', titleTr: 'Aktarılan Söz ve Resmi Üslup' },
  })

  const b2Unit12Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit12.id,
      order: 1,
      grammarTopic: 'Redewiedergabe mit Konjunktiv I',
      explanationDe:
        'In formellen Texten (Nachrichten, Berichten) wird fremde Rede oft mit Konjunktiv I wiedergegeben: "Die Ministerin sagte, die Reform sei notwendig."',
      explanationEn:
        'In formal texts (news, reports), someone else\'s speech is often reported using Konjunktiv I: "Die Ministerin sagte, die Reform sei notwendig." (The minister said the reform was necessary.)',
      explanationTr:
        'Resmi metinlerde (haberler, raporlar) başkasının sözü genellikle Konjunktiv I ile aktarılır: "Die Ministerin sagte, die Reform sei notwendig."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit12Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Die Ministerin sagte, die Reform ___ notwendig. (Konjunktiv I von "sein")', options: ['ist', 'sei', 'wäre', 'war'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Konjunktiv I von "sein" für "sie" (3. Person Singular) ist "sei".',
      },
      {
        lessonId: b2Unit12Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er sagte, er ___ keine Zeit. (Konjunktiv I von "haben")' },
        correctAnswer: { accepted: ['habe'] },
        explanation: 'Konjunktiv I von "haben" für "er" ist "habe".',
      },
    ],
  })

  const b2Unit12Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit12.id,
      order: 2,
      grammarTopic: 'Nominalstil vs. Verbalstil',
      explanationDe:
        'Der Nominalstil (typisch für formelle Texte) verwendet Substantive statt Verben: "nach der Überprüfung der Unterlagen" statt "nachdem die Unterlagen überprüft wurden".',
      explanationEn:
        'Nominal style (typical of formal texts) uses nouns instead of verbs: "nach der Überprüfung der Unterlagen" (after the review of the documents) instead of "nachdem die Unterlagen überprüft wurden" (after the documents were reviewed).',
      explanationTr:
        'Nominal üslup (resmi metinlerde tipik) fiil yerine isim kullanır: "nachdem die Unterlagen überprüft wurden" yerine "nach der Überprüfung der Unterlagen".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit12Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welcher Satz ist im Nominalstil?', options: ['Nachdem er angekommen war, begann die Sitzung.', 'Nach seiner Ankunft begann die Sitzung.', 'Er kam an und die Sitzung begann.', 'Als er ankam, begann die Sitzung.'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Nach seiner Ankunft" ist eine Nominalisierung von "ankommen".',
      },
      {
        lessonId: b2Unit12Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Bilde die Nominalisierung von 'überprüfen' mit Artikel." },
        correctAnswer: { accepted: ['die überprüfung', 'überprüfung'] },
        explanation: 'Die Nominalisierung von "überprüfen" ist "die Überprüfung".',
      },
    ],
  })

  const b2Unit12Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit12.id,
      order: 3,
      grammarTopic: 'Formelle Konnektoren in Berichten',
      explanationDe:
        'Formelle Berichte nutzen Konnektoren wie "des Weiteren" (furthermore), "dementsprechend" (accordingly), "diesbezüglich" (in this regard) statt umgangssprachlicher Alternativen.',
      explanationEn:
        'Formal reports use connectors like "des Weiteren" (furthermore), "dementsprechend" (accordingly), "diesbezüglich" (in this regard) instead of colloquial alternatives.',
      explanationTr:
        'Resmi raporlar günlük konuşma yerine "des Weiteren" (ayrıca), "dementsprechend" (buna göre), "diesbezüglich" (bu konuda) gibi bağlaçlar kullanır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit12Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Wort passt in einen formellen Bericht für "furthermore"?', options: ['außerdem', 'des Weiteren', 'und dann', 'auch noch'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Des Weiteren" ist die formelle Entsprechung von "außerdem".',
      },
      {
        lessonId: b2Unit12Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ sind keine weiteren Maßnahmen erforderlich. (accordingly)' },
        correctAnswer: { accepted: ['dementsprechend'] },
        explanation: '"Dementsprechend" bedeutet "accordingly".',
      },
    ],
  })

  const b2Unit12Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit12.id,
      order: 4,
      grammarTopic: 'Wiederholung Gesamtkurs B2',
      explanationDe:
        'Gesamtwiederholung B2: Passiv, Konjunktiv I/II, Nominalisierung, Relativsätze und formelle Konnektoren kombiniert in einem kurzen Bericht.',
      explanationEn:
        'Overall B2 review: passive, Konjunktiv I/II, nominalization, relative clauses, and formal connectors combined in a short report.',
      explanationTr:
        'B2 genel tekrarı: edilgen çatı, Konjunktiv I/II, isimleştirme, ilgi cümleleri ve resmi bağlaçlar kısa bir raporda bir araya geliyor.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit12Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['sei', 'notwendig', 'die Reform', 'sagte', 'er'] },
        correctAnswer: { order: ['er', 'sagte', 'die Reform', 'sei', 'notwendig'] },
        explanation: 'Hauptsatz + Konjunktiv-I-Nebensatz ohne "dass".',
      },
      {
        lessonId: b2Unit12Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'accordingly, no further measures are required'?" },
        correctAnswer: { accepted: ['dementsprechend sind keine weiteren maßnahmen erforderlich'] },
        explanation: '"Dementsprechend sind keine weiteren Maßnahmen erforderlich."',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit12Lesson1.id, word: 'die Ministerin', translationEn: 'the (female) minister', translationTr: 'bakan (kadın)', exampleSentence: 'Die Ministerin hielt eine Rede.' },
      { lessonId: b2Unit12Lesson1.id, word: 'die Reform', translationEn: 'the reform', translationTr: 'reform', exampleSentence: 'Die Reform wurde beschlossen.' },
      { lessonId: b2Unit12Lesson2.id, word: 'die Ankunft', translationEn: 'the arrival', translationTr: 'varış', exampleSentence: 'Nach seiner Ankunft begann die Sitzung.' },
      { lessonId: b2Unit12Lesson2.id, word: 'die Sitzung', translationEn: 'the meeting/session', translationTr: 'toplantı', exampleSentence: 'Die Sitzung dauert zwei Stunden.' },
      { lessonId: b2Unit12Lesson3.id, word: 'diesbezüglich', translationEn: 'in this regard', translationTr: 'bu konuda', exampleSentence: 'Diesbezüglich gibt es keine Fragen.' },
      { lessonId: b2Unit12Lesson3.id, word: 'die Maßnahme', translationEn: 'the measure', translationTr: 'önlem', exampleSentence: 'Wir ergreifen neue Maßnahmen.' },
      { lessonId: b2Unit12Lesson4.id, word: 'erforderlich', translationEn: 'required', translationTr: 'gerekli', exampleSentence: 'Das ist nicht erforderlich.' },
      { lessonId: b2Unit12Lesson4.id, word: 'die Rede', translationEn: 'the speech', translationTr: 'konuşma', exampleSentence: 'Sie hielt eine Rede.' },
    ],
  })

  // --- B2 Unit 13: Adverbialsätze - Konzessiv & Konditional (4 lessons) ---
  const b2Unit13 = await prisma.unit.create({
    data: { levelId: b2.id, order: 13, titleDe: 'Adverbialsätze: Konzessiv & Konditional', titleEn: 'Adverbial Clauses: Concessive & Conditional', titleTr: 'Zarf Cümleleri: Karşıtlık ve Koşul' },
  })

  const b2Unit13Lesson1 = await prisma.lesson.create({
    data: {
      unitId: b2Unit13.id,
      order: 1,
      grammarTopic: 'Konzessivsätze: "auch wenn" / "selbst wenn"',
      explanationDe:
        '"auch wenn" und "selbst wenn" verstärken den Gegensatz stärker als "obwohl": "Auch wenn es regnet, gehen wir spazieren." Das Verb steht am Ende des Nebensatzes.',
      explanationEn:
        '"auch wenn" and "selbst wenn" ("even if") emphasize the contrast more strongly than "obwohl": "Auch wenn es regnet, gehen wir spazieren." (Even if it rains, we\'ll go for a walk.) The verb goes to the end of the subordinate clause.',
      explanationTr:
        '"auch wenn" ve "selbst wenn" (bile) karşıtlığı "obwohl"dan daha güçlü vurgular: "Auch wenn es regnet, gehen wir spazieren." Fiil yan cümlenin sonuna gider.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit13Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Auch wenn es regnet, ___ wir spazieren. (gehen)', options: ['gehen', 'geht', 'gingen', 'gegangen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Hauptsatz nach dem Nebensatz: Verb an Position 2, konjugiert für "wir": "gehen".',
      },
      {
        lessonId: b2Unit13Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Selbst wenn er müde ___, arbeitet er weiter. (sein)' },
        correctAnswer: { accepted: ['ist'] },
        explanation: 'Nebensatz mit "selbst wenn": Verb am Ende, konjugiert für "er": "ist".',
      },
    ],
  })

  const b2Unit13Lesson2 = await prisma.lesson.create({
    data: {
      unitId: b2Unit13.id,
      order: 2,
      grammarTopic: 'Uneingeleitete Konditionalsätze',
      explanationDe:
        'Ohne "wenn" beginnt der Bedingungssatz mit dem konjugierten Verb: "Wäre er hier, würde er helfen." (= Wenn er hier wäre, würde er helfen.)',
      explanationEn:
        'Without "wenn", the conditional clause starts with the conjugated verb: "Wäre er hier, würde er helfen." (If he were here, he would help. = "Wenn er hier wäre, würde er helfen.")',
      explanationTr:
        '"wenn" olmadan koşul cümlesi çekimli fiille başlar: "Wäre er hier, würde er helfen." (Burada olsaydı yardım ederdi.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit13Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Uneingeleiteter Konditionalsatz für "Wenn ich Zeit hätte, würde ich kommen."', options: ['Hätte ich Zeit, würde ich kommen.', 'Ich hätte Zeit, würde ich kommen.', 'Zeit hätte ich, würde ich kommen.', 'Würde ich Zeit haben, käme ich.'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Das konjugierte Verb rückt an den Satzanfang: "Hätte ich Zeit, ...".',
      },
      {
        lessonId: b2Unit13Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Forme uneingeleitet um: 'Wenn er das gewusst hätte, hätte er anders gehandelt.'" },
        correctAnswer: { accepted: ['hätte er das gewusst, hätte er anders gehandelt'] },
        explanation: 'Verb an den Satzanfang: "Hätte er das gewusst, ...".',
      },
    ],
  })

  const b2Unit13Lesson3 = await prisma.lesson.create({
    data: {
      unitId: b2Unit13.id,
      order: 3,
      grammarTopic: '"falls" und "sofern"',
      explanationDe:
        '"falls" (in case) und "sofern" (provided that) leiten formellere Bedingungssätze ein: "Falls Sie Fragen haben, melden Sie sich." "Sofern nichts anderes vereinbart wird, gilt der Standardpreis."',
      explanationEn:
        '"falls" (in case) and "sofern" (provided that) introduce more formal conditional clauses: "Falls Sie Fragen haben, melden Sie sich." (In case you have questions, get in touch.) "Sofern nichts anderes vereinbart wird, gilt der Standardpreis." (Unless otherwise agreed, the standard price applies.)',
      explanationTr:
        '"falls" (eğer) ve "sofern" (şartıyla) daha resmi koşul cümleleri başlatır: "Falls Sie Fragen haben, melden Sie sich." "Sofern nichts anderes vereinbart wird, gilt der Standardpreis."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit13Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '___ Sie Fragen haben, melden Sie sich. (in case)', options: ['Obwohl', 'Falls', 'Trotzdem', 'Damit'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Falls" bedeutet "in case".',
      },
      {
        lessonId: b2Unit13Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ nichts anderes vereinbart wird, gilt der Standardpreis. (provided that)' },
        correctAnswer: { accepted: ['sofern'] },
        explanation: '"Sofern" bedeutet "provided that / unless".',
      },
    ],
  })

  const b2Unit13Lesson4 = await prisma.lesson.create({
    data: {
      unitId: b2Unit13.id,
      order: 4,
      grammarTopic: 'Wiederholung: Konzessiv & Konditional',
      explanationDe:
        'Wiederholung: "auch wenn/selbst wenn" (Konzessiv), uneingeleitete Bedingungssätze und "falls/sofern" (formeller Konditional) im Vergleich.',
      explanationEn:
        'Review: "auch wenn/selbst wenn" (concessive), uninverted-marker conditional clauses, and "falls/sofern" (formal conditional) compared.',
      explanationTr:
        'Tekrar: "auch wenn/selbst wenn" (karşıtlık), bağlaçsız koşul cümleleri ve "falls/sofern" (resmi koşul) karşılaştırması.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: b2Unit13Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['er', 'hier', 'wäre', 'würde', 'helfen'] },
        correctAnswer: { order: ['wäre', 'er', 'hier', 'würde', 'helfen'] },
        explanation: 'Uneingeleiteter Konditionalsatz: Verb zuerst, dann Subjekt.',
      },
      {
        lessonId: b2Unit13Lesson4.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['Konzessiv (verstärkt)', 'Konditional (formell)', 'Konditional (uneingeleitet)'], rights: ['selbst wenn', 'sofern', 'Wäre er hier, ...'] },
        correctAnswer: {
          pairs: [
            { left: 'Konzessiv (verstärkt)', right: 'selbst wenn' },
            { left: 'Konditional (formell)', right: 'sofern' },
            { left: 'Konditional (uneingeleitet)', right: 'Wäre er hier, ...' },
          ],
        },
        explanation: 'Übersicht über konzessive und konditionale Nebensatzarten.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: b2Unit13Lesson1.id, word: 'verstärken', translationEn: 'to intensify', translationTr: 'güçlendirmek', exampleSentence: 'Das verstärkt den Gegensatz.' },
      { lessonId: b2Unit13Lesson1.id, word: 'der Gegensatz', translationEn: 'the contrast', translationTr: 'zıtlık', exampleSentence: 'Es gibt einen klaren Gegensatz.' },
      { lessonId: b2Unit13Lesson2.id, word: 'die Voraussetzung', translationEn: 'the prerequisite', translationTr: 'ön koşul', exampleSentence: 'Das ist eine wichtige Voraussetzung.' },
      { lessonId: b2Unit13Lesson2.id, word: 'handeln', translationEn: 'to act', translationTr: 'hareket etmek', exampleSentence: 'Er hat schnell gehandelt.' },
      { lessonId: b2Unit13Lesson3.id, word: 'vereinbaren', translationEn: 'to agree on', translationTr: 'anlaşmak', exampleSentence: 'Wir haben einen Termin vereinbart.' },
      { lessonId: b2Unit13Lesson3.id, word: 'der Standardpreis', translationEn: 'the standard price', translationTr: 'standart fiyat', exampleSentence: 'Es gilt der Standardpreis.' },
      { lessonId: b2Unit13Lesson4.id, word: 'vergleichen', translationEn: 'to compare', translationTr: 'karşılaştırmak', exampleSentence: 'Man kann die beiden Formen vergleichen.' },
      { lessonId: b2Unit13Lesson4.id, word: 'die Nebensatzart', translationEn: 'the type of subordinate clause', translationTr: 'yan cümle türü', exampleSentence: 'Es gibt viele Nebensatzarten.' },
    ],
  })

  // --- C1 Unit 1: Konjunktiv I Gegenwart (4 lessons) ---
  const c1Unit1 = await prisma.unit.create({
    data: { levelId: c1.id, order: 1, titleDe: 'Konjunktiv I Gegenwart', titleEn: 'Konjunktiv I Present Tense', titleTr: 'Şimdiki Zaman Konjunktiv I' },
  })
  const c1Unit1Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit1.id,
      order: 1,
      grammarTopic: 'Konjunktiv I in der indirekten Rede',
      explanationDe: 'Der Konjunktiv I wird verwendet, um die Aussage einer anderen Person wiederzugeben, z. B. "Er sagt, er sei müde."',
      explanationEn: 'Konjunktiv I is used to report what someone else said, e.g. "Er sagt, er sei müde" (He says he is tired).',
      explanationTr: 'Konjunktiv I, başka birinin söylediğini aktarmak için kullanılır, örn. "Er sagt, er sei müde" (Yorgun olduğunu söylüyor).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit1Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er sagt, er ___ müde. (indirekte Rede)', options: ['ist', 'sei', 'war', 'wäre'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Konjunktiv I von "sein" für "er" ist "sei".',
      },
      {
        lessonId: c1Unit1Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie lautet die Konjunktiv-I-Form von 'haben' für 'er'?" },
        correctAnswer: { accepted: ['habe', 'er habe'] },
        explanation: 'Konjunktiv I von "haben" für "er" ist "habe".',
      },
    ],
  })
  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit1Lesson1.id, word: 'müde', translationEn: 'tired', translationTr: 'yorgun', exampleSentence: 'Er sagt, er sei müde.' },
      { lessonId: c1Unit1Lesson1.id, word: 'sagen', translationEn: 'to say', translationTr: 'söylemek', exampleSentence: 'Er sagt, er sei müde.' },
    ],
  })

  const c1Unit1Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit1.id,
      order: 2,
      grammarTopic: 'Konjunktiv-I-Formen aller Personen',
      explanationDe:
        'Konjunktiv I wird vom Präsensstamm gebildet: ich -e, du -est, er/sie/es -e, wir -en, ihr -et, sie -en. Nur bei "sein" gibt es Sonderformen: ich sei, du seist, er sei.',
      explanationEn:
        'Konjunktiv I is formed from the present stem: ich -e, du -est, er/sie/es -e, wir -en, ihr -et, sie -en. Only "sein" has special forms: ich sei, du seist, er sei.',
      explanationTr:
        'Konjunktiv I şimdiki zaman kökünden türetilir: ich -e, du -est, er/sie/es -e, wir -en, ihr -et, sie -en. Sadece "sein" özel biçimlere sahiptir: ich sei, du seist, er sei.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit1Lesson2.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie sagt, sie ___ (Konjunktiv I von "kommen") morgen.' },
        correctAnswer: { accepted: ['komme'] },
        explanation: 'Konjunktiv I von "kommen" für "sie" (Singular) ist "komme".',
      },
      {
        lessonId: c1Unit1Lesson2.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Konjunktiv I von "sein" für "du"?', options: ['bist', 'seist', 'wärst', 'sei'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"sein" hat die Sonderform "du seist" im Konjunktiv I.',
      },
    ],
  })

  const c1Unit1Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit1.id,
      order: 3,
      grammarTopic: 'Ersatzform mit "würde"',
      explanationDe:
        'Wenn der Konjunktiv I mit dem Indikativ identisch ist (z. B. bei "sie sagen" -> "sie sagen"), verwendet man die Ersatzform mit "würde" + Infinitiv: "Sie sagen, sie würden kommen."',
      explanationEn:
        'When Konjunktiv I is identical to the indicative (e.g. "sie sagen" -> "sie sagen"), the substitute form with "würde" + infinitive is used instead: "Sie sagen, sie würden kommen" (They say they would come).',
      explanationTr:
        'Konjunktiv I, haber kipiyle aynıysa (örn. "sie sagen" -> "sie sagen"), yerine "würde" + Infinitiv ile yapılan ikame biçim kullanılır: "Sie sagen, sie würden kommen".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit1Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Sie sagen, sie ___ morgen kommen. (Ersatzform, da Konjunktiv I = Indikativ)', options: ['kommen', 'kämen', 'würden', 'seien'] },
        correctAnswer: { correctIndex: 2 },
        explanation: 'Bei Formengleichheit mit dem Indikativ nutzt man "würde" + Infinitiv.',
      },
      {
        lessonId: c1Unit1Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Ersatzform: 'Sie sagen, sie ___ (kommen) morgen.' (würde-Form)" },
        correctAnswer: { accepted: ['würden kommen'] },
        explanation: 'Die Ersatzform lautet "würden kommen".',
      },
    ],
  })

  const c1Unit1Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit1.id,
      order: 4,
      grammarTopic: 'Übung: Konjunktiv I Gegenwart',
      explanationDe:
        'Wiederholung: Konjunktiv I in der indirekten Rede zeigt Distanz zur Aussage eines anderen, ohne die eigene Meinung auszudrücken: "Der Minister erklärte, die Lage sei stabil."',
      explanationEn:
        'Review: Konjunktiv I in reported speech signals distance from someone else\'s statement without expressing the speaker\'s own opinion: "Der Minister erklärte, die Lage sei stabil" (The minister stated the situation was stable).',
      explanationTr:
        'Tekrar: Dolaylı anlatımda Konjunktiv I, konuşmacının kendi görüşünü belirtmeden başkasının ifadesine mesafe koyar: "Der Minister erklärte, die Lage sei stabil".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit1Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['sei', 'die', 'Lage', 'stabil'] },
        correctAnswer: { order: ['die', 'Lage', 'sei', 'stabil'] },
        explanation: 'Nebensatz mit Konjunktiv I: Subjekt, Verb, Prädikativ.',
      },
      {
        lessonId: c1Unit1Lesson4.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['er', 'sie (Pl.)', 'ich'], rights: ['würden (Ersatzform)', 'sei', 'komme'] },
        correctAnswer: {
          pairs: [
            { left: 'er', right: 'sei' },
            { left: 'sie (Pl.)', right: 'würden (Ersatzform)' },
            { left: 'ich', right: 'komme' },
          ],
        },
        explanation: 'Konjunktiv-I-Formen je nach Person.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit1Lesson2.id, word: 'erklären', translationEn: 'to explain / state', translationTr: 'açıklamak', exampleSentence: 'Der Minister erklärte, die Lage sei stabil.' },
      { lessonId: c1Unit1Lesson2.id, word: 'die Lage', translationEn: 'the situation', translationTr: 'durum', exampleSentence: 'Die Lage ist stabil.' },
      { lessonId: c1Unit1Lesson3.id, word: 'behaupten', translationEn: 'to claim', translationTr: 'iddia etmek', exampleSentence: 'Er behauptet, er würde die Wahrheit sagen.' },
      { lessonId: c1Unit1Lesson3.id, word: 'die Wahrheit', translationEn: 'the truth', translationTr: 'gerçek', exampleSentence: 'Er sagt die Wahrheit.' },
      { lessonId: c1Unit1Lesson4.id, word: 'die Aussage', translationEn: 'the statement', translationTr: 'ifade', exampleSentence: 'Seine Aussage war nicht ganz klar.' },
      { lessonId: c1Unit1Lesson4.id, word: 'stabil', translationEn: 'stable', translationTr: 'istikrarlı', exampleSentence: 'Die wirtschaftliche Lage ist stabil.' },
    ],
  })

  // --- C1 Unit 2: Konjunktiv I Vergangenheit (4 lessons) ---
  const c1Unit2 = await prisma.unit.create({
    data: { levelId: c1.id, order: 2, titleDe: 'Konjunktiv I Vergangenheit', titleEn: 'Konjunktiv I Past Tense', titleTr: 'Geçmiş Zaman Konjunktiv I' },
  })
  const c1Unit2Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit2.id,
      order: 1,
      grammarTopic: 'Bildung: habe/sei + Partizip II',
      explanationDe:
        'Der Konjunktiv I der Vergangenheit wird mit "habe" oder "sei" + Partizip II gebildet: "Er sagte, er habe das Buch gelesen." / "Sie sagte, sie sei nach Hause gegangen."',
      explanationEn:
        'The Konjunktiv I past is formed with "habe" or "sei" + past participle: "Er sagte, er habe das Buch gelesen" (He said he had read the book). / "Sie sagte, sie sei nach Hause gegangen" (She said she had gone home).',
      explanationTr:
        'Geçmiş zaman Konjunktiv I, "habe" veya "sei" + Partizip II ile kurulur: "Er sagte, er habe das Buch gelesen." / "Sie sagte, sie sei nach Hause gegangen."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit2Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er sagte, er ___ das Buch gelesen.', options: ['habe', 'sei', 'hätte', 'war'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Lesen" bildet das Perfekt mit "haben", also Konjunktiv I mit "habe".',
      },
      {
        lessonId: c1Unit2Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie sagte, sie ___ nach Hause gegangen. (sei/habe)' },
        correctAnswer: { accepted: ['sei'] },
        explanation: '"Gehen" bildet das Perfekt mit "sein", also Konjunktiv I mit "sei".',
      },
    ],
  })

  const c1Unit2Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit2.id,
      order: 2,
      grammarTopic: 'Indirekte Rede mit Zeitverschiebung',
      explanationDe:
        'Bei der Wiedergabe vergangener Aussagen bleibt die Zeitstufe erhalten, aber die Person wechselt: Direkt: "Ich habe gewartet." -> Indirekt: "Er sagte, er habe gewartet."',
      explanationEn:
        'When reporting past statements, the time frame stays the same but the person changes: Direct: "Ich habe gewartet" (I waited). -> Indirect: "Er sagte, er habe gewartet" (He said he had waited).',
      explanationTr:
        'Geçmiş ifadeler aktarılırken zaman aynı kalır ama şahıs değişir: Doğrudan: "Ich habe gewartet." -> Dolaylı: "Er sagte, er habe gewartet."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit2Lesson2.id,
        order: 1,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wandle um in indirekte Rede: 'Ich habe gewartet', sagte er. -> Er sagte, er ___." },
        correctAnswer: { accepted: ['habe gewartet'] },
        explanation: 'Indirekte Rede: "er habe gewartet".',
      },
      {
        lessonId: c1Unit2Lesson2.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Direkt: "Wir sind angekommen." Indirekt: Sie sagten, sie ___ angekommen.', options: ['seien', 'haben', 'hätten', 'wären'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Ankommen" bildet das Perfekt mit "sein" -> Konjunktiv I: "seien".',
      },
    ],
  })

  const c1Unit2Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit2.id,
      order: 3,
      grammarTopic: 'Konjunktiv II der Vergangenheit als Ersatzform',
      explanationDe:
        'Ist der Konjunktiv I der Vergangenheit formgleich mit dem Indikativ (bei "sie"/Plural), nutzt man den Konjunktiv II der Vergangenheit: "Sie sagten, sie hätten gewartet."',
      explanationEn:
        'When the Konjunktiv I past is identical to the indicative (with "sie"/plural), the Konjunktiv II past is used instead: "Sie sagten, sie hätten gewartet" (They said they had waited).',
      explanationTr:
        'Geçmiş Konjunktiv I, haber kipiyle aynıysa ("sie"/çoğul ile), onun yerine geçmiş Konjunktiv II kullanılır: "Sie sagten, sie hätten gewartet."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit2Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Sie (Pl.) sagten, sie ___ gewartet. (Ersatzform)', options: ['haben', 'habe', 'hätten', 'seien'] },
        correctAnswer: { correctIndex: 2 },
        explanation: 'Bei Formengleichheit im Plural nutzt man den Konjunktiv II: "hätten".',
      },
      {
        lessonId: c1Unit2Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Sie sagten, sie ___ (haben-Konjunktiv-II) keine Zeit gehabt.' },
        correctAnswer: { accepted: ['hätten'] },
        explanation: 'Konjunktiv II von "haben" im Plural ist "hätten".',
      },
    ],
  })

  const c1Unit2Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit2.id,
      order: 4,
      grammarTopic: 'Übung: Konjunktiv I Vergangenheit',
      explanationDe:
        'Wiederholung: In Nachrichtentexten wird die Vergangenheit oft im Konjunktiv I wiedergegeben: "Die Polizei teilte mit, der Verdächtige sei geflohen."',
      explanationEn:
        'Review: news reports often use Konjunktiv I to report past events: "Die Polizei teilte mit, der Verdächtige sei geflohen" (The police announced the suspect had fled).',
      explanationTr:
        'Tekrar: Haber metinlerinde geçmiş genellikle Konjunktiv I ile aktarılır: "Die Polizei teilte mit, der Verdächtige sei geflohen."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit2Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['geflohen', 'der', 'sei', 'Verdächtige'] },
        correctAnswer: { order: ['der', 'Verdächtige', 'sei', 'geflohen'] },
        explanation: 'Nebensatzstruktur: Subjekt, Konjunktiv-I-Hilfsverb, Partizip II.',
      },
      {
        lessonId: c1Unit2Lesson4.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['lesen (Perfekt mit haben)', 'gehen (Perfekt mit sein)', 'warten (Perfekt mit haben)'], rights: ['sie sei gegangen', 'er habe gewartet', 'er habe gelesen'] },
        correctAnswer: {
          pairs: [
            { left: 'lesen (Perfekt mit haben)', right: 'er habe gelesen' },
            { left: 'gehen (Perfekt mit sein)', right: 'sie sei gegangen' },
            { left: 'warten (Perfekt mit haben)', right: 'er habe gewartet' },
          ],
        },
        explanation: 'Konjunktiv I der Vergangenheit richtet sich nach dem Perfekt-Hilfsverb.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit2Lesson1.id, word: 'ankommen', translationEn: 'to arrive', translationTr: 'varmak', exampleSentence: 'Sie sagten, sie seien angekommen.' },
      { lessonId: c1Unit2Lesson1.id, word: 'gestehen', translationEn: 'to confess', translationTr: 'itiraf etmek', exampleSentence: 'Er gestand, er habe gelogen.' },
      { lessonId: c1Unit2Lesson2.id, word: 'die Verspätung', translationEn: 'the delay', translationTr: 'gecikme', exampleSentence: 'Er sagte, er habe wegen der Verspätung gewartet.' },
      { lessonId: c1Unit2Lesson2.id, word: 'mitteilen', translationEn: 'to announce / inform', translationTr: 'bildirmek', exampleSentence: 'Die Polizei teilte mit, der Verdächtige sei geflohen.' },
      { lessonId: c1Unit2Lesson3.id, word: 'die Übereinstimmung', translationEn: 'the agreement / match', translationTr: 'uyum', exampleSentence: 'Die Form zeigt keine Übereinstimmung mit dem Indikativ.' },
      { lessonId: c1Unit2Lesson3.id, word: 'die Form', translationEn: 'the form', translationTr: 'biçim', exampleSentence: 'Die Form ist im Plural gleich.' },
      { lessonId: c1Unit2Lesson4.id, word: 'der Verdächtige', translationEn: 'the suspect', translationTr: 'şüpheli', exampleSentence: 'Der Verdächtige sei geflohen.' },
      { lessonId: c1Unit2Lesson4.id, word: 'fliehen', translationEn: 'to flee', translationTr: 'kaçmak', exampleSentence: 'Der Verdächtige ist geflohen.' },
    ],
  })

  // --- C1 Unit 3: Erweiterte Partizipialattribute (4 lessons) ---
  const c1Unit3 = await prisma.unit.create({
    data: { levelId: c1.id, order: 3, titleDe: 'Erweiterte Partizipialattribute', titleEn: 'Extended Participial Attributes', titleTr: 'Genişletilmiş Sıfat-Fiil Yapıları' },
  })
  const c1Unit3Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit3.id,
      order: 1,
      grammarTopic: 'Erweitertes Partizip I als Attribut',
      explanationDe:
        'Ein erweitertes Partizip-I-Attribut steht vor dem Nomen und kann durch weitere Wörter ergänzt werden: "der schnell wachsende Markt" (Partizip I "wachsend" + Adverb "schnell").',
      explanationEn:
        'An extended Partizip I attribute sits before the noun and can include additional modifying words: "der schnell wachsende Markt" (the rapidly growing market — Partizip I "wachsend" plus the adverb "schnell").',
      explanationTr:
        'Genişletilmiş Partizip I sıfatı isimden önce gelir ve ek kelimelerle genişletilebilir: "der schnell wachsende Markt" (hızla büyüyen pazar).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit3Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Partizip passt? "der schnell ___ Markt" (wachsen)', options: ['gewachsen', 'wachsend', 'wächst', 'wachsende'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Partizip I (Gegenwart, aktiv) von "wachsen" ist "wachsend"; die Endung -e kommt von der Adjektivdeklination.',
      },
      {
        lessonId: c1Unit3Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Der schnell ___ Markt zieht viele Investoren an. (wachsen, Partizip I mit Adjektivendung)' },
        correctAnswer: { accepted: ['wachsende'] },
        explanation: 'Partizip I + Adjektivendung: "wachsende".',
      },
    ],
  })

  const c1Unit3Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit3.id,
      order: 2,
      grammarTopic: 'Erweitertes Partizip II als Attribut',
      explanationDe:
        'Auch das Partizip II kann erweitert vor dem Nomen stehen, meist passivisch: "das von der Regierung geplante Gesetz" (das Gesetz, das von der Regierung geplant wird).',
      explanationEn:
        'Partizip II can also appear extended before a noun, usually with passive meaning: "das von der Regierung geplante Gesetz" (the law planned by the government).',
      explanationTr:
        'Partizip II de genellikle edilgen anlamla isimden önce genişletilmiş biçimde kullanılabilir: "das von der Regierung geplante Gesetz" (hükümet tarafından planlanan yasa).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit3Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '"das von der Regierung ___ Gesetz" (planen, Partizip II)', options: ['plant', 'geplante', 'planende', 'geplant hat'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Partizip II "geplant" + Adjektivendung "-e" vor neutralem Nomen im Nominativ.',
      },
      {
        lessonId: c1Unit3Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Forme um: 'das Gesetz, das von der Regierung geplant wird' -> 'das ___ Gesetz' (Partizipialattribut)" },
        correctAnswer: { accepted: ['von der regierung geplante'] },
        explanation: 'Passivischer Relativsatz wird zum Partizipialattribut: "von der Regierung geplante".',
      },
    ],
  })

  const c1Unit3Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit3.id,
      order: 3,
      grammarTopic: 'Umwandlung Relativsatz <-> Partizipialattribut',
      explanationDe:
        'Partizipialattribute ersetzen oft Relativsätze in formellen Texten: "Die Studie, die letztes Jahr veröffentlicht wurde" -> "Die letztes Jahr veröffentlichte Studie."',
      explanationEn:
        'Participial attributes often replace relative clauses in formal texts: "Die Studie, die letztes Jahr veröffentlicht wurde" -> "Die letztes Jahr veröffentlichte Studie" (The study published last year).',
      explanationTr:
        'Sıfat-fiil yapıları resmi metinlerde sık sık ilgi cümlelerinin yerini alır: "Die Studie, die letztes Jahr veröffentlicht wurde" -> "Die letztes Jahr veröffentlichte Studie."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit3Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'Welcher Satz ist die Partizipialattribut-Version von "die Studie, die veröffentlicht wurde"?',
          options: ['die veröffentlichte Studie', 'die veröffentlichende Studie', 'die Studie veröffentlicht', 'die zu veröffentlichende Studie'],
        },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Passiv -> Partizip II als Attribut: "die veröffentlichte Studie".',
      },
      {
        lessonId: c1Unit3Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die letztes Jahr ___ Studie zeigt neue Ergebnisse. (veröffentlichen, Partizip II)' },
        correctAnswer: { accepted: ['veröffentlichte'] },
        explanation: 'Partizip II + Adjektivendung: "veröffentlichte".',
      },
    ],
  })

  const c1Unit3Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit3.id,
      order: 4,
      grammarTopic: 'Übung: Partizipialattribute',
      explanationDe:
        'Wiederholung: Erweiterte Partizipialattribute sind typisch für Zeitungs- und Fachtexte und ermöglichen kompakte, informationsdichte Sätze.',
      explanationEn:
        'Review: extended participial attributes are typical of newspaper and academic texts, allowing compact, information-dense sentences.',
      explanationTr:
        'Tekrar: Genişletilmiş sıfat-fiil yapıları gazete ve akademik metinlerde tipiktir; kısa ve bilgi yoğun cümleler kurmayı sağlar.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit3Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['Markt', 'wachsende', 'der', 'schnell'] },
        correctAnswer: { order: ['der', 'schnell', 'wachsende', 'Markt'] },
        explanation: 'Reihenfolge: Artikel, Adverb, Partizip+Endung, Nomen.',
      },
      {
        lessonId: c1Unit3Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'the rapidly growing market' (als Partizipialattribut)?" },
        correctAnswer: { accepted: ['der schnell wachsende markt'] },
        explanation: '"Der schnell wachsende Markt" ist die Partizipialattribut-Form.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit3Lesson1.id, word: 'wachsen', translationEn: 'to grow', translationTr: 'büyümek', exampleSentence: 'Der Markt wächst schnell.' },
      { lessonId: c1Unit3Lesson1.id, word: 'der Investor', translationEn: 'the investor', translationTr: 'yatırımcı', exampleSentence: 'Viele Investoren interessieren sich für den Markt.' },
      { lessonId: c1Unit3Lesson2.id, word: 'die Regierung', translationEn: 'the government', translationTr: 'hükümet', exampleSentence: 'Die Regierung plant ein neues Gesetz.' },
      { lessonId: c1Unit3Lesson2.id, word: 'das Gesetz', translationEn: 'the law', translationTr: 'yasa', exampleSentence: 'Das Gesetz tritt bald in Kraft.' },
      { lessonId: c1Unit3Lesson3.id, word: 'die Studie', translationEn: 'the study', translationTr: 'araştırma', exampleSentence: 'Die Studie wurde letztes Jahr veröffentlicht.' },
      { lessonId: c1Unit3Lesson3.id, word: 'veröffentlichen', translationEn: 'to publish', translationTr: 'yayımlamak', exampleSentence: 'Die Ergebnisse wurden veröffentlicht.' },
      { lessonId: c1Unit3Lesson4.id, word: 'kompakt', translationEn: 'compact', translationTr: 'kompakt', exampleSentence: 'Der Satz ist sehr kompakt formuliert.' },
      { lessonId: c1Unit3Lesson4.id, word: 'informationsdicht', translationEn: 'information-dense', translationTr: 'bilgi yoğun', exampleSentence: 'Fachtexte sind oft informationsdicht.' },
    ],
  })

  // --- C1 Unit 4: Nominalstil vs. Verbalstil (4 lessons) ---
  const c1Unit4 = await prisma.unit.create({
    data: { levelId: c1.id, order: 4, titleDe: 'Nominalstil vs. Verbalstil', titleEn: 'Nominal Style vs. Verbal Style', titleTr: 'İsim Stili ve Fiil Stili' },
  })
  const c1Unit4Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit4.id,
      order: 1,
      grammarTopic: 'Was ist Nominalstil?',
      explanationDe:
        'Der Nominalstil drückt Handlungen durch Nomen statt Verben aus und wirkt formeller: "die Durchführung der Untersuchung" statt "die Untersuchung durchführen".',
      explanationEn:
        'Nominal style expresses actions through nouns rather than verbs and sounds more formal: "die Durchführung der Untersuchung" (the conducting of the investigation) instead of "die Untersuchung durchführen" (to conduct the investigation).',
      explanationTr:
        'İsim stili eylemleri fiil yerine isimle ifade eder ve daha resmi görünür: "die Untersuchung durchführen" yerine "die Durchführung der Untersuchung".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit4Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'Welcher Satz ist im Nominalstil?',
          options: ['Wir untersuchen den Fall.', 'Die Untersuchung des Falls erfolgt morgen.', 'Wir haben den Fall untersucht.', 'Der Fall wird untersucht.'],
        },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Die Untersuchung des Falls" ist ein Nomen anstelle eines Verbs — typischer Nominalstil.',
      },
      {
        lessonId: c1Unit4Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Nominalisierung von "durchführen": die ___.' },
        correctAnswer: { accepted: ['durchführung'] },
        explanation: '"durchführen" -> "die Durchführung".',
      },
    ],
  })

  const c1Unit4Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit4.id,
      order: 2,
      grammarTopic: 'Nominalisierung von Verben',
      explanationDe:
        'Verben werden oft mit den Endungen -ung, -heit, -keit oder als substantivierter Infinitiv nominalisiert: "entscheiden" -> "die Entscheidung", "das Entscheiden".',
      explanationEn:
        'Verbs are often nominalized with the endings -ung, -heit, -keit, or as a substantivized infinitive: "entscheiden" (to decide) -> "die Entscheidung" (the decision), "das Entscheiden" (the deciding).',
      explanationTr:
        'Fiiller genellikle -ung, -heit, -keit ekleriyle veya isimleşmiş mastar olarak isimleştirilir: "entscheiden" -> "die Entscheidung", "das Entscheiden".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit4Lesson2.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['entscheiden', 'sicher', 'möglich'], rights: ['die Sicherheit', 'die Möglichkeit', 'die Entscheidung'] },
        correctAnswer: {
          pairs: [
            { left: 'entscheiden', right: 'die Entscheidung' },
            { left: 'sicher', right: 'die Sicherheit' },
            { left: 'möglich', right: 'die Möglichkeit' },
          ],
        },
        explanation: 'Nominalisierung mit -ung (Verb) und -heit/-keit (Adjektiv).',
      },
      {
        lessonId: c1Unit4Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nominalisierung von 'möglich' (Adjektiv, mit -keit)?" },
        correctAnswer: { accepted: ['die möglichkeit', 'möglichkeit'] },
        explanation: '"möglich" -> "die Möglichkeit".',
      },
    ],
  })

  const c1Unit4Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit4.id,
      order: 3,
      grammarTopic: 'Verbalstil zur Vereinfachung',
      explanationDe:
        'Der Verbalstil ist klarer und persönlicher und wird oft für mündliche oder einfache Texte bevorzugt: "die Durchführung der Untersuchung" -> "wir führen die Untersuchung durch".',
      explanationEn:
        'Verbal style is clearer and more personal, often preferred for spoken or simpler texts: "die Durchführung der Untersuchung" -> "wir führen die Untersuchung durch" (we conduct the investigation).',
      explanationTr:
        'Fiil stili daha açık ve kişiseldir; sözlü veya basit metinlerde tercih edilir: "die Durchführung der Untersuchung" -> "wir führen die Untersuchung durch".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit4Lesson3.id,
        order: 1,
        type: 'SHORT_ANSWER',
        data: { prompt: "Forme in Verbalstil um: 'die Überprüfung der Daten' -> 'wir ___ die Daten.' (überprüfen)" },
        correctAnswer: { accepted: ['überprüfen'] },
        explanation: 'Nominalstil -> Verbalstil: "wir überprüfen die Daten".',
      },
      {
        lessonId: c1Unit4Lesson3.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'Welcher Satz ist im Verbalstil?',
          options: ['Die Überprüfung der Daten ist notwendig.', 'Wir überprüfen die Daten.', 'Die Datenüberprüfung erfolgt heute.', 'Eine Überprüfung der Daten findet statt.'],
        },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Wir überprüfen die Daten" benutzt ein Verb statt eines Nomens.',
      },
    ],
  })

  const c1Unit4Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit4.id,
      order: 4,
      grammarTopic: 'Übung: Nominalstil vs. Verbalstil',
      explanationDe:
        'Wiederholung: Nominalstil dominiert in Verwaltungs-, Wissenschafts- und Zeitungstexten; Verbalstil wirkt lebendiger und wird in Erzählungen und Gesprächen bevorzugt.',
      explanationEn:
        'Review: nominal style dominates administrative, academic, and newspaper texts; verbal style feels livelier and is preferred in narratives and conversation.',
      explanationTr:
        'Tekrar: İsim stili resmi, akademik ve gazete metinlerinde baskındır; fiil stili daha canlıdır ve anlatı ile konuşmada tercih edilir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit4Lesson4.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Nominalstil: "die ___ der Untersuchung" (durchführen, Nominalisierung)' },
        correctAnswer: { accepted: ['durchführung'] },
        explanation: '"durchführen" -> "die Durchführung".',
      },
      {
        lessonId: c1Unit4Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'In welchem Textyp dominiert typischerweise der Nominalstil?', options: ['Persönlicher Brief', 'Verwaltungstext', 'Chat-Nachricht', 'Märchen'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Verwaltungs- und Fachtexte bevorzugen den formelleren Nominalstil.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit4Lesson1.id, word: 'die Untersuchung', translationEn: 'the investigation', translationTr: 'inceleme', exampleSentence: 'Die Untersuchung des Falls erfolgt morgen.' },
      { lessonId: c1Unit4Lesson1.id, word: 'erfolgen', translationEn: 'to take place', translationTr: 'gerçekleşmek', exampleSentence: 'Die Prüfung erfolgt am Montag.' },
      { lessonId: c1Unit4Lesson2.id, word: 'entscheiden', translationEn: 'to decide', translationTr: 'karar vermek', exampleSentence: 'Wir müssen schnell entscheiden.' },
      { lessonId: c1Unit4Lesson2.id, word: 'möglich', translationEn: 'possible', translationTr: 'mümkün', exampleSentence: 'Das ist gut möglich.' },
      { lessonId: c1Unit4Lesson3.id, word: 'überprüfen', translationEn: 'to check / verify', translationTr: 'kontrol etmek', exampleSentence: 'Wir überprüfen die Daten sorgfältig.' },
      { lessonId: c1Unit4Lesson3.id, word: 'die Daten', translationEn: 'the data', translationTr: 'veri', exampleSentence: 'Die Daten sind vollständig.' },
      { lessonId: c1Unit4Lesson4.id, word: 'lebendig', translationEn: 'lively', translationTr: 'canlı', exampleSentence: 'Der Verbalstil wirkt lebendiger.' },
      { lessonId: c1Unit4Lesson4.id, word: 'die Verwaltung', translationEn: 'the administration', translationTr: 'yönetim', exampleSentence: 'Die Verwaltung bearbeitet den Antrag.' },
    ],
  })

  // --- C1 Unit 5: Komplexe Konnektoren (4 lessons) ---
  const c1Unit5 = await prisma.unit.create({
    data: { levelId: c1.id, order: 5, titleDe: 'Komplexe Konnektoren', titleEn: 'Complex Connectors', titleTr: 'Karmaşık Bağlaçlar' },
  })
  const c1Unit5Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit5.id,
      order: 1,
      grammarTopic: '"zumal" und "insofern"',
      explanationDe:
        '"Zumal" begründet zusätzlich (= vor allem weil): "Wir bleiben zu Hause, zumal es regnet." "Insofern" bedeutet "in dieser Hinsicht": "Insofern hat er recht."',
      explanationEn:
        '"Zumal" adds an emphasizing reason (= especially because): "Wir bleiben zu Hause, zumal es regnet" (We\'re staying home, especially since it\'s raining). "Insofern" means "in this respect": "Insofern hat er recht" (In that respect, he\'s right).',
      explanationTr:
        '"Zumal" ek bir gerekçe vurgular (= özellikle çünkü): "Wir bleiben zu Hause, zumal es regnet." "Insofern" "bu bakımdan" anlamına gelir: "Insofern hat er recht."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit5Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wir bleiben zu Hause, ___ es regnet. (verstärkender Grund)', options: ['obwohl', 'zumal', 'trotzdem', 'dennoch'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Zumal" verstärkt den Grund: "vor allem weil".',
      },
      {
        lessonId: c1Unit5Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ hat er recht. (in dieser Hinsicht)' },
        correctAnswer: { accepted: ['insofern'] },
        explanation: '"Insofern" bedeutet "in dieser Hinsicht".',
      },
    ],
  })

  const c1Unit5Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit5.id,
      order: 2,
      grammarTopic: '"gleichwohl" und "nichtsdestotrotz"',
      explanationDe:
        '"Gleichwohl" und "nichtsdestotrotz" sind gehobene Synonyme für "trotzdem": "Das Wetter war schlecht, gleichwohl fuhren wir los."',
      explanationEn:
        '"Gleichwohl" and "nichtsdestotrotz" are elevated synonyms for "trotzdem" (nevertheless): "Das Wetter war schlecht, gleichwohl fuhren wir los" (The weather was bad; nevertheless, we set off).',
      explanationTr:
        '"Gleichwohl" ve "nichtsdestotrotz", "trotzdem" (yine de) için yüksek dil eşanlamlılarıdır: "Das Wetter war schlecht, gleichwohl fuhren wir los."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit5Lesson2.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['trotzdem', 'gleichwohl', 'nichtsdestotrotz'], rights: ['gehoben, betont', 'neutral', 'gehoben'] },
        correctAnswer: {
          pairs: [
            { left: 'trotzdem', right: 'neutral' },
            { left: 'gleichwohl', right: 'gehoben' },
            { left: 'nichtsdestotrotz', right: 'gehoben, betont' },
          ],
        },
        explanation: 'Stilebenen von Konzessivkonnektoren.',
      },
      {
        lessonId: c1Unit5Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne ein gehobenes Synonym für 'trotzdem'." },
        correctAnswer: { accepted: ['gleichwohl', 'nichtsdestotrotz'] },
        explanation: '"Gleichwohl" oder "nichtsdestotrotz" sind gehobene Synonyme.',
      },
    ],
  })

  const c1Unit5Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit5.id,
      order: 3,
      grammarTopic: 'Konnektoren in Argumentationsketten',
      explanationDe:
        'Für Argumentationsketten nutzt man Konnektoren wie "des Weiteren" (außerdem), "nicht zuletzt" (auch, besonders) und "mithin" (folglich): "Nicht zuletzt deshalb ist die Maßnahme sinnvoll."',
      explanationEn:
        'Argumentative chains use connectors like "des Weiteren" (furthermore), "nicht zuletzt" (not least, especially), and "mithin" (consequently): "Nicht zuletzt deshalb ist die Maßnahme sinnvoll" (Not least for that reason, the measure makes sense).',
      explanationTr:
        'Argüman zincirlerinde "des Weiteren" (ayrıca), "nicht zuletzt" (özellikle) ve "mithin" (dolayısıyla) gibi bağlaçlar kullanılır: "Nicht zuletzt deshalb ist die Maßnahme sinnvoll."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit5Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Wort bedeutet "folglich" (gehoben)?', options: ['mithin', 'obwohl', 'sobald', 'außer'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Mithin" ist ein gehobenes Synonym für "folglich".',
      },
      {
        lessonId: c1Unit5Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ deshalb ist die Maßnahme sinnvoll. (nicht zuletzt)' },
        correctAnswer: { accepted: ['nicht zuletzt'] },
        explanation: '"Nicht zuletzt" betont einen wichtigen, zusätzlichen Grund.',
      },
    ],
  })

  const c1Unit5Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit5.id,
      order: 4,
      grammarTopic: 'Übung: Komplexe Konnektoren',
      explanationDe:
        'Wiederholung: Gehobene Konnektoren wie "zumal", "gleichwohl" und "mithin" verleihen Texten wissenschaftlichen und formellen Charakter.',
      explanationEn:
        'Review: elevated connectors like "zumal", "gleichwohl", and "mithin" give texts an academic and formal character.',
      explanationTr:
        'Tekrar: "Zumal", "gleichwohl" ve "mithin" gibi yüksek düzey bağlaçlar metinlere akademik ve resmi bir hava katar.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit5Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['fuhren', 'gleichwohl', 'wir', 'los'] },
        correctAnswer: { order: ['gleichwohl', 'fuhren', 'wir', 'los'] },
        explanation: 'Konnektor am Satzanfang, dann Verb-Zweit-Stellung.',
      },
      {
        lessonId: c1Unit5Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welcher Konnektor passt NICHT zu den anderen (bedeutungsmäßig)?', options: ['gleichwohl', 'nichtsdestotrotz', 'trotzdem', 'mithin'] },
        correctAnswer: { correctIndex: 3 },
        explanation: '"Mithin" bedeutet "folglich" (Konsequenz), die anderen drei bedeuten "trotzdem" (Konzession).',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit5Lesson1.id, word: 'die Hinsicht', translationEn: 'the respect / regard', translationTr: 'bakım', exampleSentence: 'In dieser Hinsicht hat er recht.' },
      { lessonId: c1Unit5Lesson1.id, word: 'begründen', translationEn: 'to justify / give a reason', translationTr: 'gerekçelendirmek', exampleSentence: 'Er begründet seine Entscheidung ausführlich.' },
      { lessonId: c1Unit5Lesson2.id, word: 'gehoben', translationEn: 'elevated / formal (register)', translationTr: 'yüksek (dil düzeyi)', exampleSentence: 'Das ist eine gehobene Ausdrucksweise.' },
      { lessonId: c1Unit5Lesson2.id, word: 'das Synonym', translationEn: 'the synonym', translationTr: 'eşanlamlı', exampleSentence: 'Das ist ein Synonym für "trotzdem".' },
      { lessonId: c1Unit5Lesson3.id, word: 'die Maßnahme', translationEn: 'the measure / action taken', translationTr: 'önlem', exampleSentence: 'Die Maßnahme ist sinnvoll.' },
      { lessonId: c1Unit5Lesson3.id, word: 'sinnvoll', translationEn: 'sensible / meaningful', translationTr: 'anlamlı', exampleSentence: 'Das ist eine sinnvolle Lösung.' },
      { lessonId: c1Unit5Lesson4.id, word: 'wissenschaftlich', translationEn: 'academic / scientific', translationTr: 'bilimsel', exampleSentence: 'Der Text hat einen wissenschaftlichen Charakter.' },
      { lessonId: c1Unit5Lesson4.id, word: 'der Charakter', translationEn: 'the character', translationTr: 'karakter', exampleSentence: 'Der Text hat einen formellen Charakter.' },
    ],
  })

  // --- C1 Unit 6: Modalpartikeln (4 lessons) ---
  const c1Unit6 = await prisma.unit.create({
    data: { levelId: c1.id, order: 6, titleDe: 'Modalpartikeln', titleEn: 'Modal Particles', titleTr: 'Kip Belirteçleri' },
  })
  const c1Unit6Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit6.id,
      order: 1,
      grammarTopic: '"doch" und "ja"',
      explanationDe:
        '"Doch" drückt Widerspruch oder Erinnerung aus: "Das weißt du doch!" "Ja" betont Offensichtliches: "Das ist ja klar!"',
      explanationEn:
        '"Doch" expresses contradiction or a reminder: "Das weißt du doch!" (You know that, after all!) "Ja" emphasizes something obvious: "Das ist ja klar!" (That\'s obviously clear!)',
      explanationTr:
        '"Doch" itiraz veya hatırlatma ifade eder: "Das weißt du doch!" "Ja" bariz bir şeyi vurgular: "Das ist ja klar!"',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit6Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Das weißt du ___! (Erinnerung/Widerspruch)', options: ['mal', 'doch', 'halt', 'eben'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Doch" erinnert oder widerspricht sanft.',
      },
      {
        lessonId: c1Unit6Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Das ist ___ klar! (Offensichtliches betonen)' },
        correctAnswer: { accepted: ['ja'] },
        explanation: '"Ja" betont, dass etwas offensichtlich ist.',
      },
    ],
  })

  const c1Unit6Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit6.id,
      order: 2,
      grammarTopic: '"eben" und "halt"',
      explanationDe:
        '"Eben" und "halt" (süddeutsch/umgangssprachlich) drücken Resignation oder Unabänderlichkeit aus: "So ist es eben." / "Das ist halt so."',
      explanationEn:
        '"Eben" and "halt" (Southern German/colloquial) express resignation or that something can\'t be changed: "So ist es eben" / "Das ist halt so" (That\'s just how it is).',
      explanationTr:
        '"Eben" ve "halt" (Güney Almanya/günlük dil) teslimiyet veya değiştirilemezlik ifade eder: "So ist es eben." / "Das ist halt so."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit6Lesson2.id,
        order: 1,
        type: 'SHORT_ANSWER',
        data: { prompt: "Ergänze mit einer Modalpartikel für 'Resignation': 'So ist es ___.'" },
        correctAnswer: { accepted: ['eben', 'halt'] },
        explanation: '"Eben" oder "halt" drücken Resignation aus.',
      },
      {
        lessonId: c1Unit6Lesson2.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welche Partikel ist typisch süddeutsch/umgangssprachlich?', options: ['eben', 'halt', 'ja', 'doch'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Halt" ist besonders im süddeutschen Sprachraum verbreitet.',
      },
    ],
  })

  const c1Unit6Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit6.id,
      order: 3,
      grammarTopic: '"mal" und "denn"',
      explanationDe:
        '"Mal" mildert Aufforderungen: "Komm mal her!" "Denn" macht Fragen freundlicher/interessierter: "Wie geht es dir denn?"',
      explanationEn:
        '"Mal" softens a request: "Komm mal her!" (Come here, would you?) "Denn" makes questions sound friendlier/more curious: "Wie geht es dir denn?" (So how are you doing?)',
      explanationTr:
        '"Mal" bir talebi yumuşatır: "Komm mal her!" "Denn" soruları daha samimi/ilgili yapar: "Wie geht es dir denn?"',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit6Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Komm ___ her! (mildere Aufforderung)', options: ['denn', 'mal', 'ja', 'doch'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Mal" mildert die Aufforderung.',
      },
      {
        lessonId: c1Unit6Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Wie geht es dir ___? (freundliche Frage)' },
        correctAnswer: { accepted: ['denn'] },
        explanation: '"Denn" macht die Frage freundlicher.',
      },
    ],
  })

  const c1Unit6Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit6.id,
      order: 4,
      grammarTopic: 'Übung: Modalpartikeln',
      explanationDe:
        'Wiederholung: Modalpartikeln verändern nicht die Grundbedeutung eines Satzes, sondern die Einstellung/Stimmung des Sprechers. Sie sind typisch für die gesprochene Sprache.',
      explanationEn:
        'Review: modal particles don\'t change a sentence\'s core meaning but express the speaker\'s attitude or mood. They\'re typical of spoken German.',
      explanationTr:
        'Tekrar: Kip belirteçleri cümlenin temel anlamını değil, konuşmacının tutumunu/ruh halini değiştirir. Konuşma dilinde tipiktirler.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit6Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['doch', 'mal', 'denn'], rights: ['freundlichere Frage', 'Widerspruch/Erinnerung', 'mildert Aufforderung'] },
        correctAnswer: {
          pairs: [
            { left: 'doch', right: 'Widerspruch/Erinnerung' },
            { left: 'mal', right: 'mildert Aufforderung' },
            { left: 'denn', right: 'freundlichere Frage' },
          ],
        },
        explanation: 'Jede Modalpartikel hat eine eigene pragmatische Funktion.',
      },
      {
        lessonId: c1Unit6Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Sind Modalpartikeln typischer für gesprochene oder geschriebene Sprache?" },
        correctAnswer: { accepted: ['gesprochene sprache', 'gesprochen'] },
        explanation: 'Modalpartikeln sind typisch für die gesprochene Sprache.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit6Lesson1.id, word: 'offensichtlich', translationEn: 'obvious', translationTr: 'bariz', exampleSentence: 'Das ist offensichtlich falsch.' },
      { lessonId: c1Unit6Lesson1.id, word: 'widersprechen', translationEn: 'to contradict', translationTr: 'itiraz etmek', exampleSentence: 'Er widerspricht mir ständig.' },
      { lessonId: c1Unit6Lesson2.id, word: 'die Resignation', translationEn: 'resignation', translationTr: 'teslimiyet', exampleSentence: 'In seiner Stimme lag Resignation.' },
      { lessonId: c1Unit6Lesson2.id, word: 'unabänderlich', translationEn: 'unchangeable', translationTr: 'değiştirilemez', exampleSentence: 'Diese Tatsache ist unabänderlich.' },
      { lessonId: c1Unit6Lesson3.id, word: 'die Aufforderung', translationEn: 'the request / prompt', translationTr: 'talep', exampleSentence: 'Das war eine freundliche Aufforderung.' },
      { lessonId: c1Unit6Lesson3.id, word: 'mildern', translationEn: 'to soften', translationTr: 'yumuşatmak', exampleSentence: '"Mal" mildert die Aufforderung.' },
      { lessonId: c1Unit6Lesson4.id, word: 'die Einstellung', translationEn: 'the attitude', translationTr: 'tutum', exampleSentence: 'Seine Einstellung zeigt sich in der Wortwahl.' },
      { lessonId: c1Unit6Lesson4.id, word: 'pragmatisch', translationEn: 'pragmatic', translationTr: 'pragmatik', exampleSentence: 'Modalpartikeln haben eine pragmatische Funktion.' },
    ],
  })

  // --- C1 Unit 7: Idiomatische Wendungen & Redewendungen (4 lessons) ---
  const c1Unit7 = await prisma.unit.create({
    data: { levelId: c1.id, order: 7, titleDe: 'Idiomatische Wendungen & Redewendungen', titleEn: 'Idiomatic Expressions & Sayings', titleTr: 'Deyimler ve Kalıp İfadeler' },
  })
  const c1Unit7Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit7.id,
      order: 1,
      grammarTopic: 'Redewendungen mit Körperteilen',
      explanationDe:
        'Viele Redewendungen nutzen Körperteile bildlich: "die Nase voll haben" (genervt sein), "jemandem die Daumen drücken" (jemandem Glück wünschen).',
      explanationEn:
        'Many idioms use body parts figuratively: "die Nase voll haben" (to have had enough — literally "to have a full nose"), "jemandem die Daumen drücken" (to wish someone luck — literally "to press one\'s thumbs").',
      explanationTr:
        'Birçok deyim vücut parçalarını mecazi olarak kullanır: "die Nase voll haben" (bıkmak), "jemandem die Daumen drücken" (birine şans dilemek).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit7Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was bedeutet "die Nase voll haben"?', options: ['glücklich sein', 'genervt sein', 'krank sein', 'hungrig sein'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Die Nase voll haben" bedeutet, genervt/frustriert zu sein.',
      },
      {
        lessonId: c1Unit7Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man 'to wish someone luck' idiomatisch mit 'Daumen'?" },
        correctAnswer: { accepted: ['jemandem die daumen drücken', 'die daumen drücken'] },
        explanation: '"Jemandem die Daumen drücken" bedeutet "jemandem Glück wünschen".',
      },
    ],
  })

  const c1Unit7Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit7.id,
      order: 2,
      grammarTopic: 'Redewendungen mit Tieren',
      explanationDe:
        '"Die Katze im Sack kaufen" bedeutet, etwas ungeprüft zu kaufen. "Einen Bärenhunger haben" bedeutet, sehr hungrig zu sein.',
      explanationEn:
        '"Die Katze im Sack kaufen" (to buy a cat in a sack) means to buy something without checking it first. "Einen Bärenhunger haben" (to have a bear\'s hunger) means to be very hungry.',
      explanationTr:
        '"Die Katze im Sack kaufen" (çuvaldaki kediyi almak) kontrol etmeden bir şey satın almak demektir. "Einen Bärenhunger haben" çok aç olmak demektir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit7Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was bedeutet "die Katze im Sack kaufen"?', options: ['ein Haustier kaufen', 'etwas ungeprüft kaufen', 'sparsam sein', 'sich verstecken'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Es bedeutet, etwas zu kaufen, ohne es vorher zu prüfen.',
      },
      {
        lessonId: c1Unit7Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich habe einen ___ (Bär + Hunger, sehr hungrig sein).' },
        correctAnswer: { accepted: ['bärenhunger'] },
        explanation: '"Einen Bärenhunger haben" bedeutet, sehr hungrig zu sein.',
      },
    ],
  })

  const c1Unit7Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit7.id,
      order: 3,
      grammarTopic: 'Feste Wendungen im Geschäftsleben',
      explanationDe:
        '"Etwas auf die lange Bank schieben" bedeutet, etwas zu verzögern. "Den Nagel auf den Kopf treffen" bedeutet, genau richtig zu urteilen.',
      explanationEn:
        '"Etwas auf die lange Bank schieben" (to push something onto the long bench) means to postpone something. "Den Nagel auf den Kopf treffen" (to hit the nail on the head) means to judge something exactly right.',
      explanationTr:
        '"Etwas auf die lange Bank schieben" bir şeyi ertelemek demektir. "Den Nagel auf den Kopf treffen" tam isabetli bir yargıda bulunmak demektir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit7Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was bedeutet "etwas auf die lange Bank schieben"?', options: ['etwas verzögern', 'etwas sofort erledigen', 'etwas vergessen', 'etwas verkaufen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Es bedeutet, eine Entscheidung oder Aufgabe zu verzögern.',
      },
      {
        lessonId: c1Unit7Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Idiom für 'genau richtig urteilen', wörtlich mit 'Nagel' und 'Kopf'?" },
        correctAnswer: { accepted: ['den nagel auf den kopf treffen'] },
        explanation: '"Den Nagel auf den Kopf treffen" bedeutet, genau richtig zu urteilen.',
      },
    ],
  })

  const c1Unit7Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit7.id,
      order: 4,
      grammarTopic: 'Übung: Idiomatische Wendungen',
      explanationDe:
        'Wiederholung: Redewendungen sind fest und dürfen nicht wörtlich übersetzt werden. Der Kontext hilft oft, die Bedeutung zu erschließen.',
      explanationEn:
        'Review: idioms are fixed expressions and shouldn\'t be translated literally. Context often helps you infer their meaning.',
      explanationTr:
        'Tekrar: Deyimler sabit ifadelerdir ve kelimesi kelimesine çevrilmemelidir. Bağlam genellikle anlamı çıkarmaya yardımcı olur.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit7Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: {
          lefts: ['die Nase voll haben', 'die Katze im Sack kaufen', 'den Nagel auf den Kopf treffen'],
          rights: ['genau richtig urteilen', 'genervt sein', 'ungeprüft kaufen'],
        },
        correctAnswer: {
          pairs: [
            { left: 'die Nase voll haben', right: 'genervt sein' },
            { left: 'die Katze im Sack kaufen', right: 'ungeprüft kaufen' },
            { left: 'den Nagel auf den Kopf treffen', right: 'genau richtig urteilen' },
          ],
        },
        explanation: 'Idiome und ihre wörtlichen Bedeutungen.',
      },
      {
        lessonId: c1Unit7Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Sollte man Redewendungen wörtlich übersetzen?" },
        correctAnswer: { accepted: ['nein'] },
        explanation: 'Redewendungen haben eine übertragene Bedeutung und sollten nicht wörtlich übersetzt werden.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit7Lesson1.id, word: 'die Nase', translationEn: 'the nose', translationTr: 'burun', exampleSentence: 'Ich habe die Nase voll.' },
      { lessonId: c1Unit7Lesson1.id, word: 'der Daumen', translationEn: 'the thumb', translationTr: 'başparmak', exampleSentence: 'Ich drücke dir die Daumen.' },
      { lessonId: c1Unit7Lesson2.id, word: 'der Sack', translationEn: 'the sack / bag', translationTr: 'çuval', exampleSentence: 'Kauf nicht die Katze im Sack.' },
      { lessonId: c1Unit7Lesson2.id, word: 'der Bärenhunger', translationEn: 'ravenous hunger', translationTr: 'kurt gibi açlık', exampleSentence: 'Ich habe einen Bärenhunger.' },
      { lessonId: c1Unit7Lesson3.id, word: 'die Bank', translationEn: 'the bench', translationTr: 'bank', exampleSentence: 'Er schiebt alles auf die lange Bank.' },
      { lessonId: c1Unit7Lesson3.id, word: 'der Nagel', translationEn: 'the nail', translationTr: 'çivi', exampleSentence: 'Du hast den Nagel auf den Kopf getroffen.' },
      { lessonId: c1Unit7Lesson4.id, word: 'übertragen', translationEn: 'figurative / transferred (meaning)', translationTr: 'mecazi', exampleSentence: 'Das Idiom hat eine übertragene Bedeutung.' },
      { lessonId: c1Unit7Lesson4.id, word: 'erschließen', translationEn: 'to infer / deduce', translationTr: 'çıkarım yapmak', exampleSentence: 'Man kann die Bedeutung aus dem Kontext erschließen.' },
    ],
  })

  // --- C1 Unit 8: Textkohärenz & Konnektoren (4 lessons) ---
  const c1Unit8 = await prisma.unit.create({
    data: { levelId: c1.id, order: 8, titleDe: 'Textkohärenz & Konnektoren', titleEn: 'Text Coherence & Connectors', titleTr: 'Metin Bütünlüğü ve Bağlaçlar' },
  })
  const c1Unit8Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit8.id,
      order: 1,
      grammarTopic: 'Anaphorische Verweise',
      explanationDe:
        'Anaphern verweisen auf bereits Genanntes und vermeiden Wiederholungen: Pronomen ("dieser", "jener"), Synonyme oder Oberbegriffe ("das Tier" für "der Hund").',
      explanationEn:
        'Anaphoric references point back to something already mentioned, avoiding repetition: pronouns ("dieser", "jener"), synonyms, or hypernyms ("das Tier" for "der Hund" — "the animal" for "the dog").',
      explanationTr:
        'Anaforlar daha önce belirtilen bir şeye işaret eder ve tekrarı önler: zamirler ("dieser", "jener"), eşanlamlılar veya üst kavramlar ("das Tier", "der Hund" yerine).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit8Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: '"Der Hund bellte laut. ___ Tier war aufgeregt." Welches Wort passt als Anapher?',
          options: ['Das', 'Diese', 'Jene', 'Ein'],
        },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Das Tier" ist ein Oberbegriff, der auf "der Hund" zurückverweist.',
      },
      {
        lessonId: c1Unit8Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie nennt man einen Rückverweis auf bereits Genanntes im Text?" },
        correctAnswer: { accepted: ['anapher', 'anaphorischer verweis'] },
        explanation: 'Das nennt man eine Anapher.',
      },
    ],
  })

  const c1Unit8Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit8.id,
      order: 2,
      grammarTopic: 'Konnektoren für Textstruktur',
      explanationDe:
        'Strukturierende Konnektoren gliedern Texte: "zunächst", "im Folgenden", "abschließend" markieren Anfang, Mitte und Ende einer Argumentation.',
      explanationEn:
        'Structuring connectors organize texts: "zunächst" (first), "im Folgenden" (in what follows), "abschließend" (in conclusion) mark the beginning, middle, and end of an argument.',
      explanationTr:
        'Yapılandırıcı bağlaçlar metni düzenler: "zunächst" (önce), "im Folgenden" (aşağıda), "abschließend" (sonuç olarak) bir argümanın başını, ortasını ve sonunu işaretler.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit8Lesson2.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['zunächst', 'im Folgenden', 'abschließend'], rights: ['Ende', 'Anfang', 'Mitte'] },
        correctAnswer: {
          pairs: [
            { left: 'zunächst', right: 'Anfang' },
            { left: 'im Folgenden', right: 'Mitte' },
            { left: 'abschließend', right: 'Ende' },
          ],
        },
        explanation: 'Strukturkonnektoren markieren die Textabschnitte.',
      },
      {
        lessonId: c1Unit8Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ lässt sich sagen, dass die Ergebnisse eindeutig sind. (zusammenfassend)' },
        correctAnswer: { accepted: ['abschließend', 'zusammenfassend'] },
        explanation: '"Abschließend" oder "zusammenfassend" leiten den Schlussteil ein.',
      },
    ],
  })

  const c1Unit8Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit8.id,
      order: 3,
      grammarTopic: 'Kohäsionsmittel: Ellipse und Substitution',
      explanationDe:
        'Ellipsen lassen Wiederholtes weg ("Er kam später, sie [kam] früher."), Substitution ersetzt es durch ein anderes Wort ("Ich nehme den roten Wagen; den blauen [Wagen] nicht.").',
      explanationEn:
        'Ellipsis omits a repeated element ("Er kam später, sie [kam] früher" — He came later, she [came] earlier), substitution replaces it with another word ("Ich nehme den roten Wagen; den blauen [Wagen] nicht" — I\'ll take the red car; not the blue [one]).',
      explanationTr:
        'Eksiltme (ellipse) tekrarlanan bir öğeyi atlar ("Er kam später, sie [kam] früher."), yerine koyma (substitution) onu başka bir kelimeyle değiştirir ("Ich nehme den roten Wagen; den blauen [Wagen] nicht.").',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit8Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was passiert bei einer Ellipse?', options: ['Ein Wort wird ersetzt', 'Ein wiederholtes Element wird weggelassen', 'Ein Satz wird verlängert', 'Ein Pronomen wird hinzugefügt'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Eine Ellipse lässt ein wiederholtes Element aus.',
      },
      {
        lessonId: c1Unit8Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie heißt das Kohäsionsmittel, bei dem ein Wort durch ein anderes ersetzt wird?" },
        correctAnswer: { accepted: ['substitution'] },
        explanation: 'Das nennt man Substitution.',
      },
    ],
  })

  const c1Unit8Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit8.id,
      order: 4,
      grammarTopic: 'Übung: Textkohärenz',
      explanationDe:
        'Wiederholung: Kohärente Texte nutzen Anaphern, Strukturkonnektoren und Kohäsionsmittel, um Sätze logisch und flüssig zu verbinden.',
      explanationEn:
        'Review: coherent texts use anaphora, structuring connectors, and cohesive devices to link sentences logically and smoothly.',
      explanationTr:
        'Tekrar: Tutarlı metinler cümleleri mantıklı ve akıcı bağlamak için anafor, yapı bağlaçları ve bağdaşıklık araçları kullanır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit8Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['eindeutig', 'sind', 'die', 'Ergebnisse'] },
        correctAnswer: { order: ['die', 'Ergebnisse', 'sind', 'eindeutig'] },
        explanation: 'Standard-Wortstellung: Subjekt, Verb, Prädikativ.',
      },
      {
        lessonId: c1Unit8Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Mittel vermeidet Wortwiederholung durch einen Oberbegriff?', options: ['Ellipse', 'Anapher', 'Substitution', 'Konjunktiv'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Eine Anapher kann über einen Oberbegriff auf Vorheriges verweisen.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit8Lesson1.id, word: 'aufgeregt', translationEn: 'excited / agitated', translationTr: 'heyecanlı', exampleSentence: 'Das Tier war aufgeregt.' },
      { lessonId: c1Unit8Lesson1.id, word: 'der Oberbegriff', translationEn: 'the hypernym / umbrella term', translationTr: 'üst kavram', exampleSentence: '"Das Tier" ist ein Oberbegriff für "der Hund".' },
      { lessonId: c1Unit8Lesson2.id, word: 'zunächst', translationEn: 'first / initially', translationTr: 'önce', exampleSentence: 'Zunächst betrachten wir die Ausgangslage.' },
      { lessonId: c1Unit8Lesson2.id, word: 'eindeutig', translationEn: 'unambiguous / clear', translationTr: 'net', exampleSentence: 'Die Ergebnisse sind eindeutig.' },
      { lessonId: c1Unit8Lesson3.id, word: 'weglassen', translationEn: 'to omit', translationTr: 'atlamak', exampleSentence: 'Man kann das wiederholte Wort weglassen.' },
      { lessonId: c1Unit8Lesson3.id, word: 'ersetzen', translationEn: 'to replace', translationTr: 'değiştirmek', exampleSentence: 'Man kann das Wort durch ein anderes ersetzen.' },
      { lessonId: c1Unit8Lesson4.id, word: 'kohärent', translationEn: 'coherent', translationTr: 'tutarlı', exampleSentence: 'Der Text ist sehr kohärent.' },
      { lessonId: c1Unit8Lesson4.id, word: 'flüssig', translationEn: 'fluent / smooth', translationTr: 'akıcı', exampleSentence: 'Er spricht sehr flüssig Deutsch.' },
    ],
  })

  // --- C1 Unit 9: Irreale Bedingungssätze (4 lessons) ---
  const c1Unit9 = await prisma.unit.create({
    data: { levelId: c1.id, order: 9, titleDe: 'Irreale Bedingungssätze', titleEn: 'Unreal Conditional Clauses', titleTr: 'Gerçek Dışı Koşul Cümleleri' },
  })
  const c1Unit9Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit9.id,
      order: 1,
      grammarTopic: 'Konjunktiv II der Vergangenheit in wenn-Sätzen',
      explanationDe:
        'Irreale Bedingungen in der Vergangenheit nutzen Konjunktiv II der Vergangenheit (hätte/wäre + Partizip II): "Wenn ich das gewusst hätte, wäre ich nicht gekommen."',
      explanationEn:
        'Unreal past conditions use the past Konjunktiv II (hätte/wäre + past participle): "Wenn ich das gewusst hätte, wäre ich nicht gekommen" (If I had known that, I wouldn\'t have come).',
      explanationTr:
        'Geçmişteki gerçek dışı koşullar geçmiş Konjunktiv II ile kurulur (hätte/wäre + Partizip II): "Wenn ich das gewusst hätte, wäre ich nicht gekommen."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit9Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Wenn ich das gewusst ___, wäre ich nicht gekommen.', options: ['habe', 'hätte', 'hatte', 'würde'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Konjunktiv II der Vergangenheit: "hätte gewusst".',
      },
      {
        lessonId: c1Unit9Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Wenn er früher losgefahren ___, hätte er den Zug erreicht. (sein-Konjunktiv-II)' },
        correctAnswer: { accepted: ['wäre'] },
        explanation: '"Losfahren" bildet das Perfekt mit "sein", also Konjunktiv II mit "wäre".',
      },
    ],
  })

  const c1Unit9Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit9.id,
      order: 2,
      grammarTopic: 'Uneingeleitete Bedingungssätze',
      explanationDe:
        'Ohne "wenn" beginnt der Bedingungssatz mit dem Verb: "Wäre er hier, würde er helfen." (= "Wenn er hier wäre, würde er helfen.")',
      explanationEn:
        'Without "wenn", the conditional clause starts with the verb: "Wäre er hier, würde er helfen" (Were he here, he would help — = "Wenn er hier wäre, würde er helfen").',
      explanationTr:
        '"Wenn" olmadan koşul cümlesi fiille başlar: "Wäre er hier, würde er helfen." (= "Wenn er hier wäre, würde er helfen.")',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit9Lesson2.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['besser,', 'Wetter', 'wäre', 'das', 'käme', 'ich'] },
        correctAnswer: { order: ['wäre', 'das', 'Wetter', 'besser,', 'käme', 'ich'] },
        explanation: 'Bei uneingeleiteten Bedingungssätzen beginnt das Verb den Satz: "Wäre das Wetter besser, käme ich."',
      },
      {
        lessonId: c1Unit9Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Forme uneingeleitet um: 'Wenn ich Zeit hätte, würde ich kommen.' -> '___ ich Zeit, würde ich kommen.'" },
        correctAnswer: { accepted: ['hätte'] },
        explanation: 'Uneingeleitet beginnt der Satz mit dem Verb: "Hätte ich Zeit, ...".',
      },
    ],
  })

  const c1Unit9Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit9.id,
      order: 3,
      grammarTopic: 'Irreale Wunschsätze',
      explanationDe:
        'Irreale Wünsche mit "wenn nur" oder "hätte ich nur" drücken Bedauern aus: "Wenn ich nur mehr Zeit hätte!" "Hätte ich das nur gewusst!"',
      explanationEn:
        'Unreal wishes with "wenn nur" or "hätte ich nur" express regret: "Wenn ich nur mehr Zeit hätte!" (If only I had more time!) "Hätte ich das nur gewusst!" (If only I had known that!)',
      explanationTr:
        '"Wenn nur" veya "hätte ich nur" ile kurulan gerçek dışı dilekler pişmanlık ifade eder: "Wenn ich nur mehr Zeit hätte!" "Hätte ich das nur gewusst!"',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit9Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welcher Satz drückt Bedauern über die Vergangenheit aus?', options: ['Wenn ich Zeit habe, komme ich.', 'Hätte ich das nur gewusst!', 'Ich weiß das.', 'Ich komme morgen.'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Hätte ich das nur gewusst!" ist ein irrealer Wunsch über die Vergangenheit.',
      },
      {
        lessonId: c1Unit9Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Wenn ich nur mehr Zeit ___! (haben-Konjunktiv-II, Wunsch)' },
        correctAnswer: { accepted: ['hätte'] },
        explanation: 'Irrealer Wunsch: "hätte" (Konjunktiv II von "haben").',
      },
    ],
  })

  const c1Unit9Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit9.id,
      order: 4,
      grammarTopic: 'Übung: Irreale Bedingungssätze',
      explanationDe:
        'Wiederholung: Irreale Bedingungssätze der Vergangenheit beschreiben Situationen, die nicht eingetreten sind, oft mit Bedauern oder Spekulation verbunden.',
      explanationEn:
        'Review: unreal past conditionals describe situations that didn\'t happen, often connected to regret or speculation.',
      explanationTr:
        'Tekrar: Geçmişe yönelik gerçek dışı koşul cümleleri gerçekleşmemiş durumları anlatır, genellikle pişmanlık veya tahminle bağlantılıdır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit9Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['wissen (haben)', 'losfahren (sein)', 'helfen (haben)'], rights: ['hätte geholfen', 'hätte gewusst', 'wäre losgefahren'] },
        correctAnswer: {
          pairs: [
            { left: 'wissen (haben)', right: 'hätte gewusst' },
            { left: 'losfahren (sein)', right: 'wäre losgefahren' },
            { left: 'helfen (haben)', right: 'hätte geholfen' },
          ],
        },
        explanation: 'Konjunktiv II der Vergangenheit richtet sich nach dem Perfekt-Hilfsverb.',
      },
      {
        lessonId: c1Unit9Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'If I had known that, I wouldn't have come'?" },
        correctAnswer: { accepted: ['wenn ich das gewusst hätte, wäre ich nicht gekommen'] },
        explanation: '"Wenn ich das gewusst hätte, wäre ich nicht gekommen."',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit9Lesson1.id, word: 'erreichen', translationEn: 'to reach / catch (e.g. a train)', translationTr: 'yetişmek', exampleSentence: 'Er hätte den Zug erreicht.' },
      { lessonId: c1Unit9Lesson1.id, word: 'losfahren', translationEn: 'to set off / depart', translationTr: 'yola çıkmak', exampleSentence: 'Wir sind früh losgefahren.' },
      { lessonId: c1Unit9Lesson2.id, word: 'uneingeleitet', translationEn: 'not introduced (by a conjunction)', translationTr: 'bağlaçsız başlayan', exampleSentence: 'Uneingeleitete Sätze beginnen mit dem Verb.' },
      { lessonId: c1Unit9Lesson2.id, word: 'die Bedingung', translationEn: 'the condition', translationTr: 'koşul', exampleSentence: 'Das ist eine wichtige Bedingung.' },
      { lessonId: c1Unit9Lesson3.id, word: 'das Bedauern', translationEn: 'the regret', translationTr: 'pişmanlık', exampleSentence: 'In seiner Stimme lag Bedauern.' },
      { lessonId: c1Unit9Lesson3.id, word: 'der Wunsch', translationEn: 'the wish', translationTr: 'dilek', exampleSentence: 'Das war nur ein Wunsch.' },
      { lessonId: c1Unit9Lesson4.id, word: 'die Spekulation', translationEn: 'the speculation', translationTr: 'spekülasyon', exampleSentence: 'Das ist reine Spekulation.' },
      { lessonId: c1Unit9Lesson4.id, word: 'eintreten', translationEn: 'to occur / come about', translationTr: 'gerçekleşmek', exampleSentence: 'Diese Situation ist nicht eingetreten.' },
    ],
  })

  // --- C1 Unit 10: Feste Präpositionalphrasen (4 lessons) ---
  const c1Unit10 = await prisma.unit.create({
    data: { levelId: c1.id, order: 10, titleDe: 'Feste Präpositionalphrasen', titleEn: 'Fixed Prepositional Phrases', titleTr: 'Sabit Edat Öbekleri' },
  })
  const c1Unit10Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit10.id,
      order: 1,
      grammarTopic: 'Verben mit "auf" und "über"',
      explanationDe:
        'Viele Verben verlangen feste Präpositionen: "sich freuen auf" (Zukünftiges), "sich freuen über" (Geschehenes), "sich ärgern über".',
      explanationEn:
        'Many verbs require fixed prepositions: "sich freuen auf" (to look forward to something future), "sich freuen über" (to be happy about something that happened), "sich ärgern über" (to be annoyed about).',
      explanationTr:
        'Birçok fiil sabit edat gerektirir: "sich freuen auf" (gelecekle ilgili), "sich freuen über" (olmuş bir şeyle ilgili), "sich ärgern über".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit10Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich freue mich ___ den Urlaub nächste Woche. (Zukunft)', options: ['über', 'auf', 'für', 'an'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Sich freuen auf" bezieht sich auf zukünftige Ereignisse.',
      },
      {
        lessonId: c1Unit10Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er ärgert sich ___ den Fehler. (Präposition)' },
        correctAnswer: { accepted: ['über'] },
        explanation: '"Sich ärgern über" verlangt die Präposition "über".',
      },
    ],
  })

  const c1Unit10Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit10.id,
      order: 2,
      grammarTopic: 'Verben mit "an" und "nach"',
      explanationDe:
        '"Denken an" (Akkusativ) bedeutet, an jemanden/etwas zu denken. "Sich sehnen nach" (Dativ) drückt Sehnsucht aus.',
      explanationEn:
        '"Denken an" (+ accusative) means to think about someone/something. "Sich sehnen nach" (+ dative) expresses longing for something.',
      explanationTr:
        '"Denken an" (-i hali) birini/bir şeyi düşünmek demektir. "Sich sehnen nach" (-e hali) özlem ifade eder.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit10Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Ich denke oft ___ dich.', options: ['an', 'nach', 'über', 'für'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Denken an" + Akkusativ.',
      },
      {
        lessonId: c1Unit10Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welche Präposition folgt auf 'sich sehnen'?" },
        correctAnswer: { accepted: ['nach'] },
        explanation: '"Sich sehnen nach" + Dativ.',
      },
    ],
  })

  const c1Unit10Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit10.id,
      order: 3,
      grammarTopic: 'Pronominaladverbien: da(r)- und wo(r)-',
      explanationDe:
        'Bei Sachen (nicht Personen) bildet man Pronominaladverbien: "sich freuen auf" -> "sich darauf freuen"; Frage: "Worauf freust du dich?"',
      explanationEn:
        'For things (not people), pronominal adverbs are formed: "sich freuen auf" -> "sich darauf freuen" (to look forward to it); question: "Worauf freust du dich?" (What are you looking forward to?)',
      explanationTr:
        'Nesneler için (kişiler değil) zamirsi zarflar kullanılır: "sich freuen auf" -> "sich darauf freuen"; soru: "Worauf freust du dich?"',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit10Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Frage nach einer Sache mit "sich freuen auf": ___ freust du dich?', options: ['Wen', 'Wer', 'Worauf', 'Wovon'] },
        correctAnswer: { correctIndex: 2 },
        explanation: '"Worauf" fragt nach einer Sache mit der Präposition "auf".',
      },
      {
        lessonId: c1Unit10Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich freue mich ___ (Pronominaladverb für "auf" + Sache).' },
        correctAnswer: { accepted: ['darauf'] },
        explanation: '"Darauf" ist das Pronominaladverb für "auf" + Sache.',
      },
    ],
  })

  const c1Unit10Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit10.id,
      order: 4,
      grammarTopic: 'Übung: Feste Präpositionalphrasen',
      explanationDe:
        'Wiederholung: Feste Verb-Präposition-Kombinationen müssen mit dem jeweiligen Verb zusammen gelernt werden, da sie nicht logisch ableitbar sind.',
      explanationEn:
        'Review: fixed verb-preposition combinations must be learned together with the verb, since they can\'t always be logically deduced.',
      explanationTr:
        'Tekrar: Sabit fiil-edat kombinasyonları mantıksal olarak çıkarılamayabileceğinden fiille birlikte ezberlenmelidir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit10Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['sich freuen auf', 'sich ärgern über', 'sich sehnen nach'], rights: ['Sehnsucht', 'Zukünftiges', 'Geschehenes'] },
        correctAnswer: {
          pairs: [
            { left: 'sich freuen auf', right: 'Zukünftiges' },
            { left: 'sich ärgern über', right: 'Geschehenes' },
            { left: 'sich sehnen nach', right: 'Sehnsucht' },
          ],
        },
        explanation: 'Feste Präpositionen je nach Verbbedeutung.',
      },
      {
        lessonId: c1Unit10Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie sagt man auf Deutsch: 'I'm thinking of you' (denken + Präposition)?" },
        correctAnswer: { accepted: ['ich denke an dich'] },
        explanation: '"Ich denke an dich." — "denken an" + Akkusativ.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit10Lesson1.id, word: 'sich ärgern', translationEn: 'to be annoyed', translationTr: 'sinirlenmek', exampleSentence: 'Er ärgert sich über den Fehler.' },
      { lessonId: c1Unit10Lesson1.id, word: 'der Urlaub', translationEn: 'the vacation', translationTr: 'tatil', exampleSentence: 'Ich freue mich auf den Urlaub.' },
      { lessonId: c1Unit10Lesson2.id, word: 'sich sehnen', translationEn: 'to long for', translationTr: 'özlemek', exampleSentence: 'Ich sehne mich nach der Heimat.' },
      { lessonId: c1Unit10Lesson2.id, word: 'die Heimat', translationEn: 'the homeland', translationTr: 'memleket', exampleSentence: 'Er sehnt sich nach seiner Heimat.' },
      { lessonId: c1Unit10Lesson3.id, word: 'das Pronominaladverb', translationEn: 'the pronominal adverb', translationTr: 'zamirsi zarf', exampleSentence: '"Darauf" ist ein Pronominaladverb.' },
      { lessonId: c1Unit10Lesson3.id, word: 'ableiten', translationEn: 'to derive / deduce', translationTr: 'türetmek', exampleSentence: 'Man kann die Bedeutung nicht immer ableiten.' },
      { lessonId: c1Unit10Lesson4.id, word: 'die Kombination', translationEn: 'the combination', translationTr: 'kombinasyon', exampleSentence: 'Diese Kombination muss man auswendig lernen.' },
      { lessonId: c1Unit10Lesson4.id, word: 'auswendig', translationEn: 'by heart', translationTr: 'ezbere', exampleSentence: 'Ich lerne die Verben auswendig.' },
    ],
  })

  // --- C1 Unit 11: Stilmittel - Ironie & Understatement (4 lessons) ---
  const c1Unit11 = await prisma.unit.create({
    data: { levelId: c1.id, order: 11, titleDe: 'Stilmittel: Ironie & Understatement', titleEn: 'Stylistic Devices: Irony & Understatement', titleTr: 'Üslup Araçları: İroni ve Az Söyleme' },
  })
  const c1Unit11Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit11.id,
      order: 1,
      grammarTopic: 'Ironie erkennen',
      explanationDe:
        'Ironie sagt das Gegenteil dessen, was gemeint ist, oft mit besonderem Tonfall: "Toller Regen heute!" (bei schlechtem Wetter, eigentlich negativ gemeint).',
      explanationEn:
        'Irony says the opposite of what\'s meant, often with a particular tone: "Toller Regen heute!" (Great rain today! — said sarcastically about bad weather, actually meant negatively).',
      explanationTr:
        'İroni, kastedilenin tersini söyler, genellikle özel bir tonlamayla: "Toller Regen heute!" (kötü hava için söylenir, aslında olumsuz anlamdadır).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit11Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '"Toller Regen heute!" bei strömendem Regen gesagt — was ist das?', options: ['ein Kompliment', 'Ironie', 'eine Frage', 'eine Bitte'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Das Gegenteil des Gemeinten wird ausgedrückt — das ist Ironie.',
      },
      {
        lessonId: c1Unit11Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie nennt man es, wenn man das Gegenteil dessen sagt, was man meint?" },
        correctAnswer: { accepted: ['ironie'] },
        explanation: 'Das nennt man Ironie.',
      },
    ],
  })

  const c1Unit11Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit11.id,
      order: 2,
      grammarTopic: 'Understatement (Untertreibung)',
      explanationDe:
        'Understatement untertreibt bewusst: "Das war nicht schlecht" (für etwas sehr Gutes) oder "ein kleines Problem" (für eine Katastrophe).',
      explanationEn:
        'Understatement deliberately downplays something: "Das war nicht schlecht" (That wasn\'t bad — for something very good) or "ein kleines Problem" (a small problem — for a disaster).',
      explanationTr:
        'Az söyleme (understatement) bilinçli olarak küçümser: "Das war nicht schlecht" (çok iyi bir şey için) veya "ein kleines Problem" (bir felaket için).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit11Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was ist ein Understatement?', options: ['Übertreibung', 'bewusste Untertreibung', 'ein Vergleich', 'eine Metapher'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Understatement ist eine bewusste Untertreibung.',
      },
      {
        lessonId: c1Unit11Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '"Das war nicht ___" (Untertreibung für "sehr gut").' },
        correctAnswer: { accepted: ['schlecht'] },
        explanation: '"Das war nicht schlecht" ist ein typisches Understatement.',
      },
    ],
  })

  const c1Unit11Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit11.id,
      order: 3,
      grammarTopic: 'Rhetorische Fragen',
      explanationDe:
        'Rhetorische Fragen erwarten keine Antwort, sondern betonen eine Aussage: "Ist das nicht offensichtlich?" (= Das ist offensichtlich.)',
      explanationEn:
        'Rhetorical questions don\'t expect an answer; they emphasize a statement: "Ist das nicht offensichtlich?" (Isn\'t that obvious? — = That is obvious.)',
      explanationTr:
        'Retorik sorular cevap beklemez, bir ifadeyi vurgular: "Ist das nicht offensichtlich?" (= Bu bariz.)',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit11Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was ist der Zweck einer rhetorischen Frage?', options: ['eine Antwort zu erhalten', 'eine Aussage zu betonen', 'um Erlaubnis zu bitten', 'sich zu entschuldigen'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Rhetorische Fragen betonen eine Aussage, ohne eine Antwort zu erwarten.',
      },
      {
        lessonId: c1Unit11Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Erwartet eine rhetorische Frage eine Antwort? (ja/nein)" },
        correctAnswer: { accepted: ['nein'] },
        explanation: 'Nein, eine rhetorische Frage erwartet keine Antwort.',
      },
    ],
  })

  const c1Unit11Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit11.id,
      order: 4,
      grammarTopic: 'Übung: Ironie & Understatement',
      explanationDe:
        'Wiederholung: Ironie, Understatement und rhetorische Fragen sind stilistische Mittel, die Bedeutung indirekt und oft mit Humor vermitteln.',
      explanationEn:
        'Review: irony, understatement, and rhetorical questions are stylistic devices that convey meaning indirectly, often with humor.',
      explanationTr:
        'Tekrar: İroni, az söyleme ve retorik sorular anlamı dolaylı ve çoğunlukla mizahi biçimde ileten üslup araçlarıdır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit11Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['"Toller Regen!" bei Sturm', '"Ein kleines Problem" bei Katastrophe', '"Ist das nicht klar?"'], rights: ['rhetorische Frage', 'Ironie', 'Understatement'] },
        correctAnswer: {
          pairs: [
            { left: '"Toller Regen!" bei Sturm', right: 'Ironie' },
            { left: '"Ein kleines Problem" bei Katastrophe', right: 'Understatement' },
            { left: '"Ist das nicht klar?"', right: 'rhetorische Frage' },
          ],
        },
        explanation: 'Jedes Stilmittel hat eine eigene indirekte Wirkung.',
      },
      {
        lessonId: c1Unit11Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne ein Stilmittel, das das Gegenteil des Gemeinten ausdrückt." },
        correctAnswer: { accepted: ['ironie'] },
        explanation: 'Ironie drückt das Gegenteil des Gemeinten aus.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit11Lesson1.id, word: 'der Tonfall', translationEn: 'the tone of voice', translationTr: 'ses tonu', exampleSentence: 'Der Tonfall zeigt, dass es ironisch gemeint ist.' },
      { lessonId: c1Unit11Lesson1.id, word: 'strömend', translationEn: 'pouring (rain)', translationTr: 'bardaktan boşanırcasına', exampleSentence: 'Es regnet strömend.' },
      { lessonId: c1Unit11Lesson2.id, word: 'untertreiben', translationEn: 'to understate', translationTr: 'küçümsemek', exampleSentence: 'Er untertreibt gern seine Erfolge.' },
      { lessonId: c1Unit11Lesson2.id, word: 'die Katastrophe', translationEn: 'the catastrophe', translationTr: 'felaket', exampleSentence: 'Das war eine echte Katastrophe.' },
      { lessonId: c1Unit11Lesson3.id, word: 'die Erlaubnis', translationEn: 'the permission', translationTr: 'izin', exampleSentence: 'Er bittet um Erlaubnis.' },
      { lessonId: c1Unit11Lesson3.id, word: 'betonen', translationEn: 'to emphasize', translationTr: 'vurgulamak', exampleSentence: 'Sie betont ihre Meinung.' },
      { lessonId: c1Unit11Lesson4.id, word: 'der Humor', translationEn: 'the humor', translationTr: 'mizah', exampleSentence: 'Der Text hat viel Humor.' },
      { lessonId: c1Unit11Lesson4.id, word: 'indirekt', translationEn: 'indirect', translationTr: 'dolaylı', exampleSentence: 'Er drückt sich oft indirekt aus.' },
    ],
  })

  // --- C1 Unit 12: Fachsprache & Register (4 lessons) ---
  const c1Unit12 = await prisma.unit.create({
    data: { levelId: c1.id, order: 12, titleDe: 'Fachsprache & Register', titleEn: 'Technical Language & Register', titleTr: 'Uzmanlık Dili ve Dil Düzeyi' },
  })
  const c1Unit12Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit12.id,
      order: 1,
      grammarTopic: 'Register erkennen: formell vs. informell',
      explanationDe:
        'Register beschreibt die Sprachebene: formell ("Ich bitte um Ihre Rückmeldung") vs. informell ("Meld dich mal!"). Wortwahl, Satzbau und Anrede unterscheiden sich.',
      explanationEn:
        'Register describes the level of formality: formal ("Ich bitte um Ihre Rückmeldung" — I kindly request your response) vs. informal ("Meld dich mal!" — Get in touch!). Word choice, sentence structure, and address forms differ.',
      explanationTr:
        'Dil düzeyi (register), resmiyet seviyesini tanımlar: resmi ("Ich bitte um Ihre Rückmeldung") ile gayriresmi ("Meld dich mal!"). Kelime seçimi, cümle yapısı ve hitap farklılık gösterir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit12Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welcher Satz ist formell?', options: ['Meld dich mal!', 'Ich bitte um Ihre Rückmeldung.', 'Schreib mir!', 'Ruf mich an!'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Ich bitte um Ihre Rückmeldung" ist formell (Sie-Form, höfliche Bitte).',
      },
      {
        lessonId: c1Unit12Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welches Pronomen ist typisch für formelle Anrede im Deutschen?" },
        correctAnswer: { accepted: ['sie', 'sie-form'] },
        explanation: 'Die formelle Anrede nutzt "Sie".',
      },
    ],
  })

  const c1Unit12Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit12.id,
      order: 2,
      grammarTopic: 'Fachsprache der Wissenschaft',
      explanationDe:
        'Wissenschaftliche Fachsprache nutzt Nominalstil, Passiv und Fachbegriffe: "Die Hypothese wurde anhand empirischer Daten überprüft."',
      explanationEn:
        'Academic technical language uses nominal style, passive voice, and technical terms: "Die Hypothese wurde anhand empirischer Daten überprüft" (The hypothesis was tested using empirical data).',
      explanationTr:
        'Bilimsel uzmanlık dili isim stili, edilgen çatı ve teknik terimler kullanır: "Die Hypothese wurde anhand empirischer Daten überprüft."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit12Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Merkmal ist typisch für wissenschaftliche Fachsprache?', options: ['Umgangssprache', 'Passiv und Nominalstil', 'viele Modalpartikeln', 'kurze Ausrufe'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Wissenschaftliche Texte nutzen häufig Passiv und Nominalstil.',
      },
      {
        lessonId: c1Unit12Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Hypothese ___ anhand empirischer Daten überprüft. (Passiv Präteritum von "werden")' },
        correctAnswer: { accepted: ['wurde'] },
        explanation: 'Präteritum Passiv: "wurde überprüft".',
      },
    ],
  })

  const c1Unit12Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit12.id,
      order: 3,
      grammarTopic: 'Register wechseln',
      explanationDe:
        'Guter Sprachgebrauch passt das Register an die Situation an: eine E-Mail an den Chef ist formell, eine Nachricht an Freunde informell.',
      explanationEn:
        'Good language use adapts register to the situation: an email to your boss is formal, a message to friends is informal.',
      explanationTr:
        'İyi bir dil kullanımı, dil düzeyini duruma göre ayarlar: patrona e-posta resmi, arkadaşlara mesaj gayriresmidir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit12Lesson3.id,
        order: 1,
        type: 'SHORT_ANSWER',
        data: { prompt: "Forme informell um: 'Ich bitte um Ihre Rückmeldung.' -> '___!' (informell, kurz)" },
        correctAnswer: { accepted: ['meld dich', 'meld dich mal'] },
        explanation: 'Informelle Variante: "Meld dich!" oder "Meld dich mal!"',
      },
      {
        lessonId: c1Unit12Lesson3.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'In welcher Situation ist informelles Register passend?', options: ['Bewerbungsschreiben', 'Nachricht an einen Freund', 'wissenschaftlicher Artikel', 'Behördenbrief'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Eine Nachricht an Freunde erlaubt informelles Register.',
      },
    ],
  })

  const c1Unit12Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit12.id,
      order: 4,
      grammarTopic: 'Übung: Fachsprache & Register',
      explanationDe:
        'Wiederholung: Die Wahl des richtigen Registers zeigt Sprachgefühl und ist entscheidend für angemessene Kommunikation in unterschiedlichen Kontexten.',
      explanationEn:
        'Review: choosing the right register shows language proficiency and is crucial for appropriate communication in different contexts.',
      explanationTr:
        'Tekrar: Doğru dil düzeyini seçmek dil becerisini gösterir ve farklı bağlamlarda uygun iletişim için önemlidir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit12Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['Bewerbungsschreiben', 'Chat mit Freunden', 'wissenschaftlicher Aufsatz'], rights: ['sehr formell/fachsprachlich', 'formell', 'informell'] },
        correctAnswer: {
          pairs: [
            { left: 'Bewerbungsschreiben', right: 'formell' },
            { left: 'Chat mit Freunden', right: 'informell' },
            { left: 'wissenschaftlicher Aufsatz', right: 'sehr formell/fachsprachlich' },
          ],
        },
        explanation: 'Textsorten verlangen unterschiedliche Register.',
      },
      {
        lessonId: c1Unit12Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie nennt man die Anpassung der Sprache an die Situation?" },
        correctAnswer: { accepted: ['register', 'sprachregister'] },
        explanation: 'Das nennt man Register bzw. Sprachregister.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit12Lesson1.id, word: 'die Rückmeldung', translationEn: 'the response / feedback', translationTr: 'geri bildirim', exampleSentence: 'Ich bitte um Ihre Rückmeldung.' },
      { lessonId: c1Unit12Lesson1.id, word: 'die Anrede', translationEn: 'the form of address', translationTr: 'hitap', exampleSentence: 'Die Anrede "Sie" ist formell.' },
      { lessonId: c1Unit12Lesson2.id, word: 'die Hypothese', translationEn: 'the hypothesis', translationTr: 'hipotez', exampleSentence: 'Die Hypothese wurde überprüft.' },
      { lessonId: c1Unit12Lesson2.id, word: 'empirisch', translationEn: 'empirical', translationTr: 'ampirik', exampleSentence: 'Die Daten sind empirisch erhoben.' },
      { lessonId: c1Unit12Lesson3.id, word: 'die Behörde', translationEn: 'the (government) authority', translationTr: 'kurum', exampleSentence: 'Der Brief kommt von einer Behörde.' },
      { lessonId: c1Unit12Lesson3.id, word: 'passend', translationEn: 'suitable / fitting', translationTr: 'uygun', exampleSentence: 'Das ist ein passendes Register.' },
      { lessonId: c1Unit12Lesson4.id, word: 'das Sprachgefühl', translationEn: 'the feel for language', translationTr: 'dil sezgisi', exampleSentence: 'Sie hat ein gutes Sprachgefühl.' },
      { lessonId: c1Unit12Lesson4.id, word: 'angemessen', translationEn: 'appropriate', translationTr: 'uygun (yerinde)', exampleSentence: 'Das war eine angemessene Reaktion.' },
    ],
  })

  // --- C1 Unit 13: Wiederholung - Wissenschaft & Diskussion (4 lessons) ---
  const c1Unit13 = await prisma.unit.create({
    data: { levelId: c1.id, order: 13, titleDe: 'Wiederholung: Wissenschaft & Diskussion', titleEn: 'Review: Science & Discussion', titleTr: 'Tekrar: Bilim ve Tartışma' },
  })
  const c1Unit13Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c1Unit13.id,
      order: 1,
      grammarTopic: 'Wiederholung: Konjunktiv I in Fachtexten',
      explanationDe:
        'In wissenschaftlichen Diskussionen wird oft Konjunktiv I verwendet, um fremde Thesen neutral wiederzugeben: "Der Autor argumentiert, die Studie sei nicht repräsentativ."',
      explanationEn:
        'Academic discussions often use Konjunktiv I to neutrally report others\' theses: "Der Autor argumentiert, die Studie sei nicht repräsentativ" (The author argues the study is not representative).',
      explanationTr:
        'Bilimsel tartışmalarda başkalarının tezlerini tarafsızca aktarmak için genellikle Konjunktiv I kullanılır: "Der Autor argumentiert, die Studie sei nicht repräsentativ."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit13Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Der Autor argumentiert, die Studie ___ nicht repräsentativ.', options: ['ist', 'sei', 'war', 'wäre'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Konjunktiv I für neutrale Wiedergabe: "sei".',
      },
      {
        lessonId: c1Unit13Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welcher Modus wird genutzt, um fremde Thesen neutral wiederzugeben?" },
        correctAnswer: { accepted: ['konjunktiv i', 'konjunktiv 1'] },
        explanation: 'Konjunktiv I wird für neutrale Wiedergabe genutzt.',
      },
    ],
  })

  const c1Unit13Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c1Unit13.id,
      order: 2,
      grammarTopic: 'Wiederholung: Nominalstil in Diskussionsbeiträgen',
      explanationDe:
        'Diskussionsbeiträge nutzen oft Nominalstil für Präzision: "Die Durchführung weiterer Untersuchungen ist notwendig" statt "Man muss weiter untersuchen."',
      explanationEn:
        'Discussion contributions often use nominal style for precision: "Die Durchführung weiterer Untersuchungen ist notwendig" (Conducting further investigations is necessary) instead of "Man muss weiter untersuchen" (One must investigate further).',
      explanationTr:
        'Tartışma katkıları genellikle hassasiyet için isim stili kullanır: "Man muss weiter untersuchen" yerine "Die Durchführung weiterer Untersuchungen ist notwendig".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit13Lesson2.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die ___ weiterer Untersuchungen ist notwendig. (durchführen, Nominalisierung)' },
        correctAnswer: { accepted: ['durchführung'] },
        explanation: '"durchführen" -> "die Durchführung".',
      },
      {
        lessonId: c1Unit13Lesson2.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'Welcher Satz ist im Nominalstil formuliert?',
          options: ['Wir untersuchen das weiter.', 'Die Durchführung weiterer Untersuchungen ist notwendig.', 'Wir müssen das untersuchen.', 'Es wird untersucht.'],
        },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Die Durchführung ... ist notwendig" nutzt ein Nomen statt eines Verbs.',
      },
    ],
  })

  const c1Unit13Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c1Unit13.id,
      order: 3,
      grammarTopic: 'Wiederholung: Komplexe Konnektoren in Argumenten',
      explanationDe:
        'Für eine überzeugende Argumentation kombiniert man Konnektoren: "Zumal die Datenlage unklar ist, sollte man, gleichwohl der Zeitdruck besteht, weitere Studien abwarten."',
      explanationEn:
        'A convincing argument combines connectors: "Zumal die Datenlage unklar ist, sollte man, gleichwohl der Zeitdruck besteht, weitere Studien abwarten" (Especially since the data situation is unclear, one should wait for further studies, even though there is time pressure).',
      explanationTr:
        'İkna edici bir argüman bağlaçları birleştirir: "Zumal die Datenlage unklar ist, sollte man, gleichwohl der Zeitdruck besteht, weitere Studien abwarten."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit13Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welcher Konnektor verstärkt einen Grund (= "vor allem weil")?', options: ['gleichwohl', 'zumal', 'dennoch', 'mithin'] },
        correctAnswer: { correctIndex: 1 },
        explanation: '"Zumal" verstärkt einen Grund.',
      },
      {
        lessonId: c1Unit13Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne einen gehobenen Konnektor für 'trotzdem'." },
        correctAnswer: { accepted: ['gleichwohl', 'nichtsdestotrotz'] },
        explanation: '"Gleichwohl" oder "nichtsdestotrotz" sind gehobene Synonyme für "trotzdem".',
      },
    ],
  })

  const c1Unit13Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c1Unit13.id,
      order: 4,
      grammarTopic: 'Abschlusswiederholung C1',
      explanationDe:
        'Gesamtwiederholung: Konjunktiv I/II, Partizipialattribute, Nominalstil, komplexe Konnektoren und Modalpartikeln bilden zusammen die Grundlage für kompetente wissenschaftliche und formelle Kommunikation auf C1-Niveau.',
      explanationEn:
        'Overall review: Konjunktiv I/II, participial attributes, nominal style, complex connectors, and modal particles together form the foundation for competent academic and formal communication at C1 level.',
      explanationTr:
        'Genel tekrar: Konjunktiv I/II, sıfat-fiil yapıları, isim stili, karmaşık bağlaçlar ve kip belirteçleri, C1 düzeyinde yetkin bilimsel ve resmi iletişimin temelini oluşturur.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c1Unit13Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['sei', 'die', 'Studie', 'repräsentativ', 'nicht'] },
        correctAnswer: { order: ['die', 'Studie', 'sei', 'nicht', 'repräsentativ'] },
        explanation: 'Nebensatzstruktur mit Konjunktiv I: Subjekt, Verb, Negation, Prädikativ.',
      },
      {
        lessonId: c1Unit13Lesson4.id,
        order: 2,
        type: 'MATCHING',
        data: { lefts: ['Konjunktiv I', 'Nominalstil', 'gleichwohl'], rights: ['gehobenes "trotzdem"', 'neutrale Wiedergabe', 'formelle Präzision'] },
        correctAnswer: {
          pairs: [
            { left: 'Konjunktiv I', right: 'neutrale Wiedergabe' },
            { left: 'Nominalstil', right: 'formelle Präzision' },
            { left: 'gleichwohl', right: 'gehobenes "trotzdem"' },
          ],
        },
        explanation: 'Zusammenfassung der C1-Grammatikthemen.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c1Unit13Lesson1.id, word: 'repräsentativ', translationEn: 'representative', translationTr: 'temsili', exampleSentence: 'Die Studie ist nicht repräsentativ.' },
      { lessonId: c1Unit13Lesson1.id, word: 'argumentieren', translationEn: 'to argue', translationTr: 'savunmak', exampleSentence: 'Der Autor argumentiert überzeugend.' },
      { lessonId: c1Unit13Lesson2.id, word: 'die Präzision', translationEn: 'the precision', translationTr: 'kesinlik', exampleSentence: 'Der Nominalstil erlaubt mehr Präzision.' },
      { lessonId: c1Unit13Lesson2.id, word: 'der Beitrag', translationEn: 'the contribution', translationTr: 'katkı', exampleSentence: 'Das ist ein wichtiger Beitrag zur Diskussion.' },
      { lessonId: c1Unit13Lesson3.id, word: 'die Datenlage', translationEn: 'the data situation', translationTr: 'veri durumu', exampleSentence: 'Die Datenlage ist unklar.' },
      { lessonId: c1Unit13Lesson3.id, word: 'der Zeitdruck', translationEn: 'the time pressure', translationTr: 'zaman baskısı', exampleSentence: 'Trotz des Zeitdrucks bleiben wir gründlich.' },
      { lessonId: c1Unit13Lesson4.id, word: 'kompetent', translationEn: 'competent', translationTr: 'yetkin', exampleSentence: 'Sie kommuniziert sehr kompetent.' },
      { lessonId: c1Unit13Lesson4.id, word: 'die Grundlage', translationEn: 'the foundation / basis', translationTr: 'temel', exampleSentence: 'Das ist die Grundlage unserer Argumentation.' },
    ],
  })

  // --- C2: Komplexe Konnektoren (1 sample lesson) ---
  const c2Unit = await prisma.unit.create({
    data: { levelId: c2.id, order: 1, titleDe: 'Komplexe Konnektoren', titleEn: 'Complex Connectors', titleTr: 'Karmaşık Bağlaçlar' },
  })
  const c2Lesson = await prisma.lesson.create({
    data: {
      unitId: c2Unit.id,
      order: 1,
      grammarTopic: "Konnektoren wie 'dennoch'",
      explanationDe: 'Fortgeschrittene Konnektoren wie "dennoch" (trotzdem) drücken einen Gegensatz aus und stehen am Satzanfang, gefolgt vom Verb.',
      explanationEn: 'Advanced connectors like "dennoch" (nevertheless) express contrast and stand at the start of the clause, followed by the verb.',
      explanationTr: '"Dennoch" (yine de) gibi ileri düzey bağlaçlar zıtlık ifade eder ve cümle başında, fiilden önce yer alır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'Er hat hart gearbeitet, ___ ist er nicht befördert worden.',
          options: ['dennoch', 'und', 'weil', 'obwohl'],
        },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Dennoch" drückt hier den Gegensatz aus und steht am Satzanfang mit Verb-Zweit-Stellung.',
      },
      {
        lessonId: c2Lesson.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Kosten sind hoch; ___ lohnt sich die Investition langfristig.' },
        correctAnswer: { accepted: ['dennoch'] },
        explanation: '"Dennoch" verbindet den Gegensatz zwischen hohen Kosten und langfristigem Nutzen.',
      },
    ],
  })

  const c2Unit1Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit.id,
      order: 2,
      grammarTopic: "Konnektoren wie 'nichtsdestotrotz' und 'insofern als'",
      explanationDe:
        '"Nichtsdestotrotz" (trotzdem, dennoch) und "insofern als" (in dem Maße, wie) sind gehobene Konnektoren für formelle Texte und Reden.',
      explanationEn:
        '"Nichtsdestotrotz" (nonetheless) and "insofern als" (insofar as) are elevated connectors used in formal writing and speeches.',
      explanationTr:
        '"Nichtsdestotrotz" (yine de) ve "insofern als" (şu ölçüde ki) resmi metinlerde ve konuşmalarda kullanılan üst düzey bağlaçlardır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit1Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'Welcher Konnektor bedeutet "insofar as"?',
          options: ['insofern als', 'obwohl', 'damit', 'sodass'],
        },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Insofern als" entspricht "insofar as".',
      },
      {
        lessonId: c2Unit1Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne ein Synonym für 'trotzdem' auf gehobenem Sprachniveau." },
        correctAnswer: { accepted: ['nichtsdestotrotz', 'dennoch', 'gleichwohl'] },
        explanation: '"Nichtsdestotrotz", "dennoch" und "gleichwohl" sind gehobene Synonyme für "trotzdem".',
      },
    ],
  })

  const c2Unit1Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit.id,
      order: 3,
      grammarTopic: "Konnektor 'dessen ungeachtet'",
      explanationDe:
        '"Dessen ungeachtet" (unabhängig davon) leitet einen Gegensatz auf sehr formellem Sprachniveau ein, häufig in Verwaltungs- oder Fachtexten.',
      explanationEn:
        '"Dessen ungeachtet" (regardless of that) introduces a contrast at a very formal register, common in administrative or technical texts.',
      explanationTr:
        '"Dessen ungeachtet" (bundan bağımsız olarak) çok resmi bir dil düzeyinde zıtlık başlatır; idari veya teknik metinlerde sık görülür.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit1Lesson3.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Risiken waren bekannt; ___ wurde das Projekt fortgesetzt. (unabhängig davon)' },
        correctAnswer: { accepted: ['dessen ungeachtet'] },
        explanation: '"Dessen ungeachtet" bedeutet "unabhängig davon".',
      },
      {
        lessonId: c2Unit1Lesson3.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: {
          prompt: 'In welchem Kontext ist "dessen ungeachtet" typisch?',
          options: ['sehr formelle/administrative Texte', 'lockeres Chatten', 'Kindersprache', 'Werbeslogans'],
        },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Dessen ungeachtet" gehört zum sehr formellen Register.',
      },
    ],
  })

  const c2Unit1Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit.id,
      order: 4,
      grammarTopic: 'Übung: Gehobene Konnektoren',
      explanationDe:
        'Wiederholung: "dennoch", "nichtsdestotrotz", "insofern als" und "dessen ungeachtet" drücken alle Gegensatz oder Einschränkung aus, unterscheiden sich aber im Formalitätsgrad.',
      explanationEn:
        'Review: "dennoch", "nichtsdestotrotz", "insofern als", and "dessen ungeachtet" all express contrast or qualification but differ in formality.',
      explanationTr:
        'Tekrar: "dennoch", "nichtsdestotrotz", "insofern als" ve "dessen ungeachtet" hepsi zıtlık veya sınırlama ifade eder, ancak resmiyet derecesi farklıdır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit1Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['fortgesetzt', 'wurde', 'das', 'Projekt', 'dennoch'] },
        correctAnswer: { order: ['dennoch', 'wurde', 'das', 'Projekt', 'fortgesetzt'] },
        explanation: '"Dennoch" am Satzanfang, gefolgt vom Verb: "Dennoch wurde das Projekt fortgesetzt."',
      },
      {
        lessonId: c2Unit1Lesson4.id,
        order: 2,
        type: 'MATCHING',
        data: {
          lefts: ['sehr formell/administrativ', 'gehobene Schriftsprache', 'neutral gehoben'],
          rights: ['nichtsdestotrotz', 'dennoch', 'dessen ungeachtet'],
        },
        correctAnswer: {
          pairs: [
            { left: 'sehr formell/administrativ', right: 'dessen ungeachtet' },
            { left: 'gehobene Schriftsprache', right: 'nichtsdestotrotz' },
            { left: 'neutral gehoben', right: 'dennoch' },
          ],
        },
        explanation: 'Konnektoren unterscheiden sich im Formalitätsgrad.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      {
        lessonId: a1Lesson1.id,
        word: 'Guten Morgen',
        translationEn: 'good morning',
        translationTr: 'günaydın',
        exampleSentence: 'Guten Morgen, wie geht es dir?',
      },
      {
        lessonId: a1Lesson1.id,
        word: 'Hallo',
        translationEn: 'hello',
        translationTr: 'merhaba',
        exampleSentence: 'Hallo, ich bin Anna.',
      },
      {
        lessonId: a1Lesson2.id,
        word: 'sein',
        translationEn: 'to be',
        translationTr: 'olmak',
        exampleSentence: 'Ich bin müde.',
      },
      {
        lessonId: a1Lesson2.id,
        word: 'heißen',
        translationEn: 'to be called',
        translationTr: 'adında olmak',
        exampleSentence: 'Ich heiße Anna.',
      },
      {
        lessonId: a1Lesson3.id,
        word: 'eins',
        translationEn: 'one',
        translationTr: 'bir',
        exampleSentence: 'Ich habe eins.',
      },
      {
        lessonId: a1Lesson3.id,
        word: 'zehn',
        translationEn: 'ten',
        translationTr: 'on',
        exampleSentence: 'Zehn Finger habe ich.',
      },
      {
        lessonId: a2Lesson.id,
        word: 'essen',
        translationEn: 'to eat',
        translationTr: 'yemek',
        exampleSentence: 'Ich habe Pizza gegessen.',
      },
      {
        lessonId: a2Lesson.id,
        word: 'lesen',
        translationEn: 'to read',
        translationTr: 'okumak',
        exampleSentence: 'Er hat ein Buch gelesen.',
      },
      {
        lessonId: b1Lesson.id,
        word: 'krank',
        translationEn: 'sick',
        translationTr: 'hasta',
        exampleSentence: 'Ich bin krank.',
      },
      {
        lessonId: b1Lesson.id,
        word: 'weil',
        translationEn: 'because',
        translationTr: 'çünkü',
        exampleSentence: 'Ich bleibe zu Hause, weil ich krank bin.',
      },
      {
        lessonId: b2Lesson.id,
        word: 'reparieren',
        translationEn: 'to repair',
        translationTr: 'tamir etmek',
        exampleSentence: 'Das Auto wird repariert.',
      },
      {
        lessonId: b2Lesson.id,
        word: 'öffnen',
        translationEn: 'to open',
        translationTr: 'açmak',
        exampleSentence: 'Die Tür wird geöffnet.',
      },
      { lessonId: c2Lesson.id, word: 'dennoch', translationEn: 'nevertheless', translationTr: 'yine de', exampleSentence: 'Er hat hart gearbeitet, dennoch ist er nicht befördert worden.' },
      { lessonId: c2Lesson.id, word: 'sich lohnen', translationEn: 'to be worth it', translationTr: 'değmek', exampleSentence: 'Die Investition lohnt sich langfristig.' },
      { lessonId: c2Unit1Lesson2.id, word: 'nichtsdestotrotz', translationEn: 'nonetheless', translationTr: 'yine de', exampleSentence: 'Nichtsdestotrotz hat sie weitergemacht.' },
      { lessonId: c2Unit1Lesson2.id, word: 'insofern', translationEn: 'insofar', translationTr: 'bu ölçüde', exampleSentence: 'Insofern als das stimmt, müssen wir handeln.' },
      { lessonId: c2Unit1Lesson3.id, word: 'ungeachtet', translationEn: 'regardless of', translationTr: 'göz ardı ederek', exampleSentence: 'Dessen ungeachtet wurde das Projekt fortgesetzt.' },
      { lessonId: c2Unit1Lesson3.id, word: 'fortsetzen', translationEn: 'to continue', translationTr: 'devam ettirmek', exampleSentence: 'Man hat das Projekt fortgesetzt.' },
      { lessonId: c2Unit1Lesson4.id, word: 'das Risiko', translationEn: 'the risk', translationTr: 'risk', exampleSentence: 'Die Risiken waren bekannt.' },
      { lessonId: c2Unit1Lesson4.id, word: 'die Einschränkung', translationEn: 'the restriction / qualification', translationTr: 'sınırlama', exampleSentence: 'Das gilt nur mit einer Einschränkung.' },
    ],
  })

  // --- C2 Unit 2: Gehobener Nominalstil (4 lessons) ---
  const c2Unit2 = await prisma.unit.create({
    data: { levelId: c2.id, order: 2, titleDe: 'Gehobener Nominalstil', titleEn: 'Elevated Nominal Style', titleTr: 'Üst Düzey İsim Stili' },
  })

  const c2Unit2Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit2.id,
      order: 1,
      grammarTopic: 'Nominalisierung von Verben',
      explanationDe:
        'Im gehobenen Nominalstil werden Verben zu Nomen: "entscheiden" -> "die Entscheidung", "durchführen" -> "die Durchführung". Das wirkt formeller als Verbalsätze.',
      explanationEn:
        'In elevated nominal style, verbs become nouns: "entscheiden" (to decide) -> "die Entscheidung" (the decision), "durchführen" (to carry out) -> "die Durchführung" (the execution). This reads more formally than verbal sentences.',
      explanationTr:
        'Üst düzey isim stilinde fiiller isimleşir: "entscheiden" (karar vermek) -> "die Entscheidung" (karar), "durchführen" (yürütmek) -> "die Durchführung" (yürütme). Bu, fiil cümlelerinden daha resmi görünür.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit2Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Nominalisierung von "entscheiden"?', options: ['die Entscheidung', 'der Entscheider', 'entschieden', 'die Entscheidbarkeit'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Entscheiden" -> "die Entscheidung".',
      },
      {
        lessonId: c2Unit2Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die ___ des Projekts dauerte drei Monate. (durchführen)' },
        correctAnswer: { accepted: ['durchführung'] },
        explanation: '"Durchführen" -> "die Durchführung".',
      },
    ],
  })

  const c2Unit2Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit2.id,
      order: 2,
      grammarTopic: 'Funktionsverbgefüge in formellen Texten',
      explanationDe:
        'Funktionsverbgefüge wie "zur Anwendung bringen" (statt "anwenden") oder "in Betracht ziehen" (statt "bedenken") sind typisch für Verwaltungs- und Fachsprache.',
      explanationEn:
        'Support-verb constructions like "zur Anwendung bringen" (instead of "anwenden" = to apply) or "in Betracht ziehen" (instead of "bedenken" = to consider) are typical of administrative and technical registers.',
      explanationTr:
        '"Zur Anwendung bringen" (uygulamak yerine) veya "in Betracht ziehen" (düşünmek yerine) gibi destek fiil yapıları idari ve teknik dil için tipiktir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit2Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Formelles Äquivalent zu "bedenken"?', options: ['in Betracht ziehen', 'zur Anwendung bringen', 'zum Ausdruck bringen', 'in Kraft treten'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"In Betracht ziehen" ersetzt "bedenken" im formellen Stil.',
      },
      {
        lessonId: c2Unit2Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne das Funktionsverbgefüge, das 'anwenden' im formellen Stil ersetzt." },
        correctAnswer: { accepted: ['zur anwendung bringen'] },
        explanation: '"Zur Anwendung bringen" ersetzt "anwenden".',
      },
    ],
  })

  const c2Unit2Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit2.id,
      order: 3,
      grammarTopic: 'Genitivketten',
      explanationDe:
        'Im gehobenen Nominalstil reihen sich mehrere Genitive aneinander: "die Erhöhung der Effizienz der Produktion des Unternehmens". Das ist formell, aber schwer lesbar in Übermaß.',
      explanationEn:
        'Elevated nominal style often chains multiple genitives: "die Erhöhung der Effizienz der Produktion des Unternehmens" (the increase of the efficiency of the production of the company). Formal, but hard to read in excess.',
      explanationTr:
        'Üst düzey isim stilinde birden çok tamlayan hali art arda gelir: "die Erhöhung der Effizienz der Produktion des Unternehmens". Resmidir ama aşırı kullanımda okunması zordur.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit2Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was kennzeichnet gehobenen Nominalstil oft negativ?', options: ['zu viele Genitivketten', 'zu kurze Sätze', 'zu viel Umgangssprache', 'zu viele Fragen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Übermäßige Genitivketten erschweren das Lesen.',
      },
      {
        lessonId: c2Unit2Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'die Erhöhung ___ Effizienz der Produktion (Genitiv Artikel, feminin)' },
        correctAnswer: { accepted: ['der'] },
        explanation: 'Genitiv feminin Singular: "der".',
      },
    ],
  })

  const c2Unit2Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit2.id,
      order: 4,
      grammarTopic: 'Übung: Nominalstil vs. Verbalstil',
      explanationDe:
        'Wiederholung: Verbalstil ist lebendiger und leichter verständlich, Nominalstil klingt formeller und distanzierter. Gute Texte mischen beide bewusst.',
      explanationEn:
        'Review: verbal style is livelier and easier to understand; nominal style sounds more formal and detached. Good writing consciously mixes both.',
      explanationTr:
        'Tekrar: fiil stili daha canlı ve anlaşılırdır, isim stili daha resmi ve mesafeli görünür. İyi metinler ikisini bilinçli olarak karıştırır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit2Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['drei', 'dauerte', 'Monate', 'Durchführung', 'die'] },
        correctAnswer: { order: ['die', 'Durchführung', 'dauerte', 'drei', 'Monate'] },
        explanation: 'Nominalstil: "die Durchführung" als Subjekt, dann Verb, dann Zeitangabe.',
      },
      {
        lessonId: c2Unit2Lesson4.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welcher Stil ist distanzierter?', options: ['Nominalstil', 'Verbalstil', 'beide gleich', 'keiner'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Nominalstil wirkt formeller und distanzierter.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit2Lesson1.id, word: 'die Entscheidung', translationEn: 'the decision', translationTr: 'karar', exampleSentence: 'Die Entscheidung fiel schnell.' },
      { lessonId: c2Unit2Lesson1.id, word: 'die Durchführung', translationEn: 'the execution/carrying-out', translationTr: 'yürütme', exampleSentence: 'Die Durchführung dauerte drei Monate.' },
      { lessonId: c2Unit2Lesson2.id, word: 'in Betracht ziehen', translationEn: 'to take into consideration', translationTr: 'göz önünde bulundurmak', exampleSentence: 'Wir ziehen alle Optionen in Betracht.' },
      { lessonId: c2Unit2Lesson2.id, word: 'zur Anwendung bringen', translationEn: 'to apply (formally)', translationTr: 'uygulamaya koymak', exampleSentence: 'Die neue Regel wird zur Anwendung gebracht.' },
      { lessonId: c2Unit2Lesson3.id, word: 'die Effizienz', translationEn: 'efficiency', translationTr: 'verimlilik', exampleSentence: 'Die Effizienz wurde gesteigert.' },
      { lessonId: c2Unit2Lesson3.id, word: 'das Unternehmen', translationEn: 'the company', translationTr: 'şirket', exampleSentence: 'Das Unternehmen wächst schnell.' },
      { lessonId: c2Unit2Lesson4.id, word: 'lebendig', translationEn: 'lively', translationTr: 'canlı', exampleSentence: 'Der Text ist sehr lebendig geschrieben.' },
      { lessonId: c2Unit2Lesson4.id, word: 'distanziert', translationEn: 'detached', translationTr: 'mesafeli', exampleSentence: 'Der Ton wirkt distanziert.' },
    ],
  })

  // --- C2 Unit 3: Rhetorische Mittel (4 lessons) ---
  const c2Unit3 = await prisma.unit.create({
    data: { levelId: c2.id, order: 3, titleDe: 'Rhetorische Mittel', titleEn: 'Rhetorical Devices', titleTr: 'Retorik Araçlar' },
  })

  const c2Unit3Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit3.id,
      order: 1,
      grammarTopic: 'Metapher und Vergleich',
      explanationDe:
        'Eine Metapher überträgt Bedeutung bildlich, ohne "wie": "Die Zeit ist ein Dieb." Ein Vergleich benutzt "wie": "Er ist schnell wie der Wind."',
      explanationEn:
        'A metaphor transfers meaning figuratively without "like/as": "Die Zeit ist ein Dieb" (Time is a thief). A simile uses "wie" (like/as): "Er ist schnell wie der Wind" (He is fast as the wind).',
      explanationTr:
        'Metafor, "gibi" olmadan anlamı mecazi olarak aktarır: "Die Zeit ist ein Dieb" (Zaman bir hırsızdır). Benzetme "wie" (gibi) kullanır: "Er ist schnell wie der Wind".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit3Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welcher Satz ist eine Metapher (kein "wie")?', options: ['Die Zeit ist ein Dieb.', 'Er ist schnell wie der Wind.', 'Sie singt wie ein Engel.', 'Das Haus ist groß wie ein Schloss.'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Eine Metapher benutzt kein "wie".',
      },
      {
        lessonId: c2Unit3Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Er ist schnell ___ der Wind. (Vergleich)' },
        correctAnswer: { accepted: ['wie'] },
        explanation: 'Ein Vergleich benutzt "wie".',
      },
    ],
  })

  const c2Unit3Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit3.id,
      order: 2,
      grammarTopic: 'Anapher und Wiederholung',
      explanationDe:
        'Eine Anapher wiederholt ein Wort oder eine Phrase am Anfang aufeinanderfolgender Sätze, um Nachdruck zu erzeugen: "Wir werden kämpfen. Wir werden gewinnen. Wir werden nicht aufgeben."',
      explanationEn:
        'An anaphora repeats a word or phrase at the start of successive sentences for emphasis: "Wir werden kämpfen. Wir werden gewinnen. Wir werden nicht aufgeben." (We will fight. We will win. We will not give up.)',
      explanationTr:
        'Anafor, vurgu yaratmak için ardışık cümlelerin başında bir kelime veya öbeği tekrarlar: "Wir werden kämpfen. Wir werden gewinnen. Wir werden nicht aufgeben."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit3Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was ist eine Anapher?', options: ['Wiederholung am Satzanfang', 'ein Reim am Satzende', 'eine rhetorische Frage', 'eine Übertreibung'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Eine Anapher wiederholt am Satzanfang.',
      },
      {
        lessonId: c2Unit3Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie nennt man die Wiederholung eines Wortes am Satzanfang aufeinanderfolgender Sätze?" },
        correctAnswer: { accepted: ['anapher', 'die anapher'] },
        explanation: 'Das rhetorische Mittel heißt "Anapher".',
      },
    ],
  })

  const c2Unit3Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit3.id,
      order: 3,
      grammarTopic: 'Rhetorische Frage',
      explanationDe:
        'Eine rhetorische Frage erwartet keine Antwort, sondern betont eine Aussage: "Ist das nicht offensichtlich?" bedeutet "Das ist offensichtlich."',
      explanationEn:
        'A rhetorical question expects no answer; it emphasizes a statement: "Ist das nicht offensichtlich?" (Isn\'t that obvious?) means "That is obvious."',
      explanationTr:
        'Retorik soru, cevap beklemez; bir ifadeyi vurgular: "Ist das nicht offensichtlich?" (Bu açık değil mi?) "Bu açıktır" anlamına gelir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit3Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was ist der Zweck einer rhetorischen Frage?', options: ['eine Aussage betonen', 'eine echte Antwort erhalten', 'eine Bitte formulieren', 'eine Entschuldigung ausdrücken'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Sie betont eine Aussage, statt eine Antwort zu erwarten.',
      },
      {
        lessonId: c2Unit3Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ist das nicht ___? (offensichtlich, rhetorische Frage)' },
        correctAnswer: { accepted: ['offensichtlich'] },
        explanation: '"Ist das nicht offensichtlich?" ist eine rhetorische Frage.',
      },
    ],
  })

  const c2Unit3Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit3.id,
      order: 4,
      grammarTopic: 'Übung: Rhetorische Mittel erkennen',
      explanationDe:
        'Wiederholung: Metapher, Vergleich, Anapher und rhetorische Frage sind Stilmittel, die Reden und Texte überzeugender und einprägsamer machen.',
      explanationEn:
        'Review: metaphor, simile, anaphora, and rhetorical question are stylistic devices that make speeches and texts more persuasive and memorable.',
      explanationTr:
        'Tekrar: metafor, benzetme, anafor ve retorik soru, konuşmaları ve metinleri daha ikna edici ve akılda kalıcı yapan üslup araçlarıdır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit3Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: {
          lefts: ['Die Zeit ist ein Dieb.', 'Wir werden kämpfen. Wir werden gewinnen.', 'Ist das nicht offensichtlich?'],
          rights: ['rhetorische Frage', 'Metapher', 'Anapher'],
        },
        correctAnswer: {
          pairs: [
            { left: 'Die Zeit ist ein Dieb.', right: 'Metapher' },
            { left: 'Wir werden kämpfen. Wir werden gewinnen.', right: 'Anapher' },
            { left: 'Ist das nicht offensichtlich?', right: 'rhetorische Frage' },
          ],
        },
        explanation: 'Jedes Beispiel entspricht einem rhetorischen Mittel.',
      },
      {
        lessonId: c2Unit3Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne ein rhetorisches Mittel, das ohne 'wie' auskommt und Bedeutung bildlich überträgt." },
        correctAnswer: { accepted: ['metapher', 'die metapher'] },
        explanation: 'Die Metapher überträgt Bedeutung bildlich ohne "wie".',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit3Lesson1.id, word: 'die Metapher', translationEn: 'the metaphor', translationTr: 'metafor', exampleSentence: 'Die Zeit ist ein Dieb ist eine Metapher.' },
      { lessonId: c2Unit3Lesson1.id, word: 'der Vergleich', translationEn: 'the comparison/simile', translationTr: 'benzetme', exampleSentence: 'Er benutzt oft Vergleiche.' },
      { lessonId: c2Unit3Lesson2.id, word: 'die Anapher', translationEn: 'the anaphora', translationTr: 'anafor', exampleSentence: 'Die Anapher verstärkt die Wirkung.' },
      { lessonId: c2Unit3Lesson2.id, word: 'der Nachdruck', translationEn: 'emphasis', translationTr: 'vurgu', exampleSentence: 'Sie sprach mit Nachdruck.' },
      { lessonId: c2Unit3Lesson3.id, word: 'offensichtlich', translationEn: 'obvious', translationTr: 'açık', exampleSentence: 'Das ist doch offensichtlich.' },
      { lessonId: c2Unit3Lesson3.id, word: 'die Wirkung', translationEn: 'the effect', translationTr: 'etki', exampleSentence: 'Die Rede hatte große Wirkung.' },
      { lessonId: c2Unit3Lesson4.id, word: 'überzeugend', translationEn: 'convincing', translationTr: 'ikna edici', exampleSentence: 'Das Argument war überzeugend.' },
      { lessonId: c2Unit3Lesson4.id, word: 'einprägsam', translationEn: 'memorable', translationTr: 'akılda kalıcı', exampleSentence: 'Der Slogan ist sehr einprägsam.' },
    ],
  })

  // --- C2 Unit 4: Sprachliche Nuancen: Sarkasmus & Übertreibung (4 lessons) ---
  const c2Unit4 = await prisma.unit.create({
    data: { levelId: c2.id, order: 4, titleDe: 'Sprachliche Nuancen: Sarkasmus & Übertreibung', titleEn: 'Linguistic Nuance: Sarcasm & Hyperbole', titleTr: 'Dilsel İncelik: İğneleme ve Abartma' },
  })

  const c2Unit4Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit4.id,
      order: 1,
      grammarTopic: 'Sarkasmus erkennen',
      explanationDe:
        'Sarkasmus sagt das Gegenteil dessen, was gemeint ist, oft mit übertriebener Betonung: "Na toll, jetzt ist der Zug auch noch weg!" (gemeint: das ist ärgerlich).',
      explanationEn:
        'Sarcasm says the opposite of what is meant, often with exaggerated emphasis: "Na toll, jetzt ist der Zug auch noch weg!" (Great, now the train is gone too! — meaning: this is annoying).',
      explanationTr:
        'Alaycılık, kastedilenin tersini söyler, genellikle abartılı vurguyla: "Na toll, jetzt ist der Zug auch noch weg!" (Harika, şimdi de tren gitti! — anlam: bu can sıkıcı).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit4Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '"Na toll, jetzt ist der Zug auch noch weg!" ist ein Beispiel für...', options: ['Sarkasmus', 'eine ehrliche Freude', 'eine Bitte', 'eine Entschuldigung'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Der Sprecher meint das Gegenteil von "toll".',
      },
      {
        lessonId: c2Unit4Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie nennt man es, wenn man das Gegenteil dessen sagt, was man meint, um Kritik auszudrücken?" },
        correctAnswer: { accepted: ['sarkasmus', 'der sarkasmus'] },
        explanation: 'Das nennt man "Sarkasmus".',
      },
    ],
  })

  const c2Unit4Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit4.id,
      order: 2,
      grammarTopic: 'Übertreibung (Hyperbel)',
      explanationDe:
        'Eine Hyperbel übertreibt bewusst, um Wirkung zu erzielen: "Ich habe dir das schon tausendmal gesagt!" ist nicht wörtlich gemeint.',
      explanationEn:
        'A hyperbole deliberately exaggerates for effect: "Ich habe dir das schon tausendmal gesagt!" (I\'ve told you that a thousand times!) is not meant literally.',
      explanationTr:
        'Abartma (hiperbol), etki yaratmak için bilinçli olarak abartır: "Ich habe dir das schon tausendmal gesagt!" gerçek anlamda kastedilmez.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit4Lesson2.id,
        order: 1,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ich habe dir das schon ___ gesagt! (Übertreibung für "sehr oft")' },
        correctAnswer: { accepted: ['tausendmal'] },
        explanation: '"Tausendmal" ist eine typische Hyperbel für "sehr oft".',
      },
      {
        lessonId: c2Unit4Lesson2.id,
        order: 2,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was ist eine Hyperbel?', options: ['eine bewusste Übertreibung', 'eine exakte Beschreibung', 'eine Frage', 'ein Widerspruch'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Eine Hyperbel ist eine bewusste Übertreibung.',
      },
    ],
  })

  const c2Unit4Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit4.id,
      order: 3,
      grammarTopic: 'Sarkasmus im Ton erkennen (schriftlich)',
      explanationDe:
        'Schriftlich ist Sarkasmus oft schwer zu erkennen; Anführungszeichen um ein Wort oder Ausdrücke wie "wie zu erwarten" können ironische Distanz signalisieren.',
      explanationEn:
        'In writing, sarcasm is often hard to detect; quotation marks around a word or phrases like "wie zu erwarten" (as expected) can signal ironic distance.',
      explanationTr:
        'Yazıda alaycılığı fark etmek genellikle zordur; bir kelimenin etrafındaki tırnak işaretleri veya "wie zu erwarten" (beklendiği gibi) gibi ifadeler ironik mesafeyi işaret edebilir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit4Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Signal deutet schriftlich oft auf Ironie hin?', options: ['Anführungszeichen um ein Wort', 'ein Ausrufezeichen', 'ein Komma', 'Großschreibung'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Anführungszeichen können ironische Distanz signalisieren.',
      },
      {
        lessonId: c2Unit4Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welcher Ausdruck signalisiert oft ironische Distanz: 'wie zu erwarten' oder 'wie geplant'?" },
        correctAnswer: { accepted: ['wie zu erwarten'] },
        explanation: '"Wie zu erwarten" signalisiert oft Ironie.',
      },
    ],
  })

  const c2Unit4Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit4.id,
      order: 4,
      grammarTopic: 'Übung: Sarkasmus & Übertreibung',
      explanationDe:
        'Wiederholung: Sarkasmus meint das Gegenteil, Hyperbel übertreibt bewusst — beide erzeugen rhetorische Wirkung, aber mit unterschiedlicher Funktion.',
      explanationEn:
        'Review: sarcasm means the opposite, hyperbole exaggerates deliberately — both create rhetorical effect but serve different functions.',
      explanationTr:
        'Tekrar: alaycılık tersini kasteder, abartma bilinçli olarak büyütür — ikisi de retorik etki yaratır ama işlevleri farklıdır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit4Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: {
          lefts: ['Na toll, jetzt ist der Zug weg!', 'Ich habe das tausendmal gesagt!'],
          rights: ['Hyperbel', 'Sarkasmus'],
        },
        correctAnswer: {
          pairs: [
            { left: 'Na toll, jetzt ist der Zug weg!', right: 'Sarkasmus' },
            { left: 'Ich habe das tausendmal gesagt!', right: 'Hyperbel' },
          ],
        },
        explanation: 'Sarkasmus meint das Gegenteil, Hyperbel übertreibt.',
      },
      {
        lessonId: c2Unit4Lesson4.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['toll', 'na', 'jetzt', 'weg', 'der', 'Zug', 'ist'] },
        correctAnswer: { order: ['na', 'toll', 'jetzt', 'ist', 'der', 'Zug', 'weg'] },
        explanation: 'Typische sarkastische Struktur: "Na toll, jetzt ist der Zug weg."',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit4Lesson1.id, word: 'der Sarkasmus', translationEn: 'sarcasm', translationTr: 'iğneleme', exampleSentence: 'Sein Sarkasmus war unüberhörbar.' },
      { lessonId: c2Unit4Lesson1.id, word: 'ärgerlich', translationEn: 'annoying', translationTr: 'sinir bozucu', exampleSentence: 'Das ist wirklich ärgerlich.' },
      { lessonId: c2Unit4Lesson2.id, word: 'die Übertreibung', translationEn: 'the exaggeration', translationTr: 'abartı', exampleSentence: 'Das war eine klare Übertreibung.' },
      { lessonId: c2Unit4Lesson2.id, word: 'bewusst', translationEn: 'deliberate/conscious', translationTr: 'bilinçli', exampleSentence: 'Das war eine bewusste Entscheidung.' },
      { lessonId: c2Unit4Lesson3.id, word: 'die Ironie', translationEn: 'irony', translationTr: 'ironi', exampleSentence: 'Die Ironie war deutlich zu spüren.' },
      { lessonId: c2Unit4Lesson3.id, word: 'die Distanz', translationEn: 'the distance', translationTr: 'mesafe', exampleSentence: 'Er hielt sprachliche Distanz.' },
      { lessonId: c2Unit4Lesson4.id, word: 'die Funktion', translationEn: 'the function', translationTr: 'işlev', exampleSentence: 'Jedes Stilmittel hat eine Funktion.' },
      { lessonId: c2Unit4Lesson4.id, word: 'wirkungsvoll', translationEn: 'effective', translationTr: 'etkili', exampleSentence: 'Der Sarkasmus war sehr wirkungsvoll.' },
    ],
  })

  // --- C2 Unit 5: Fach- und Sondersprachen (4 lessons) ---
  const c2Unit5 = await prisma.unit.create({
    data: { levelId: c2.id, order: 5, titleDe: 'Fach- und Sondersprachen', titleEn: 'Technical & Specialized Registers', titleTr: 'Uzmanlık ve Özel Diller' },
  })

  const c2Unit5Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit5.id,
      order: 1,
      grammarTopic: 'Juristische Fachsprache',
      explanationDe:
        'Die Rechtssprache benutzt feste Formulierungen wie "unbeschadet", "im Sinne des Gesetzes", "vorbehaltlich" — oft mit Nominalstil und Passiv.',
      explanationEn:
        'Legal language uses fixed formulations like "unbeschadet" (without prejudice to), "im Sinne des Gesetzes" (within the meaning of the law), "vorbehaltlich" (subject to) — often with nominal style and passive voice.',
      explanationTr:
        'Hukuk dili "unbeschadet" (zarar vermeksizin), "im Sinne des Gesetzes" (kanun anlamında), "vorbehaltlich" (şartıyla) gibi sabit ifadeler kullanır — genellikle isim stili ve edilgen çatıyla.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit5Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was bedeutet "vorbehaltlich" in der Rechtssprache?', options: ['subject to / provided that', 'immer', 'niemals', 'sofort'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Vorbehaltlich" bedeutet "subject to / provided that".',
      },
      {
        lessonId: c2Unit5Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ der Genehmigung tritt der Vertrag in Kraft. (subject to)' },
        correctAnswer: { accepted: ['vorbehaltlich'] },
        explanation: '"Vorbehaltlich der Genehmigung" = "subject to approval".',
      },
    ],
  })

  const c2Unit5Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit5.id,
      order: 2,
      grammarTopic: 'Medizinische Fachsprache',
      explanationDe:
        'Die Medizinsprache benutzt oft griechisch-lateinische Fachbegriffe: "die Diagnose", "die Therapie", "die Symptomatik". Ärzte übersetzen diese oft in Alltagssprache für Patienten.',
      explanationEn:
        'Medical language often uses Greek-Latin technical terms: "die Diagnose" (diagnosis), "die Therapie" (therapy), "die Symptomatik" (symptomatology). Doctors often translate these into everyday language for patients.',
      explanationTr:
        'Tıp dili genellikle Yunanca-Latince teknik terimler kullanır: "die Diagnose" (tanı), "die Therapie" (tedavi), "die Symptomatik" (semptomlar). Doktorlar bunları hastalar için günlük dile çevirir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit5Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was bedeutet "die Diagnose"?', options: ['diagnosis', 'the prescription', 'the surgery', 'the recovery'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Die Diagnose" bedeutet "diagnosis".',
      },
      {
        lessonId: c2Unit5Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne den deutschen Fachbegriff für 'therapy'." },
        correctAnswer: { accepted: ['die therapie', 'therapie'] },
        explanation: '"Die Therapie" bedeutet "therapy".',
      },
    ],
  })

  const c2Unit5Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit5.id,
      order: 3,
      grammarTopic: 'Bürokratische Fachsprache',
      explanationDe:
        'Verwaltungssprache benutzt Formulierungen wie "Antrag auf...", "gemäß §...", "hiermit wird bescheinigt, dass...". Diese sind stark formelhaft und wenig variabel.',
      explanationEn:
        'Bureaucratic language uses formulations like "Antrag auf..." (application for...), "gemäß §..." (pursuant to §...), "hiermit wird bescheinigt, dass..." (this certifies that...). These are highly formulaic and rigid.',
      explanationTr:
        'Bürokratik dil "Antrag auf..." (başvuru...), "gemäß §..." (madde ...\'e göre), "hiermit wird bescheinigt, dass..." (bununla belgelenmektedir ki...) gibi ifadeler kullanır. Bunlar oldukça kalıplaşmıştır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit5Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welche Formulierung ist typisch bürokratisch?', options: ['hiermit wird bescheinigt, dass...', 'ich finde das cool', 'lass uns das machen', 'kein Problem'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Hiermit wird bescheinigt, dass..." ist typische Verwaltungssprache.',
      },
      {
        lessonId: c2Unit5Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ auf Kindergeld muss schriftlich gestellt werden. (application)' },
        correctAnswer: { accepted: ['antrag', 'der antrag'] },
        explanation: '"Antrag auf Kindergeld" = "application for child benefit".',
      },
    ],
  })

  const c2Unit5Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit5.id,
      order: 4,
      grammarTopic: 'Übung: Fachsprachen im Vergleich',
      explanationDe:
        'Wiederholung: Jede Fachsprache (juristisch, medizinisch, bürokratisch) hat eigene feste Formulierungen und Fachbegriffe, die Laien oft nicht sofort verstehen.',
      explanationEn:
        'Review: each specialized register (legal, medical, bureaucratic) has its own fixed formulations and technical terms that laypeople often don\'t immediately understand.',
      explanationTr:
        'Tekrar: her uzmanlık dili (hukuki, tıbbi, bürokratik) kendine özgü sabit ifadelere ve teknik terimlere sahiptir; bunları sıradan kişiler genellikle hemen anlamaz.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit5Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: {
          lefts: ['vorbehaltlich', 'die Diagnose', 'hiermit wird bescheinigt'],
          rights: ['bürokratisch', 'juristisch', 'medizinisch'],
        },
        correctAnswer: {
          pairs: [
            { left: 'vorbehaltlich', right: 'juristisch' },
            { left: 'die Diagnose', right: 'medizinisch' },
            { left: 'hiermit wird bescheinigt', right: 'bürokratisch' },
          ],
        },
        explanation: 'Jeder Ausdruck gehört zu einer bestimmten Fachsprache.',
      },
      {
        lessonId: c2Unit5Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne eine der drei in dieser Einheit behandelten Fachsprachen." },
        correctAnswer: { accepted: ['juristisch', 'medizinisch', 'bürokratisch', 'rechtssprache', 'medizinsprache', 'verwaltungssprache'] },
        explanation: 'Behandelt wurden juristische, medizinische und bürokratische Fachsprache.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit5Lesson1.id, word: 'vorbehaltlich', translationEn: 'subject to', translationTr: 'şartıyla', exampleSentence: 'Vorbehaltlich der Genehmigung tritt der Vertrag in Kraft.' },
      { lessonId: c2Unit5Lesson1.id, word: 'unbeschadet', translationEn: 'without prejudice to', translationTr: 'zarar vermeksizin', exampleSentence: 'Unbeschadet dieser Regelung gilt das Gesetz weiter.' },
      { lessonId: c2Unit5Lesson2.id, word: 'die Diagnose', translationEn: 'the diagnosis', translationTr: 'tanı', exampleSentence: 'Die Diagnose war eindeutig.' },
      { lessonId: c2Unit5Lesson2.id, word: 'die Therapie', translationEn: 'the therapy', translationTr: 'tedavi', exampleSentence: 'Die Therapie dauert mehrere Wochen.' },
      { lessonId: c2Unit5Lesson3.id, word: 'der Antrag', translationEn: 'the application', translationTr: 'başvuru', exampleSentence: 'Der Antrag wurde genehmigt.' },
      { lessonId: c2Unit5Lesson3.id, word: 'bescheinigen', translationEn: 'to certify', translationTr: 'belgelemek', exampleSentence: 'Das wird hiermit bescheinigt.' },
      { lessonId: c2Unit5Lesson4.id, word: 'der Laie', translationEn: 'the layperson', translationTr: 'sıradan kişi', exampleSentence: 'Für Laien ist das schwer verständlich.' },
      { lessonId: c2Unit5Lesson4.id, word: 'der Fachbegriff', translationEn: 'the technical term', translationTr: 'teknik terim', exampleSentence: 'Das ist ein medizinischer Fachbegriff.' },
    ],
  })

  // --- C2 Unit 6: Archaismen & gehobenes Vokabular (4 lessons) ---
  const c2Unit6 = await prisma.unit.create({
    data: { levelId: c2.id, order: 6, titleDe: 'Archaismen & gehobenes Vokabular', titleEn: 'Archaisms & Elevated Vocabulary', titleTr: 'Arkaizmler ve Üst Düzey Kelime Dağarcığı' },
  })

  const c2Unit6Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit6.id,
      order: 1,
      grammarTopic: 'Archaische Wörter erkennen',
      explanationDe:
        'Archaismen sind veraltete Wörter, die noch in Literatur oder feierlichen Texten vorkommen: "vonnöten" (statt "nötig"), "alsdann" (statt "dann").',
      explanationEn:
        'Archaisms are outdated words still found in literature or ceremonial texts: "vonnöten" (instead of "nötig" = necessary), "alsdann" (instead of "dann" = then).',
      explanationTr:
        'Arkaizmler, hâlâ edebiyatta veya törensel metinlerde bulunan eski kelimelerdir: "vonnöten" ("nötig" = gerekli yerine), "alsdann" ("dann" = sonra yerine).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit6Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Wort ist ein Archaismus für "nötig"?', options: ['vonnöten', 'notwendig', 'wichtig', 'dringend'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Vonnöten" ist eine veraltete Form von "nötig".',
      },
      {
        lessonId: c2Unit6Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ trat er vor die Versammlung. (archaisch für "dann")' },
        correctAnswer: { accepted: ['alsdann'] },
        explanation: '"Alsdann" ist ein Archaismus für "dann".',
      },
    ],
  })

  const c2Unit6Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit6.id,
      order: 2,
      grammarTopic: 'Gehobenes Vokabular im Alltag',
      explanationDe:
        'Gehobene Wörter wie "erhaben" (statt "toll"), "vortrefflich" (statt "sehr gut"), "obsolet" (statt "veraltet") verleihen Texten einen literarischen Ton.',
      explanationEn:
        'Elevated words like "erhaben" (sublime, instead of "toll" = great), "vortrefflich" (excellent, instead of "sehr gut"), "obsolet" (obsolete, instead of "veraltet") lend texts a literary tone.',
      explanationTr:
        '"Erhaben" (yüce, "toll" = harika yerine), "vortrefflich" (mükemmel, "sehr gut" yerine), "obsolet" (eskimiş, "veraltet" yerine) gibi üst düzey kelimeler metinlere edebi bir ton katar.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit6Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Gehobenes Synonym für "sehr gut"?', options: ['vortrefflich', 'okay', 'ganz nett', 'mittelmäßig'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Vortrefflich" ist ein gehobenes Synonym für "sehr gut".',
      },
      {
        lessonId: c2Unit6Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne ein gehobenes Synonym für 'veraltet'." },
        correctAnswer: { accepted: ['obsolet'] },
        explanation: '"Obsolet" bedeutet "veraltet".',
      },
    ],
  })

  const c2Unit6Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit6.id,
      order: 3,
      grammarTopic: 'Archaische Verbformen',
      explanationDe:
        'In älteren Texten findet man Formen wie "ward" (statt "wurde") oder "spricht er" in Inversion ohne "dass". Diese wirken heute poetisch oder feierlich.',
      explanationEn:
        'Older texts contain forms like "ward" (instead of "wurde" = became) or inverted "spricht er" without "dass". These sound poetic or solemn today.',
      explanationTr:
        'Eski metinlerde "ward" ("wurde" = oldu yerine) veya "dass" olmadan devrik "spricht er" gibi biçimler bulunur. Bunlar bugün şiirsel veya törensel görünür.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit6Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '"Ward" ist eine archaische Form von...', options: ['wurde', 'wird', 'war', 'werde'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Ward" ist eine veraltete Form von "wurde".',
      },
      {
        lessonId: c2Unit6Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Und es ___ Licht. (archaisch für "wurde")' },
        correctAnswer: { accepted: ['ward'] },
        explanation: '"Und es ward Licht" ist eine bekannte archaische Formulierung.',
      },
    ],
  })

  const c2Unit6Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit6.id,
      order: 4,
      grammarTopic: 'Übung: Archaismen & gehobenes Vokabular',
      explanationDe:
        'Wiederholung: Archaismen und gehobenes Vokabular verleihen Texten literarischen oder feierlichen Charakter, sind aber im Alltag unüblich.',
      explanationEn:
        'Review: archaisms and elevated vocabulary give texts a literary or solemn character but are unusual in everyday speech.',
      explanationTr:
        'Tekrar: arkaizmler ve üst düzey kelimeler metinlere edebi veya törensel bir karakter katar, ancak günlük konuşmada alışılmadıktır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit6Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['vonnöten', 'vortrefflich', 'obsolet'], rights: ['veraltet', 'nötig', 'sehr gut'] },
        correctAnswer: {
          pairs: [
            { left: 'vonnöten', right: 'nötig' },
            { left: 'vortrefflich', right: 'sehr gut' },
            { left: 'obsolet', right: 'veraltet' },
          ],
        },
        explanation: 'Jeder Archaismus/jedes gehobene Wort hat ein alltagssprachliches Äquivalent.',
      },
      {
        lessonId: c2Unit6Lesson4.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['Licht', 'ward', 'es', 'und'] },
        correctAnswer: { order: ['und', 'es', 'ward', 'Licht'] },
        explanation: 'Bekannte archaische Wendung: "Und es ward Licht."',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit6Lesson1.id, word: 'vonnöten', translationEn: 'necessary (archaic)', translationTr: 'gerekli (eski)', exampleSentence: 'Geduld ist hier vonnöten.' },
      { lessonId: c2Unit6Lesson1.id, word: 'alsdann', translationEn: 'then (archaic)', translationTr: 'sonra (eski)', exampleSentence: 'Alsdann trat er vor die Versammlung.' },
      { lessonId: c2Unit6Lesson2.id, word: 'vortrefflich', translationEn: 'excellent', translationTr: 'mükemmel', exampleSentence: 'Das Konzert war vortrefflich.' },
      { lessonId: c2Unit6Lesson2.id, word: 'obsolet', translationEn: 'obsolete', translationTr: 'eskimiş', exampleSentence: 'Diese Methode ist obsolet.' },
      { lessonId: c2Unit6Lesson3.id, word: 'ward', translationEn: 'became (archaic)', translationTr: 'oldu (eski)', exampleSentence: 'Und es ward Licht.' },
      { lessonId: c2Unit6Lesson3.id, word: 'feierlich', translationEn: 'solemn', translationTr: 'törensel', exampleSentence: 'Die Rede war sehr feierlich.' },
      { lessonId: c2Unit6Lesson4.id, word: 'literarisch', translationEn: 'literary', translationTr: 'edebi', exampleSentence: 'Der Text hat einen literarischen Charakter.' },
      { lessonId: c2Unit6Lesson4.id, word: 'unüblich', translationEn: 'unusual', translationTr: 'alışılmadık', exampleSentence: 'Das ist im Alltag unüblich.' },
    ],
  })

  // --- C2 Unit 7: Feinheiten des Konjunktivs (4 lessons) ---
  const c2Unit7 = await prisma.unit.create({
    data: { levelId: c2.id, order: 7, titleDe: 'Feinheiten des Konjunktivs', titleEn: 'Subtleties of the Subjunctive', titleTr: 'Konjunktif Kipin İncelikleri' },
  })

  const c2Unit7Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit7.id,
      order: 1,
      grammarTopic: 'Konjunktiv I vs. Konjunktiv II in der indirekten Rede',
      explanationDe:
        'In sorgfältiger Schriftsprache markiert Konjunktiv I neutrale Redewiedergabe ("er sagt, er komme"), während Konjunktiv II oft Zweifel des Sprechers an der Aussage andeutet ("er sagt, er käme" klingt skeptischer).',
      explanationEn:
        'In careful written German, Konjunktiv I marks neutral reported speech ("er sagt, er komme"), while Konjunktiv II often hints at the speaker\'s doubt about the claim ("er sagt, er käme" sounds more skeptical).',
      explanationTr:
        'Özenli yazı dilinde Konjunktiv I nötr aktarımı işaretler ("er sagt, er komme"), Konjunktiv II ise genellikle konuşmacının iddiaya şüpheyle yaklaştığını ima eder ("er sagt, er käme" daha şüpheci gelir).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit7Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welche Form klingt neutraler in der indirekten Rede?', options: ['Konjunktiv I', 'Konjunktiv II', 'Indikativ', 'Imperativ'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Konjunktiv I ist die neutrale Form der indirekten Rede.',
      },
      {
        lessonId: c2Unit7Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welche Form deutet oft Zweifel des Sprechers an: Konjunktiv I oder Konjunktiv II?" },
        correctAnswer: { accepted: ['konjunktiv ii', 'konjunktiv 2'] },
        explanation: 'Konjunktiv II kann Skepsis des Sprechers andeuten.',
      },
    ],
  })

  const c2Unit7Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit7.id,
      order: 2,
      grammarTopic: 'Konjunktiv in höflichen Formulierungen',
      explanationDe:
        'Konjunktiv II macht Bitten und Vorschläge höflicher: "Könnten Sie mir helfen?" statt "Können Sie mir helfen?" klingt distanzierter und formeller.',
      explanationEn:
        'Konjunktiv II makes requests and suggestions more polite: "Könnten Sie mir helfen?" (Could you help me?) instead of "Können Sie mir helfen?" (Can you help me?) sounds more formal and reserved.',
      explanationTr:
        'Konjunktiv II, rica ve önerileri daha kibar yapar: "Können Sie mir helfen?" yerine "Könnten Sie mir helfen?" daha mesafeli ve resmi gelir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit7Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welche Frage ist höflicher?', options: ['Könnten Sie mir helfen?', 'Können Sie mir helfen?', 'Hilfst du mir?', 'Hilf mir!'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Könnten Sie..." (Konjunktiv II) ist höflicher.',
      },
      {
        lessonId: c2Unit7Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ Sie mir bitte das Salz reichen? (höfliche Bitte mit können)' },
        correctAnswer: { accepted: ['könnten'] },
        explanation: '"Könnten Sie..." ist die höfliche Konjunktiv-II-Form.',
      },
    ],
  })

  const c2Unit7Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit7.id,
      order: 3,
      grammarTopic: 'Konjunktiv in hypothetischen wissenschaftlichen Aussagen',
      explanationDe:
        'In wissenschaftlichen Texten drückt Konjunktiv II Vorsicht bei Hypothesen aus: "Man könnte annehmen, dass..." klingt zurückhaltender als "Man nimmt an, dass...".',
      explanationEn:
        'In academic texts, Konjunktiv II expresses caution about hypotheses: "Man könnte annehmen, dass..." (One could assume that...) sounds more tentative than "Man nimmt an, dass..." (One assumes that...).',
      explanationTr:
        'Akademik metinlerde Konjunktiv II hipotezlerde temkinliliği ifade eder: "Man könnte annehmen, dass..." ifadesi "Man nimmt an, dass..." ifadesine göre daha çekingen gelir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit7Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welche Formulierung klingt vorsichtiger?', options: ['Man könnte annehmen, dass...', 'Man nimmt an, dass...', 'Es ist bewiesen, dass...', 'Es steht fest, dass...'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Konjunktiv II ("könnte") signalisiert Vorsicht bei Hypothesen.',
      },
      {
        lessonId: c2Unit7Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie lautet die vorsichtige Konjunktiv-II-Form von 'können' für 'man'?" },
        correctAnswer: { accepted: ['könnte', 'man könnte'] },
        explanation: '"Man könnte..." ist die vorsichtige Hypothesenform.',
      },
    ],
  })

  const c2Unit7Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit7.id,
      order: 4,
      grammarTopic: 'Übung: Feinheiten des Konjunktivs',
      explanationDe:
        'Wiederholung: Konjunktiv I für neutrale Redewiedergabe, Konjunktiv II für Höflichkeit, Zweifel oder vorsichtige Hypothesen — die Wahl beeinflusst den Ton stark.',
      explanationEn:
        'Review: Konjunktiv I for neutral reported speech, Konjunktiv II for politeness, doubt, or cautious hypotheses — the choice strongly affects tone.',
      explanationTr:
        'Tekrar: nötr aktarım için Konjunktiv I, kibarlık, şüphe veya temkinli hipotezler için Konjunktiv II — seçim tonu güçlü şekilde etkiler.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit7Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: {
          lefts: ['neutrale Redewiedergabe', 'höfliche Bitte', 'vorsichtige Hypothese'],
          rights: ['Konjunktiv II (Hypothese)', 'Konjunktiv I', 'Konjunktiv II (Bitte)'],
        },
        correctAnswer: {
          pairs: [
            { left: 'neutrale Redewiedergabe', right: 'Konjunktiv I' },
            { left: 'höfliche Bitte', right: 'Konjunktiv II (Bitte)' },
            { left: 'vorsichtige Hypothese', right: 'Konjunktiv II (Hypothese)' },
          ],
        },
        explanation: 'Jede Funktion des Konjunktivs hat einen typischen Kontext.',
      },
      {
        lessonId: c2Unit7Lesson4.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['helfen', 'mir', 'Sie', 'könnten'] },
        correctAnswer: { order: ['könnten', 'Sie', 'mir', 'helfen'] },
        explanation: 'Höfliche Frage: "Könnten Sie mir helfen?"',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit7Lesson1.id, word: 'die Redewiedergabe', translationEn: 'reported speech', translationTr: 'aktarım', exampleSentence: 'Die Redewiedergabe folgt festen Regeln.' },
      { lessonId: c2Unit7Lesson1.id, word: 'der Zweifel', translationEn: 'the doubt', translationTr: 'şüphe', exampleSentence: 'Er äußerte Zweifel an der Aussage.' },
      { lessonId: c2Unit7Lesson2.id, word: 'reichen', translationEn: 'to pass / hand', translationTr: 'uzatmak', exampleSentence: 'Könnten Sie mir das Salz reichen?' },
      { lessonId: c2Unit7Lesson2.id, word: 'zurückhaltend', translationEn: 'reserved', translationTr: 'çekingen', exampleSentence: 'Er formulierte seine Bitte zurückhaltend.' },
      { lessonId: c2Unit7Lesson3.id, word: 'annehmen', translationEn: 'to assume', translationTr: 'varsaymak', exampleSentence: 'Man könnte annehmen, dass das stimmt.' },
      { lessonId: c2Unit7Lesson3.id, word: 'die Hypothese', translationEn: 'the hypothesis', translationTr: 'hipotez', exampleSentence: 'Die Hypothese wurde bestätigt.' },
      { lessonId: c2Unit7Lesson4.id, word: 'der Ton', translationEn: 'the tone', translationTr: 'ton', exampleSentence: 'Der Ton des Textes war sachlich.' },
      { lessonId: c2Unit7Lesson4.id, word: 'die Wahl', translationEn: 'the choice', translationTr: 'seçim', exampleSentence: 'Die Wahl der Wörter beeinflusst den Ton.' },
    ],
  })

  // --- C2 Unit 8: Textsortenspezifische Stile (4 lessons) ---
  const c2Unit8 = await prisma.unit.create({
    data: { levelId: c2.id, order: 8, titleDe: 'Textsortenspezifische Stile', titleEn: 'Genre-Specific Styles', titleTr: 'Metin Türüne Özgü Üsluplar' },
  })

  const c2Unit8Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit8.id,
      order: 1,
      grammarTopic: 'Der Essay',
      explanationDe:
        'Ein Essay argumentiert persönlich und reflektierend, oft in der Ich-Form, mit rhetorischen Fragen und pointierten Formulierungen.',
      explanationEn:
        'An essay argues in a personal, reflective way, often in first person, using rhetorical questions and pointed phrasing.',
      explanationTr:
        'Bir deneme kişisel ve düşünsel şekilde tartışır, genellikle birinci tekil şahısla, retorik sorular ve keskin ifadelerle.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit8Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Merkmal ist typisch für einen Essay?', options: ['persönliche, reflektierende Ich-Form', 'streng unpersönlicher Passivstil', 'reine Faktenaufzählung', 'tabellarische Darstellung'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Essays sind oft persönlich und reflektierend.',
      },
      {
        lessonId: c2Unit8Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welche Textsorte argumentiert typischerweise persönlich und reflektierend, oft in der Ich-Form?" },
        correctAnswer: { accepted: ['der essay', 'essay'] },
        explanation: 'Der Essay ist die persönliche, reflektierende Textsorte.',
      },
    ],
  })

  const c2Unit8Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit8.id,
      order: 2,
      grammarTopic: 'Der Bericht',
      explanationDe:
        'Ein Bericht ist sachlich, chronologisch und unpersönlich, oft im Passiv oder mit "man": "Zunächst wurde... Anschließend wurde...".',
      explanationEn:
        'A report is factual, chronological, and impersonal, often in passive voice or with "man": "Zunächst wurde... Anschließend wurde..." (First... was... Then... was...).',
      explanationTr:
        'Bir rapor nesnel, kronolojik ve kişisiz olur, genellikle edilgen çatı veya "man" ile: "Zunächst wurde... Anschließend wurde...".',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit8Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welcher Stil ist typisch für einen Bericht?', options: ['sachlich und chronologisch', 'persönlich und emotional', 'poetisch und bildhaft', 'sarkastisch'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Berichte sind sachlich und chronologisch.',
      },
      {
        lessonId: c2Unit8Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Zunächst ___ die Teilnehmer begrüßt. (Passiv, Präteritum)' },
        correctAnswer: { accepted: ['wurden'] },
        explanation: 'Passiv Präteritum: "wurden begrüßt".',
      },
    ],
  })

  const c2Unit8Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit8.id,
      order: 3,
      grammarTopic: 'Die Rezension',
      explanationDe:
        'Eine Rezension bewertet ein Werk (Buch, Film) mit Argumenten und einer klaren Stellungnahme, oft mit einer abschließenden Empfehlung.',
      explanationEn:
        'A review evaluates a work (book, film) with arguments and a clear stance, often ending with a recommendation.',
      explanationTr:
        'Bir eleştiri, bir eseri (kitap, film) argümanlarla ve net bir tavırla değerlendirir, genellikle bir öneriyle sona erer.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit8Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was gehört typischerweise zu einer Rezension?', options: ['eine klare Stellungnahme mit Empfehlung', 'nur eine Inhaltsangabe', 'ausschließlich Zahlen und Daten', 'ein Gesetzestext'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Rezensionen enthalten eine bewertende Stellungnahme.',
      },
      {
        lessonId: c2Unit8Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie heißt die Textsorte, die ein Buch oder einen Film bewertet?" },
        correctAnswer: { accepted: ['die rezension', 'rezension'] },
        explanation: 'Das ist die Rezension.',
      },
    ],
  })

  const c2Unit8Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit8.id,
      order: 4,
      grammarTopic: 'Übung: Textsorten im Vergleich',
      explanationDe:
        'Wiederholung: Essay (persönlich), Bericht (sachlich-chronologisch) und Rezension (bewertend) verlangen jeweils einen anderen Stil und Ton.',
      explanationEn:
        'Review: essay (personal), report (factual-chronological), and review (evaluative) each require a different style and tone.',
      explanationTr:
        'Tekrar: deneme (kişisel), rapor (nesnel-kronolojik) ve eleştiri (değerlendirici) her biri farklı bir üslup ve ton gerektirir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit8Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['persönlich, reflektierend', 'sachlich, chronologisch', 'bewertend mit Empfehlung'], rights: ['Rezension', 'Essay', 'Bericht'] },
        correctAnswer: {
          pairs: [
            { left: 'persönlich, reflektierend', right: 'Essay' },
            { left: 'sachlich, chronologisch', right: 'Bericht' },
            { left: 'bewertend mit Empfehlung', right: 'Rezension' },
          ],
        },
        explanation: 'Jede Textsorte hat einen eigenen typischen Stil.',
      },
      {
        lessonId: c2Unit8Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welche Textsorte benutzt oft Passiv und 'man' für einen unpersönlichen, chronologischen Stil?" },
        correctAnswer: { accepted: ['der bericht', 'bericht'] },
        explanation: 'Der Bericht ist sachlich und oft unpersönlich formuliert.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit8Lesson1.id, word: 'reflektierend', translationEn: 'reflective', translationTr: 'düşünsel', exampleSentence: 'Der Essay ist sehr reflektierend geschrieben.' },
      { lessonId: c2Unit8Lesson1.id, word: 'pointiert', translationEn: 'pointed / sharp', translationTr: 'keskin', exampleSentence: 'Er formulierte seine These pointiert.' },
      { lessonId: c2Unit8Lesson2.id, word: 'chronologisch', translationEn: 'chronological', translationTr: 'kronolojik', exampleSentence: 'Der Bericht ist chronologisch aufgebaut.' },
      { lessonId: c2Unit8Lesson2.id, word: 'begrüßen', translationEn: 'to greet / welcome', translationTr: 'karşılamak', exampleSentence: 'Die Gäste wurden herzlich begrüßt.' },
      { lessonId: c2Unit8Lesson3.id, word: 'die Stellungnahme', translationEn: 'the position statement', translationTr: 'görüş bildirme', exampleSentence: 'Die Rezension endet mit einer klaren Stellungnahme.' },
      { lessonId: c2Unit8Lesson3.id, word: 'die Empfehlung', translationEn: 'the recommendation', translationTr: 'tavsiye', exampleSentence: 'Am Ende steht eine klare Empfehlung.' },
      { lessonId: c2Unit8Lesson4.id, word: 'der Stil', translationEn: 'the style', translationTr: 'üslup', exampleSentence: 'Jede Textsorte hat einen eigenen Stil.' },
      { lessonId: c2Unit8Lesson4.id, word: 'unpersönlich', translationEn: 'impersonal', translationTr: 'kişisiz', exampleSentence: 'Der Bericht ist bewusst unpersönlich gehalten.' },
    ],
  })

  // --- C2 Unit 9: Sprachvarietäten & Dialekte (4 lessons) ---
  const c2Unit9 = await prisma.unit.create({
    data: { levelId: c2.id, order: 9, titleDe: 'Sprachvarietäten & Dialekte', titleEn: 'Language Varieties & Dialects', titleTr: 'Dil Çeşitleri ve Lehçeler' },
  })

  const c2Unit9Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit9.id,
      order: 1,
      grammarTopic: 'Standarddeutsch vs. Umgangssprache',
      explanationDe:
        'Standarddeutsch folgt den Regeln der Hochsprache, Umgangssprache erlaubt Verkürzungen wie "haste" (hast du) oder "isses" (ist es).',
      explanationEn:
        'Standard German follows the rules of the standard language; colloquial speech allows contractions like "haste" (hast du = do you have) or "isses" (ist es = is it).',
      explanationTr:
        'Standart Almanca, standart dilin kurallarını izler; günlük dil "haste" (hast du) veya "isses" (ist es) gibi kısaltmalara izin verir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit9Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '"Haste" ist die umgangssprachliche Form von...', options: ['hast du', 'hat er', 'habt ihr', 'haben sie'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Haste" = "hast du" in der Umgangssprache.',
      },
      {
        lessonId: c2Unit9Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne die Standardform von 'isses'." },
        correctAnswer: { accepted: ['ist es'] },
        explanation: '"Isses" ist die umgangssprachliche Verkürzung von "ist es".',
      },
    ],
  })

  const c2Unit9Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit9.id,
      order: 2,
      grammarTopic: 'Regionale Varianten (Überblick)',
      explanationDe:
        'Deutschsprachige Länder haben regionale Varianten: "Sonnabend" (norddeutsch) vs. "Samstag" (süddeutsch), "Sackerl" (österreichisch) für "Tüte".',
      explanationEn:
        'German-speaking countries have regional variants: "Sonnabend" (Northern German) vs. "Samstag" (Southern German) for Saturday, "Sackerl" (Austrian) for "Tüte" (bag).',
      explanationTr:
        'Almanca konuşulan ülkelerde bölgesel farklılıklar vardır: "Sonnabend" (kuzey Almanya) - "Samstag" (güney Almanya) "cumartesi" için, "Sackerl" (Avusturya) "Tüte" (torba) için.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit9Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Wort ist die norddeutsche Variante für "Samstag"?', options: ['Sonnabend', 'Sackerl', 'Feierabend', 'Vorabend'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Sonnabend" ist die norddeutsche Variante von "Samstag".',
      },
      {
        lessonId: c2Unit9Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'In Österreich sagt man oft "___" statt "Tüte".' },
        correctAnswer: { accepted: ['sackerl'] },
        explanation: '"Sackerl" ist österreichisches Deutsch für "Tüte".',
      },
    ],
  })

  const c2Unit9Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit9.id,
      order: 3,
      grammarTopic: 'Soziolekte und Jugendsprache',
      explanationDe:
        'Soziolekte sind gruppenspezifische Sprachformen; Jugendsprache verändert sich schnell und benutzt oft Anglizismen wie "cringe" oder "flexen".',
      explanationEn:
        'Sociolects are group-specific language forms; youth slang changes quickly and often borrows English words like "cringe" or "flexen" (to show off).',
      explanationTr:
        'Sosyolektler gruba özgü dil biçimleridir; gençlik dili hızla değişir ve "cringe" veya "flexen" gibi İngilizce kökenli kelimeleri sık kullanır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit9Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was ist ein Soziolekt?', options: ['eine gruppenspezifische Sprachform', 'eine offizielle Amtssprache', 'ein historischer Dialekt', 'eine Fremdsprache'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Ein Soziolekt ist an eine bestimmte Gruppe gebunden.',
      },
      {
        lessonId: c2Unit9Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie nennt man Sprachformen, die typisch für Jugendliche sind?" },
        correctAnswer: { accepted: ['jugendsprache', 'die jugendsprache'] },
        explanation: 'Das nennt man "Jugendsprache".',
      },
    ],
  })

  const c2Unit9Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit9.id,
      order: 4,
      grammarTopic: 'Übung: Sprachvarietäten',
      explanationDe:
        'Wiederholung: Standardsprache, Umgangssprache, regionale Varianten und Soziolekte existieren nebeneinander und werden je nach Situation gewählt.',
      explanationEn:
        'Review: standard language, colloquial speech, regional variants, and sociolects coexist and are chosen depending on the situation.',
      explanationTr:
        'Tekrar: standart dil, günlük dil, bölgesel çeşitler ve sosyolektler bir arada var olur ve duruma göre seçilir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit9Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['haste', 'Sonnabend', 'cringe'], rights: ['Jugendsprache', 'Umgangssprache', 'regionale Variante'] },
        correctAnswer: {
          pairs: [
            { left: 'haste', right: 'Umgangssprache' },
            { left: 'Sonnabend', right: 'regionale Variante' },
            { left: 'cringe', right: 'Jugendsprache' },
          ],
        },
        explanation: 'Jedes Beispiel gehört zu einer Sprachvarietät.',
      },
      {
        lessonId: c2Unit9Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne eine der vier in dieser Einheit behandelten Sprachvarietäten." },
        correctAnswer: { accepted: ['standardsprache', 'umgangssprache', 'regionale variante', 'soziolekt', 'jugendsprache', 'dialekt'] },
        explanation: 'Behandelt wurden Standardsprache, Umgangssprache, regionale Varianten und Soziolekte.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit9Lesson1.id, word: 'die Umgangssprache', translationEn: 'colloquial speech', translationTr: 'günlük dil', exampleSentence: 'In der Umgangssprache sagt man oft "haste".' },
      { lessonId: c2Unit9Lesson1.id, word: 'die Verkürzung', translationEn: 'the contraction', translationTr: 'kısaltma', exampleSentence: '"Haste" ist eine Verkürzung von "hast du".' },
      { lessonId: c2Unit9Lesson2.id, word: 'die Tüte', translationEn: 'the bag', translationTr: 'torba', exampleSentence: 'Ich brauche noch eine Tüte.' },
      { lessonId: c2Unit9Lesson2.id, word: 'regional', translationEn: 'regional', translationTr: 'bölgesel', exampleSentence: 'Das ist ein regionaler Ausdruck.' },
      { lessonId: c2Unit9Lesson3.id, word: 'der Soziolekt', translationEn: 'the sociolect', translationTr: 'sosyolekt', exampleSentence: 'Jugendsprache ist ein Soziolekt.' },
      { lessonId: c2Unit9Lesson3.id, word: 'der Anglizismus', translationEn: 'the anglicism', translationTr: 'ingilizceden alıntı', exampleSentence: '"Cringe" ist ein moderner Anglizismus.' },
      { lessonId: c2Unit9Lesson4.id, word: 'nebeneinander', translationEn: 'side by side', translationTr: 'yan yana', exampleSentence: 'Beide Formen existieren nebeneinander.' },
      { lessonId: c2Unit9Lesson4.id, word: 'die Situation', translationEn: 'the situation', translationTr: 'durum', exampleSentence: 'Die Wahl hängt von der Situation ab.' },
    ],
  })

  // --- C2 Unit 10: Wortspiel & Mehrdeutigkeit (4 lessons) ---
  const c2Unit10 = await prisma.unit.create({
    data: { levelId: c2.id, order: 10, titleDe: 'Wortspiel & Mehrdeutigkeit', titleEn: 'Wordplay & Ambiguity', titleTr: 'Kelime Oyunu ve Çok Anlamlılık' },
  })

  const c2Unit10Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit10.id,
      order: 1,
      grammarTopic: 'Homonyme und Mehrdeutigkeit',
      explanationDe:
        'Homonyme klingen gleich, bedeuten aber Verschiedenes: "die Bank" (Sitzmöbel oder Geldinstitut). Solche Wörter werden oft für Wortspiele genutzt.',
      explanationEn:
        'Homonyms sound the same but mean different things: "die Bank" (bench or financial bank). Such words are often used for wordplay.',
      explanationTr:
        'Eş sesli kelimeler aynı ses ama farklı anlamlara gelir: "die Bank" (oturma sırası veya banka). Bu tür kelimeler sık sık kelime oyunlarında kullanılır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit10Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches deutsche Wort ist ein Homonym mit zwei sehr unterschiedlichen Bedeutungen?', options: ['die Bank', 'das Haus', 'der Tisch', 'die Straße'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Die Bank" bedeutet sowohl "bench" als auch "financial bank".',
      },
      {
        lessonId: c2Unit10Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie nennt man Wörter, die gleich klingen, aber Verschiedenes bedeuten?" },
        correctAnswer: { accepted: ['homonyme', 'homonym'] },
        explanation: 'Das nennt man "Homonyme".',
      },
    ],
  })

  const c2Unit10Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit10.id,
      order: 2,
      grammarTopic: 'Wortspiele in der Werbung',
      explanationDe:
        'Werbung nutzt oft Doppeldeutigkeit für einprägsame Slogans, z. B. Wortspiele mit zusammengesetzten Wörtern oder Redewendungen, die neu interpretiert werden.',
      explanationEn:
        'Advertising often uses double meanings for memorable slogans, e.g. wordplay with compound words or idioms reinterpreted in a new way.',
      explanationTr:
        'Reklamlar akılda kalıcı sloganlar için sık sık çift anlamlılık kullanır, örn. bileşik kelimelerle veya yeniden yorumlanan deyimlerle kelime oyunları.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit10Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Warum nutzt Werbung oft Wortspiele?', options: ['um Slogans einprägsam zu machen', 'um Texte länger zu machen', 'um Grammatikfehler zu vermeiden', 'um formeller zu wirken'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Wortspiele machen Slogans einprägsamer.',
      },
      {
        lessonId: c2Unit10Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Ein Slogan mit doppelter Bedeutung nennt man ein ___. (Wortspiel)' },
        correctAnswer: { accepted: ['wortspiel'] },
        explanation: 'Ein Slogan mit doppelter Bedeutung ist ein "Wortspiel".',
      },
    ],
  })

  const c2Unit10Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit10.id,
      order: 3,
      grammarTopic: 'Wortspiele mit zusammengesetzten Wörtern',
      explanationDe:
        'Deutsche Komposita erlauben kreative Wortspiele: "Frühlingsgefühle" kann wörtlich oder übertragen ("frühlingshafte Verliebtheit") verstanden werden.',
      explanationEn:
        'German compound words allow creative wordplay: "Frühlingsgefühle" (spring feelings) can be read literally or figuratively (a springtime feeling of being in love).',
      explanationTr:
        'Almanca birleşik kelimeler yaratıcı kelime oyunlarına izin verir: "Frühlingsgefühle" hem gerçek hem mecazi ("bahara özgü aşık olma hissi") anlaşılabilir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit10Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: '"Frühlingsgefühle" kann übertragen bedeuten...', options: ['frühlingshafte Verliebtheit', 'nur kaltes Wetter', 'eine Krankheit', 'eine Jahreszeit allein'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Frühlingsgefühle" wird oft übertragen für Verliebtheit im Frühling benutzt.',
      },
      {
        lessonId: c2Unit10Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Was ermöglicht kreative Wortspiele im Deutschen besonders gut: kurze Wörter oder zusammengesetzte Wörter (Komposita)?" },
        correctAnswer: { accepted: ['komposita', 'zusammengesetzte wörter', 'zusammengesetzte worter'] },
        explanation: 'Komposita (zusammengesetzte Wörter) erlauben kreative Doppeldeutigkeit.',
      },
    ],
  })

  const c2Unit10Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit10.id,
      order: 4,
      grammarTopic: 'Übung: Wortspiel & Mehrdeutigkeit',
      explanationDe:
        'Wiederholung: Homonyme, Werbeslogans und Komposita bieten reichlich Material für Wortspiele — ein Zeichen sprachlicher Meisterschaft, sie zu erkennen und selbst zu bilden.',
      explanationEn:
        'Review: homonyms, ad slogans, and compound words offer rich material for wordplay — recognizing and creating them is a sign of linguistic mastery.',
      explanationTr:
        'Tekrar: eş sesli kelimeler, reklam sloganları ve birleşik kelimeler kelime oyunları için zengin malzeme sunar — bunları tanımak ve üretmek dil ustalığının bir işaretidir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit10Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['die Bank', 'Frühlingsgefühle', 'einprägsamer Slogan'], rights: ['Werbewortspiel', 'Homonym', 'Kompositum mit Doppeldeutigkeit'] },
        correctAnswer: {
          pairs: [
            { left: 'die Bank', right: 'Homonym' },
            { left: 'Frühlingsgefühle', right: 'Kompositum mit Doppeldeutigkeit' },
            { left: 'einprägsamer Slogan', right: 'Werbewortspiel' },
          ],
        },
        explanation: 'Jedes Beispiel zeigt eine Form von Wortspiel oder Mehrdeutigkeit.',
      },
      {
        lessonId: c2Unit10Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne ein deutsches Homonym, das sowohl 'bench' als auch 'financial bank' bedeuten kann." },
        correctAnswer: { accepted: ['die bank', 'bank'] },
        explanation: '"Die Bank" ist das klassische Beispiel für dieses Homonym.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit10Lesson1.id, word: 'das Homonym', translationEn: 'the homonym', translationTr: 'eş sesli kelime', exampleSentence: '"Die Bank" ist ein bekanntes Homonym.' },
      { lessonId: c2Unit10Lesson1.id, word: 'mehrdeutig', translationEn: 'ambiguous', translationTr: 'çok anlamlı', exampleSentence: 'Der Satz ist absichtlich mehrdeutig.' },
      { lessonId: c2Unit10Lesson2.id, word: 'der Slogan', translationEn: 'the slogan', translationTr: 'slogan', exampleSentence: 'Der Slogan bleibt lange im Kopf.' },
      { lessonId: c2Unit10Lesson2.id, word: 'doppeldeutig', translationEn: 'double-meaning', translationTr: 'çift anlamlı', exampleSentence: 'Die Werbung ist bewusst doppeldeutig.' },
      { lessonId: c2Unit10Lesson3.id, word: 'das Kompositum', translationEn: 'the compound word', translationTr: 'birleşik kelime', exampleSentence: 'Deutsche Komposita können sehr lang sein.' },
      { lessonId: c2Unit10Lesson3.id, word: 'übertragen', translationEn: 'figurative', translationTr: 'mecazi', exampleSentence: 'Das Wort wird hier übertragen benutzt.' },
      { lessonId: c2Unit10Lesson4.id, word: 'die Meisterschaft', translationEn: 'mastery', translationTr: 'ustalık', exampleSentence: 'Das zeigt sprachliche Meisterschaft.' },
      { lessonId: c2Unit10Lesson4.id, word: 'erkennen', translationEn: 'to recognize', translationTr: 'tanımak', exampleSentence: 'Er erkennt Wortspiele sofort.' },
    ],
  })

  // --- C2 Unit 11: Diskursmarker in akademischen Texten (4 lessons) ---
  const c2Unit11 = await prisma.unit.create({
    data: { levelId: c2.id, order: 11, titleDe: 'Diskursmarker in akademischen Texten', titleEn: 'Discourse Markers in Academic Texts', titleTr: 'Akademik Metinlerde Söylem İşaretleyicileri' },
  })

  const c2Unit11Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit11.id,
      order: 1,
      grammarTopic: "Diskursmarker 'mithin' und 'mithilfe'",
      explanationDe:
        '"Mithin" (folglich, also) leitet eine logische Schlussfolgerung ein; "mithilfe" (mit Hilfe von) leitet ein Mittel oder Werkzeug ein.',
      explanationEn:
        '"Mithin" (consequently, thus) introduces a logical conclusion; "mithilfe" (by means of) introduces a means or tool.',
      explanationTr:
        '"Mithin" (dolayısıyla, bu nedenle) mantıksal bir sonucu başlatır; "mithilfe" (yardımıyla) bir araç veya yöntemi başlatır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit11Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was bedeutet "mithin"?', options: ['folglich / also', 'trotzdem', 'obwohl', 'außerdem'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Mithin" bedeutet "folglich / also".',
      },
      {
        lessonId: c2Unit11Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ einer Umfrage wurden die Daten erhoben. (by means of)' },
        correctAnswer: { accepted: ['mithilfe'] },
        explanation: '"Mithilfe einer Umfrage" = "by means of a survey".',
      },
    ],
  })

  const c2Unit11Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit11.id,
      order: 2,
      grammarTopic: "Diskursmarker 'diesbezüglich' und 'diesbezüglich'",
      explanationDe:
        '"Diesbezüglich" (in dieser Hinsicht, dazu) verweist auf zuvor Gesagtes in formellen Texten: "Diesbezüglich sind weitere Untersuchungen nötig."',
      explanationEn:
        '"Diesbezüglich" (in this regard) refers back to something previously mentioned in formal texts: "Diesbezüglich sind weitere Untersuchungen nötig" (In this regard, further investigation is needed).',
      explanationTr:
        '"Diesbezüglich" (bu bakımdan) resmi metinlerde daha önce söylenene atıfta bulunur: "Diesbezüglich sind weitere Untersuchungen nötig."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit11Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was bedeutet "diesbezüglich"?', options: ['in dieser Hinsicht', 'überraschenderweise', 'dennoch', 'zunächst'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Diesbezüglich" bedeutet "in dieser Hinsicht".',
      },
      {
        lessonId: c2Unit11Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne den formellen Diskursmarker, der 'in this regard' bedeutet." },
        correctAnswer: { accepted: ['diesbezüglich'] },
        explanation: '"Diesbezüglich" bedeutet "in this regard".',
      },
    ],
  })

  const c2Unit11Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit11.id,
      order: 3,
      grammarTopic: 'Gliederungsmarker: zunächst, des Weiteren, abschließend',
      explanationDe:
        'Akademische Texte strukturieren Argumente mit Markern wie "zunächst" (Einleitung), "des Weiteren" (Fortsetzung), "abschließend" (Fazit).',
      explanationEn:
        'Academic texts structure arguments with markers like "zunächst" (firstly), "des Weiteren" (furthermore), "abschließend" (finally/in conclusion).',
      explanationTr:
        'Akademik metinler argümanları "zunächst" (öncelikle), "des Weiteren" (ayrıca), "abschließend" (sonuç olarak) gibi işaretleyicilerle yapılandırır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit11Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welcher Marker leitet ein Fazit ein?', options: ['abschließend', 'zunächst', 'des Weiteren', 'erstens'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Abschließend" leitet das Fazit ein.',
      },
      {
        lessonId: c2Unit11Lesson3.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: '___ wird das methodische Vorgehen erläutert. (firstly)' },
        correctAnswer: { accepted: ['zunächst'] },
        explanation: '"Zunächst" leitet die Einleitung ein.',
      },
    ],
  })

  const c2Unit11Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit11.id,
      order: 4,
      grammarTopic: 'Übung: Diskursmarker im akademischen Text',
      explanationDe:
        'Wiederholung: Diskursmarker wie "mithin", "diesbezüglich", "zunächst" und "abschließend" strukturieren akademische Argumentation klar und präzise.',
      explanationEn:
        'Review: discourse markers like "mithin", "diesbezüglich", "zunächst", and "abschließend" structure academic argumentation clearly and precisely.',
      explanationTr:
        'Tekrar: "mithin", "diesbezüglich", "zunächst" ve "abschließend" gibi söylem işaretleyicileri akademik argümantasyonu net ve kesin şekilde yapılandırır.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit11Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['Schlussfolgerung', 'Verweis auf Gesagtes', 'Einleitung'], rights: ['zunächst', 'mithin', 'diesbezüglich'] },
        correctAnswer: {
          pairs: [
            { left: 'Schlussfolgerung', right: 'mithin' },
            { left: 'Verweis auf Gesagtes', right: 'diesbezüglich' },
            { left: 'Einleitung', right: 'zunächst' },
          ],
        },
        explanation: 'Jeder Diskursmarker hat eine spezifische Funktion im Text.',
      },
      {
        lessonId: c2Unit11Lesson4.id,
        order: 2,
        type: 'SENTENCE_ORDER',
        data: { words: ['nötig', 'sind', 'Untersuchungen', 'diesbezüglich', 'weitere'] },
        correctAnswer: { order: ['diesbezüglich', 'sind', 'weitere', 'Untersuchungen', 'nötig'] },
        explanation: 'Diskursmarker "diesbezüglich" steht am Satzanfang, gefolgt vom Verb.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit11Lesson1.id, word: 'mithin', translationEn: 'consequently', translationTr: 'dolayısıyla', exampleSentence: 'Die Daten sind mithin nicht repräsentativ.' },
      { lessonId: c2Unit11Lesson1.id, word: 'mithilfe', translationEn: 'by means of', translationTr: 'yardımıyla', exampleSentence: 'Mithilfe einer Umfrage wurden die Daten erhoben.' },
      { lessonId: c2Unit11Lesson2.id, word: 'diesbezüglich', translationEn: 'in this regard', translationTr: 'bu bakımdan', exampleSentence: 'Diesbezüglich gibt es noch offene Fragen.' },
      { lessonId: c2Unit11Lesson2.id, word: 'die Untersuchung', translationEn: 'the investigation', translationTr: 'inceleme', exampleSentence: 'Weitere Untersuchungen sind geplant.' },
      { lessonId: c2Unit11Lesson3.id, word: 'zunächst', translationEn: 'firstly', translationTr: 'öncelikle', exampleSentence: 'Zunächst wird das Thema eingeführt.' },
      { lessonId: c2Unit11Lesson3.id, word: 'abschließend', translationEn: 'in conclusion', translationTr: 'sonuç olarak', exampleSentence: 'Abschließend lässt sich sagen, dass...' },
      { lessonId: c2Unit11Lesson4.id, word: 'präzise', translationEn: 'precise', translationTr: 'kesin', exampleSentence: 'Die Argumentation ist sehr präzise.' },
      { lessonId: c2Unit11Lesson4.id, word: 'strukturieren', translationEn: 'to structure', translationTr: 'yapılandırmak', exampleSentence: 'Diskursmarker strukturieren den Text.' },
    ],
  })

  // --- C2 Unit 12: Präzision im Ausdruck (4 lessons) ---
  const c2Unit12 = await prisma.unit.create({
    data: { levelId: c2.id, order: 12, titleDe: 'Präzision im Ausdruck', titleEn: 'Precision of Expression', titleTr: 'İfadede Hassasiyet' },
  })

  const c2Unit12Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit12.id,
      order: 1,
      grammarTopic: "Synonymdifferenzierung: 'sagen' Varianten",
      explanationDe:
        'Statt immer "sagen" zu benutzen, differenzieren Muttersprachler: "erklären" (mit Grund), "behaupten" (ohne Beweis), "betonen" (mit Nachdruck).',
      explanationEn:
        'Instead of always using "sagen" (to say), native speakers differentiate: "erklären" (to explain, with reasoning), "behaupten" (to claim, without proof), "betonen" (to emphasize).',
      explanationTr:
        'Her zaman "sagen" kullanmak yerine anadili konuşanlar ayrım yapar: "erklären" (açıklamak, gerekçeyle), "behaupten" (iddia etmek, kanıtsız), "betonen" (vurgulamak).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit12Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Verb passt zu "eine Behauptung ohne Beweis aufstellen"?', options: ['behaupten', 'erklären', 'betonen', 'fragen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Behaupten" bedeutet eine Aussage ohne Beweis machen.',
      },
      {
        lessonId: c2Unit12Lesson1.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne ein präziseres Synonym für 'sagen', das 'mit Nachdruck sagen' bedeutet." },
        correctAnswer: { accepted: ['betonen'] },
        explanation: '"Betonen" bedeutet "mit Nachdruck sagen".',
      },
    ],
  })

  const c2Unit12Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit12.id,
      order: 2,
      grammarTopic: "Synonymdifferenzierung: 'groß' Varianten",
      explanationDe:
        'Statt "groß" gibt es präzisere Wörter: "gewaltig" (sehr groß, beeindruckend), "beträchtlich" (bedeutend, messbar), "immens" (unermesslich groß).',
      explanationEn:
        'Instead of "groß" (big), there are more precise words: "gewaltig" (huge, impressive), "beträchtlich" (considerable, measurable), "immens" (immense).',
      explanationTr:
        '"Groß" yerine daha kesin kelimeler vardır: "gewaltig" (muazzam, etkileyici), "beträchtlich" (önemli, ölçülebilir), "immens" (ölçülemez büyüklükte).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit12Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Wort bedeutet "messbar bedeutend"?', options: ['beträchtlich', 'winzig', 'gewöhnlich', 'unbedeutend'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Beträchtlich" bedeutet "messbar bedeutend".',
      },
      {
        lessonId: c2Unit12Lesson2.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Die Kosten sind ___. (unermesslich groß)' },
        correctAnswer: { accepted: ['immens'] },
        explanation: '"Immens" bedeutet "unermesslich groß".',
      },
    ],
  })

  const c2Unit12Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit12.id,
      order: 3,
      grammarTopic: 'Präzise Verben statt Allgemeinbegriffe',
      explanationDe:
        'Statt "machen" präzisiert man oft: "herstellen" (produzieren), "durchführen" (ein Verfahren ausführen), "erledigen" (eine Aufgabe abschließen).',
      explanationEn:
        'Instead of "machen" (to do/make), German often uses more precise verbs: "herstellen" (to manufacture), "durchführen" (to carry out a procedure), "erledigen" (to complete a task).',
      explanationTr:
        '"Machen" yerine genellikle daha kesin fiiller kullanılır: "herstellen" (üretmek), "durchführen" (bir prosedürü yürütmek), "erledigen" (bir görevi tamamlamak).',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit12Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Verb bedeutet "ein Verfahren ausführen"?', options: ['durchführen', 'herstellen', 'erledigen', 'aufstellen'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Durchführen" bedeutet ein Verfahren auszuführen.',
      },
      {
        lessonId: c2Unit12Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne ein präziseres Verb für 'machen', das 'produzieren' bedeutet." },
        correctAnswer: { accepted: ['herstellen'] },
        explanation: '"Herstellen" bedeutet "produzieren".',
      },
    ],
  })

  const c2Unit12Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit12.id,
      order: 4,
      grammarTopic: 'Übung: Präzision im Ausdruck',
      explanationDe:
        'Wiederholung: Präzise Wortwahl (statt "sagen", "groß" oder "machen") macht Texte klarer und wirkt professioneller.',
      explanationEn:
        'Review: precise word choice (instead of "sagen", "groß", or "machen") makes texts clearer and more professional.',
      explanationTr:
        'Tekrar: kesin kelime seçimi ("sagen", "groß" veya "machen" yerine) metinleri daha net ve profesyonel kılar.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit12Lesson4.id,
        order: 1,
        type: 'MATCHING',
        data: { lefts: ['sagen (ohne Beweis)', 'groß (messbar)', 'machen (Verfahren)'], rights: ['durchführen', 'behaupten', 'beträchtlich'] },
        correctAnswer: {
          pairs: [
            { left: 'sagen (ohne Beweis)', right: 'behaupten' },
            { left: 'groß (messbar)', right: 'beträchtlich' },
            { left: 'machen (Verfahren)', right: 'durchführen' },
          ],
        },
        explanation: 'Jedes Allgemeinwort hat präzisere Alternativen.',
      },
      {
        lessonId: c2Unit12Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Warum ist präzise Wortwahl in gehobenen Texten wichtig?" },
        correctAnswer: { accepted: ['macht texte klarer', 'wirkt professioneller', 'klarer und professioneller'] },
        explanation: 'Präzise Wortwahl macht Texte klarer und professioneller.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit12Lesson1.id, word: 'behaupten', translationEn: 'to claim', translationTr: 'iddia etmek', exampleSentence: 'Er behauptet, dass er recht hat.' },
      { lessonId: c2Unit12Lesson1.id, word: 'betonen', translationEn: 'to emphasize', translationTr: 'vurgulamak', exampleSentence: 'Sie betonte die Wichtigkeit des Themas.' },
      { lessonId: c2Unit12Lesson2.id, word: 'beträchtlich', translationEn: 'considerable', translationTr: 'önemli', exampleSentence: 'Die Kosten sind beträchtlich gestiegen.' },
      { lessonId: c2Unit12Lesson2.id, word: 'immens', translationEn: 'immense', translationTr: 'muazzam', exampleSentence: 'Der Schaden war immens.' },
      { lessonId: c2Unit12Lesson3.id, word: 'herstellen', translationEn: 'to manufacture', translationTr: 'üretmek', exampleSentence: 'Die Firma stellt Autos her.' },
      { lessonId: c2Unit12Lesson3.id, word: 'erledigen', translationEn: 'to complete / handle', translationTr: 'halletmek', exampleSentence: 'Ich muss noch einige Aufgaben erledigen.' },
      { lessonId: c2Unit12Lesson4.id, word: 'die Wortwahl', translationEn: 'the word choice', translationTr: 'kelime seçimi', exampleSentence: 'Die Wortwahl beeinflusst den Eindruck.' },
      { lessonId: c2Unit12Lesson4.id, word: 'professionell', translationEn: 'professional', translationTr: 'profesyonel', exampleSentence: 'Der Text wirkt sehr professionell.' },
    ],
  })

  // --- C2 Unit 13: Wiederholung: Meisterschaft im Ausdruck (4 lessons) ---
  const c2Unit13 = await prisma.unit.create({
    data: { levelId: c2.id, order: 13, titleDe: 'Wiederholung: Meisterschaft im Ausdruck', titleEn: 'Review: Mastery of Expression', titleTr: 'Tekrar: İfadede Ustalık' },
  })

  const c2Unit13Lesson1 = await prisma.lesson.create({
    data: {
      unitId: c2Unit13.id,
      order: 1,
      grammarTopic: 'Wiederholung: Stilmittel kombinieren',
      explanationDe:
        'Meisterhafte Texte kombinieren Konnektoren, Nominalstil und rhetorische Mittel bewusst, um Wirkung und Klarheit gleichzeitig zu erzielen.',
      explanationEn:
        'Masterful texts deliberately combine connectors, nominal style, and rhetorical devices to achieve both impact and clarity.',
      explanationTr:
        'Usta metinler, hem etki hem netlik elde etmek için bağlaçları, isim stilini ve retorik araçları bilinçli olarak birleştirir.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit13Lesson1.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Was zeichnet meisterhafte Texte aus?', options: ['bewusste Kombination von Stilmitteln', 'möglichst kurze Sätze', 'nur Umgangssprache', 'zufällige Wortwahl'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Meisterhafte Texte kombinieren Stilmittel bewusst.',
      },
      {
        lessonId: c2Unit13Lesson1.id,
        order: 2,
        type: 'FILL_IN_BLANK',
        data: { sentence: 'Trotz aller Widrigkeiten, ___ wurde das Ziel erreicht. (dennoch, Konnektor)' },
        correctAnswer: { accepted: ['dennoch'] },
        explanation: '"Dennoch" verbindet einen Gegensatz auf gehobenem Niveau.',
      },
    ],
  })

  const c2Unit13Lesson2 = await prisma.lesson.create({
    data: {
      unitId: c2Unit13.id,
      order: 2,
      grammarTopic: 'Wiederholung: Register wechseln',
      explanationDe:
        'Meisterschaft zeigt sich im bewussten Wechsel zwischen Registern: formell für Berichte, persönlich für Essays, neutral für Zusammenfassungen.',
      explanationEn:
        'Mastery shows in the deliberate switching between registers: formal for reports, personal for essays, neutral for summaries.',
      explanationTr:
        'Ustalık, kayıtlar arasında bilinçli geçişte kendini gösterir: raporlar için resmi, denemeler için kişisel, özetler için nötr.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit13Lesson2.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Register passt zu einem offiziellen Bericht?', options: ['formell', 'sehr persönlich', 'sarkastisch', 'kindlich'] },
        correctAnswer: { correctIndex: 0 },
        explanation: 'Offizielle Berichte verlangen ein formelles Register.',
      },
      {
        lessonId: c2Unit13Lesson2.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welches Register passt am besten zu einem persönlichen Essay: formell oder persönlich?" },
        correctAnswer: { accepted: ['persönlich'] },
        explanation: 'Essays sind typischerweise persönlicher formuliert.',
      },
    ],
  })

  const c2Unit13Lesson3 = await prisma.lesson.create({
    data: {
      unitId: c2Unit13.id,
      order: 3,
      grammarTopic: 'Wiederholung: Konjunktiv, Nominalstil und Präzision im Zusammenspiel',
      explanationDe:
        'Ein meisterhafter Satz kann Konjunktiv II (Vorsicht), Nominalstil (Formalität) und präzise Wortwahl gleichzeitig zeigen: "Man könnte die Durchführung des Projekts als beträchtlichen Erfolg werten."',
      explanationEn:
        'A masterful sentence can show Konjunktiv II (caution), nominal style (formality), and precise word choice all at once: "Man könnte die Durchführung des Projekts als beträchtlichen Erfolg werten" (One could regard the execution of the project as a considerable success).',
      explanationTr:
        'Usta bir cümle Konjunktiv II (temkin), isim stili (resmiyet) ve kesin kelime seçimini aynı anda gösterebilir: "Man könnte die Durchführung des Projekts als beträchtlichen Erfolg werten."',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit13Lesson3.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Welches Wort im Beispielsatz zeigt Nominalstil?', options: ['die Durchführung', 'könnte', 'als', 'man'] },
        correctAnswer: { correctIndex: 0 },
        explanation: '"Die Durchführung" ist die Nominalisierung von "durchführen".',
      },
      {
        lessonId: c2Unit13Lesson3.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Welche Verbform in 'Man könnte...werten' zeigt vorsichtige Distanz?" },
        correctAnswer: { accepted: ['könnte', 'konjunktiv ii'] },
        explanation: '"Könnte" ist Konjunktiv II und signalisiert Vorsicht.',
      },
    ],
  })

  const c2Unit13Lesson4 = await prisma.lesson.create({
    data: {
      unitId: c2Unit13.id,
      order: 4,
      grammarTopic: 'Abschlussübung: Meisterschaft im Ausdruck',
      explanationDe:
        'Abschließende Wiederholung des gesamten C2-Kurses: gehobene Konnektoren, Nominalstil, Rhetorik, Register, Sprachvarietäten, Diskursmarker und Präzision bilden zusammen sprachliche Meisterschaft.',
      explanationEn:
        'Final review of the whole C2 course: elevated connectors, nominal style, rhetoric, register, language varieties, discourse markers, and precision together constitute linguistic mastery.',
      explanationTr:
        'Tüm C2 kursunun son tekrarı: üst düzey bağlaçlar, isim stili, retorik, kayıt, dil çeşitleri, söylem işaretleyicileri ve hassasiyet birlikte dil ustalığını oluşturur.',
    },
  })
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: c2Unit13Lesson4.id,
        order: 1,
        type: 'SENTENCE_ORDER',
        data: { words: ['werten', 'als', 'Erfolg', 'beträchtlichen', 'man', 'könnte', 'das'] },
        correctAnswer: { order: ['man', 'könnte', 'das', 'als', 'beträchtlichen', 'Erfolg', 'werten'] },
        explanation: 'Modalverb "könnte" + Objekt + "als" + Adjektiv + Nomen + Infinitiv am Ende.',
      },
      {
        lessonId: c2Unit13Lesson4.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Nenne zwei Elemente, die zusammen sprachliche Meisterschaft auf C2-Niveau ausmachen." },
        correctAnswer: { accepted: ['konnektoren und nominalstil', 'nominalstil und rhetorik', 'register und präzision', 'präzision und rhetorik', 'konnektoren und präzision'] },
        explanation: 'Meisterschaft entsteht aus dem Zusammenspiel mehrerer Stilmittel wie Konnektoren, Nominalstil, Rhetorik, Register und Präzision.',
      },
    ],
  })

  await prisma.vocabWord.createMany({
    data: [
      { lessonId: c2Unit13Lesson1.id, word: 'die Widrigkeit', translationEn: 'the adversity', translationTr: 'zorluk', exampleSentence: 'Trotz aller Widrigkeiten hat sie es geschafft.' },
      { lessonId: c2Unit13Lesson1.id, word: 'die Klarheit', translationEn: 'the clarity', translationTr: 'netlik', exampleSentence: 'Die Klarheit des Textes wurde gelobt.' },
      { lessonId: c2Unit13Lesson2.id, word: 'das Register', translationEn: 'the register', translationTr: 'kayıt/üslup düzeyi', exampleSentence: 'Das Register muss zur Situation passen.' },
      { lessonId: c2Unit13Lesson2.id, word: 'die Zusammenfassung', translationEn: 'the summary', translationTr: 'özet', exampleSentence: 'Die Zusammenfassung ist neutral formuliert.' },
      { lessonId: c2Unit13Lesson3.id, word: 'werten', translationEn: 'to regard / evaluate', translationTr: 'değerlendirmek', exampleSentence: 'Man könnte das als Erfolg werten.' },
      { lessonId: c2Unit13Lesson3.id, word: 'der Erfolg', translationEn: 'the success', translationTr: 'başarı', exampleSentence: 'Das Projekt war ein großer Erfolg.' },
      { lessonId: c2Unit13Lesson4.id, word: 'das Zusammenspiel', translationEn: 'the interplay', translationTr: 'etkileşim', exampleSentence: 'Das Zusammenspiel der Stilmittel ist beeindruckend.' },
      { lessonId: c2Unit13Lesson4.id, word: 'ausmachen', translationEn: 'to constitute / make up', translationTr: 'oluşturmak', exampleSentence: 'Mehrere Elemente machen die Meisterschaft aus.' },
    ],
  })

  console.log('Seed complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
