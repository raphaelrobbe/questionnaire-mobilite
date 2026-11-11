import { describe, expect, test } from 'vitest'
import { emptyAnswers, patchAnswers } from '~/common/survey'
import type { ResponseRecord } from '~/common/response'
import { submitResponse, type FetchLike } from './responses.server'

const endpoint = 'https://script.google.com/macros/s/abc123/exec'
const adminEndpoint = 'https://script.google.com/macros/s/admin999/exec'

function record(): ResponseRecord {
  return {
    id: 'id-1',
    createdAt: '2026-11-06T12:00:00.000Z',
    deviceId: 'device',
    interviewer: 'Camille',
    test: false,
    latitude: null,
    longitude: null,
    answers: patchAnswers(emptyAnswers(), {
      commune: 'Lyon',
      people: [{ age: '40-64', drive: 'oui', manqueAutonomie: false, electoral: '', electoralCommune: '' }],
    }),
  }
}

describe('envoi serveur', () => {
  test('confirme la ligne sans jeton', async () => {
    let body = ''
    let contentType = ''
    const fetchImpl: FetchLike = async (_url, init) => {
      body = init.body
      contentType = init.headers['Content-Type']
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    await expect(submitResponse(record(), endpoint, fetchImpl)).resolves.toBe('confirmed')
    const parsed = JSON.parse(body) as { row: { commune: string } }
    expect(contentType).toContain('text/plain')
    expect(parsed.row.commune).toBe('Lyon')
    expect('token' in parsed).toBe(false)
  })

  test('n’appelle pas le réseau si l’adresse est le lien du tableur', async () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error('ne pas appeler')
    }
    await expect(submitResponse(record(), 'https://docs.google.com/spreadsheets/d/abc/edit', fetchImpl)).rejects.toThrow(/tableur/)
  })

  test('envoie l’adresse au script privé, avec le code, et pas au script public', async () => {
    const calls: { url: string; body: string }[] = []
    const fetchImpl: FetchLike = async (url, init) => {
      calls.push({ url, body: init.body })
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    const withMail = record()
    withMail.answers = patchAnswers(withMail.answers, { collectif: true, email: 'Ada@Exemple.fr' })
    await submitResponse(withMail, endpoint, fetchImpl, adminEndpoint)
    expect(calls.map((call) => call.url)).toEqual([adminEndpoint, endpoint])
    expect(calls[0]?.body).toContain('ada@exemple.fr')
    expect(calls[0]?.body).toContain(withMail.id)
    expect(calls[1]?.body).not.toContain('ada@exemple.fr')
  })

  test('envoie une réponse de test seulement au script public', async () => {
    const calls: { url: string; body: string }[] = []
    const fetchImpl: FetchLike = async (url, init) => {
      calls.push({ url, body: init.body })
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    await submitResponse({ ...record(), test: true }, endpoint, fetchImpl, adminEndpoint)
    expect(calls.map((call) => call.url)).toEqual([endpoint])
    expect(JSON.parse(calls[0]?.body ?? '{}').test).toBe(true)
  })

  test('propage le refus du script', async () => {
    const fetchImpl: FetchLike = async () => new Response(JSON.stringify({ ok: false, error: 'Appareil non autorisé.' }), { status: 200 })
    await expect(submitResponse(record(), endpoint, fetchImpl)).rejects.toThrow('Appareil non autorisé.')
  })
})
