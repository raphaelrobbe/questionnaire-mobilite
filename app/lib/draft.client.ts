import { draftIsStarted, emptyDraft, sanitizeDraft, type Draft } from '~/common/draft'

export type { Draft }

const KEY = 'qm-draft'

export function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return sanitizeDraft(JSON.parse(raw))
  } catch {
    return null
  }
}

export function loadStartedDraft(): Draft | null {
  const draft = loadDraft()
  if (!draft || !draftIsStarted(draft)) return null
  return draft
}

export function saveDraft(draft: Draft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    /* Mode privé : le brouillon vit seulement dans la page. */
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* rien à effacer */
  }
}

export { emptyDraft }
