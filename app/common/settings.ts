export type Settings = {
  interviewer: string
  endpoint: string
  adminEndpoint: string
  testMode: boolean
}

export function emptySettings(): Settings {
  return { interviewer: '', endpoint: '', adminEndpoint: '', testMode: false }
}

/** Le questionnaire s’ouvre pour un appareil autorisé, ou en mode test. */
export function canUseSurvey(settings: Pick<Settings, 'interviewer' | 'testMode'>): boolean {
  return Boolean(settings.interviewer.trim()) || settings.testMode
}

function clip(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

export function sanitizeSettings(input: unknown): Settings {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  return {
    interviewer: clip(source.interviewer, 80),
    endpoint: clip(source.endpoint, 400),
    adminEndpoint: clip(source.adminEndpoint, 400),
    testMode: source.testMode === true,
  }
}
