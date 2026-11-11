import { isResponseCode, responseCode } from './response'
import { buildSteps, emptyAnswers, hasAnyAnswer, patchAnswers, sanitizeAnswers, type Answers } from './survey'

export type Draft = {
  code: string
  step: number
  consent: boolean
  test: boolean
  answers: Answers
  latitude: number | null
  longitude: number | null
}

const TEST_SAMPLE_PEOPLE = [
  { civilite: 'madame', prenom: 'Paule', nom: 'Auchon', adresse: '6 Rue de Lorraine', complement: '', commune: 'Pontarlier' },
  { civilite: 'monsieur', prenom: 'Jean', nom: 'Neymar', adresse: '9bis Pl. Xavier Authier', complement: 'Appartement 12A', commune: 'Métabief' },
  { civilite: 'madame', prenom: 'Léa', nom: 'Slalomée', adresse: '5 Rue du Mont Girod', complement: '', commune: 'Arçon' },
  { civilite: 'monsieur', prenom: 'Gérard', nom: 'Menvussa', adresse: '4 Rue Pasteur', complement: '', commune: 'Levier' },
] as const

export const TEST_SAMPLE_COUNT = TEST_SAMPLE_PEOPLE.length

/** Fiches d’exemple, pour le premier passage en mode test. */
export function testSampleDrafts(codes: readonly string[]): Draft[] {
  return TEST_SAMPLE_PEOPLE.map((person, index) => ({
    ...emptyDraft(),
    code: isResponseCode(codes[index] ?? '') ? codes[index]! : responseCode(),
    test: true,
    answers: patchAnswers(emptyAnswers(), person),
  }))
}

export function emptyDraft(): Draft {
  return {
    code: responseCode(),
    step: 0,
    consent: false,
    test: false,
    answers: emptyAnswers(),
    latitude: null,
    longitude: null,
  }
}

function coordinate(value: unknown, limit: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < -limit || value > limit) return null
  return value
}

export function sanitizeDraft(input: unknown): Draft | null {
  if (!input || typeof input !== 'object') return null
  const source = input as Record<string, unknown>
  const rawAnswers = source.answers && typeof source.answers === 'object' ? (source.answers as Record<string, unknown>) : {}
  const answers = sanitizeAnswers(rawAnswers)
  const steps = buildSteps(answers)
  let step = typeof source.step === 'number' && Number.isFinite(source.step) ? Math.max(0, Math.floor(source.step)) : 0
  // Les fiches d’avant l’étape de visite gardent leur question : l’accord et la suite reculent d’un cran.
  if (!('visits' in rawAnswers) && step >= 4) step += 1
  // Les fiches d’avant la question handicap gardent l’écran qui suit les trajets.
  if (!('handicap' in rawAnswers) && step >= 10) step += 1
  // Les fiches d’avant la question difficultés gardent l’écran des trajets qu’une offre rendrait possibles.
  if (!('difficulties' in rawAnswers) && step >= 9) step += 1
  // Les fiches d’avant les choix de vie gardent la question sur le handicap.
  if (!('lifeChoices' in rawAnswers) && step >= 11) step += 1
  // Les fiches d’avant les raisons de changer de mode gardent l’écran où elles étaient.
  if (!('modeReasons' in rawAnswers) && step >= 11) step += 1
  // Les fiches d’avant les freins gardent l’écran où elles étaient.
  if (!('modeBarriers' in rawAnswers) && step >= 12) step += 1
  // Les fiches d’avant la distance à l’arrêt gardent l’écran où elles étaient.
  if (!('walkDistance' in rawAnswers) && step >= 13) step += 1
  // Les fiches d’avant les conditions pour laisser la voiture gardent l’écran où elles étaient.
  if (!('modeConditions' in rawAnswers) && step >= 12) step += 1
  const code = typeof source.code === 'string' ? source.code.trim().toUpperCase() : ''
  return {
    code: isResponseCode(code) ? code : responseCode(),
    step: Math.min(step, Math.max(steps.length - 1, 0)),
    consent: source.consent === true,
    test: source.test === true,
    answers,
    latitude: coordinate(source.latitude, 90),
    longitude: coordinate(source.longitude, 180),
  }
}

export function draftIsStarted(draft: Draft): boolean {
  return draft.consent || draft.step > 0 || draft.latitude !== null || draft.longitude !== null || hasAnyAnswer(draft.answers)
}

/** Une fiche ouverte puis quittée sans réponse ne reste pas dans la liste. */
export function draftHasContent(draft: Draft): boolean {
  return hasAnyAnswer(draft.answers)
}

/** Une fiche de test ne s’ouvre qu’en mode test, et une fiche réelle qu’en dehors. */
export function draftMatchesMode(draft: Pick<Draft, 'test'>, testMode: boolean): boolean {
  return draft.test === testMode
}
