import { describe, expect, test } from 'vitest'
import { emptyAnswers, patchAnswers } from '~/common/survey'
import type { ResponseRecord } from '~/common/response'
import { submitResponse, type FetchLike } from './responses.server'

const endpoint = 'https://script.google.com/macros/s/abc123/exec'

function record(): ResponseRecord {
  return {
    id: 'id-1',
    createdAt: '2026-11-06T12:00:00.000Z',
    deviceId: 'device',
    interviewer: 'Camille',
    place: 'Marché',
    latitude: null,
    longitude: null,
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
    }),
  }
}

describe('envoi serveur', () => {
  test('confirme la ligne et laisse le jeton hors des colonnes', async () => {
    let body = ''
    let contentType = ''
    const fetchImpl: FetchLike = async (_url, init) => {
      body = init.body
      contentType = init.headers['Content-Type']
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    await expect(submitResponse(record(), endpoint, 'secret', fetchImpl)).resolves.toBe('confirmed')
    const parsed = JSON.parse(body) as { token: string; row: { habitation: string; mode_principal: string } }
    expect(contentType).toContain('text/plain')
    expect(parsed.token).toBe('secret')
    expect(parsed.row.habitation).toBe('Centre')
    expect(parsed.row.mode_principal).toBe('Vélo')
    expect('token' in parsed.row).toBe(false)
  })

  test('n’appelle pas le réseau si l’adresse est le lien du tableur', async () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error('ne pas appeler')
    }
    await expect(submitResponse(record(), 'https://docs.google.com/spreadsheets/d/abc/edit', '', fetchImpl)).rejects.toThrow(/tableur/)
  })

  test('propage le refus du script', async () => {
    const fetchImpl: FetchLike = async () => new Response(JSON.stringify({ ok: false, error: 'Jeton refusé.' }), { status: 200 })
    await expect(submitResponse(record(), endpoint, 'mauvais', fetchImpl)).rejects.toThrow('Jeton refusé.')
  })
})
