import { describe, expect, test } from 'vitest'
import { draftIsStarted, emptyDraft, sanitizeDraft } from './draft'

describe('brouillon', () => {
  test('ignore un brouillon cassé et borne l’étape', () => {
    expect(sanitizeDraft(null)).toBeNull()
    const draft = sanitizeDraft({
      step: 99,
      consent: 'oui',
      latitude: 400,
      longitude: 2.5,
      answers: { habitation: 'Centre', age: 'nope' },
    })
    expect(draft?.consent).toBe(false)
    expect(draft?.latitude).toBeNull()
    expect(draft?.longitude).toBe(2.5)
    expect(draft?.answers.habitation).toBe('Centre')
    expect(draft?.answers.age).toBe('')
    expect(draft && draft.step).toBeLessThan(20)
    expect(draftIsStarted(emptyDraft())).toBe(false)
    expect(draft && draftIsStarted(draft)).toBe(true)
  })
})
