export const THEME_IDS = ['travail', 'sante', 'administratif', 'loisirs', 'achats', 'visites', 'autre'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const SLOT_IDS = ['4-6', '6-8', '8-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-0', '0-4'] as const
export type SlotId = (typeof SLOT_IDS)[number]

export const DAY_IDS = ['semaine', 'samedi', 'dimanche'] as const
export type DayId = (typeof DAY_IDS)[number]

export type SlotPick = { slot: SlotId; flexible: boolean }
export type DaySchedule = { aller: SlotPick[]; retour: SlotPick[] }
export type Trip = { perWeek: string; days: Partial<Record<DayId, DaySchedule>>; modes: string[] }
export type Goes = '' | 'oui' | 'non'
export type BusChoice = '' | 'certainement' | 'peut-etre' | 'non'
export type BusOften = '' | 'toujours' | 'souvent' | 'parfois' | 'rarement'
export type GaveUp = '' | 'toujours' | 'souvent' | 'parfois' | 'jamais'

export type PersonTheme = {
  goes: Goes
  wouldConsider: Goes
  actual: Trip
  bus: BusChoice
  busOften: BusOften
  busTrip: Trip
  whyNot: string[]
  gaveUp: GaveUp
}

export type PersonMotives = Record<ThemeId, PersonTheme>
export type MotiveCursor = { theme: ThemeId; person: number }
export type Motives = { autre: string; cursor: MotiveCursor; people: PersonMotives[] }

const THEME_ORDER: ThemeId[] = ['travail', 'sante', 'administratif', 'loisirs', 'achats', 'visites', 'autre']

const THEME_COPY: Record<Exclude<ThemeId, 'autre'>, { label: string; reason: string; consider: string }> = {
  travail: {
    label: 'Travail / Études / Formations',
    reason: 'le travail, les études ou une formation',
    consider: 'de chercher un emploi, de faire des études ou de suivre une formation',
  },
  sante: { label: 'Santé', reason: 'la santé', consider: 'de changer de professionnels de santé' },
  administratif: {
    label: 'Administratif',
    reason: 'l’administratif',
    consider: 'de changer de banque, d’assurance ou de centre d’aide sociale',
  },
  loisirs: {
    label: 'Loisirs',
    reason: 'les loisirs',
    consider: 'de visiter d’autres lieux de culture, bars, restaurants, associations ou clubs',
  },
  achats: { label: 'Achats', reason: 'les achats', consider: 'de changer vos habitudes de consommation' },
  visites: { label: 'Visites de proches', reason: 'des visites de proches', consider: 'de lier davantage de liens amicaux' },
}

export const SLOTS: { id: SlotId; label: string }[] = [
  { id: '4-6', label: '4 - 6' },
  { id: '6-8', label: '6 - 8' },
  { id: '8-10', label: '8 - 10' },
  { id: '10-12', label: '10 - 12' },
  { id: '12-14', label: '12 - 14' },
  { id: '14-16', label: '14 - 16' },
  { id: '16-18', label: '16 - 18' },
  { id: '18-20', label: '18 - 20' },
  { id: '20-22', label: '20 - 22' },
  { id: '22-0', label: '22 - 0' },
  { id: '0-4', label: '0 - 4' },
]

export const DAYS: { id: DayId; label: string; mark: string }[] = [
  { id: 'semaine', label: 'Lundi à vendredi', mark: 'LMMJV' },
  { id: 'samedi', label: 'Samedi', mark: 'S' },
  { id: 'dimanche', label: 'Dimanche', mark: 'D' },
]

export const BUS_CHOICES: { id: Exclude<BusChoice, ''>; label: string }[] = [
  { id: 'certainement', label: 'Oui, très certainement' },
  { id: 'peut-etre', label: 'Peut-être' },
  { id: 'non', label: 'Certainement pas' },
]

export const BUS_OFTEN: { id: Exclude<BusOften, ''>; label: string }[] = [
  { id: 'toujours', label: 'Toujours' },
  { id: 'souvent', label: 'Souvent' },
  { id: 'parfois', label: 'Parfois' },
  { id: 'rarement', label: 'Rarement' },
]

export const GAVE_UP: { id: Exclude<GaveUp, ''>; label: string }[] = [
  { id: 'toujours', label: 'Toujours' },
  { id: 'souvent', label: 'Souvent' },
  { id: 'parfois', label: 'Parfois' },
  { id: 'jamais', label: 'Jamais' },
]

export const WHY_NOT: { id: string; label: string }[] = [
  { id: 'transporter', label: 'Choses à transporter' },
  { id: 'flexible', label: 'Besoin de se déplacer de manière flexible' },
  { id: 'aleatoire', label: 'Horaires trop aléatoires' },
  { id: 'retards', label: 'Peur des retards' },
  { id: 'conduire', label: 'Aime conduire' },
]

export const EXTRA_MODES: { id: string; label: string }[] = [
  { id: 'velo', label: 'Vélo' },
  { id: 'proche', label: 'Véhiculé par un proche' },
  { id: 'covoiturage', label: 'Covoiturage' },
  { id: 'taxi', label: 'Taxi / VTC' },
  { id: 'train', label: 'Train ou car' },
  { id: 'autostop', label: 'Autostop' },
  { id: 'autre-mode', label: 'Autre' },
]

const MOTORS: Record<string, string> = {
  electrique: '100 % électrique',
  hybride: 'Hybride',
  thermique: 'Thermique',
}

export function emptyTrip(): Trip {
  return { perWeek: '', days: {}, modes: [] }
}

export function emptyPersonTheme(): PersonTheme {
  return {
    goes: '',
    wouldConsider: '',
    actual: emptyTrip(),
    bus: '',
    busOften: '',
    busTrip: emptyTrip(),
    whyNot: [],
    gaveUp: '',
  }
}

function emptyPersonMotives(): PersonMotives {
  return {
    travail: emptyPersonTheme(),
    sante: emptyPersonTheme(),
    administratif: emptyPersonTheme(),
    loisirs: emptyPersonTheme(),
    achats: emptyPersonTheme(),
    visites: emptyPersonTheme(),
    autre: emptyPersonTheme(),
  }
}

export function emptyMotives(people = 1): Motives {
  return {
    autre: '',
    cursor: { theme: 'travail', person: 0 },
    people: Array.from({ length: Math.max(people, 0) }, () => emptyPersonMotives()),
  }
}

export function themeLabel(theme: ThemeId, autre: string): string {
  if (theme === 'autre') return autre.trim() || 'Autre'
  return THEME_COPY[theme].label
}

export function placePhrase(side: 'de' | 'vers'): string {
  return side === 'de' ? 'en dehors de Pontarlier' : 'à Pontarlier'
}

export function busPlacePhrase(side: 'de' | 'vers'): string {
  return side === 'de' ? 'vers les communes environnantes' : 'pour Pontarlier'
}

export function goesQuestion(theme: ThemeId, side: 'de' | 'vers', autre: string): string {
  const reason = theme === 'autre' ? `« ${autre.trim()} »` : THEME_COPY[theme].reason
  return `Allez-vous ${placePhrase(side)} pour ${reason} ?`
}

export function considerQuestion(theme: ThemeId, side: 'de' | 'vers', autre = ''): string | null {
  if (theme === 'autre') {
    const name = autre.trim()
    if (!name) return null
    return `Une offre de transports en commun vous ferait-elle envisager « ${name} » ${placePhrase(side)} ?`
  }
  return `Une offre de transports en commun vous ferait-elle envisager ${THEME_COPY[theme].consider} ${placePhrase(side)} ?`
}

export function busQuestion(side: 'de' | 'vers'): string {
  return `Si un bus faisait des navettes aux horaires qui vous conviennent ${busPlacePhrase(side)} à un prix qui vous conviendrait, la prendriez-vous ?`
}

export function showsActual(row: PersonTheme): boolean {
  return row.goes === 'oui'
}

export function tripHasHours(trip: Trip): boolean {
  return DAY_IDS.some((day) => {
    const item = trip.days[day]
    return Boolean(item && (item.aller.length > 0 || item.retour.length > 0))
  })
}

/** Le bouton de reprise n’existe que si le trajet actuel a des horaires. */
export function canCopyHours(row: PersonTheme): boolean {
  return row.goes === 'oui' && tripHasHours(row.actual)
}

export type MotiveReveal = {
  actualFrequency: boolean
  actualHours: boolean
  actualModes: boolean
  consider: boolean
  bus: boolean
  busOften: boolean
  busFrequency: boolean
  busHours: boolean
  why: boolean
  gaveUp: boolean
}

/** Chaque question n’apparaît qu’une fois la précédente répondue. */
export function motiveReveal(theme: ThemeId, row: PersonTheme, autre = ''): MotiveReveal {
  const actualFrequency = row.goes === 'oui'
  const actualHours = actualFrequency && row.actual.perWeek !== ''
  const actualModes = actualHours && tripHasHours(row.actual)
  const actualDone = actualModes && row.actual.modes.length > 0
  const consider = showsConsider(theme, row, autre)
  const considerDone = !consider || row.wouldConsider !== ''
  const bus = (actualFrequency ? actualDone : row.goes === 'non') && considerDone
  const busOften = bus && showsBusDetail(row)
  const busFrequency = busOften && row.busOften !== ''
  const busHours = busFrequency && row.busTrip.perWeek !== ''
  const busDone = !showsBusDetail(row) || (busHours && tripHasHours(row.busTrip))
  const follow = followUp(row)
  return {
    actualFrequency,
    actualHours,
    actualModes,
    consider,
    bus,
    busOften,
    busFrequency,
    busHours,
    why: bus && busDone && follow === 'why',
    gaveUp: bus && busDone && follow === 'gave-up',
  }
}

export function showsConsider(theme: ThemeId, row: PersonTheme, autre = ''): boolean {
  if (row.goes !== 'non') return false
  return theme !== 'autre' || Boolean(autre.trim())
}

export function showsBusDetail(row: PersonTheme): boolean {
  return row.bus === 'certainement' || row.bus === 'peut-etre'
}

export type FollowUp = 'why' | 'gave-up' | 'none'

export function followUp(row: PersonTheme): FollowUp {
  if (row.goes === 'oui' && row.bus === 'non') return 'why'
  if (row.goes === 'non' && showsBusDetail(row)) return 'gave-up'
  return 'none'
}

export function motiveReady(motives: Motives): boolean {
  const cursor = placeCursor(motives.cursor, motives.people.length)
  if (cursor.theme === 'autre' && !motives.autre.trim()) return true
  const row = motives.people[cursor.person]?.[cursor.theme]
  if (!row?.goes) return false
  const shown = motiveReveal(cursor.theme, row, motives.autre)
  if (shown.actualFrequency && row.actual.perWeek === '') return false
  if (shown.actualHours && !tripHasHours(row.actual)) return false
  if (shown.actualModes && row.actual.modes.length === 0) return false
  if (shown.consider && !row.wouldConsider) return false
  if (!shown.bus || !row.bus) return false
  if (shown.busOften && !row.busOften) return false
  if (shown.busFrequency && row.busTrip.perWeek === '') return false
  if (shown.busHours && !tripHasHours(row.busTrip)) return false
  if (shown.why && row.whyNot.length === 0) return false
  if (shown.gaveUp && !row.gaveUp) return false
  return true
}

export function motiveIssue(motives: Motives): string | null {
  return motiveReady(motives) ? null : 'Répondez avant de continuer.'
}

/** Personne suivante, puis activité suivante. Null en dehors de l’étape. Autre vide se quitte tout de suite. */
export function shiftMotive(motives: Motives, peopleCount: number, direction: 1 | -1): Motives | null {
  const count = Math.max(peopleCount, 1)
  const cursor = placeCursor(motives.cursor, count)
  if (direction > 0 && cursor.theme === 'autre' && !motives.autre.trim()) return null
  const themeIndex = Math.max(0, THEME_ORDER.indexOf(cursor.theme))
  const index = themeIndex * count + cursor.person + direction
  if (index < 0 || index >= THEME_ORDER.length * count) return null
  const theme = THEME_ORDER[Math.floor(index / count)]
  if (!theme) return null
  return { ...motives, cursor: { theme, person: index % count } }
}

function placeCursor(cursor: MotiveCursor, peopleCount: number): MotiveCursor {
  const count = Math.max(peopleCount, 1)
  const theme = THEME_ORDER.includes(cursor.theme) ? cursor.theme : 'travail'
  const person = Number.isInteger(cursor.person) ? cursor.person : 0
  return { theme, person: Math.min(Math.max(person, 0), count - 1) }
}

export function vehicleModeOptions(cars: { motor: string }[], twoWheelers: { motor: string }[]): { id: string; label: string }[] {
  const named = (prefix: string, title: string, vehicles: { motor: string }[]) =>
    vehicles.map((vehicle, index) => {
      const motor = MOTORS[vehicle.motor]
      return { id: `${prefix}:${index}`, label: motor ? `${title} ${index + 1} · ${motor}` : `${title} ${index + 1}` }
    })
  return [...named('car', 'Voiture', cars), ...named('wheel', '2/3 roues', twoWheelers), ...EXTRA_MODES]
}

export function setPersonTheme(motives: Motives, person: number, theme: ThemeId, patch: Partial<PersonTheme>): Motives {
  return {
    ...motives,
    people: motives.people.map((row, index) => (index === person ? { ...row, [theme]: { ...row[theme], ...patch } } : row)),
  }
}

export function toggleDay(trip: Trip, day: DayId): Trip {
  if (trip.days[day]) {
    const days = { ...trip.days }
    delete days[day]
    return { ...trip, days }
  }
  return { ...trip, days: { ...trip.days, [day]: { aller: [], retour: [] } } }
}

export function toggleSlot(picks: SlotPick[], slot: SlotId): SlotPick[] {
  if (picks.some((pick) => pick.slot === slot)) return picks.filter((pick) => pick.slot !== slot)
  return [...picks, { slot, flexible: false }]
}

/** Coche ou retire un jour dans un horaire. Un jour sans aucun créneau disparaît. */
export function toggleDaySlot(trip: Trip, day: DayId, direction: 'aller' | 'retour', slot: SlotId): Trip {
  const current = trip.days[day] ?? { aller: [], retour: [] }
  const next: DaySchedule = {
    aller: direction === 'aller' ? toggleSlot(current.aller, slot) : current.aller,
    retour: direction === 'retour' ? toggleSlot(current.retour, slot) : current.retour,
  }
  const days = { ...trip.days }
  if (next.aller.length === 0 && next.retour.length === 0) delete days[day]
  else days[day] = next
  return { ...trip, days }
}

/** Passe Flexible pour tous les jours déjà cochés sur cet horaire. */
export function toggleSlotFlexible(trip: Trip, direction: 'aller' | 'retour', slot: SlotId): Trip {
  const chosen = DAY_IDS.filter((day) => trip.days[day]?.[direction].some((pick) => pick.slot === slot))
  if (!chosen.length) return trip
  const enable = chosen.some((day) => !trip.days[day]?.[direction].some((pick) => pick.slot === slot && pick.flexible))
  const days = { ...trip.days }
  for (const day of chosen) {
    const item = days[day]
    if (!item) continue
    days[day] = {
      ...item,
      [direction]: item[direction].map((pick) => (pick.slot === slot ? { ...pick, flexible: enable } : pick)),
    }
  }
  return { ...trip, days }
}

export function toggleFlexible(picks: SlotPick[], slot: SlotId): SlotPick[] {
  return picks.map((pick) => (pick.slot === slot ? { ...pick, flexible: !pick.flexible } : pick))
}

export function copyHours(from: Trip, to: Trip): Trip {
  return { ...to, days: cloneDays(from.days) }
}

export function slotChosen(trip: Trip, day: DayId, direction: 'aller' | 'retour', slot: SlotId): boolean {
  return trip.days[day]?.[direction].some((pick) => pick.slot === slot) ?? false
}

export function motivesStarted(motives: Motives): boolean {
  if (motives.autre.trim()) return true
  return motives.people.some((person) =>
    THEME_IDS.some((theme) => {
      const row = person[theme]
      return Boolean(row.goes || row.wouldConsider || row.bus || row.whyNot.length || row.gaveUp || tripStarted(row.actual) || tripStarted(row.busTrip))
    }),
  )
}

function tripStarted(trip: Trip): boolean {
  return Boolean(trip.perWeek || trip.modes.length || Object.keys(trip.days).length)
}

export function sanitizeMotives(input: unknown, peopleCount: number, carCount: number, wheelCount: number): Motives {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const autre = typeof source.autre === 'string' ? source.autre.slice(0, 80) : ''
  const rows = Array.isArray(source.people) ? source.people : []
  const count = Math.max(0, Math.min(peopleCount, 12))
  return {
    autre,
    cursor: placeCursor(cursorOf(source.cursor), count),
    people: Array.from({ length: count }, (_, index) => cleanPerson(rows[index], autre, carCount, wheelCount)),
  }
}

function cursorOf(input: unknown): MotiveCursor {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const theme = THEME_ORDER.find((item) => item === source.theme) ?? 'travail'
  const person = typeof source.person === 'number' && Number.isInteger(source.person) ? source.person : 0
  return { theme, person }
}

function cleanPerson(input: unknown, autre: string, carCount: number, wheelCount: number): PersonMotives {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const person = emptyPersonMotives()
  for (const theme of THEME_IDS) person[theme] = cleanTheme(source[theme], theme, autre, carCount, wheelCount)
  return person
}

function cleanTheme(input: unknown, theme: ThemeId, autre: string, carCount: number, wheelCount: number): PersonTheme {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  return keepVisible(theme, {
    goes: goesOf(source.goes),
    wouldConsider: goesOf(source.wouldConsider),
    actual: cleanTrip(source.actual, carCount, wheelCount),
    bus: busOf(source.bus),
    busOften: oftenOf(source.busOften),
    busTrip: { ...cleanTrip(source.busTrip, carCount, wheelCount), modes: [] },
    whyNot: whyOf(source.whyNot),
    gaveUp: gaveOf(source.gaveUp),
  }, autre)
}

/** Une réponse dont la question ne s’affiche plus est oubliée. La ressaisir si on y revient. */
function keepVisible(theme: ThemeId, row: PersonTheme, autre: string): PersonTheme {
  if (theme === 'autre' && !autre.trim()) return emptyPersonTheme()
  const actual = row.goes === 'oui' ? visibleTrip(row.actual) : emptyTrip()
  const base: PersonTheme = {
    goes: row.goes,
    wouldConsider: row.goes === 'non' ? row.wouldConsider : '',
    actual,
    bus: '',
    busOften: '',
    busTrip: emptyTrip(),
    whyNot: [],
    gaveUp: '',
  }
  if (!motiveReveal(theme, base, autre).bus) return base
  const withBus: PersonTheme = { ...base, bus: row.bus }
  const detail = motiveReveal(theme, withBus, autre).busOften && Boolean(row.busOften)
  const withTrip: PersonTheme = detail
    ? { ...withBus, busOften: row.busOften, busTrip: { ...visibleTrip(row.busTrip), modes: [] } }
    : withBus
  const follow = motiveReveal(theme, withTrip, autre)
  return { ...withTrip, whyNot: follow.why ? row.whyNot : [], gaveUp: follow.gaveUp ? row.gaveUp : '' }
}

function visibleTrip(trip: Trip): Trip {
  if (!trip.perWeek) return emptyTrip()
  return tripHasHours(trip) ? trip : { ...trip, modes: [] }
}

export const FREQUENCIES = [
  'Une fois par an ou moins',
  'Quelques fois par an',
  'Quelques fois par mois',
  'Plusieurs fois par semaine',
] as const

function cleanTrip(input: unknown, carCount: number, wheelCount: number): Trip {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const allowed = new Set([
    ...Array.from({ length: carCount }, (_, index) => `car:${index}`),
    ...Array.from({ length: wheelCount }, (_, index) => `wheel:${index}`),
    ...EXTRA_MODES.map((mode) => mode.id),
  ])
  const modes = Array.isArray(source.modes) ? source.modes.filter((mode): mode is string => typeof mode === 'string' && allowed.has(mode)) : []
  const days: Trip['days'] = {}
  const rawDays = source.days && typeof source.days === 'object' ? (source.days as Record<string, unknown>) : {}
  for (const day of DAY_IDS) {
    if (!rawDays[day] || typeof rawDays[day] !== 'object') continue
    const item = rawDays[day] as Record<string, unknown>
    days[day] = { aller: cleanSlots(item.aller), retour: cleanSlots(item.retour) }
  }
  return { perWeek: weekButton(source.perWeek), days, modes }
}

function weekButton(value: unknown): string {
  if (typeof value !== 'string') return ''
  return (FREQUENCIES as readonly string[]).includes(value) ? value : ''
}

function cleanSlots(input: unknown): SlotPick[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<SlotId>()
  const picks: SlotPick[] = []
  for (const item of input) {
    if (!item || typeof item !== 'object') continue
    const raw = (item as { slot?: unknown }).slot
    const slot = raw === 'avant-6' ? '4-6' : raw === 'apres-0' ? '0-4' : raw
    if (typeof slot !== 'string' || !SLOT_IDS.includes(slot as SlotId) || seen.has(slot as SlotId)) continue
    seen.add(slot as SlotId)
    picks.push({ slot: slot as SlotId, flexible: (item as { flexible?: unknown }).flexible === true })
  }
  return SLOT_IDS.filter((slot) => seen.has(slot)).map((slot) => picks.find((pick) => pick.slot === slot) as SlotPick)
}

function goesOf(value: unknown): Goes {
  return value === 'oui' || value === 'non' ? value : ''
}

function busOf(value: unknown): BusChoice {
  return value === 'certainement' || value === 'peut-etre' || value === 'non' ? value : ''
}

function oftenOf(value: unknown): BusOften {
  return value === 'toujours' || value === 'souvent' || value === 'parfois' || value === 'rarement' ? value : ''
}

function gaveOf(value: unknown): GaveUp {
  return value === 'toujours' || value === 'souvent' || value === 'parfois' || value === 'jamais' ? value : ''
}

function whyOf(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set(WHY_NOT.map((item) => item.id))
  return WHY_NOT.map((item) => item.id).filter((id) => value.includes(id) && allowed.has(id))
}

function cloneDays(days: Trip['days']): Trip['days'] {
  const copy: Trip['days'] = {}
  for (const day of DAY_IDS) {
    const item = days[day]
    if (!item) continue
    copy[day] = {
      aller: item.aller.map((pick) => ({ ...pick })),
      retour: item.retour.map((pick) => ({ ...pick })),
    }
  }
  return copy
}
