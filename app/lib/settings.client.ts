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

function configured(name: 'VITE_SHEETS_WEBAPP_URL' | 'VITE_ADMIN_WEBAPP_URL'): string {
  const preset = import.meta.env[name]
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
  return {
    ...readStored(),
    endpoint: configured('VITE_SHEETS_WEBAPP_URL'),
    adminEndpoint: configured('VITE_ADMIN_WEBAPP_URL'),
  }
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next = sanitizeSettings({ ...loadSettings(), ...patch })
  localStorage.setItem(KEY, JSON.stringify(next))
  emit()
  return next
}

export async function copyText(value: string): Promise<boolean> {
  if (!value) return false
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    /* Le navigateur a refusé l’accès au presse-papiers. */
  }
  try {
    const area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
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
