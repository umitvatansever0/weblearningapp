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
      explanationDe:
        'Man begrüßt sich je nach Tageszeit unterschiedlich: "Guten Morgen" am Morgen, "Guten Tag" tagsüber, "Guten Abend" am Abend. "Hallo" passt informell zu jeder Zeit.',
      explanationEn:
        'Greetings differ by time of day: "Guten Morgen" (good morning), "Guten Tag" (good day), "Guten Abend" (good evening). "Hallo" (hello) works informally at any time.',
      explanationTr:
        'Selamlaşma günün saatine göre değişir: sabah "Guten Morgen", gün içinde "Guten Tag", akşam "Guten Abend". "Hallo" ise günün her saati kullanılabilecek resmi olmayan bir selamlaşmadır.',
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
      explanationDe:
        'Das Verb "sein" wird konjugiert: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind. Man benutzt es auch, um sich vorzustellen: "Ich bin Anna."',
      explanationEn:
        'The verb "sein" (to be) conjugates as: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind. It is also used to introduce yourself: "Ich bin Anna" (I am Anna).',
      explanationTr:
        '"Sein" (olmak) fiili şöyle çekimlenir: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind. Kendini tanıtmak için de kullanılır: "Ich bin Anna" (Ben Anna\'yım).',
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
      explanationDe: 'Die Zahlen von 1 bis 10 auf Deutsch: eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn.',
      explanationEn: 'The numbers from 1 to 10 in German: eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn.',
      explanationTr: 'Almanca 1\'den 10\'a kadar sayılar: eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn.',
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
      explanationDe:
        'Um zu sagen, woher man kommt, benutzt man "kommen aus" + Land. Um zu sagen, wo man wohnt, benutzt man "wohnen in" + Stadt. Beispiel: "Ich komme aus Deutschland. Ich wohne in Berlin."',
      explanationEn:
        'To say where you\'re from, use "kommen aus" + country. To say where you live, use "wohnen in" + city. Example: "Ich komme aus Deutschland. Ich wohne in Berlin." (I come from Germany. I live in Berlin.)',
      explanationTr:
        'Nereli olduğunuzu söylemek için "kommen aus" + ülke kullanılır. Nerede yaşadığınızı söylemek için "wohnen in" + şehir kullanılır. Örnek: "Ich komme aus Deutschland. Ich wohne in Berlin." (Almanya\'dan geliyorum. Berlin\'de yaşıyorum.)',
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
      explanationDe:
        'Jedes deutsche Nomen hat ein Genus: maskulin (der), feminin (die) oder neutral (das). Zum Beispiel: der Mann, die Frau, das Kind.',
      explanationEn:
        'Every German noun has a gender: masculine (der), feminine (die), or neuter (das). For example: der Mann (the man), die Frau (the woman), das Kind (the child).',
      explanationTr:
        'Her Almanca isim bir cinsiyete sahiptir: eril (der), dişil (die) ya da nötr (das). Örneğin: der Mann (adam), die Frau (kadın), das Kind (çocuk).',
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
      explanationDe:
        'Der unbestimmte Artikel lautet "ein" für maskulin/neutral und "eine" für feminin: ein Mann, eine Frau, ein Kind.',
      explanationEn:
        'The indefinite article is "ein" for masculine/neuter and "eine" for feminine: ein Mann (a man), eine Frau (a woman), ein Kind (a child).',
      explanationTr:
        'Belirsiz tanımlık eril/nötr için "ein", dişil için "eine" olur: ein Mann (bir adam), eine Frau (bir kadın), ein Kind (bir çocuk).',
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
      explanationDe:
        'Deutsche Nomen bilden den Plural unterschiedlich, oft mit -e, -er, -n/-en oder -s: der Tisch → die Tische, das Kind → die Kinder, die Frau → die Frauen. Im Plural benutzt man immer "die".',
      explanationEn:
        'German nouns form the plural in different ways, often with -e, -er, -n/-en, or -s: der Tisch → die Tische (tables), das Kind → die Kinder (children), die Frau → die Frauen (women). The plural article is always "die".',
      explanationTr:
        'Almanca isimler çoğulu farklı şekillerde yapar, genellikle -e, -er, -n/-en ya da -s ekleriyle: der Tisch → die Tische (masalar), das Kind → die Kinder (çocuklar), die Frau → die Frauen (kadınlar). Çoğulda her zaman "die" kullanılır.',
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
      explanationDe:
        'Nomen mit unbestimmtem oder ohne Artikel werden mit "kein/keine" verneint: Ich habe kein Buch. Ich habe keine Zeit.',
      explanationEn:
        'Nouns with an indefinite or no article are negated with "kein/keine": Ich habe kein Buch (I don\'t have a book). Ich habe keine Zeit (I don\'t have time).',
      explanationTr:
        'Belirsiz ya da tanımlıksız isimler "kein/keine" ile olumsuz yapılır: Ich habe kein Buch (Kitabım yok). Ich habe keine Zeit (Vaktim yok).',
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
      explanationDe:
        'Die Personalpronomen im Deutschen sind: ich, du, er/sie/es, wir, ihr, sie/Sie. "Sie" (groß geschrieben) ist die höfliche Anrede.',
      explanationEn:
        'The personal pronouns in German are: ich, du, er/sie/es, wir, ihr, sie/Sie. Capitalized "Sie" is the polite form of address.',
      explanationTr:
        'Almancada şahıs zamirleri şunlardır: ich, du, er/sie/es, wir, ihr, sie/Sie. Büyük yazılan "Sie" saygı ifadesidir.',
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
      explanationDe:
        'Regelmäßige Verben im Präsens: Stamm + Endung. "spielen": ich spiele, du spielst, er spielt, wir spielen, ihr spielt, sie spielen.',
      explanationEn:
        'Regular verbs in the present tense: stem + ending. "spielen" (to play): ich spiele, du spielst, er spielt, wir spielen, ihr spielt, sie spielen.',
      explanationTr:
        'Düzenli fiillerde şimdiki zaman: gövde + ek. "spielen" (oynamak): ich spiele, du spielst, er spielt, wir spielen, ihr spielt, sie spielen.',
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
      explanationDe: '"haben" ist unregelmäßig: ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.',
      explanationEn: '"haben" (to have) is irregular: ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.',
      explanationTr: '"haben" (sahip olmak) düzensizdir: ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.',
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
      explanationDe:
        'W-Fragen beginnen mit einem Fragewort (wer, was, wo, wann, wie) und haben das Verb an zweiter Stelle: "Wo wohnst du?" "Wie heißt du?"',
      explanationEn:
        'W-questions start with a question word (wer=who, was=what, wo=where, wann=when, wie=how) and put the verb second: "Wo wohnst du?" (Where do you live?), "Wie heißt du?" (What\'s your name?)',
      explanationTr:
        'W-soruları bir soru kelimesiyle başlar (wer=kim, was=ne, wo=nerede, wann=ne zaman, wie=nasıl) ve fiil ikinci sırada gelir: "Wo wohnst du?" (Nerede oturuyorsun?), "Wie heißt du?" (Adın ne?)',
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
      explanationDe: 'Wichtige Familienwörter: der Vater, die Mutter, der Bruder, die Schwester, die Eltern, die Geschwister.',
      explanationEn:
        'Important family words: der Vater (father), die Mutter (mother), der Bruder (brother), die Schwester (sister), die Eltern (parents), die Geschwister (siblings).',
      explanationTr:
        'Önemli aile kelimeleri: der Vater (baba), die Mutter (anne), der Bruder (erkek kardeş), die Schwester (kız kardeş), die Eltern (ebeveynler), die Geschwister (kardeşler).',
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
      explanationDe:
        'Possessivartikel zeigen Besitz: mein/meine (my), dein/deine (your). Bei maskulin/neutral: mein Vater, mein Kind. Bei feminin: meine Mutter.',
      explanationEn:
        'Possessive articles show ownership: mein/meine (my), dein/deine (your). With masculine/neuter: mein Vater, mein Kind. With feminine: meine Mutter.',
      explanationTr:
        'İyelik sıfatları sahipliği gösterir: mein/meine (benim), dein/deine (senin). Eril/nötr ile: mein Vater, mein Kind. Dişil ile: meine Mutter.',
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
      explanationDe:
        'Ja/Nein-Fragen beginnen mit dem Verb: "Hast du Geschwister?" "Ja, ich habe eine Schwester." / "Nein, ich habe keine Geschwister."',
      explanationEn:
        'Yes/no questions start with the verb: "Hast du Geschwister?" (Do you have siblings?) "Ja, ich habe eine Schwester." (Yes, I have a sister.) / "Nein, ich habe keine Geschwister." (No, I don\'t have siblings.)',
      explanationTr:
        'Evet/hayır soruları fiille başlar: "Hast du Geschwister?" (Kardeşin var mı?) "Ja, ich habe eine Schwester." (Evet, bir kız kardeşim var.) / "Nein, ich habe keine Geschwister." (Hayır, kardeşim yok.)',
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
      explanationDe:
        'Wiederholung: Kombiniere Artikel, Possessivpronomen und Präsens, um über deine Familie zu sprechen: "Meine Schwester wohnt in München. Sie spielt gern Fußball."',
      explanationEn:
        'Review: combine articles, possessives, and present tense to talk about your family: "Meine Schwester wohnt in München. Sie spielt gern Fußball." (My sister lives in Munich. She likes to play football.)',
      explanationTr:
        'Tekrar: aile hakkında konuşmak için tanımlık, iyelik sıfatı ve şimdiki zamanı birleştir: "Meine Schwester wohnt in München. Sie spielt gern Fußball." (Kız kardeşim Münih\'te yaşıyor. Futbol oynamayı seviyor.)',
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
      explanationDe:
        'Zahlen ab 11: elf, zwölf, dreizehn... zwanzig, dreißig... hundert. Ab 21 sagt man die Einer vor den Zehnern: einundzwanzig (21).',
      explanationEn:
        'Numbers from 11: elf (11), zwölf (12), dreizehn (13)... zwanzig (20), dreißig (30)... hundert (100). From 21 on, the units come before the tens: einundzwanzig (21, literally "one-and-twenty").',
      explanationTr:
        "11'den itibaren sayılar: elf (11), zwölf (12), dreizehn (13)... zwanzig (20), dreißig (30)... hundert (100). 21'den itibaren birler onlardan önce söylenir: einundzwanzig (21, kelimenin tam anlamıyla 'bir-ve-yirmi').",
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
      explanationDe:
        'Die Uhrzeit fragt man mit "Wie spät ist es?" oder "Wie viel Uhr ist es?". Antwort: "Es ist drei Uhr." / "Es ist halb vier." (3:30)',
      explanationEn:
        'You ask the time with "Wie spät ist es?" or "Wie viel Uhr ist es?" (What time is it?). Answer: "Es ist drei Uhr." (It\'s three o\'clock.) / "Es ist halb vier." (It\'s half past three, literally "half four".)',
      explanationTr:
        "Saat 'Wie spät ist es?' ya da 'Wie viel Uhr ist es?' diye sorulur. Cevap: 'Es ist drei Uhr.' (Saat üç.) / 'Es ist halb vier.' (Üç buçuk, kelimenin tam anlamıyla 'dördün yarısı'.)",
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
      explanationDe:
        'Die Wochentage: Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag. "Am Montag" bedeutet "on Monday".',
      explanationEn:
        'The days of the week: Montag (Monday), Dienstag (Tuesday), Mittwoch (Wednesday), Donnerstag (Thursday), Freitag (Friday), Samstag (Saturday), Sonntag (Sunday). "Am Montag" means "on Monday".',
      explanationTr:
        "Haftanın günleri: Montag (Pazartesi), Dienstag (Salı), Mittwoch (Çarşamba), Donnerstag (Perşembe), Freitag (Cuma), Samstag (Cumartesi), Sonntag (Pazar). 'Am Montag' 'Pazartesi günü' demektir.",
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
      explanationDe:
        'Um den Tagesablauf zu beschreiben, benutzt man Zeitangaben mit Verben: "Ich esse um acht Uhr Frühstück. Ich arbeite von neun bis siebzehn Uhr."',
      explanationEn:
        'To describe your daily routine, use time expressions with verbs: "Ich esse um acht Uhr Frühstück." (I eat breakfast at eight o\'clock.) "Ich arbeite von neun bis siebzehn Uhr." (I work from nine to five.)',
      explanationTr:
        "Günlük rutini anlatmak için zaman ifadeleriyle fiiller kullanılır: 'Ich esse um acht Uhr Frühstück.' (Saat sekizde kahvaltı yaparım.) 'Ich arbeite von neun bis siebzehn Uhr.' (Dokuzdan beşe kadar çalışırım.)",
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
      explanationDe:
        'Im Akkusativ ändert sich nur der maskuline Artikel: der → den. Feminin, neutral und Plural bleiben gleich: Ich sehe den Mann / die Frau / das Kind.',
      explanationEn:
        'In the accusative, only the masculine article changes: der → den. Feminine, neuter, and plural stay the same: Ich sehe den Mann (I see the man) / die Frau / das Kind.',
      explanationTr:
        'Akkusativde sadece eril tanımlık değişir: der → den. Dişil, nötr ve çoğul aynı kalır: Ich sehe den Mann (Adamı görüyorum) / die Frau / das Kind.',
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
      explanationDe:
        'Auch die Personalpronomen ändern sich im Akkusativ: ich→mich, du→dich, er→ihn, sie→sie, es→es, wir→uns, ihr→euch, sie/Sie→sie/Sie.',
      explanationEn:
        'Personal pronouns also change in the accusative: ich→mich (me), du→dich (you), er→ihn (him), sie→sie (her), es→es (it), wir→uns (us), ihr→euch (you pl.), sie/Sie→sie/Sie (them/you formal).',
      explanationTr:
        'Şahıs zamirleri de akkusativde değişir: ich→mich (beni), du→dich (seni), er→ihn (onu), sie→sie (onu), es→es (onu), wir→uns (bizi), ihr→euch (sizi), sie/Sie→sie/Sie (onları/sizi).',
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
      explanationDe:
        'Viele Verben brauchen ein Akkusativobjekt: haben, brauchen, möchten, kaufen. "Ich brauche einen Stift." "Ich möchte einen Kaffee."',
      explanationEn:
        'Many verbs take an accusative object: haben (to have), brauchen (to need), möchten (would like), kaufen (to buy). "Ich brauche einen Stift." (I need a pen.) "Ich möchte einen Kaffee." (I would like a coffee.)',
      explanationTr:
        'Birçok fiil akkusativ nesne alır: haben (sahip olmak), brauchen (ihtiyaç duymak), möchten (istemek), kaufen (satın almak). "Ich brauche einen Stift." (Bir kaleme ihtiyacım var.) "Ich möchte einen Kaffee." (Bir kahve istiyorum.)',
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
      explanationDe:
        '"nicht" verneint Verben, Adjektive oder ganze Sätze (nicht Nomen mit unbestimmtem Artikel, dafür "kein"): "Ich verstehe das nicht." "Das ist nicht richtig."',
      explanationEn:
        '"nicht" negates verbs, adjectives, or whole sentences (not nouns with an indefinite article — use "kein" for that): "Ich verstehe das nicht." (I don\'t understand that.) "Das ist nicht richtig." (That\'s not correct.)',
      explanationTr:
        '"nicht" fiilleri, sıfatları ya da tüm cümleyi olumsuz yapar (belirsiz tanımlıklı isimler için değil, onun için "kein" kullanılır): "Ich verstehe das nicht." (Bunu anlamıyorum.) "Das ist nicht richtig." (Bu doğru değil.)',
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
      explanationDe:
        'Modalverben sind unregelmäßig und stehen mit dem Infinitiv am Satzende: "Ich kann schwimmen." "Du musst arbeiten."',
      explanationEn:
        'Modal verbs are irregular and pair with an infinitive at the end of the sentence: "Ich kann schwimmen." (I can swim.) "Du musst arbeiten." (You must work.)',
      explanationTr:
        'Kip fiilleri düzensizdir ve cümle sonunda mastar ile kullanılır: "Ich kann schwimmen." (Yüzebilirim.) "Du musst arbeiten." (Çalışmak zorundasın.)',
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
      explanationDe:
        '"wollen" drückt einen starken Wunsch aus, "möchten" ist höflicher: "Ich will Pizza essen." "Ich möchte einen Kaffee." "dürfen" bedeutet Erlaubnis: "Darf ich rauchen?"',
      explanationEn:
        '"wollen" expresses a strong want, "möchten" is more polite: "Ich will Pizza essen." (I want to eat pizza.) "Ich möchte einen Kaffee." (I would like a coffee.) "dürfen" means permission: "Darf ich rauchen?" (May I smoke?)',
      explanationTr:
        '"wollen" güçlü bir isteği ifade eder, "möchten" daha kibardır: "Ich will Pizza essen." (Pizza yemek istiyorum.) "Ich möchte einen Kaffee." (Bir kahve istiyorum.) "dürfen" izin anlamına gelir: "Darf ich rauchen?" (Sigara içebilir miyim?)',
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
      explanationDe: 'Das Modalverb steht an Position 2, der Infinitiv am Satzende: "Ich möchte heute Abend ins Kino gehen."',
      explanationEn:
        'The modal verb is in position 2, the infinitive goes at the end: "Ich möchte heute Abend ins Kino gehen." (I would like to go to the cinema tonight.)',
      explanationTr:
        'Kip fiili 2. konumda, mastar cümle sonunda yer alır: "Ich möchte heute Abend ins Kino gehen." (Bu akşam sinemaya gitmek istiyorum.)',
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
      explanationDe:
        'Im Restaurant oder Café benutzt man "Ich möchte..." für Bestellungen: "Ich möchte ein Wasser, bitte." "Ich hätte gern einen Kaffee."',
      explanationEn:
        'In a restaurant or café, use "Ich möchte..." to order: "Ich möchte ein Wasser, bitte." (I\'d like a water, please.) "Ich hätte gern einen Kaffee." (I\'d like a coffee.)',
      explanationTr:
        'Restoranda ya da kafede sipariş vermek için "Ich möchte..." kullanılır: "Ich möchte ein Wasser, bitte." (Bir su istiyorum, lütfen.) "Ich hätte gern einen Kaffee." (Bir kahve rica ederim.)',
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
      explanationDe:
        'Trennbare Verben haben ein Präfix, das im Präsens ans Satzende wandert: "aufstehen" → "Ich stehe früh auf."',
      explanationEn:
        'Separable verbs have a prefix that moves to the end of the sentence in the present tense: "aufstehen" (to get up) → "Ich stehe früh auf." (I get up early.)',
      explanationTr:
        'Ayrılabilir fiillerin bir ön eki vardır ve şimdiki zamanda cümle sonuna gider: "aufstehen" (kalkmak) → "Ich stehe früh auf." (Erken kalkarım.)',
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
      explanationDe:
        'Weitere trennbare Verben: "einkaufen" (Ich kaufe Gemüse ein), "fernsehen" (Er sieht abends fern), "anrufen" (Sie ruft ihre Mutter an).',
      explanationEn:
        'More separable verbs: "einkaufen" (to shop) — Ich kaufe Gemüse ein. "fernsehen" (to watch TV) — Er sieht abends fern. "anrufen" (to call) — Sie ruft ihre Mutter an.',
      explanationTr:
        'Diğer ayrılabilir fiiller: "einkaufen" (alışveriş yapmak) — Ich kaufe Gemüse ein. "fernsehen" (televizyon izlemek) — Er sieht abends fern. "anrufen" (aramak) — Sie ruft ihre Mutter an.',
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
      explanationDe: 'Zeitangaben stehen meist nach dem konjugierten Verb: "Ich stehe täglich um sieben Uhr auf."',
      explanationEn:
        'Time expressions usually come right after the conjugated verb: "Ich stehe täglich um sieben Uhr auf." (I get up at seven o\'clock every day.)',
      explanationTr:
        'Zaman ifadeleri genellikle çekimli fiilden hemen sonra gelir: "Ich stehe täglich um sieben Uhr auf." (Her gün saat yedide kalkarım.)',
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
      explanationDe:
        'Wiederholung: trennbare Verben im Alltag. "Wann stehst du auf?" "Ich stehe um acht Uhr auf und kaufe dann Brot ein."',
      explanationEn:
        'Review: separable verbs in daily life. "Wann stehst du auf?" (When do you get up?) "Ich stehe um acht Uhr auf und kaufe dann Brot ein." (I get up at eight and then buy bread.)',
      explanationTr:
        'Tekrar: günlük hayatta ayrılabilir fiiller. "Wann stehst du auf?" (Ne zaman kalkarsın?) "Ich stehe um acht Uhr auf und kaufe dann Brot ein." (Saat sekizde kalkarım ve sonra ekmek alırım.)',
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
      explanationDe:
        'Im Dativ ändern sich die Artikel: der→dem, die→der, das→dem, die (Plural)→den. Beispiel: "Ich helfe dem Mann."',
      explanationEn:
        'In the dative, the articles change: der→dem, die→der, das→dem, die (plural)→den. Example: "Ich helfe dem Mann." (I help the man.)',
      explanationTr:
        'Datifte tanımlıklar değişir: der→dem, die→der, das→dem, die (çoğul)→den. Örnek: "Ich helfe dem Mann." (Adama yardım ediyorum.)',
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
      explanationDe:
        'Feste Präpositionen mit Dativ: aus, bei, mit, nach, seit, von, zu. "Ich fahre mit dem Bus." "Ich komme aus der Türkei."',
      explanationEn:
        'Fixed dative prepositions: aus, bei, mit, nach, seit, von, zu. "Ich fahre mit dem Bus." (I travel by bus.) "Ich komme aus der Türkei." (I come from Turkey.)',
      explanationTr:
        'Sabit datif edatları: aus, bei, mit, nach, seit, von, zu. "Ich fahre mit dem Bus." (Otobüsle giderim.) "Ich komme aus der Türkei." (Türkiye\'den geliyorum.)',
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
      explanationDe:
        'Wechselpräpositionen (in, an, auf...) stehen mit Akkusativ bei Bewegung (wohin?) und mit Dativ bei Ort (wo?): "Ich gehe in die Küche" (Akkusativ) vs. "Ich bin in der Küche" (Dativ).',
      explanationEn:
        'Two-way prepositions (in, an, auf...) take accusative for movement (wohin? = where to?) and dative for location (wo? = where?): "Ich gehe in die Küche" (accusative) vs. "Ich bin in der Küche" (dative).',
      explanationTr:
        'İki yönlü edatlar (in, an, auf...) hareket için akkusativ (wohin? = nereye?), konum için datif (wo? = nerede?) alır: "Ich gehe in die Küche" (akkusativ) ile "Ich bin in der Küche" (datif) karşılaştırın.',
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
      explanationDe: 'Wörter für die Wohnung: das Wohnzimmer, das Schlafzimmer, das Badezimmer, die Küche, der Balkon.',
      explanationEn:
        'Words for the apartment: das Wohnzimmer (living room), das Schlafzimmer (bedroom), das Badezimmer (bathroom), die Küche (kitchen), der Balkon (balcony).',
      explanationTr:
        'Ev için kelimeler: das Wohnzimmer (oturma odası), das Schlafzimmer (yatak odası), das Badezimmer (banyo), die Küche (mutfak), der Balkon (balkon).',
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
      explanationDe: 'Wichtige Lebensmittel: das Brot, der Käse, die Milch, das Obst, das Gemüse, der Reis.',
      explanationEn:
        'Important food items: das Brot (bread), der Käse (cheese), die Milch (milk), das Obst (fruit), das Gemüse (vegetables), der Reis (rice).',
      explanationTr:
        'Önemli gıda maddeleri: das Brot (ekmek), der Käse (peynir), die Milch (süt), das Obst (meyve), das Gemüse (sebze), der Reis (pirinç).',
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
      explanationDe:
        'Beim Einkaufen benutzt man Mengenangaben: "ein Kilo Äpfel", "ein Liter Milch", "ein Stück Käse". Höflich bestellt man mit "Ich hätte gern..."',
      explanationEn:
        'When shopping, use quantity expressions: "ein Kilo Äpfel" (a kilo of apples), "ein Liter Milch" (a liter of milk), "ein Stück Käse" (a piece of cheese). Order politely with "Ich hätte gern..." (I\'d like...)',
      explanationTr:
        'Alışverişte miktar ifadeleri kullanılır: "ein Kilo Äpfel" (bir kilo elma), "ein Liter Milch" (bir litre süt), "ein Stück Käse" (bir parça peynir). Kibarca sipariş için "Ich hätte gern..." (İsterim...) kullanılır.',
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
      explanationDe:
        'Im Restaurant fragt der Kellner: "Was möchten Sie?" Man antwortet: "Ich hätte gern die Suppe." Am Ende sagt man: "Die Rechnung, bitte."',
      explanationEn:
        'In a restaurant, the waiter asks: "Was möchten Sie?" (What would you like?) You answer: "Ich hätte gern die Suppe." (I\'d like the soup.) At the end you say: "Die Rechnung, bitte." (The bill, please.)',
      explanationTr:
        'Restoranda garson sorar: "Was möchten Sie?" (Ne istersiniz?) Cevap: "Ich hätte gern die Suppe." (Çorba istiyorum.) Sonunda "Die Rechnung, bitte." (Hesap lütfen.) denir.',
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
      explanationDe:
        'Wiederholung: Einkaufen und Bestellen. "Ich gehe einkaufen. Ich kaufe Brot, Käse und Milch. Im Café hätte ich gern einen Kaffee."',
      explanationEn:
        'Review: shopping and ordering. "Ich gehe einkaufen." (I go shopping.) "Ich kaufe Brot, Käse und Milch." (I buy bread, cheese, and milk.) "Im Café hätte ich gern einen Kaffee." (At the café I\'d like a coffee.)',
      explanationTr:
        'Tekrar: alışveriş ve sipariş verme. "Ich gehe einkaufen." (Alışverişe gidiyorum.) "Ich kaufe Brot, Käse und Milch." (Ekmek, peynir ve süt alıyorum.) "Im Café hätte ich gern einen Kaffee." (Kafede bir kahve isterim.)',
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
      explanationDe:
        'Das Perfekt bildet man mit "haben" oder "sein" + Partizip II. Die meisten Verben nehmen "haben": "Ich habe gegessen. Du hast gearbeitet."',
      explanationEn:
        'The Perfekt (past tense) is formed with "haben" or "sein" + past participle. Most verbs take "haben": "Ich habe gegessen." (I have eaten.) "Du hast gearbeitet." (You have worked.)',
      explanationTr:
        'Perfekt (geçmiş zaman) "haben" ya da "sein" + Partizip II ile kurulur. Çoğu fiil "haben" alır: "Ich habe gegessen." (Yedim.) "Du hast gearbeitet." (Çalıştın.)',
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
      explanationDe:
        'Verben der Bewegung oder Zustandsänderung bilden das Perfekt mit "sein": "Ich bin gegangen. Er ist gekommen."',
      explanationEn:
        'Verbs of movement or change of state form the Perfekt with "sein": "Ich bin gegangen." (I have gone.) "Er ist gekommen." (He has come.)',
      explanationTr:
        'Hareket ya da durum değişikliği bildiren fiiller Perfekt\'i "sein" ile kurar: "Ich bin gegangen." (Gittim.) "Er ist gekommen." (Geldi.)',
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
      explanationDe:
        'Regelmäßige Verben bilden das Partizip II mit ge-...-t: spielen→gespielt. Unregelmäßige Verben oft mit ge-...-en, manchmal mit Vokalwechsel: lesen→gelesen, trinken→getrunken.',
      explanationEn:
        'Regular verbs form the past participle with ge-...-t: spielen→gespielt. Irregular verbs often use ge-...-en, sometimes with a vowel change: lesen→gelesen, trinken→getrunken.',
      explanationTr:
        'Düzenli fiiller Partizip II\'yi ge-...-t ile kurar: spielen→gespielt. Düzensiz fiiller genellikle ge-...-en kullanır, bazen ünlü değişimiyle: lesen→gelesen, trinken→getrunken.',
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
      explanationDe:
        'Wiederholung: Perfekt mit "haben" und "sein". "Gestern bin ich ins Kino gegangen. Ich habe einen Film gesehen."',
      explanationEn:
        'Review: Perfekt with "haben" and "sein". "Gestern bin ich ins Kino gegangen." (Yesterday I went to the cinema.) "Ich habe einen Film gesehen." (I saw a movie.)',
      explanationTr:
        'Tekrar: "haben" ve "sein" ile Perfekt. "Gestern bin ich ins Kino gegangen." (Dün sinemaya gittim.) "Ich habe einen Film gesehen." (Bir film izledim.)',
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

  // --- C1: Indirekte Rede (1 sample lesson) ---
  const c1Unit = await prisma.unit.create({
    data: { levelId: c1.id, order: 1, titleDe: 'Indirekte Rede', titleEn: 'Reported Speech', titleTr: 'Dolaylı Anlatım' },
  })
  const c1Lesson = await prisma.lesson.create({
    data: {
      unitId: c1Unit.id,
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
        lessonId: c1Lesson.id,
        order: 1,
        type: 'MULTIPLE_CHOICE',
        data: { prompt: 'Er sagt, er ___ müde. (indirekte Rede)', options: ['ist', 'sei', 'war', 'wäre'] },
        correctAnswer: { correctIndex: 1 },
        explanation: 'Konjunktiv I von "sein" für "er" ist "sei".',
      },
      {
        lessonId: c1Lesson.id,
        order: 2,
        type: 'SHORT_ANSWER',
        data: { prompt: "Wie lautet die Konjunktiv-I-Form von 'haben' für 'er'?" },
        correctAnswer: { accepted: ['habe', 'er habe'] },
        explanation: 'Konjunktiv I von "haben" für "er" ist "habe".',
      },
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
      {
        lessonId: c1Lesson.id,
        word: 'müde',
        translationEn: 'tired',
        translationTr: 'yorgun',
        exampleSentence: 'Er sagt, er sei müde.',
      },
      {
        lessonId: c1Lesson.id,
        word: 'sagen',
        translationEn: 'to say',
        translationTr: 'söylemek',
        exampleSentence: 'Er sagt, er sei müde.',
      },
      {
        lessonId: c2Lesson.id,
        word: 'dennoch',
        translationEn: 'nevertheless',
        translationTr: 'yine de',
        exampleSentence: 'Er hat hart gearbeitet, dennoch ist er nicht befördert worden.',
      },
      {
        lessonId: c2Lesson.id,
        word: 'sich lohnen',
        translationEn: 'to be worth it',
        translationTr: 'değmek',
        exampleSentence: 'Die Investition lohnt sich langfristig.',
      },
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
