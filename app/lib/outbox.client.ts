import { DeviceUnknown } from '~/common/config'
import { classifyEndpoint } from '~/common/endpoint'
import { ARRIVAL_TRIES, ArrivalStopped, pollArrival } from '~/common/receipt'
import { responseIsKept, type ResponseRecord } from '~/common/response'
import { loadSettings, updateSettings } from './settings.client'
import { codeIsStored, confirmInterviewer, submitRecord, type SendStatus } from './sheets.client'

const DB_NAME = 'questionnaire-mobilite'
const STORE = 'responses'
const VERSION = 1

export type LocalStatus = 'pending' | 'error' | SendStatus

export type LocalResponse = ResponseRecord & {
  status: LocalStatus
  lastError: string | null
  attempts: number
  lookups: number
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

function counted(row: LocalResponse): LocalResponse {
  return {
    ...row,
    test: row.test === true,
    lookups: typeof row.lookups === 'number' && Number.isFinite(row.lookups) ? row.lookups : 0,
  }
}

export async function listResponses(): Promise<LocalResponse[]> {
  const rows = await withStore<LocalResponse[]>('readonly', (store) => store.getAll() as IDBRequest<LocalResponse[]>)
  const countedRows = rows.map(counted)
  for (const row of countedRows) {
    if (!responseIsKept(row)) await removeResponse(row.id)
  }
  return countedRows.filter((row) => responseIsKept(row)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

async function read(id: string): Promise<LocalResponse | null> {
  const row = await withStore<LocalResponse | undefined>('readonly', (store) => store.get(id))
  return row ? counted(row) : null
}

async function write(row: LocalResponse): Promise<void> {
  await withStore('readwrite', (store) => store.put(row))
  emit()
}

export async function keepResponse(record: ResponseRecord): Promise<LocalResponse> {
  if (!responseIsKept(record)) throw new Error('Cette réponse n’est pas enregistrée.')
  const row: LocalResponse = {
    ...record,
    answers: {
      ...record.answers,
      people: record.answers.people.map((person) => ({ ...person })),
      cars: record.answers.cars.map((vehicle) => ({ ...vehicle })),
      twoWheelers: record.answers.twoWheelers.map((vehicle) => ({ ...vehicle })),
    },
    status: 'pending',
    lastError: null,
    attempts: 0,
    lookups: 0,
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
    test: row.test === true,
    latitude: row.latitude,
    longitude: row.longitude,
    answers: row.answers,
  }
}

async function attempt(row: LocalResponse): Promise<LocalResponse | null> {
  const settings = loadSettings()
  const classified = classifyEndpoint(settings.endpoint)
  if (!classified.ok || !navigator.onLine) return row
  if (!responseIsKept(row)) {
    await removeResponse(row.id)
    return null
  }
  try {
    const interviewer = row.test ? row.interviewer.trim() || 'Test' : await confirmInterviewer(settings.adminEndpoint, row.deviceId)
    const status = await submitRecord({ ...toRecord(row), interviewer, test: row.test }, classified.url, settings.adminEndpoint)
    const next: LocalResponse = {
      ...row,
      interviewer,
      status,
      lastError: null,
      attempts: row.attempts + 1,
      lookups: status === 'sent' ? 0 : row.lookups,
      updatedAt: new Date().toISOString(),
    }
    await write(next)
    return next
  } catch (error) {
    if (error instanceof DeviceUnknown) {
      updateSettings({ interviewer: '' })
      await removeResponse(row.id)
      return null
    }
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
  }).then((row) => {
    if (row?.status === 'sent') confirmArrival(row.id)
    return row
  })
}

export function retryResponse(id: string): Promise<LocalResponse | null> {
  return lock(async () => {
    const row = await read(id)
    if (!row) return null
    const pending: LocalResponse = { ...row, status: 'pending', lastError: null, updatedAt: new Date().toISOString() }
    await write(pending)
    return attempt(pending)
  }).then((row) => {
    if (row?.status === 'sent') confirmArrival(row.id)
    return row
  })
}

export function flushOutbox(): Promise<void> {
  const sentIds: string[] = []
  return lock(async () => {
    const rows = await listResponses()
    for (const row of rows) {
      if (row.status === 'confirmed' || row.status === 'sent') continue
      const next = await attempt(row)
      if (next?.status === 'sent') sentIds.push(next.id)
    }
  }).then(() => {
    for (const id of sentIds) confirmArrival(id)
  })
}

const checking = new Set<string>()

function confirmArrival(id: string) {
  if (checking.has(id)) return
  checking.add(id)
  void watchArrival(id).finally(() => checking.delete(id))
}

async function resumeArrivalChecks(): Promise<void> {
  const rows = await listResponses()
  for (const row of rows) {
    if (row.status === 'sent' && row.lookups < ARRIVAL_TRIES) confirmArrival(row.id)
  }
}

async function watchArrival(id: string): Promise<void> {
  const settings = loadSettings()
  const classified = classifyEndpoint(settings.endpoint)
  if (!classified.ok || classified.kind !== 'google-script') return
  const current = await read(id)
  if (!current || current.status !== 'sent' || current.lookups >= ARRIVAL_TRIES) return
  const found = await pollArrival({
    wait: delay,
    lookup: async () => {
      if (!navigator.onLine) throw new ArrivalStopped()
      const row = await read(id)
      if (!row || row.status !== 'sent') throw new ArrivalStopped()
      return codeIsStored(classified.url, row.id, row.test)
    },
    onMiss: async () => {
      let stop = false
      await lock(async () => {
        const row = await read(id)
        if (!row || row.status !== 'sent') {
          stop = true
          return
        }
        const lookups = row.lookups + 1
        await write({ ...row, lookups, updatedAt: new Date().toISOString() })
        if (lookups >= ARRIVAL_TRIES) stop = true
      })
      return stop ? 'stop' : 'continue'
    },
  })
  if (!found) return
  await lock(async () => {
    const row = await read(id)
    if (!row || row.status !== 'sent') return
    await write({
      ...row,
      status: 'confirmed',
      lookups: row.lookups + 1,
      lastError: null,
      updatedAt: new Date().toISOString(),
    })
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function startAutoSync(): () => void {
  const run = () => {
    void flushOutbox().then(() => resumeArrivalChecks())
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
      return 'Enregistrée'
  }
}
