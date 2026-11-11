export const MAP_APPS = [
  { id: 'google', label: 'Google Maps' },
  { id: 'apple', label: 'Apple Plans' },
  { id: 'osm', label: 'OpenStreetMaps' },
  { id: 'mappy', label: 'Mappy' },
  { id: 'mapy', label: 'Mapy' },
  { id: 'waze', label: 'Waze' },
] as const

export type MapApp = (typeof MAP_APPS)[number]['id']

export type Settings = {
  interviewer: string
  endpoint: string
  adminEndpoint: string
  testMode: boolean
  mapApp: MapApp
}

export function emptySettings(): Settings {
  return { interviewer: '', endpoint: '', adminEndpoint: '', testMode: false, mapApp: 'google' }
}

/** Le questionnaire s’ouvre pour un appareil autorisé, ou en mode test. */
export function canUseSurvey(settings: Pick<Settings, 'interviewer' | 'testMode'>): boolean {
  return Boolean(settings.interviewer.trim()) || settings.testMode
}

/** Les fiches ordinaires ne repartent qu’une fois l’enquêteur reconnu. */
export function canRetrySends(settings: Pick<Settings, 'interviewer'>): boolean {
  return Boolean(settings.interviewer.trim())
}

/** Le réseau revenu relance l’envoi : tout si l’enquêteur est reconnu, seulement les fiches de test sinon. */
export function canSync(settings: Pick<Settings, 'interviewer' | 'testMode'>): boolean {
  return canRetrySends(settings) || settings.testMode
}

export function canRetryRow(settings: Pick<Settings, 'interviewer' | 'testMode'>, test: boolean): boolean {
  return canRetrySends(settings) || (settings.testMode && test)
}

/** Les enquêteurs ne sont demandés qu’une fois le nom reconnu. Le mode test ne demande rien : les communes sont dans le code. */
export function listsRequest(settings: Pick<Settings, 'interviewer' | 'testMode'>): 'full' | 'none' {
  if (settings.interviewer.trim()) return 'full'
  return 'none'
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
    mapApp: MAP_APPS.some((app) => app.id === source.mapApp) ? (source.mapApp as MapApp) : 'google',
  }
}
