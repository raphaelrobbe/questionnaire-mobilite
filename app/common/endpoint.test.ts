import { describe, expect, test } from 'vitest'
import { classifyEndpoint, endpointMessage, type EndpointIssue } from './endpoint'

function refusal(raw: string): EndpointIssue {
  const result = classifyEndpoint(raw)
  if (result.ok) throw new Error(raw)
  return result.reason
}

describe('adresse d’envoi', () => {
  test('accepte le script Google et une future route locale', () => {
    expect(classifyEndpoint(' https://script.google.com/macros/s/abc/exec ')).toMatchObject({
      ok: true,
      kind: 'google-script',
    })
    expect(classifyEndpoint('https://script.googleusercontent.com/macros/s/abc/exec').ok).toBe(true)
    expect(classifyEndpoint('/api/reponses')).toMatchObject({ ok: true, kind: 'future-api', url: '/api/reponses' })
  })

  test('refuse le lien du tableur, le http et les hôtes libres', () => {
    expect(refusal('')).toBe('empty')
    expect(refusal('https://docs.google.com/spreadsheets/d/abc/edit')).toBe('sheet-link')
    expect(refusal('http://script.google.com/macros/s/abc/exec')).toBe('refused')
    expect(refusal('https://example.test/exec')).toBe('refused')
    expect(refusal('https://script.google.com/macros/s/abc/dev')).toBe('invalid')
    expect(refusal('/api/../secret')).toBe('invalid')
    expect(endpointMessage('sheet-link')).toMatch(/tableur/)
  })
})
