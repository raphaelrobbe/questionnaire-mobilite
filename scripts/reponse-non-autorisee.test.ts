import { expect, test } from 'vitest'
import { classifyEndpoint } from '~/common/endpoint'
import { readStoredFlag } from '~/common/receipt'
import { emptyAnswers } from '~/common/survey'
import { responseBody, type ResponseRecord } from '~/common/response'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/** Nouveau code à chaque essai : une ligne déjà écrite ne fait pas échouer le suivant. */
function probeCode(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  let tail = ''
  for (const byte of bytes) tail += ALPHABET[byte % ALPHABET.length]
  return `XXXX-${tail}`
}

function probe(code: string): ResponseRecord {
  return {
    id: code,
    createdAt: '2026-01-01T00:00:00.000Z',
    deviceId: '',
    interviewer: '',
    test: false,
    latitude: null,
    longitude: null,
    answers: emptyAnswers(),
  }
}

test('sans identifiant d’appareil, la fiche n’est pas écrite dans Réponses', async () => {
  const endpoint = process.env.VITE_SHEETS_WEBAPP_URL ?? ''
  const target = classifyEndpoint(endpoint)
  if (!target.ok || target.kind !== 'google-script') {
    throw new Error('Le script public n’est pas configuré.')
  }

  const code = probeCode()
  const body = responseBody(probe(code))
  expect(body.test).toBe(false)
  expect(body.row.id).toBe(code)
  expect(body.row.appareil).toBe('')
  expect(body.row.enqueteur).toBe('')

  await postRow(target.url, JSON.stringify(body))

  const stored = await appearedInResponses(target.url, code)
  if (stored) {
    throw new Error(`La fiche ${code} a été écrite dans Réponses sans identifiant. Supprimez les lignes XXXX-.`)
  }
}, 120_000)

async function postRow(url: string, body: string): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      signal: AbortSignal.timeout(30_000),
    })
    await response.text().catch(() => '')
  } catch {
    throw new Error('Le script public ne répond pas.')
  }
}

/** Vrai seulement si ce code précis est lu dans la feuille. Une absence confirmée vaut faux. */
async function appearedInResponses(endpoint: string, code: string): Promise<boolean> {
  const url = new URL(endpoint)
  url.searchParams.set('action', 'code')
  url.searchParams.set('code', code)
  let answered = false
  for (let attempt = 0; attempt < 6; attempt++) {
    await wait(2_000)
    try {
      const payload = await readJson(url)
      if (readStoredFlag(payload)) return true
      answered = true
    } catch {
      /* Lecture illisible ou trop lente : on réessaie. */
    }
  }
  if (!answered) throw new Error('Le script public ne répond pas.')
  return false
}

async function readJson(url: URL): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new Error('Le script public ne répond pas.')
  }
  if (!response.ok) throw new Error('Le script public ne répond pas.')
  return response.json()
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
