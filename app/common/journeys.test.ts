import { describe, expect, test } from 'vitest'
import { addJourney, difficultiesIssue, emptyDifficulties, emptyJourney, journeyComplete, journeyIssue, journeyTouched, presetActualJourney, removeJourney, sanitizeDifficulties, sanitizeJourneys, setDifficultyNote, setDifficultyTripPace, toggleDifficultyGroup, toggleDifficultyItem, toggleDifficultyTrip, updateJourney, DOMICILE, type Journey } from './journeys'

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
    const blankTrips = sanitizeJourneys(null, 1, [], [])
    expect(blankTrips.map((journey) => journey.kind)).toEqual(['actuel', 'nouveau'])
    expect(blankTrips[0]?.id).toMatch(/^[a-z0-9]{8}$/)
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
    expect(sanitizeJourneys([filled({ extraRiders: 2 })], 2, [], [])[0]?.extraRiders).toBe(2)
    expect(journeyComplete(filled({ riders: [], ridersCustom: true, extraRiders: 1, replaced: 'jamais' }), 2)).toBe(false)
    expect(journeyComplete(filled({ extraRiders: 1, replaced: 'jamais' }), 2)).toBe(true)
    const offered = sanitizeJourneys([filled({ extraRiders: 4, kind: 'nouveau' })], 2, [], [])
    expect(offered.find((journey) => journey.kind === 'nouveau')?.extraRiders).toBe(0)
  })

  test('prépare un trajet actuel avec le motif, et en ajoute un si le précédent est déjà commencé', () => {
    const first = presetActualJourney([emptyJourney('actuel'), emptyJourney('nouveau')], { theme: 'loisirs', autre: 'Coiffeur' })
    expect(first?.listedIndex).toBe(0)
    expect(first?.journeys[0]).toMatchObject({ theme: 'loisirs', autre: 'Coiffeur' })
    const second = presetActualJourney(first?.journeys ?? [], { theme: 'sante', autre: '' })
    expect(second?.listedIndex).toBe(1)
    expect(second?.journeys.filter((journey) => journey.kind === 'actuel')).toHaveLength(2)
    expect(second?.journeys.find((journey) => journey.theme === 'sante')?.autre).toBe('')
    const blank = presetActualJourney([emptyJourney('actuel')], { theme: '', autre: '' })
    expect(blank?.listedIndex).toBe(0)
    expect(blank?.journeys).toHaveLength(1)
    expect(journeyTouched(blank?.journeys[0] ?? emptyJourney('actuel'))).toBe(false)
  })

  test('relie chaque difficulté aux trajets, avec une fréquence, et « aucune » reste à part', () => {
    const trip = 'abcd1234'
    expect(difficultiesIssue(emptyDifficulties())).toMatch(/difficulté/)
    const circulation = toggleDifficultyItem(toggleDifficultyGroup(emptyDifficulties(), 'circulation'), 'bouchons')
    expect(difficultiesIssue(circulation)).toMatch(/trajets/)
    const linked = toggleDifficultyTrip(circulation, 'bouchons', trip)
    expect(difficultiesIssue(linked)).toMatch(/toujours/)
    const often = setDifficultyTripPace(linked, 'bouchons', trip, 'souvent')
    expect(difficultiesIssue(often)).toBeNull()
    expect(often.trips.bouchons).toEqual([{ id: trip, pace: 'souvent' }])
    const both = setDifficultyTripPace(toggleDifficultyTrip(toggleDifficultyItem(toggleDifficultyGroup(often, 'meteo'), 'neige'), 'neige', trip), 'neige', trip, 'parfois')
    const dropped = toggleDifficultyGroup(both, 'circulation')
    expect(dropped.groups).toEqual(['meteo'])
    expect(dropped.items).toEqual(['neige'])
    expect(dropped.trips.bouchons).toBeUndefined()
    expect(dropped.trips.neige?.[0]?.pace).toBe('parfois')
    expect(toggleDifficultyGroup(often, 'aucune')).toBe(often)
    const none = toggleDifficultyGroup(emptyDifficulties(), 'aucune')
    expect(difficultiesIssue(none)).toBeNull()
    expect(toggleDifficultyGroup(none, 'meteo')).toBe(none)
    const kept = sanitizeDifficulties(often, [trip])
    expect(kept.trips.bouchons).toEqual([{ id: trip, pace: 'souvent' }])
    expect(sanitizeDifficulties(often, []).trips.bouchons).toBeUndefined()
    const noted = setDifficultyNote(toggleDifficultyItem(often, 'circulation-autre'), 'circulation', 'travaux')
    expect(noted.notes.circulation).toBe('travaux')
    expect(difficultiesIssue(noted)).toMatch(/Précisez|trajets/)
  })
})
