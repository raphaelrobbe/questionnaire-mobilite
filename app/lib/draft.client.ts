import {
  TEST_SAMPLE_COUNT,
  draftHasContent,
  draftIsStarted,
  emptyDraft,
  missingTestSampleDrafts,
  reorderDrafts,
  sanitizeDraft,
  testSampleDrafts,
  type Draft,
} from '~/common/draft'
import { isResponseCode, responseCode } from '~/common/response'
import { forgetPersonal, holdsPersonal } from '~/common/response'
import { loadSettings } from '~/lib/settings.client'

export type { Draft }

const KEY = 'qm-drafts'
const LEGACY = 'qm-draft'
const SAMPLES_KEY = 'qm-test-samples'

function readAll(): Draft[] {
  migrateLegacy()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const drafts: Draft[] = []
    for (const item of parsed) {
      const draft = sanitizeDraft(item)
      if (draft) drafts.push(draft)
    }
    return drafts
  } catch {
    return []
  }
}

function writeAll(drafts: Draft[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(drafts))
  } catch {
    /* Le téléphone gardera les fiches seulement pour cette page. */
  }
}

function migrateLegacy(): void {
  try {
    const raw = sessionStorage.getItem(LEGACY)
    if (!raw) return
    sessionStorage.removeItem(LEGACY)
    const draft = sanitizeDraft(JSON.parse(raw))
    if (!draft || !draftIsStarted(draft)) return
    const current = localStorage.getItem(KEY)
    const parsed = current ? JSON.parse(current) : []
    const list = Array.isArray(parsed) ? parsed : []
    if (list.some((item) => item && typeof item === 'object' && (item as { code?: string }).code === draft.code)) return
    localStorage.setItem(KEY, JSON.stringify([draft, ...list]))
  } catch {
    /* L’ancien brouillon d’onglet est ignoré. */
  }
}

export function listDrafts(): Draft[] {
  const drafts = readAll()
  const kept = drafts.filter(draftHasContent)
  if (kept.length !== drafts.length) writeAll(kept)
  return kept
}

export function loadDraft(code: string): Draft | null {
  return readAll().find((draft) => draft.code === code) ?? null
}

export function saveDraft(draft: Draft): void {
  if (!draftHasContent(draft)) {
    removeDraft(draft.code)
    return
  }
  const drafts = readAll()
  const index = drafts.findIndex((item) => item.code === draft.code)
  if (index < 0) {
    writeAll([draft, ...drafts])
    return
  }
  const next = drafts.slice()
  next[index] = draft
  writeAll(next)
}

/** Enregistre l’ordre choisi pour la tournée, sans mélanger les fiches d’un autre mode. */
export function orderDrafts(codes: readonly string[]): Draft[] {
  const current = readAll()
  const next = reorderDrafts(current, codes)
  if (next !== current) writeAll(next)
  return next.filter(draftHasContent)
}

export function removeDraft(code: string): void {
  writeAll(readAll().filter((draft) => draft.code !== code))
}

/** Efface les informations personnelles d’une fiche encore dans le navigateur. */
export function forgetDraftPersonal(code: string): void {
  const drafts = readAll()
  const index = drafts.findIndex((draft) => draft.code === code)
  const draft = drafts[index]
  if (!draft || !holdsPersonal(draft)) return
  drafts[index] = forgetPersonal(draft)
  writeAll(drafts)
}

function reserveCodes(taken: Set<string>, count: number): string[] {
  const codes: string[] = []
  while (codes.length < count) {
    const code = responseCode()
    if (!isResponseCode(code) || taken.has(code) || codes.includes(code)) continue
    codes.push(code)
  }
  return codes
}

function rememberSamples(): void {
  try {
    localStorage.setItem(SAMPLES_KEY, '1')
  } catch {
    /* Les fiches sont déjà là. Le prochain passage évitera de les refaire si le drapeau a pu s’écrire. */
  }
}

/** Vrai une fois que les fiches d’exemple ont déjà été créées au moins une fois. */
export function testSamplesSeeded(): boolean {
  try {
    return localStorage.getItem(SAMPLES_KEY) === '1'
  } catch {
    return false
  }
}

/** Fiches d’exemple, une seule fois, au premier passage en mode test. */
export function seedTestSamples(): void {
  if (testSamplesSeeded()) return
  const current = readAll()
  writeAll([...testSampleDrafts(reserveCodes(new Set(current.map((draft) => draft.code)), TEST_SAMPLE_COUNT)), ...current])
  rememberSamples()
}

/** Rajoute les fiches d’exemple absentes, même si le premier passage a déjà eu lieu. */
export function recreateTestSamples(): void {
  const current = readAll()
  const missing = missingTestSampleDrafts(current, reserveCodes(new Set(current.map((draft) => draft.code)), TEST_SAMPLE_COUNT))
  if (missing.length > 0) writeAll([...missing, ...current])
  rememberSamples()
}

export function createDraft(): Draft {
  const draft = { ...emptyDraft(), test: loadSettings().testMode }
  const rest = readAll().filter((item) => item.code !== draft.code)
  writeAll([draft, ...rest])
  return draft
}
