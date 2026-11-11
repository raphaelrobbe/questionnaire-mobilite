import { describe, expect, test } from 'vitest'
import { communesOnOffer, deviceAllowed, filterCommunes, formatDeviceCell, interviewerForDevice, isAdminSession, normalizeDeviceId, normalizePhone, parseDeviceCell, readListsPayload } from './config'

describe('listes du tableur', () => {
  test('filtre sur le début du nom, sans tenir compte des accents', () => {
    const communes = ['Lyon', 'Saint-Étienne', 'Les Abrets', 'Marseille']
    expect(filterCommunes(communes, 'sai')).toEqual(['Saint-Étienne'])
    expect(filterCommunes(communes, 'abr')).toEqual(['Les Abrets'])
    expect(filterCommunes(communes, '')).toEqual(communes)
    expect(filterCommunes(communes, '   ')).toEqual(communes)
    expect(filterCommunes(communes, 'zz')).toEqual([])
  })

  test('place Pontarlier en tête, même s’il n’est pas dans la feuille', () => {
    expect(communesOnOffer(['Jougne', 'Métabief'])).toEqual(['Pontarlier', 'Jougne', 'Métabief'])
    expect(communesOnOffer(['Jougne', 'pontarlier', 'Métabief'])).toEqual(['Pontarlier', 'Jougne', 'Métabief'])
    expect(filterCommunes(communesOnOffer(['Jougne']), '')[0]).toBe('Pontarlier')
    expect(filterCommunes(communesOnOffer(['Jougne']), 'jou')).toEqual(['Jougne'])
  })

  test('lit les enquêteurs sans révéler les identifiants, et les révèle à l’administrateur', () => {
    expect(
      readListsPayload({
        ok: true,
        interviewers: [
          { name: ' Ada ', admin: true, authorized: true },
          { name: 'Camille', admin: false, authorized: false, devices: ['ABC', 'abc'] },
        ],
        communes: ['Lyon'],
      }),
    ).toEqual({
      interviewers: [
        { name: 'Ada', admin: true, authorized: true, devices: null, phone: '' },
        { name: 'Camille', admin: false, authorized: false, devices: ['abc'], phone: '' },
      ],
    })
    expect(() => readListsPayload({ ok: true, interviewers: [{ name: 'Ada', devices: ['abc'] }] })).toThrow(/redéployez/)
    expect(() => readListsPayload({ ok: true, interviewers: ['Ada'], communes: ['Lyon'] })).toThrow(/redéployez/)
    expect(() => readListsPayload({ ok: true, service: 'questionnaire-mobilite' })).toThrow(/redéployez/)
    expect(() => readListsPayload({ ok: false, error: 'Colonne introuvable.' })).toThrow('Colonne introuvable.')
  })

  test('lit une cellule d’identifiants vide, seule, ou entre crochets', () => {
    expect(parseDeviceCell('')).toEqual([])
    expect(parseDeviceCell('[]')).toEqual([])
    expect(parseDeviceCell('[ ]')).toEqual([])
    expect(parseDeviceCell('ABC')).toEqual(['abc'])
    expect(parseDeviceCell('[abc, DEF, abc]')).toEqual(['abc', 'def'])
    expect(formatDeviceCell([])).toBe('[]')
    expect(formatDeviceCell(['abc'])).toBe('[abc]')
    expect(formatDeviceCell(['abc', 'def'])).toBe('[abc, def]')
    expect(normalizeDeviceId('[ABC]')).toBe('abc')
    expect(normalizeDeviceId('[a, b]')).toBeNull()
  })

  test('n’autorise un appareil que s’il est listé pour l’enquêteur, et jamais si la cellule est vide', () => {
    const interviewers = [
      { name: 'Ada', admin: true, authorized: true, devices: ['abc'], phone: '' },
      { name: 'Camille', admin: false, authorized: false, devices: [] as string[], phone: '' },
      { name: 'Noé', admin: false, authorized: true, devices: null, phone: '' },
    ]
    expect(deviceAllowed(interviewers, 'Ada', 'ABC')).toBe(true)
    expect(deviceAllowed(interviewers, 'Ada', 'autre')).toBe(false)
    expect(deviceAllowed(interviewers, 'Camille', 'abc')).toBe(false)
    expect(deviceAllowed(interviewers, 'Noé', 'inconnu')).toBe(true)
    expect(deviceAllowed(interviewers, '', 'abc')).toBe(false)
    expect(isAdminSession(interviewers, 'Ada')).toBe(true)
    expect(isAdminSession(interviewers, 'Camille')).toBe(false)
    expect(isAdminSession(interviewers, 'Noé')).toBe(false)
  })

  test('retrouve le nom à partir de l’identifiant, sans liste à choisir', () => {
    const hidden = [
      { name: 'Ada', admin: true, authorized: false, devices: null, phone: '' },
      { name: 'Camille', admin: false, authorized: true, devices: null, phone: '' },
    ]
    expect(interviewerForDevice(hidden, 'abc')?.name).toBe('Camille')
    const revealed = [
      { name: 'Ada', admin: true, authorized: false, devices: ['zzz'], phone: '' },
      { name: 'Camille', admin: false, authorized: true, devices: ['abc'], phone: '' },
    ]
    expect(interviewerForDevice(revealed, 'ABC')?.name).toBe('Camille')
    expect(interviewerForDevice(revealed, 'absent')).toBeNull()
    expect(interviewerForDevice([{ name: 'Ada', admin: false, authorized: true, devices: [], phone: '' }], 'abc')).toBeNull()
    expect(interviewerForDevice(hidden, '')).toBeNull()
    expect(interviewerForDevice([], 'abc')).toBeNull()
  })

  test('accepte un numéro facultatif, et refuse un texte qui n’en est pas un', () => {
    expect(normalizePhone('')).toBe('')
    expect(normalizePhone('  06 12 34 56 78  ')).toBe('06 12 34 56 78')
    expect(normalizePhone('+33 6 12 34 56 78')).toBe('+33 6 12 34 56 78')
    expect(normalizePhone('bureau')).toBeNull()
    expect(normalizePhone('123')).toBeNull()
    expect(
      readListsPayload({
        ok: true,
        interviewers: [{ name: 'Ada', admin: false, authorized: false, phone: ' 06 12 34 56 78 ' }],
      }).interviewers[0]?.phone,
    ).toBe('06 12 34 56 78')
  })
})
