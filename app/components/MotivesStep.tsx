import { useCallback, useEffect, useState } from 'react'
import { AGE_BANDS, questionSide, type Answers, type Person } from '~/common/survey'
import {
  BUS_CHOICES,
  BUS_OFTEN,
  DAYS,
  GAVE_UP,
  SLOTS,
  WHY_NOT,
  busQuestion,
  considerQuestion,
  canCopyHours,
  copyHours,
  goesQuestion,
  motiveReveal,
  FREQUENCIES,
  setPersonTheme,
  toggleDaySlot,
  toggleSlotFlexible,
  vehicleModeOptions,
  type Motives,
  type PersonTheme,
  type SlotId,
  type Trip,
} from '~/common/motives'
import { Button } from './Button'
import { Reveal } from './Reveal'

export function motivePersonLabel(person: Person | undefined, index: number): string {
  const age = person ? AGE_BANDS.find((band) => band.value === person.age)?.label : ''
  const who = `Personne ${index + 1}`
  return age ? `${who} · ${age}` : who
}

export function MotivesStep({
  answers,
  onChange,
  onAwaitingDay,
}: {
  answers: Answers
  onChange: (motives: Motives) => void
  onAwaitingDay?: (awaiting: boolean) => void
}) {
  const theme = answers.motives.cursor.theme
  const personIndex = Math.min(answers.motives.cursor.person, Math.max(answers.people.length - 1, 0))
  const named = Boolean(answers.motives.autre.trim())
  const row = theme === 'autre' && !named ? undefined : answers.motives.people[personIndex]?.[theme]
  const side = questionSide(answers.commune)
  const modes = vehicleModeOptions(answers.cars, answers.twoWheelers)
  const reveal = row ? motiveReveal(theme, row, answers.motives.autre) : null
  const [pendingHours, setPendingHours] = useState({ actual: false, bus: false })
  const reportPending = useCallback((part: 'actual' | 'bus', awaiting: boolean) => {
    setPendingHours((current) => (current[part] === awaiting ? current : { ...current, [part]: awaiting }))
  }, [])
  const reportActual = useCallback((awaiting: boolean) => reportPending('actual', awaiting), [reportPending])
  const reportBus = useCallback((awaiting: boolean) => reportPending('bus', awaiting), [reportPending])
  useEffect(() => {
    onAwaitingDay?.(pendingHours.actual || pendingHours.bus)
  }, [onAwaitingDay, pendingHours])
  useEffect(() => () => onAwaitingDay?.(false), [onAwaitingDay])

  function update(patch: Partial<PersonTheme>) {
    if (!row) return
    onChange(setPersonTheme(answers.motives, personIndex, theme, patch))
  }

  return (
    <div className="mt-4 grid gap-4">
      {theme === 'autre' ? (
        <label className="grid gap-2">
          <span className="font-bold">Activité</span>
          <input
            value={answers.motives.autre}
            maxLength={80}
            placeholder="Une activité qui n’est pas dans la liste"
            onChange={(event) => onChange({ ...answers.motives, autre: event.target.value.slice(0, 80) })}
            className="min-h-14 rounded-2xl border border-line bg-card px-4 text-base outline-none focus:border-leaf"
          />
          {named ? null : <span className="text-base text-muted">S’il n’y en a pas, continuez.</span>}
        </label>
      ) : null}
      {row ? (
        <div className="grid gap-5">
          <Choice
            title={goesQuestion(theme, side, answers.motives.autre)}
            options={[
              { id: 'oui', label: 'Oui' },
              { id: 'non', label: 'Non' },
            ]}
            value={row.goes}
            onChange={(goes) => update({ goes: goes as PersonTheme['goes'] })}
          />
          {reveal?.actualFrequency ? (
            <Reveal>
              <TripFields
                title="Déplacements actuels"
                trip={row.actual}
                modes={modes}
                showHours={reveal.actualHours}
                showModes={reveal.actualModes}
                onChange={(actual) => update({ actual })}
                onAwaitingDay={reportActual}
                boardKey={`${theme}:${personIndex}:actual`}
              />
            </Reveal>
          ) : null}
          {reveal?.consider ? (
            <Reveal>
              <Choice
                title={considerQuestion(theme, side, answers.motives.autre) ?? ''}
                options={[
                  { id: 'oui', label: 'Oui' },
                  { id: 'non', label: 'Non' },
                ]}
                value={row.wouldConsider}
                onChange={(wouldConsider) => update({ wouldConsider: wouldConsider as PersonTheme['goes'] })}
              />
            </Reveal>
          ) : null}
          {reveal?.bus ? (
            <div className="grid gap-3">
              <Reveal>
                <div className="grid gap-3">
                  <p className="text-lg font-extrabold leading-snug">{busQuestion(side)}</p>
                  <p className="text-base text-muted">Pensez bien aux nouveaux usages qui pourraient découler de l’offre de transports.</p>
                  <div className="flex flex-wrap gap-2">
                    {BUS_CHOICES.map((option) => (
                      <Chip key={option.id} selected={row.bus === option.id} label={option.label} onClick={() => update({ bus: option.id })} />
                    ))}
                  </div>
                </div>
              </Reveal>
              {reveal.busOften ? (
                <Reveal>
                  <div className="grid gap-2">
                    <p className="font-bold">Vous la prendriez…</p>
                    <div className="flex flex-wrap gap-2">
                      {BUS_OFTEN.map((option) => (
                        <Chip
                          key={option.id}
                          selected={row.busOften === option.id}
                          label={option.label}
                          onClick={() => update({ busOften: option.id })}
                        />
                      ))}
                    </div>
                  </div>
                </Reveal>
              ) : null}
              {reveal.busFrequency ? (
                <Reveal>
                  <TripFields
                    title="Horaires souhaités"
                    trip={row.busTrip}
                    hint={row.goes === 'oui' ? row.actual : undefined}
                    modes={modes}
                    showHours={reveal.busHours}
                    showModes={false}
                    onChange={(busTrip) => update({ busTrip })}
                    onAwaitingDay={reportBus}
                    boardKey={`${theme}:${personIndex}:bus`}
                    onCopy={
                      reveal.busHours && canCopyHours(row)
                        ? () => update({ busTrip: copyHours(row.actual, row.busTrip) })
                        : undefined
                    }
                  />
                </Reveal>
              ) : null}
            </div>
          ) : null}
          {reveal?.why ? (
            <Reveal>
            <div className="grid gap-2">
              <p className="text-lg font-extrabold leading-snug">
                Pourquoi un transport en commun ne répondrait-il pas à votre besoin de déplacement ?
              </p>
              <div className="flex flex-wrap gap-2">
                {WHY_NOT.map((option) => (
                  <Chip
                    key={option.id}
                    selected={row.whyNot.includes(option.id)}
                    label={option.label}
                    onClick={() =>
                      update({
                        whyNot: row.whyNot.includes(option.id) ? row.whyNot.filter((id) => id !== option.id) : [...row.whyNot, option.id],
                      })
                    }
                  />
                ))}
              </div>
            </div>
            </Reveal>
          ) : null}
          {reveal?.gaveUp ? (
            <Reveal>
              <Choice
                title="Avez-vous déjà renoncé à faire le déplacement en raison du manque de transports en commun ?"
                options={GAVE_UP}
                value={row.gaveUp}
                onChange={(gaveUp) => update({ gaveUp: gaveUp as PersonTheme['gaveUp'] })}
              />
            </Reveal>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function TripFields({
  title,
  trip,
  hint,
  modes,
  showHours,
  showModes,
  onChange,
  onCopy,
  onAwaitingDay,
  boardKey,
}: {
  title: string
  trip: Trip
  hint?: Trip
  modes: { id: string; label: string }[]
  showHours: boolean
  showModes: boolean
  onChange: (trip: Trip) => void
  onCopy?: () => void
  onAwaitingDay?: (awaiting: boolean) => void
  boardKey: string
}) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-extrabold">{title}</p>
      <div>
        <p className="font-bold">À quelle fréquence ?</p>
        <div className="mt-2 grid gap-2">
          {FREQUENCIES.map((frequency) => (
            <button
              key={frequency}
              type="button"
              aria-pressed={trip.perWeek === frequency}
              onClick={() => onChange({ ...trip, perWeek: frequency })}
              className={`min-h-12 rounded-2xl border px-4 text-left text-sm font-bold leading-snug ${
                trip.perWeek === frequency ? 'border-pine bg-pine text-paper' : 'border-line bg-paper text-ink'
              }`}
            >
              {frequency}
            </button>
          ))}
        </div>
      </div>
      {showHours ? (
        <Reveal className="grid gap-3">
          <p className="font-bold">Quels jours et quels horaires ?</p>
          {onCopy ? (
            <Button variant="secondary" onClick={onCopy}>
              Reprendre les mêmes horaires
            </Button>
          ) : null}
          <HoursBoard key={boardKey} trip={trip} hint={hint} onChange={onChange} onAwaitingDay={onAwaitingDay} />
        </Reveal>
      ) : null}
      {showModes ? (
        <Reveal>
        <div>
          <p className="font-bold">Par quel moyen de transport ?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {modes.map((mode) => (
              <Chip
                key={mode.id}
                selected={trip.modes.includes(mode.id)}
                label={mode.label}
                onClick={() =>
                  onChange({
                    ...trip,
                    modes: trip.modes.includes(mode.id) ? trip.modes.filter((id) => id !== mode.id) : [...trip.modes, mode.id],
                  })
                }
              />
            ))}
          </div>
        </div>
        </Reveal>
      ) : null}
    </div>
  )
}

function HoursBoard({
  trip,
  hint,
  onChange,
  onAwaitingDay,
}: {
  trip: Trip
  hint?: Trip
  onChange: (trip: Trip) => void
  onAwaitingDay?: (awaiting: boolean) => void
}) {
  const [opened, setOpened] = useState<Record<string, true>>({})
  const awaiting = Object.keys(opened).some((id) => {
    const split = id.indexOf(':')
    const direction = id.slice(0, split) as 'aller' | 'retour'
    const slot = id.slice(split + 1) as SlotId
    return !DAYS.some((day) => trip.days[day.id]?.[direction].some((pick) => pick.slot === slot))
  })
  useEffect(() => {
    onAwaitingDay?.(awaiting)
  }, [awaiting, onAwaitingDay])
  useEffect(() => () => onAwaitingDay?.(false), [onAwaitingDay])

  function reveal(direction: 'aller' | 'retour', slot: SlotId, chosen: number) {
    const id = `${direction}:${slot}`
    if (opened[id] || chosen > 0) {
      setOpened((current) => {
        if (!current[id]) return current
        const next = { ...current }
        delete next[id]
        return next
      })
      if (chosen > 0) onChange(clearDirectionSlot(trip, direction, slot))
      return
    }
    setOpened((current) => ({ ...current, [id]: true }))
  }

  return (
    <div className="grid grid-cols-2 items-start gap-x-1.5 gap-y-1">
      <p className="text-sm font-bold text-muted">Aller</p>
      <p className="text-sm font-bold text-muted">Retour</p>
      {SLOTS.map((slot) =>
        (['aller', 'retour'] as const).map((direction) => (
          <SlotCell
            key={`${direction}:${slot.id}`}
            direction={direction}
            slot={slot}
            trip={trip}
            hint={hint}
            open={Boolean(opened[`${direction}:${slot.id}`])}
            onHour={() => reveal(direction, slot.id, DAYS.filter((day) => trip.days[day.id]?.[direction].some((pick) => pick.slot === slot.id)).length)}
            onChange={onChange}
          />
        )),
      )}
    </div>
  )
}

function SlotCell({
  direction,
  slot,
  trip,
  hint,
  open,
  onHour,
  onChange,
}: {
  direction: 'aller' | 'retour'
  slot: (typeof SLOTS)[number]
  trip: Trip
  hint?: Trip
  open: boolean
  onHour: () => void
  onChange: (trip: Trip) => void
}) {
  const chosen = DAYS.filter((day) => trip.days[day.id]?.[direction].some((pick) => pick.slot === slot.id))
  const shown = open || chosen.length > 0
  const flexible = chosen.length > 0 && chosen.every((day) => trip.days[day.id]?.[direction].some((pick) => pick.slot === slot.id && pick.flexible))
  const marked = !shown && DAYS.some((day) => hint?.days[day.id]?.[direction].some((pick) => pick.slot === slot.id))
  return (
    <div className="grid gap-0.5">
      <button
        type="button"
        aria-pressed={shown}
        onClick={onHour}
        className={`min-h-10 rounded-lg border px-1.5 text-left text-xs font-bold leading-tight ${
          shown ? 'border-pine bg-pine text-paper' : marked ? 'border-line bg-mist text-ink' : 'border-line bg-paper text-ink'
        }`}
      >
        {slot.label}
      </button>
      {shown ? (
        <div className="grid grid-cols-3 gap-0.5">
          {DAYS.map((day) => {
            const selected = chosen.some((item) => item.id === day.id)
            const hinted = !selected && Boolean(hint?.days[day.id]?.[direction].some((pick) => pick.slot === slot.id))
            const waiting = chosen.length === 0
            return (
              <button
                key={day.id}
                type="button"
                aria-pressed={selected}
                aria-label={`${slot.label}, ${day.label}`}
                onClick={() => onChange(toggleDaySlot(trip, day.id, direction, slot.id))}
                className={`inline-flex min-h-8 items-center justify-center rounded-md border px-0.5 text-[11px] font-extrabold ${
                  selected
                    ? 'border-pine bg-pine text-paper'
                    : waiting
                      ? 'border-test-ink bg-test text-test-ink'
                      : hinted
                        ? 'border-line bg-mist text-ink'
                        : 'border-line bg-paper text-ink'
                }`}
              >
                {day.mark}
              </button>
            )
          })}
        </div>
      ) : null}
      {chosen.length ? (
        <label className="flex items-center gap-1 px-0.5 text-[11px] font-semibold text-muted">
          <input
            type="checkbox"
            checked={flexible}
            onChange={() => onChange(toggleSlotFlexible(trip, direction, slot.id))}
            className="size-3.5 accent-pine"
          />
          Flexible
        </label>
      ) : null}
    </div>
  )
}

function clearDirectionSlot(trip: Trip, direction: 'aller' | 'retour', slot: SlotId): Trip {
  const days: Trip['days'] = { ...trip.days }
  for (const day of DAYS) {
    const item = days[day.id]
    if (!item) continue
    const next = {
      aller: direction === 'aller' ? item.aller.filter((pick) => pick.slot !== slot) : item.aller,
      retour: direction === 'retour' ? item.retour.filter((pick) => pick.slot !== slot) : item.retour,
    }
    if (next.aller.length === 0 && next.retour.length === 0) delete days[day.id]
    else days[day.id] = next
  }
  return { ...trip, days }
}

function Choice({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: { id: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <p className="text-lg font-extrabold leading-snug">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip key={option.id} selected={value === option.id} label={option.label} onClick={() => onChange(option.id)} />
        ))}
      </div>
    </div>
  )
}

function Chip({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3 text-sm font-bold ${
        selected ? 'border-pine bg-pine text-paper' : 'border-line bg-paper text-ink'
      }`}
    >
      {label}
    </button>
  )
}

