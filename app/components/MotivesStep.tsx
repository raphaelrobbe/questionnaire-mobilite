import { useEffect, useRef, useState } from 'react'
import { DOMICILE, RARE_COUNTS, RARE_UNITS, addJourney, journeyHeading, journeyTouched, removeJourney, tripReplacedRiders, tripRiders, updateJourney, WEEKDAYS, type Journey, type JourneyKind, type Weekday } from '~/common/journeys'
import { SLOTS, THEME_IDS, themeLabel, vehicleModeOptions, type SlotId } from '~/common/motives'
import { AGE_BANDS, type Answers, type Person } from '~/common/survey'
import { Reveal } from './Reveal'
import { choiceFill, fieldClass, idleClass, type ChoiceFill } from './fill'
import { PlacePicker } from './PlacePicker'

const SLOT_GROUPS: { label: string; slots: SlotId[] }[] = [
  { label: 'Très matinal', slots: ['4-6', '6-8'] },
  { label: 'Matinée', slots: ['8-10', '10-12'] },
  { label: 'Temps de midi', slots: ['12-14'] },
  { label: 'Après-midi', slots: ['14-16', '16-18'] },
  { label: 'Soirée', slots: ['18-20', '20-22'] },
  { label: 'Nuit', slots: ['22-0', '0-4'] },
]

const REPLACED = [
  { id: 'toujours', label: 'Toujours' },
  { id: 'souvent', label: 'Souvent' },
  { id: 'parfois', label: 'Parfois' },
  { id: 'jamais', label: 'Jamais' },
] as const

export function MotivesStep({
  kind,
  answers,
  initialOpen = -1,
  onChange,
}: {
  kind: JourneyKind
  answers: Answers
  /** Trajet à ouvrir au montage, parmi ceux de ce genre. */
  initialOpen?: number
  onChange: (journeys: Journey[]) => void
}) {
  const [open, setOpen] = useState(initialOpen)
  const pin = useRef(initialOpen)
  const listed = answers.journeys.flatMap((journey, index) => (journey.kind === kind ? [{ journey, index }] : []))
  const shown = listed.flatMap((item, listedIndex) => (journeyTouched(item.journey) || open === listedIndex ? [{ ...item, listedIndex }] : []))

  function change(index: number, patch: Partial<Journey>) {
    onChange(updateJourney(answers.journeys, index, patch))
  }

  function remove(index: number) {
    setOpen(-1)
    onChange(removeJourney(answers.journeys, index))
  }

  function add() {
    const hiddenBlank = listed.findIndex((item, position) => !journeyTouched(item.journey) && open !== position)
    if (hiddenBlank >= 0) {
      pin.current = hiddenBlank
      setOpen(hiddenBlank)
      return
    }
    const next = addJourney(answers.journeys, kind)
    if (next === answers.journeys) return
    pin.current = next.filter((journey) => journey.kind === kind).length - 1
    onChange(next)
    setOpen(pin.current)
  }

  return (
    <div className="mt-5">
      {shown.length ? (
        <div className="grid gap-3">
          {shown.map((item, position) => (
            <TripCard
              key={`${kind}-${item.index}`}
              journey={item.journey}
              position={position}
              listedIndex={item.listedIndex}
              pin={pin}
              open={open === item.listedIndex}
              answers={answers}
              onOpen={() => setOpen(open === item.listedIndex ? -1 : item.listedIndex)}
              onChange={(patch) => change(item.index, patch)}
              onRemove={() => remove(item.index)}
            />
          ))}
        </div>
      ) : null}
      <button type="button" className="mt-3 min-h-12 w-full rounded-2xl bg-pine px-4 text-base font-extrabold text-paper hover:bg-pine-deep" onClick={add}>
        Ajouter un trajet
      </button>
    </div>
  )
}

function TripCard({
  journey,
  position,
  listedIndex,
  pin,
  open,
  answers,
  onOpen,
  onChange,
  onRemove,
}: {
  journey: Journey
  position: number
  listedIndex: number
  pin: { current: number }
  open: boolean
  answers: Answers
  onOpen: () => void
  onChange: (patch: Partial<Journey>) => void
  onRemove: () => void
}) {
  const cardRef = useRef<HTMLElement>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!open || pin.current !== listedIndex) return
    pin.current = -1
    const node = cardRef.current
    if (!node) return
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!node.isConnected) return
        const topBar = document.querySelector('[data-top-banner]')?.getBoundingClientRect().height ?? 0
        window.scrollTo({ top: Math.max(0, window.scrollY + node.getBoundingClientRect().top - topBar), behavior })
      })
    })
  }, [open, listedIndex, pin])

  if (!open) {
    return (
      <div className="relative rounded-2xl border border-line bg-paper">
        <button type="button" className="min-h-12 w-full rounded-2xl py-2 pl-4 pr-12 text-left" onClick={onOpen}>
          <TripHeading journey={journey} position={position} />
        </button>
        <DeleteTrip confirming={confirming} onAsk={() => setConfirming(true)} onCancel={() => setConfirming(false)} onConfirm={onRemove} />
        <MissingReturn retour={journey.retour} inset />
      </div>
    )
  }

  const modes = vehicleModeOptions(answers.cars, answers.twoWheelers)
  const wouldRide = journey.kind === 'nouveau' || journey.replaced === 'toujours' || journey.replaced === 'souvent' || journey.replaced === 'parfois'

  return (
    <article ref={cardRef} className="relative rounded-2xl border border-line bg-white p-3">
      <button type="button" className="min-h-10 w-full py-1 pr-10 text-left" onClick={onOpen}>
        <TripHeading journey={journey} position={position} />
      </button>
      <DeleteTrip confirming={confirming} onAsk={() => setConfirming(true)} onCancel={() => setConfirming(false)} onConfirm={onRemove} />

      <fieldset className="mt-3">
        <legend className="text-base font-extrabold">Pour quel motif ?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEME_IDS.map((theme) => (
            <Chip
              key={theme}
              pressed={journey.theme === theme}
              idle={choiceFill('one', Boolean(journey.theme))}
              onClick={() => onChange({ theme: journey.theme === theme ? '' : theme })}
            >
              {themeLabel(theme, '')}
            </Chip>
          ))}
        </div>
        {journey.theme ? (
          <Reveal>
            <label className="mt-2 block text-base font-extrabold">
              Préciser l’activité <span className="font-medium text-muted">(facultatif)</span>
              <input
                value={journey.autre}
                maxLength={80}
                aria-label="Préciser l’activité"
                className={`mt-2 min-h-12 w-full rounded-2xl px-4 text-base font-medium ${fieldClass(Boolean(journey.autre.trim()), true)}`}
                onChange={(event) => onChange({ autre: event.target.value })}
              />
            </label>
          </Reveal>
        ) : null}
      </fieldset>

      {journey.kind === 'actuel' ? (
        <People
          title="Qui fait ce trajet ?"
          rule="many"
          people={answers.people}
          selected={tripRiders(journey, answers.people.length)}
          extras={journey.extraRiders}
          onToggle={(riders) => onChange({ riders })}
          onExtras={(extraRiders) => onChange({ extraRiders })}
        />
      ) : null}

      {journey.kind === 'actuel' ? (
        <fieldset className="mt-4">
          <legend className="text-base font-extrabold">Par quel moyen ?</legend>
          <p className="mt-1 text-sm text-muted">Plusieurs réponses possibles.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {modes.map((mode) => (
              <Chip
                key={mode.id}
                pressed={journey.modes.includes(mode.id)}
                idle={choiceFill('many', journey.modes.length > 0)}
                onClick={() =>
                  onChange({
                    modes: journey.modes.includes(mode.id) ? journey.modes.filter((id) => id !== mode.id) : [...journey.modes, mode.id],
                  })
                }
              >
                {mode.label}
              </Chip>
            ))}
          </div>
        </fieldset>
      ) : null}

      <Hours aller={journey.aller} retour={journey.retour} onAller={(aller) => onChange({ aller })} onRetour={(retour) => onChange({ retour })} />

      <Frequency journey={journey} onChange={onChange} />

      <RouteField
        origin={journey.origin ?? DOMICILE}
        originPlace={journey.originPlace ?? ''}
        destination={journey.destination}
        place={journey.place}
        onChange={onChange}
      />

      {journey.kind === 'actuel' ? (
        <>
          <fieldset className="mt-4">
            <legend className="text-base font-extrabold">
              Pourrait-il être fait en transport en commun, si l’offre était efficace, fiable et financièrement intéressante ?
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {REPLACED.map((choice) => (
                <Chip
                  key={choice.id}
                  pressed={journey.replaced === choice.id}
                  idle={choiceFill('one', REPLACED.some((item) => item.id === journey.replaced))}
                  onClick={() => onChange({ replaced: journey.replaced === choice.id ? '' : choice.id })}
                >
                  {choice.label}
                </Chip>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}

      {wouldRide ? (
        <Reveal>
          <People
            title="Qui le ferait en transport en commun ?"
            hint="La personne qui conduit peut ne plus le faire."
            rule="many"
            people={answers.people}
            selected={tripReplacedRiders(journey, answers.people.length)}
            onToggle={(replacedRiders) => onChange({ replacedRiders })}
          />
        </Reveal>
      ) : null}

      <label className="mt-4 block text-base font-extrabold">
        Commentaire <span className="font-medium text-muted">(facultatif)</span>
        <textarea
          value={journey.comment}
          maxLength={400}
          rows={2}
          className={`mt-2 w-full rounded-2xl px-4 py-3 text-base font-medium ${fieldClass(Boolean(journey.comment.trim()), true)}`}
          onChange={(event) => onChange({ comment: event.target.value })}
        />
      </label>
      <MissingReturn retour={journey.retour} />
    </article>
  )
}

function MissingReturn({ retour, inset = false }: { retour: string; inset?: boolean }) {
  if (retour) return null
  return (
    <p role="status" className={`${inset ? 'mx-3 mb-3' : ''} mt-4 rounded-2xl bg-clay px-4 py-3 text-center text-base font-extrabold text-paper`}>
      Pas de retour sur ce trajet ?
    </p>
  )
}

function DeleteTrip({
  confirming,
  onAsk,
  onCancel,
  onConfirm,
}: {
  confirming: boolean
  onAsk: () => void
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Supprimer ce trajet"
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-xl font-bold leading-none text-ink"
        onClick={onAsk}
      >
        ×
      </button>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
          <p className="text-sm font-bold">Supprimer ce trajet ?</p>
          <button type="button" className="h-8 rounded-md bg-danger px-2 text-sm font-extrabold text-white" onClick={onConfirm}>
            Supprimer
          </button>
          <button type="button" className="h-8 rounded-md border border-line bg-paper px-2 text-sm font-extrabold" onClick={onCancel}>
            Annuler
          </button>
        </div>
      ) : null}
    </>
  )
}

function TripHeading({ journey, position }: { journey: Journey; position: number }) {
  const { title, route } = journeyHeading(journey, position)
  return (
    <span className="block">
      <span className="block text-base font-extrabold leading-tight">{title}</span>
      <span className="mt-0.5 block text-sm font-medium leading-tight text-muted">{route}</span>
    </span>
  )
}

function RouteField({
  origin,
  originPlace,
  destination,
  place,
  onChange,
}: {
  origin: string
  originPlace: string
  destination: string
  place: string
  onChange: (patch: Partial<Journey>) => void
}) {
  return (
    <div className="mt-4 rounded-2xl border border-line p-3">
      <p className="text-base font-extrabold">De</p>
      <PlacePicker
        label="De"
        value={origin}
        place={originPlace}
        detail
        onChange={({ value, place: nextPlace }) => onChange({ origin: value, originPlace: nextPlace })}
      />
      <p className="flex justify-center py-3 text-4xl font-extrabold leading-none text-pine" aria-hidden>
        ↓
      </p>
      <p className="text-base font-extrabold">À</p>
      <PlacePicker
        label="À"
        value={destination}
        place={place}
        detail
        onChange={({ value, place: nextPlace }) => onChange({ destination: value, place: nextPlace })}
      />
    </div>
  )
}

function Frequency({ journey, onChange }: { journey: Journey; onChange: (patch: Partial<Journey>) => void }) {
  const weeksRef = useRef<HTMLInputElement>(null)
  const focusWeeks = useRef(false)

  useEffect(() => {
    if (!focusWeeks.current || journey.pace !== 'intervalle') return
    focusWeeks.current = false
    weeksRef.current?.focus()
  }, [journey.pace])

  function chooseInterval() {
    if (journey.pace !== 'intervalle') {
      focusWeeks.current = true
      onChange({ pace: 'intervalle', regularity: 'regulier' })
      return
    }
    weeksRef.current?.focus()
  }

  function toggleDay(day: Weekday) {
    const days = journey.days.includes(day) ? journey.days.filter((item) => item !== day) : [...journey.days, day]
    onChange({ days, regularity: 'regulier' })
  }

  return (
    <fieldset className="mt-4">
      <legend className="text-base font-extrabold">À quelle fréquence ?</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        <Chip
          pressed={journey.regularity === 'irregulier'}
          idle={choiceFill('one', Boolean(journey.regularity))}
          onClick={() => onChange({ regularity: journey.regularity === 'irregulier' ? '' : 'irregulier' })}
        >
          Pas régulier
        </Chip>
        <Chip
          pressed={journey.regularity === 'regulier'}
          idle={choiceFill('one', Boolean(journey.regularity))}
          onClick={() => onChange({ regularity: journey.regularity === 'regulier' ? '' : 'regulier' })}
        >
          Régulier
        </Chip>
      </div>
      {journey.regularity === 'irregulier' ? (
        <Reveal>
          <div className="mt-2 flex w-full flex-nowrap items-center gap-0.5">
            {RARE_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={journey.rareCount === count}
                className={`min-w-6 ${lineButton(journey.rareCount === count, choiceFill('one', Boolean(journey.rareCount)))}`}
                onClick={() => onChange({ rareCount: journey.rareCount === count ? '' : count, regularity: 'irregulier' })}
              >
                {count}
              </button>
            ))}
            <span className="shrink-0 px-0.5 text-sm font-bold">fois par</span>
            {RARE_UNITS.map((unit) => (
              <button
                key={unit.id}
                type="button"
                aria-pressed={journey.rareUnit === unit.id}
                className={lineButton(journey.rareUnit === unit.id, choiceFill('one', Boolean(journey.rareUnit)))}
                onClick={() => onChange({ rareUnit: journey.rareUnit === unit.id ? '' : unit.id, regularity: 'irregulier' })}
              >
                {unit.label}
              </button>
            ))}
          </div>
        </Reveal>
      ) : null}
      {journey.regularity === 'regulier' ? (
        <Reveal>
          <div className="mt-2 flex w-full flex-nowrap items-center gap-0.5">
            <button
              type="button"
              aria-pressed={journey.pace === 'hebdo'}
              className={lineButton(journey.pace === 'hebdo', choiceFill('one', journey.pace === 'hebdo' || journey.pace === 'intervalle'))}
              onClick={() => onChange({ pace: journey.pace === 'hebdo' ? '' : 'hebdo', regularity: 'regulier' })}
            >
              Hebdomadaire
            </button>
            <button
              type="button"
              aria-pressed={journey.pace === 'intervalle'}
              className={lineButton(journey.pace === 'intervalle', choiceFill('one', journey.pace === 'hebdo' || journey.pace === 'intervalle'))}
              onClick={chooseInterval}
            >
              Toutes les
            </button>
            <input
              ref={weeksRef}
              inputMode="numeric"
              aria-label="Nombre de semaines"
              value={journey.everyWeeks}
              disabled={journey.pace !== 'intervalle'}
              className={`h-8 w-10 shrink-0 rounded-md px-0.5 text-center text-sm font-extrabold disabled:opacity-40 ${fieldClass(journey.pace !== 'intervalle' || Boolean(journey.everyWeeks.trim()), false)}`}
              onChange={(event) => onChange({ everyWeeks: event.target.value.replace(/\D/g, '').slice(0, 2), pace: 'intervalle', regularity: 'regulier' })}
            />
            <span className="shrink-0 px-0.5 text-sm font-bold">semaines</span>
          </div>
          <div className="mt-2 flex w-full flex-nowrap gap-0.5">
            {WEEKDAYS.map((day) => (
              <button
                key={day.id}
                type="button"
                aria-pressed={journey.days.includes(day.id)}
                className={lineButton(journey.days.includes(day.id), choiceFill('many', journey.days.length > 0))}
                onClick={() => toggleDay(day.id)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </Reveal>
      ) : null}
    </fieldset>
  )
}

function Hours({
  aller,
  retour,
  onAller,
  onRetour,
}: {
  aller: SlotId | ''
  retour: SlotId | ''
  onAller: (slot: SlotId | '') => void
  onRetour: (slot: SlotId | '') => void
}) {
  const columns = 'grid grid-cols-[5.4rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-3'
  return (
    <div className="mt-4">
      <div className={`${columns} items-end pb-1`}>
        <span />
        <p className="text-center text-[13px] font-extrabold leading-tight">Horaire aller</p>
        <p className="text-center text-[13px] font-extrabold leading-tight">
          Horaire retour
          <span className="mt-0.5 block text-xs font-medium text-muted">facultatif</span>
        </p>
      </div>
      {SLOT_GROUPS.map((group, index) => (
        <div key={group.label} className={`${columns} py-1.5 ${index > 0 ? 'border-t border-ink/15' : ''}`}>
          <p className="text-left text-[13px] font-bold leading-tight">{group.label}</p>
          <SlotPair slots={group.slots} value={aller} idle={choiceFill('one', Boolean(aller))} onPick={onAller} />
          <SlotPair slots={group.slots} value={retour} idle={choiceFill('free-one', Boolean(retour))} onPick={onRetour} />
        </div>
      ))}
    </div>
  )
}

function SlotPair({
  slots,
  value,
  idle,
  onPick,
}: {
  slots: SlotId[]
  value: SlotId | ''
  idle: ChoiceFill
  onPick: (slot: SlotId | '') => void
}) {
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {slots.map((id) => (
        <SlotButton key={id} id={id} pressed={value === id} idle={idle} onPick={() => onPick(value === id ? '' : id)} />
      ))}
    </div>
  )
}

function SlotButton({ id, pressed, idle, onPick }: { id: SlotId; pressed: boolean; idle: ChoiceFill; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`h-9 rounded-lg px-1.5 text-[13px] font-extrabold leading-none ${pressed ? 'bg-pine text-white' : idleClass(idle)}`}
      onClick={onPick}
    >
      {SLOTS.find((slot) => slot.id === id)?.label}
    </button>
  )
}

function People({
  title,
  hint,
  rule,
  people,
  selected,
  extras = 0,
  onToggle,
  onExtras,
}: {
  title: string
  hint?: string
  rule: 'many' | 'free'
  people: Person[]
  selected: number[]
  extras?: number
  onToggle: (indexes: number[]) => void
  onExtras?: (count: number) => void
}) {
  const householdIdle = choiceFill(rule, selected.length > 0)
  const extraIdle = choiceFill('free', extras > 0)
  return (
    <fieldset className="mt-4">
      <legend className="text-base font-extrabold">{title}</legend>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {people.map((person, index) => (
          <Chip
            key={index}
            pressed={selected.includes(index)}
            idle={householdIdle}
            onClick={() => onToggle(selected.includes(index) ? selected.filter((item) => item !== index) : [...selected, index])}
          >
            {personChip(person, index)}
          </Chip>
        ))}
        {onExtras
          ? Array.from({ length: extras + 1 }, (_, index) => (
              <Chip
                key={`extra-${index}`}
                pressed={index < extras}
                idle={extraIdle}
                onClick={() => onExtras(index < extras ? extras - 1 : extras + 1)}
              >
                Autre passager
              </Chip>
            ))
          : null}
      </div>
    </fieldset>
  )
}

function lineButton(pressed: boolean, idle: ChoiceFill): string {
  return `h-8 flex-1 rounded-md px-0.5 text-sm font-extrabold ${pressed ? 'bg-pine text-white' : idleClass(idle)}`
}

function Chip({ pressed, idle, onClick, children }: { pressed: boolean; idle: ChoiceFill; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`min-h-11 rounded-2xl px-3 text-sm font-extrabold ${pressed ? 'bg-pine text-white' : idleClass(idle)}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function personChip(person: Person, index: number): string {
  const age = AGE_BANDS.find((band) => band.value === person.age)?.label
  return age ? `Personne ${index + 1} · ${age}` : `Personne ${index + 1}`
}
