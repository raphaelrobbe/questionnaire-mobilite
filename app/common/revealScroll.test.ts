import { describe, expect, test } from 'vitest'
import { revealTarget } from './revealScroll'

describe('défilement d’une nouvelle question', () => {
  test('ne bouge pas si le bloc est déjà à l’écran', () => {
    expect(revealTarget({ top: 120, height: 80, viewTop: 0, viewBottom: 700, scrollY: 0, maxScroll: 400, below: 20 })).toBeNull()
  })

  test('va en bas de page si la question cachée tient entière', () => {
    expect(revealTarget({ top: 680, height: 90, viewTop: 0, viewBottom: 640, scrollY: 0, maxScroll: 420, below: 40 })).toBe(420)
  })

  test('découvre une question courte qui n’est pas en fin de page', () => {
    expect(revealTarget({ top: 700, height: 80, viewTop: 0, viewBottom: 640, scrollY: 0, maxScroll: 2500, below: 2000 })).toBe(140)
  })

  test('aligne le haut de la question s’il ne tient pas dans la page', () => {
    expect(revealTarget({ top: 500, height: 900, viewTop: 48, viewBottom: 640, scrollY: 200, maxScroll: 2000, below: 20 })).toBe(644)
  })
})
