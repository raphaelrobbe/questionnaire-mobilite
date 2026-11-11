export const CONTACT_FROM = 'noreply@enquete-mobilite-haut-doubs.fr'
export const CONTACT_TO = 'contact@enquete-mobilite-haut-doubs.fr'
export const COLLECTIF_TO = 'zahndfrederique@gmail.com'
export const SMTP_HOST = 'smtp.ionos.fr'
export const SMTP_PORT = 465

export type ContactBox = 'enquete' | 'collectif'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MESSAGE_MAX = 4000

export type ContactInput = { email: string; message: string; token: string }
export type ContactLetter = { replyTo: string; subject: string; text: string; box: ContactBox }

export function readContact(input: unknown, tokenRequired = true): { ok: true; value: ContactInput } | { ok: false; error: string } {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const email = typeof source.email === 'string' ? source.email.trim() : ''
  const message = typeof source.message === 'string' ? source.message.trim() : ''
  const token = typeof source.token === 'string' ? source.token.trim() : ''
  if (!EMAIL.test(email) || email.length > 120 || /[\r\n]/.test(email)) return { ok: false, error: 'Indiquez une adresse mail.' }
  if (!message) return { ok: false, error: 'Écrivez votre message.' }
  if (message.length > MESSAGE_MAX) return { ok: false, error: 'Le message est trop long.' }
  if (tokenRequired && !token) return { ok: false, error: 'Confirmez que vous n’êtes pas un robot.' }
  return { ok: true, value: { email, message, token } }
}

/** Vrai seulement pour l’adresse TCP réelle, jamais pour un en-tête que le visiteur peut écrire. */
export function isLoopbackAddress(address: string | undefined): boolean {
  if (!address) return false
  const host = address.startsWith('::ffff:') ? address.slice('::ffff:'.length) : address
  return host === '127.0.0.1' || host === '::1'
}

/** Seules deux boîtes existent. Une valeur écrite par le visiteur ne devient jamais une adresse. */
export function readContactBox(input: unknown): ContactBox {
  const box = input && typeof input === 'object' ? (input as { box?: unknown }).box : undefined
  return box === 'collectif' ? 'collectif' : 'enquete'
}

export function recipientFor(box: ContactBox, surveyTo = CONTACT_TO): string {
  return box === 'collectif' ? COLLECTIF_TO : surveyTo
}

export function contactLetter(value: ContactInput, box: ContactBox = 'enquete'): ContactLetter {
  return {
    replyTo: value.email,
    subject: box === 'collectif' ? 'Message depuis la page du collectif' : 'Message depuis le site',
    text: `Adresse : ${value.email}\n\n${value.message}`,
    box,
  }
}

export function rfc822(from: string, to: string, letter: ContactLetter): string {
  const encoded = wrapBase64(base64Utf8(letter.text))
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${letter.replyTo}`,
    `Subject: ${letter.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    encoded,
  ].join('\r\n')
}

export function dotStuff(body: string): string {
  return body
    .replace(/\r?\n/g, '\r\n')
    .split('\r\n')
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n')
}

export async function turnstileOk(secret: string, token: string, ip?: string): Promise<boolean> {
  if (!secret || !token) return false
  const body = new FormData()
  body.set('secret', secret)
  body.set('response', token)
  if (ip) body.set('remoteip', ip)
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
  if (!response.ok) return false
  const data = (await response.json()) as { success?: boolean }
  return data.success === true
}

export async function acceptContact(
  secret: string,
  body: unknown,
  ip: string | undefined,
  send: (letter: ContactLetter) => Promise<void>,
  skipTurnstile = false,
): Promise<{ status: number; error?: string }> {
  const read = readContact(body, !skipTurnstile)
  if (!read.ok) return { status: 400, error: read.error }
  if (!skipTurnstile) {
    const human = await turnstileOk(secret, read.value.token, ip)
    if (!human) return { status: 400, error: 'La vérification a échoué. Réessayez.' }
  }
  try {
    await send(contactLetter(read.value, readContactBox(body)))
  } catch {
    return { status: 502, error: 'Le message n’a pas pu être envoyé. Réessayez dans un moment.' }
  }
  return { status: 200 }
}

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function wrapBase64(value: string): string {
  return value.replace(/.{1,76}/g, '$&\r\n').replace(/\r\n$/, '')
}
