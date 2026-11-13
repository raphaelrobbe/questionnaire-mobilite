export type DrawCommune = {
  name: string
  population: number
}

/** Habitants visés par le pourcentage, avant la remontée au minimum. */
export function drawQuota(totalPopulation: number, percent: number): number {
  if (totalPopulation <= 0 || percent <= 0) return 0
  const bounded = Math.min(100, percent)
  return Math.min(totalPopulation, Math.round((totalPopulation * bounded) / 100))
}

/**
 * Répartit le quota au prorata des habitants (méthode des plus forts restes),
 * puis remonte chaque commune au minimum, sans dépasser sa population.
 */
export function theoreticalDraw(communes: readonly DrawCommune[], percent: number, minimum: number): number[] {
  const populations = communes.map((commune) => Math.max(0, Math.floor(commune.population)))
  const total = populations.reduce((sum, population) => sum + population, 0)
  const allocated = apportion(populations, drawQuota(total, percent))
  const floor = Math.max(0, Math.floor(minimum))
  return allocated.map((count, index) => Math.min(populations[index], Math.max(count, floor)))
}

/** Un tirage d’habitants distincts du quota, puis la même remontée au minimum. */
export function simulateDraw(
  communes: readonly DrawCommune[],
  percent: number,
  minimum: number,
  random: () => number = Math.random,
): number[] {
  const populations = communes.map((commune) => Math.max(0, Math.floor(commune.population)))
  const total = populations.reduce((sum, population) => sum + population, 0)
  const drawn = sample(populations, drawQuota(total, percent), random)
  const floor = Math.max(0, Math.floor(minimum))
  return drawn.map((count, index) => Math.min(populations[index], Math.max(count, floor)))
}

function apportion(populations: readonly number[], quota: number): number[] {
  const total = populations.reduce((sum, population) => sum + population, 0)
  if (total <= 0 || quota <= 0) return populations.map(() => 0)
  const exact = populations.map((population) => (population / total) * quota)
  const base = exact.map((value) => Math.floor(value))
  const remaining = quota - base.reduce((sum, count) => sum + count, 0)
  const order = exact
    .map((value, index) => ({ index, fraction: value - base[index] }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index)
  const counts = base.slice()
  for (let step = 0; step < remaining; step++) counts[order[step].index] += 1
  return counts
}

function sample(populations: readonly number[], quota: number, random: () => number): number[] {
  const remaining = populations.slice()
  let left = remaining.reduce((sum, population) => sum + population, 0)
  const counts = populations.map(() => 0)
  const draws = Math.min(Math.max(0, quota), left)
  for (let draw = 0; draw < draws; draw++) {
    let ticket = random() * left
    if (!(ticket < left)) ticket = 0
    let index = 0
    while (index < remaining.length - 1 && ticket >= remaining[index]) {
      ticket -= remaining[index]
      index += 1
    }
    if (remaining[index] <= 0) break
    remaining[index] -= 1
    counts[index] += 1
    left -= 1
  }
  return counts
}
