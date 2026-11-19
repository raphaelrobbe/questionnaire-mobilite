import { describe, expect, test } from 'vitest'
import { QUESTIONNAIRE, findQuestion, questionText, type Question } from './questionnaire'

function walk(questions: readonly Question[], ids: string[]) {
  for (const question of questions) {
    ids.push(question.id)
    if (question.each) walk(question.each.questions, ids)
    if (question.children) walk(question.children, ids)
  }
}

describe('questionnaire', () => {
  test('donne un identifiant unique à chaque question, et une condition lisible aux questions facultatives', () => {
    const ids: string[] = []
    for (const part of QUESTIONNAIRE) walk(part.questions, ids)
    expect(new Set(ids).size).toBe(ids.length)
    expect(findQuestion('electoral')?.when).toMatch(/18 ans/)
    expect(findQuestion('trip-transit')?.when).toMatch(/train/)
    expect(questionText('commune')).toMatch(/commune/)
    expect(findQuestion('trip-out')?.inline).toBe(true)
    expect(findQuestion('difficulty')?.inline).toBeUndefined()
    expect(findQuestion('difficulty')?.each?.intro).toMatch(/catégories ci-dessous/)
    expect(findQuestion('difficulty-pace')?.ask).toMatch(/fréquence/)
    expect(findQuestion('difficulty-circulation')?.children).toBeUndefined()
    expect(questionText('difficulty-pace')).toBe('À quelle fréquence ?')
    expect(findQuestion('life-choices')?.choices?.at(-2)).toBe('Autres')
    expect(findQuestion('reasons')?.choices).toContain('Ne pas être seul·e, partager le trajet avec quelqu’un')
    expect(findQuestion('conditions')?.choices).toContain('Avoir confiance dans les covoitureurs et covoitureuses')
    expect(findQuestion('barriers')?.choices).toContain('Manque de confiance dans les covoitureurs et covoitureuses')
    const adaptations = findQuestion('handicap')
    expect(adaptations?.ask).toMatch(/services adaptés/)
    expect(findQuestion('handicap-concern')).toBeUndefined()
    expect(findQuestion('handicap-who')?.when).toMatch(/adaptation est retenue/)
    expect(adaptations?.choiceNotes?.['Accessibilité pour les personnes à mobilité réduite (fauteuil roulant, difficultés à marcher, etc.)']).toMatch(/rampe d’accès PMR/)
    expect(adaptations?.choiceNotes?.['Autre (à préciser)']).toMatch(/handicap invisible/)
    expect(adaptations?.choices).toContain('Aide à la montée et à la descente des véhicules')
    expect(adaptations?.choiceNotes?.['Aide à la montée et à la descente des véhicules']).toBeUndefined()
  })
})