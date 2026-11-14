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
  })
})