import { Link, useNavigate } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { isAdminSession } from '~/common/config'
import { canRetryRow, canUseSurvey } from '~/common/settings'
import { classifyEndpoint } from '~/common/endpoint'
import { answerPreview, draftTitle, mapsDestination, surveyRefused } from '~/common/survey'
import { continueStep, draftMatchesMode } from '~/common/draft'
import { createDraft, listDrafts, saveDraft, type Draft } from '~/lib/draft.client'
import { useOutbox } from '~/hooks/useOutbox'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { buttonClass } from './Button'
import { InstallOffer } from './InstallOffer'
import { PrivacyLink, PublicHome } from './PublicHome'
import { TestChip } from './TestMark'
import { MapsLink } from './MapsLink'
import { removeConfirmedResponses, retryResponse, statusLabel, type LocalResponse } from '~/lib/outbox.client'

export function HomeScreen() {
  const settings = useSettings()
  const lists = useSheetLists()
  const { rows, error } = useOutbox()
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [ready, setReady] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    setDrafts(listDrafts())
    setReady(true)
  }, [])

  if (!settings || !ready) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’enquête…</p>
  }

  if (!canUseSurvey(settings)) return <PublicHome />

  if (!rows) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’enquête…</p>
  }

  const endpoint = classifyEndpoint(settings.endpoint)
  const visibleDrafts = drafts.filter((item) => draftMatchesMode(item, settings.testMode))
  const listed = rows.filter((row) => row.test === settings.testMode).sort(homeOrder)

  return (
    <div className="flex flex-1 flex-col">
    <div className="grid gap-4">
      <InstallOffer />

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

      <Link to="/enqueteur" className={buttonClass('secondary')}>
        Guide de l’enquêteur
      </Link>
      {settings.testMode ? (
        <button type="button" className={buttonClass('primary')} onClick={() => navigate(`/entretien?fiche=${createDraft().code}`)}>
          Nouvelle personne
        </button>
      ) : null}
      {visibleDrafts.length > 0 ? (
        <ul className="grid gap-2">
          {visibleDrafts.map((item) => (
            <li key={item.code} className="relative rounded-2xl border border-line bg-card px-4 py-3">
              <div className={`flex flex-wrap items-center gap-2 ${mapsDestination(item.answers) ? 'pr-16' : ''}`}>
                <p className="font-bold">{draftTitle(item.answers)}</p>
                {item.test ? <TestChip /> : null}
              </div>
              <MapsLink answers={item.answers} compact className="absolute right-4 top-3" />
              <p className="absolute bottom-3 right-3 rounded-full bg-pine px-2.5 py-1 font-mono text-xs font-bold tracking-[0.12em] text-paper">
                {item.code}
              </p>
              <div className="mt-2 flex gap-4 pr-28">
                <Link
                  to={`/entretien?fiche=${item.code}`}
                  className="inline-flex min-h-11 items-center font-bold text-leaf"
                  onClick={() => {
                    const step = continueStep(item)
                    if (step !== item.step) saveDraft({ ...item, step })
                  }}
                >
                  Continuer
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Sur cet appareil</h2>
          {listed.length > 0 && !clearing ? (
            <button type="button" className="inline-flex min-h-11 shrink-0 items-center font-extrabold text-danger" onClick={() => setClearing(true)}>
              Vider
            </button>
          ) : null}
        </div>
        {listed.length > 0 && clearing ? (
          <div className="mt-1 grid justify-items-end gap-1 text-right">
            <button
              type="button"
              className="text-sm font-bold leading-snug text-danger"
              onClick={() => {
                setClearing(false)
                void removeConfirmedResponses(settings.testMode)
              }}
            >
              Retirer les fiches enregistrées de cet appareil
            </button>
            <button type="button" className="inline-flex min-h-11 items-center text-sm font-bold" onClick={() => setClearing(false)}>
              Annuler
            </button>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-danger">{error}</p> : null}
        {listed.length === 0 ? (
          <p className="mt-3 text-base leading-relaxed text-muted">
            Aucune fiche pour l’instant. Elles apparaissent ici dès le premier entretien, même sans réseau.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {listed.map((row) => (
              <StoredFiche
                key={row.id}
                row={row}
                canRetry={canRetryRow(settings, row.test)}
                open={openId === row.id}
                retrying={retryingId === row.id}
                onToggle={() => setOpenId(openId === row.id ? null : row.id)}
                onRetry={() => {
                  if (retryingId) return
                  setRetryingId(row.id)
                  void retryResponse(row.id).finally(() => setRetryingId(null))
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
    <PrivacyLink />
    </div>
  )
}

function StoredFiche({
  row,
  open,
  canRetry,
  retrying,
  onToggle,
  onRetry,
}: {
  row: LocalResponse
  open: boolean
  canRetry: boolean
  retrying: boolean
  onToggle: () => void
  onRetry: () => void
}) {
  const confirmed = row.status === 'confirmed'
  const expandable = canRetry && !confirmed
  const line = (
    <>
      <p className="min-w-0 flex-1 truncate font-bold">{answerPreview(row.answers)}</p>
      {row.test ? <TestChip /> : null}
      {confirmed ? null : <span className="shrink-0 text-xs font-bold text-clay">{statusLabel(row.status)}</span>}
      <span className="shrink-0 rounded-full bg-pine px-2 py-1 font-mono text-xs font-bold tracking-[0.12em] text-paper">
        {row.id}
      </span>
      {surveyRefused(row.answers) ? (
        <span className="basis-full w-fit rounded-full bg-clay px-2 py-1 text-xs font-extrabold text-paper">N’a pas souhaité répondre</span>
      ) : null}
    </>
  )

  return (
    <li className={`rounded-2xl border border-line px-3 py-2 ${confirmed ? 'bg-mist' : 'bg-clay-bg'}`}>
      {expandable ? (
        <>
          <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-h-11 w-full flex-wrap items-center gap-2 text-left">
            {line}
          </button>
          {open ? (
            <div className="flex justify-end pb-1">
              <button
                type="button"
                disabled={retrying}
                onClick={onRetry}
                className="inline-flex h-8 items-center rounded-lg bg-pine px-2.5 text-xs font-extrabold text-paper disabled:opacity-45"
              >
                Réessayer
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex min-h-11 flex-wrap items-center gap-2">{line}</div>
      )}
    </li>
  )
}

/** Les envois non confirmés restent en haut. Les fiches enregistrées descendent, les plus anciennes en bas. */
function homeOrder(left: LocalResponse, right: LocalResponse): number {
  const group = Number(left.status === 'confirmed') - Number(right.status === 'confirmed')
  if (group !== 0) return group
  return left.createdAt < right.createdAt ? 1 : -1
}
