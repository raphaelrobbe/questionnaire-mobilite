import { Link } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { isAdminSession, normalizeDeviceId } from '~/common/config'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { fetchSheetLists, publishLists } from '~/lib/config.client'
import { getDeviceId } from '~/lib/settings.client'
import { buttonClass } from './Button'

export function AdminScreen() {
  const settings = useSettings()
  const lists = useSheetLists()
  const [deviceId, setDeviceId] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmKey, setConfirmKey] = useState<string | null>(null)

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  if (!settings || !deviceId || lists.status === 'loading') {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’administration…</p>
  }

  if (lists.status === 'error' || !isAdminSession(lists.interviewers, settings.interviewer)) {
    const message =
      lists.status === 'error'
        ? lists.message || 'Listes indisponibles.'
        : 'L’administration est réservée à un enquêteur marqué Admin, sur un appareil déjà autorisé pour lui.'
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Administration</h1>
        <p className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">{message}</p>
        <Link to="/reglages" className={buttonClass('secondary')}>
          Ouvrir les réglages
        </Link>
      </div>
    )
  }

  const hidden = lists.interviewers.some((person) => person.devices === null)
  if (hidden) {
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Administration</h1>
        <p className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">
          Le script ne renvoie pas les identifiants. Mettez à jour le script du tableur, puis redéployez-le.
        </p>
      </div>
    )
  }

  async function apply(interviewer: string, action: 'add' | 'remove', target: string) {
    if (!settings || busy) return
    setBusy(`${action}:${interviewer}:${target}`)
    setNotice(null)
    try {
      const next = await fetchSheetLists(settings.adminEndpoint, {
        device: deviceId,
        who: settings.interviewer,
        action,
        interviewer,
        target,
      })
      publishLists(next)
      if (action === 'add') setDrafts((current) => ({ ...current, [interviewer]: '' }))
      setConfirmKey(null)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Modification impossible.')
    } finally {
      setBusy(null)
    }
  }

  function add(interviewer: string) {
    const target = normalizeDeviceId(drafts[interviewer] ?? '')
    if (!target) {
      setNotice('Identifiant illisible. Collez un seul identifiant.')
      return
    }
    const person = lists.interviewers.find((item) => item.name === interviewer)
    if (person?.devices?.includes(target)) {
      setNotice('Cet identifiant est déjà autorisé pour cet enquêteur.')
      return
    }
    void apply(interviewer, 'add', target)
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Administration</h1>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Collez l’identifiant reçu de l’enquêteur sur sa ligne. Une cellule vide n’autorise aucun appareil.
        </p>
      </div>

      {notice ? <p className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">{notice}</p> : null}

      <div className="grid gap-2">
        {lists.interviewers.map((person) => (
          <section key={person.name} className="grid gap-2 rounded-2xl border border-line bg-card px-3 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-extrabold">{person.name}</h2>
              {person.admin ? <p className="text-xs font-bold uppercase tracking-wide text-leaf">Admin</p> : null}
            </div>
            {person.devices?.length ? (
              <ul className="grid">
                {person.devices.map((id) => {
                  const key = `${person.name}:${id}`
                  const confirming = confirmKey === key
                  return (
                    <li key={id} className="flex min-h-11 items-center gap-2">
                      <p className="min-w-0 flex-1 break-all font-mono text-xs leading-tight">{id}</p>
                      {confirming ? (
                        <span className="flex shrink-0 gap-3">
                          <button type="button" className="text-sm font-bold text-muted" onClick={() => setConfirmKey(null)}>
                            Annuler
                          </button>
                          <button
                            type="button"
                            className="text-sm font-bold text-danger"
                            disabled={busy !== null}
                            onClick={() => void apply(person.name, 'remove', id)}
                          >
                            Retirer
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="shrink-0 text-sm font-bold text-danger"
                          disabled={busy !== null}
                          onClick={() => {
                            setNotice(null)
                            setConfirmKey(key)
                          }}
                        >
                          Retirer
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : null}
            <div className="flex gap-2">
              <input
                value={drafts[person.name] ?? ''}
                maxLength={80}
                aria-label={`Ajouter un identifiant pour ${person.name}`}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Ajouter un identifiant"
                onChange={(event) => setDrafts((current) => ({ ...current, [person.name]: event.target.value }))}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 font-mono text-sm outline-none focus:border-leaf"
              />
              <button
                type="button"
                className="shrink-0 rounded-xl px-3 text-sm font-bold text-leaf disabled:opacity-45"
                disabled={busy !== null}
                onClick={() => add(person.name)}
              >
                {busy === `add:${person.name}:${normalizeDeviceId(drafts[person.name] ?? '') ?? ''}` ? '…' : 'Ajouter'}
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
