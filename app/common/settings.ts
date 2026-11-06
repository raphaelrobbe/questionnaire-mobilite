export type Settings = {
  interviewer: string
  place: string
  endpoint: string
  token: string
}

export function emptySettings(): Settings {
  return { interviewer: '', place: '', endpoint: '', token: '' }
}

function clip(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

export function sanitizeSettings(input: unknown): Settings {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  return {
    interviewer: clip(source.interviewer, 80),
    place: clip(source.place, 120),
    endpoint: clip(source.endpoint, 400),
    token: clip(source.token, 200),
  }
}
