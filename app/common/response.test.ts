import { describe, expect, test } from 'vitest'
import { COLLECTIF_CONSENT, PHONE_CONSENT } from './consent'
import { emptyAnswers, patchAnswers } from './survey'
import { SHEET_HEADERS, isResponseCode, mailBody, responseBody, responseCode, responseIsKept, toSheetRow, type ResponseRecord } from './response'

function record(patch: Parameters<typeof patchAnswers>[1] = {}): ResponseRecord {
  return {
    id: 'id-1',
    createdAt: '2026-11-06T12:00:00.000Z',
    deviceId: 'device-1',
    interviewer: ' Camille ',
    test: false,
    latitude: 48.8566,
    longitude: 2.3522,
    answers: patchAnswers(emptyAnswers(), {
      commune: 'Lyon',
      people: [
        { age: '40-64', drive: 'oui', manqueAutonomie: false },
        { age: '0-14', drive: 'non', manqueAutonomie: false },
      ],
      cars: [{ motor: 'hybride', sansPermis: false }],
      twoWheelers: [{ motor: 'electrique', sansPermis: true }],
      ...patch,
    }),
  }
}

describe('code de la fiche', () => {
  test('fait huit caractères en deux groupes de quatre', () => {
    const bytes = [0, 1, 2, 3, 10, 11, 35, 36, 252, 255]
    let index = 0
    const code = responseCode(() => bytes[index++])
    expect(code).toBe('ABCD-KL9A')
    expect(isResponseCode(code)).toBe(true)
    expect(isResponseCode(responseCode())).toBe(true)
    expect(isResponseCode('abcd-kl9a')).toBe(false)
  })
})

describe('ligne du tableur', () => {
  test('aligne chaque colonne et écrit des libellés', () => {
    const row = toSheetRow(record())
    expect(Object.keys(row)).toEqual([...SHEET_HEADERS])
    expect(new Set(SHEET_HEADERS).size).toBe(SHEET_HEADERS.length)
    expect(row.enqueteur).toBe('Camille')
    expect(row.commune).toBe('Lyon')
    expect('version' in row).toBe(false)
    expect(row.personnes).toBe('2')
    expect(row.detail_personnes).toBe('40–64 ans, conduit · 0–14 ans, ne conduit pas')
    expect(row.voitures).toBe('1')
    expect(row.detail_voitures).toBe('Hybride')
    expect(row.deux_trois_roues).toBe('1')
    expect(row.detail_deux_trois_roues).toBe('100 % électrique, sans permis')
    expect('latitude' in row).toBe(false)
    expect('longitude' in row).toBe(false)
  })

  test('garde l’adresse mail hors de la ligne publique, liée au code dans l’autre envoi', () => {
    const source = record({ recontact: 'oui', collectif: true, email: 'Ada@Exemple.fr' })
    const body = responseBody(source)
    expect(body.row.recontact).toBe('oui')
    expect(body.row.collectif).toBe('oui')
    expect(JSON.stringify(body)).not.toContain('ada@exemple.fr')
    expect('mail' in body).toBe(false)
    const mailed = mailBody(source)
    expect(mailed.email).toBe('ada@exemple.fr')
    expect(mailed.commune).toBe('Lyon')
    expect(mailed.latitude).toBe('48.856600')
    expect(mailed.recontact).toBe('oui')
    expect(mailed.texteRecontact).toBe(PHONE_CONSENT)
    expect(mailed.texteCollectif).toBe(COLLECTIF_CONSENT)
    expect(JSON.stringify(body)).not.toContain(PHONE_CONSENT)
    const remembered = mailBody(
      record({
        recontact: 'oui',
        recontactText: 'Phrase cochée pour le téléphone',
        phone: '06 12 34 56 78',
        collectif: true,
        collectifText: 'Phrase cochée pour le collectif',
        email: 'ada@exemple.fr',
      }),
    )
    expect(remembered.texteRecontact).toBe('Phrase cochée pour le téléphone')
    expect(remembered.texteCollectif).toBe('Phrase cochée pour le collectif')
    expect(JSON.stringify(responseBody(record({ recontactText: 'Phrase cochée pour le téléphone', collectifText: 'Phrase cochée pour le collectif' })))).not.toContain(
      'Phrase cochée',
    )
    expect(JSON.stringify(responseBody(source))).not.toContain('48.856600')
    const plain = mailBody(
      record({ nom: 'Martin', prenom: 'Ada', adresse: '12 rue de la Gare', recontact: 'oui', phone: '+33 6 12 34 56 78' }),
    )
    expect(plain.email).toBe('')
    expect(plain.nom).toBe('Martin')
    expect(plain.prenom).toBe('Ada')
    expect(plain.adresse).toBe('12 rue de la Gare')
    expect(plain.telephone).toBe('+33 6 12 34 56 78')
    expect(plain.texteRecontact).toBe(PHONE_CONSENT)
    expect(plain.texteCollectif).toBe('')
    expect(JSON.stringify(responseBody(record({ nom: 'Martin', adresse: '12 rue de la Gare' })))).not.toContain('Martin')
    expect(responseBody(record()).test).toBe(false)
    expect(responseBody({ ...record(), test: true }).test).toBe(true)
    expect(responseIsKept(record())).toBe(true)
    expect(responseIsKept({ ...record(), interviewer: '  ', test: false })).toBe(false)
    expect(responseIsKept({ ...record(), interviewer: '', test: true })).toBe(true)
  })
})
