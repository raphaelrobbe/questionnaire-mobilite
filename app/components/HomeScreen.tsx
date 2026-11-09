import { Link, useNavigate } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { DeviceUnknown, isAdminSession } from '~/common/config'
import { classifyEndpoint } from '~/common/endpoint'
import { formatWhen } from '~/common/format'
import { answerPreview, draftTitle, mapsDestination } from '~/common/survey'
import { createDraft, listDrafts, removeDraft, type Draft } from '~/lib/draft.client'
import { useOutbox } from '~/hooks/useOutbox'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { useInstall } from '~/lib/install.client'
import { copyText, getDeviceId } from '~/lib/settings.client'
import { confirmInterviewer } from '~/lib/sheets.client'
import { Button, buttonClass } from './Button'
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
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [qrBusy, setQrBusy] = useState(false)
  const [qrError, setQrError] = useState(false)

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

  async function showQr() {
    if (!deviceId || qrBusy) return
    if (qrSvg) {
      setQrSvg(null)
      return
    }
    setQrBusy(true)
    setQrError(false)
    try {
      const { deviceQrSvg } = await import('~/lib/qr/draw.client')
      setQrSvg(deviceQrSvg(deviceId))
    } catch {
      setQrError(true)
    } finally {
      setQrBusy(false)
    }
  }

  async function copyDeviceId() {
    setCopyError(false)
    const ok = await copyText(deviceId)
    setCopied(ok)
    setCopyError(!ok)
  }

  if (!settings || !ready || !rows) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’enquête…</p>
  }

  if (!settings.interviewer.trim()) {
    return (
      <div className="grid gap-4">
        <section className="rounded-[28px] border border-line bg-card px-5 py-5">
          <h1 className="text-sm font-bold text-muted">Identifiant de cet appareil</h1>
          <p className="mt-3 break-all font-mono text-sm">{deviceId}</p>
          <Button variant="secondary" className="mt-3" disabled={!deviceId} onClick={() => void copyDeviceId()}>
            {copied ? 'Identifiant copié' : 'Copier l’identifiant'}
          </Button>
          <Button variant="secondary" className="mt-2" disabled={!deviceId || qrBusy} onClick={() => void showQr()}>
            {qrSvg ? 'Masquer le QR-code' : 'Afficher le QR-code'}
          </Button>
          {qrSvg ? (
            <div
              className="mx-auto mt-4 w-56 [&_svg]:h-auto [&_svg]:w-full"
              role="img"
              aria-label="QR-code de l’identifiant"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : null}
          {qrError ? <p className="mt-2 text-sm font-semibold text-clay">Le QR-code n’a pas pu être affiché.</p> : null}
          {copyError ? (
            <p className="mt-2 text-sm font-semibold text-clay">La copie a échoué. Sélectionnez l’identifiant ci-dessus et copiez-le.</p>
          ) : null}
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
        <p className="text-lg font-extrabold">{settings.interviewer.trim()}</p>
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
          {drafts.map((item) => (
            <li key={item.code} className="relative rounded-2xl border border-line bg-card px-4 py-3">
              <p className={`font-bold ${mapsDestination(item.answers) ? 'pr-28' : ''}`}>{draftTitle(item.answers)}</p>
              <MapsLink answers={item.answers} compact className="absolute right-4 top-3" />
              <p className="absolute bottom-3 right-3 rounded-full bg-pine px-2.5 py-1 font-mono text-xs font-bold tracking-[0.12em] text-paper">
                {item.code}
              </p>
              {abandonCode === item.code ? (
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
                  <Link to={`/entretien?fiche=${item.code}`} className="inline-flex min-h-11 items-center font-bold text-leaf">
                    Continuer
                  </Link>
                  <button type="button" className="inline-flex min-h-11 items-center font-bold text-danger" onClick={() => setAbandonCode(item.code)}>
                    Abandonner
                  </button>
                </div>
              )}
            </li>
          ))}
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

function InstallOffer({ offer }: { offer: ReturnType<typeof useInstall> }) {
  if (!offer.show) return null
  return (
    <div className="grid gap-2">
      <Button variant="secondary" onClick={() => void offer.install()}>
        Installer l’application
      </Button>
      {offer.hint ? (
        <p role="status" className="text-sm font-semibold leading-relaxed text-muted">
          {offer.hint}
        </p>
      ) : null}
    </div>
  )
}
