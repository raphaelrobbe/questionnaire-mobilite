import { describe, expect, test } from 'vitest'
import { addJourney, emptyJourney, journeyComplete, journeyIssue, journeyTouched, removeJourney, sanitizeJourneys, updateJourney, DOMICILE, type Journey } from './journeys'

function filled(patch: Partial<Journey> = {}): Journey {
  return {
    ...emptyJourney('actuel'),
    theme: 'travail',
    aller: '8-10',
    retour: '16-18',
    regularity: 'regulier',
    pace: 'hebdo',
    days: ['lun', 'mar'],
    mode: 'taxi',
    destination: 'Besançon',
    replaced: 'parfois',
    riders: [0],
    ...patch,
  }
}

describe('trajets du foyer', () => {
  test('garde un trajet actuel et un trajet d’offre, et oublie un ancien compte hebdomadaire', () => {
    const clean = sanitizeJourneys(
      [
        filled({ everyWeeks: '12', rareCount: '4', comment: 'tôt le matin' }),
        { kind: 'nouveau', theme: 'sante', aller: '10-12', retour: '14-16', regularity: 'irregulier', rareCount: '2', rareUnit: 'an', mode: 'train', destination: 'Pontarlier', replacedRiders: [0, 4] },
      ],
      2,
      [],
      [],
    )
    expect(clean[0]?.comment).toBe('tôt le matin')
    expect(sanitizeJourneys([filled({ place: 'Gare SNCF', origin: '', originPlace: 'École' })], 1, [], [])[0]).toMatchObject({
      place: 'Gare SNCF',
      origin: '',
      originPlace: 'École',
    })
    const legacy = filled()
    delete (legacy as { origin?: string }).origin
    expect(sanitizeJourneys([legacy], 1, [], [])[0]?.origin).toBe(DOMICILE)
    expect(sanitizeJourneys([filled({ theme: 'loisirs', autre: 'entraînement de volley' })], 1, [], [])[0]?.autre).toBe('entraînement de volley')
    expect(clean[0]?.everyWeeks).toBe('')
    expect(clean[0]?.rareCount).toBe('')
    expect(clean[1]?.rareCount).toBe('2')
    expect(clean[1]?.rareUnit).toBe('an')
    expect(clean[1]?.kind).toBe('nouveau')
    expect(clean[1]?.replaced).toBe('offre')
    expect(clean[1]?.replacedRiders).toEqual([0])
    expect(clean[1]?.riders).toEqual([])
    expect(clean[1]?.mode).toBe('')
    expect(sanitizeJourneys(null, 1, [], [])).toEqual([emptyJourney('actuel'), emptyJourney('nouveau')])
  })

  test('laisse passer un foyer sans trajet, et un trajet sans retour', () => {
    expect(journeyIssue([emptyJourney('actuel'), emptyJourney('nouveau')])).toBeNull()
    expect(journeyComplete(filled())).toBe(true)
    expect(journeyComplete(filled({ retour: '' }))).toBe(true)
    expect(journeyComplete(filled({ aller: '' }))).toBe(false)
    expect(journeyComplete(filled({ destination: '' }))).toBe(false)
    expect(journeyComplete(filled({ origin: '' }))).toBe(false)
    expect(journeyTouched(emptyJourney('actuel'))).toBe(false)
    expect(sanitizeJourneys([filled({ riders: [], replacedRiders: [] })], 1, [], [])[0]).toMatchObject({ riders: [0], replacedRiders: [0] })
    expect(sanitizeJourneys([filled({ riders: [], replacedRiders: [] })], 2, [], [])[0]?.riders).toEqual([])
    expect(sanitizeJourneys([{ kind: 'actuel' }], 1, [], [])[0]?.riders).toEqual([])
    const offer = sanitizeJourneys(
      [{ ...emptyJourney('nouveau'), theme: 'loisirs', aller: '8-10', regularity: 'regulier', pace: 'hebdo', days: ['lun'], destination: 'Pontarlier' }],
      1,
      [],
      [],
    )[1]
    expect(offer?.replacedRiders).toEqual([0])
    expect(journeyComplete(offer!, 1)).toBe(true)
    expect(journeyComplete(filled({ theme: 'autre', autre: '' }))).toBe(true)
    expect(journeyComplete(filled({ theme: 'autre', autre: 'Piscine' }))).toBe(true)
    expect(journeyComplete(filled({ replaced: 'jamais', replacedRiders: [0] }))).toBe(true)
    expect(journeyComplete(filled({ replacedRidersCustom: true, replacedRiders: [] }))).toBe(false)
    expect(journeyIssue([filled({ destination: '' }), emptyJourney('nouveau')])).toMatch(/Complétez/)
    expect(journeyIssue([filled(), emptyJourney('nouveau')])).toBeNull()
    const fresh = {
      ...emptyJourney('nouveau'),
      theme: 'loisirs' as const,
      aller: '14-16' as const,
      retour: '18-20' as const,
      regularity: 'irregulier' as const,
      rareCount: '3' as const,
      rareUnit: 'mois' as const,
      destination: 'Morteau',
    }
    expect(journeyIssue([filled(), fresh])).toMatch(/Complétez le trajet/)
    expect(journeyIssue([filled(), { ...fresh, replacedRiders: [1] }])).toBeNull()
    const added = addJourney([filled(), emptyJourney('nouveau')], 'actuel')
    expect(added.filter((journey) => journey.kind === 'actuel')).toHaveLength(2)
    expect(removeJourney(added, 0).filter((journey) => journey.kind === 'actuel')).toHaveLength(1)
    const cleared = updateJourney(added, 0, { replaced: 'jamais', replacedRiders: [0] })
    expect(cleared[0]?.replacedRiders).toEqual([])
    const followed = updateJourney([filled({ replacedRiders: [] })], 0, { riders: [0, 1] })
    expect(followed[0]?.replacedRiders).toEqual([0, 1])
    const changed = updateJourney(followed, 0, { replacedRiders: [1] })
    expect(updateJourney(changed, 0, { riders: [0] })[0]?.replacedRiders).toEqual([1])
    const legacy = sanitizeJourneys([{ ...filled(), replacedRiders: [1], replacedRidersCustom: undefined }], 2, [], [])
    expect(legacy[0]?.replacedRiders).toEqual([1])
    expect(legacy[0]?.replacedRidersCustom).toBe(true)
  })
})
