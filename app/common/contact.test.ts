import { describe, expect, test } from 'vitest'
import { acceptContact, contactLetter, readContact, rfc822 } from './contact'
import { takeSmtpReply } from './smtpReply'

describe('formulaire de contact', () => {
  test('refuse une adresse ou un message vide', () => {
    expect(readContact({ email: 'pas une adresse', message: 'bonjour', token: 't' }).ok).toBe(false)
    const empty = readContact({ email: 'ada@exemple.fr', message: '  ', token: 't' })
    const robot = readContact({ email: 'ada@exemple.fr', message: 'bonjour', token: '' })
    if (empty.ok || robot.ok) throw new Error('lecture')
    expect(empty.error).toMatch(/message/)
    expect(robot.error).toMatch(/robot/)
  })

  test('garde l’adresse hors du sujet, pour éviter une injection d’en-tête', () => {
    const read = readContact({ email: 'ada@exemple.fr', message: 'Bonjour\nle collectif', token: 't' })
    if (!read.ok) throw new Error('lecture')
    const letter = contactLetter(read.value)
    expect(letter.subject).toBe('Message depuis le site')
    expect(letter.replyTo).toBe('ada@exemple.fr')
    expect(letter.text).toContain('Bonjour\nle collectif')
    expect(rfc822('noreply@exemple.fr', 'contact@exemple.fr', letter)).toContain('Reply-To: ada@exemple.fr')
  })

  test('n’envoie rien si Turnstile refuse', async () => {
    const original = globalThis.fetch
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false }))
    let sent = false
    try {
      const result = await acceptContact('secret', { email: 'ada@exemple.fr', message: 'bonjour', token: 'tok' }, undefined, async () => {
        sent = true
      })
      expect(result.status).toBe(400)
      expect(sent).toBe(false)
    } finally {
      globalThis.fetch = original
    }
  })

  test('envoie après une vérification réussie', async () => {
    const original = globalThis.fetch
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true }))
    let sent = false
    try {
      const result = await acceptContact('secret', { email: 'ada@exemple.fr', message: 'bonjour', token: 'tok' }, undefined, async () => {
        sent = true
      })
      expect(result.status).toBe(200)
      expect(sent).toBe(true)
    } finally {
      globalThis.fetch = original
    }
  })
})

describe('réponse SMTP', () => {
  test('attend la fin des lignes', () => {
    expect(takeSmtpReply('220')).toBeNull()
    expect(takeSmtpReply('250-suite\r\n')).toBeNull()
  })

  test('prend le code final et laisse la suite', () => {
    const reply = takeSmtpReply('250-un\r\n250 ok\r\n221 bye\r\n')
    expect(reply?.code).toBe(250)
    expect(reply?.rest).toBe('221 bye\r\n')
  })
})
