import { Link } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { isAdminSession, startRefusal } from '~/common/config'
import { classifyEndpoint } from '~/common/endpoint'
import { formatWhen } from '~/common/format'
import { answerPreview } from '~/common/survey'
import { loadStartedDraft, clearDraft, type Draft } from '~/lib/draft.client'
import { useOutbox } from '~/hooks/useOutbox'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { getDeviceId } from '~/lib/settings.client'
import { buttonClass } from './Button'
import { statusLabel } from '~/lib/outbox.client'

export function HomeScreen() {
  const settings = useSettings()
  const lists = useSheetLists()
  const { rows, error } = useOutbox()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [deviceId, setDeviceId] = useState('')
  const [ready, setReady] = useState(false)
  const [confirmAbandon, setConfirmAbandon] = useState(false)

  useEffect(() => {
    setDraft(loadStartedDraft())
    setDeviceId(getDeviceId())
    setReady(true)
  }, [])

  if (!settings || !ready || !rows) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’enquête…</p>
  }

  const endpoint = classifyEndpoint(settings.endpoint)
  const refusal =
    deviceId && lists.status === 'ready' ? startRefusal(lists.interviewers, settings.interviewer, deviceId) : null
  const gate = lists.status === 'error' ? lists.message || 'Listes indisponibles.' : refusal
  const waiting = rows.filter((row) => row.status === 'pending' || row.status === 'error')
  const sent = rows.filter((row) => row.status === 'sent')
  const recorded = rows.filter((row) => row.status === 'confirmed')
  const recent = rows.slice(0, 3)

  return (
    <div className="grid gap-4">
      <section className="rounded-[28px] bg-pine px-5 py-6 text-paper">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-paper/70">Terrain</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Enquête mobilité</h1>
        <p className="mt-3 text-base leading-relaxed text-paper/85">
          Une personne, une fiche. Le tableur reçoit la ligne. Sans réseau, le téléphone la garde et l’envoie plus tard.
        </p>
      </section>

      <section className="rounded-[28px] border border-line bg-card px-5 py-5 shadow-[0_12px_40px_rgba(28,25,21,0.06)]">
        <p className="text-sm font-bold text-muted">Enquêteur</p>
        <p className="text-lg font-extrabold">{settings.interviewer.trim() || 'Non renseigné'}</p>
        <div className="mt-3 flex flex-wrap gap-x-4">
          <Link to="/reglages" className="inline-flex min-h-11 items-center font-bold text-leaf">
            Modifier
          </Link>
          {isAdminSession(lists.interviewers, settings.interviewer) ? (
            <Link to="/admin" className="inline-flex min-h-11 items-center font-bold text-leaf">
              Administration
            </Link>
          ) : null}
        </div>
      </section>

      {!endpoint.ok ? (
        <p className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">
          Mode local. Le tableur n’est pas branché : les réponses restent sur cet appareil.
        </p>
      ) : null}

      {waiting.length > 0 ? (
        <Link to="/file" className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-bold text-clay">
          {waiting.length === 1 ? '1 réponse attend le réseau ou le tableur.' : `${waiting.length} réponses attendent le réseau ou le tableur.`}
        </Link>
      ) : null}

      {gate ? (
        <div className="grid gap-3">
          <p className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">{gate}</p>
          <Link to="/reglages" className={buttonClass('secondary')}>
            Ouvrir les réglages
          </Link>
        </div>
      ) : lists.status === 'loading' || !deviceId ? (
        <p className="text-base font-semibold text-muted">Vérification de l’appareil…</p>
      ) : draft ? (
        <div className="grid gap-2">
          <Link to="/entretien" className={buttonClass('primary')}>
            Reprendre l’entretien
          </Link>
          {confirmAbandon ? (
            <div className="rounded-2xl border border-line bg-card p-4">
              <p className="font-bold">Effacer le brouillon de cet entretien ?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" className={buttonClass('secondary')} onClick={() => setConfirmAbandon(false)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className={buttonClass('danger')}
                  onClick={() => {
                    clearDraft()
                    setDraft(null)
                    setConfirmAbandon(false)
                  }}
                >
                  Effacer
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={buttonClass('ghost')} onClick={() => setConfirmAbandon(true)}>
              Abandonner le brouillon
            </button>
          )}
        </div>
      ) : (
        <Link to="/entretien" className={buttonClass('primary')}>
          Nouvelle personne
        </Link>
      )}

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-extrabold">Sur cet appareil</h2>
          {sent.length > 0 || recorded.length > 0 ? (
            <p className="text-sm font-semibold text-muted">
              {[
                sent.length > 0 ? `${sent.length} envoyée${sent.length > 1 ? 's' : ''}` : '',
                recorded.length > 0 ? `${recorded.length} enregistrée${recorded.length > 1 ? 's' : ''}` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-danger">{error}</p> : null}
        {recent.length === 0 ? (
          <p className="mt-3 text-base leading-relaxed text-muted">
            Aucune fiche pour l’instant. Elles apparaissent ici dès le premier entretien, même sans réseau.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {recent.map((row) => (
              <li key={row.id} className="rounded-2xl border border-line bg-card px-4 py-3">
                <p className="font-bold">{answerPreview(row.answers)}</p>
                <p className="mt-1 text-sm font-semibold text-muted">
                  {formatWhen(row.createdAt)} · {statusLabel(row.status)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {rows.length > 3 ? (
          <Link to="/file" className="mt-3 inline-flex min-h-11 items-center font-bold text-leaf">
            Toute la file
          </Link>
        ) : null}
      </section>
    </div>
  )
}
