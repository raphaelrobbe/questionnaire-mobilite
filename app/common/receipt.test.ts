import { describe, expect, test } from 'vitest'
import { ArrivalStopped, pollArrival, readStoredFlag } from './receipt'

describe('accusé de la fiche', () => {
  test('ne retient qu’un oui ou un non', () => {
    expect(readStoredFlag({ ok: true, stored: true })).toBe(true)
    expect(readStoredFlag({ ok: true, stored: false })).toBe(false)
    expect(readStoredFlag({ ok: true })).toBe(false)
    expect(() => readStoredFlag({ ok: false, error: 'Feuille illisible.' })).toThrow(/Feuille illisible/)
    expect(() => readStoredFlag(null)).toThrow(/illisible/)
  })

  test('attend deux secondes avant chacun des cinq essais et s’arrête au premier oui', async () => {
    const waits: number[] = []
    let calls = 0
    const found = await pollArrival({
      lookup: async () => {
        calls += 1
        return calls === 3
      },
      wait: async (ms) => {
        waits.push(ms)
      },
    })
    expect(found).toBe(true)
    expect(calls).toBe(3)
    expect(waits).toEqual([2000, 2000, 2000])
  })

  test('fait cinq essais quand le code reste introuvable', async () => {
    let calls = 0
    const found = await pollArrival({
      lookup: async () => {
        calls += 1
        if (calls === 2) throw new Error('réseau')
        return false
      },
      wait: async () => undefined,
    })
    expect(found).toBe(false)
    expect(calls).toBe(5)
  })

  test('n’épuise pas les essais si la recherche est interrompue', async () => {
    let calls = 0
    const found = await pollArrival({
      lookup: async () => {
        calls += 1
        throw new ArrivalStopped()
      },
      wait: async () => undefined,
    })
    expect(found).toBe(false)
    expect(calls).toBe(1)
  })
})
