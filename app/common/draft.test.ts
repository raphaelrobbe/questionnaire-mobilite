import { describe, expect, test } from 'vitest'
import { isResponseCode } from './response'
import { draftHasContent, draftIsStarted, draftMatchesMode, emptyDraft, sanitizeDraft, testSampleDrafts } from './draft'

describe('brouillon', () => {
  test('ignore un brouillon cassé et borne l’étape', () => {
    expect(sanitizeDraft(null)).toBeNull()
    const draft = sanitizeDraft({
      step: 99,
      consent: 'oui',
      latitude: 400,
      longitude: 2.5,
      answers: { commune: 'Centre', people: [{ age: 'nope', drive: 'oui' }] },
    })
    expect(draft?.code && isResponseCode(draft.code)).toBe(true)
    expect(sanitizeDraft({ ...draft, code: 'ab12-cd34' })?.code).toBe('AB12-CD34')
    expect(draft?.consent).toBe(false)
    expect(isResponseCode(emptyDraft().code)).toBe(true)
    expect(draft?.latitude).toBeNull()
    expect(draft?.longitude).toBe(2.5)
    expect(draft?.answers.commune).toBe('Centre')
    expect(draft?.answers.people[0]?.age).toBe('')
    expect(draft?.answers.people[0]?.drive).toBe('oui')
    expect(draft && draft.step).toBeLessThan(20)
    const household = sanitizeDraft({ step: 4, answers: { commune: 'Pontarlier' } })
    expect(household?.step).toBe(5)
    const consent = sanitizeDraft({ step: 3, answers: { commune: 'Pontarlier' } })
    expect(consent?.step).toBe(3)
    const current = sanitizeDraft({ step: 4, answers: { commune: 'Pontarlier', visits: [] } })
    expect(current?.step).toBe(4)
    const contact = sanitizeDraft({ step: 10, answers: { commune: 'Pontarlier', visits: [] } })
    expect(contact?.step).toBe(17)
    const kept = sanitizeDraft({ step: 10, answers: { commune: 'Pontarlier', visits: [], handicap: '' } })
    expect(kept?.step).toBe(16)
    const shifted = sanitizeDraft({
      step: 11,
      answers: { visits: [], handicap: '', difficulties: {}, lifeChoices: { selected: [] } },
    })
    expect(shifted?.step).toBe(15)
    const stayed = sanitizeDraft({
      step: 11,
      answers: { visits: [], handicap: '', difficulties: {}, lifeChoices: { selected: [] }, modeReasons: { selected: [], note: '' } },
    })
    expect(stayed?.step).toBe(11)
    const barriers = sanitizeDraft({
      step: 12,
      answers: { visits: [], handicap: '', difficulties: {}, lifeChoices: { selected: [] }, modeReasons: { selected: [], note: '' } },
    })
    expect(barriers?.step).toBe(15)
    const keptBarrier = sanitizeDraft({
      step: 12,
      answers: {
        visits: [],
        handicap: '',
        difficulties: {},
        lifeChoices: { selected: [] },
        modeReasons: { selected: [], note: '' },
        modeBarriers: { selected: [], note: '' },
      },
    })
    expect(keptBarrier?.step).toBe(13)
    const walk = sanitizeDraft({
      step: 13,
      answers: {
        visits: [],
        handicap: '',
        difficulties: {},
        lifeChoices: { selected: [] },
        modeReasons: { selected: [], note: '' },
        modeBarriers: { selected: [], note: '' },
      },
    })
    expect(walk?.step).toBe(15)
    const keptWalk = sanitizeDraft({
      step: 13,
      answers: {
        visits: [],
        handicap: '',
        difficulties: {},
        lifeChoices: { selected: [] },
        modeReasons: { selected: [], note: '' },
        modeBarriers: { selected: [], note: '' },
        walkDistance: { choice: '', note: '' },
      },
    })
    expect(keptWalk?.step).toBe(14)
    const offers = sanitizeDraft({ step: 9, answers: { commune: 'Pontarlier', visits: [], handicap: '' } })
    expect(offers?.step).toBe(10)
    const same = sanitizeDraft({ step: 9, answers: { commune: 'Pontarlier', visits: [], handicap: '', difficulties: { groups: [] } } })
    expect(same?.step).toBe(9)
    const samples = testSampleDrafts(['PAUL-0001', 'JEAN-0002', 'LEAS-0003', 'GERA-0004'])
    expect(samples.map((draft) => `${draft.answers.civilite} ${draft.answers.prenom} ${draft.answers.nom}`)).toEqual([
      'madame Paule Auchon',
      'monsieur Jean Neymar',
      'madame Léa Slalomée',
      'monsieur Gérard Menvussa',
    ])
    expect(samples.map((draft) => draft.answers.commune)).toEqual(['Pontarlier', 'Métabief', 'Arçon', 'Levier'])
    expect(samples[1]?.answers.adresse).toBe('9bis Pl. Xavier Authier')
    expect(samples[1]?.answers.complement).toBe('Appartement 12A')
    expect(samples[0]?.answers.complement).toBe('')
    expect(samples[2]?.answers.adresse).toBe('5 Rue du Mont Girod')
    expect(samples.every((draft) => draft.test && draftHasContent(draft))).toBe(true)
    expect(draftIsStarted(emptyDraft())).toBe(false)
    expect(draftHasContent(emptyDraft())).toBe(false)
    expect(sanitizeDraft({ ...draft, test: true })?.test).toBe(true)
    expect(emptyDraft().test).toBe(false)
    expect(draft && draftIsStarted(draft)).toBe(true)
    expect(draft && draftHasContent({ ...draft, step: 3, answers: emptyDraft().answers })).toBe(false)
    expect(draft && draftHasContent(draft)).toBe(true)
    expect(draftMatchesMode({ test: true }, true)).toBe(true)
    expect(draftMatchesMode({ test: false }, true)).toBe(false)
    expect(draftMatchesMode({ test: true }, false)).toBe(false)
  })
})
