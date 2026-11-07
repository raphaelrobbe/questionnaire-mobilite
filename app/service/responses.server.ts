import { assertEndpoint } from '~/common/endpoint'
import { readSheetResult } from '~/common/http'
import { mailBody, responseBody, type ResponseRecord } from '~/common/response'

/**
 * Envoi Node vers le script Google, ou vers une route /api/ le jour où elle existera.
 * Ne pas importer ce module depuis un composant : le navigateur passe par `app/lib/sheets.client.ts`.
 * Contrairement au téléphone, ce chemin lit la réponse JSON et peut confirmer la ligne.
 */
export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<Response>

export async function submitResponse(
  record: ResponseRecord,
  endpoint: string,
  fetchImpl: FetchLike = fetch,
  adminEndpoint = '',
): Promise<'confirmed'> {
  const mail = mailBody(record)
  if (mail) {
    const admin = assertEndpoint(adminEndpoint)
    const mailResponse = await fetchImpl(admin.url, {
      method: 'POST',
      headers: {
        'Content-Type': admin.kind === 'future-api' ? 'application/json' : 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(mail),
    })
    await readSheetResult(mailResponse)
  }
  const target = assertEndpoint(endpoint)
  const response = await fetchImpl(target.url, {
    method: 'POST',
    headers: {
      'Content-Type': target.kind === 'future-api' ? 'application/json' : 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(responseBody(record)),
  })
  await readSheetResult(response)
  return 'confirmed'
}
