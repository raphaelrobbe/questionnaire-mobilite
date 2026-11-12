import { Link, useNavigate, useSearchParams } from '@remix-run/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { draftMatchesMode } from '~/common/draft'
import { classifyEndpoint } from '~/common/endpoint'
import { canUseSurvey } from '~/common/settings'
import { listedActualTrips, presetActualJourney } from '~/common/journeys'
import { type ThemeId } from '~/common/motives'
import { CIVILITY, VISITS, appendVisit, buildSteps, patchAnswers, stepIssue, summary, visitLabel, visitStarts, type Answers } from '~/common/survey'
import type { ResponseRecord } from '~/common/response'
import { createDraft, loadDraft, removeDraft, saveDraft, type Draft } from '~/lib/draft.client'
import { capturePosition } from '~/lib/geo.client'
import { commitResponse, readableError, type LocalResponse } from '~/lib/outbox.client'
import { getDeviceId } from '~/lib/settings.client'
import { useOnline } from '~/hooks/useOnline'
import { useOutbox } from '~/hooks/useOutbox'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { Button, buttonClass } from './Button'
import { choiceClass, choiceFill, fieldClass, idleClass } from './fill'
import { ConsentScript } from './ConsentScript'
import { Reveal, holdRevealScroll } from './Reveal'
import { MapsLink } from './MapsLink'
import { PlacePicker } from './PlacePicker'
import { ContactStep } from './ContactStep'
import { LifeChoicesStep } from './LifeChoicesStep'
import { ModeBarriersStep } from './ModeBarriersStep'
import { ModeConditionsStep } from './ModeConditionsStep'
import { WalkDistanceStep } from './WalkDistanceStep'
import { ModeReasonsStep } from './ModeReasonsStep'
import { TripDifficulties } from './TripDifficulties'
import { HandicapStep } from './HandicapStep'
import { HouseholdStep } from './HouseholdStep'
import { MotivesStep } from './MotivesStep'
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
  const [openedTrip, setOpenedTrip] = useState(-1)
  const [visitNote, setVisitNote] = useState<string | null>(null)
  const [visitWhy, setVisitWhy] = useState(false)

  const named = settings ? canUseSurvey(settings) : false

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
  const motiveCursor = draft ? `${draft.answers.motives.cursor.theme}:${draft.answers.motives.cursor.person}` : ''
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
  }, [stepIndex, opened, motiveCursor])

  useEffect(() => {
    holdRevealScroll()
  }, [stepIndex, motiveCursor])

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
            Connectez cet appareil depuis l’accueil, ou activez le mode test dans les réglages.
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

  if (!draftMatchesMode(draft, settings.testMode)) {
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Cette fiche n’est pas dans le mode en cours.</h1>
        <p className="rounded-2xl bg-mist px-4 py-3 text-sm font-semibold leading-relaxed text-muted">
          {draft.test
            ? 'Activez le mode test pour la reprendre. Elle ne part pas dans la feuille des vraies réponses.'
            : 'Désactivez le mode test pour la reprendre. Elle ne part pas dans la feuille test.'}
        </p>
        <Link to="/" className={buttonClass('secondary')}>
          Retour à l’accueil
        </Link>
      </div>
    )
  }

  const steps = buildSteps(draft.answers)
  const step = steps[stepIndex]
  const endpoint = classifyEndpoint(settings.endpoint)
  const hint = sendHint(online, endpoint.ok)

  function update(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  function updateAnswers(patch: Partial<Answers>) {
    setDraft((current) => (current ? { ...current, answers: patchAnswers(current.answers, patch) } : current))
  }

  function goNext() {
    if (!draft || !step || issue || saving) return
    if (step.kind === 'visit') {
      void recordVisit()
      return
    }
    if (step.kind === 'consent') {
      void recordStart()
      return
    }
    setOpenedTrip(-1)
    update({ step: stepIndex + 1 })
    window.scrollTo(0, 0)
  }

  function toRecord(source: Draft, at: string): ResponseRecord {
    const interviewer = settings?.interviewer.trim() ?? ''
    return {
      id: source.code,
      createdAt: at,
      deviceId: getDeviceId(),
      interviewer: source.test ? interviewer || 'Test' : interviewer,
      test: source.test,
      latitude: source.latitude,
      longitude: source.longitude,
      answers: source.answers,
    }
  }

  async function recordVisit() {
    if (!draft || saving || !draft.answers.visitPick) return
    const pick = draft.answers.visitPick
    if (visitStarts(pick)) {
      setSaveError(null)
      setVisitNote(null)
      update({ step: stepIndex + 1, answers: patchAnswers(draft.answers, { visitPick: '' }) })
      window.scrollTo(0, 0)
      return
    }
    setSaving(true)
    setSaveError(null)
    setVisitNote(null)
    const at = new Date().toISOString()
    const refused = pick === 'refus'
    const next: Draft = {
      ...draft,
      answers: patchAnswers(draft.answers, {
        visits: appendVisit(draft.answers.visits, pick, at),
        visitPick: '',
        finishedAt: refused ? at : draft.answers.finishedAt,
      }),
    }
    try {
      if (!draftMatchesMode(draft, settings?.testMode === true)) throw new Error('Cette fiche n’est pas dans le mode en cours.')
      const row = await commitResponse(toRecord(next, at))
      if (refused) {
        removeDraft(next.code)
        setDraft(null)
        navigate('/')
        return
      }
      setDraft(next)
      if (row?.status === 'error' && row.lastError) setSaveError(readableError(row.lastError))
      else setVisitNote('Visite enregistrée.')
      window.scrollTo(0, 0)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Enregistrement impossible sur cet appareil.')
    } finally {
      setSaving(false)
    }
  }

  async function recordStart() {
    if (!draft || saving) return
    setSaving(true)
    setSaveError(null)
    const at = new Date().toISOString()
    const next: Draft = {
      ...draft,
      step: stepIndex + 1,
      answers: patchAnswers(draft.answers, { startedAt: draft.answers.startedAt || at }),
    }
    try {
      if (!draftMatchesMode(draft, settings?.testMode === true)) throw new Error('Cette fiche n’est pas dans le mode en cours.')
      const row = await commitResponse(toRecord(next, at))
      setDraft(next)
      if (row?.status === 'error' && row.lastError) setSaveError(readableError(row.lastError))
      window.scrollTo(0, 0)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Enregistrement impossible sur cet appareil.')
    } finally {
      setSaving(false)
    }
  }

  function goBack() {
    if (!draft || !step) return
    setOpenedTrip(-1)
    if (stepIndex > 0) update({ step: stepIndex - 1 })
    window.scrollTo(0, 0)
  }

  function addReminder(item: OccasionalTrip) {
    if (!draft) return
    const created = presetActualJourney(draft.answers.journeys, { theme: item.theme, autre: item.autre })
    if (!created) return
    const motiveStep = steps.findIndex((entry) => entry.kind === 'motives')
    if (motiveStep < 0) return
    setOpenedTrip(created.listedIndex)
    setDraft((current) =>
      current ? { ...current, step: motiveStep, answers: patchAnswers(current.answers, { journeys: created.journeys }) } : current,
    )
    window.scrollTo(0, 0)
  }

  async function onSave() {
    if (!draft || saving) return
    setSaving(true)
    setSaveError(null)
    const interviewer = settings?.interviewer.trim() ?? ''
    if (!draftMatchesMode(draft, settings?.testMode === true)) {
      setSaveError('Cette fiche n’est pas dans le mode en cours.')
      setSaving(false)
      return
    }
    if (!draft.test && !interviewer) {
      setSaveError('Cette réponse n’est pas enregistrée.')
      setSaving(false)
      return
    }
    const at = new Date().toISOString()
    const finished: Draft = { ...draft, answers: patchAnswers(draft.answers, { finishedAt: at }) }
    const record = toRecord(finished, at)
    try {
      const row = await commitResponse(record, true)
      removeDraft(record.id)
      setSaved(
        row ?? {
          ...record,
          status: 'pending',
          lastError: null,
          attempts: 0,
          lookups: 0,
          updatedAt: record.createdAt,
          includeMail: true,
        },
      )
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Enregistrement impossible sur cet appareil.')
      setSaving(false)
    }
  }

  const visitOpen = visitWhy || Boolean(draft.answers.visitPick)
  const storedIssue =
    step.kind === 'consent'
      ? draft.consent
        ? null
        : 'Cochez l’accord avant de continuer.'
      : stepIssue(step, draft.answers)
  const issue = step.kind === 'visit' && !visitOpen ? null : storedIssue

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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="text-sm font-bold text-muted">
          {stepIndex + 1} / {steps.length}
        </p>
        <p className="font-mono text-sm font-bold tracking-[0.14em] text-pine">{draft.code}</p>
        <p className="truncate text-right text-sm font-semibold text-muted">
          {settings.interviewer.trim() || (draft.test ? 'Test' : 'Enquêteur non choisi')}
        </p>
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
            <fieldset className="grid gap-2">
              <legend className="font-bold">Civilité</legend>
              <div className="flex flex-wrap gap-2">
                {CIVILITY.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={draft.answers.civilite === item.value}
                    className={`min-h-11 rounded-2xl px-4 text-sm font-extrabold ${choiceClass(draft.answers.civilite === item.value, 'free-one', Boolean(draft.answers.civilite))}`}
                    onClick={() => updateAnswers({ civilite: draft.answers.civilite === item.value ? '' : item.value })}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <Field label="Prénom" value={draft.answers.prenom} autoComplete="given-name" onChange={(prenom) => updateAnswers({ prenom })} />
            <Field label="Nom" value={draft.answers.nom} autoComplete="family-name" onChange={(nom) => updateAnswers({ nom })} />
          </div>
        </section>
      ) : null}

      {step.kind === 'visit' ? (
        <section className="mt-6">
          <Button
            onClick={() => {
              setVisitNote(null)
              update({ step: stepIndex + 1, answers: patchAnswers(draft.answers, { visitPick: '' }) })
              window.scrollTo(0, 0)
            }}
          >
            Commencer l’enquête
          </Button>
          <Button variant="secondary" className="mt-3" aria-expanded={visitOpen} onClick={() => setVisitWhy(true)}>
            L’enquête n’a pas pu avoir lieu
          </Button>
          {visitOpen ? (
            <Reveal>
              <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
                Pourquoi ?
              </h1>
              <p className="mt-2 text-base text-muted">Chaque visite est conservée, avec l’heure.</p>
              <div className="mt-4 grid gap-2">
                {VISITS.filter((item) => !item.starts).map((item) => {
                  const selected = draft.answers.visitPick === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={selected}
                      className={`min-h-14 rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug ${choiceClass(selected, 'one', Boolean(draft.answers.visitPick))}`}
                      onClick={() => {
                        setVisitNote(null)
                        updateAnswers({ visitPick: selected ? '' : item.value })
                      }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </Reveal>
          ) : null}
          {draft.answers.visits.length ? (
            <div className="mt-4 rounded-2xl bg-card px-4 py-3">
              <p className="text-sm font-extrabold text-muted">Visites déjà notées</p>
              <ul className="mt-2 grid gap-2">
                {draft.answers.visits.map((visit) => (
                  <li key={`${visit.at}-${visit.outcome}`} className="text-base leading-snug">
                    <span className="font-bold">{visitWhen(visit.at)}</span>
                    <span className="text-muted"> — {visitLabel(visit.outcome)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {visitNote ? (
            <p role="status" className="mt-3 text-sm font-bold text-leaf">
              {visitNote}
            </p>
          ) : null}
        </section>
      ) : null}

      {step.kind === 'consent' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Avant de commencer
          </h1>
          <div className="mt-4 rounded-[28px] bg-mist px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">À lire</p>
            <ConsentScript />
          </div>
          <label className={`mt-4 flex min-h-14 items-start gap-3 rounded-2xl px-4 py-4 ${idleClass(choiceFill('one', draft.consent))}`}>
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
          <p className="mt-2 text-base text-muted">Une commune absente de la liste peut être saisie.</p>
          <PlacePicker
            label="Commune"
            inputId="commune-filtre"
            value={draft.answers.commune}
            domicile={false}
            onChange={({ value }) => updateAnswers({ commune: value })}
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
          <MapsLink answers={draft.answers} className="mt-2" />
        </section>
      ) : null}

      {step.kind === 'household' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Qui vit dans le foyer ?
          </h1>
          <p className="mt-2 text-base text-muted">Pour chaque personne : la tranche d’âge, et si elle conduit.</p>
          <HouseholdStep
            people={draft.answers.people}
            commune={draft.answers.commune}
            onChange={(people) => updateAnswers({ people })}
          />
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

      {step.kind === 'motives' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] leading-tight tracking-tight outline-none">
            <span className="font-extrabold">Trajets que le foyer fait déjà</span>, quel que soit le moyen.
          </h1>
          <MotivesStep
            kind="actuel"
            answers={draft.answers}
            initialOpen={openedTrip}
            onChange={(journeys) => updateAnswers({ journeys })}
          />
        </section>
      ) : null}

      {step.kind === 'reminders' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Avez-vous pensé à tout ?
          </h1>
          <p className="mt-2 text-base text-muted">Les trajets occasionnels comptent aussi, même s’ils sont rares.</p>
          <ul className="mt-4 grid gap-2">
            {OCCASIONAL_TRIPS.map((item) => (
              <li key={item.label} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-2">
                <span className="min-w-0 flex-1 text-base font-bold leading-snug">{item.label}</span>
                <button
                  type="button"
                  aria-label={`Ajouter un trajet : ${item.label}`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-pine"
                  onClick={() => addReminder(item)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step.kind === 'difficulties' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Quelles difficultés sur ces trajets ?
          </h1>
          <p className="mt-2 text-base text-muted">Une seule fois, pour l’ensemble des trajets déjà notés.</p>
          <TripDifficulties
            trips={listedActualTrips(draft.answers.journeys)}
            difficulties={draft.answers.difficulties}
            onChange={(difficulties) => updateAnswers({ difficulties })}
          />
        </section>
      ) : null}

      {step.kind === 'offers' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Trajets qu’une offre rendrait possibles
          </h1>
          <p className="mt-2 text-base text-muted">
            Ils ne sont pas faits aujourd’hui. Ils le seraient en transport en commun, si l’offre était efficace, fiable et financièrement intéressante.
          </p>
          <MotivesStep kind="nouveau" answers={draft.answers} onChange={(journeys) => updateAnswers({ journeys })} />
        </section>
      ) : null}

      {step.kind === 'reasons' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Pour quelles raisons pourriez-vous envisager de changer de mode de transport ?
          </h1>
          <p className="mt-2 text-base text-muted">Plusieurs réponses possibles.</p>
          <ModeReasonsStep answers={draft.answers} onChange={updateAnswers} />
        </section>
      ) : null}

      {step.kind === 'conditions' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            À quelles conditions absolument nécessaires pourriez-vous remplacer certains de vos trajets actuels en voiture par
            les transports en commun ?
          </h1>
          <p className="mt-2 text-base text-muted">
            Sans ces conditions, vous ne changeriez pas. Plusieurs réponses possibles.
          </p>
          <ModeConditionsStep answers={draft.answers} onChange={updateAnswers} />
        </section>
      ) : null}

      {step.kind === 'barriers' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Qu’est-ce qui pourrait au contraire vous freiner ou vous empêcher d’utiliser les transports en commun, même s’ils
            desservaient les lieux où vous souhaitez vous rendre ?
          </h1>
          <p className="mt-2 text-base text-muted">Plusieurs réponses possibles.</p>
          <ModeBarriersStep answers={draft.answers} onChange={updateAnswers} />
        </section>
      ) : null}

      {step.kind === 'walk' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Arrêt de transport en commun
          </h1>
          <WalkDistanceStep answers={draft.answers} onChange={updateAnswers} />
        </section>
      ) : null}

      {step.kind === 'life' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Des choix de vie différents grâce aux transports
          </h1>
          <LifeChoicesStep answers={draft.answers} onChange={updateAnswers} />
        </section>
      ) : null}

      {step.kind === 'handicap' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Adaptation aux situations de handicap
          </h1>
          <HandicapStep answers={draft.answers} onChange={updateAnswers} />
        </section>
      ) : null}

      {step.kind === 'contact' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Rester en contact ?
          </h1>
          <p className="mt-2 text-base text-muted">Les informations personnelles ne seront jamais diffusées.</p>
          <ContactStep answers={draft.answers} onChange={updateAnswers} />
        </section>
      ) : null}

      {step.kind === 'closing' ? (
        <section className="mt-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.65rem] font-extrabold leading-tight tracking-tight outline-none">
            Souhaitez-vous ajouter quelque chose ?
          </h1>
          <p className="mt-2 text-base text-muted">
            Vous pouvez partager toute remarque, difficulté, idée ou proposition qui n’aurait pas été abordée dans ce questionnaire.
          </p>
          <textarea
            value={draft.answers.closingNote}
            maxLength={2000}
            rows={10}
            aria-label="Souhaitez-vous ajouter quelque chose ?"
            className={`mt-4 min-h-64 w-full rounded-2xl px-4 py-3 text-base font-medium outline-none focus:border-leaf ${fieldClass(Boolean(draft.answers.closingNote.trim()), true)}`}
            onChange={(event) => updateAnswers({ closingNote: event.target.value })}
          />
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
              <Row
                key={line.label}
                label={line.label}
                value={line.value}
              />
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
          <MapsLink answers={draft.answers} className="mt-3" />
          <div className="mt-4 grid gap-2">
            {draft.latitude === null ? (
              <>
                <Button variant="secondary" disabled={geoBusy} onClick={() => void notePosition()}>
                  {geoBusy ? 'Recherche de la position…' : 'Noter où a lieu l’entretien'}
                </Button>
                <p className="text-center text-sm text-muted">Utile si difficile à trouver</p>
              </>
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
            {hint ? <p className="text-sm leading-relaxed text-muted">{hint}</p> : null}
            {saveError ? (
              <p role="alert" className="text-sm font-semibold text-danger">
                {saveError}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <div data-dock className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto w-full max-w-lg px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {issue ? (
            <p role="status" className="mb-2 text-sm font-bold leading-snug text-danger">
              {issue}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Link to="/" className={buttonClass('secondary', 'w-auto shrink-0 px-2')}>
              Pause
            </Link>
            {stepIndex > 0 ? (
              <Button variant="secondary" className="w-auto shrink-0 px-2" onClick={goBack}>
                Retour
              </Button>
            ) : null}
            {step.kind === 'review' ? (
              <Button className="w-auto min-w-0 flex-1" disabled={saving} onClick={() => void onSave()}>
                {saving ? 'Enregistrement…' : 'Enregistrer la réponse'}
              </Button>
            ) : (
              <Button
                className="w-auto min-w-0 flex-1 disabled:bg-line disabled:text-muted disabled:opacity-100 disabled:hover:bg-line"
                disabled={Boolean(storedIssue) || saving}
                onClick={goNext}
              >
                {saving ? 'Enregistrement…' : step.kind === 'visit' ? 'Valider' : 'Suivant'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

type OccasionalTrip = { label: string; theme: ThemeId | ''; autre: string }

const OCCASIONAL_TRIPS: OccasionalTrip[] = [
  { label: 'Démarche administrative', theme: 'administratif', autre: '' },
  { label: 'Banque', theme: 'administratif', autre: '' },
  { label: 'Coiffeur', theme: 'loisirs', autre: 'Coiffeur' },
  { label: 'Cinéma', theme: 'loisirs', autre: 'Cinéma' },
  { label: 'Soirée', theme: 'loisirs', autre: 'Soirée' },
  { label: 'Gare', theme: '', autre: '' },
  { label: 'Activité sportive, pour vous ou les enfants', theme: 'loisirs', autre: 'Sport' },
  { label: 'Rendez-vous médical, pour vous ou pour quelqu’un d’autre', theme: 'sante', autre: '' },
  { label: 'Autre', theme: '', autre: '' },
]

function visitWhen(at: string): string {
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return at
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(date)
}

function sendHint(online: boolean, endpointReady: boolean): string | null {
  if (!online) return 'Pas de réseau. La réponse restera sur ce téléphone.'
  if (!endpointReady) return 'Le tableur n’est pas branché. La réponse restera sur ce téléphone.'
  return null
}

function Row({ label, value }: { label: ReactNode; value: string }) {
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
        className={`min-h-14 rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(value.trim()), true)}`}
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
      <section className={`rounded-[28px] px-5 py-6 text-paper ${live.status === 'confirmed' ? 'bg-pine' : 'bg-clay'}`}>
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
      kicker: '',
      title: 'Fiche gardée sur ce téléphone.',
      detail: row.lastError ? readableError(row.lastError) : 'L’envoi a échoué. La file réessaiera.',
    }
  }
  return {
    kicker: '',
    title: 'Fiche gardée sur ce téléphone.',
    detail: 'Elle partira dès que le réseau et le tableur seront là. Rien n’est perdu.',
  }
}
