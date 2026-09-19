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
