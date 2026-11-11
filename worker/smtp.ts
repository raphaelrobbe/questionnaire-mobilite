import { connect } from 'cloudflare:sockets'
import { CONTACT_FROM, CONTACT_TO, SMTP_HOST, SMTP_PORT, dotStuff, recipientFor, rfc822, type ContactLetter } from '../app/common/contact'
import { takeSmtpReply } from '../app/common/smtpReply'

/** Port 465 : la connexion est chiffrée dès le départ. */
export async function sendSmtp(
  env: { SMTP_HOST: string; SMTP_PORT: string; SMTP_USER: string; SMTP_PASSWORD: string; SMTP_TO: string },
  letter: ContactLetter,
): Promise<void> {
  const port = Number(env.SMTP_PORT) || SMTP_PORT
  if (port !== SMTP_PORT) throw new Error('smtp')
  const socket = connect({ hostname: env.SMTP_HOST || SMTP_HOST, port }, { secureTransport: 'on' })
  const session = new SmtpSession(socket)
  try {
    await session.expect(220)
    await session.command(`EHLO ${ehloHost(env.SMTP_USER || CONTACT_FROM)}`, 250)
    await session.command('AUTH LOGIN', 334)
    await session.command(b64(env.SMTP_USER || CONTACT_FROM), 334)
    await session.command(b64(env.SMTP_PASSWORD), 235)
    const from = env.SMTP_USER || CONTACT_FROM
    const to = recipientFor(letter.box, env.SMTP_TO || CONTACT_TO)
    await session.command(`MAIL FROM:<${from}>`, 250)
    await session.command(`RCPT TO:<${to}>`, 250)
    await session.command('DATA', 354)
    await session.write(`${dotStuff(rfc822(from, to, letter))}\r\n.\r\n`)
    await session.expect(250)
    await session.command('QUIT', 221)
  } finally {
    await socket.close().catch(() => undefined)
  }
}

function ehloHost(user: string): string {
  const host = user.split('@')[1]
  return host || 'localhost'
}

function b64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

class SmtpSession {
  private reader: ReadableStreamDefaultReader<Uint8Array>
  private writer: WritableStreamDefaultWriter<Uint8Array>
  private buffer = ''

  constructor(socket: { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> }) {
    this.reader = socket.readable.getReader()
    this.writer = socket.writable.getWriter()
  }

  async command(line: string, code: number) {
    await this.write(`${line}\r\n`)
    await this.expect(code)
  }

  async write(text: string) {
    await this.writer.write(new TextEncoder().encode(text))
  }

  async expect(code: number) {
    const reply = await this.read()
    if (reply !== code) throw new Error('smtp')
  }

  private async read(): Promise<number> {
    while (true) {
      const ready = takeSmtpReply(this.buffer)
      if (ready) {
        this.buffer = ready.rest
        return ready.code
      }
      const { value, done } = await this.reader.read()
      if (done) throw new Error('smtp')
      this.buffer += new TextDecoder().decode(value, { stream: true })
    }
  }
}
