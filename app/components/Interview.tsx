import { Link } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'
import { classifyEndpoint } from '~/common/endpoint'
import { buildSteps, issueFor, patchAnswers, summary, type Answers } from '~/common/survey'
import type { ResponseRecord } from '~/common/response'
import { clearDraft, emptyDraft, loadDraft, saveDraft, type Draft } from '~/lib/draft.client'
import { capturePosition } from '~/lib/geo.client'
import { flushOne, keepResponse, type LocalResponse } from '~/lib/outbox.client'
import { getDeviceId } from '~/lib/settings.client'
import { useOnline } from '~/hooks/useOnline'
import { useSettings } from '~/hooks/useSettings'
import { Button, buttonClass } from './Button'
import { ChoiceList } from './ChoiceList'

export function Interview() {
  const settings = useSettings()
  const online = useOnline()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saved, setSaved] = useState<LocalResponse | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)

  useEffect(() => {
    setDraft(loadDraft() ?? emptyDraft())
  }, [])

  useEffect(() => {
    if (!draft || saved) return
    saveDraft(draft)
  }, [draft, saved])

  const stepIndex = draft ? Math.min(draft.step, buildSteps(draft.answers).length - 1) : 0
  const draftRef = useRef(draft)
  draftRef.current = draft
  const opened = draft !== null

  useEffect(() => {
    const current = draftRef.current
    if (!current) return
    setBlocked(false)
    const stepsNow = buildSteps(current.answers)
    const stepNow = stepsNow[Math.min(current.step, stepsNow.length - 1)]
    if (stepNow?.kind === 'question' && stepNow.question.kind === 'text') {
      document.getElementById('reponse')?.focus()
      return
    }
    headingRef.current?.focus()
  }, [stepIndex, opened])

  if (!draft || !settings) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’entretien…</p>
  }

  if (saved) {
    return (
      <Saved
        row={saved}
        onNext={() => {
          clearDraft()
          setDraft(emptyDraft())
          setSaved(null)
          setSaveError(null)
          setSaving(false)
        }}
      />
    )
  }

  const steps = buildSteps(draft.answers)
  const step = steps[stepIndex]
  const endpoint = classifyEndpoint(settings.endpoint)

  function update(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  function updateAnswers(patch: Partial<Answers>) {
    setDraft((current) => (current ? { ...current, answers: patchAnswers(current.answers, patch) } : current))
  }

  function goNext() {
    if (!draft || !step) return
    if (step.kind === 'consent' && !draft.consent) {
      setBlocked(true)
      return
    }
    if (step.kind === 'question') {
      const issue = issueFor(step.question, draft.answers)
      if (issue) {
        setBlocked(true)
        return
      }
    }
    setBlocked(false)
    update({ step: stepIndex + 1 })
  }

  async function onSave() {
    if (!draft || saving) return
    setSaving(true)
    setSaveError(null)
    const record: ResponseRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      deviceId: getDeviceId(),
      interviewer: settings?.interviewer ?? '',
      place: settings?.place ?? '',
      latitude: draft.latitude,
      longitude: draft.longitude,
      answers: draft.answers,
    }
    try {
      await keepResponse(record)
      clearDraft()
      const row = await flushOne(record.id)
      setSaved(
        row ?? {
          ...record,
          status: 'pending',
          lastError: null,
          attempts: 0,
          updatedAt: record.createdAt,
        },
      )
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Enregistrement impossible sur cet appareil.')
      setSaving(false)
    }
  }

  const issue =
    step.kind === 'consent'
      ? draft.consent
        ? null
        : 'Cochez l’accord avant de continuer.'
      : step.kind === 'question'
        ? issueFor(step.question, draft.answers)
        : null

  return (
    <div className="pb-28">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-muted">
          {stepIndex + 1} / {steps.length}
        </p>
        <p className="truncate text-sm font-semibold text-muted">{settings.place.trim() || 'Lieu non précisé'}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full bg-leaf" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
      </div>

      {step.kind === 'consent' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Avant de commencer
          </h1>
          <div className="mt-4 rounded-[28px] bg-mist px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">À lire</p>
            <p className="mt-2 text-lg leading-snug">
              Bonjour. Cette enquête porte sur vos déplacements du quotidien. Elle dure environ trois minutes.
              {endpoint.ok
                ? ' Vos réponses vont dans le tableur de l’organisateur.'
                : ' Pour l’instant les réponses restent sur ce téléphone : le tableur n’est pas encore branché.'}{' '}
              Un téléphone ou un e-mail n’est noté que si vous le souhaitez.
            </p>
          </div>
          <label className="mt-4 flex min-h-14 items-start gap-3 rounded-2xl border border-line bg-card px-4 py-4">
            <input
              type="checkbox"
              checked={draft.consent}
              onChange={(event) => update({ consent: event.target.checked })}
              className="mt-1 size-5 accent-pine"
            />
            <span className="font-bold">La personne a été informée et accepte de répondre.</span>
          </label>
        </section>
      ) : null}

      {step.kind === 'question' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            {step.question.title}
          </h1>
          {step.question.hint ? <p className="mt-2 text-base text-muted">{step.question.hint}</p> : null}
          <ChoiceList
            question={step.question}
            answers={draft.answers}
            onAnswers={updateAnswers}
            onNext={goNext}
          />
        </section>
      ) : null}

      {step.kind === 'review' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Relire avant d’enregistrer
          </h1>
          <dl className="mt-4 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-card">
            <Row label="Enquêteur" value={settings.interviewer.trim() || 'Non renseigné'} />
            <Row label="Lieu" value={settings.place.trim() || 'Non renseigné'} />
            {summary(draft.answers).map((line) => (
              <Row key={line.label} label={line.label} value={line.value} />
            ))}
            <Row
              label="Position"
              value={
                draft.latitude !== null && draft.longitude !== null
                  ? `${draft.latitude.toFixed(4)}, ${draft.longitude.toFixed(4)}`
                  : 'Non notée'
              }
            />
          </dl>
          <div className="mt-4 grid gap-2">
            {draft.latitude === null ? (
              <Button variant="secondary" disabled={geoBusy} onClick={() => void notePosition()}>
                {geoBusy ? 'Recherche de la position…' : 'Noter où a lieu l’entretien'}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => update({ latitude: null, longitude: null })}>
                Retirer la position
              </Button>
            )}
            {geoError ? (
              <p role="status" className="text-sm font-semibold text-clay">
                {geoError}
              </p>
            ) : null}
            <p className="text-sm leading-relaxed text-muted">{sendHint(online, endpoint.ok)}</p>
            {saveError ? (
              <p role="alert" className="text-sm font-semibold text-danger">
                {saveError}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {blocked && issue ? (
        <p role="alert" className="mt-4 text-sm font-bold text-danger">
          {issue}
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {stepIndex === 0 ? (
            <Link to="/" className={buttonClass('secondary', 'w-auto flex-1')}>
              Pause
            </Link>
          ) : (
            <Button variant="secondary" className="w-auto flex-1" onClick={() => update({ step: stepIndex - 1 })}>
              Retour
            </Button>
          )}
          {step.kind === 'review' ? (
            <Button className="w-auto flex-[2]" disabled={saving} onClick={() => void onSave()}>
              {saving ? 'Enregistrement…' : 'Enregistrer la réponse'}
            </Button>
          ) : (
            <Button className="w-auto flex-[2]" onClick={goNext}>
              Suivant
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  async function notePosition() {
    setGeoBusy(true)
    setGeoError(null)
    try {
      const position = await capturePosition()
      update(position)
    } catch (error) {
      setGeoError(error instanceof Error ? error.message : 'Position indisponible.')
    } finally {
      setGeoBusy(false)
    }
  }
}

function sendHint(online: boolean, endpointReady: boolean): string {
  if (!online) return 'Pas de réseau. La réponse restera sur ce téléphone.'
  if (!endpointReady) return 'Le tableur n’est pas branché. La réponse restera sur ce téléphone.'
  return 'La ligne part vers le tableur juste après l’enregistrement.'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  )
}

function Saved({ row, onNext }: { row: LocalResponse; onNext: () => void }) {
  const copy = savedCopy(row)
  return (
    <div className="grid gap-4">
      <section className="rounded-[28px] bg-pine px-5 py-6 text-paper">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-paper/70">Fiche gardée</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{copy.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-paper/85">{copy.detail}</p>
      </section>
      <button type="button" className={buttonClass('primary')} onClick={onNext}>
        Personne suivante
      </button>
      <Link to="/" className={buttonClass('secondary')}>
        Retour à l’accueil
      </Link>
      {row.status === 'pending' || row.status === 'error' ? (
        <Link to="/file" className="text-center font-bold text-leaf">
          Voir la file d’envoi
        </Link>
      ) : null}
    </div>
  )
}

function savedCopy(row: LocalResponse): { title: string; detail: string } {
  if (row.status === 'confirmed') {
    return { title: 'Ligne confirmée.', detail: 'Le serveur a répondu. La fiche est dans le tableur.' }
  }
  if (row.status === 'sent') {
    return {
      title: 'Envoyée au tableur.',
      detail: 'Google ne renvoie pas d’accusé au téléphone. La ligne est dans l’onglet Réponses.',
    }
  }
  if (row.status === 'error') {
    return { title: 'Gardée sur ce téléphone.', detail: row.lastError || 'L’envoi a échoué. La file réessaiera.' }
  }
  return {
    title: 'Gardée sur ce téléphone.',
    detail: 'Elle partira dès que le réseau et le tableur seront là. Rien n’est perdu.',
  }
}
