import { useEffect, useState } from 'react'
import { listResponses, subscribeOutbox, type LocalResponse } from '~/lib/outbox.client'

export function useOutbox(): { rows: LocalResponse[] | null; error: string | null } {
  const [rows, setRows] = useState<LocalResponse[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    const pull = () => {
      void listResponses()
        .then((items) => {
          if (!live) return
          setRows(items)
          setError(null)
        })
        .catch(() => {
          if (!live) return
          setError('La mémoire du téléphone ne s’ouvre pas.')
          setRows((current) => current ?? [])
        })
    }
    pull()
    const unsubscribe = subscribeOutbox(pull)
    return () => {
      live = false
      unsubscribe()
    }
  }, [])

  return { rows, error }
}
