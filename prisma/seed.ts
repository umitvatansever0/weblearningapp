import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Delete in FK-safe order so this script is safely re-runnable, even after
  // a learner has generated UserProgress rows against the seeded lessons.
  await prisma.userProgress.deleteMany({})
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

  // --- A1: Begrüßung (3 lessons) ---
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
          pairs: [
            { left: 'ich', right: 'bin' },
            { left: 'du', right: 'bist' },
            { left: 'er/sie/es', right: 'ist' },
          ],
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
