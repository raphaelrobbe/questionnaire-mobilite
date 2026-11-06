import { SURVEY_VERSION, optionLabel, type Answers } from './survey'

export type ResponseRecord = {
  id: string
  createdAt: string
  deviceId: string
  interviewer: string
  place: string
  latitude: number | null
  longitude: number | null
  answers: Answers
}

export const SHEET_HEADERS = [
  'id',
  'horodatage_utc',
  'appareil',
  'enqueteur',
  'lieu_enquete',
  'latitude',
  'longitude',
  'version',
  'habitation',
  'age',
  'mode_principal',
  'mode_precision',
  'deplacements_jour',
  'motif',
  'duree_trajet',
  'genes',
  'genes_precision',
  'amenagement',
  'note_mobilite',
  'commentaire',
  'recontact',
  'coordonnees',
] as const

export type SheetHeader = (typeof SHEET_HEADERS)[number]
export type SheetRow = Record<SheetHeader, string>

function clip(value: string, max: number): string {
  return value.trim().slice(0, max)
}

function coord(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return ''
  return value.toFixed(6)
}

export function toSheetRow(record: ResponseRecord): SheetRow {
  const { answers } = record
  return {
    id: clip(record.id, 80),
    horodatage_utc: clip(record.createdAt, 40),
    appareil: clip(record.deviceId, 80),
    enqueteur: clip(record.interviewer, 80),
    lieu_enquete: clip(record.place, 120),
    latitude: coord(record.latitude),
    longitude: coord(record.longitude),
    version: SURVEY_VERSION,
    habitation: clip(answers.habitation, 160),
    age: optionLabel('age', answers.age),
    mode_principal: optionLabel('mode', answers.mode),
    mode_precision: answers.mode === 'autre' ? clip(answers.modePrecision, 160) : '',
    deplacements_jour: optionLabel('trips', answers.trips),
    motif: optionLabel('purpose', answers.purpose),
    duree_trajet: optionLabel('duration', answers.duration),
    genes: answers.frictions
      .map((value) => optionLabel('frictions', value))
      .filter(Boolean)
      .join(' · '),
    genes_precision: answers.frictions.includes('autre') ? clip(answers.frictionPrecision, 160) : '',
    amenagement: optionLabel('priority', answers.priority),
    note_mobilite: ['1', '2', '3', '4', '5'].includes(answers.score) ? answers.score : '',
    commentaire: clip(answers.comment, 2000),
    recontact: optionLabel('recontact', answers.recontact),
    coordonnees: answers.recontact === 'oui' ? clip(answers.contact, 160) : '',
  }
}

export function responseBody(record: ResponseRecord, token: string) {
  return {
    kind: 'response' as const,
    token,
    headers: [...SHEET_HEADERS],
    row: toSheetRow(record),
  }
}

export function pingBody(token: string) {
  return { kind: 'ping' as const, token }
}
