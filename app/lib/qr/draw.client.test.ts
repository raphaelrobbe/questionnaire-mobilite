import { describe, expect, test } from 'vitest'
import { deviceQrSvg } from './draw.client'

describe('QR-code de l’appareil', () => {
  test('dessine un carré sans écrire l’identifiant en clair', () => {
    const id = 'ca866789-fd89-444c-be39-fa0c8942303b'
    const svg = deviceQrSvg(id)
    expect(svg.startsWith('<svg ')).toBe(true)
    expect(svg.match(/<rect /g)?.length ?? 0).toBeGreaterThan(100)
    expect(svg).not.toContain(id)
  })
})
