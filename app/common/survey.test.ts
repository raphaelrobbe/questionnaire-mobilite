import { describe, expect, test } from 'vitest'
import { FRENCH_COMMUNITIES, frenchPostalCode } from './frenchCommunes'
import {
  addVehicle,
  answerPreview,
  appendVisit,
  buildSteps,
  changePerson,
  emptyAnswers,
  formatVisits,
  hasAnyAnswer,
  issueForCommune,
  issueForContact,
  issueForLifeChoices,
  issueForWalkDistance,
  setWalkDistance,
  setWalkNearby,
  setWalkNote,
  setWalkPoint,
  MODE_CONDITION_GROUPS,
  issueForModeConditions,
  setModeConditionNote,
  toggleModeCondition,
  issueForModeBarriers,
  issueForModeReasons,
  setModeBarrierNote,
  toggleModeBarrier,
  setModeNote,
  toggleLifeChoice,
  toggleLifePerson,
  toggleModeReason,
  questionSide,
  respondentPhone,
  issueForHandicap,
  issueForHousehold,
  issueForVehicles,
  patchAnswers,
  sanitizeAnswers,
  stepIssue,
  personLine,
  mapsDestination,
  summary,
} from './survey'

describe('questionnaire', () => {
  test('commence par le nom, la commune et l’adresse, puis la visite et l’accord', () => {
    expect(buildSteps(emptyAnswers()).map((step) => step.kind)).toEqual([
      'name',
      'commune',
      'address',
      'visit',
      'consent',
      'household',
      'vehicles',
      'motives',
      'reminders',
      'difficulties',
      'offers',
      'reasons',
      'conditions',
      'barriers',
      'walk',
      'life',
      'handicap',
      'contact',
      'closing',
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
    const ready = patchAnswers(answers, { people: [{ age: '15-17', drive: 'accompagnee', manqueAutonomie: false, electoral: '', electoralCommune: '' }] })
    expect(issueForHousehold(ready)).toBeNull()
    expect(personLine(ready.people[0])).toBe('15–17 ans, conduite accompagnée')
    const blocked = patchAnswers(answers, { people: [{ age: '65+', drive: 'non', manqueAutonomie: true, electoral: '', electoralCommune: '' }] })
    expect(blocked.people[0]?.manqueAutonomie).toBe(true)
    expect(personLine(blocked.people[0])).toBe('65 ans et plus, ne conduit pas, manque d’autonomie')
    const child = patchAnswers(answers, { people: [{ age: '0-14', drive: 'non', manqueAutonomie: true, electoral: '', electoralCommune: '' }] })
    expect(child.people[0]).toEqual({ age: '0-14', drive: '', manqueAutonomie: false, electoral: '', electoralCommune: '' })
    const adult = patchAnswers(answers, {
      commune: 'Pontarlier',
      people: [{ age: '40-64', drive: 'oui', manqueAutonomie: false, electoral: 'oui', electoralCommune: '' }],
    })
    expect(issueForHousehold(adult)).toMatch(/commune/)
    const listed = patchAnswers(adult, { people: [{ age: '40-64', drive: 'oui', manqueAutonomie: false, electoral: 'oui', electoralCommune: 'Pontarlier' }] })
    expect(issueForHousehold(listed)).toBeNull()
    expect(personLine(listed.people[0])).toBe('40–64 ans, conduit, inscrit à Pontarlier')
    const declined = patchAnswers(listed, { people: [{ age: '40-64', drive: 'oui', manqueAutonomie: false, electoral: 'non', electoralCommune: 'Pontarlier' }] })
    expect(declined.people[0]?.electoralCommune).toBe('')
    expect(personLine(declined.people[0])).toBe('40–64 ans, conduit, non inscrit')
    const swiss = patchAnswers(answers, {
      commune: 'Vallorbe',
      people: [{ age: '65+', drive: 'oui', manqueAutonomie: false, electoral: 'oui', electoralCommune: 'Vallorbe' }],
    })
    expect(issueForHousehold(swiss)).toBeNull()
    expect(issueForHousehold(patchAnswers(swiss, { people: [{ age: '65+', drive: 'oui', manqueAutonomie: false, electoral: 'oui', electoralCommune: 'Paris' }] }))).toMatch(/liste/)
    const minor = patchAnswers(answers, { people: [{ age: '15-17', drive: 'oui', manqueAutonomie: false, electoral: 'oui', electoralCommune: 'Pontarlier' }] })
    expect(minor.people[0]?.electoral).toBe('')
    expect(minor.people[0]?.electoralCommune).toBe('')
    expect(issueForHousehold(child)).toBeNull()
    expect(personLine(child.people[0])).toBe('0–14 ans')
    expect(issueForHousehold(patchAnswers(answers, { people: [{ age: '15-17', drive: '', manqueAutonomie: false, electoral: '', electoralCommune: '' }] }))).toMatch(/conduite/)
    const driver = patchAnswers(answers, { people: [{ age: '40-64', drive: 'oui', manqueAutonomie: true, electoral: '', electoralCommune: '' }] })
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
    expect(clean.people[0]).toEqual({ age: '', drive: 'oui', manqueAutonomie: false, electoral: '', electoralCommune: '' })
    expect(clean.people[1]).toEqual({ age: '65+', drive: 'non', manqueAutonomie: false, electoral: '', electoralCommune: '' })
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
    expect(issueForContact(recruit)).toMatch(/téléphone ou une adresse mail/)
    const recruitPhone = patchAnswers(recruit, { phone: '06 12 34 56 78' })
    expect(issueForContact(recruitPhone)).toBeNull()
    expect(recruitPhone.email).toBe('')
    const recruitMail = patchAnswers(recruit, { email: 'Ada@Exemple.fr' })
    expect(issueForContact(recruitMail)).toBeNull()
    expect(recruitMail.phone).toBe('')
    expect(issueForContact(patchAnswers(recruit, { phone: 'bureau' }))).toMatch(/chiffre/)
    expect(issueForContact(patchAnswers(recruit, { email: 'PasUnMail' }))).toMatch(/adresse mail/)
    const recruitReady = patchAnswers(recruitPhone, { email: 'Ada@Exemple.fr' })
    expect(issueForContact(recruitReady)).toBeNull()
    expect(recruitReady.phone).toBe('06 12 34 56 78')
    expect(recruitReady.email).toBe('ada@exemple.fr')
    expect(patchAnswers(recruitReady, { enqueteur: 'non' }).phone).toBe('')
    expect(patchAnswers(recruitReady, { enqueteur: 'non' }).email).toBe('')
    expect(issueForContact(patchAnswers(reached, { enqueteur: 'oui' }))).toBeNull()
    expect(issueForContact(patchAnswers(ready, { enqueteur: 'oui', email: '' }))).toMatch(/adresse mail/)
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
    const place = '11%20rue%20de%20la%20gare%2C%2025240%20Chaux-Neuve'
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
    expect(mapsDestination({ adresse: '1 rue du Lac', commune: 'Vallorbe' })).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('1 rue du Lac, Vallorbe')}`,
    )
    expect(frenchPostalCode('pontarlier')).toBe('25300')
    expect(FRENCH_COMMUNITIES.every((community) => community.communes.every((name) => /^25\d{3}$/.test(frenchPostalCode(name))))).toBe(true)
    expect(patchAnswers(emptyAnswers(), { recontact: 'oui', phone: '+33 ' }).phone).toBe('+33 ')
    expect(respondentPhone('  +33 6 12 34 56 78  ')).toBe('+33 6 12 34 56 78')
    expect(respondentPhone('')).toBe('')
  })

  test('garde chaque visite, avec son heure, et demande un choix avant de valider', () => {
    const at = '2026-11-11T12:00:00.000Z'
    const later = '2026-11-11T15:30:00.123Z'
    expect(stepIssue({ kind: 'visit' }, emptyAnswers())).toMatch(/Choisissez/)
    const once = appendVisit([], 'absente', at)
    const twice = appendVisit(once, 'commencer', later)
    expect(twice).toEqual([
      { outcome: 'absente', at },
      { outcome: 'commencer', at: later },
    ])
    expect(formatVisits(twice)).toBe(
      `${at} — La personne était absente\n${later} — Commencer l’enquête`,
    )
    const kept = sanitizeAnswers({ visits: [...twice, { outcome: 'ailleurs', at: 'hier' }, { outcome: 'inconnu', at }] })
    expect(kept.visits).toEqual(twice)
    expect(kept.startedAt).toBe('')
    expect(sanitizeAnswers({ startedAt: at, finishedAt: later }).finishedAt).toBe(later)
    expect(hasAnyAnswer(patchAnswers(emptyAnswers(), { visits: once }))).toBe(true)
  })

  test('un choix de vie désigne des personnes, et « non » reste à part', () => {
    const empty = emptyAnswers()
    expect(issueForLifeChoices(empty.lifeChoices)).toMatch(/changer/)
    const home = toggleLifeChoice(empty.lifeChoices, 'residence')
    expect(issueForLifeChoices(home)).toMatch(/personnes/)
    const named = toggleLifePerson(home, 'residence', 0)
    expect(issueForLifeChoices(named)).toBeNull()
    expect(named.people.residence).toEqual([0])
    const blocked = toggleLifeChoice(named, 'non')
    expect(blocked).toBe(named)
    const none = toggleLifeChoice(empty.lifeChoices, 'non')
    expect(issueForLifeChoices(none)).toBeNull()
    expect(toggleLifeChoice(none, 'emploi')).toBe(none)
    const kept = sanitizeAnswers({
      people: [{ age: '40-64', drive: 'oui' }, { age: '0-14' }],
      lifeChoices: { selected: ['achats', 'non', 'inconnu'], people: { achats: [1, 4, 1] }, notes: { achats: '  le marché  ' } },
    })
    expect(kept.lifeChoices.selected).toEqual(['non'])
    expect(kept.lifeChoices.people.achats).toBeUndefined()
    const noted = sanitizeAnswers({
      people: kept.people,
      lifeChoices: { selected: ['achats'], people: { achats: [1, 4] }, notes: { achats: '  le marché  ' } },
    })
    expect(noted.lifeChoices.selected).toEqual(['achats'])
    expect(noted.lifeChoices.people.achats).toEqual([1])
    expect(noted.lifeChoices.notes.achats).toBe('  le marché  ')
  })

  test('une raison de changer de mode est demandée, et « aucune » reste à part', () => {
    const empty = emptyAnswers()
    expect(issueForModeReasons(empty.modeReasons)).toMatch(/raison/)
    expect(stepIssue({ kind: 'reasons' }, empty)).toMatch(/raison/)
    const one = toggleModeReason(empty.modeReasons, 'stress')
    expect(issueForModeReasons(one)).toBeNull()
    expect(toggleModeReason(one, 'aucune')).toBe(one)
    const none = toggleModeReason(empty.modeReasons, 'aucune')
    expect(none.selected).toEqual(['aucune'])
    expect(issueForModeReasons(none)).toBeNull()
    expect(toggleModeReason(none, 'repos')).toBe(none)
    const noted = setModeNote(none, '  le soir  ')
    expect(noted.note).toBe('  le soir  ')
    expect(noted.selected).toEqual(['aucune'])
    const kept = sanitizeAnswers({
      modeReasons: { selected: ['autre', 'aucune', 'inconnu'], note: '  trop loin  ' },
    })
    expect(kept.modeReasons).toEqual({ selected: ['aucune'], note: '  trop loin  ' })
    const lines = Object.fromEntries(summary(patchAnswers(empty, { modeReasons: setModeNote(one, 'la neige') })).map((line) => [line.label, line.value]))
    expect(lines['Raisons de changer']).toContain('stress de la conduite')
    expect(lines['Raisons de changer']).toContain('la neige')
    expect(summary(patchAnswers(empty, { modeReasons: none })).find((line) => line.label === 'Raisons de changer')?.value).toBe(
      'Je ne changerais pas de mode de transport',
    )
  })

  test('une condition pour laisser la voiture est demandée, et « aucune » reste à part', () => {
    const empty = emptyAnswers()
    expect(issueForModeConditions(empty.modeConditions)).toMatch(/condition/)
    expect(stepIssue({ kind: 'conditions' }, empty)).toMatch(/condition/)
    expect(MODE_CONDITION_GROUPS[0]?.ids[0]).toBe('court')
    const one = toggleModeCondition(empty.modeConditions, 'min15')
    const both = toggleModeCondition(one, 'horaires')
    expect(both.selected).toEqual(['min15', 'horaires'])
    expect(issueForModeConditions(both)).toBeNull()
    expect(toggleModeCondition(both, 'aucune')).toBe(both)
    const none = toggleModeCondition(empty.modeConditions, 'aucune')
    expect(none.selected).toEqual(['aucune'])
    expect(toggleModeCondition(none, 'abonnement')).toBe(none)
    const noted = setModeConditionNote(none, '  le soir  ')
    expect(noted.note).toBe('  le soir  ')
    const kept = sanitizeAnswers({
      modeConditions: { selected: ['autre', 'aucune', 'inconnu'], note: '  trop loin  ' },
    })
    expect(kept.modeConditions).toEqual({ selected: ['aucune'], note: '  trop loin  ' })
    const lines = Object.fromEntries(
      summary(patchAnswers(empty, { modeConditions: setModeConditionNote(both, 'la neige') })).map((line) => [line.label, line.value]),
    )
    expect(lines.Conditions).toContain('15 minutes')
    expect(lines.Conditions).toContain('horaires adaptés')
    expect(lines.Conditions).toContain('la neige')
    const closing = patchAnswers(emptyAnswers(), { closingNote: '  une idée  ' })
    expect(closing.closingNote).toBe('  une idée  ')
    expect(stepIssue({ kind: 'closing' }, emptyAnswers())).toBeNull()
    expect(summary(closing).find((line) => line.label === 'Ajout')?.value).toBe('une idée')
    expect(summary(emptyAnswers()).some((line) => line.label === 'Ajout')).toBe(false)
  })

  test('un frein est demandé, et « aucun » reste à part', () => {
    const empty = emptyAnswers()
    expect(issueForModeBarriers(empty.modeBarriers)).toMatch(/frein/)
    expect(stepIssue({ kind: 'barriers' }, empty)).toMatch(/frein/)
    const one = toggleModeBarrier(empty.modeBarriers, 'fiabilite')
    expect(issueForModeBarriers(one)).toBeNull()
    expect(toggleModeBarrier(one, 'aucun')).toBe(one)
    const none = toggleModeBarrier(empty.modeBarriers, 'aucun')
    expect(none.selected).toEqual(['aucun'])
    expect(issueForModeBarriers(none)).toBeNull()
    expect(toggleModeBarrier(none, 'cout')).toBe(none)
    const noted = setModeBarrierNote(none, '  le soir  ')
    expect(noted.note).toBe('  le soir  ')
    expect(noted.selected).toEqual(['aucun'])
    const kept = sanitizeAnswers({
      modeBarriers: { selected: ['autre', 'aucun', 'inconnu'], note: '  trop loin  ' },
    })
    expect(kept.modeBarriers).toEqual({ selected: ['aucun'], note: '  trop loin  ' })
    const lines = Object.fromEntries(summary(patchAnswers(empty, { modeBarriers: setModeBarrierNote(one, 'la neige') })).map((line) => [line.label, line.value]))
    expect(lines.Freins).toContain('fiabilité')
    expect(lines.Freins).toContain('la neige')
  })

  test('la distance à l’arrêt est un choix unique, et la précision reste libre', () => {
    const empty = emptyAnswers()
    expect(issueForWalkDistance(empty.walkDistance)).toMatch(/distance/)
    expect(stepIssue({ kind: 'walk' }, empty)).toMatch(/distance/)
    const one = setWalkDistance(empty.walkDistance, 'm500')
    expect(one.choice).toBe('m500')
    expect(issueForWalkDistance(one)).toMatch(/arrêt/)
    const wished = setWalkNearby(one, 'non')
    expect(issueForWalkDistance(wished)).toMatch(/carte/)
    const point = setWalkPoint(wished, 46.9, 6.35)
    expect(point.latitude).toBe(46.9)
    expect(point.longitude).toBe(6.35)
    expect(issueForWalkDistance(point)).toBeNull()
    expect(setWalkNearby(point, 'oui').latitude).toBeNull()
    expect(setWalkDistance(point, 'km1').latitude).toBe(46.9)
    const other = setWalkDistance(one, 'jamais')
    expect(other.choice).toBe('jamais')
    expect(setWalkDistance(other, 'jamais').choice).toBe('')
    const noted = setWalkNote(other, '  s’il pleut  ')
    expect(noted.note).toBe('  s’il pleut  ')
    expect(noted.choice).toBe('jamais')
    const kept = sanitizeAnswers({ walkDistance: { choice: 'inconnu', nearby: 'peut-etre', latitude: 400, longitude: 6, note: '  la côte  ' } })
    expect(kept.walkDistance).toEqual({ choice: '', note: '  la côte  ', nearby: '', latitude: null, longitude: null })
    const lines = Object.fromEntries(summary(patchAnswers(empty, { walkDistance: setWalkNote(one, 'la côte') })).map((line) => [line.label, line.value]))
    expect(lines['Distance à l’arrêt']).toBe('Entre 200 et 500 mètres · la côte')
  })

  test('le handicap est obligatoire, et les précisions seulement si la réponse est oui', () => {
    expect(issueForHandicap(emptyAnswers())).toMatch(/oui, non/)
    expect(issueForHandicap(patchAnswers(emptyAnswers(), { handicap: 'non' }))).toBeNull()
    expect(issueForHandicap(patchAnswers(emptyAnswers(), { handicap: 'nsp' }))).toBeNull()
    const oui = patchAnswers(emptyAnswers(), { handicap: 'oui' })
    expect(issueForHandicap(oui)).toMatch(/adaptation/)
    const typed = patchAnswers(oui, { handicapTypes: ['vue', 'autre'], handicapAutre: '  rampe  ' })
    expect(typed.handicapTypes).toEqual(['vue', 'autre'])
    expect(typed.handicapAutre).toBe('  rampe  ')
    expect(issueForHandicap(patchAnswers(typed, { handicapAutre: '   ' }))).toMatch(/Précisez/)
    expect(issueForHandicap(typed)).toMatch(/concerne/)
    const aside = patchAnswers(typed, { handicapConcern: 'non', handicapWho: ['moi'] })
    expect(aside.handicapWho).toEqual([])
    expect(issueForHandicap(aside)).toBeNull()
    const dropped = sanitizeAnswers({ handicap: 'non', handicapTypes: ['vue'], handicapConcern: 'oui', handicapWho: ['moi'], handicapAutre: 'rampe' })
    expect(dropped.handicapTypes).toEqual([])
    expect(dropped.handicapConcern).toBe('')
    expect(dropped.handicapWho).toEqual([])
    expect(dropped.handicapAutre).toBe('')
    const lines = Object.fromEntries(summary(typed).map((line) => [line.label, line.value]))
    expect(lines.Handicap).toBe('Oui')
    expect(lines.Adaptations).toContain('malvoyantes')
    expect(lines.Adaptations).toContain('Autre : rampe')
    expect(lines['Qui est concerné']).toBeUndefined()
    const concerned = sanitizeAnswers({ ...typed, handicapConcern: 'oui', handicapWho: ['proche', 'moi', 'inconnu'] })
    expect(concerned.handicapConcern).toBe('oui')
    expect(concerned.handicapWho).toEqual(['moi', 'proche'])
    expect(issueForHandicap(concerned)).toBeNull()
    expect(hasAnyAnswer(patchAnswers(emptyAnswers(), { handicap: 'nsp' }))).toBe(true)
  })

  test('une fiche de l’ancien questionnaire ne fait pas planter l’accueil', () => {
    expect(answerPreview({ habitation: 'Centre', age: '35-49' })).toBe('Centre')
    expect(answerPreview(undefined)).toBe('Commune non précisée')
  })
})
