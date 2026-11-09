import { Link, useNavigate, useSearchParams } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'
import { classifyEndpoint } from '~/common/endpoint'
import { buildSteps, patchAnswers, stepIssue, summary, type Answers } from '~/common/survey'
import type { ResponseRecord } from '~/common/response'
import { createDraft, loadDraft, removeDraft, saveDraft, type Draft } from '~/lib/draft.client'
import { capturePosition } from '~/lib/geo.client'
import { flushOne, keepResponse, type LocalResponse } from '~/lib/outbox.client'
import { getDeviceId } from '~/lib/settings.client'
import { useOnline } from '~/hooks/useOnline'
import { useOutbox } from '~/hooks/useOutbox'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { Button, buttonClass } from './Button'
import { CommuneStep } from './CommuneStep'
import { ContactStep } from './ContactStep'
import { HouseholdStep } from './HouseholdStep'
import { VehiclesStep } from './VehiclesStep'

export function Interview() {
  const settings = useSettings()
  const lists = useSheetLists()
  const online = useOnline()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const fiche = params.get('fiche') ?? ''
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saved, setSaved] = useState<LocalResponse | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [missing, setMissing] = useState(false)

  const named = Boolean(settings?.interviewer.trim())

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  useEffect(() => {
    if (!named || !fiche) return
    const found = loadDraft(fiche)
    setDraft(found)
    setMissing(!found)
  }, [named, fiche])

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
    const stepsNow = buildSteps(current.answers)
    const stepNow = stepsNow[Math.min(current.step, stepsNow.length - 1)]
    if (stepNow?.kind === 'commune') {
      document.getElementById('commune-filtre')?.focus()
      return
    }
    headingRef.current?.focus()
  }, [stepIndex, opened])

  if (saved) {
    return (
      <Saved
        row={saved}
        onNext={() => {
          setSaved(null)
          setSaveError(null)
          setSaving(false)
          if (!settings?.interviewer.trim()) {
            setDraft(null)
            return
          }
          const next = createDraft()
          setDraft(next)
          navigate(`/entretien?fiche=${next.code}`)
        }}
      />
    )
  }

  if (!settings || !deviceId || (named && lists.status === 'loading')) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’entretien…</p>
  }

  if (!named) {
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Enquête impossible</h1>
        <p className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">
          Connectez cet appareil depuis l’accueil.
        </p>
        <Link to="/" className={buttonClass('secondary')}>
          Retour à l’accueil
        </Link>
      </div>
    )
  }

  if (!fiche || missing) {
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Cette fiche n’est pas sur ce téléphone.</h1>
        <Link to="/" className={buttonClass('secondary')}>
          Retour à l’accueil
        </Link>
      </div>
    )
  }

  if (!draft) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’entretien…</p>
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
    if (!draft || !step || issue) return
    update({ step: stepIndex + 1 })
  }

  async function onSave() {
    if (!draft || saving) return
    setSaving(true)
    setSaveError(null)
    const record: ResponseRecord = {
      id: draft.code,
      createdAt: new Date().toISOString(),
      deviceId: getDeviceId(),
      interviewer: settings?.interviewer ?? '',
      latitude: draft.latitude,
      longitude: draft.longitude,
      answers: draft.answers,
    }
    try {
      await keepResponse(record)
      removeDraft(record.id)
      const row = await flushOne(record.id)
      setSaved(
        row ?? {
          ...record,
          status: 'pending',
          lastError: null,
          attempts: 0,
          lookups: 0,
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
      : stepIssue(step, draft.answers, lists.communes)

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

  return (
    <div className={issue ? 'pb-40' : 'pb-28'}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-muted">
          {stepIndex + 1} / {steps.length}
        </p>
        <p className="truncate text-sm font-semibold text-muted">{settings.interviewer.trim() || 'Enquêteur non choisi'}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full bg-leaf" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
      </div>

      {step.kind === 'name' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Qui est la personne ?
          </h1>
          <p className="mt-2 text-base text-muted">Facultatif. La fiche peut être préparée avant la rencontre.</p>
          <div className="mt-4 grid gap-3">
            <Field label="Prénom" value={draft.answers.prenom} autoComplete="given-name" onChange={(prenom) => updateAnswers({ prenom })} />
            <Field label="Nom" value={draft.answers.nom} autoComplete="family-name" onChange={(nom) => updateAnswers({ nom })} />
          </div>
        </section>
      ) : null}

      {step.kind === 'consent' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Avant de commencer
          </h1>
          <div className="mt-4 rounded-[28px] bg-mist px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">À lire</p>
            <p className="mt-2 text-lg leading-snug">
              Bonjour. Cette enquête porte sur les déplacements du quotidien de votre foyer.
            </p>
            <p className="mt-3 text-lg leading-snug">
              {endpoint.ok
                ? 'Vos réponses seront stockées de manière anonymisée dans un tableau sur internet, susceptible d’être mis à disposition du public. Vous recevrez un code en fin de questionnaire, permettant de vérifier que vos réponses ont bien été prises en compte. Si vous donnez votre adresse mail en fin de questionnaire, elle ne sera pas accessible publiquement.'
                : 'Pour l’instant les réponses restent sur ce téléphone : le tableur n’est pas encore branché.'}
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

      {step.kind === 'commune' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Dans quelle commune habitez-vous ?
          </h1>
          <p className="mt-2 text-base text-muted">Choisissez-la dans la liste.</p>
          {lists.message ? <p className="mt-3 text-sm font-semibold text-clay">{lists.message}</p> : null}
          <CommuneStep
            communes={lists.communes}
            commune={draft.answers.commune}
            onSelect={(commune) => updateAnswers({ commune })}
          />
        </section>
      ) : null}

      {step.kind === 'address' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Quelle est son adresse ?
          </h1>
          <p className="mt-2 text-base text-muted">Facultatif. La seconde ligne précise l’appartement ou le bâtiment.</p>
          <div className="mt-4 grid gap-3">
            <Field
              label="Adresse"
              value={draft.answers.adresse}
              autoComplete="street-address"
              placeholder="12 rue de la Gare"
              onChange={(adresse) => updateAnswers({ adresse })}
            />
            <Field
              label="Complément"
              value={draft.answers.complement}
              placeholder="Appartement 12"
              onChange={(complement) => updateAnswers({ complement })}
            />
          </div>
        </section>
      ) : null}

      {step.kind === 'household' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Qui vit dans le foyer ?
          </h1>
          <p className="mt-2 text-base text-muted">Pour chaque personne : la tranche d’âge, et si elle conduit.</p>
          <HouseholdStep people={draft.answers.people} onChange={(people) => updateAnswers({ people })} />
        </section>
      ) : null}

      {step.kind === 'vehicles' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Quels véhicules a le foyer ?
          </h1>
          <p className="mt-2 text-base text-muted">Ajoutez chaque voiture et chaque 2/3 roues motorisé. Aucun, si le foyer n’en a pas.</p>
          <VehiclesStep
            cars={draft.answers.cars}
            twoWheelers={draft.answers.twoWheelers}
            onCars={(cars) => updateAnswers({ cars })}
            onTwoWheelers={(twoWheelers) => updateAnswers({ twoWheelers })}
          />
        </section>
      ) : null}

      {step.kind === 'contact' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Rester en contact ?
          </h1>
          <p className="mt-2 text-base text-muted">Le nom, l’adresse, le téléphone et l’adresse mail restent hors du tableau public.</p>
          <ContactStep answers={draft.answers} onChange={updateAnswers} />
        </section>
      ) : null}

      {step.kind === 'review' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Relire avant d’enregistrer
          </h1>
          <div className="mt-4 rounded-[28px] bg-pine px-5 py-5 text-center text-paper">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-paper/70">Code à transmettre</p>
            <p className="mt-2 font-mono text-4xl font-extrabold tracking-[0.18em]">{draft.code}</p>
          </div>
          <dl className="mt-4 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-card">
            <Row label="Enquêteur" value={settings.interviewer.trim() || 'Non renseigné'} />
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

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto w-full max-w-lg px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {issue ? (
            <p role="status" className="mb-2 text-sm font-bold leading-snug text-danger">
              {issue}
            </p>
          ) : null}
          <div className="flex gap-2">
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
              <Button
                className="w-auto flex-[2] disabled:bg-line disabled:text-muted disabled:opacity-100 disabled:hover:bg-line"
                disabled={Boolean(issue)}
                onClick={goNext}
              >
                Suivant
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="font-bold">{label}</span>
      <input
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={160}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-14 rounded-2xl border border-line bg-card px-4 text-base outline-none focus:border-leaf"
      />
    </label>
  )
}

function Saved({ row, onNext }: { row: LocalResponse; onNext: () => void }) {
  const { rows } = useOutbox()
  const live = rows?.find((item) => item.id === row.id) ?? row
  const copy = savedCopy(live)
  return (
    <div className="grid gap-4">
      <section className="rounded-[28px] bg-pine px-5 py-6 text-paper">
        {copy.kicker ? <p className="text-sm font-bold uppercase tracking-[0.16em] text-paper/70">{copy.kicker}</p> : null}
        <h1 className={`${copy.kicker ? 'mt-2' : ''} text-3xl font-extrabold tracking-tight`}>{copy.title}</h1>
        <p className="mt-4 font-mono text-4xl font-extrabold tracking-[0.18em]">{live.id}</p>
        {copy.detail ? <p className="mt-3 text-base leading-relaxed text-paper/85">{copy.detail}</p> : null}
      </section>
      <button type="button" className={buttonClass('primary')} onClick={onNext}>
        Personne suivante
      </button>
      <Link to="/" className={buttonClass('secondary')}>
        Retour à l’accueil
      </Link>
      {live.status === 'pending' || live.status === 'error' ? (
        <Link to="/file" className="text-center font-bold text-leaf">
          Voir la file d’envoi
        </Link>
      ) : null}
    </div>
  )
}

function savedCopy(row: LocalResponse): { kicker: string; title: string; detail: string } {
  if (row.status === 'confirmed') {
    return { kicker: '', title: 'Réponses enregistrées.', detail: 'Le code a été retrouvé dans le tableur.' }
  }
  if (row.status === 'sent') {
    return {
      kicker: '',
      title: 'Réponses envoyées.',
      detail: 'Leur arrivée dans le tableur n’est pas encore garantie.',
    }
  }
  if (row.status === 'error') {
    return {
      kicker: 'Fiche gardée',
      title: 'Gardée sur ce téléphone.',
      detail: row.lastError || 'L’envoi a échoué. La file réessaiera.',
    }
  }
  return {
    kicker: 'Fiche gardée',
    title: 'Gardée sur ce téléphone.',
    detail: 'Elle partira dès que le réseau et le tableur seront là. Rien n’est perdu.',
  }
}
