import { describe, expect, test } from 'vitest'
import {
  addVehicle,
  answerPreview,
  buildSteps,
  changePerson,
  emptyAnswers,
  hasAnyAnswer,
  issueForCommune,
  issueForContact,
  questionSide,
  issueForHousehold,
  issueForVehicles,
  patchAnswers,
  personLine,
  sanitizeAnswers,
  summary,
} from './survey'

describe('questionnaire', () => {
  test('commence par la commune, le foyer, puis les véhicules', () => {
    expect(buildSteps(emptyAnswers()).map((step) => step.kind)).toEqual([
      'consent',
      'commune',
      'household',
      'vehicles',
      'contact',
      'review',
    ])
  })

  test('exige une commune de la liste, puis l’âge et la conduite de chaque personne', () => {
    const answers = emptyAnswers()
    expect(issueForCommune(answers, [])).toMatch(/pas sur cet appareil/)
    expect(issueForCommune(answers, ['Lyon'])).toMatch(/Choisissez/)
    expect(issueForCommune(patchAnswers(answers, { commune: 'Paris' }), ['Lyon'])).toMatch(/pas dans la liste/)
    expect(issueForCommune(patchAnswers(answers, { commune: 'Lyon' }), ['Lyon'])).toBeNull()
    expect(issueForCommune(patchAnswers(answers, { commune: 'Pontarlier' }), ['Lyon'])).toBeNull()
    expect(questionSide('Pontarlier')).toBe('de')
    expect(questionSide('pontarlier')).toBe('de')
    expect(questionSide('Jougne')).toBe('vers')
    expect(issueForHousehold(answers)).toMatch(/chaque personne/)
    const ready = patchAnswers(answers, { people: [{ age: '15-17', drive: 'accompagnee' }] })
    expect(issueForHousehold(ready)).toBeNull()
    expect(personLine(ready.people[0])).toBe('15–17 ans, conduite accompagnée')
  })

  test('une motorisation est obligatoire dès qu’un véhicule est ajouté', () => {
    expect(issueForVehicles(emptyAnswers())).toBeNull()
    const added = patchAnswers(emptyAnswers(), { cars: addVehicle([]) })
    expect(issueForVehicles(added)).toMatch(/motorisation/)
    const named = patchAnswers(added, { cars: [{ motor: 'thermique', sansPermis: true }] })
    expect(issueForVehicles(named)).toBeNull()
    const lines = Object.fromEntries(summary(named).map((line) => [line.label, line.value]))
    expect(lines.Voitures).toBe('Thermique, sans permis')
    expect(lines['2/3 roues']).toBe('Aucun')
  })

  test('rejette les valeurs inconnues et borne les listes', () => {
    const clean = sanitizeAnswers({
      commune: '  Lyon  ',
      people: [
        { age: 'pirate', drive: 'oui' },
        { age: '65+', drive: 'non' },
      ],
      cars: Array.from({ length: 20 }, () => ({ motor: 'electrique', sansPermis: 'oui' })),
      twoWheelers: [{ motor: 'fusee', sansPermis: true }],
    })
    expect(clean.commune).toBe('Lyon')
    expect(clean.people[0]).toEqual({ age: '', drive: 'oui' })
    expect(clean.people[1]).toEqual({ age: '65+', drive: 'non' })
    expect(clean.cars).toHaveLength(8)
    expect(clean.cars[0]?.sansPermis).toBe(false)
    expect(clean.twoWheelers[0]?.motor).toBe('')
    expect(hasAnyAnswer(emptyAnswers())).toBe(false)
    expect(hasAnyAnswer(clean)).toBe(true)
    expect(changePerson(clean.people, 0, { age: '0-14' })[0]?.age).toBe('0-14')
  })

  test('demande une adresse mail seulement pour un recontact ou le collectif', () => {
    const answers = emptyAnswers()
    expect(issueForContact(answers)).toMatch(/recontactée/)
    const refused = patchAnswers(answers, { recontact: 'non' })
    expect(issueForContact(refused)).toBeNull()
    expect(refused.email).toBe('')
    const news = patchAnswers(answers, { recontact: 'non', collectif: true, email: 'PasUnMail' })
    expect(issueForContact(news)).toMatch(/adresse mail/)
    const ready = patchAnswers(news, { email: 'Ada@Exemple.fr' })
    expect(issueForContact(ready)).toBeNull()
    expect(ready.email).toBe('ada@exemple.fr')
    const dropped = patchAnswers(ready, { collectif: false })
    expect(dropped.email).toBe('')
  })

  test('une fiche de l’ancien questionnaire ne fait pas planter l’accueil', () => {
    expect(answerPreview({ habitation: 'Centre', age: '35-49' })).toBe('Centre')
    expect(answerPreview(undefined)).toBe('Commune non précisée')
  })
})
