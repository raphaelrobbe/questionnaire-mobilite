import { isResponseCode, responseCode } from './response'
import { buildSteps, emptyAnswers, hasAnyAnswer, sanitizeAnswers, type Answers } from './survey'

export type Draft = {
  code: string
  step: number
  consent: boolean
  test: boolean
  answers: Answers
  latitude: number | null
  longitude: number | null
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
  const answers = sanitizeAnswers(source.answers)
  const steps = buildSteps(answers)
  const step = typeof source.step === 'number' && Number.isFinite(source.step) ? Math.max(0, Math.floor(source.step)) : 0
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
