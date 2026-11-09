import { Link } from '@remix-run/react'
import { useState } from 'react'
import { classifyEndpoint, endpointHint } from '~/common/endpoint'
import { arrivalInProgress } from '~/common/receipt'
import { formatWhen } from '~/common/format'
import { answerPreview } from '~/common/survey'
import { useOutbox } from '~/hooks/useOutbox'
import { useSettings } from '~/hooks/useSettings'
import { flushOutbox, removeResponse, retryResponse, statusLabel, type LocalStatus } from '~/lib/outbox.client'
import { Button } from './Button'

type Filter = 'toutes' | 'attente' | 'envoyees' | 'enregistrees'
type Confirm = { id: string; kind: 'delete' | 'resend' }

const filters: { id: Filter; label: string }[] = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'attente', label: 'À envoyer' },
  { id: 'envoyees', label: 'Envoyées' },
  { id: 'enregistrees', label: 'Enregistrées' },
]

export function QueueScreen() {
  const settings = useSettings()
  const { rows, error } = useOutbox()
  const [filter, setFilter] = useState<Filter>('toutes')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  if (!settings || !rows) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Lecture de la file…</p>
  }

  const hint = endpointHint(settings.endpoint)
  const endpointReady = classifyEndpoint(settings.endpoint).ok
  const visible = rows.filter((row) => matches(filter, row.status))
  const waiting = rows.filter((row) => row.status === 'pending' || row.status === 'error').length

  function blockedReason(): string | null {
    if (!navigator.onLine) return 'Pas de réseau. Les fiches restent dans la file.'
    if (!endpointReady) return hint.text
    return null
  }

  async function sendAll() {
    const reason = blockedReason()
    setActionError(reason)
    if (reason) return
    setBusy(true)
    try {
      await flushOutbox()
    } finally {
      setBusy(false)
    }
  }

  async function sendOne(id: string) {
    const reason = blockedReason()
    setActionError(reason)
    if (reason) return
    setBusy(true)
    try {
      await retryResponse(id)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Envoi impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function runConfirm() {
    if (!confirm) return
    setBusy(true)
    setActionError(null)
    try {
      if (confirm.kind === 'delete') await removeResponse(confirm.id)
      else {
        const reason = blockedReason()
        if (reason) {
          setActionError(reason)
          return
        }
        await retryResponse(confirm.id)
      }
      setConfirm(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">File d’envoi</h1>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Chaque fiche reste sur ce téléphone. L’envoi reprend tout seul dès que le réseau revient.
        </p>
      </div>

      <p
        className={`rounded-2xl px-4 py-3 text-sm font-semibold leading-relaxed ${
          hint.tone === 'ok' ? 'bg-mist text-pine' : hint.tone === 'warn' ? 'bg-clay-bg text-clay' : 'bg-card text-muted'
        }`}
      >
        {hint.text}{' '}
        {hint.tone !== 'ok' ? (
          <Link to="/reglages" className="font-bold underline">
            Ouvrir les réglages
          </Link>
        ) : null}
      </p>

      {error ? <p className="text-danger">{error}</p> : null}
      {actionError ? (
        <p role="alert" className="text-sm font-bold text-danger">
          {actionError}
        </p>
      ) : null}

      <Button variant="secondary" disabled={busy || waiting === 0} onClick={() => void sendAll()}>
        {busy ? 'Envoi…' : waiting === 0 ? 'Rien à envoyer' : `Envoyer la file (${waiting})`}
      </Button>

      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Filtrer la file">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`min-h-11 rounded-full text-sm font-bold ${
              filter === item.id ? 'bg-pine text-paper' : 'bg-card text-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-base leading-relaxed text-muted">
          {rows.length === 0
            ? 'Aucune réponse sur cet appareil. Elles apparaissent ici dès le premier entretien, même sans réseau.'
            : 'Rien dans cette vue.'}
        </p>
      ) : (
        <ul className="grid gap-3">
          {visible.map((row) => (
            <li key={row.id} className="rounded-[28px] border border-line bg-card px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-extrabold">{answerPreview(row.answers)}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass(row.status)}`}>
                  {statusLabel(row.status)}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-muted">{formatWhen(row.createdAt)}</p>
              {arrivalInProgress(row.status, row.lookups) ? (
                <p role="status" className="mt-2 flex items-center gap-2 text-sm font-semibold text-clay">
                  <span
                    className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-clay/30 border-t-clay"
                    aria-hidden="true"
                  />
                  L’enregistrement est en cours de vérification.
                </p>
              ) : null}
              {row.lastError ? <p className="mt-2 text-sm font-semibold text-danger">{row.lastError}</p> : null}
              {confirm?.id === row.id ? (
                <div className="mt-3 rounded-2xl bg-paper p-3">
                  <p className="text-sm font-bold">
                    {confirm.kind === 'delete'
                      ? row.status === 'confirmed'
                        ? 'Supprimer la copie sur ce téléphone ? La ligne reste dans le tableur.'
                        : row.status === 'sent'
                          ? 'Supprimer la copie sur ce téléphone ? La ligne déjà partie dans le tableur, s’il y en a une, reste en place.'
                          : 'Supprimer cette fiche de ce téléphone ? Elle ne sera pas envoyée.'
                      : 'Renvoyer réessaie l’envoi. Le même code ne crée pas une seconde ligne.'}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="secondary" disabled={busy} onClick={() => setConfirm(null)}>
                      Annuler
                    </Button>
                    <Button variant={confirm.kind === 'delete' ? 'danger' : 'primary'} disabled={busy} onClick={() => void runConfirm()}>
                      {confirm.kind === 'delete' ? 'Supprimer' : 'Renvoyer'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`mt-3 grid gap-2 ${row.status === 'confirmed' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {row.status === 'pending' || row.status === 'error' ? (
                    <Button variant="secondary" disabled={busy} onClick={() => void sendOne(row.id)}>
                      Envoyer
                    </Button>
                  ) : row.status === 'sent' ? (
                    <Button
                      variant="secondary"
                      className="disabled:bg-line disabled:text-muted disabled:opacity-100 disabled:hover:bg-line"
                      disabled={busy || arrivalInProgress(row.status, row.lookups)}
                      onClick={() => setConfirm({ id: row.id, kind: 'resend' })}
                    >
                      Renvoyer
                    </Button>
                  ) : null}
                  <Button variant="ghost" disabled={busy} onClick={() => setConfirm({ id: row.id, kind: 'delete' })}>
                    Supprimer
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function matches(filter: Filter, status: LocalStatus): boolean {
  if (filter === 'attente') return status === 'pending' || status === 'error'
  if (filter === 'envoyees') return status === 'sent'
  if (filter === 'enregistrees') return status === 'confirmed'
  return true
}

function badgeClass(status: LocalStatus): string {
  if (status === 'error') return 'bg-danger-bg text-danger'
  if (status === 'pending' || status === 'sent') return 'bg-clay-bg text-clay'
  if (status === 'confirmed') return 'bg-mist text-pine'
  return 'bg-mist text-leaf'
}
