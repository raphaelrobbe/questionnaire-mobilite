import { describe, expect, test } from 'vitest'
import { mailBody, toSheetRow, type ResponseRecord } from './response'
import { emptyAnswers, patchAnswers, sanitizeAnswers, summary } from './survey'
import {
  busQuestion,
  canCopyHours,
  considerQuestion,
  copyHours,
  emptyMotives,
  emptyTrip,
  followUp,
  goesQuestion,
  motiveReady,
  motiveReveal,
  sanitizeMotives,
  setPersonTheme,
  shiftMotive,
  themeLabel,
  type PersonTheme,
} from './motives'

function row(patch: Partial<PersonTheme> = {}): PersonTheme {
  const base = sanitizeMotives(emptyMotives(1), 1, 1, 0).people[0]?.travail as PersonTheme
  return { ...base, ...patch }
}

describe('motifs de déplacement', () => {
  test('garde le motif libre en cours de saisie et oublie un véhicule disparu', () => {
    const clean = sanitizeMotives(
      {
        autre: 'Piscine ',
        people: [
          {
            travail: {
              goes: 'oui',
              actual: {
                perWeek: '4',
                days: { semaine: { aller: [{ slot: 'midi', flexible: true }, { slot: '8-10', flexible: true }], retour: [] } },
                modes: ['car:0', 'car:3', 'taxi'],
              },
            },
          },
        ],
      },
      1,
      1,
      0,
    )
    expect(clean.autre).toBe('Piscine ')
    expect(clean.people[0]?.travail.actual.perWeek).toBe('4')
    const plus = sanitizeMotives({ people: [{ travail: { goes: 'oui', actual: { perWeek: '12' } } }] }, 1, 1, 0)
    expect(plus.people[0]?.travail.actual.perWeek).toBe('+ de 7')
    const typed = sanitizeMotives({ people: [{ travail: { goes: 'oui', actual: { perWeek: '2,' } } }] }, 1, 1, 0)
    expect(typed.people[0]?.travail.actual.perWeek).toBe('')
    expect(clean.people[0]?.travail.actual.days.semaine?.aller).toEqual([{ slot: '8-10', flexible: true }])
    expect(clean.people[0]?.travail.actual.modes).toEqual(['car:0', 'taxi'])
    expect(sanitizeMotives(clean, 2, 1, 0).people).toHaveLength(2)
  })

  test('ouvre la bonne suite selon le trajet actuel et le bus', () => {
    expect(followUp(row({ goes: 'oui', bus: 'non' }))).toBe('why')
    expect(followUp(row({ goes: 'oui', bus: 'peut-etre' }))).toBe('none')
    expect(followUp(row({ goes: 'non', bus: 'certainement' }))).toBe('gave-up')
    expect(followUp(row({ goes: 'non', bus: 'non' }))).toBe('none')
    const hours = {
      perWeek: '2',
      days: { semaine: { aller: [{ slot: '8-10' as const, flexible: false }], retour: [] } },
      modes: ['taxi'],
    }
    const kept = sanitizeAnswers({
      motives: setPersonTheme(emptyMotives(1), 0, 'achats', {
        goes: 'oui',
        actual: hours,
        bus: 'non',
        whyNot: ['conduire', 'invente'],
        gaveUp: 'toujours',
      }),
    })
    expect(kept.motives.people[0]?.achats.whyNot).toEqual(['conduire'])
    expect(kept.motives.people[0]?.achats.gaveUp).toBe('')
    expect(kept.motives.people[0]?.achats.wouldConsider).toBe('')
    const refused = sanitizeAnswers({
      motives: setPersonTheme(emptyMotives(1), 0, 'travail', {
        goes: 'non',
        wouldConsider: 'oui',
        bus: 'peut-etre',
        busOften: 'parfois',
        busTrip: hours,
        gaveUp: 'parfois',
        whyNot: ['conduire'],
      }),
    })
    expect(refused.motives.people[0]?.travail.wouldConsider).toBe('oui')
    expect(refused.motives.people[0]?.travail.gaveUp).toBe('parfois')
    expect(refused.motives.people[0]?.travail.whyNot).toEqual([])
    expect(refused.motives.people[0]?.travail.busTrip.modes).toEqual([])
    expect(considerQuestion('autre', 'vers')).toBeNull()
    expect(considerQuestion('autre', 'vers', 'Piscine')).toBe(
      'Une offre de transports en commun vous ferait-elle envisager « Piscine » à Pontarlier ?',
    )
    const named = sanitizeAnswers({
      motives: setPersonTheme({ ...emptyMotives(1), autre: 'Piscine' }, 0, 'autre', {
        goes: 'non',
        wouldConsider: 'oui',
        bus: 'non',
      }),
    })
    expect(named.motives.people[0]?.autre.wouldConsider).toBe('oui')
  })

  test('oublie les réponses des questions qui ne s’affichent plus', () => {
    const hours = {
      perWeek: '2',
      days: { semaine: { aller: [{ slot: '8-10' as const, flexible: false }], retour: [] } },
      modes: ['taxi'],
    }
    const full = sanitizeMotives(
      { people: [{ travail: { goes: 'oui', actual: hours, bus: 'non', whyNot: ['conduire'] } }] },
      1,
      0,
      0,
    )
    const hidden = sanitizeMotives({ people: [{ travail: { ...full.people[0]?.travail, goes: 'non' } }] }, 1, 0, 0)
    expect(hidden.people[0]?.travail.actual).toEqual(emptyTrip())
    expect(hidden.people[0]?.travail.bus).toBe('')
    expect(hidden.people[0]?.travail.whyNot).toEqual([])
    const again = sanitizeMotives({ people: [{ travail: { ...hidden.people[0]?.travail, goes: 'oui' } }] }, 1, 0, 0)
    expect(again.people[0]?.travail.actual).toEqual(emptyTrip())
    expect(again.people[0]?.travail.bus).toBe('')
    const openDay = sanitizeMotives(
      { people: [{ travail: { goes: 'oui', actual: { perWeek: '2', days: { semaine: { aller: [], retour: [] } }, modes: ['taxi'] }, bus: 'non' } }] },
      1,
      0,
      0,
    )
    expect(openDay.people[0]?.travail.actual.days.semaine).toEqual({ aller: [], retour: [] })
    expect(openDay.people[0]?.travail.actual.modes).toEqual([])
    expect(openDay.people[0]?.travail.bus).toBe('')
    const named = sanitizeMotives({ autre: 'Piscine', people: [{ autre: { goes: 'oui', actual: hours } }] }, 1, 0, 0)
    expect(named.people[0]?.autre.goes).toBe('oui')
    const cleared = sanitizeMotives({ ...named, autre: ' ' }, 1, 0, 0)
    expect(cleared.people[0]?.autre).toEqual(emptyMotives(1).people[0]?.autre)
  })

  test('formule le côté de Pontarlier, y compris pour les achats', () => {
    expect(goesQuestion('achats', 'vers', '')).toBe('Allez-vous à Pontarlier pour les achats ?')
    expect(goesQuestion('achats', 'de', '')).toBe('Allez-vous en dehors de Pontarlier pour les achats ?')
    expect(themeLabel('travail', '')).toBe('Travail / Études / Formations')
    expect(goesQuestion('travail', 'de', '')).toBe('Allez-vous en dehors de Pontarlier pour le travail, les études ou une formation ?')
    expect(considerQuestion('travail', 'vers')).toBe(
      'Une offre de transports en commun vous ferait-elle envisager de chercher un emploi, de faire des études ou de suivre une formation à Pontarlier ?',
    )
    expect(considerQuestion('achats', 'de')).toMatch(/habitudes de consommation en dehors de Pontarlier/)
    expect(busQuestion('vers')).toMatch(/pour Pontarlier/)
    expect(busQuestion('de')).toMatch(/vers les communes environnantes/)
    const source = { ...emptyTrip(), days: { samedi: { aller: [{ slot: '6-8' as const, flexible: false }], retour: [] } } }
    const trip = copyHours(source, { ...emptyTrip(), perWeek: '3' })
    expect(trip.perWeek).toBe('3')
    expect(trip.days.samedi?.aller[0]?.slot).toBe('6-8')
    expect(trip.days.semaine).toBeUndefined()
    expect(canCopyHours(row({ goes: 'non', actual: source }))).toBe(false)
    expect(canCopyHours(row({ goes: 'oui', actual: emptyTrip() }))).toBe(false)
    expect(canCopyHours(row({ goes: 'oui', actual: source }))).toBe(true)
  })

  test('reste sur le téléphone et apparaît seulement dans la relecture locale', () => {
    const answers = patchAnswers(emptyAnswers(), { commune: 'Lyon', motives: { ...emptyMotives(1), autre: 'Piscine' } })
    const record: ResponseRecord = {
      id: 'id-1',
      createdAt: '2026-11-06T12:00:00.000Z',
      deviceId: 'device-1',
      interviewer: 'Ada',
      test: false,
      latitude: null,
      longitude: null,
      answers,
    }
    expect(JSON.stringify(toSheetRow(record))).not.toContain('Piscine')
    expect(JSON.stringify(mailBody(record))).not.toContain('Piscine')
    expect(summary(answers).find((line) => line.label === 'Motifs')?.value).toBe('Gardés sur le téléphone')
  })

  test('n’affiche la question suivante qu’une fois la précédente répondue', () => {
    const blank = motiveReveal('travail', row())
    expect(blank.bus).toBe(false)
    expect(blank.actualFrequency).toBe(false)
    const refused = motiveReveal('travail', row({ goes: 'non' }))
    expect(refused.consider).toBe(true)
    expect(refused.bus).toBe(false)
    expect(motiveReveal('travail', row({ goes: 'non', wouldConsider: 'non' })).bus).toBe(true)
    const going = motiveReveal('travail', row({ goes: 'oui', actual: { ...emptyTrip(), perWeek: '2' } }))
    expect(going.actualHours).toBe(true)
    expect(going.actualModes).toBe(false)
    expect(going.bus).toBe(false)
    const hours = {
      ...emptyTrip(),
      perWeek: '2',
      days: { semaine: { aller: [{ slot: '8-10' as const, flexible: false }], retour: [] } },
    }
    const afterHours = motiveReveal('travail', row({ goes: 'oui', actual: hours }))
    expect(afterHours.actualModes).toBe(true)
    expect(afterHours.bus).toBe(false)
    const busHours = motiveReveal(
      'travail',
      row({ goes: 'non', wouldConsider: 'non', bus: 'peut-etre', busOften: 'parfois', busTrip: hours }),
    )
    expect(busHours.busHours).toBe(true)
    expect(busHours.gaveUp).toBe(true)
    expect(JSON.stringify(busHours)).not.toContain('busModes')
    const stored = sanitizeMotives(
      { people: [{ travail: { goes: 'oui', bus: 'peut-etre', busOften: 'parfois', actual: { ...hours, modes: ['taxi'] }, busTrip: { ...hours, modes: ['taxi'] } } }] },
      1,
      0,
      0,
    )
    expect(stored.people[0]?.travail.actual.modes).toEqual(['taxi'])
    expect(stored.people[0]?.travail.busTrip.modes).toEqual([])
  })

  test('passe de personne en personne, puis à l’activité suivante', () => {
    const start = emptyMotives(2)
    expect(motiveReady(start)).toBe(false)
    const second = shiftMotive(start, 2, 1)
    expect(second?.cursor).toEqual({ theme: 'travail', person: 1 })
    expect(shiftMotive(second ?? start, 2, 1)?.cursor).toEqual({ theme: 'sante', person: 0 })
    expect(shiftMotive(start, 2, -1)).toBeNull()
    const back = shiftMotive({ ...start, cursor: { theme: 'sante', person: 0 } }, 2, -1)
    expect(back?.cursor).toEqual({ theme: 'travail', person: 1 })
    const autre = { ...emptyMotives(2), cursor: { theme: 'autre' as const, person: 0 } }
    expect(motiveReady(autre)).toBe(true)
    expect(shiftMotive(autre, 2, 1)).toBeNull()
    const trip = {
      perWeek: '1',
      days: { semaine: { aller: [{ slot: '8-10' as const, flexible: false }], retour: [] } },
      modes: ['taxi'],
    }
    const filled = setPersonTheme({ ...autre, autre: 'Piscine' }, 0, 'autre', {
      goes: 'oui',
      actual: trip,
      bus: 'peut-etre',
      busOften: 'parfois',
      busTrip: trip,
    })
    expect(motiveReady(filled)).toBe(true)
    expect(shiftMotive(filled, 2, 1)?.cursor).toEqual({ theme: 'autre', person: 1 })
    expect(sanitizeMotives({ ...start, cursor: { theme: 'loisirs', person: 4 } }, 1, 0, 0).cursor).toEqual({
      theme: 'loisirs',
      person: 0,
    })
  })
})
