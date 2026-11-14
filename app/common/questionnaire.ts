import { COLLECTIF_CONSENT, PHONE_CONSENT } from './consent'
import { DIFFICULTY_GROUPS, DIFFICULTY_ITEMS, DIFFICULTY_PACES, WEEKDAYS } from './journeys'
import { EXTRA_MODES, OFFER_MODES, SLOTS, THEME_IDS, themeLabel, type ThemeId } from './motives'
import {
  AGE_BANDS,
  CIVILITY,
  DRIVE_OPTIONS,
  HANDICAP_ADAPTATIONS,
  HANDICAP_ANSWERS,
  HANDICAP_CONCERN,
  HANDICAP_WHO,
  LIFE_CHOICES,
  MODE_BARRIERS,
  MODE_CONDITION_GROUPS,
  MODE_CONDITIONS,
  MODE_REASONS,
  MOTOR_OPTIONS,
  VISITS,
  WALK_DISTANCES,
} from './survey'

export type Question = {
  id: string
  ask: string
  note?: string
  choices?: readonly string[]
  /** Réponses sur une ligne. Sinon, une liste. */
  inline?: boolean
  /** Nombre d’options finales écartées du bloc, avec un espace avant chacune. */
  apart?: number
  /** Complément de « Posée si ». Absent quand la question est toujours posée. */
  when?: string
  /** Questions communes à chaque catégorie, affichées une seule fois avant elles. */
  each?: { intro: string; questions: readonly Question[] }
  children?: readonly Question[]
}

export type QuestionnairePart = {
  id: string
  title: string
  note?: string
  questions: readonly Question[]
}

export const OCCASIONAL_TRIPS: { label: string; theme: ThemeId | ''; autre: string }[] = [
  { label: 'Démarche administrative', theme: 'administratif', autre: '' },
  { label: 'Banque', theme: 'administratif', autre: '' },
  { label: 'Coiffeur', theme: 'loisirs', autre: 'Coiffeur' },
  { label: 'Cinéma', theme: 'loisirs', autre: 'Cinéma' },
  { label: 'Soirée', theme: 'loisirs', autre: 'Soirée' },
  { label: 'Gare', theme: '', autre: '' },
  { label: 'Activité sportive, pour vous ou les enfants', theme: 'loisirs', autre: 'Sport' },
  { label: 'Rendez-vous médical, pour vous ou pour quelqu’un d’autre', theme: 'sante', autre: '' },
  { label: 'Autre', theme: '', autre: '' },
]

export const REPLACED_ANSWERS = [
  { id: 'toujours', label: 'Toujours' },
  { id: 'souvent', label: 'Souvent' },
  { id: 'parfois', label: 'Parfois' },
  { id: 'jamais', label: 'Jamais' },
] as const

export function transitQuestion(modes: number): string {
  return modes > 1
    ? 'Certains tronçons pourraient-ils être faits en transport en commun ou en covoiturage, si l’offre était efficace, fiable et financièrement intéressante ?'
    : 'Ce trajet pourrait-il être fait en transport en commun ou en covoiturage, si l’offre était efficace, fiable et financièrement intéressante ?'
}

const labels = (items: readonly { label: string }[]) => items.map((item) => item.label)

function optionalNote(id: string, ask = 'Préciser'): Question {
  return { id, ask, note: 'Facultatif.' }
}

const tripShared: Question[] = [
  {
    id: 'trip-theme',
    ask: 'Pour quel motif ?',
    choices: THEME_IDS.map((theme) => themeLabel(theme, '')),
    children: [{ id: 'trip-activity', ask: 'Préciser l’activité', note: 'Facultatif.', when: 'un motif est choisi' }],
  },
  { id: 'trip-out', ask: 'Horaire aller', choices: labels(SLOTS), inline: true },
  { id: 'trip-back', ask: 'Horaire retour', note: 'Facultatif.', choices: labels(SLOTS), inline: true },
  {
    id: 'trip-frequency',
    ask: 'À quelle fréquence ?',
    choices: ['Pas régulier', 'Régulier'],
    inline: true,
    children: [
      {
        id: 'trip-rare',
        ask: 'Combien de fois ?',
        when: 'le trajet n’est pas régulier',
        note: 'De 1 à 5 fois par jour, par semaine, par mois ou par an.',
      },
      {
        id: 'trip-regular',
        ask: 'Quel rythme ?',
        when: 'le trajet est régulier',
        choices: ['Hebdomadaire', 'Toutes les … semaines', ...WEEKDAYS.map((day) => day.label)],
        inline: true,
      },
    ],
  },
  { id: 'trip-from', ask: 'De' },
  { id: 'trip-to', ask: 'À' },
  { id: 'trip-comment', ask: 'Commentaire', note: 'Facultatif.' },
]

const actualTrip: Question[] = [
  tripShared[0],
  {
    id: 'trip-who',
    ask: 'Qui fait ce trajet ?',
    note: 'Les personnes du foyer, et d’éventuels autres passagers.',
  },
  {
    id: 'trip-mode',
    ask: 'Par quel moyen ?',
    note: 'Plusieurs réponses possibles. Les voitures et les 2/3 roues déclarés s’ajoutent à la liste.',
    choices: ['Voiture', '2/3 roues', ...labels(EXTRA_MODES)],
    inline: true,
    children: [
      {
        id: 'trip-duration',
        ask: 'Temps moyen de trajet',
        when: 'au moins un moyen est choisi',
        note: 'En minutes, pour chaque moyen, plus une attente éventuelle.',
      },
    ],
  },
  ...tripShared.slice(1, 6),
  {
    id: 'trip-transit',
    ask: transitQuestion(1),
    note: 'S’il y a plusieurs moyens autres que le train et l’autocar, la question porte sur certains tronçons.',
    when: 'au moins un moyen n’est ni le train ni l’autocar',
    choices: labels(REPLACED_ANSWERS),
    inline: true,
    children: [
      {
        id: 'trip-offer-modes',
        ask: 'Par quel moyen ?',
        note: 'Désélectionner les options non souhaitées',
        choices: labels(OFFER_MODES),
        inline: true,
      },
      {
        id: 'trip-acceptable',
        ask: 'Quel temps de trajet maximal porte-à-porte serait alors acceptable ?',
      },
      {
        id: 'trip-riders',
        ask: 'Qui ferait ce trajet en transports en commun ou en covoiturage ?',
        note: 'La personne qui conduit peut ne plus le faire.',
        when: 'la réponse est toujours, souvent ou parfois',
      },
    ],
  },
  tripShared[6],
]

function copyQuestions(prefix: string, questions: readonly Question[]): Question[] {
  return questions.map((question) => ({
    ...question,
    id: `${prefix}-${question.id}`,
    each: question.each
      ? { intro: question.each.intro, questions: copyQuestions(prefix, question.each.questions) }
      : undefined,
    children: question.children ? copyQuestions(prefix, question.children) : undefined,
  }))
}

const wishedTrip: Question[] = [
  ...copyQuestions('wish', tripShared.slice(0, 6)),
  {
    id: 'wish-offer-modes',
    ask: 'Par quel moyen ?',
    note: 'Désélectionner les options non souhaitées',
    choices: labels(OFFER_MODES),
    inline: true,
  },
  {
    id: 'wish-riders',
    ask: 'Qui ferait ce trajet en transports en commun ou en covoiturage ?',
    note: 'La personne qui conduit peut ne plus le faire.',
  },
  { id: 'wish-acceptable', ask: 'Temps acceptable porte-à-porte ?' },
  ...copyQuestions('wish', [tripShared[6]]),
]

const difficultyEach: Question[] = [
  {
    id: 'difficulty-pace',
    ask: 'À quelle fréquence ?',
    when: 'une précision est retenue',
    choices: labels(DIFFICULTY_PACES),
    inline: true,
  },
  {
    id: 'difficulty-trips',
    ask: 'Quels trajets sont concernés ?',
    when: 'plusieurs trajets ont déjà été notés',
  },
]

const difficultyChildren: Question[] = DIFFICULTY_GROUPS.filter((group) => group.id !== 'aucune').map((group) => ({
  id: `difficulty-${group.id}`,
  ask: group.label,
  when: `« ${group.label} » est retenu`,
  choices: group.id === 'autres' ? undefined : labels(DIFFICULTY_ITEMS.filter((item) => item.group === group.id)),
  children:
    group.id === 'autres'
      ? [{ id: 'difficulty-other-note', ask: 'Pouvez-vous préciser ?', when: 'le thème est ouvert' }]
      : undefined,
}))

const conditionChoices = [
  ...MODE_CONDITION_GROUPS.flatMap((group) =>
    group.ids.map((id) => MODE_CONDITIONS.find((item) => item.value === id)?.label ?? id),
  ),
  ...['autre', 'aucune'].map((id) => MODE_CONDITIONS.find((item) => item.value === id)?.label ?? id),
]

export const QUESTIONNAIRE: readonly QuestionnairePart[] = [
  {
    id: 'identity',
    title: 'La personne',
    questions: [
      {
        id: 'who',
        ask: 'Qui est la personne ?',
        note: 'Facultatif.',
        children: [
          { id: 'civility', ask: 'Civilité', choices: labels(CIVILITY), inline: true },
          { id: 'first-name', ask: 'Prénom' },
          { id: 'last-name', ask: 'Nom' },
        ],
      },
      {
        id: 'commune',
        ask: 'Dans quelle commune habitez-vous ?',
        note: 'Une commune absente de la liste peut être saisie.',
      },
      {
        id: 'address',
        ask: 'Quelle est son adresse ?',
        note: 'Facultatif. La seconde ligne précise l’appartement ou le bâtiment.',
        children: [
          { id: 'street', ask: 'Adresse' },
          { id: 'complement', ask: 'Complément' },
        ],
      },
    ],
  },
  {
    id: 'visit',
    title: 'Visite',
    questions: [
      {
        id: 'visit-why',
        ask: 'Pourquoi ?',
        note: 'Chaque visite est conservée, avec l’heure.',
        when: 'l’enquête n’a pas pu avoir lieu',
        choices: labels(VISITS.filter((item) => !item.starts)),
      },
    ],
  },
  {
    id: 'consent',
    title: 'Avant de commencer',
    questions: [{ id: 'consent-accept', ask: 'La personne a été informée et accepte de répondre.' }],
  },
  {
    id: 'household',
    title: 'Le foyer',
    questions: [
      {
        id: 'household-who',
        ask: 'Qui vit dans le foyer ?',
        note: 'Pour chaque personne : la tranche d’âge, et si elle conduit.',
        children: [
          { id: 'age', ask: 'Tranche d’âge', choices: labels(AGE_BANDS), inline: true },
          {
            id: 'drive',
            ask: 'Conduite',
            when: 'la personne a 15 ans ou plus',
            choices: labels(DRIVE_OPTIONS),
            inline: true,
            children: [
              {
                id: 'autonomy',
                ask: 'Lié à un manque d’autonomie',
                when: 'la personne ne conduit pas',
              },
            ],
          },
          {
            id: 'electoral',
            ask: 'Inscrite sur les listes électorales ?',
            when: 'la personne a 18 ans ou plus',
            choices: ['Oui', 'Non'],
            inline: true,
            children: [
              {
                id: 'electoral-commune',
                ask: 'Commune d’inscription',
                when: 'la réponse est oui',
              },
            ],
          },
        ],
      },
      {
        id: 'vehicles',
        ask: 'Quels véhicules a le foyer ?',
        note: 'Ajoutez chaque voiture et chaque 2/3 roues motorisé. Aucun, si le foyer n’en a pas.',
        children: [
          {
            id: 'cars',
            ask: 'Voitures',
            note: 'Pour chaque voiture.',
            choices: labels(MOTOR_OPTIONS),
            inline: true,
            children: [{ id: 'car-license', ask: 'Sans permis' }],
          },
          {
            id: 'wheels',
            ask: '2/3 roues motorisés',
            note: 'Pour chacun.',
            choices: labels(MOTOR_OPTIONS),
            inline: true,
            children: [{ id: 'wheel-license', ask: 'Sans permis' }],
          },
        ],
      },
    ],
  },
  {
    id: 'trips',
    title: 'Trajets que le foyer fait déjà, quel que soit le moyen.',
    note: 'Ces questions sont répétées pour chaque trajet.',
    questions: actualTrip,
  },
  {
    id: 'reminders',
    title: 'Avez-vous pensé à tout ?',
    note: 'Les trajets occasionnels comptent aussi, même s’ils sont rares.',
    questions: [
      {
        id: 'reminders-list',
        ask: 'Ajouter un trajet auquel vous n’auriez pas pensé ?',
        choices: OCCASIONAL_TRIPS.map((item) => item.label),
      },
    ],
  },
  {
    id: 'difficulties',
    title: 'Quelles difficultés sur ces trajets ?',
    note: 'Une seule fois, pour l’ensemble des trajets déjà notés.',
    questions: [
      {
        id: 'difficulty',
        ask: 'Rencontrez-vous des difficultés lors de ces trajets ?',
        note: 'Plusieurs réponses possibles. Ouvrez un thème, puis indiquez la fréquence.',
        choices: labels(DIFFICULTY_GROUPS),
        each: { intro: 'Pour chacune des catégories ci-dessous :', questions: difficultyEach },
        children: difficultyChildren,
      },
    ],
  },
  {
    id: 'offers',
    title: 'Trajets qu’une offre rendrait possibles',
    note: 'Ils ne sont pas faits aujourd’hui. Ils le seraient en transport en commun ou en covoiturage, si l’offre était efficace, fiable et financièrement intéressante. Ces questions sont répétées pour chaque trajet.',
    questions: wishedTrip,
  },
  {
    id: 'change',
    title: 'Changer de mode de transport',
    questions: [
      {
        id: 'reasons',
        ask: 'Pour quelles raisons pourriez-vous envisager de changer de mode de transport ?',
        note: 'Plusieurs réponses possibles.',
        choices: labels(MODE_REASONS),
        children: [optionalNote('reasons-note')],
      },
      {
        id: 'conditions',
        ask: 'À quelles conditions absolument nécessaires pourriez-vous remplacer certains de vos trajets actuels en voiture par les transports en commun ou le covoiturage ?',
        note: 'Sans ces conditions, vous ne changeriez pas. Plusieurs réponses possibles.',
        choices: conditionChoices,
        apart: 2,
        children: [optionalNote('conditions-note')],
      },
      {
        id: 'barriers',
        ask: 'Qu’est-ce qui pourrait au contraire vous freiner ou vous empêcher d’utiliser les transports en commun ou le covoiturage, même s’ils desservaient les lieux où vous souhaitez vous rendre ?',
        note: 'Plusieurs réponses possibles.',
        choices: labels(MODE_BARRIERS),
        apart: 1,
        children: [optionalNote('barriers-note')],
      },
    ],
  },
  {
    id: 'walk',
    title: 'Arrêt de transport en commun',
    questions: [
      {
        id: 'walk-distance',
        ask: 'Quelle distance maximale seriez-vous prêt(e) à parcourir à pied entre votre domicile (ou le lieu où vous vous rendez) et un arrêt de transport en commun ?',
        note: 'Une seule réponse.',
        choices: labels(WALK_DISTANCES),
        children: [
          optionalNote('walk-note'),
          {
            id: 'walk-nearby',
            ask: 'Existe-t-il déjà un arrêt satisfaisant près de votre domicile ?',
            when: 'une distance est choisie',
            choices: ['Oui', 'Non'],
            inline: true,
            children: [
              {
                id: 'walk-where',
                ask: 'Où verriez-vous un arrêt de transport près de chez vous ?',
                when: 'il n’y a pas d’arrêt satisfaisant',
              },
              {
                id: 'walk-skip',
                ask: 'La carte ne s’affiche pas ou la personne ne souhaite pas répondre',
                children: [
                  {
                    id: 'walk-place',
                    ask: 'Précisions / commentaires',
                    when: 'la carte est passée ou la personne ne souhaite pas répondre',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'life',
    title: 'Des choix de vie différents grâce aux transports',
    questions: [
      {
        id: 'life-choices',
        ask: 'Si des transports en commun adaptés à vos besoins existaient, cela pourrait-il vous amener à faire des choix différents dans votre vie quotidienne ?',
        note: 'Plusieurs réponses possibles.',
        choices: labels(LIFE_CHOICES),
        children: [
          {
            id: 'life-who',
            ask: 'Qui cela concerne-t-il ?',
            note: 'Les personnes du foyer, puis une précision facultative.',
            when: 'une réponse autre que « Non, cela ne changerait pas mes choix » est retenue',
          },
        ],
      },
    ],
  },
  {
    id: 'handicap',
    title: 'Adaptation aux situations de handicap',
    questions: [
      {
        id: 'handicap',
        ask: 'Selon vous, les transports devraient-ils proposer des aménagements ou des services adaptés aux personnes en situation de handicap ?',
        choices: labels(HANDICAP_ANSWERS),
        inline: true,
        children: [
          {
            id: 'handicap-types',
            ask: 'Si oui, quels types d’adaptations vous sembleraient nécessaires ?',
            note: 'Plusieurs réponses possibles.',
            when: 'la réponse est oui',
            choices: labels(HANDICAP_ADAPTATIONS),
            children: [
              { id: 'handicap-other', ask: 'Préciser', when: '« Autre (à préciser) » est choisi' },
            ],
          },
          {
            id: 'handicap-concern',
            ask: 'Ce besoin d’adaptation vous concerne-t-il ou concerne-t-il un proche ?',
            when: 'au moins une adaptation est indiquée',
            choices: labels(HANDICAP_CONCERN),
            inline: true,
            children: [
              {
                id: 'handicap-who',
                ask: 'Qui est concerné',
                note: 'Plusieurs réponses possibles.',
                when: 'cela concerne la personne ou un proche',
                choices: labels(HANDICAP_WHO),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'contact',
    title: 'Rester en contact ?',
    note: 'Les informations personnelles ne seront jamais diffusées.',
    questions: [
      {
        id: 'recontact',
        ask: PHONE_CONSENT,
        children: [{ id: 'phone', ask: 'Numéro de téléphone', when: 'la personne accepte d’être recontactée' }],
      },
      {
        id: 'collectif',
        ask: COLLECTIF_CONSENT,
        children: [
          { id: 'email', ask: 'Adresse mail', when: 'la personne accepte de recevoir les informations du collectif' },
        ],
      },
      {
        id: 'recruit',
        ask: 'Souhaitez-vous devenir enquêteur à votre tour ?',
        choices: ['Oui', 'Non'],
        inline: true,
        children: [
          {
            id: 'recruit-phone',
            ask: 'Numéro de téléphone',
            when: 'la personne accepte et n’a pas déjà laissé de téléphone',
          },
          {
            id: 'recruit-email',
            ask: 'Adresse mail',
            when: 'la personne accepte et n’a pas déjà laissé d’adresse mail',
          },
        ],
      },
    ],
  },
  {
    id: 'closing',
    title: 'Souhaitez-vous ajouter quelque chose ?',
    note: 'Vous pouvez partager toute remarque, difficulté, idée ou proposition qui n’aurait pas été abordée dans ce questionnaire.',
    questions: [{ id: 'closing-note', ask: 'Souhaitez-vous ajouter quelque chose ?' }],
  },
]

export function partById(id: string): QuestionnairePart | undefined {
  return QUESTIONNAIRE.find((part) => part.id === id)
}

export function questionText(id: string): string {
  const found = findQuestion(id)
  if (!found) throw new Error(`Question absente : ${id}`)
  return found.ask
}

export function questionNote(id: string): string {
  return findQuestion(id)?.note ?? ''
}

export function findQuestion(id: string, parts: readonly QuestionnairePart[] = QUESTIONNAIRE): Question | undefined {
  for (const part of parts) {
    const found = findIn(part.questions, id)
    if (found) return found
  }
  return undefined
}

function findIn(questions: readonly Question[], id: string): Question | undefined {
  for (const question of questions) {
    if (question.id === id) return question
    if (question.each) {
      const found = findIn(question.each.questions, id)
      if (found) return found
    }
    if (question.children) {
      const found = findIn(question.children, id)
      if (found) return found
    }
  }
  return undefined
}
