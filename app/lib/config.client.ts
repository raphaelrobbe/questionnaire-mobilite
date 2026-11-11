import { readListsPayload, type SheetLists } from '~/common/config'
import { classifyEndpoint } from '~/common/endpoint'

const KEY = 'qm-sheet-lists'
const listeners = new Set<() => void>()
let inflightKey = ''
let inflight: Promise<SheetLists> | null = null

export type ConfigQuery = {
  device?: string
  who?: string
  action?: 'add' | 'remove' | 'create'
  interviewer?: string
  target?: string
  phone?: string
}

export function subscribeCachedLists(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function publishLists(lists: SheetLists): void {
  saveCachedLists(lists)
  for (const listener of listeners) listener()
}

export function loadCachedLists(): SheetLists | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    const lists = readListsPayload(parsed)
    if (parsed && typeof parsed === 'object' && 'communes' in parsed) saveCachedLists(lists)
    return lists
  } catch {
    return null
  }
}

export function saveCachedLists(lists: SheetLists): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(lists))
  } catch {
    /* Le téléphone gardera la liste seulement pour cette page. */
  }
}

export function fetchSheetLists(endpoint: string, query: ConfigQuery = {}): Promise<SheetLists> {
  const key = JSON.stringify({ endpoint, ...query })
  if (!query.action && inflight && inflightKey === key) return inflight
  const request = requestSheetLists(endpoint, query)
  if (query.action) return request
  inflightKey = key
  inflight = request.finally(() => {
    if (inflightKey === key) inflight = null
  })
  return inflight
}

const LISTS_SILENCE = 'La feuille Enquêteurs ne répond pas.'

async function requestSheetLists(endpoint: string, query: ConfigQuery): Promise<SheetLists> {
  const target = classifyEndpoint(endpoint)
  if (!target.ok || target.kind !== 'google-script') {
    throw new Error('Le tableur n’est pas branché.')
  }
  const url = new URL(target.url)
  if (query.device) url.searchParams.set('device', query.device)
  if (query.who) url.searchParams.set('who', query.who)
  if (query.action) url.searchParams.set('action', query.action)
  if (query.interviewer) url.searchParams.set('interviewer', query.interviewer)
  if (query.target) url.searchParams.set('target', query.target)
  if (query.phone) url.searchParams.set('phone', query.phone)
  return readListsPayload(await getScriptJson(url, 12000, LISTS_SILENCE))
}

/**
 * Lecture directe. Une balise script ne s'exécute pas sur le téléphone après la redirection
 * de script.google.com, et l'appel restait sans réponse jusqu'au délai.
 */
export async function getScriptJson(url: URL, timeoutMs: number, timeoutMessage: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store', signal: controller.signal })
    if (!response.ok) throw new Error(timeoutMessage)
    return await response.json()
  } catch (error) {
    if (error instanceof Error && error.message === timeoutMessage) throw error
    throw new Error(timeoutMessage)
  } finally {
    window.clearTimeout(timer)
  }
}
