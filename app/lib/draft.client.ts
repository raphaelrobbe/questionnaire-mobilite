import { draftIsStarted, emptyDraft, sanitizeDraft, type Draft } from '~/common/draft'

export type { Draft }

const KEY = 'qm-drafts'
const LEGACY = 'qm-draft'

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
  return readAll()
}

export function loadDraft(code: string): Draft | null {
  return readAll().find((draft) => draft.code === code) ?? null
}

export function saveDraft(draft: Draft): void {
  const rest = readAll().filter((item) => item.code !== draft.code)
  writeAll([draft, ...rest])
}

export function removeDraft(code: string): void {
  writeAll(readAll().filter((draft) => draft.code !== code))
}

export function createDraft(): Draft {
  const draft = emptyDraft()
  saveDraft(draft)
  return draft
}
