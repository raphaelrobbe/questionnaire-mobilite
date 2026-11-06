import { describe, expect, test } from 'vitest'
import { sanitizeSettings } from './settings'

describe('réglages', () => {
  test('ne garde que des chaînes bornées', () => {
    const settings = sanitizeSettings({
      interviewer: 'A'.repeat(200),
      place: 12,
      endpoint: 'https://script.google.com/macros/s/abc/exec',
      token: 'secret',
    })
    expect(settings.interviewer).toHaveLength(80)
    expect(settings.place).toBe('')
    expect(settings.endpoint).toMatch(/\/exec$/)
    expect(settings.token).toBe('secret')
    expect(sanitizeSettings(null)).toEqual({ interviewer: '', place: '', endpoint: '', token: '' })
  })
})
