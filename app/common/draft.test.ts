import { describe, expect, test } from 'vitest'
import { isResponseCode } from './response'
import { draftHasContent, draftIsStarted, draftMatchesMode, emptyDraft, sanitizeDraft } from './draft'

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
