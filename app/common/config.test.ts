import { describe, expect, test } from 'vitest'
import { communesOnOffer, deviceAllowed, filterCommunes, formatDeviceCell, isAdminSession, normalizeDeviceId, parseDeviceCell, readListsPayload, startRefusal } from './config'

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
        { name: 'Ada', admin: true, authorized: true, devices: null },
        { name: 'Camille', admin: false, authorized: false, devices: ['abc'] },
      ],
      communes: ['Lyon'],
    })
    expect(() => readListsPayload({ ok: true, interviewers: [{ name: 'Ada', devices: ['abc'] }], communes: ['Lyon'] })).toThrow(/redéployez/)
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
      { name: 'Ada', admin: true, authorized: true, devices: ['abc'] },
      { name: 'Camille', admin: false, authorized: false, devices: [] as string[] },
      { name: 'Noé', admin: false, authorized: true, devices: null },
    ]
    expect(deviceAllowed(interviewers, 'Ada', 'ABC')).toBe(true)
    expect(deviceAllowed(interviewers, 'Ada', 'autre')).toBe(false)
    expect(deviceAllowed(interviewers, 'Camille', 'abc')).toBe(false)
    expect(deviceAllowed(interviewers, 'Noé', 'inconnu')).toBe(true)
    expect(deviceAllowed(interviewers, '', 'abc')).toBe(false)
    expect(isAdminSession(interviewers, 'Ada')).toBe(true)
    expect(isAdminSession(interviewers, 'Camille')).toBe(false)
    expect(isAdminSession(interviewers, 'Noé')).toBe(false)
    expect(startRefusal(interviewers, '', 'abc')).toMatch(/enquêteur/)
    expect(startRefusal(interviewers, 'Camille', 'abc')).toMatch(/pas autorisé/)
    expect(startRefusal(interviewers, 'Ada', 'abc')).toBeNull()
  })
})
