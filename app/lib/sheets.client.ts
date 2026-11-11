import { DeviceUnknown, interviewerForDevice } from '~/common/config'
import { assertEndpoint, classifyEndpoint } from '~/common/endpoint'
import { readSheetResult } from '~/common/http'
import { readStoredFlag } from '~/common/receipt'
import { mailBody, pingBody, responseBody, type ResponseRecord } from '~/common/response'
import { fetchSheetLists, getScriptJson, publishLists } from '~/lib/config.client'
import { loadSettings, updateSettings } from '~/lib/settings.client'

export type SendStatus = 'confirmed' | 'sent'

/**
 * Un POST par script, en no-cors. Un essai « CORS puis no-cors » écrirait la ligne deux fois :
 * le script exécute la requête même quand le navigateur n'a pas le droit de lire la réponse.
 * L'adresse part d'abord vers le script privé, la fiche ensuite vers le script public.
 */
/**
 * Relit Enquêteurs avec l’identifiant. Sans correspondance, rien ne doit être envoyé.
 * Une panne de réseau ou de script reste une erreur ordinaire : le nom gardé n’est pas retiré ici.
 */
export async function confirmInterviewer(adminEndpoint: string, deviceId: string): Promise<string> {
  const admin = classifyEndpoint(adminEndpoint)
  if (!admin.ok || admin.kind !== 'google-script') throw new Error('Le tableur privé n’est pas branché.')
  const lists = await fetchSheetLists(admin.url, { device: deviceId, who: loadSettings().interviewer })
  const person = interviewerForDevice(lists.interviewers, deviceId)
  if (!person) throw new DeviceUnknown()
  publishLists(lists)
  updateSettings({ interviewer: person.name })
  return person.name
}

export async function submitRecord(
  record: ResponseRecord,
  endpoint: string,
  adminEndpoint: string,
  mail = true,
): Promise<SendStatus> {
  if (record.test) return post(endpoint, JSON.stringify(responseBody(record)))
  if (!mail) return post(endpoint, JSON.stringify(responseBody(record)))
  const mailed = await post(adminEndpoint, JSON.stringify(mailBody(record)))
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

export async function codeIsStored(endpoint: string, code: string, test = false): Promise<boolean> {
  const target = classifyEndpoint(endpoint)
  if (!target.ok || target.kind !== 'google-script') return false
  const url = new URL(target.url)
  url.searchParams.set('action', 'code')
  url.searchParams.set('code', code)
  if (test) url.searchParams.set('test', '1')
  const payload = await getScriptJson(url, 8000, 'Le tableur des réponses ne répond pas.')
  return readStoredFlag(payload)
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
