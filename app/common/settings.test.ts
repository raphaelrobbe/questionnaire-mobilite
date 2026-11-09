import { describe, expect, test } from 'vitest'
import { canUseSurvey, sanitizeSettings } from './settings'

describe('réglages', () => {
  test('ne garde que des chaînes bornées', () => {
    const settings = sanitizeSettings({
      interviewer: 'A'.repeat(200),
      endpoint: 'https://script.google.com/macros/s/abc/exec',
      token: 'secret',
    })
    expect(settings.interviewer).toHaveLength(80)
    expect(settings.endpoint).toMatch(/\/exec$/)
    expect(sanitizeSettings(null)).toEqual({ interviewer: '', endpoint: '', adminEndpoint: '', testMode: false, mapApp: 'google' })
    expect(sanitizeSettings({ testMode: true }).testMode).toBe(true)
    expect(sanitizeSettings({ mapApp: 'waze' }).mapApp).toBe('waze')
    expect(sanitizeSettings({ mapApp: 'autre' }).mapApp).toBe('google')
    expect(sanitizeSettings({ testMode: 'oui' }).testMode).toBe(false)
    expect(canUseSurvey({ interviewer: '', testMode: false })).toBe(false)
    expect(canUseSurvey({ interviewer: '', testMode: true })).toBe(true)
    expect(canUseSurvey({ interviewer: 'Ada', testMode: false })).toBe(true)
    expect('token' in settings).toBe(false)
  })
})
