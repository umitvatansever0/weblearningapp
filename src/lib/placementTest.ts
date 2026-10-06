/**
 * German placement test (Einstufungstest): 50 multiple-choice questions
 * ordered from A1 to C2. Correct answers live only on the server — the client
 * receives `publicPlacementQuestions()` and the API scores the submission.
 */

export const PLACEMENT_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type PlacementLevel = (typeof PLACEMENT_LEVELS)[number]

/** Share of a level's questions that must be correct to count as mastered. */
export const PASS_RATIO = 0.6

export interface PlacementQuestion {
  id: number
  level: PlacementLevel
  prompt: string
  options: string[]
  correctIndex: number
}

export type PublicPlacementQuestion = Omit<PlacementQuestion, 'correctIndex'>

type RawQuestion = [level: PlacementLevel, prompt: string, correct: string, ...distractors: string[]]

const RAW_QUESTIONS: RawQuestion[] = [
  // A1
  ['A1', 'Ich ___ aus der Türkei.', 'komme', 'kommst', 'kommt', 'kommen'],
  ['A1', 'Wie ___ du? – Ich heiße Anna.', 'heißt', 'heiße', 'heißen', 'heißet'],
  ['A1', 'Das ist ___ Tisch.', 'der', 'die', 'das', 'den'],
  ['A1', 'Ich habe ___ Bruder und eine Schwester.', 'einen', 'ein', 'eine', 'einem'],
  ['A1', '___ wohnst du? – In Berlin.', 'Wo', 'Wer', 'Was', 'Wann'],
  ['A1', 'Wir ___ heute Abend ins Kino.', 'gehen', 'geht', 'gehe', 'gehst'],
  ['A1', 'Sie trinkt gern Kaffee, aber sie trinkt ___ Tee.', 'keinen', 'nicht', 'kein', 'keine'],
  ['A1', 'Der Unterricht beginnt ___ 9 Uhr.', 'um', 'am', 'im', 'an'],
  ['A1', 'Ich ___ müde.', 'bin', 'habe', 'ist', 'sind'],
  // A2
  ['A2', 'Gestern ___ ich mit meiner Mutter telefoniert.', 'habe', 'bin', 'hatte', 'war'],
  ['A2', 'Am Wochenende sind wir nach Hamburg ___.', 'gefahren', 'gefahrt', 'fahren', 'fuhren'],
  ['A2', 'Ich helfe ___ Freund beim Umzug.', 'meinem', 'meinen', 'mein', 'meiner'],
  ['A2', 'Das Buch liegt ___ dem Tisch.', 'auf', 'aus', 'nach', 'zu'],
  ['A2', 'Ich kann heute nicht kommen, ___ ich krank bin.', 'weil', 'denn', 'deshalb', 'aber'],
  ['A2', 'Mein Bruder ist drei Jahre ___ als ich.', 'älter', 'alter', 'am ältesten', 'mehr alt'],
  ['A2', 'Ich interessiere mich sehr ___ Musik.', 'für', 'an', 'auf', 'mit'],
  ['A2', 'Kannst du mir bitte ___ Salz geben?', 'das', 'dem', 'den', 'der'],
  ['A2', 'Als Kind ___ ich sehr gut schwimmen.', 'konnte', 'kann', 'gekonnt', 'könne'],
  // B1
  ['B1', 'Das ist der Mann, ___ ich gestern geholfen habe.', 'dem', 'den', 'der', 'dessen'],
  ['B1', 'Wenn ich mehr Zeit ___, würde ich öfter reisen.', 'hätte', 'habe', 'hatte', 'gehabt'],
  ['B1', 'Ich freue mich schon ___ die Ferien nächste Woche.', 'auf', 'über', 'für', 'an'],
  ['B1', 'Das Haus ___ im Jahr 1900 gebaut.', 'wurde', 'wird', 'hat', 'ist'],
  ['B1', 'Trotz ___ Regens sind wir spazieren gegangen.', 'des', 'dem', 'den', 'der'],
  ['B1', 'Kannst du mir sagen, ___ der Zug nach Berlin abfährt? – Um 14:30 Uhr.', 'wann', 'wenn', 'als', 'ob'],
  ['B1', 'Je mehr du übst, ___ besser sprichst du.', 'desto', 'als', 'so', 'wie'],
  ['B1', 'Er hat sich ___, morgen früher aufzustehen.', 'vorgenommen', 'vornehmen', 'genommen vor', 'vorgenehmt'],
  // B2
  ['B2', 'Hätte ich das gewusst, ___ ich früher gekommen.', 'wäre', 'hätte', 'würde', 'war'],
  ['B2', 'Der Bericht muss bis morgen ___ werden.', 'fertiggestellt', 'fertigstellen', 'fertigzustellen', 'fertiggestellt worden'],
  ['B2', 'Er tut so, als ___ er alles verstanden.', 'hätte', 'hat', 'hatte', 'würde'],
  ['B2', 'Die Kosten ___ sich auf 500 Euro.', 'belaufen', 'betragen', 'kosten', 'liegen'],
  ['B2', '___ der schlechten Wettervorhersage fand das Fest im Freien statt.', 'Trotz', 'Wegen', 'Aufgrund', 'Dank'],
  ['B2', 'Die Entscheidung hängt ___ vielen Faktoren ab.', 'von', 'an', 'auf', 'mit'],
  ['B2', 'Das Projekt, ___ Ergebnisse nächste Woche präsentiert werden, war ein Erfolg.', 'dessen', 'deren', 'dem', 'das'],
  ['B2', 'Nachdem er das Studium ___, fand er sofort eine Stelle.', 'abgeschlossen hatte', 'abschließt', 'abgeschlossen hat', 'abschließen wird'],
  // C1
  ['C1', 'Nach ___ der Verträge begann die Zusammenarbeit.', 'Unterzeichnung', 'Unterzeichnen', 'Unterzeichnet', 'Unterzeichnende'],
  [
    'C1',
    '„Der Antrag ist bis Ende des Monats einzureichen.“ Was bedeutet das?',
    'Der Antrag muss eingereicht werden.',
    'Der Antrag kann eingereicht werden.',
    'Der Antrag wurde schon eingereicht.',
    'Der Antrag darf nicht eingereicht werden.',
  ],
  ['C1', 'Der Sprecher sagte, die Firma ___ keine Stellen ab.', 'baue', 'bauen', 'baust', 'gebaut'],
  ['C1', 'Kaum ___ er angekommen, klingelte das Telefon.', 'war', 'ist', 'hatte', 'wurde'],
  ['C1', 'Die neue Regelung tritt am 1. Januar ___ Kraft.', 'in', 'zur', 'im', 'an'],
  ['C1', 'Die Firma hat auch eine Fusion ___ Betracht gezogen.', 'in', 'im', 'zum', 'auf'],
  ['C1', 'Der ___ Zug hatte 20 Minuten Verspätung.', 'aus München kommende', 'aus München gekommen', 'aus München kommend', 'aus München kommenden'],
  ['C1', 'Es bleibt abzuwarten, ___ sich die Lage weiter entwickelt.', 'wie', 'was', 'dass', 'welche'],
  // C2
  [
    'C2',
    '„Er hat mir reinen Wein eingeschenkt.“ Was bedeutet das?',
    'Er hat mir offen die Wahrheit gesagt.',
    'Er hat mich betrunken gemacht.',
    'Er hat mich zum Essen eingeladen.',
    'Er hat mich bewusst getäuscht.',
  ],
  ['C2', '„Das ist mir Wurst.“ Was bedeutet das?', 'Das ist mir egal.', 'Das schmeckt mir gut.', 'Das ärgert mich sehr.', 'Das verstehe ich nicht.'],
  ['C2', 'Er ist ___ seines hohen Alters noch sehr aktiv.', 'ungeachtet', 'anhand', 'zwecks', 'mittels'],
  ['C2', 'Sein Verhalten ließ ___ wünschen übrig.', 'zu', 'viel', 'mehr', 'sehr'],
  ['C2', 'Die Ministerin erklärte, man ___ alles Notwendige getan.', 'habe', 'hat', 'hätten', 'sei'],
  ['C2', 'Wir müssen das Problem an der Wurzel ___.', 'packen', 'nehmen', 'ziehen', 'halten'],
  ['C2', 'Seine Argumente sind nicht ___ der Hand zu weisen.', 'von', 'aus', 'mit', 'an'],
  ['C2', 'Der Vorschlag fand bei den Teilnehmern großen ___.', 'Anklang', 'Anhang', 'Anspruch', 'Ausklang'],
]

/** Deterministic position of the correct option, so it isn't always first. */
function correctPosition(index: number): number {
  return (index * 3 + 1) % 4
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = RAW_QUESTIONS.map(
  ([level, prompt, correct, ...distractors], index) => {
    const correctIndex = correctPosition(index)
    const options = [...distractors]
    options.splice(correctIndex, 0, correct)
    return { id: index + 1, level, prompt, options, correctIndex }
  }
)

export const PLACEMENT_QUESTION_COUNT = PLACEMENT_QUESTIONS.length

export function publicPlacementQuestions(): PublicPlacementQuestion[] {
  return PLACEMENT_QUESTIONS.map(({ id, level, prompt, options }) => ({ id, level, prompt, options }))
}

export interface LevelScore {
  level: PlacementLevel
  correct: number
  total: number
}

export interface PlacementResult {
  /** Highest level mastered in sequence; null when even A1 wasn't mastered. */
  level: PlacementLevel | null
  /** Where to continue studying: the level after `level` (A1 for beginners). */
  recommended: PlacementLevel
  correct: number
  total: number
  perLevel: LevelScore[]
}

/**
 * Score one submission. `answers[i]` is the chosen option index for question
 * i, or -1 when skipped. A level counts as mastered when at least PASS_RATIO
 * of its questions are correct; the result is the last level of the unbroken
 * run of mastered levels starting at A1, so lucky guesses on hard questions
 * can't skip over gaps in the basics.
 */
export function scorePlacement(answers: number[]): PlacementResult {
  const perLevel: LevelScore[] = PLACEMENT_LEVELS.map((level) => ({ level, correct: 0, total: 0 }))
  PLACEMENT_QUESTIONS.forEach((question, index) => {
    const bucket = perLevel[PLACEMENT_LEVELS.indexOf(question.level)]
    bucket.total++
    if (answers[index] === question.correctIndex) bucket.correct++
  })

  let level: PlacementLevel | null = null
  for (const score of perLevel) {
    if (score.correct / score.total < PASS_RATIO) break
    level = score.level
  }

  const next = level === null ? 0 : Math.min(PLACEMENT_LEVELS.indexOf(level) + 1, PLACEMENT_LEVELS.length - 1)
  return {
    level,
    recommended: PLACEMENT_LEVELS[next],
    correct: perLevel.reduce((sum, s) => sum + s.correct, 0),
    total: PLACEMENT_QUESTIONS.length,
    perLevel,
  }
}
