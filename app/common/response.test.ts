import { describe, expect, test } from 'vitest'
import { emptyAnswers, patchAnswers } from './survey'
import { SHEET_HEADERS, responseBody, toSheetRow, type ResponseRecord } from './response'

function record(patch: Parameters<typeof patchAnswers>[1] = {}): ResponseRecord {
  return {
    id: 'id-1',
    createdAt: '2026-11-06T12:00:00.000Z',
    deviceId: 'device-1',
    interviewer: ' Camille ',
    place: 'Marché',
    latitude: 48.8566,
    longitude: 2.3522,
    answers: patchAnswers(emptyAnswers(), {
      habitation: 'Centre',
      age: '35-49',
      mode: 'velo',
      trips: '1-2',
      purpose: 'travail',
      duration: '20',
      frictions: ['trottoirs'],
      priority: 'trottoirs',
      score: '4',
      recontact: 'non',
      contact: 'ne doit pas partir',
      ...patch,
    }),
  }
}

describe('ligne du tableur', () => {
  test('aligne chaque colonne et écrit des libellés', () => {
    const row = toSheetRow(record())
    expect(Object.keys(row)).toEqual([...SHEET_HEADERS])
    expect(new Set(SHEET_HEADERS).size).toBe(SHEET_HEADERS.length)
    expect(row.enqueteur).toBe('Camille')
    expect(row.mode_principal).toBe('Vélo')
    expect(row.age).toBe('35–49 ans')
    expect(row.note_mobilite).toBe('4')
    expect(row.version).toBe('1')
    expect(row.latitude).toBe('48.856600')
    expect(row.coordonnees).toBe('')
    expect(row.genes).toBe('Les trottoirs sont mauvais ou absents')
  })

  test('garde le jeton hors de la ligne', () => {
    const body = responseBody(record({ recontact: 'oui', contact: 'ada@example.test' }), 'secret')
    expect(body.token).toBe('secret')
    expect(body.headers).toEqual([...SHEET_HEADERS])
    expect(body.row.coordonnees).toBe('ada@example.test')
    expect('token' in body.row).toBe(false)
  })

  test('laisse la position vide quand elle n’a pas été notée', () => {
    const row = toSheetRow({ ...record(), latitude: null, longitude: Number.NaN })
    expect(row.latitude).toBe('')
    expect(row.longitude).toBe('')
  })
})
