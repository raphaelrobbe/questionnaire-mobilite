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
  respondentPhone,
  issueForHousehold,
  issueForVehicles,
  patchAnswers,
  sanitizeAnswers,
  personLine,
  mapsDestination,
  summary,
} from './survey'

describe('questionnaire', () => {
  test('commence par le nom, la commune et l’adresse, puis l’accord', () => {
    expect(buildSteps(emptyAnswers()).map((step) => step.kind)).toEqual([
      'name',
      'commune',
      'address',
      'consent',
      'household',
      'vehicles',
      'motives',
      'reminders',
      'offers',
      'contact',
      'review',
    ])
  })

  test('exige une commune de la liste, puis l’âge et la conduite de chaque personne', () => {
    const answers = emptyAnswers()
    expect(issueForCommune(answers)).toMatch(/Choisissez/)
    expect(issueForCommune(patchAnswers(answers, { commune: 'Paris' }))).toMatch(/pas dans la liste/)
    expect(issueForCommune(patchAnswers(answers, { commune: 'Métabief' }))).toBeNull()
    expect(issueForCommune(patchAnswers(answers, { commune: 'Pontarlier' }))).toBeNull()
    expect(issueForCommune(patchAnswers(answers, { commune: 'Vallorbe' }))).toBeNull()
    expect(issueForCommune(patchAnswers(answers, { commune: 'Domicile' }))).toMatch(/Choisissez/)
    expect(patchAnswers(emptyAnswers(), { civilite: 'madame', prenom: 'Ada', nom: 'Martin' }).civilite).toBe('madame')
    expect(sanitizeAnswers({ civilite: 'mademoiselle' }).civilite).toBe('')
    expect(questionSide('Pontarlier')).toBe('de')
    expect(questionSide('pontarlier')).toBe('de')
    expect(questionSide('Jougne')).toBe('vers')
    expect(issueForHousehold(answers)).toMatch(/chaque personne/)
    const ready = patchAnswers(answers, { people: [{ age: '15-17', drive: 'accompagnee', manqueAutonomie: false }] })
    expect(issueForHousehold(ready)).toBeNull()
    expect(personLine(ready.people[0])).toBe('15–17 ans, conduite accompagnée')
    const blocked = patchAnswers(answers, { people: [{ age: '65+', drive: 'non', manqueAutonomie: true }] })
    expect(blocked.people[0]?.manqueAutonomie).toBe(true)
    expect(personLine(blocked.people[0])).toBe('65 ans et plus, ne conduit pas, manque d’autonomie')
    const child = patchAnswers(answers, { people: [{ age: '0-14', drive: 'non', manqueAutonomie: true }] })
    expect(child.people[0]).toEqual({ age: '0-14', drive: '', manqueAutonomie: false })
    expect(issueForHousehold(child)).toBeNull()
    expect(personLine(child.people[0])).toBe('0–14 ans')
    expect(issueForHousehold(patchAnswers(answers, { people: [{ age: '15-17', drive: '', manqueAutonomie: false }] }))).toMatch(/conduite/)
    const driver = patchAnswers(answers, { people: [{ age: '40-64', drive: 'oui', manqueAutonomie: true }] })
    expect(driver.people[0]?.manqueAutonomie).toBe(false)
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
    expect(clean.people[0]).toEqual({ age: '', drive: 'oui', manqueAutonomie: false })
    expect(clean.people[1]).toEqual({ age: '65+', drive: 'non', manqueAutonomie: false })
    expect(clean.cars).toHaveLength(8)
    expect(clean.cars[0]?.sansPermis).toBe(false)
    expect(clean.twoWheelers[0]?.motor).toBe('')
    expect(hasAnyAnswer(emptyAnswers())).toBe(false)
    expect(hasAnyAnswer(clean)).toBe(true)
    expect(changePerson(clean.people, 0, { age: '0-14' })[0]?.age).toBe('0-14')
  })

  test('demande le téléphone pour un rappel, et l’adresse mail seulement pour le collectif', () => {
    const answers = emptyAnswers()
    expect(issueForContact(answers)).toMatch(/devenir enquêteur/)
    const declined = patchAnswers(answers, { enqueteur: 'non' })
    expect(issueForContact(declined)).toBeNull()
    const refused = patchAnswers(declined, { recontact: 'non', phone: '06 12 34 56 78', email: 'Ada@Exemple.fr' })
    expect(issueForContact(refused)).toBeNull()
    expect(refused.phone).toBe('')
    expect(refused.email).toBe('')
    const called = patchAnswers(declined, { recontact: 'oui' })
    expect(issueForContact(called)).toMatch(/téléphone/)
    expect(issueForContact(patchAnswers(called, { phone: 'bureau' }))).toMatch(/chiffre/)
    const reached = patchAnswers(called, { phone: '+33 6 12 34 56 78', email: 'Ada@Exemple.fr' })
    expect(issueForContact(reached)).toBeNull()
    expect(reached.email).toBe('')
    const news = patchAnswers(reached, { collectif: true, email: 'PasUnMail' })
    expect(issueForContact(news)).toMatch(/adresse mail/)
    const ready = patchAnswers(news, { email: 'Ada@Exemple.fr' })
    expect(issueForContact(ready)).toBeNull()
    expect(ready.email).toBe('ada@exemple.fr')
    const dropped = patchAnswers(ready, { collectif: false })
    expect(dropped.email).toBe('')
    expect(dropped.phone).toBe('+33 6 12 34 56 78')
    const hungUp = patchAnswers(dropped, { recontact: 'non' })
    expect(hungUp.phone).toBe('')
    const recruit = patchAnswers(hungUp, { enqueteur: 'oui' })
    expect(issueForContact(recruit)).toMatch(/téléphone/)
    const recruitPhone = patchAnswers(recruit, { phone: '06 12 34 56 78' })
    expect(issueForContact(recruitPhone)).toMatch(/adresse mail/)
    const recruitReady = patchAnswers(recruitPhone, { email: 'Ada@Exemple.fr' })
    expect(issueForContact(recruitReady)).toBeNull()
    expect(recruitReady.phone).toBe('06 12 34 56 78')
    expect(recruitReady.email).toBe('ada@exemple.fr')
    expect(patchAnswers(recruitReady, { enqueteur: 'non' }).phone).toBe('')
    expect(patchAnswers(recruitReady, { enqueteur: 'non' }).email).toBe('')
    const remembered = patchAnswers(emptyAnswers(), {
      recontact: 'oui',
      recontactText: 'Phrase cochée pour le téléphone',
      phone: '06 12 34 56 78',
      collectif: true,
      collectifText: 'Phrase cochée pour le collectif',
      email: 'ada@exemple.fr',
    })
    expect(remembered.recontactText).toBe('Phrase cochée pour le téléphone')
    expect(remembered.collectifText).toBe('Phrase cochée pour le collectif')
    expect(patchAnswers(remembered, { recontact: 'non' }).recontactText).toBe('')
    expect(patchAnswers(remembered, { collectif: false }).collectifText).toBe('')
    expect(patchAnswers(emptyAnswers(), { adresse: '11 ' }).adresse).toBe('11 ')
    expect(patchAnswers(emptyAnswers(), { adresse: '11 rue de la gare' }).adresse).toBe('11 rue de la gare')
    const place = '11%20rue%20de%20la%20gare%2C%20Chaux-Neuve'
    expect(mapsDestination({ adresse: '11 rue de la gare', commune: 'Chaux-Neuve' })).toBe(
      `https://www.google.com/maps/search/?api=1&query=${place}`,
    )
    expect(mapsDestination({ adresse: '11 rue de la gare', commune: 'Chaux-Neuve' }, 'apple')).toBe(`https://maps.apple.com/?q=${place}`)
    expect(mapsDestination({ adresse: '11 rue de la gare', commune: 'Chaux-Neuve' }, 'osm')).toBe(
      `https://www.openstreetmap.org/search?query=${place}`,
    )
    expect(mapsDestination({ adresse: '11 rue de la gare', commune: 'Chaux-Neuve' }, 'mappy')).toBe(
      `https://fr.mappy.com/plan#/search/${place}`,
    )
    expect(mapsDestination({ adresse: '11 rue de la gare', commune: 'Chaux-Neuve' }, 'mapy')).toBe(
      `https://mapy.com/fnc/v1/search?query=${place}`,
    )
    expect(mapsDestination({ adresse: '11 rue de la gare', commune: 'Chaux-Neuve' }, 'waze')).toBe(`https://www.waze.com/ul?q=${place}`)
    expect(mapsDestination({ adresse: '  ', commune: 'Chaux-Neuve' })).toBeNull()
    expect(mapsDestination({ adresse: '11 rue de la gare', commune: '' })).toBeNull()
    expect(patchAnswers(emptyAnswers(), { recontact: 'oui', phone: '+33 ' }).phone).toBe('+33 ')
    expect(respondentPhone('  +33 6 12 34 56 78  ')).toBe('+33 6 12 34 56 78')
    expect(respondentPhone('')).toBe('')
  })

  test('une fiche de l’ancien questionnaire ne fait pas planter l’accueil', () => {
    expect(answerPreview({ habitation: 'Centre', age: '35-49' })).toBe('Centre')
    expect(answerPreview(undefined)).toBe('Commune non précisée')
  })
})
