import { fold } from './config'
import { OFFER_MODES, SLOT_IDS, THEME_IDS, themeLabel, vehicleModeOptions, type SlotId, type ThemeId } from './motives'

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

export type DifficultyGroup = 'circulation' | 'routes' | 'infra' | 'autres' | 'aucune'
export type DifficultyItemId =
  | 'bouchons'
  | 'long'
  | 'imprevisible'
  | 'heures'
  | 'circulation-autre'
  | 'chaussee'
  | 'sinueuses'
  | 'visibilite'
  | 'vitesse'
  | 'routes-autre'
  | 'trottoirs'
  | 'velos'
  | 'stationnement'
  | 'arrets'
  | 'travaux'
  | 'infra-autre'
export type DifficultyPace = 'toujours' | 'souvent' | 'parfois'
export type DifficultyNoteKey = 'circulation' | 'routes' | 'infra' | 'autres'

export type DifficultyKey = DifficultyItemId | 'autres'

export type DifficultyTrip = { id: string; pace: DifficultyPace | '' }

export type JourneyDifficulties = {
  groups: DifficultyGroup[]
  items: DifficultyItemId[]
  notes: Record<DifficultyNoteKey, string>
  /** Trajets concernés, pour chaque précision. */
  trips: Partial<Record<DifficultyKey, DifficultyTrip[]>>
}

export const DIFFICULTY_GROUPS: { id: DifficultyGroup; label: string }[] = [
  { id: 'circulation', label: 'Circulation ou temps de trajet' },
  { id: 'routes', label: 'État ou sécurité des routes' },
  { id: 'infra', label: 'Infrastructures et aménagements' },
  { id: 'autres', label: 'Autres difficultés' },
  { id: 'aucune', label: 'Aucune difficulté particulière' },
]

export const DIFFICULTY_ITEMS: { id: DifficultyItemId; group: Exclude<DifficultyGroup, 'autres' | 'aucune'>; label: string; autre?: boolean }[] = [
  { id: 'bouchons', group: 'circulation', label: 'Embouteillages ou circulation dense' },
  { id: 'long', group: 'circulation', label: 'Temps de trajet trop long' },
  { id: 'imprevisible', group: 'circulation', label: 'Temps de trajet imprévisible' },
  { id: 'heures', group: 'circulation', label: 'Difficultés de circulation à certaines heures' },
  { id: 'circulation-autre', group: 'circulation', label: 'Autre (à préciser)', autre: true },
  { id: 'chaussee', group: 'routes', label: 'Chaussées dégradées (nids-de-poule, revêtement…)' },
  { id: 'sinueuses', group: 'routes', label: 'Routes dangereuses ou sinueuses' },
  { id: 'visibilite', group: 'routes', label: 'Manque de visibilité' },
  { id: 'vitesse', group: 'routes', label: 'Vitesse excessive des autres véhicules' },
  { id: 'routes-autre', group: 'routes', label: 'Autre (à préciser)', autre: true },
  { id: 'trottoirs', group: 'infra', label: 'Manque ou mauvais état des trottoirs' },
  { id: 'velos', group: 'infra', label: 'Manque de pistes cyclables ou d’itinéraires sécurisés' },
  { id: 'stationnement', group: 'infra', label: 'Difficultés de stationnement' },
  { id: 'arrets', group: 'infra', label: 'Accès difficile aux arrêts ou aux transports' },
  { id: 'travaux', group: 'infra', label: 'Travaux, déviations ou routes fermées' },
  { id: 'infra-autre', group: 'infra', label: 'Autre (à préciser)', autre: true },
]

export const DIFFICULTY_PACES: { id: DifficultyPace; label: string }[] = [
  { id: 'toujours', label: 'Toujours' },
  { id: 'souvent', label: 'Souvent' },
  { id: 'parfois', label: 'Parfois' },
]

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
  /** Moyens utilisés pour un trajet déjà fait. Plusieurs possibles. */
  modes: string[]
  /** Train, autocar ou covoiturage envisagés pour ce trajet. Tous, tant que ce n’est pas modifié. */
  offerModes: string[]
  /** Vrai dès que « Par quel moyen ? » a été modifié. Sinon, les trois moyens sont sélectionnés. */
  offerModesCustom: boolean
  /** Minutes du trajet, pour chaque moyen choisi. */
  durations: Record<string, string>
  /** Minutes d’attente éventuelle. 0 s’il n’y en a pas. */
  wait: string
  /** Minutes porte-à-porte acceptables si une partie du trajet passait en transport en commun. */
  acceptable: string
  /** Vrai dès que ce temps a été modifié. Sinon, il suit la durée totale plus 10 %. */
  acceptableCustom: boolean
  origin: string
  originPlace: string
  destination: string
  place: string
  replaced: Replaced
  riders: number[]
  /** Passagers qui ne vivent pas dans le foyer. Chaque sélection en propose un de plus. */
  extraRiders: number
  /** Autres passagers qui feraient le trajet en transport en commun. */
  replacedExtraRiders: number
  /** Vrai si « qui fait ce trajet » a été modifié à la main. Sinon, l’unique personne du foyer est sélectionnée. */
  ridersCustom: boolean
  replacedRiders: number[]
  /** Vrai dès que « qui le ferait » a été modifié à la main. Sinon, ce sont les mêmes personnes que le trajet. */
  replacedRidersCustom: boolean
  comment: string
  /** Identifiant stable, pour relier une difficulté à ce trajet. */
  id: string
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
    modes: [],
    offerModes: OFFER_MODES.map((mode) => mode.id),
    offerModesCustom: false,
    durations: {},
    wait: '0',
    acceptable: '',
    acceptableCustom: false,
    origin: DOMICILE,
    originPlace: '',
    destination: '',
    place: '',
    replaced: kind === 'nouveau' ? 'offre' : '',
    riders: [],
    extraRiders: 0,
    replacedExtraRiders: 0,
    ridersCustom: false,
    replacedRiders: [],
    replacedRidersCustom: false,
    comment: '',
    id: journeyKey(),
  }
}

export function journeyKey(): string {
  return Math.random().toString(36).slice(2, 10).padEnd(8, '0')
}

function journeyId(value: unknown): string {
  return typeof value === 'string' && /^[a-z0-9]{8}$/.test(value) ? value : journeyKey()
}

export function emptyDifficulties(): JourneyDifficulties {
  return {
    groups: [],
    items: [],
    notes: { circulation: '', routes: '', infra: '', autres: '' },
    trips: {},
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
      journey.modes.length > 0 ||
      journey.offerModesCustom ||
      (journey.origin ?? DOMICILE).trim() !== DOMICILE ||
      (journey.originPlace ?? '').trim() ||
      journey.destination.trim() ||
      journey.place.trim() ||
      journey.riders.length ||
      journey.extraRiders > 0 ||
      journey.replacedRiders.length ||
      journey.comment.trim() ||
      Boolean(tripMinutes(journey.acceptable)) ||
      (journey.kind === 'actuel' && journey.replaced),
  )
}

export function journeyComplete(journey: Journey, peopleCount = 0): boolean {
  if (!journey.theme) return false
  if (!journey.aller) return false
  if (!frequencyComplete(journey)) return false
  if (journey.kind === 'actuel' && journey.modes.length === 0) return false
  if (journey.kind === 'actuel' && journey.modes.some((id) => !tripMinutes(journey.durations[id]))) return false
  if (!(journey.origin ?? DOMICILE).trim() || !journey.destination.trim()) return false
  if (journey.kind === 'actuel') {
    if (!tripRiders(journey, peopleCount).length) return false
    if (!asksTransit(journey.modes)) return true
    if (!journey.replaced || journey.replaced === 'offre') return false
    if (journey.replaced !== 'jamais' && !tripReplacedRiders(journey, peopleCount).length && !tripReplacedExtras(journey)) return false
    return true
  }
  return journey.replaced === 'offre' && tripReplacedRiders(journey, peopleCount).length > 0 && Boolean(tripMinutes(journey.acceptable))
}

export function tripRiders(journey: Journey, peopleCount: number): number[] {
  if (journey.kind !== 'actuel') return []
  if (!journey.ridersCustom && peopleCount === 1) return [0]
  return journey.riders
}

export function tripReplacedRiders(journey: Journey, peopleCount: number): number[] {
  if (journey.kind === 'nouveau') return !journey.replacedRidersCustom && peopleCount === 1 ? [0] : journey.replacedRiders
  if (!journey.replacedRidersCustom) return tripRiders(journey, peopleCount)
  const riding = new Set(journey.riders)
  return journey.replacedRiders.filter((index) => riding.has(index))
}

/** Autres passagers du trajet qui le feraient en transport en commun. */
export function tripReplacedExtras(journey: Journey): number {
  if (journey.kind !== 'actuel') return 0
  if (journey.replaced !== 'toujours' && journey.replaced !== 'souvent' && journey.replaced !== 'parfois') return 0
  if (!journey.replacedRidersCustom) return journey.extraRiders
  return Math.min(journey.replacedExtraRiders, journey.extraRiders)
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
    if ('replacedRiders' in patch || 'replacedExtraRiders' in patch) next.replacedRidersCustom = true
    if ('riders' in patch) next.ridersCustom = true
    if ('acceptable' in patch) next.acceptableCustom = true
    if ('offerModes' in patch) next.offerModesCustom = true
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

function offerModesOf(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return knownOfferModes(value.filter((id): id is string => typeof id === 'string'))
}

function knownOfferModes(ids: readonly string[]): string[] {
  return OFFER_MODES.map((mode) => mode.id).filter((id) => ids.includes(id))
}

/** Moyens envisagés. Les trois, tant que la personne n’a pas modifié la sélection. */
export function tripOfferModes(journey: Journey): string[] {
  return journey.offerModesCustom ? knownOfferModes(journey.offerModes) : OFFER_MODES.map((mode) => mode.id)
}

function journeyModes(source: Record<string, unknown>, allowed: Set<string>): string[] {
  const asked = Array.isArray(source.modes) ? source.modes : typeof source.mode === 'string' && source.mode ? [source.mode] : []
  return [...allowed].filter((id) => asked.includes(id))
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
    modes: journeyModes(source, allowed),
    offerModes: offerModesOf(source.offerModes),
    offerModesCustom: source.offerModesCustom === true,
    durations: rawDurations(source.durations),
    wait: waitMinutes(source.wait === undefined || source.wait === null ? '0' : String(source.wait)),
    acceptable: acceptableMinutes(source.acceptable === undefined || source.acceptable === null ? '' : String(source.acceptable)),
    acceptableCustom: source.acceptableCustom === true,
    origin: 'origin' in source ? clip(source.origin, 120) : DOMICILE,
    originPlace: clip(source.originPlace, 80),
    destination: clip(source.destination, 120),
    place: clip(source.place, 80),
    replaced: replacedOf(source.replaced, kind),
    riders: kind === 'actuel' ? indexesOf(source.riders, peopleCount) : [],
    extraRiders: kind === 'actuel' ? extraRidersOf(source.extraRiders) : 0,
    replacedExtraRiders: kind === 'actuel' ? replacedExtraOf(source.replacedExtraRiders, extraRidersOf(source.extraRiders)) : 0,
    ridersCustom: source.ridersCustom === true,
    replacedRiders: indexesOf(source.replacedRiders, peopleCount),
    replacedRidersCustom: ridersCustom(source, kind === 'actuel' ? indexesOf(source.riders, peopleCount) : [], indexesOf(source.replacedRiders, peopleCount)),
    comment: clip(source.comment, 400),
    id: journeyId(source.id),
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
  if (fold((next.origin ?? '').trim()) === fold(DOMICILE) && fold(next.destination.trim()) === fold(DOMICILE)) {
    next.destination = ''
    next.place = ''
  }
  if (next.kind === 'nouveau') {
    next.riders = []
    next.extraRiders = 0
    next.modes = []
  }
  next.durations = durationsFor(next.modes, next.durations)
  next.wait = waitMinutes(next.wait)
  if (next.kind === 'nouveau' || asksTransit(next.modes)) {
    next.offerModes = next.offerModesCustom ? knownOfferModes(next.offerModes) : OFFER_MODES.map((mode) => mode.id)
  } else {
    next.offerModes = OFFER_MODES.map((mode) => mode.id)
    next.offerModesCustom = false
  }
  if (next.kind === 'nouveau') {
    next.acceptable = tripMinutes(next.acceptable)
    next.acceptableCustom = false
  } else if (asksTransit(next.modes)) {
    next.acceptable = next.acceptableCustom ? acceptableMinutes(next.acceptable) : suggestedAcceptable(next)
  } else {
    next.acceptable = ''
    next.acceptableCustom = false
    next.replaced = ''
  }
  if (peopleCount === 1 && contentTouched(next)) {
    if (next.kind === 'actuel' && !next.ridersCustom && next.riders.length === 0) next.riders = [0]
    if (next.kind === 'nouveau' && !next.replacedRidersCustom && next.replacedRiders.length === 0) next.replacedRiders = [0]
  }
  if (next.kind === 'actuel' && next.replaced !== 'toujours' && next.replaced !== 'souvent' && next.replaced !== 'parfois') {
    next.replacedRiders = []
    next.replacedRidersCustom = false
    next.replacedExtraRiders = 0
  } else if (next.kind === 'actuel' && !next.replacedRidersCustom) {
    next.replacedRiders = next.riders
    next.replacedExtraRiders = next.extraRiders
  } else if (next.kind === 'actuel') {
    const riding = new Set(next.riders)
    next.replacedRiders = next.replacedRiders.filter((index) => riding.has(index))
    next.replacedExtraRiders = Math.min(Math.max(next.replacedExtraRiders, 0), next.extraRiders)
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
      journey.modes.length > 0 ||
      journey.offerModesCustom ||
      (journey.origin ?? DOMICILE).trim() !== DOMICILE ||
      (journey.originPlace ?? '').trim() ||
      journey.destination.trim() ||
      journey.place.trim() ||
      journey.comment.trim() ||
      Boolean(tripMinutes(journey.acceptable)) ||
      (journey.kind === 'actuel' && journey.replaced),
  )
}

export function sanitizeDifficulties(input: unknown, tripIds: readonly string[]): JourneyDifficulties {
  return cleanDifficulties(input, new Set(tripIds))
}

export function difficultiesIssue(value: JourneyDifficulties): string | null {
  if (!value.groups.length) return 'Choisissez ce qui pose difficulté.'
  if (value.groups.includes('aucune')) return null
  for (const group of value.groups) {
    if (group === 'autres') {
      if (!value.notes.autres.trim()) return 'Précisez la difficulté.'
      const noted = value.trips.autres ?? []
      if (!noted.length) return 'Indiquez les trajets concernés.'
      if (noted.some((trip) => !trip.pace)) return 'Indiquez si c’est toujours, souvent ou parfois.'
      continue
    }
    const chosen = DIFFICULTY_ITEMS.filter((item) => item.group === group && value.items.includes(item.id))
    if (!chosen.length) return 'Choisissez au moins une précision.'
    for (const item of chosen) {
      if (item.autre && !value.notes[item.group].trim()) return 'Précisez.'
      const linked = value.trips[item.id] ?? []
      if (!linked.length) return 'Indiquez les trajets concernés.'
      if (linked.some((trip) => !trip.pace)) return 'Indiquez si c’est toujours, souvent ou parfois.'
    }
  }
  return null
}

function cleanDifficulties(input: unknown, allowed?: Set<string>): JourneyDifficulties {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const asked = Array.isArray(source.groups) ? source.groups : []
  const groups = DIFFICULTY_GROUPS.map((group) => group.id).filter((id) => asked.includes(id))
  if (groups.includes('aucune')) return { ...emptyDifficulties(), groups: ['aucune'] }
  const askedItems = Array.isArray(source.items) ? source.items : []
  const items = DIFFICULTY_ITEMS.filter((item) => askedItems.includes(item.id) && groups.includes(item.group)).map((item) => item.id)
  const tripsIn = source.trips && typeof source.trips === 'object' ? (source.trips as Record<string, unknown>) : {}
  const trips: JourneyDifficulties['trips'] = {}
  const keys: DifficultyKey[] = groups.includes('autres') ? [...items, 'autres'] : [...items]
  for (const key of keys) {
    const list = cleanTripList(tripsIn[key], allowed)
    if (list.length) trips[key] = list
  }
  const notesIn = source.notes && typeof source.notes === 'object' ? (source.notes as Record<string, unknown>) : {}
  const notes = emptyDifficulties().notes
  for (const item of DIFFICULTY_ITEMS) {
    if (item.autre && items.includes(item.id)) notes[item.group] = clip(notesIn[item.group], 160)
  }
  if (groups.includes('autres')) notes.autres = clip(notesIn.autres, 160)
  return { groups, items, notes, trips }
}

function cleanTripList(input: unknown, allowed?: Set<string>): DifficultyTrip[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const trips: DifficultyTrip[] = []
  for (const item of input) {
    const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const id = typeof source.id === 'string' ? source.id : ''
    if (!/^[a-z0-9]{8}$/.test(id) || seen.has(id) || (allowed && !allowed.has(id))) continue
    seen.add(id)
    trips.push({ id, pace: paceOf(source.pace) })
  }
  return trips
}

function paceOf(value: unknown): DifficultyPace | '' {
  return value === 'toujours' || value === 'souvent' || value === 'parfois' ? value : ''
}

export function toggleDifficultyGroup(current: JourneyDifficulties, group: DifficultyGroup): JourneyDifficulties {
  const none = current.groups.includes('aucune')
  const some = current.groups.some((id) => id !== 'aucune')
  const selected = current.groups.includes(group)
  if (!selected && ((group === 'aucune' && some) || (group !== 'aucune' && none))) return current
  if (group === 'aucune') return selected ? emptyDifficulties() : { ...emptyDifficulties(), groups: ['aucune'] }
  const groups = selected ? current.groups.filter((item) => item !== group) : [...current.groups, group]
  return cleanDifficulties({ ...current, groups })
}

export function toggleDifficultyItem(current: JourneyDifficulties, id: DifficultyItemId): JourneyDifficulties {
  const items = current.items.includes(id) ? current.items.filter((item) => item !== id) : [...current.items, id]
  return cleanDifficulties({ ...current, items })
}

/** Un seul trajet déjà noté est concerné d’office par chaque difficulté précisée. */
export function applySoleTrip(current: JourneyDifficulties, tripIds: readonly string[]): JourneyDifficulties {
  if (tripIds.length !== 1 || current.groups.includes('aucune')) return current
  const id = tripIds[0] ?? ''
  if (!/^[a-z0-9]{8}$/.test(id)) return current
  let trips = current.trips
  let changed = false
  for (const key of readyDifficultyKeys(current)) {
    const list = trips[key] ?? []
    if (list.some((trip) => trip.id === id)) continue
    trips = { ...trips, [key]: [...list, { id, pace: '' }] }
    changed = true
  }
  return changed ? cleanDifficulties({ ...current, trips }) : current
}

function readyDifficultyKeys(current: JourneyDifficulties): DifficultyKey[] {
  const keys: DifficultyKey[] = []
  for (const item of DIFFICULTY_ITEMS) {
    if (!current.groups.includes(item.group) || !current.items.includes(item.id)) continue
    if (item.autre && !current.notes[item.group].trim()) continue
    keys.push(item.id)
  }
  if (current.groups.includes('autres') && current.notes.autres.trim()) keys.push('autres')
  return keys
}

export function toggleDifficultyTrip(current: JourneyDifficulties, key: DifficultyKey, tripId: string): JourneyDifficulties {
  const list = current.trips[key] ?? []
  const trips = list.some((trip) => trip.id === tripId)
    ? list.filter((trip) => trip.id !== tripId)
    : [...list, { id: tripId, pace: '' as const }]
  return cleanDifficulties({ ...current, trips: { ...current.trips, [key]: trips } })
}

export function setDifficultyTripPace(
  current: JourneyDifficulties,
  key: DifficultyKey,
  tripId: string,
  pace: DifficultyPace,
): JourneyDifficulties {
  const trips = (current.trips[key] ?? []).map((trip) =>
    trip.id === tripId ? { ...trip, pace: trip.pace === pace ? '' : pace } : trip,
  )
  return cleanDifficulties({ ...current, trips: { ...current.trips, [key]: trips } })
}

export function setDifficultyNote(current: JourneyDifficulties, key: DifficultyNoteKey, note: string): JourneyDifficulties {
  return cleanDifficulties({ ...current, notes: { ...current.notes, [key]: note } })
}

export function difficultiesLine(value: JourneyDifficulties): string {
  if (value.groups.includes('aucune')) return 'Aucune difficulté particulière'
  const labels = value.items.map((id) => {
    const item = DIFFICULTY_ITEMS.find((entry) => entry.id === id)
    if (!item) return ''
    if (!item.autre) return item.label
    const note = value.notes[item.group].trim()
    return note ? `Autre : ${note}` : ''
  })
  if (value.groups.includes('autres') && value.notes.autres.trim()) labels.push(value.notes.autres.trim())
  return labels.filter(Boolean).join(' · ')
}

export function listedActualTrips(journeys: Journey[]): { id: string; label: string }[] {
  let count = 0
  return journeys.flatMap((journey) => {
    if (journey.kind !== 'actuel' || !journeyTouched(journey)) return []
    const heading = journeyHeading(journey, count)
    count += 1
    return [{ id: journey.id, label: journey.destination.trim() ? `${heading.title} — ${heading.route}` : heading.title }]
  })
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

function durationsFor(modes: string[], source: Record<string, string>): Record<string, string> {
  const kept: Record<string, string> = {}
  for (const id of modes) {
    const minutes = tripMinutes(source[id])
    if (minutes) kept[id] = minutes
  }
  return kept
}

function rawDurations(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}
  const kept: Record<string, string> = {}
  for (const [id, minutes] of Object.entries(value as Record<string, unknown>)) {
    if (typeof minutes === 'string' || typeof minutes === 'number') kept[id] = String(minutes)
  }
  return kept
}

/** Minutes entières, de 1 à 999. Vide si la saisie ne compte pas. */
export function tripMinutes(value: string | undefined): string {
  const text = String(value ?? '').replace(/\D/g, '').slice(0, 3)
  if (!text) return ''
  const count = Number(text)
  if (count < 1 || count > 999) return ''
  return String(count)
}

/** Minutes d’attente, de 0 à 999. Une saisie vide revient à 0. */
export function waitMinutes(value: string | undefined): string {
  const text = String(value ?? '').replace(/\D/g, '').slice(0, 3)
  if (!text) return '0'
  const count = Number(text)
  if (count > 999) return '999'
  return String(count)
}

/** Somme des temps de trajet et de l’attente, en minutes. */
export function doorToDoorMinutes(durations: Record<string, string>, modes: readonly string[], wait: string): number {
  const legs = modes.reduce((sum, id) => sum + (Number(tripMinutes(durations[id])) || 0), 0)
  return legs + Number(waitMinutes(wait))
}

const TRANSIT_MODES = new Set(['train', 'autocar'])

/** Moyens choisis qui ne sont ni le train ni l’autocar. */
export function modesBesideTransit(modes: readonly string[]): string[] {
  return modes.filter((id) => !TRANSIT_MODES.has(id))
}

/** La question du report vers le transport en commun ne concerne pas un trajet déjà fait en train ou en autocar. */
export function asksTransit(modes: readonly string[]): boolean {
  return modesBesideTransit(modes).length > 0
}

/** Durée totale plus 10 %, arrondie à 5 minutes. */
export function suggestedAcceptableMinutes(total: number): number {
  if (total <= 0) return 0
  return Math.min(999, Math.round((total * 1.1) / 5) * 5)
}

/** Minutes acceptables, de 0 à 999. Vide si la saisie ne compte pas. */
export function acceptableMinutes(value: string | undefined): string {
  const text = String(value ?? '').replace(/\D/g, '').slice(0, 3)
  if (!text) return ''
  const count = Number(text)
  if (count > 999) return '999'
  return String(count)
}

function suggestedAcceptable(journey: Journey): string {
  const total = doorToDoorMinutes(journey.durations, journey.modes, journey.wait)
  return total > 0 ? String(suggestedAcceptableMinutes(total)) : ''
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

function replacedExtraOf(value: unknown, extraRiders: number): number {
  if (value === undefined || value === null) return extraRiders
  const count = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(count) || count < 1) return 0
  return Math.min(count, extraRiders)
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
