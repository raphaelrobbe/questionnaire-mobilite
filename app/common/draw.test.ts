import { describe, expect, test } from 'vitest'
import { drawQuota, simulateDraw, theoreticalDraw } from './draw'
import { frenchCommunePopulations } from './frenchCommunes'

const communes = [
  { name: 'Petite', population: 10 },
  { name: 'Grande', population: 90 },
]

describe('tirage au sort', () => {
  test('le quota est le pourcentage arrondi de la population', () => {
    expect(drawQuota(100, 10)).toBe(10)
    expect(drawQuota(3, 50)).toBe(2)
    expect(drawQuota(100, 0)).toBe(0)
    expect(drawQuota(100, 150)).toBe(100)
  })

  test('répartit le quota au prorata, puis remonte le minimum', () => {
    expect(theoreticalDraw(communes, 10, 0)).toEqual([1, 9])
    expect(theoreticalDraw(communes, 10, 3)).toEqual([3, 9])
  })

  test('à 100 %, chaque commune retrouve sa population', () => {
    const all = frenchCommunePopulations()
    const counts = theoreticalDraw(all, 100, 0)
    expect(counts).toEqual(all.map((commune) => commune.population))
    expect(all).toHaveLength(73)
  })

  test('ne dépasse pas la population quand le minimum est trop haut', () => {
    expect(theoreticalDraw([{ name: 'Hameau', population: 5 }], 0, 8)).toEqual([5])
  })

  test('la simulation tire des habitants distincts, puis applique le minimum', () => {
    expect(simulateDraw(communes, 12, 0, () => 0)).toEqual([10, 2])
    expect(simulateDraw(communes, 12, 4, () => 0)).toEqual([10, 4])
    const filled = simulateDraw(
      [
        { name: 'A', population: 2 },
        { name: 'B', population: 2 },
      ],
      100,
      0,
      () => 0,
    )
    expect(filled).toEqual([2, 2])
  })
})
