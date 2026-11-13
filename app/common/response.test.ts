import { describe, expect, test } from 'vitest'
import { COLLECTIF_CONSENT, PHONE_CONSENT } from './consent'
import { emptyAnswers, patchAnswers } from './survey'
import { SHEET_HEADERS, forgetPersonal, holdsPersonal, isResponseCode, mailBody, responseBody, responseCode, responseIsKept, toSheetRow, type ResponseRecord } from './response'

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
        { age: '40-64', drive: 'oui', manqueAutonomie: false, electoral: '', electoralCommune: '' },
        { age: '0-14', drive: 'non', manqueAutonomie: false, electoral: '', electoralCommune: '' },
      ],
      cars: [{ motor: 'hybride', sansPermis: false }],
      twoWheelers: [{ motor: 'electrique', sansPermis: true }],
      ...patch,
    }),
  }
}

describe('fiche enregistrée', () => {
  test('retire nom, adresse, contact et position, et garde le reste', () => {
    const source = record({
      civilite: 'madame',
      nom: 'Martin',
      prenom: 'Ada',
      adresse: '1 grande rue',
      complement: 'étage 2',
      recontact: 'oui',
      phone: '06 12 34 56 78',
      collectif: true,
      email: 'ada@exemple.fr',
    })
    expect(holdsPersonal(source)).toBe(true)
    const kept = forgetPersonal(source)
    expect(holdsPersonal(kept)).toBe(false)
    expect(kept.id).toBe(source.id)
    expect(kept.answers.commune).toBe('Lyon')
    expect(kept.answers.people).toHaveLength(2)
    expect(kept.answers.cars).toHaveLength(1)
    expect(kept.answers.recontact).toBe('oui')
    expect(kept.answers.collectif).toBe(true)
    expect(kept.answers.civilite).toBe('')
    expect(kept.answers.nom).toBe('')
    expect(kept.answers.prenom).toBe('')
    expect(kept.answers.adresse).toBe('')
    expect(kept.answers.complement).toBe('')
    expect(kept.answers.email).toBe('')
    expect(kept.answers.phone).toBe('')
    expect(kept.latitude).toBeNull()
    expect(kept.longitude).toBeNull()
    const legacy = { latitude: null, longitude: null, answers: {} } as ResponseRecord
    expect(holdsPersonal(legacy)).toBe(false)
    expect(forgetPersonal(legacy).answers.nom).toBe('')
  })
})

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
    expect(row.horodatage_utc).toBe('2026-11-06T12:00:00.000Z')
    expect(row.horodatage_debut).toBe('')
    expect(row.horodatage_fin).toBe('')
    expect(row.visites).toBe('')
    const stamped = toSheetRow({
      ...record(),
      createdAt: '2026-11-11T16:00:00.000Z',
      answers: patchAnswers(record().answers, {
        visits: [
          { outcome: 'absente', at: '2026-11-11T12:00:00.000Z' },
          { outcome: 'commencer', at: '2026-11-11T15:00:00.000Z' },
        ],
        startedAt: '2026-11-11T15:05:00.000Z',
        finishedAt: '2026-11-11T16:00:00.000Z',
      }),
    })
    expect(stamped.horodatage_utc).toBe('2026-11-11T16:00:00.000Z')
    expect(stamped.horodatage_debut).toBe('2026-11-11T15:05:00.000Z')
    expect(stamped.horodatage_fin).toBe('2026-11-11T16:00:00.000Z')
    expect(stamped.visites).toContain('La personne était absente')
    expect(stamped.visites).toContain('Commencer l’enquête')
    expect(row.commune).toBe('Lyon')
    expect('version' in row).toBe(false)
    expect(row.personnes).toBe('2')
    expect(row.detail_personnes).toBe('40–64 ans, conduit · 0–14 ans')
    expect(row.voitures).toBe('1')
    expect(row.detail_voitures).toBe('Hybride')
    expect(row.handicap).toBe('')
    expect(row.handicap_adaptations).toBe('')
    expect(row.handicap_qui).toBe('')
    const adapted = toSheetRow(
      record({
        handicap: 'oui',
        handicapTypes: ['montee', 'autre'],
        handicapAutre: 'siège enfant',
        handicapConcern: 'oui',
        handicapWho: ['foyer'],
      }),
    )
    expect(adapted.handicap).toBe('Oui')
    expect(adapted.handicap_adaptations).toContain('montée')
    expect(adapted.handicap_adaptations).toContain('Autre : siège enfant')
    expect(adapted.handicap_qui).toBe('une ou plusieurs personnes de mon foyer')
    expect(adapted.handicap_commentaire).toBe('')
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
      record({ civilite: 'madame', nom: 'Martin', prenom: 'Ada', adresse: '12 rue de la Gare', recontact: 'oui', phone: '+33 6 12 34 56 78' }),
    )
    expect(plain.email).toBe('')
    expect(plain.civilite).toBe('Mme')
    expect(plain.nom).toBe('Martin')
    expect(plain.prenom).toBe('Ada')
    expect(JSON.stringify(responseBody(record({ civilite: 'madame', nom: 'Martin' })))).not.toContain('Madame')
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
