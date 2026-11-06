import { describe, expect, test } from 'vitest'
import {
  buildSteps,
  emptyAnswers,
  hasAnyAnswer,
  issueFor,
  patchAnswers,
  questionById,
  sanitizeAnswers,
  summary,
  toggleFriction,
} from './survey'

describe('questionnaire', () => {
  test('cache le contact tant que la personne n’accepte pas d’être rejointe', () => {
    expect(buildSteps(emptyAnswers()).some((step) => step.kind === 'question' && step.question.id === 'contact')).toBe(false)
    const agreed = patchAnswers(emptyAnswers(), { recontact: 'oui' })
    expect(buildSteps(agreed).some((step) => step.kind === 'question' && step.question.id === 'contact')).toBe(true)
    expect(buildSteps(emptyAnswers())).toHaveLength(13)
    expect(buildSteps(agreed)).toHaveLength(14)
  })

  test('exige une habitation et une précision quand le mode est Autre', () => {
    const habitation = questionById('habitation')
    const mode = questionById('mode')
    expect(habitation && issueFor(habitation, emptyAnswers())).toBe('Écrivez une réponse.')
    const blank = patchAnswers(emptyAnswers(), { habitation: '   ' })
    expect(habitation && issueFor(habitation, blank)).toBe('Écrivez une réponse.')
    const other = patchAnswers(emptyAnswers(), { mode: 'autre' })
    expect(mode && issueFor(mode, other)).toBe('Précisez le mode.')
    expect(mode && issueFor(mode, patchAnswers(other, { modePrecision: 'kayak' }))).toBeNull()
  })

  test('Rien de particulier est exclusif, et Autre demande une précision', () => {
    expect(toggleFriction(['trottoirs', 'cout'], 'rien')).toEqual(['rien'])
    expect(toggleFriction(['rien'], 'velo')).toEqual(['velo'])
    expect(toggleFriction(['velo'], 'inconnu')).toEqual(['velo'])
    const frictions = questionById('frictions')
    const vague = patchAnswers(emptyAnswers(), { frictions: ['autre'] })
    expect(frictions && issueFor(frictions, vague)).toBe('Précisez la gêne.')
  })

  test('oublie le contact et les précisions quand ils ne s’appliquent plus', () => {
    const answers = patchAnswers(emptyAnswers(), {
      recontact: 'oui',
      contact: '06 00 00 00 00',
      mode: 'autre',
      modePrecision: 'kayak',
      frictions: ['autre'],
      frictionPrecision: 'le vent',
    })
    const cleared = patchAnswers(answers, { recontact: 'non', mode: 'velo', frictions: ['trottoirs'] })
    expect(cleared.contact).toBe('')
    expect(cleared.modePrecision).toBe('')
    expect(cleared.frictionPrecision).toBe('')
  })

  test('rejette les valeurs inconnues et coupe les textes trop longs', () => {
    const clean = sanitizeAnswers({
      habitation: 'x'.repeat(400),
      age: 'pirate',
      mode: 'velo',
      score: '9',
      frictions: ['trottoirs', 4, 'nope'],
      recontact: 'oui',
      contact: 'ada@example.test',
    })
    expect(clean.habitation).toHaveLength(160)
    expect(clean.age).toBe('')
    expect(clean.mode).toBe('velo')
    expect(clean.score).toBe('')
    expect(clean.frictions).toEqual(['trottoirs'])
    expect(clean.contact).toBe('ada@example.test')
    expect(hasAnyAnswer(emptyAnswers())).toBe(false)
    expect(hasAnyAnswer(clean)).toBe(true)
  })

  test('résume avec les libellés lus à voix haute, pas les codes', () => {
    const answers = patchAnswers(emptyAnswers(), {
      habitation: 'Centre',
      age: '35-49',
      mode: 'velo',
      frictions: ['trottoirs', 'cout'],
      score: '4',
      recontact: 'non',
    })
    const lines = Object.fromEntries(summary(answers).map((line) => [line.label, line.value]))
    expect(lines['Mode principal']).toBe('Vélo')
    expect(lines['Âge']).toBe('35–49 ans')
    expect(lines['Gênes']).toBe('Les trottoirs sont mauvais ou absents · Ça coûte trop cher')
    expect(lines['Note']).toBe('4 / 5')
    expect(lines['Coordonnées']).toBeUndefined()
  })
})
