import { describe, expect, test } from 'vitest'
import { readSheetResult } from './http'

describe('réponse du script', () => {
  test('accepte un JSON ok', async () => {
    await expect(readSheetResult(new Response(JSON.stringify({ ok: true }), { status: 200 }))).resolves.toBeUndefined()
  })

  test('remonte le motif court et refuse le HTML', async () => {
    await expect(readSheetResult(new Response(JSON.stringify({ ok: false, error: 'Jeton refusé.' }), { status: 200 }))).rejects.toThrow(
      'Jeton refusé.',
    )
    await expect(readSheetResult(new Response('<html>login</html>', { status: 200 }))).rejects.toThrow(/HTML/)
    await expect(readSheetResult(new Response('nope', { status: 500 }))).rejects.toThrow(/500/)
  })
})
