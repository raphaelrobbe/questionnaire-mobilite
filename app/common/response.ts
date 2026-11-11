import { COLLECTIF_CONSENT, PHONE_CONSENT } from './consent'
import { isEmail, personLine, sanitizeAnswers, vehicleLine, type Answers } from './survey'

const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function responseCode(nextByte: () => number = randomByte): string {
  let raw = ''
  while (raw.length < 8) {
    const byte = nextByte()
    if (byte >= 252) continue
    raw += CODE_ALPHABET[byte % CODE_ALPHABET.length]
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

export function isResponseCode(value: string): boolean {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(value)
}

function randomByte(): number {
  const bytes = new Uint8Array(1)
  crypto.getRandomValues(bytes)
  return bytes[0]
}

export type ResponseRecord = {
  id: string
  createdAt: string
  deviceId: string
  interviewer: string
  test: boolean
  latitude: number | null
  longitude: number | null
  answers: Answers
}

/** Une réponse sans appareil autorisé n’est gardée que si la fiche est en mode test. */
export function responseIsKept(record: Pick<ResponseRecord, 'test' | 'interviewer'>): boolean {
  return record.test || Boolean(record.interviewer?.trim())
}

type PersonalCarrier = {
  latitude: number | null
  longitude: number | null
  answers: Answers
}

function filled(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== ''
}

/** Nom, adresse, contact ou position encore présents. Les fiches anciennes peuvent omettre un champ. */
export function holdsPersonal(record: PersonalCarrier): boolean {
  const answers = record.answers ?? ({} as Answers)
  return (
    record.latitude != null ||
    record.longitude != null ||
    filled(answers.civilite) ||
    filled(answers.nom) ||
    filled(answers.prenom) ||
    filled(answers.adresse) ||
    filled(answers.complement) ||
    filled(answers.email) ||
    filled(answers.phone)
  )
}

/** Retire nom, adresse, contact et position. Le code, la commune et le reste restent. */
export function forgetPersonal<T extends PersonalCarrier>(record: T): T {
  return {
    ...record,
    latitude: null,
    longitude: null,
    answers: {
      ...record.answers,
      civilite: '',
      nom: '',
      prenom: '',
      adresse: '',
      complement: '',
      email: '',
      phone: '',
    },
  }
}

export const SHEET_HEADERS = [
  'id',
  'horodatage_utc',
  'appareil',
  'enqueteur',
  'commune',
  'personnes',
  'detail_personnes',
  'voitures',
  'detail_voitures',
  'deux_trois_roues',
  'detail_deux_trois_roues',
  'recontact',
  'collectif',
] as const

export type MailBody = {
  kind: 'mail'
  code: string
  appareil: string
  enqueteur: string
  civilite: '' | 'Monsieur' | 'Madame'
  nom: string
  prenom: string
  commune: string
  adresse: string
  complement: string
  latitude: string
  longitude: string
  telephone: string
  email: string
  recontact: 'oui' | 'non'
  collectif: 'oui' | 'non'
  texteRecontact: string
  texteCollectif: string
  devenirEnqueteur: 'oui' | 'non' | ''
}

export type SheetHeader = (typeof SHEET_HEADERS)[number]
export type SheetRow = Record<SheetHeader, string>

function clip(value: string, max: number): string {
  return value.trim().slice(0, max)
}

function coord(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return ''
  return value.toFixed(6)
}

function joined(lines: string[]): string {
  return clip(lines.filter(Boolean).join(' · '), 2000)
}

export function toSheetRow(record: ResponseRecord): SheetRow {
  const answers = sanitizeAnswers(record.answers)
  const people = answers.people.map(personLine)
  const cars = answers.cars.map(vehicleLine)
  const twoWheelers = answers.twoWheelers.map(vehicleLine)
  return {
    id: clip(record.id, 80),
    horodatage_utc: clip(record.createdAt, 40),
    appareil: clip(record.deviceId, 80),
    enqueteur: clip(record.interviewer, 80),
    commune: clip(answers.commune, 120),
    personnes: String(people.filter(Boolean).length),
    detail_personnes: joined(people),
    voitures: String(cars.filter(Boolean).length),
    detail_voitures: joined(cars),
    deux_trois_roues: String(twoWheelers.filter(Boolean).length),
    detail_deux_trois_roues: joined(twoWheelers),
    recontact: answers.recontact === 'oui' ? 'oui' : answers.recontact === 'non' ? 'non' : '',
    collectif: answers.collectif ? 'oui' : 'non',
  }
}

export function mailBody(record: ResponseRecord): MailBody {
  const answers = sanitizeAnswers(record.answers)
  return {
    kind: 'mail',
    code: clip(record.id, 80),
    appareil: clip(record.deviceId, 80),
    enqueteur: clip(record.interviewer, 80),
    civilite: answers.civilite === 'monsieur' ? 'Monsieur' : answers.civilite === 'madame' ? 'Madame' : '',
    nom: clip(answers.nom, 80),
    prenom: clip(answers.prenom, 80),
    commune: clip(answers.commune, 120),
    adresse: clip(answers.adresse, 160),
    complement: clip(answers.complement, 160),
    latitude: coord(record.latitude),
    longitude: coord(record.longitude),
    telephone: clip(answers.phone, 40),
    email: isEmail(answers.email) ? answers.email : '',
    recontact: answers.recontact === 'oui' ? 'oui' : 'non',
    collectif: answers.collectif ? 'oui' : 'non',
    texteRecontact: answers.recontact === 'oui' ? clip(answers.recontactText || PHONE_CONSENT, 400) : '',
    texteCollectif: answers.collectif ? clip(answers.collectifText || COLLECTIF_CONSENT, 400) : '',
    devenirEnqueteur: answers.enqueteur === 'oui' ? 'oui' : answers.enqueteur === 'non' ? 'non' : '',
  }
}

export function responseBody(record: ResponseRecord) {
  return {
    kind: 'response' as const,
    test: record.test,
    headers: [...SHEET_HEADERS],
    row: toSheetRow(record),
  }
}

export function pingBody() {
  return { kind: 'ping' as const }
}
