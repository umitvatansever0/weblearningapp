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
