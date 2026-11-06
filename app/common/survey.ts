export const SURVEY_VERSION = '1'

export type QuestionId =
  | 'habitation'
  | 'age'
  | 'mode'
  | 'trips'
  | 'purpose'
  | 'duration'
  | 'frictions'
  | 'priority'
  | 'score'
  | 'comment'
  | 'recontact'
  | 'contact'

export type Option = { value: string; label: string }

type QuestionBase = {
  id: QuestionId
  title: string
  short: string
  hint?: string
  required: boolean
}

export type Question =
  | (QuestionBase & { kind: 'single'; options: Option[] })
  | (QuestionBase & { kind: 'multi'; options: Option[] })
  | (QuestionBase & { kind: 'text'; placeholder: string; multiline?: boolean; maxLength: number })
  | (QuestionBase & { kind: 'scale'; min: number; max: number; minLabel: string; maxLabel: string })

export type Answers = {
  habitation: string
  age: string
  mode: string
  modePrecision: string
  trips: string
  purpose: string
  duration: string
  frictions: string[]
  frictionPrecision: string
  priority: string
  score: string
  comment: string
  recontact: string
  contact: string
}

const AGE: Option[] = [
  { value: '0-17', label: 'Moins de 18 ans' },
  { value: '18-24', label: '18–24 ans' },
  { value: '25-34', label: '25–34 ans' },
  { value: '35-49', label: '35–49 ans' },
  { value: '50-64', label: '50–64 ans' },
  { value: '65-74', label: '65–74 ans' },
  { value: '75+', label: '75 ans et plus' },
  { value: 'nsp', label: 'Ne souhaite pas répondre' },
]

const MODES: Option[] = [
  { value: 'pied', label: 'À pied' },
  { value: 'velo', label: 'Vélo' },
  { value: 'trottinette', label: 'Trottinette ou engin similaire' },
  { value: 'transport', label: 'Bus, car ou tram' },
  { value: 'train', label: 'Train ou TER' },
  { value: 'voiture', label: 'Voiture, comme conducteur' },
  { value: 'passager', label: 'Voiture, comme passager' },
  { value: 'deux-roues', label: 'Deux-roues motorisé' },
  { value: 'covoiturage', label: 'Covoiturage' },
  { value: 'autre', label: 'Autre' },
]

const TRIPS: Option[] = [
  { value: '0', label: 'Je ne me déplace presque pas' },
  { value: '1-2', label: '1 ou 2' },
  { value: '3-4', label: '3 ou 4' },
  { value: '5+', label: '5 ou plus' },
]

const PURPOSES: Option[] = [
  { value: 'travail', label: 'Travail' },
  { value: 'etudes', label: 'Études' },
  { value: 'courses', label: 'Courses et démarches' },
  { value: 'sante', label: 'Santé' },
  { value: 'accompagnement', label: 'Accompagner quelqu’un' },
  { value: 'loisirs', label: 'Loisirs, visites' },
  { value: 'autre', label: 'Autre' },
]

const DURATIONS: Option[] = [
  { value: '10', label: 'Moins de 10 minutes' },
  { value: '20', label: '10 à 20 minutes' },
  { value: '40', label: '20 à 40 minutes' },
  { value: '60', label: '40 à 60 minutes' },
  { value: '60+', label: 'Plus d’une heure' },
  { value: 'variable', label: 'Ça dépend trop pour choisir' },
]

const FRICTIONS: Option[] = [
  { value: 'frequence', label: 'Les bus ou cars ne passent pas assez' },
  { value: 'horaires', label: 'Les horaires ne collent pas' },
  { value: 'trottoirs', label: 'Les trottoirs sont mauvais ou absents' },
  { value: 'velo', label: 'Il manque des itinéraires vélo sûrs' },
  { value: 'stationnement', label: 'Le stationnement est difficile' },
  { value: 'securite', label: 'Je ne me sens pas en sécurité' },
  { value: 'cout', label: 'Ça coûte trop cher' },
  { value: 'rien', label: 'Rien de particulier' },
  { value: 'autre', label: 'Autre' },
]

const PRIORITIES: Option[] = [
  { value: 'bus', label: 'Plus de bus ou de cars' },
  { value: 'horaires', label: 'De meilleurs horaires' },
  { value: 'trottoirs', label: 'Des trottoirs confortables' },
  { value: 'velo', label: 'Des itinéraires vélo sûrs' },
  { value: 'stationnement', label: 'Du stationnement' },
  { value: 'cout', label: 'Des trajets moins chers' },
  { value: 'rien', label: 'Rien, ça me convient' },
]

const YES_NO: Option[] = [
  { value: 'oui', label: 'Oui' },
  { value: 'non', label: 'Non' },
]

export const questions: Question[] = [
  {
    id: 'habitation',
    kind: 'text',
    title: 'Dans quelle commune, ou quel quartier, habitez-vous ?',
    short: 'Habitation',
    required: true,
    placeholder: 'Ex. centre-ville, ou une commune voisine',
    maxLength: 160,
  },
  {
    id: 'age',
    kind: 'single',
    title: 'Quelle est votre tranche d’âge ?',
    short: 'Âge',
    required: true,
    options: AGE,
  },
  {
    id: 'mode',
    kind: 'single',
    title: 'Au quotidien, comment vous déplacez-vous le plus souvent ?',
    short: 'Mode principal',
    required: true,
    options: MODES,
  },
  {
    id: 'trips',
    kind: 'single',
    title: 'Un jour de semaine ordinaire, combien de déplacements faites-vous ?',
    short: 'Déplacements',
    hint: 'L’aller et le retour comptent pour deux.',
    required: true,
    options: TRIPS,
  },
  {
    id: 'purpose',
    kind: 'single',
    title: 'Quel est le motif le plus fréquent de ces déplacements ?',
    short: 'Motif',
    required: true,
    options: PURPOSES,
  },
  {
    id: 'duration',
    kind: 'single',
    title: 'Combien de temps dure en général ce trajet le plus fréquent ?',
    short: 'Durée',
    required: true,
    options: DURATIONS,
  },
  {
    id: 'frictions',
    kind: 'multi',
    title: 'Qu’est-ce qui vous gêne le plus dans vos déplacements ici ?',
    short: 'Gênes',
    hint: 'Plusieurs réponses possibles.',
    required: true,
    options: FRICTIONS,
  },
  {
    id: 'priority',
    kind: 'single',
    title: 'Si une seule chose devait s’améliorer, laquelle choisiriez-vous ?',
    short: 'Priorité',
    required: true,
    options: PRIORITIES,
  },
  {
    id: 'score',
    kind: 'scale',
    title: 'Comment jugez-vous la facilité de se déplacer dans la commune ?',
    short: 'Note',
    required: true,
    min: 1,
    max: 5,
    minLabel: 'Très difficile',
    maxLabel: 'Très facile',
  },
  {
    id: 'comment',
    kind: 'text',
    title: 'Souhaitez-vous ajouter quelque chose ?',
    short: 'Commentaire',
    hint: 'Facultatif.',
    required: false,
    placeholder: 'Un trajet, un horaire, un endroit précis…',
    multiline: true,
    maxLength: 2000,
  },
  {
    id: 'recontact',
    kind: 'single',
    title: 'Acceptez-vous d’être recontacté au sujet de cette enquête ?',
    short: 'Recontact',
    hint: 'Seulement si la personne le souhaite.',
    required: true,
    options: YES_NO,
  },
  {
    id: 'contact',
    kind: 'text',
    title: 'Comment peut-on vous joindre ?',
    short: 'Coordonnées',
    hint: 'Facultatif. La personne peut accepter sans laisser de coordonnées.',
    required: false,
    placeholder: 'Téléphone ou e-mail',
    maxLength: 160,
  },
]

const TEXT_MAX = {
  habitation: 160,
  comment: 2000,
  contact: 160,
  modePrecision: 160,
  frictionPrecision: 160,
} as const

const EXCLUSIVE_FRICTIONS = ['rien']

export function questionById(id: QuestionId): Question | undefined {
  return questions.find((question) => question.id === id)
}

export function emptyAnswers(): Answers {
  return {
    habitation: '',
    age: '',
    mode: '',
    modePrecision: '',
    trips: '',
    purpose: '',
    duration: '',
    frictions: [],
    frictionPrecision: '',
    priority: '',
    score: '',
    comment: '',
    recontact: '',
    contact: '',
  }
}

export function isVisible(question: Question, answers: Answers): boolean {
  if (question.id === 'contact') return answers.recontact === 'oui'
  return true
}

export type Step =
  | { kind: 'consent' }
  | { kind: 'question'; question: Question }
  | { kind: 'review' }

export function buildSteps(answers: Answers): Step[] {
  return [
    { kind: 'consent' },
    ...questions.filter((question) => isVisible(question, answers)).map((question) => ({ kind: 'question' as const, question })),
    { kind: 'review' },
  ]
}

function clip(value: string, max: number): string {
  return value.slice(0, max)
}

function knownOption(id: QuestionId, value: string): string {
  const question = questionById(id)
  if (!question || question.kind === 'text' || question.kind === 'scale') return ''
  return question.options.some((option) => option.value === value) ? value : ''
}

export function sanitizeAnswers(input: unknown): Answers {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const text = (key: keyof typeof TEXT_MAX) => (typeof source[key] === 'string' ? clip(source[key], TEXT_MAX[key]) : '')
  const frictions = Array.isArray(source.frictions)
    ? source.frictions.filter((value): value is string => typeof value === 'string' && knownOption('frictions', value) !== '').slice(0, 12)
    : []
  const score = typeof source.score === 'string' && ['1', '2', '3', '4', '5'].includes(source.score) ? source.score : ''
  return patchAnswers(emptyAnswers(), {
    habitation: text('habitation'),
    age: knownOption('age', typeof source.age === 'string' ? source.age : ''),
    mode: knownOption('mode', typeof source.mode === 'string' ? source.mode : ''),
    modePrecision: text('modePrecision'),
    trips: knownOption('trips', typeof source.trips === 'string' ? source.trips : ''),
    purpose: knownOption('purpose', typeof source.purpose === 'string' ? source.purpose : ''),
    duration: knownOption('duration', typeof source.duration === 'string' ? source.duration : ''),
    frictions,
    frictionPrecision: text('frictionPrecision'),
    priority: knownOption('priority', typeof source.priority === 'string' ? source.priority : ''),
    score,
    comment: text('comment'),
    recontact: knownOption('recontact', typeof source.recontact === 'string' ? source.recontact : ''),
    contact: text('contact'),
  })
}

export function patchAnswers(answers: Answers, patch: Partial<Answers>): Answers {
  const next: Answers = {
    ...answers,
    ...patch,
    frictions: patch.frictions ? [...patch.frictions] : answers.frictions,
  }
  if (patch.habitation !== undefined) next.habitation = clip(patch.habitation, TEXT_MAX.habitation)
  if (patch.comment !== undefined) next.comment = clip(patch.comment, TEXT_MAX.comment)
  if (patch.contact !== undefined) next.contact = clip(patch.contact, TEXT_MAX.contact)
  if (patch.modePrecision !== undefined) next.modePrecision = clip(patch.modePrecision, TEXT_MAX.modePrecision)
  if (patch.frictionPrecision !== undefined) next.frictionPrecision = clip(patch.frictionPrecision, TEXT_MAX.frictionPrecision)
  if (patch.recontact !== undefined && patch.recontact !== 'oui') next.contact = ''
  if (patch.mode !== undefined && patch.mode !== 'autre') next.modePrecision = ''
  if (patch.frictions !== undefined && !patch.frictions.includes('autre')) next.frictionPrecision = ''
  return next
}

export function toggleFriction(current: string[], value: string): string[] {
  if (!knownOption('frictions', value)) return current
  if (current.includes(value)) return current.filter((item) => item !== value)
  if (EXCLUSIVE_FRICTIONS.includes(value)) return [value]
  return [...current.filter((item) => !EXCLUSIVE_FRICTIONS.includes(item)), value]
}

export function optionLabel(id: QuestionId, value: string): string {
  if (!value) return ''
  const question = questionById(id)
  if (!question || question.kind === 'text' || question.kind === 'scale') return value
  return question.options.find((option) => option.value === value)?.label ?? ''
}

export function issueFor(question: Question, answers: Answers): string | null {
  if (question.kind === 'single') {
    const value = singleValue(question.id, answers)
    if (question.required && !value) return 'Choisissez une réponse.'
    if (question.id === 'mode' && value === 'autre' && !answers.modePrecision.trim()) return 'Précisez le mode.'
    return null
  }
  if (question.kind === 'multi') {
    if (question.required && answers.frictions.length === 0) return 'Choisissez au moins une réponse.'
    if (answers.frictions.includes('autre') && !answers.frictionPrecision.trim()) return 'Précisez la gêne.'
    return null
  }
  if (question.kind === 'text') {
    const value = textValue(question.id, answers).trim()
    if (question.required && !value) return 'Écrivez une réponse.'
    return null
  }
  if (question.required && !answers.score) return 'Choisissez une note.'
  return null
}

function singleValue(id: QuestionId, answers: Answers): string {
  switch (id) {
    case 'age':
      return answers.age
    case 'mode':
      return answers.mode
    case 'trips':
      return answers.trips
    case 'purpose':
      return answers.purpose
    case 'duration':
      return answers.duration
    case 'priority':
      return answers.priority
    case 'recontact':
      return answers.recontact
    default:
      return ''
  }
}

function textValue(id: QuestionId, answers: Answers): string {
  switch (id) {
    case 'habitation':
      return answers.habitation
    case 'comment':
      return answers.comment
    case 'contact':
      return answers.contact
    default:
      return ''
  }
}

export function displayValue(question: Question, answers: Answers): string {
  if (question.kind === 'text') return textValue(question.id, answers).trim()
  if (question.kind === 'scale') return answers.score ? `${answers.score} / 5` : ''
  if (question.kind === 'multi') {
    const labels = answers.frictions.map((value) => optionLabel('frictions', value)).filter(Boolean)
    const precision = answers.frictionPrecision.trim()
    if (precision && answers.frictions.includes('autre')) labels.push(precision)
    return labels.join(' · ')
  }
  const value = singleValue(question.id, answers)
  const label = optionLabel(question.id, value)
  if (question.id === 'mode' && value === 'autre' && answers.modePrecision.trim()) {
    return `${label} — ${answers.modePrecision.trim()}`
  }
  return label
}

export function summary(answers: Answers): { label: string; value: string }[] {
  return questions
    .filter((question) => isVisible(question, answers))
    .map((question) => ({ label: question.short, value: displayValue(question, answers) }))
    .filter((line) => line.value !== '')
}

export function answerPreview(answers: Answers): string {
  const place = answers.habitation.trim() || 'Habitation non précisée'
  const age = optionLabel('age', answers.age)
  return age ? `${place} · ${age}` : place
}

export function hasAnyAnswer(answers: Answers): boolean {
  return Boolean(
    answers.habitation ||
      answers.age ||
      answers.mode ||
      answers.modePrecision ||
      answers.trips ||
      answers.purpose ||
      answers.duration ||
      answers.frictions.length ||
      answers.frictionPrecision ||
      answers.priority ||
      answers.score ||
      answers.comment ||
      answers.recontact ||
      answers.contact,
  )
}
