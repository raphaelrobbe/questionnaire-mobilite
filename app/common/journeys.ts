import { SLOT_IDS, THEME_IDS, themeLabel, vehicleModeOptions, type SlotId, type ThemeId } from './motives'

export const WEEKDAYS = [
  { id: 'lun', label: 'Lun' },
  { id: 'mar', label: 'Mar' },
  { id: 'mer', label: 'Mer' },
  { id: 'jeu', label: 'Jeu' },
  { id: 'ven', label: 'Ven' },
  { id: 'sam', label: 'Sam' },
  { id: 'dim', label: 'Dim' },
] as const

export type Weekday = (typeof WEEKDAYS)[number]['id']
export type JourneyKind = 'actuel' | 'nouveau'
export type Regularity = '' | 'irregulier' | 'regulier'
export type RegularPace = '' | 'hebdo' | 'intervalle'
export const RARE_COUNTS = ['1', '2', '3', '4', '5'] as const
export const RARE_UNITS = [
  { id: 'jour', label: 'jour' },
  { id: 'semaine', label: 'sem.' },
  { id: 'mois', label: 'mois' },
  { id: 'an', label: 'an' },
] as const
export type RareCount = '' | (typeof RARE_COUNTS)[number]
export type RareUnit = '' | (typeof RARE_UNITS)[number]['id']
/** Un trajet « nouveau » est un trajet jamais fait, déjà considéré comme remplacé par un transport en commun. */
export type Replaced = '' | 'toujours' | 'souvent' | 'parfois' | 'jamais' | 'offre'

export type Journey = {
  kind: JourneyKind
  theme: ThemeId | ''
  autre: string
  aller: SlotId | ''
  retour: SlotId | ''
  regularity: Regularity
  rareCount: RareCount
  rareUnit: RareUnit
  pace: RegularPace
  everyWeeks: string
  days: Weekday[]
  mode: string
  origin: string
  originPlace: string
  destination: string
  place: string
  replaced: Replaced
  riders: number[]
  /** Passagers qui ne vivent pas dans le foyer. Chaque sélection en propose un de plus. */
  extraRiders: number
  /** Vrai si « qui fait ce trajet » a été modifié à la main. Sinon, l’unique personne du foyer est sélectionnée. */
  ridersCustom: boolean
  replacedRiders: number[]
  /** Vrai dès que « qui le ferait » a été modifié à la main. Sinon, ce sont les mêmes personnes que le trajet. */
  replacedRidersCustom: boolean
  comment: string
}

export const DOMICILE = 'Domicile'

const MAX_JOURNEYS = 12

export function emptyJourney(kind: JourneyKind): Journey {
  return {
    kind,
    theme: '',
    autre: '',
    aller: '',
    retour: '',
    regularity: '',
    rareCount: '',
    rareUnit: '',
    pace: '',
    everyWeeks: '',
    days: [],
    mode: '',
    origin: DOMICILE,
    originPlace: '',
    destination: '',
    place: '',
    replaced: kind === 'nouveau' ? 'offre' : '',
    riders: [],
    extraRiders: 0,
    ridersCustom: false,
    replacedRiders: [],
    replacedRidersCustom: false,
    comment: '',
  }
}

export function defaultJourneys(): Journey[] {
  return [emptyJourney('actuel'), emptyJourney('nouveau')]
}

export function journeyTouched(journey: Journey): boolean {
  return Boolean(
    journey.theme ||
      journey.autre.trim() ||
      journey.aller ||
      journey.retour ||
      journey.regularity ||
      journey.mode ||
      (journey.origin ?? DOMICILE).trim() !== DOMICILE ||
      (journey.originPlace ?? '').trim() ||
      journey.destination.trim() ||
      journey.place.trim() ||
      journey.riders.length ||
      journey.extraRiders > 0 ||
      journey.replacedRiders.length ||
      journey.comment.trim() ||
      (journey.kind === 'actuel' && journey.replaced),
  )
}

export function journeyComplete(journey: Journey, peopleCount = 0): boolean {
  if (!journey.theme) return false
  if (!journey.aller) return false
  if (!frequencyComplete(journey)) return false
  if (journey.kind === 'actuel' && !journey.mode) return false
  if (!(journey.origin ?? DOMICILE).trim() || !journey.destination.trim()) return false
  if (journey.kind === 'actuel') {
    if (!tripRiders(journey, peopleCount).length) return false
    if (!journey.replaced || journey.replaced === 'offre') return false
    if (journey.replaced !== 'jamais' && !tripReplacedRiders(journey, peopleCount).length) return false
    return true
  }
  return journey.replaced === 'offre' && tripReplacedRiders(journey, peopleCount).length > 0
}

export function tripRiders(journey: Journey, peopleCount: number): number[] {
  if (journey.kind !== 'actuel') return []
  if (!journey.ridersCustom && peopleCount === 1) return [0]
  return journey.riders
}

export function tripReplacedRiders(journey: Journey, peopleCount: number): number[] {
  if (journey.kind === 'nouveau') return !journey.replacedRidersCustom && peopleCount === 1 ? [0] : journey.replacedRiders
  if (!journey.replacedRidersCustom) return tripRiders(journey, peopleCount)
  return journey.replacedRiders
}

function frequencyComplete(journey: Journey): boolean {
  if (journey.regularity === 'irregulier') {
    return (RARE_COUNTS as readonly string[]).includes(journey.rareCount) && RARE_UNITS.some((unit) => unit.id === journey.rareUnit)
  }
  if (journey.regularity !== 'regulier' || !journey.days.length) return false
  if (journey.pace === 'hebdo') return true
  if (journey.pace !== 'intervalle') return false
  const weeks = Number(journey.everyWeeks)
  return Number.isInteger(weeks) && weeks >= 2 && weeks <= 52
}

export function journeysStarted(journeys: Journey[]): boolean {
  return journeys.some(journeyTouched)
}

export function actualJourneyIssue(journeys: Journey[], peopleCount = 0): string | null {
  const actual = journeys.filter((journey) => journey.kind === 'actuel')
  if (actual.some((journey) => journeyTouched(journey) && !journeyComplete(journey, peopleCount))) return 'Complétez le trajet'
  return null
}

export function offerJourneyIssue(journeys: Journey[], peopleCount = 0): string | null {
  const fresh = journeys.filter((journey) => journey.kind === 'nouveau')
  if (fresh.some((journey) => journeyTouched(journey) && !journeyComplete(journey, peopleCount))) {
    return 'Complétez le trajet.'
  }
  return null
}

export function journeyIssue(journeys: Journey[]): string | null {
  return actualJourneyIssue(journeys) ?? offerJourneyIssue(journeys)
}

export function removeJourney(journeys: Journey[], index: number): Journey[] {
  if (index < 0 || index >= journeys.length) return journeys
  return journeys.filter((_, item) => item !== index)
}

export function addJourney(journeys: Journey[], kind: JourneyKind): Journey[] {
  const count = journeys.filter((journey) => journey.kind === kind).length
  if (count >= MAX_JOURNEYS) return journeys
  return [...journeys, emptyJourney(kind)]
}

/** Ouvre un trajet actuel déjà commencé, ou en ajoute un, avec le motif indiqué. */
export function presetActualJourney(
  journeys: Journey[],
  patch: Pick<Journey, 'theme' | 'autre'>,
): { journeys: Journey[]; listedIndex: number } | null {
  const listed = journeys.flatMap((journey, index) => (journey.kind === 'actuel' ? [{ journey, index }] : []))
  const blank = listed.findIndex((item) => !journeyTouched(item.journey))
  if (blank >= 0) {
    return { journeys: updateJourney(journeys, listed[blank].index, patch), listedIndex: blank }
  }
  const added = addJourney(journeys, 'actuel')
  if (added === journeys) return null
  let index = -1
  for (let item = added.length - 1; item >= 0; item -= 1) {
    if (added[item]?.kind === 'actuel') {
      index = item
      break
    }
  }
  return {
    journeys: updateJourney(added, index, patch),
    listedIndex: added.filter((journey) => journey.kind === 'actuel').length - 1,
  }
}

export function updateJourney(journeys: Journey[], index: number, patch: Partial<Journey>): Journey[] {
  return journeys.map((journey, item) => {
    if (item !== index) return journey
    const next = { ...journey, ...patch }
    if ('replacedRiders' in patch) next.replacedRidersCustom = true
    if ('riders' in patch) next.ridersCustom = true
    return normalizeJourney(next)
  })
}

export function journeyHeading(journey: Journey, index: number): { title: string; route: string } {
  const theme = journey.theme ? themeLabel(journey.theme, journey.theme === 'autre' ? journey.autre : '') : ''
  const detail = journey.theme && journey.theme !== 'autre' ? journey.autre.trim() : ''
  const titleParts = [`Trajet ${index + 1}`, theme, detail].filter(Boolean)
  const from = [(journey.origin ?? DOMICILE).trim(), (journey.originPlace ?? '').trim()].filter(Boolean).join(', ')
  const to = [journey.destination.trim(), journey.place.trim()].filter(Boolean).join(', ')
  return {
    title: titleParts.length > 1 ? titleParts.join(' · ') : `Trajet ${index + 1} · À compléter`,
    route: `${from || '…'} → ${to || '…'}`,
  }
}

export function sanitizeJourneys(input: unknown, peopleCount: number, cars: { motor: string }[], wheels: { motor: string }[]): Journey[] {
  const allowed = new Set(vehicleModeOptions(cars, wheels).map((mode) => mode.id))
  const source = Array.isArray(input) ? input : []
  const cleaned = source
    .slice(0, MAX_JOURNEYS * 2)
    .map((item) => cleanJourney(item, peopleCount, allowed))
    .filter((item): item is Journey => item !== null)
  const actual = cleaned.filter((journey) => journey.kind === 'actuel')
  const fresh = cleaned.filter((journey) => journey.kind === 'nouveau')
  return [...(actual.length ? actual : [emptyJourney('actuel')]), ...(fresh.length ? fresh : [emptyJourney('nouveau')])]
}

function cleanJourney(input: unknown, peopleCount: number, allowed: Set<string>): Journey | null {
  if (!input || typeof input !== 'object') return null
  const source = input as Record<string, unknown>
  const kind: JourneyKind = source.kind === 'nouveau' ? 'nouveau' : 'actuel'
  const theme = THEME_IDS.find((item) => item === source.theme) ?? ''
  return normalizeJourney(
    {
    kind,
    theme,
    autre: theme ? clip(source.autre, 80) : '',
    aller: slotOf(source.aller),
    retour: slotOf(source.retour),
    regularity: source.regularity === 'irregulier' || source.regularity === 'regulier' ? source.regularity : '',
    rareCount: rareCountOf(source.rareCount),
    rareUnit: rareUnitOf(source.rareUnit),
    pace: source.pace === 'hebdo' || source.pace === 'intervalle' ? source.pace : '',
    everyWeeks: weeksOf(source.everyWeeks),
    days: weekdaysOf(source.days),
    mode: typeof source.mode === 'string' && allowed.has(source.mode) ? source.mode : '',
    origin: 'origin' in source ? clip(source.origin, 120) : DOMICILE,
    originPlace: clip(source.originPlace, 80),
    destination: clip(source.destination, 120),
    place: clip(source.place, 80),
    replaced: replacedOf(source.replaced, kind),
    riders: kind === 'actuel' ? indexesOf(source.riders, peopleCount) : [],
    extraRiders: kind === 'actuel' ? extraRidersOf(source.extraRiders) : 0,
    ridersCustom: source.ridersCustom === true,
    replacedRiders: indexesOf(source.replacedRiders, peopleCount),
    replacedRidersCustom: ridersCustom(source, kind === 'actuel' ? indexesOf(source.riders, peopleCount) : [], indexesOf(source.replacedRiders, peopleCount)),
    comment: clip(source.comment, 400),
    },
    peopleCount,
  )
}

function normalizeJourney(journey: Journey, peopleCount = 0): Journey {
  const next = { ...journey }
  if (next.kind === 'nouveau') next.replaced = 'offre'
  if (!next.theme) next.autre = ''
  if (next.regularity !== 'irregulier') {
    next.rareCount = ''
    next.rareUnit = ''
  }
  if (next.regularity !== 'regulier') {
    next.pace = ''
    next.everyWeeks = ''
    next.days = []
  }
  if (next.pace !== 'intervalle') next.everyWeeks = ''
  if (next.kind === 'nouveau') {
    next.riders = []
    next.extraRiders = 0
    next.mode = ''
  }
  if (peopleCount === 1 && contentTouched(next)) {
    if (next.kind === 'actuel' && !next.ridersCustom && next.riders.length === 0) next.riders = [0]
    if (next.kind === 'nouveau' && !next.replacedRidersCustom && next.replacedRiders.length === 0) next.replacedRiders = [0]
  }
  if (next.kind === 'actuel' && next.replaced !== 'toujours' && next.replaced !== 'souvent' && next.replaced !== 'parfois') {
    next.replacedRiders = []
    next.replacedRidersCustom = false
  } else if (next.kind === 'actuel' && !next.replacedRidersCustom) {
    next.replacedRiders = next.riders
  }
  return next
}

function contentTouched(journey: Journey): boolean {
  return Boolean(
    journey.theme ||
      journey.autre.trim() ||
      journey.aller ||
      journey.retour ||
      journey.regularity ||
      journey.mode ||
      (journey.origin ?? DOMICILE).trim() !== DOMICILE ||
      (journey.originPlace ?? '').trim() ||
      journey.destination.trim() ||
      journey.place.trim() ||
      journey.comment.trim() ||
      (journey.kind === 'actuel' && journey.replaced),
  )
}

function rareCountOf(value: unknown): RareCount {
  return (RARE_COUNTS as readonly string[]).includes(String(value)) ? (String(value) as RareCount) : ''
}

function rareUnitOf(value: unknown): RareUnit {
  return RARE_UNITS.some((unit) => unit.id === value) ? (value as RareUnit) : ''
}

function slotOf(value: unknown): SlotId | '' {
  const text = value === 'avant-6' ? '4-6' : value === 'apres-0' ? '0-4' : value
  return SLOT_IDS.find((slot) => slot === text) ?? ''
}

function weeksOf(value: unknown): string {
  const text = String(value ?? '').replace(/\D/g, '').slice(0, 2)
  if (!text) return ''
  const count = Number(text)
  if (count > 52) return '52'
  if (count < 1) return ''
  return String(count)
}

function weekdaysOf(value: unknown): Weekday[] {
  if (!Array.isArray(value)) return []
  return WEEKDAYS.map((day) => day.id).filter((id) => value.includes(id))
}

function ridersCustom(source: Record<string, unknown>, riders: number[], replacedRiders: number[]): boolean {
  if (source.replacedRidersCustom === true) return true
  if (source.replacedRidersCustom === false) return false
  return replacedRiders.length > 0 && !sameIndexes(replacedRiders, riders)
}

function sameIndexes(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function extraRidersOf(value: unknown): number {
  const count = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(count) || count < 1) return 0
  return Math.min(count, 30)
}

function indexesOf(value: unknown, peopleCount: number): number[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<number>()
  for (const item of value) {
    if (typeof item !== 'number' || !Number.isInteger(item) || item < 0 || item >= peopleCount) continue
    seen.add(item)
  }
  return [...seen].sort((left, right) => left - right)
}

function replacedOf(value: unknown, kind: JourneyKind): Replaced {
  if (kind === 'nouveau') return 'offre'
  return value === 'toujours' || value === 'souvent' || value === 'parfois' || value === 'jamais' ? value : ''
}

function clip(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}
