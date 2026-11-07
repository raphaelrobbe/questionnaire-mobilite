import { emptySettings, sanitizeSettings, type Settings } from '~/common/settings'

const KEY = 'qm-settings'
const DEVICE_KEY = 'qm-device'

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function configuredEndpoint(): string {
  const preset = import.meta.env.VITE_SHEETS_WEBAPP_URL
  return typeof preset === 'string' ? preset.slice(0, 400) : ''
}

function readStored(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptySettings()
    return sanitizeSettings(JSON.parse(raw))
  } catch {
    return emptySettings()
  }
}

export function loadSettings(): Settings {
  return { ...readStored(), endpoint: configuredEndpoint() }
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next = sanitizeSettings({ ...loadSettings(), ...patch })
  localStorage.setItem(KEY, JSON.stringify(next))
  emit()
  return next
}

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, created)
    return created
  } catch {
    return 'appareil-inconnu'
  }
}
