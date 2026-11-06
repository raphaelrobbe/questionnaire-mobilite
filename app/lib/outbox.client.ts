import { classifyEndpoint } from '~/common/endpoint'
import type { ResponseRecord } from '~/common/response'
import { loadSettings } from './settings.client'
import { submitRecord, type SendStatus } from './sheets.client'

const DB_NAME = 'questionnaire-mobilite'
const STORE = 'responses'
const VERSION = 1

export type LocalStatus = 'pending' | 'error' | SendStatus

export type LocalResponse = ResponseRecord & {
  status: LocalStatus
  lastError: string | null
  attempts: number
  updatedAt: string
}

const listeners = new Set<() => void>()
let tail: Promise<unknown> = Promise.resolve()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeOutbox(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function lock<T>(task: () => Promise<T>): Promise<T> {
  const run = tail.then(task, task)
  tail = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        let settled = false
        const finish = (error?: unknown, value?: T) => {
          if (settled) return
          settled = true
          if (error) reject(error)
          else resolve(value as T)
        }
        const transaction = db.transaction(STORE, mode)
        const request = run(transaction.objectStore(STORE))
        request.onsuccess = () => finish(undefined, request.result)
        request.onerror = () => finish(request.error)
        transaction.oncomplete = () => db.close()
        transaction.onerror = () => {
          db.close()
          finish(transaction.error)
        }
        transaction.onabort = () => {
          db.close()
          finish(transaction.error)
        }
      }),
  )
}

export async function listResponses(): Promise<LocalResponse[]> {
  const rows = await withStore<LocalResponse[]>('readonly', (store) => store.getAll() as IDBRequest<LocalResponse[]>)
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

async function read(id: string): Promise<LocalResponse | null> {
  const row = await withStore<LocalResponse | undefined>('readonly', (store) => store.get(id))
  return row ?? null
}

async function write(row: LocalResponse): Promise<void> {
  await withStore('readwrite', (store) => store.put(row))
  emit()
}

export async function keepResponse(record: ResponseRecord): Promise<LocalResponse> {
  const row: LocalResponse = {
    ...record,
    answers: { ...record.answers, frictions: [...record.answers.frictions] },
    status: 'pending',
    lastError: null,
    attempts: 0,
    updatedAt: new Date().toISOString(),
  }
  await write(row)
  return row
}

export async function removeResponse(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
  emit()
}

function toRecord(row: LocalResponse): ResponseRecord {
  return {
    id: row.id,
    createdAt: row.createdAt,
    deviceId: row.deviceId,
    interviewer: row.interviewer,
    place: row.place,
    latitude: row.latitude,
    longitude: row.longitude,
    answers: row.answers,
  }
}

async function attempt(row: LocalResponse): Promise<LocalResponse> {
  const settings = loadSettings()
  const classified = classifyEndpoint(settings.endpoint)
  if (!classified.ok || !navigator.onLine) return row
  try {
    const status = await submitRecord(toRecord(row), classified.url, settings.token.trim())
    const next: LocalResponse = {
      ...row,
      status,
      lastError: null,
      attempts: row.attempts + 1,
      updatedAt: new Date().toISOString(),
    }
    await write(next)
    return next
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Envoi impossible.'
    const next: LocalResponse = {
      ...row,
      status: 'error',
      lastError: message.slice(0, 240),
      attempts: row.attempts + 1,
      updatedAt: new Date().toISOString(),
    }
    await write(next)
    return next
  }
}

export function flushOne(id: string): Promise<LocalResponse | null> {
  return lock(async () => {
    const row = await read(id)
    if (!row || row.status === 'confirmed' || row.status === 'sent') return row
    return attempt(row)
  })
}

export function retryResponse(id: string): Promise<LocalResponse | null> {
  return lock(async () => {
    const row = await read(id)
    if (!row) return null
    const pending: LocalResponse = { ...row, status: 'pending', lastError: null, updatedAt: new Date().toISOString() }
    await write(pending)
    return attempt(pending)
  })
}

export function flushOutbox(): Promise<void> {
  return lock(async () => {
    const rows = await listResponses()
    for (const row of rows) {
      if (row.status === 'confirmed' || row.status === 'sent') continue
      await attempt(row)
    }
  })
}

export function startAutoSync(): () => void {
  const run = () => {
    void flushOutbox()
  }
  const onVisible = () => {
    if (document.visibilityState === 'visible') run()
  }
  window.addEventListener('online', run)
  document.addEventListener('visibilitychange', onVisible)
  run()
  return () => {
    window.removeEventListener('online', run)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

export function statusLabel(status: LocalStatus): string {
  switch (status) {
    case 'pending':
      return 'À envoyer'
    case 'error':
      return 'Échec'
    case 'sent':
      return 'Envoyée'
    case 'confirmed':
      return 'Confirmée'
  }
}
