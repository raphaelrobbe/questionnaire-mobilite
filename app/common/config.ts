export type Interviewer = {
  name: string
  admin: boolean
  /** Vrai si l’appareil qui a demandé la liste est autorisé pour cet enquêteur. */
  authorized: boolean
  /** Null tant que l’appelant n’est pas un administrateur : les identifiants ne sont pas révélés. */
  devices: string[] | null
  /** Vide tant que l’appelant n’est pas un administrateur, ou si aucun numéro n’a été noté. */
  phone: string
}

export type SheetLists = {
  interviewers: Interviewer[]
}

const LIST_MAX = 400
const ITEM_MAX = 120

export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('fr')
}

export const PONTARLIER = 'Pontarlier'

export function communesOnOffer(communes: readonly string[]): string[] {
  const rest = communes.filter((name) => fold(name) !== fold(PONTARLIER))
  return [PONTARLIER, ...rest]
}

export function filterCommunes(communes: readonly string[], query: string, limit = Number.POSITIVE_INFINITY): string[] {
  const needle = fold(query.trim())
  if (!needle) return communes.slice(0, limit)
  const matches: string[] = []
  for (const commune of communes) {
    const folded = fold(commune)
    const words = folded.split(/[^a-z0-9]+/).filter(Boolean)
    if (folded.startsWith(needle) || words.some((word) => word.startsWith(needle))) {
      matches.push(commune)
      if (matches.length >= limit) break
    }
  }
  return matches
}

const SCRIPT_UPDATE = 'Le script ne renvoie pas les listes. Mettez à jour le script du tableur, puis redéployez-le.'

export function parseDeviceCell(value: string): string[] {
  const text = value.trim()
  if (!text || text === '[]') return []
  const wrapped = text.startsWith('[') && text.endsWith(']')
  const inner = wrapped ? text.slice(1, -1).trim() : text
  if (!inner) return []
  const parts = wrapped ? inner.split(',') : [inner]
  const seen = new Set<string>()
  const list: string[] = []
  for (const part of parts) {
    const id = part.trim().toLowerCase().slice(0, 80)
    if (!id || seen.has(id) || /[\s,;[\]]/.test(id)) continue
    seen.add(id)
    list.push(id)
  }
  return list
}

export function formatDeviceCell(devices: string[]): string {
  if (!devices.length) return '[]'
  return `[${devices.join(', ')}]`
}

export function normalizeDeviceId(input: string): string | null {
  const ids = parseDeviceCell(input)
  return ids.length === 1 ? ids[0] : null
}

/** Chaîne vide si le champ est laissé vide. Null si le texte n’est pas un numéro. */
export function normalizePhone(input: string): string | null {
  const text = input.trim().slice(0, 40)
  if (!text) return ''
  if (!/^[0-9+().\s-]+$/.test(text)) return null
  const digits = text.replace(/\D/g, '')
  if (digits.length < 6 || digits.length > 15) return null
  return text
}

export function deviceAllowed(interviewers: Interviewer[], interviewer: string, deviceId: string): boolean {
  const name = interviewer.trim()
  const device = deviceId.trim().toLowerCase()
  if (!name || !device) return false
  const person = interviewers.find((item) => item.name === name)
  if (!person) return false
  if (person.devices) return person.devices.includes(device)
  return person.authorized
}

export function isAdminSession(interviewers: Interviewer[], interviewer: string): boolean {
  const person = interviewers.find((item) => item.name === interviewer.trim())
  return Boolean(person?.admin && person.authorized)
}

export const DEVICE_REFUSED = 'Cet appareil n’est plus autorisé. La fiche reste sur ce téléphone.'

export class DeviceUnknown extends Error {
  constructor() {
    super(DEVICE_REFUSED)
    this.name = 'DeviceUnknown'
  }
}

/** Ligne dont l’appareil demandeur est autorisé. Les identifiants ne sont révélés qu’à un administrateur. */
export function interviewerForDevice(interviewers: Interviewer[], deviceId: string): Interviewer | null {
  const device = deviceId.trim().toLowerCase()
  if (!device) return null
  for (const person of interviewers) {
    if (person.devices) {
      if (person.devices.includes(device)) return person
    } else if (person.authorized) {
      return person
    }
  }
  return null
}

export function readListsPayload(input: unknown): SheetLists {
  if (!input || typeof input !== 'object') throw new Error('Liste illisible.')
  const source = input as Record<string, unknown>
  if (source.ok === false) {
    const reason = typeof source.error === 'string' ? source.error.replace(/\s+/g, ' ').trim() : ''
    throw new Error(reason || 'Liste refusée.')
  }
  if (!Array.isArray(source.interviewers)) throw new Error(SCRIPT_UPDATE)
  return { interviewers: cleanInterviewers(source.interviewers) }
}

function cleanInterviewers(values: unknown[]): Interviewer[] {
  if (values.some((value) => typeof value === 'string')) throw new Error(SCRIPT_UPDATE)
  const seen = new Set<string>()
  const list: Interviewer[] = []
  for (const value of values) {
    if (!value || typeof value !== 'object') continue
    const source = value as Record<string, unknown>
    if (typeof source.admin !== 'boolean' || typeof source.authorized !== 'boolean') throw new Error(SCRIPT_UPDATE)
    const name = typeof source.name === 'string' ? source.name.trim().slice(0, ITEM_MAX) : ''
    const key = fold(name)
    if (!name || seen.has(key)) continue
    seen.add(key)
    const devices = !('devices' in source) || source.devices === null ? null : cleanDevices(source.devices)
    const phone = typeof source.phone === 'string' ? source.phone.trim().slice(0, 40) : ''
    list.push({ name, admin: source.admin, authorized: source.authorized, devices, phone })
    if (list.length >= LIST_MAX) break
  }
  return list
}

function cleanDevices(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const list: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const text = item.trim().toLowerCase().slice(0, 80)
    if (!text || seen.has(text)) continue
    seen.add(text)
    list.push(text)
  }
  return list
}

