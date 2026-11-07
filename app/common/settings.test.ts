import { describe, expect, test } from 'vitest'
import { sanitizeSettings } from './settings'

describe('réglages', () => {
  test('ne garde que des chaînes bornées', () => {
    const settings = sanitizeSettings({
      interviewer: 'A'.repeat(200),
      endpoint: 'https://script.google.com/macros/s/abc/exec',
      token: 'secret',
    })
    expect(settings.interviewer).toHaveLength(80)
    expect(settings.endpoint).toMatch(/\/exec$/)
    expect(sanitizeSettings(null)).toEqual({ interviewer: '', endpoint: '', adminEndpoint: '' })
    expect('token' in settings).toBe(false)
  })
})
