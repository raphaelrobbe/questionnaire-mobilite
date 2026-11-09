import { communesOnOffer, fold, PONTARLIER } from './config'
import { emptyMotives, motiveIssue, motivesStarted, sanitizeMotives, type Motives } from './motives'

export const MAX_PEOPLE = 12
export const MAX_VEHICLES = 8

export type AgeBand = '0-14' | '15-17' | '18-24' | '25-39' | '40-64' | '65+'
export type Drive = 'non' | 'accompagnee' | 'oui'
export type Motor = 'electrique' | 'hybride' | 'thermique'

export type Person = { age: AgeBand | ''; drive: Drive | ''; manqueAutonomie: boolean }
export type Vehicle = { motor: Motor | ''; sansPermis: boolean }

export type Recontact = 'oui' | 'non'

export type Answers = {
  nom: string
  prenom: string
  commune: string
  adresse: string
  complement: string
  people: Person[]
  cars: Vehicle[]
  twoWheelers: Vehicle[]
  motives: Motives
  recontact: Recontact | ''
  /** Phrase affichée sur la case au moment où elle a été cochée. Vide sinon. */
  recontactText: string
  collectif: boolean
  /** Phrase affichée sur la case au moment où elle a été cochée. Vide sinon. */
  collectifText: string
  email: string
  phone: string
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
  | { kind: 'consent' }
  | { kind: 'household' }
  | { kind: 'vehicles' }
  | { kind: 'motives' }
  | { kind: 'contact' }
  | { kind: 'review' }

export function emptyPerson(): Person {
  return { age: '', drive: '', manqueAutonomie: false }
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
    nom: '',
    prenom: '',
    commune: '',
    adresse: '',
    complement: '',
    people: [emptyPerson()],
    cars: [],
    twoWheelers: [],
    motives: emptyMotives(1),
    recontact: '',
    recontactText: '',
    collectif: false,
    collectifText: '',
    email: '',
    phone: '',
  }
}

export function buildSteps(_answers: Answers): Step[] {
  return [
    { kind: 'name' },
    { kind: 'commune' },
    { kind: 'address' },
    { kind: 'consent' },
    { kind: 'household' },
    { kind: 'vehicles' },
    { kind: 'motives' },
    { kind: 'contact' },
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
  return answers.collectif
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
  const email = typeof source.email === 'string' ? normalizeEmail(source.email) : ''
  return {
    nom: text(source.nom, 80),
    prenom: text(source.prenom, 80),
    commune: text(source.commune, 120),
    adresse: text(source.adresse, 160),
    complement: text(source.complement, 160),
    people: people.length ? people : [emptyPerson()],
    cars,
    twoWheelers,
    motives: sanitizeMotives(source.motives, people.length || 1, cars.length, twoWheelers.length),
    recontact,
    recontactText: recontact === 'oui' ? text(source.recontactText, 400) : '',
    collectif,
    collectifText: collectif ? text(source.collectifText, 400) : '',
    email: collectif ? email : '',
    phone: recontact === 'oui' ? text(source.phone, 40) : '',
  }
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? clip(value.trim(), max) : ''
}

function sanitizePeople(input: unknown): Person[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, MAX_PEOPLE).map((item) => {
    const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const age = known(AGE_BANDS, source.age)
    const drive = known(DRIVE_OPTIONS, source.drive)
    return { age, drive, manqueAutonomie: asksAutonomie({ age, drive }) && source.manqueAutonomie === true }
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
  if (next.recontact !== 'oui') next.phone = ''
  if (!next.collectif) next.email = ''
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

export function issueForCommune(answers: Answers, communes: string[]): string | null {
  if (!answers.commune) {
    if (!communes.length) return 'La liste des communes n’est pas sur cet appareil.'
    return 'Choisissez une commune dans la liste.'
  }
  if (!communesOnOffer(communes).includes(answers.commune)) return 'Cette commune n’est pas dans la liste.'
  return null
}

export function issueForHousehold(answers: Answers): string | null {
  if (!answers.people.length) return 'Ajoutez au moins une personne.'
  if (answers.people.some((person) => !person.age || !person.drive)) {
    return 'Indiquez l’âge et la conduite de chaque personne.'
  }
  return null
}

export function issueForVehicles(answers: Answers): string | null {
  const vehicles = [...answers.cars, ...answers.twoWheelers]
  if (vehicles.some((vehicle) => !vehicle.motor)) return 'Indiquez la motorisation de chaque véhicule.'
  return null
}

export function issueForContact(answers: Answers): string | null {
  if (answers.recontact === 'oui') {
    const phone = respondentPhone(answers.phone)
    if (!phone) return phone === null ? 'Ce numéro ne contient aucun chiffre.' : 'Indiquez un numéro de téléphone.'
  }
  if (wantsEmail(answers) && !isEmail(answers.email)) return 'Indiquez une adresse mail.'
  return null
}

export function stepIssue(step: Step, answers: Answers, communes: string[]): string | null {
  if (step.kind === 'commune') return issueForCommune(answers, communes)
  if (step.kind === 'household') return issueForHousehold(answers)
  if (step.kind === 'vehicles') return issueForVehicles(answers)
  if (step.kind === 'contact') return issueForContact(answers)
  if (step.kind === 'motives') return motiveIssue(answers.motives)
  return null
}

export function personLine(person: Person): string {
  const age = labelOf(AGE_BANDS, person.age)
  const drive = labelOf(DRIVE_OPTIONS, person.drive)
  if (!age || !drive) return ''
  const driving = `${drive.charAt(0).toLocaleLowerCase('fr')}${drive.slice(1)}`
  return person.manqueAutonomie ? `${age}, ${driving}, manque d’autonomie` : `${age}, ${driving}`
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
  return [
    { label: 'Nom', value: [answers.prenom, answers.nom].filter(Boolean).join(' ') },
    { label: 'Commune', value: answers.commune },
    { label: 'Adresse', value: [answers.adresse, answers.complement].filter(Boolean).join(', ') },
    { label: 'Foyer', value: people.join(' · ') },
    { label: 'Voitures', value: cars.length ? cars.join(' · ') : 'Aucune' },
    { label: '2/3 roues', value: twoWheelers.length ? twoWheelers.join(' · ') : 'Aucun' },
    { label: 'Motifs', value: motivesStarted(answers.motives) ? 'Gardés sur le téléphone' : '' },
    { label: 'Recontact', value: answers.recontact === 'oui' ? 'Oui' : 'Non' },
    { label: 'Collectif Mobilité Haut-Doubs', value: answers.collectif ? 'Oui' : 'Non' },
    { label: 'Adresse mail', value: answers.email },
    { label: 'Téléphone', value: answers.phone },
  ].filter((line) => line.value !== '')
}

/** Itinéraire vers la rue et la commune. Vide tant que l’une des deux manque. */
export function mapsDestination(answers: Pick<Answers, 'adresse' | 'commune'>): string | null {
  const street = answers.adresse.trim()
  const commune = answers.commune.trim()
  if (!street || !commune) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${street}, ${commune}`)}`
}

export function draftTitle(input: Answers): string {
  const answers = sanitizeAnswers(input)
  const name = [answers.prenom, answers.nom].filter(Boolean).join(' ')
  if (name && answers.commune) return `${name} · ${answers.commune}`
  return name || answers.commune || 'Sans nom'
}

export function answerPreview(input: unknown): string {
  const answers = sanitizeAnswers(input)
  const commune = answers.commune.trim() || legacyPlace(input) || 'Commune non précisée'
  const count = answers.people.filter((person) => person.age && person.drive).length
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
    answers.nom ||
      answers.prenom ||
      answers.commune ||
      answers.adresse ||
      answers.complement ||
      answers.people.some((person) => person.age || person.drive) ||
      answers.cars.length ||
      answers.twoWheelers.length ||
      motivesStarted(answers.motives) ||
      answers.recontact !== '' ||
      answers.collectif ||
      answers.email !== '' ||
      answers.phone !== '',
  )
}
