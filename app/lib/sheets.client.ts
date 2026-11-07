import { assertEndpoint } from '~/common/endpoint'
import { readSheetResult } from '~/common/http'
import { mailBody, pingBody, responseBody, type ResponseRecord } from '~/common/response'

export type SendStatus = 'confirmed' | 'sent'

/**
 * Un POST par script, en no-cors. Un essai « CORS puis no-cors » écrirait la ligne deux fois :
 * le script exécute la requête même quand le navigateur n'a pas le droit de lire la réponse.
 * L'adresse part d'abord vers le script privé, la fiche ensuite vers le script public.
 */
export async function submitRecord(record: ResponseRecord, endpoint: string, adminEndpoint: string): Promise<SendStatus> {
  const mail = mailBody(record)
  const mailed = mail ? await post(adminEndpoint, JSON.stringify(mail)) : null
  const responses = await post(endpoint, JSON.stringify(responseBody(record)))
  return mailed === 'confirmed' && responses === 'confirmed' ? 'confirmed' : responses
}

export async function probeEndpoint(endpoint: string): Promise<SendStatus> {
  const target = assertEndpoint(endpoint)
  if (target.kind === 'future-api') {
    const response = await fetch(target.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pingBody()),
    })
    await readSheetResult(response)
    return 'confirmed'
  }
  try {
    const response = await fetch(target.url, { method: 'GET', redirect: 'follow', cache: 'no-store' })
    await readSheetResult(response)
    return 'confirmed'
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
  }
  await postBlind(target.url, JSON.stringify(pingBody()))
  return 'sent'
}

async function post(endpoint: string, body: string): Promise<SendStatus> {
  const target = assertEndpoint(endpoint)
  if (target.kind === 'future-api') {
    const response = await fetch(target.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    await readSheetResult(response)
    return 'confirmed'
  }
  await postBlind(target.url, body)
  return 'sent'
}

function postBlind(url: string, body: string): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    redirect: 'follow',
    cache: 'no-store',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
  })
}
