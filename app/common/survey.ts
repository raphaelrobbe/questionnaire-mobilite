import { fold, PONTARLIER } from './config'
import { communePlace, frenchCommunityFor } from './frenchCommunes'
import { swissSectorFor } from './swissCommunes'
import { type MapApp } from './settings'
import { emptyMotives, motivesStarted, sanitizeMotives, type Motives } from './motives'
import { DOMICILE, actualJourneyIssue, defaultJourneys, difficultiesIssue, difficultiesLine, emptyDifficulties, journeyTouched, journeysStarted, offerJourneyIssue, sanitizeDifficulties, sanitizeJourneys, type Journey, type JourneyDifficulties } from './journeys'

export const MAX_PEOPLE = 12
export const MAX_VEHICLES = 8

export type AgeBand = '0-14' | '15-17' | '18-24' | '25-39' | '40-64' | '65+'
export type Drive = 'non' | 'accompagnee' | 'oui'
export type Motor = 'electrique' | 'hybride' | 'thermique'

export type Person = {
  age: AgeBand | ''
  drive: Drive | ''
  manqueAutonomie: boolean
  /** Inscription sur les listes électorales, à partir de 18 ans. */
  electoral: 'oui' | 'non' | ''
  /** Commune d’inscription. Vide si la personne n’est pas inscrite. */
  electoralCommune: string
}
export type Vehicle = { motor: Motor | ''; sansPermis: boolean }

export type Recontact = 'oui' | 'non'

export type HandicapAnswer = 'oui' | 'non' | 'nsp'
export type HandicapAdaptation = 'pmr' | 'montee' | 'vue' | 'ouie' | 'cognitif' | 'humain' | 'autre'
export type HandicapWho = 'moi' | 'foyer' | 'proche'
export type LifeChoiceId = 'residence' | 'emploi' | 'activite' | 'achats' | 'non'
export type LifeChoiceDetail = Exclude<LifeChoiceId, 'non'>
export type ModeReasonId =
  | 'environnement'
  | 'depenses'
  | 'stress'
  | 'bouchons'
  | 'accident'
  | 'permis'
  | 'souci'
  | 'stationnement'
  | 'repos'
  | 'dependance'
  | 'sante'
  | 'autre'
  | 'aucune'
export type ModeConditionId =
  | 'court'
  | 'identique'
  | 'min15'
  | 'min30'
  | 'min45'
  | 'long'
  | 'inferieur'
  | 'equivalent'
  | 'superieur'
  | 'abonnement'
  | 'arret'
  | 'horaires'
  | 'frequence'
  | 'correspondances'
  | 'fiabilite'
  | 'bagages'
  | 'enfants'
  | 'autre'
  | 'aucune'
export type ModeBarrierId =
  | 'horaires'
  | 'flexibilite'
  | 'marche'
  | 'duree'
  | 'correspondances'
  | 'frequence'
  | 'cout'
  | 'bagages'
  | 'enfants'
  | 'confort'
  | 'securite'
  | 'fiabilite'
  | 'sante'
  | 'reservation'
  | 'habitudes'
  | 'autre'
  | 'aucun'
export type WalkDistanceId = 'm200' | 'm500' | 'km1' | 'km2' | 'plus' | 'meteo' | 'frequence' | 'jamais' | 'autre'
export type HandicapConcern = 'oui' | 'non'

export type VisitOutcome = 'introuvable' | 'ailleurs' | 'absente' | 'reporter' | 'refus' | 'commencer'

export type Visit = { outcome: VisitOutcome; at: string }

export const VISITS: { value: VisitOutcome; label: string; starts: boolean }[] = [
  { value: 'introuvable', label: 'L’adresse indiquée n’a pas été trouvée', starts: false },
  { value: 'ailleurs', label: 'La personne recherchée ne semble pas habiter à l’adresse indiquée', starts: false },
  { value: 'absente', label: 'La personne était absente', starts: false },
  { value: 'reporter', label: 'La personne était présente mais a demandé à être visitée à un autre moment', starts: false },
  { value: 'refus', label: 'La personne n’a pas souhaité répondre à l’enquête', starts: false },
  { value: 'commencer', label: 'Commencer l’enquête', starts: true },
]

export type Civility = 'monsieur' | 'madame'

export const CIVILITY: Labeled<Civility>[] = [
  { value: 'monsieur', label: 'Monsieur' },
  { value: 'madame', label: 'Madame' },
]

export const HANDICAP_ANSWERS: Labeled<HandicapAnswer>[] = [
  { value: 'oui', label: 'Oui' },
  { value: 'non', label: 'Non' },
  { value: 'nsp', label: 'Ne sait pas' },
]

export const HANDICAP_ADAPTATIONS: Labeled<HandicapAdaptation>[] = [
  { value: 'pmr', label: 'Accessibilité pour les personnes à mobilité réduite (fauteuil roulant, difficultés à marcher, etc.)' },
  { value: 'montee', label: 'Aide à la montée et à la descente des véhicules' },
  { value: 'vue', label: 'Adaptations pour les personnes malvoyantes ou aveugles' },
  { value: 'ouie', label: 'Adaptations pour les personnes sourdes ou malentendantes' },
  { value: 'cognitif', label: 'Adaptations pour les personnes ayant un handicap cognitif, intellectuel ou psychique' },
  { value: 'humain', label: 'Accompagnement humain ou aide dans les déplacements' },
  { value: 'autre', label: 'Autre (à préciser)' },
]

export const HANDICAP_CONCERN: Labeled<HandicapConcern>[] = [
  { value: 'oui', label: 'Oui' },
  { value: 'non', label: 'Non' },
]

export const LIFE_CHOICES: Labeled<LifeChoiceId>[] = [
  { value: 'residence', label: 'Autre lieu de résidence' },
  { value: 'emploi', label: 'Autre emploi ou lieu d’études' },
  { value: 'activite', label: 'Activité sportive, culturelle ou associative ailleurs' },
  { value: 'achats', label: 'Achats, démarches ailleurs' },
  { value: 'non', label: 'Non, cela ne changerait pas mes choix' },
]

export const MODE_REASONS: Labeled<ModeReasonId>[] = [
  { value: 'environnement', label: 'Avoir un impact plus faible sur l’environnement' },
  { value: 'depenses', label: 'Réduire les dépenses (carburant, entretien, stationnement…)' },
  { value: 'stress', label: 'Éviter le stress de la conduite' },
  { value: 'bouchons', label: 'Éviter les embouteillages' },
  { value: 'accident', label: 'Réduire les risques d’accident' },
  { value: 'permis', label: 'Éviter les risques de perte de points ou de permis' },
  { value: 'souci', label: 'Ne pas avoir le souci de devoir conduire (restaurant, soirée, événement…)' },
  { value: 'stationnement', label: 'Ne pas chercher de place de stationnement' },
  { value: 'repos', label: 'Pouvoir se reposer, lire ou faire autre chose pendant le trajet' },
  { value: 'dependance', label: 'Être moins dépendant de la disponibilité d’un véhicule' },
  { value: 'sante', label: 'Ne pas conduire (santé, âge, difficultés à conduire)' },
  { value: 'autre', label: 'Autre raison (préciser dans le champ ci-dessous)' },
  { value: 'aucune', label: 'Je ne changerais pas de mode de transport' },
]

export const MODE_CONDITIONS: Labeled<ModeConditionId>[] = [
  { value: 'court', label: 'Un temps plus court qu’en voiture' },
  { value: 'identique', label: 'Un temps de trajet identique à celui en voiture' },
  { value: 'min15', label: 'Jusqu’à 15 minutes supplémentaires' },
  { value: 'min30', label: 'Jusqu’à 30 minutes supplémentaires' },
  { value: 'min45', label: 'Jusqu’à 45 minutes supplémentaires' },
  { value: 'long', label: 'Même avec un trajet nettement plus long, si cela m’évite de conduire' },
  { value: 'inferieur', label: 'Un tarif inférieur au coût de la voiture (carburant, stationnement…)' },
  { value: 'equivalent', label: 'Un tarif équivalent au coût de la voiture' },
  { value: 'superieur', label: 'Un tarif légèrement supérieur, si le service est plus pratique' },
  { value: 'abonnement', label: 'Un abonnement avantageux permettant plusieurs déplacements' },
  { value: 'arret', label: 'Un arrêt facilement accessible depuis mon domicile et ma destination' },
  { value: 'horaires', label: 'Des horaires adaptés à mes besoins' },
  { value: 'frequence', label: 'Des passages suffisamment fréquents' },
  { value: 'correspondances', label: 'Peu ou pas de correspondances' },
  { value: 'fiabilite', label: 'Une bonne fiabilité (ponctualité, maintien des trajets…)' },
  { value: 'bagages', label: 'La possibilité de transporter des bagages, des courses ou du matériel' },
  { value: 'enfants', label: 'La possibilité de voyager avec des enfants, une poussette ou des personnes à charge' },
  { value: 'autre', label: 'Autres conditions (à préciser)' },
  { value: 'aucune', label: 'Aucune condition ne me permettrait de remplacer ces trajets en voiture' },
]

export const MODE_CONDITION_GROUPS: { title: string; ids: ModeConditionId[] }[] = [
  { title: 'Durée du trajet', ids: ['court', 'identique', 'min15', 'min30', 'min45', 'long'] },
  { title: 'Coût', ids: ['inferieur', 'equivalent', 'superieur', 'abonnement'] },
  { title: 'Conditions pratiques', ids: ['arret', 'horaires', 'frequence', 'correspondances', 'fiabilite', 'bagages', 'enfants'] },
]

export const MODE_BARRIERS: Labeled<ModeBarrierId>[] = [
  { value: 'horaires', label: 'Horaires inadaptés à mes besoins ou à mes horaires de travail' },
  { value: 'flexibilite', label: 'Manque de flexibilité (horaires variables, imprévus, changements de programme…)' },
  { value: 'marche', label: 'Nécessité de marcher ou de pédaler pour rejoindre un arrêt, notamment par mauvais temps' },
  { value: 'duree', label: 'Temps de trajet trop long par rapport à la voiture' },
  { value: 'correspondances', label: 'Correspondances trop nombreuses ou temps d’attente trop importants' },
  { value: 'frequence', label: 'Manque de fréquence des passages ou absence de transports en soirée, le week-end ou pendant les vacances' },
  { value: 'cout', label: 'Coût des billets ou des abonnements' },
  { value: 'bagages', label: 'Difficulté de transporter des courses, des bagages ou du matériel' },
  { value: 'enfants', label: 'Contraintes liées aux enfants, à une poussette ou à l’accompagnement de proches' },
  { value: 'confort', label: 'Manque de confort' },
  { value: 'securite', label: 'Manque de sécurité' },
  { value: 'fiabilite', label: 'Manque de fiabilité (retards, annulation…)' },
  { value: 'sante', label: 'Difficultés liées à mon âge, ma santé ou un handicap' },
  { value: 'reservation', label: 'Fait de devoir réserver à l’avance (si c’est le cas)' },
  { value: 'habitudes', label: 'Changement des habitudes' },
  { value: 'autre', label: 'Autre raison (à préciser)' },
  { value: 'aucun', label: 'Aucun frein particulier' },
]

export const WALK_DISTANCES: Labeled<WalkDistanceId>[] = [
  { value: 'm200', label: 'Moins de 200 mètres' },
  { value: 'm500', label: 'Entre 200 et 500 mètres' },
  { value: 'km1', label: 'Entre 500 mètres et 1 kilomètre' },
  { value: 'km2', label: 'Entre 1 et 2 kilomètres' },
  { value: 'plus', label: 'Plus de 2 kilomètres' },
  { value: 'meteo', label: 'Cela dépend de la météo, du relief ou de la qualité du cheminement' },
  { value: 'frequence', label: 'Cela dépend de la fréquence et des horaires du transport' },
  { value: 'jamais', label: 'Je ne prendrais pas les transports en commun' },
  { value: 'autre', label: 'Autre (à préciser)' },
]

export type LifeChoices = {
  selected: LifeChoiceId[]
  people: Partial<Record<LifeChoiceDetail, number[]>>
  notes: Partial<Record<LifeChoiceDetail, string>>
}

export type ModeReasons = {
  selected: ModeReasonId[]
  note: string
}

export type ModeConditions = {
  selected: ModeConditionId[]
  note: string
}

export type ModeBarriers = {
  selected: ModeBarrierId[]
  note: string
}

export type WalkNearby = 'oui' | 'non'

export type WalkDistance = {
  choice: WalkDistanceId | ''
  note: string
  /** Un arrêt satisfaisant existe déjà près du domicile. */
  nearby: WalkNearby | ''
  latitude: number | null
  longitude: number | null
}

export function emptyModeReasons(): ModeReasons {
  return { selected: [], note: '' }
}

export function sanitizeModeReasons(input: unknown): ModeReasons {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const asked = Array.isArray(source.selected) ? source.selected : []
  const selected = MODE_REASONS.map((reason) => reason.value).filter((id) => asked.includes(id))
  const note = typeof source.note === 'string' ? clip(source.note, 160) : ''
  if (selected.includes('aucune')) return { selected: ['aucune'], note }
  return { selected, note }
}

export function toggleModeReason(current: ModeReasons, id: ModeReasonId): ModeReasons {
  const none = current.selected.includes('aucune')
  const some = current.selected.some((item) => item !== 'aucune')
  const selected = current.selected.includes(id)
  if (!selected && ((id === 'aucune' && some) || (id !== 'aucune' && none))) return current
  if (id === 'aucune') return sanitizeModeReasons({ selected: selected ? [] : ['aucune'], note: current.note })
  const next = selected ? current.selected.filter((item) => item !== id) : [...current.selected, id]
  return sanitizeModeReasons({ selected: next, note: current.note })
}

export function setModeNote(current: ModeReasons, note: string): ModeReasons {
  return sanitizeModeReasons({ ...current, note })
}

export function issueForModeReasons(value: ModeReasons): string | null {
  if (!value.selected.length) return 'Choisissez au moins une raison.'
  return null
}

export function modeReasonsLine(value: ModeReasons): string {
  const labels = value.selected.map((id) => labelOf(MODE_REASONS, id)).filter(Boolean)
  const note = value.note.trim()
  if (note) labels.push(note)
  return labels.join(' · ')
}

export function emptyModeConditions(): ModeConditions {
  return { selected: [], note: '' }
}

export function sanitizeModeConditions(input: unknown): ModeConditions {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const asked = Array.isArray(source.selected) ? source.selected : []
  const selected = MODE_CONDITIONS.map((condition) => condition.value).filter((id) => asked.includes(id))
  const note = typeof source.note === 'string' ? clip(source.note, 160) : ''
  if (selected.includes('aucune')) return { selected: ['aucune'], note }
  return { selected, note }
}

export function toggleModeCondition(current: ModeConditions, id: ModeConditionId): ModeConditions {
  const none = current.selected.includes('aucune')
  const some = current.selected.some((item) => item !== 'aucune')
  const selected = current.selected.includes(id)
  if (!selected && ((id === 'aucune' && some) || (id !== 'aucune' && none))) return current
  if (id === 'aucune') return sanitizeModeConditions({ selected: selected ? [] : ['aucune'], note: current.note })
  const next = selected ? current.selected.filter((item) => item !== id) : [...current.selected, id]
  return sanitizeModeConditions({ selected: next, note: current.note })
}

export function setModeConditionNote(current: ModeConditions, note: string): ModeConditions {
  return sanitizeModeConditions({ ...current, note })
}

export function issueForModeConditions(value: ModeConditions): string | null {
  if (!value.selected.length) return 'Choisissez au moins une condition.'
  return null
}

export function modeConditionsLine(value: ModeConditions): string {
  const labels = value.selected.map((id) => labelOf(MODE_CONDITIONS, id)).filter(Boolean)
  const note = value.note.trim()
  if (note) labels.push(note)
  return labels.join(' · ')
}

export function emptyModeBarriers(): ModeBarriers {
  return { selected: [], note: '' }
}

export function sanitizeModeBarriers(input: unknown): ModeBarriers {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const asked = Array.isArray(source.selected) ? source.selected : []
  const selected = MODE_BARRIERS.map((barrier) => barrier.value).filter((id) => asked.includes(id))
  const note = typeof source.note === 'string' ? clip(source.note, 160) : ''
  if (selected.includes('aucun')) return { selected: ['aucun'], note }
  return { selected, note }
}

export function toggleModeBarrier(current: ModeBarriers, id: ModeBarrierId): ModeBarriers {
  const none = current.selected.includes('aucun')
  const some = current.selected.some((item) => item !== 'aucun')
  const selected = current.selected.includes(id)
  if (!selected && ((id === 'aucun' && some) || (id !== 'aucun' && none))) return current
  if (id === 'aucun') return sanitizeModeBarriers({ selected: selected ? [] : ['aucun'], note: current.note })
  const next = selected ? current.selected.filter((item) => item !== id) : [...current.selected, id]
  return sanitizeModeBarriers({ selected: next, note: current.note })
}

export function setModeBarrierNote(current: ModeBarriers, note: string): ModeBarriers {
  return sanitizeModeBarriers({ ...current, note })
}

export function issueForModeBarriers(value: ModeBarriers): string | null {
  if (!value.selected.length) return 'Choisissez au moins un frein.'
  return null
}

export function modeBarriersLine(value: ModeBarriers): string {
  const labels = value.selected.map((id) => labelOf(MODE_BARRIERS, id)).filter(Boolean)
  const note = value.note.trim()
  if (note) labels.push(note)
  return labels.join(' · ')
}

export function emptyWalkDistance(): WalkDistance {
  return { choice: '', note: '', nearby: '', latitude: null, longitude: null }
}

export function sanitizeWalkDistance(input: unknown): WalkDistance {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const note = typeof source.note === 'string' ? clip(source.note, 160) : ''
  const nearby = source.nearby === 'oui' || source.nearby === 'non' ? source.nearby : ''
  const latitude = nearby ? axis(source.latitude, 90) : null
  const longitude = nearby ? axis(source.longitude, 180) : null
  const placed = latitude !== null && longitude !== null
  return {
    choice: known(WALK_DISTANCES, source.choice),
    note,
    nearby,
    latitude: placed ? latitude : null,
    longitude: placed ? longitude : null,
  }
}

export function setWalkDistance(current: WalkDistance, id: WalkDistanceId): WalkDistance {
  return sanitizeWalkDistance({ ...current, choice: current.choice === id ? '' : id })
}

export function setWalkNote(current: WalkDistance, note: string): WalkDistance {
  return sanitizeWalkDistance({ ...current, note })
}

export function setWalkNearby(current: WalkDistance, nearby: WalkNearby): WalkDistance {
  const next = current.nearby === nearby ? '' : nearby
  if (next === current.nearby) return current
  return sanitizeWalkDistance({ ...current, nearby: next, latitude: null, longitude: null })
}

export function setWalkPoint(current: WalkDistance, latitude: number, longitude: number): WalkDistance {
  if (!current.nearby) return current
  return sanitizeWalkDistance({ ...current, latitude, longitude })
}

export function issueForWalkDistance(value: WalkDistance): string | null {
  if (!value.choice) return 'Choisissez une distance.'
  if (!value.nearby) return 'Indiquez s’il existe déjà un arrêt satisfaisant.'
  if (value.latitude === null || value.longitude === null) return 'Indiquez l’arrêt sur la carte.'
  return null
}

export function walkDistanceLine(value: WalkDistance): string {
  const label = labelOf(WALK_DISTANCES, value.choice)
  const note = value.note.trim()
  const place = value.nearby === 'oui' ? 'Arrêt existant' : value.nearby === 'non' ? 'Arrêt souhaité' : ''
  const coords =
    value.latitude !== null && value.longitude !== null ? `${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}` : ''
  return [label, note, place, coords].filter(Boolean).join(' · ')
}

function axis(value: unknown, limit: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < -limit || value > limit) return null
  return value
}

export function emptyLifeChoices(): LifeChoices {
  return { selected: [], people: {}, notes: {} }
}

export const HANDICAP_WHO: Labeled<HandicapWho>[] = [
  { value: 'moi', label: 'moi personnellement' },
  { value: 'foyer', label: 'une ou plusieurs personnes de mon foyer' },
  { value: 'proche', label: 'un proche extérieur à mon foyer' },
]

export type Answers = {
  civilite: Civility | ''
  nom: string
  prenom: string
  commune: string
  adresse: string
  complement: string
  people: Person[]
  cars: Vehicle[]
  twoWheelers: Vehicle[]
  motives: Motives
  journeys: Journey[]
  /** Difficultés relevées une fois pour l’ensemble des trajets déjà faits. */
  difficulties: JourneyDifficulties
  recontact: Recontact | ''
  /** Phrase affichée sur la case au moment où elle a été cochée. Vide sinon. */
  recontactText: string
  collectif: boolean
  /** Phrase affichée sur la case au moment où elle a été cochée. Vide sinon. */
  collectifText: string
  email: string
  phone: string
  /** La personne souhaite devenir enquêteur. */
  enqueteur: Recontact | ''
  /** Visites notées, de la plus ancienne à la plus récente. */
  visits: Visit[]
  /** Choix en cours, encore non validé. */
  visitPick: VisitOutcome | ''
  /** Accord pour répondre, en UTC. */
  startedAt: string
  /** Enregistrement de la fin de l’enquête, en UTC. */
  finishedAt: string
  /** Choix de vie qu’une offre de transport pourrait changer, par personne. */
  lifeChoices: LifeChoices
  /** Raisons d’envisager un autre mode de transport. */
  modeReasons: ModeReasons
  /** Conditions pour remplacer des trajets en voiture. */
  modeConditions: ModeConditions
  /** Ce qui freinerait l’usage des transports en commun. */
  modeBarriers: ModeBarriers
  /** Distance acceptée à pied jusqu’à un arrêt. */
  walkDistance: WalkDistance
  /** Aménagements pour les situations de handicap. */
  handicap: HandicapAnswer | ''
  handicapTypes: HandicapAdaptation[]
  handicapAutre: string
  /** Ce besoin concerne la personne ou un proche. */
  handicapConcern: HandicapConcern | ''
  handicapWho: HandicapWho[]
  handicapComment: string
  /** Remarque libre, juste avant la relecture. */
  closingNote: string
}

type Labeled<T extends string> = { value: T; label: string }

export const AGE_BANDS: Labeled<AgeBand>[] = [
  { value: '0-14', label: '0–14 ans' },
  { value: '15-17', label: '15–17 ans' },
  { value: '18-24', label: '18–24 ans' },
  { value: '25-39', label: '25–39 ans' },
  { value: '40-64', label: '40–64 ans' },
  { value: '65+', label: '65 ans et plus' },
]

export const DRIVE_OPTIONS: Labeled<Drive>[] = [
  { value: 'non', label: 'Ne conduit pas' },
  { value: 'accompagnee', label: 'Conduite accompagnée' },
  { value: 'oui', label: 'Conduit' },
]

export const MOTOR_OPTIONS: Labeled<Motor>[] = [
  { value: 'electrique', label: '100 % électrique' },
  { value: 'hybride', label: 'Hybride' },
  { value: 'thermique', label: 'Thermique' },
]

export type Step =
  | { kind: 'name' }
  | { kind: 'commune' }
  | { kind: 'address' }
  | { kind: 'visit' }
  | { kind: 'consent' }
  | { kind: 'household' }
  | { kind: 'vehicles' }
  | { kind: 'motives' }
  | { kind: 'reminders' }
  | { kind: 'difficulties' }
  | { kind: 'offers' }
  | { kind: 'reasons' }
  | { kind: 'conditions' }
  | { kind: 'barriers' }
  | { kind: 'walk' }
  | { kind: 'life' }
  | { kind: 'handicap' }
  | { kind: 'contact' }
  | { kind: 'closing' }
  | { kind: 'review' }

export function emptyPerson(): Person {
  return { age: '', drive: '', manqueAutonomie: false, electoral: '', electoralCommune: '' }
}

/** 18 ans ou plus : l’inscription électorale est demandée. */
export function asksElectoral(person: Pick<Person, 'age'>): boolean {
  return person.age === '18-24' || person.age === '25-39' || person.age === '40-64' || person.age === '65+'
}

/** 15 ans ou plus, et ne conduit pas. */
export function asksAutonomie(person: Pick<Person, 'age' | 'drive'>): boolean {
  return person.drive === 'non' && person.age !== '' && person.age !== '0-14'
}

export function emptyVehicle(): Vehicle {
  return { motor: '', sansPermis: false }
}

export function emptyAnswers(): Answers {
  return {
    civilite: '',
    nom: '',
    prenom: '',
    commune: '',
    adresse: '',
    complement: '',
    people: [emptyPerson()],
    cars: [],
    twoWheelers: [],
    motives: emptyMotives(1),
    journeys: defaultJourneys(),
    difficulties: emptyDifficulties(),
    recontact: '',
    recontactText: '',
    collectif: false,
    collectifText: '',
    email: '',
    phone: '',
    enqueteur: '',
    visits: [],
    visitPick: '',
    startedAt: '',
    finishedAt: '',
    lifeChoices: emptyLifeChoices(),
    modeReasons: emptyModeReasons(),
    modeConditions: emptyModeConditions(),
    modeBarriers: emptyModeBarriers(),
    walkDistance: emptyWalkDistance(),
    handicap: '',
    handicapTypes: [],
    handicapAutre: '',
    handicapConcern: '',
    handicapWho: [],
    handicapComment: '',
    closingNote: '',
  }
}

export function buildSteps(_answers: Answers): Step[] {
  return [
    { kind: 'name' },
    { kind: 'commune' },
    { kind: 'address' },
    { kind: 'visit' },
    { kind: 'consent' },
    { kind: 'household' },
    { kind: 'vehicles' },
    { kind: 'motives' },
    { kind: 'reminders' },
    { kind: 'difficulties' },
    { kind: 'offers' },
    { kind: 'reasons' },
    { kind: 'conditions' },
    { kind: 'barriers' },
    { kind: 'walk' },
    { kind: 'life' },
    { kind: 'handicap' },
    { kind: 'contact' },
    { kind: 'closing' },
    { kind: 'review' },
  ]
}

/** Vide si le champ est vide. Null seulement quand le texte ne contient aucun chiffre. */
export function respondentPhone(value: string): string | null {
  const text = value.trim().slice(0, 40)
  if (!text) return ''
  if (!/\d/.test(text)) return null
  return text
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase().slice(0, 120)
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function wantsEmail(answers: Answers): boolean {
  return answers.collectif || answers.enqueteur === 'oui'
}

function keepsPhone(answers: Pick<Answers, 'recontact' | 'enqueteur'>): boolean {
  return answers.recontact === 'oui' || answers.enqueteur === 'oui'
}

function clip(value: string, max: number): string {
  return value.slice(0, max)
}

function known<T extends string>(options: Labeled<T>[], value: unknown): T | '' {
  if (typeof value !== 'string') return ''
  return options.some((option) => option.value === value) ? (value as T) : ''
}

function labelOf<T extends string>(options: Labeled<T>[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? ''
}

export function sanitizeAnswers(input: unknown): Answers {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const people = sanitizePeople(source.people)
  const cars = sanitizeVehicles(source.cars)
  const twoWheelers = sanitizeVehicles(source.twoWheelers)
  const recontact = source.recontact === 'oui' || source.recontact === 'non' ? source.recontact : ''
  const collectif = source.collectif === true
  const enqueteur = source.enqueteur === 'oui' || source.enqueteur === 'non' ? source.enqueteur : ''
  const email = typeof source.email === 'string' ? normalizeEmail(source.email) : ''
  const journeys = sanitizeJourneys(source.journeys, people.length || 1, cars, twoWheelers)
  return {
    civilite: known(CIVILITY, source.civilite),
    nom: text(source.nom, 80),
    prenom: text(source.prenom, 80),
    commune: text(source.commune, 120),
    adresse: text(source.adresse, 160),
    complement: text(source.complement, 160),
    people: people.length ? people : [emptyPerson()],
    cars,
    twoWheelers,
    motives: sanitizeMotives(source.motives, people.length || 1, cars.length, twoWheelers.length),
    journeys,
    difficulties: sanitizeDifficulties(
      source.difficulties,
      journeys.filter((journey) => journey.kind === 'actuel' && journeyTouched(journey)).map((journey) => journey.id),
    ),
    recontact,
    recontactText: recontact === 'oui' ? text(source.recontactText, 400) : '',
    collectif,
    collectifText: collectif ? text(source.collectifText, 400) : '',
    email: collectif || enqueteur === 'oui' ? email : '',
    phone: recontact === 'oui' || enqueteur === 'oui' ? text(source.phone, 40) : '',
    enqueteur,
    visits: sanitizeVisits(source.visits),
    visitPick: known(VISITS, source.visitPick),
    startedAt: instant(source.startedAt),
    finishedAt: instant(source.finishedAt),
    lifeChoices: sanitizeLifeChoices(source.lifeChoices, people.length || 1),
    modeReasons: sanitizeModeReasons(source.modeReasons),
    modeConditions: sanitizeModeConditions(source.modeConditions),
    modeBarriers: sanitizeModeBarriers(source.modeBarriers),
    walkDistance: sanitizeWalkDistance(source.walkDistance),
    closingNote: typeof source.closingNote === 'string' ? clip(source.closingNote, 2000) : '',
    ...handicapFields(source),
  }
}

function handicapFields(
  source: Record<string, unknown>,
): Pick<Answers, 'handicap' | 'handicapTypes' | 'handicapAutre' | 'handicapConcern' | 'handicapWho' | 'handicapComment'> {
  const handicapComment = text(source.handicapComment, 400)
  const handicap = known(HANDICAP_ANSWERS, source.handicap)
  if (handicap !== 'oui') {
    return { handicap, handicapTypes: [], handicapAutre: '', handicapConcern: '', handicapWho: [], handicapComment }
  }
  const handicapTypes = selected(HANDICAP_ADAPTATIONS, source.handicapTypes)
  const typesReady = handicapTypes.length > 0 && (!handicapTypes.includes('autre') || Boolean(text(source.handicapAutre, 160).trim()))
  const handicapConcern = typesReady ? known(HANDICAP_CONCERN, source.handicapConcern) : ''
  return {
    handicap,
    handicapTypes,
    handicapAutre: handicapTypes.includes('autre') ? text(source.handicapAutre, 160) : '',
    handicapConcern,
    handicapWho: handicapConcern === 'oui' ? selected(HANDICAP_WHO, source.handicapWho) : [],
    handicapComment,
  }
}

function selected<T extends string>(options: Labeled<T>[], input: unknown): T[] {
  if (!Array.isArray(input)) return []
  const allowed = new Set<string>(options.map((option) => option.value))
  const chosen = new Set(input.filter((item): item is T => typeof item === 'string' && allowed.has(item)))
  return options.map((option) => option.value).filter((value) => chosen.has(value))
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? clip(value.trim(), max) : ''
}

const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/
const MAX_VISITS = 30

function instant(value: unknown): string {
  return typeof value === 'string' && INSTANT.test(value) ? value : ''
}

function sanitizeVisits(input: unknown): Visit[] {
  if (!Array.isArray(input)) return []
  const visits: Visit[] = []
  for (const item of input) {
    if (visits.length >= MAX_VISITS) break
    const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const outcome = known(VISITS, source.outcome)
    const at = instant(source.at)
    if (outcome && at) visits.push({ outcome, at })
  }
  return visits
}

export function visitLabel(outcome: VisitOutcome): string {
  return labelOf(VISITS, outcome)
}

export function visitStarts(outcome: VisitOutcome): boolean {
  return VISITS.find((item) => item.value === outcome)?.starts === true
}

export function appendVisit(visits: Visit[], outcome: VisitOutcome, at: string): Visit[] {
  return sanitizeVisits([...visits, { outcome, at }])
}

export function formatVisits(visits: Visit[]): string {
  return visits.map((visit) => `${visit.at} — ${visitLabel(visit.outcome)}`).join('\n')
}

function sanitizePeople(input: unknown): Person[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, MAX_PEOPLE).map((item) => {
    const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const age = known(AGE_BANDS, source.age)
    const drive = age === '0-14' ? '' : known(DRIVE_OPTIONS, source.drive)
    const electoral = asksElectoral({ age }) && (source.electoral === 'oui' || source.electoral === 'non') ? source.electoral : ''
    return {
      age,
      drive,
      manqueAutonomie: asksAutonomie({ age, drive }) && source.manqueAutonomie === true,
      electoral,
      electoralCommune: electoral === 'oui' ? text(source.electoralCommune, 120) : '',
    }
  })
}

function sanitizeVehicles(input: unknown): Vehicle[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, MAX_VEHICLES).map((item) => {
    const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    return { motor: known(MOTOR_OPTIONS, source.motor), sansPermis: source.sansPermis === true }
  })
}

const editableText = {
  nom: 80,
  prenom: 80,
  adresse: 160,
  complement: 160,
  phone: 40,
  handicapAutre: 160,
  handicapComment: 400,
  closingNote: 2000,
} as const

export function patchAnswers(answers: Answers, patch: Partial<Answers>): Answers {
  const next = sanitizeAnswers({
    ...answers,
    ...patch,
    people: patch.people ?? answers.people,
    cars: patch.cars ?? answers.cars,
    twoWheelers: patch.twoWheelers ?? answers.twoWheelers,
  })
  // L’espace en fin de saisie doit rester, sinon « 11 rue » ne peut pas s’écrire.
  for (const key of Object.keys(editableText) as (keyof typeof editableText)[]) {
    const value = patch[key]
    if (typeof value === 'string') next[key] = clip(value, editableText[key])
  }
  if (!keepsPhone(next)) next.phone = ''
  if (!wantsEmail(next)) next.email = ''
  return next
}

export function addPerson(people: Person[]): Person[] {
  if (people.length >= MAX_PEOPLE) return people
  return [...people, emptyPerson()]
}

export function removePerson(people: Person[], index: number): Person[] {
  const next = people.filter((_, item) => item !== index)
  return next.length ? next : [emptyPerson()]
}

export function changePerson(people: Person[], index: number, patch: Partial<Person>): Person[] {
  return people.map((person, item) => (item === index ? { ...person, ...patch } : person))
}

export function addVehicle(vehicles: Vehicle[]): Vehicle[] {
  if (vehicles.length >= MAX_VEHICLES) return vehicles
  return [...vehicles, emptyVehicle()]
}

export function removeVehicle(vehicles: Vehicle[], index: number): Vehicle[] {
  return vehicles.filter((_, item) => item !== index)
}

export function changeVehicle(vehicles: Vehicle[], index: number, patch: Partial<Vehicle>): Vehicle[] {
  return vehicles.map((vehicle, item) => (item === index ? { ...vehicle, ...patch } : vehicle))
}

/** « de » si le foyer est à Pontarlier, « vers » s’il habite une autre commune. */
export function questionSide(commune: string): 'de' | 'vers' {
  return fold(commune) === fold(PONTARLIER) ? 'de' : 'vers'
}

export function issueForCommune(answers: Answers): string | null {
  const commune = answers.commune.trim()
  if (!commune || fold(commune) === fold(DOMICILE)) return 'Choisissez une commune dans la liste.'
  if (frenchCommunityFor(commune) || swissSectorFor(commune)) return null
  return 'Cette commune n’est pas dans la liste.'
}

export function issueForHousehold(answers: Answers): string | null {
  if (!answers.people.length) return 'Ajoutez au moins une personne.'
  if (answers.people.some((person) => !person.age || (person.age !== '0-14' && !person.drive))) {
    return 'Indiquez l’âge et la conduite de chaque personne.'
  }
  if (answers.people.some((person) => asksElectoral(person) && !person.electoral)) {
    return 'Indiquez si chaque personne de 18 ans ou plus est inscrite sur les listes électorales.'
  }
  for (const person of answers.people) {
    if (person.electoral !== 'oui') continue
    const commune = person.electoralCommune.trim()
    if (!commune) return 'Indiquez la commune d’inscription sur les listes électorales.'
    if (!electoralCommuneOk(commune, answers.commune)) return 'Cette commune n’est pas dans la liste.'
  }
  return null
}

function electoralCommuneOk(commune: string, home: string): boolean {
  if (fold(commune) === fold(DOMICILE)) return false
  if (home.trim() && fold(commune) === fold(home)) return true
  return Boolean(frenchCommunityFor(commune))
}

export function issueForVehicles(answers: Answers): string | null {
  const vehicles = [...answers.cars, ...answers.twoWheelers]
  if (vehicles.some((vehicle) => !vehicle.motor)) return 'Indiquez la motorisation de chaque véhicule.'
  return null
}

export function issueForContact(answers: Answers): string | null {
  if (!answers.enqueteur) return 'Indiquez si la personne souhaite devenir enquêteur.'
  const phone = respondentPhone(answers.phone)
  const email = answers.email.trim()
  if (answers.recontact === 'oui') {
    if (!phone) return phone === null ? 'Ce numéro ne contient aucun chiffre.' : 'Indiquez un numéro de téléphone.'
  } else if (phone === null) {
    return 'Ce numéro ne contient aucun chiffre.'
  }
  if (answers.collectif) {
    if (!isEmail(email)) return 'Indiquez une adresse mail.'
  } else if (email && !isEmail(email)) {
    return 'Indiquez une adresse mail.'
  }
  if (answers.enqueteur === 'oui' && answers.recontact !== 'oui' && !answers.collectif && !phone && !isEmail(email)) {
    return 'Indiquez un téléphone ou une adresse mail.'
  }
  return null
}

export function stepIssue(step: Step, answers: Answers): string | null {
  if (step.kind === 'visit') return answers.visitPick ? null : 'Choisissez ce qui s’est passé.'
  if (step.kind === 'commune') return issueForCommune(answers)
  if (step.kind === 'household') return issueForHousehold(answers)
  if (step.kind === 'vehicles') return issueForVehicles(answers)
  if (step.kind === 'contact') return issueForContact(answers)
  if (step.kind === 'motives') return actualJourneyIssue(answers.journeys, answers.people.length)
  if (step.kind === 'difficulties') return difficultiesIssue(answers.difficulties)
  if (step.kind === 'offers') return offerJourneyIssue(answers.journeys, answers.people.length)
  if (step.kind === 'reasons') return issueForModeReasons(answers.modeReasons)
  if (step.kind === 'conditions') return issueForModeConditions(answers.modeConditions)
  if (step.kind === 'barriers') return issueForModeBarriers(answers.modeBarriers)
  if (step.kind === 'walk') return issueForWalkDistance(answers.walkDistance)
  if (step.kind === 'life') return issueForLifeChoices(answers.lifeChoices)
  if (step.kind === 'handicap') return issueForHandicap(answers)
  return null
}

export function sanitizeLifeChoices(input: unknown, peopleCount: number): LifeChoices {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const asked = Array.isArray(source.selected) ? source.selected : []
  const selected = LIFE_CHOICES.map((choice) => choice.value).filter((id) => asked.includes(id))
  if (selected.includes('non')) return { selected: ['non'], people: {}, notes: {} }
  const peopleIn = source.people && typeof source.people === 'object' ? (source.people as Record<string, unknown>) : {}
  const notesIn = source.notes && typeof source.notes === 'object' ? (source.notes as Record<string, unknown>) : {}
  const people: LifeChoices['people'] = {}
  const notes: LifeChoices['notes'] = {}
  for (const id of selected) {
    if (id === 'non') continue
    const indexes = personIndexes(peopleIn[id], peopleCount)
    if (indexes.length) people[id] = indexes
    const note = typeof notesIn[id] === 'string' ? clip(notesIn[id], 160) : ''
    if (note) notes[id] = note
  }
  return { selected, people, notes }
}

export function toggleLifeChoice(current: LifeChoices, id: LifeChoiceId): LifeChoices {
  const none = current.selected.includes('non')
  const some = current.selected.some((item) => item !== 'non')
  const selected = current.selected.includes(id)
  if (!selected && ((id === 'non' && some) || (id !== 'non' && none))) return current
  if (id === 'non') return selected ? emptyLifeChoices() : { selected: ['non'], people: {}, notes: {} }
  const next = selected ? current.selected.filter((item) => item !== id) : [...current.selected, id]
  return sanitizeLifeChoices({ ...current, selected: next }, MAX_PEOPLE)
}

export function toggleLifePerson(current: LifeChoices, id: LifeChoiceDetail, index: number): LifeChoices {
  if (!current.selected.includes(id)) return current
  const list = current.people[id] ?? []
  const people = list.includes(index) ? list.filter((item) => item !== index) : [...list, index]
  return sanitizeLifeChoices({ ...current, people: { ...current.people, [id]: people } }, MAX_PEOPLE)
}

export function setLifeNote(current: LifeChoices, id: LifeChoiceDetail, note: string): LifeChoices {
  if (!current.selected.includes(id)) return current
  return sanitizeLifeChoices({ ...current, notes: { ...current.notes, [id]: note } }, MAX_PEOPLE)
}

export function issueForLifeChoices(value: LifeChoices): string | null {
  if (!value.selected.length) return 'Choisissez ce qui pourrait changer.'
  if (value.selected.includes('non')) return null
  if (value.selected.some((id) => id !== 'non' && !(value.people[id]?.length))) return 'Indiquez les personnes concernées.'
  return null
}

export function lifeChoicesLine(value: LifeChoices): string {
  if (value.selected.includes('non')) return 'Non, cela ne changerait pas mes choix'
  return value.selected
    .map((id) => {
      const label = labelOf(LIFE_CHOICES, id)
      const note = id === 'non' ? '' : value.notes[id]?.trim() ?? ''
      return note ? `${label} : ${note}` : label
    })
    .filter(Boolean)
    .join(' · ')
}

function personIndexes(input: unknown, peopleCount: number): number[] {
  if (!Array.isArray(input)) return []
  const chosen = new Set<number>()
  for (const item of input) {
    const index = typeof item === 'number' ? item : Number(item)
    if (Number.isInteger(index) && index >= 0 && index < peopleCount) chosen.add(index)
  }
  return [...chosen].sort((left, right) => left - right)
}

export function issueForHandicap(answers: Answers): string | null {
  if (!answers.handicap) return 'Choisissez oui, non ou ne sait pas.'
  if (answers.handicap !== 'oui') return null
  if (!answers.handicapTypes.length) return 'Choisissez au moins une adaptation.'
  if (answers.handicapTypes.includes('autre') && !answers.handicapAutre.trim()) return 'Précisez l’autre adaptation.'
  if (!answers.handicapConcern) return 'Indiquez si ce besoin vous concerne.'
  if (answers.handicapConcern === 'oui' && !answers.handicapWho.length) return 'Indiquez qui est concerné.'
  return null
}

export function handicapSheet(answers: Answers): { handicap: string; adaptations: string; qui: string } {
  const handicap = labelOf(HANDICAP_ANSWERS, answers.handicap)
  if (answers.handicap !== 'oui') return { handicap, adaptations: '', qui: '' }
  const adaptations = answers.handicapTypes.map((value) => {
    if (value !== 'autre') return labelOf(HANDICAP_ADAPTATIONS, value)
    const detail = answers.handicapAutre.trim()
    return detail ? `Autre : ${detail}` : 'Autre'
  })
  return {
    handicap,
    adaptations: adaptations.filter(Boolean).join(' · '),
    qui:
      answers.handicapConcern === 'non'
        ? 'Non'
        : answers.handicapWho.map((value) => labelOf(HANDICAP_WHO, value)).filter(Boolean).join(' · '),
  }
}

export function personLine(person: Person): string {
  const age = labelOf(AGE_BANDS, person.age)
  if (person.age === '0-14') return age
  const drive = labelOf(DRIVE_OPTIONS, person.drive)
  if (!age || !drive) return ''
  const driving = `${drive.charAt(0).toLocaleLowerCase('fr')}${drive.slice(1)}`
  const parts = [age, driving]
  if (person.manqueAutonomie) parts.push('manque d’autonomie')
  if (person.electoral === 'oui' && person.electoralCommune.trim()) parts.push(`inscrit à ${person.electoralCommune.trim()}`)
  if (person.electoral === 'non') parts.push('non inscrit')
  return parts.join(', ')
}

export function vehicleLine(vehicle: Vehicle): string {
  const motor = labelOf(MOTOR_OPTIONS, vehicle.motor)
  if (!motor) return ''
  return vehicle.sansPermis ? `${motor}, sans permis` : motor
}

export function summary(input: Answers): { label: string; value: string }[] {
  const answers = sanitizeAnswers(input)
  const people = answers.people.map(personLine).filter(Boolean)
  const cars = answers.cars.map(vehicleLine).filter(Boolean)
  const twoWheelers = answers.twoWheelers.map(vehicleLine).filter(Boolean)
  const handicap = handicapSheet(answers)
  return [
    { label: 'Nom', value: personName(answers) },
    { label: 'Commune', value: answers.commune },
    { label: 'Adresse', value: [answers.adresse, answers.complement].filter(Boolean).join(', ') },
    { label: 'Foyer', value: people.join(' · ') },
    { label: 'Voitures', value: cars.length ? cars.join(' · ') : 'Aucune' },
    { label: '2/3 roues', value: twoWheelers.length ? twoWheelers.join(' · ') : 'Aucun' },
    { label: 'Motifs', value: motivesStarted(answers.motives) ? 'Gardés sur le téléphone' : '' },
    { label: 'Difficultés', value: difficultiesLine(answers.difficulties) },
    { label: 'Raisons de changer', value: modeReasonsLine(answers.modeReasons) },
    { label: 'Conditions', value: modeConditionsLine(answers.modeConditions) },
    { label: 'Freins', value: modeBarriersLine(answers.modeBarriers) },
    { label: 'Distance à l’arrêt', value: walkDistanceLine(answers.walkDistance) },
    { label: 'Choix de vie', value: lifeChoicesLine(answers.lifeChoices) },
    { label: 'Handicap', value: handicap.handicap },
    { label: 'Adaptations', value: handicap.adaptations },
    { label: 'Qui est concerné', value: handicap.qui },
    { label: 'Commentaires', value: answers.handicapComment },
    { label: 'Recontact', value: answers.recontact === 'oui' ? 'Oui' : 'Non' },
    { label: 'Collectif Mobilité Haut-Doubs', value: answers.collectif ? 'Oui' : 'Non' },
    { label: 'Visites', value: answers.visits.map((visit) => visitLabel(visit.outcome)).join(' · ') },
    { label: 'Devenir enquêteur', value: answers.enqueteur === 'oui' ? 'Oui' : answers.enqueteur === 'non' ? 'Non' : '' },
    { label: 'Adresse mail', value: answers.email },
    { label: 'Téléphone', value: answers.phone },
    { label: 'Ajout', value: answers.closingNote.trim() },
  ].filter((line) => line.value !== '')
}

/** Lieu à la rue et à la commune. Vide tant que l’une des deux manque. */
export function mapsDestination(answers: Pick<Answers, 'adresse' | 'commune'>, app: MapApp = 'google'): string | null {
  const street = answers.adresse.trim()
  const commune = answers.commune.trim()
  if (!street || !commune) return null
  const query = encodeURIComponent(`${street}, ${communePlace(commune)}`)
  if (app === 'apple') return `https://maps.apple.com/?q=${query}`
  if (app === 'osm') return `https://www.openstreetmap.org/search?query=${query}`
  if (app === 'mappy') return `https://fr.mappy.com/plan#/search/${query}`
  if (app === 'mapy') return `https://mapy.com/fnc/v1/search?query=${query}`
  if (app === 'waze') return `https://www.waze.com/ul?q=${query}`
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

function personName(answers: Answers): string {
  return [labelOf(CIVILITY, answers.civilite), answers.prenom, answers.nom].filter(Boolean).join(' ')
}

export function draftTitle(input: Answers): string {
  const answers = sanitizeAnswers(input)
  const name = personName(answers)
  if (name && answers.commune) return `${name} · ${answers.commune}`
  return name || answers.commune || 'Sans nom'
}

export function answerPreview(input: unknown): string {
  const answers = sanitizeAnswers(input)
  const commune = answers.commune.trim() || legacyPlace(input) || 'Commune non précisée'
  const count = answers.people.filter((person) => person.age && (person.age === '0-14' || person.drive)).length
  return count ? `${commune} · ${count} pers.` : commune
}

function legacyPlace(input: unknown): string {
  if (!input || typeof input !== 'object') return ''
  const habitation = (input as { habitation?: unknown }).habitation
  return typeof habitation === 'string' ? habitation.trim().slice(0, 120) : ''
}

export function hasAnyAnswer(input: Answers): boolean {
  const answers = sanitizeAnswers(input)
  return Boolean(
    answers.civilite ||
      answers.nom ||
      answers.prenom ||
      answers.commune ||
      answers.adresse ||
      answers.complement ||
      answers.people.some((person) => person.age || person.drive) ||
      answers.cars.length ||
      answers.twoWheelers.length ||
      motivesStarted(answers.motives) ||
      journeysStarted(answers.journeys) ||
      answers.difficulties.groups.length > 0 ||
      answers.lifeChoices.selected.length > 0 ||
      answers.modeReasons.selected.length > 0 ||
      answers.modeReasons.note.trim() !== '' ||
      answers.modeConditions.selected.length > 0 ||
      answers.modeConditions.note.trim() !== '' ||
      answers.modeBarriers.selected.length > 0 ||
      answers.modeBarriers.note.trim() !== '' ||
      answers.walkDistance.choice !== '' ||
      answers.walkDistance.note.trim() !== '' ||
      answers.walkDistance.nearby !== '' ||
      answers.walkDistance.latitude !== null ||
      answers.recontact !== '' ||
      answers.enqueteur !== '' ||
      answers.collectif ||
      answers.email !== '' ||
      answers.phone !== '' ||
      answers.visits.length > 0 ||
      answers.startedAt !== '' ||
      answers.handicap !== '' ||
      answers.handicapComment !== '' ||
      answers.closingNote.trim() !== '',
  )
}
