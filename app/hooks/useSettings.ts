import { useEffect, useState } from 'react'
import { loadSettings, subscribeSettings } from '~/lib/settings.client'
import type { Settings } from '~/common/settings'

export function useSettings(): Settings | null {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    setSettings(loadSettings())
    return subscribeSettings(() => setSettings(loadSettings()))
  }, [])

  return settings
}
