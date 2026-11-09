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
    return readListsPayload(JSON.parse(raw))
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

function requestSheetLists(endpoint: string, query: ConfigQuery): Promise<SheetLists> {
  const target = classifyEndpoint(endpoint)
  if (!target.ok || target.kind !== 'google-script') {
    return Promise.reject(new Error('Le tableur n’est pas branché.'))
  }
  const callbackName = `qmConfig_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const url = new URL(target.url)
  url.searchParams.set('callback', callbackName)
  if (query.device) url.searchParams.set('device', query.device)
  if (query.who) url.searchParams.set('who', query.who)
  if (query.action) url.searchParams.set('action', query.action)
  if (query.interviewer) url.searchParams.set('interviewer', query.interviewer)
  if (query.target) url.searchParams.set('target', query.target)
  if (query.phone) url.searchParams.set('phone', query.phone)

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    let settled = false
    const timer = window.setTimeout(() => finish(new Error('Les feuilles Enquêteurs et Communes ne répondent pas.')), 12000)

    function finish(error?: Error, lists?: SheetLists) {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      delete (window as unknown as Record<string, unknown>)[callbackName]
      script.remove()
      if (error) reject(error)
      else resolve(lists as SheetLists)
    }

    ;(window as unknown as Record<string, (payload: unknown) => void>)[callbackName] = (payload) => {
      try {
        finish(undefined, readListsPayload(payload))
      } catch (error) {
        finish(error instanceof Error ? error : new Error('Liste illisible.'))
      }
    }
    script.src = url.toString()
    script.onerror = () => finish(new Error('Impossible de lire les feuilles Enquêteurs et Communes.'))
    document.head.appendChild(script)
  })
}
