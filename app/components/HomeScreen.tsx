import { Link, useNavigate } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { DeviceUnknown, isAdminSession } from '~/common/config'
import { canUseSurvey } from '~/common/settings'
import { classifyEndpoint } from '~/common/endpoint'
import { formatWhen } from '~/common/format'
import { answerPreview, draftTitle, mapsDestination } from '~/common/survey'
import { draftMatchesMode } from '~/common/draft'
import { createDraft, listDrafts, removeDraft, type Draft } from '~/lib/draft.client'
import { useOutbox } from '~/hooks/useOutbox'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { useInstall } from '~/lib/install.client'
import { getDeviceId } from '~/lib/settings.client'
import { confirmInterviewer } from '~/lib/sheets.client'
import { Button, buttonClass } from './Button'
import { DeviceIdPanel } from './DeviceId'
import { TestChip } from './TestMark'
import { MapsLink } from './MapsLink'
import { statusLabel } from '~/lib/outbox.client'

export function HomeScreen() {
  const settings = useSettings()
  const lists = useSheetLists()
  const { rows, error } = useOutbox()
  const installOffer = useInstall()
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [deviceId, setDeviceId] = useState('')
  const [ready, setReady] = useState(false)
  const [abandonCode, setAbandonCode] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  useEffect(() => {
    setDrafts(listDrafts())
    setDeviceId(getDeviceId())
    setReady(true)
  }, [])

  async function connect() {
    if (!settings || !deviceId || connecting) return
    setConnecting(true)
    setConnectError(null)
    try {
      if (!navigator.onLine) {
        setConnectError('La première vérification a besoin du réseau.')
        return
      }
      await confirmInterviewer(settings.adminEndpoint, deviceId)
    } catch (error) {
      setConnectError(
        error instanceof DeviceUnknown
          ? 'Cet appareil n’est pas autorisé. Envoyez cet identifiant à l’administrateur.'
          : 'La première vérification a besoin du réseau.',
      )
    } finally {
      setConnecting(false)
    }
  }

  if (!settings || !ready || !rows) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’enquête…</p>
  }

  if (!canUseSurvey(settings)) {
    return (
      <div className="grid gap-4">
        <section className="rounded-[28px] border border-line bg-card px-5 py-5">
          <h1 className="text-sm font-bold text-muted">Identifiant de cet appareil</h1>
          <DeviceIdPanel deviceId={deviceId} />
        </section>
        <Button disabled={connecting || !deviceId} onClick={() => void connect()}>
          {connecting ? 'Connexion…' : 'Connexion'}
        </Button>
        {connectError ? (
          <p role="status" className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">
            {connectError}
          </p>
        ) : null}
        <InstallOffer offer={installOffer} />
      </div>
    )
  }

  const endpoint = classifyEndpoint(settings.endpoint)
  const waiting = rows.filter((row) => row.status === 'pending' || row.status === 'error')
  const sent = rows.filter((row) => row.status === 'sent')
  const recorded = rows.filter((row) => row.status === 'confirmed')
  const recent = rows.slice(0, 3)

  return (
    <div className="grid gap-4">
      <InstallOffer offer={installOffer} />

      <section className="rounded-[28px] border border-line bg-card px-5 py-5 shadow-[0_12px_40px_rgba(28,25,21,0.06)]">
        <p className="text-sm font-bold text-muted">Enquêteur</p>
        <p className="text-lg font-extrabold">{settings.interviewer.trim() || 'Test'}</p>
        {isAdminSession(lists.interviewers, settings.interviewer) ? (
          <Link to="/admin" className="mt-3 inline-flex min-h-11 items-center font-bold text-leaf">
            Administration
          </Link>
        ) : null}
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

      <button type="button" className={buttonClass('primary')} onClick={() => navigate(`/entretien?fiche=${createDraft().code}`)}>
        Nouvelle personne
      </button>
      {drafts.length > 0 ? (
        <ul className="grid gap-2">
          {[...drafts]
            .sort((left, right) => Number(draftMatchesMode(right, settings.testMode)) - Number(draftMatchesMode(left, settings.testMode)))
            .map((item) => {
            const locked = !draftMatchesMode(item, settings.testMode)
            return (
            <li key={item.code} className={`relative rounded-2xl border border-line bg-card px-4 py-3 ${locked ? 'opacity-50' : ''}`}>
              <div className={`flex flex-wrap items-center gap-2 ${!locked && mapsDestination(item.answers) ? 'pr-28' : ''}`}>
                <p className={`font-bold ${locked ? 'text-muted' : ''}`}>{draftTitle(item.answers)}</p>
                {item.test ? <TestChip /> : null}
              </div>
              {locked ? null : <MapsLink answers={item.answers} compact className="absolute right-4 top-3" />}
              <p className={`absolute bottom-3 right-3 rounded-full px-2.5 py-1 font-mono text-xs font-bold tracking-[0.12em] ${locked ? 'bg-line text-muted' : 'bg-pine text-paper'}`}>
                {item.code}
              </p>
              {!locked && abandonCode === item.code ? (
                <div className="mt-3 pr-28">
                  <p className="font-bold">Effacer cette fiche commencée ?</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" className={buttonClass('secondary')} onClick={() => setAbandonCode(null)}>
                      Annuler
                    </button>
                    <button
                      type="button"
                      className={buttonClass('danger')}
                      onClick={() => {
                        removeDraft(item.code)
                        setDrafts(listDrafts())
                        setAbandonCode(null)
                      }}
                    >
                      Effacer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex gap-4 pr-28">
                  {locked ? (
                    <p className="self-center text-sm font-semibold text-muted">
                      {item.test ? 'Activez le mode test pour ouvrir cette fiche.' : 'Désactivez le mode test pour ouvrir cette fiche.'}
                    </p>
                  ) : (
                    <>
                      <Link to={`/entretien?fiche=${item.code}`} className="inline-flex min-h-11 items-center font-bold text-leaf">
                        Continuer
                      </Link>
                      <button type="button" className="inline-flex min-h-11 items-center font-bold text-danger" onClick={() => setAbandonCode(item.code)}>
                        Abandonner
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
            )
          })}
        </ul>
      ) : null}

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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{answerPreview(row.answers)}</p>
                  {row.test ? <TestChip /> : null}
                </div>
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

function InstallOffer({ offer }: { offer: ReturnType<typeof useInstall> }) {
  return (
    <div className="grid gap-2">
      <div className={`grid gap-2 ${offer.show ? 'grid-cols-2' : ''}`}>
        {offer.show ? (
          <Button variant="secondary" className="min-w-0 w-full px-3 leading-tight" onClick={() => void offer.install()}>
            Installer l’application
          </Button>
        ) : null}
        <Link to="/protection" prefetch="intent" className={buttonClass('secondary', 'min-w-0 w-full px-3 leading-tight')}>
          Protection des données
        </Link>
      </div>
      {offer.show && offer.hint ? (
        <p role="status" className="text-sm font-semibold leading-relaxed text-muted">
          {offer.hint}
        </p>
      ) : null}
    </div>
  )
}
