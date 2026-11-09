export const ARRIVAL_TRIES = 5
export const ARRIVAL_GAP_MS = 2000

export class ArrivalStopped extends Error {}

export function readStoredFlag(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') throw new Error('Réponse illisible.')
  const source = payload as Record<string, unknown>
  if (source.ok === false) {
    throw new Error(typeof source.error === 'string' && source.error.trim() ? source.error.slice(0, 180) : 'Lecture impossible.')
  }
  return source.stored === true
}

export async function pollArrival(options: {
  lookup: () => Promise<boolean>
  wait: (ms: number) => Promise<void>
  onMiss?: () => Promise<'stop' | 'continue'>
  tries?: number
  gap?: number
}): Promise<boolean> {
  const tries = options.tries ?? ARRIVAL_TRIES
  const gap = options.gap ?? ARRIVAL_GAP_MS
  for (let attempt = 0; attempt < tries; attempt++) {
    await options.wait(gap)
    let stored = false
    try {
      stored = await options.lookup()
    } catch (error) {
      if (error instanceof ArrivalStopped) return false
      stored = false
    }
    if (stored) return true
    const decision = options.onMiss ? await options.onMiss() : 'continue'
    if (decision === 'stop') return false
  }
  return false
}
