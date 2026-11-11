import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fieldClass } from './fill'
import { buttonClass } from './Button'

type TurnstileApi = {
  render: (element: HTMLElement, options: { sitekey: string; theme: 'light' }) => string
  getResponse: (id: string) => string
  reset: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

declare const __TURNSTILE_SITE_KEY__: string
declare const __CONTACT_URL__: string

export function ContactForm() {
  const siteKey = __TURNSTILE_SITE_KEY__
  const endpoint = __CONTACT_URL__ || '/api/contact'
  const captcha = useRef<HTMLDivElement>(null)
  const widget = useRef('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null)

  useEffect(() => {
    if (!siteKey || !captcha.current) return
    let cancelled = false
    void loadTurnstile()
      .then(() => {
        if (cancelled || !captcha.current || !window.turnstile || widget.current) return
        widget.current = window.turnstile.render(captcha.current, { sitekey: siteKey, theme: 'light' })
      })
      .catch(() => {
        if (!cancelled) setNotice({ tone: 'warn', text: 'La vérification anti-robot n’a pas pu se charger.' })
      })
    return () => {
      cancelled = true
    }
  }, [siteKey])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    setNotice(null)
    if (!email.trim()) {
      setNotice({ tone: 'warn', text: 'Indiquez une adresse mail.' })
      return
    }
    if (!message.trim()) {
      setNotice({ tone: 'warn', text: 'Écrivez votre message.' })
      return
    }
    const token = widget.current && window.turnstile ? window.turnstile.getResponse(widget.current) : ''
    if (!siteKey || !token) {
      setNotice({ tone: 'warn', text: 'Confirmez que vous n’êtes pas un robot.' })
      return
    }
    setSending(true)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, message, token }),
      })
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!response.ok || !data?.ok) {
        setNotice({ tone: 'warn', text: data?.error || 'Le message n’a pas pu être envoyé. Réessayez dans un moment.' })
        if (widget.current) window.turnstile?.reset(widget.current)
        return
      }
      setEmail('')
      setMessage('')
      if (widget.current) window.turnstile?.reset(widget.current)
      setNotice({ tone: 'ok', text: 'Message envoyé. Nous vous répondrons à cette adresse.' })
    } catch {
      setNotice({ tone: 'warn', text: 'Le message n’a pas pu être envoyé. Réessayez dans un moment.' })
      if (widget.current) window.turnstile?.reset(widget.current)
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="mt-6 grid gap-3 rounded-2xl bg-card px-4 py-4 text-ink" onSubmit={(event) => void submit(event)}>
      <h3 className="text-lg font-extrabold">Écrire au collectif</h3>
      <label className="block text-base font-extrabold">
        Adresse mail
        <input
          type="email"
          value={email}
          autoComplete="email"
          maxLength={120}
          required
          className={`mt-2 min-h-12 w-full rounded-2xl px-4 text-base font-medium ${fieldClass(Boolean(email.trim()), false)}`}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="block text-base font-extrabold">
        Message
        <textarea
          value={message}
          required
          maxLength={4000}
          rows={5}
          className={`mt-2 min-h-28 w-full rounded-2xl px-4 py-3 text-base font-medium ${fieldClass(Boolean(message.trim()), false)}`}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <div ref={captcha} className="min-h-16" />
      {notice ? (
        <p role="status" className={`text-sm font-semibold leading-relaxed ${notice.tone === 'ok' ? 'text-leaf' : 'text-clay'}`}>
          {notice.text}
        </p>
      ) : null}
      <button type="submit" disabled={sending} className={buttonClass('primary')}>
        {sending ? 'Envoi…' : 'Envoyer'}
      </button>
      <p className="text-sm font-medium leading-relaxed text-muted">Votre adresse sert uniquement à vous répondre.</p>
    </form>
  )
}

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  const found = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
  if (found) {
    return new Promise((resolve, reject) => {
      found.addEventListener('load', () => resolve(), { once: true })
      found.addEventListener('error', () => reject(new Error('captcha')), { once: true })
    })
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.dataset.turnstile = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('captcha'))
    document.head.appendChild(script)
  })
}
