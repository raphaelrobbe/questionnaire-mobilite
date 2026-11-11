import { createTransport } from 'nodemailer'
import { CONTACT_FROM, CONTACT_TO, SMTP_HOST, SMTP_PORT, type ContactLetter } from '../common/contact'

export type SmtpEnv = {
  SMTP_HOST: string
  SMTP_PORT: string
  SMTP_USER: string
  SMTP_PASSWORD: string
  SMTP_TO: string
  TURNSTILE_SECRET_KEY: string
}

export async function sendContactMail(env: SmtpEnv, letter: ContactLetter): Promise<void> {
  const port = Number(env.SMTP_PORT) || SMTP_PORT
  if (port !== SMTP_PORT) throw new Error('smtp')
  const user = env.SMTP_USER || CONTACT_FROM
  const transport = createTransport({
    host: env.SMTP_HOST || SMTP_HOST,
    port,
    secure: true,
    auth: { user, pass: env.SMTP_PASSWORD },
  })
  await transport.sendMail({
    from: user,
    to: env.SMTP_TO || CONTACT_TO,
    replyTo: letter.replyTo,
    subject: letter.subject,
    text: letter.text,
  })
}
