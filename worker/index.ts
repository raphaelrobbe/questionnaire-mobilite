import { acceptContact } from '../app/common/contact'
import { sendSmtp } from './smtp'

type Env = {
  SMTP_HOST: string
  SMTP_PORT: string
  SMTP_USER: string
  SMTP_PASSWORD: string
  SMTP_TO: string
  TURNSTILE_SECRET_KEY: string
}

const ORIGINS = new Set([
  'http://localhost:4317',
  'http://127.0.0.1:4317',
  'https://enquete-mobilite-haut-doubs.fr',
  'https://www.enquete-mobilite-haut-doubs.fr',
  'https://raphaelrobbe.github.io',
])

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    if (!origin || !ORIGINS.has(origin)) return new Response(null, { status: 403 })
    if (request.method === 'OPTIONS') return cors(origin, new Response(null, { status: 204 }))
    if (request.method !== 'POST') return json(origin, 405, { ok: false, error: 'Envoi impossible.' })
    try {
      const body = await request.json()
      const ip = request.headers.get('CF-Connecting-IP') ?? undefined
      const result = await acceptContact(env.TURNSTILE_SECRET_KEY, body, ip, (letter) => sendSmtp(env, letter))
      return json(origin, result.status, result.error ? { ok: false, error: result.error } : { ok: true })
    } catch {
      return json(origin, 400, { ok: false, error: 'Le message n’a pas pu être lu.' })
    }
  },
}

function json(origin: string, status: number, body: { ok: boolean; error?: string }) {
  return cors(origin, new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } }))
}

function cors(origin: string, response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('access-control-allow-origin', origin)
  headers.set('access-control-allow-methods', 'POST, OPTIONS')
  headers.set('access-control-allow-headers', 'content-type')
  headers.set('vary', 'Origin')
  return new Response(response.body, { status: response.status, headers })
}
