import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { acceptContact } from '../common/contact'
import { sendContactMail, type SmtpEnv } from './contact.server'

export function contactDevApi(env: SmtpEnv): Plugin {
  return {
    name: 'contact-dev-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0]
        if (req.method !== 'POST' || path !== '/api/contact') {
          next()
          return
        }
        void receive(req, res, env)
      })
    },
  }
}

async function receive(req: IncomingMessage, res: ServerResponse, env: SmtpEnv) {
  try {
    const body = await readBody(req)
    const result = await acceptContact(env.TURNSTILE_SECRET_KEY, body, undefined, (letter) => sendContactMail(env, letter))
    json(res, result.status, result.error ? { ok: false, error: result.error } : { ok: true })
  } catch {
    json(res, 400, { ok: false, error: 'Le message n’a pas pu être lu.' })
  }
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 20_000) {
        reject(new Error('large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, body: { ok: boolean; error?: string }) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}
