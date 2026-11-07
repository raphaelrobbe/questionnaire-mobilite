import { useEffect, useState } from 'react'
import type { SheetLists } from '~/common/config'
import { classifyEndpoint } from '~/common/endpoint'
import { fetchSheetLists, loadCachedLists, saveCachedLists, subscribeCachedLists } from '~/lib/config.client'
import { getDeviceId } from '~/lib/settings.client'
import { useSettings } from './useSettings'

export type SheetListsState = SheetLists & {
  status: 'loading' | 'ready' | 'error'
  message: string | null
}

const empty: SheetLists = { interviewers: [], communes: [] }

export function useSheetLists(): SheetListsState {
  const settings = useSettings()
  const endpoint = settings?.adminEndpoint ?? ''
  const interviewer = settings?.interviewer ?? ''
  const settingsReady = settings !== null
  const [lists, setLists] = useState<SheetLists>(empty)
  const [status, setStatus] = useState<SheetListsState['status']>('loading')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => subscribeCachedLists(() => {
    const cached = loadCachedLists()
    if (!cached) return
    setLists(cached)
    setStatus('ready')
    setMessage(null)
  }), [])

  useEffect(() => {
    if (!settingsReady) return
    const cached = loadCachedLists()
    if (cached) {
      setLists(cached)
      setStatus('ready')
    }
    const classified = classifyEndpoint(endpoint)
    if (!classified.ok || classified.kind !== 'google-script') {
      if (!cached) {
        setStatus('error')
        setMessage('Le tableur privé n’est pas branché.')
      }
      return
    }
    let cancelled = false
    void fetchSheetLists(classified.url, { device: getDeviceId(), who: interviewer })
      .then((next) => {
        if (cancelled) return
        saveCachedLists(next)
        setLists(next)
        setStatus('ready')
        setMessage(next.interviewers.length && next.communes.length ? null : 'La colonne « Prénom Nom » ou « Nom commune » est vide.')
      })
      .catch((error: unknown) => {
        if (cancelled || cached) return
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Listes indisponibles.')
      })
    return () => {
      cancelled = true
    }
  }, [settingsReady, endpoint, interviewer])

  return { ...lists, status, message }
}
