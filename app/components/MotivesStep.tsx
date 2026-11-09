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
  WEEK_BUTTONS,
  setPersonTheme,
  toggleDay,
  toggleFlexible,
  toggleSlot,
  vehicleModeOptions,
  type DayId,
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

export function MotivesStep({ answers, onChange }: { answers: Answers; onChange: (motives: Motives) => void }) {
  const theme = answers.motives.cursor.theme
  const personIndex = Math.min(answers.motives.cursor.person, Math.max(answers.people.length - 1, 0))
  const named = Boolean(answers.motives.autre.trim())
  const row = theme === 'autre' && !named ? undefined : answers.motives.people[personIndex]?.[theme]
  const side = questionSide(answers.commune)
  const modes = vehicleModeOptions(answers.cars, answers.twoWheelers)
  const reveal = row ? motiveReveal(theme, row, answers.motives.autre) : null

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
}: {
  title: string
  trip: Trip
  hint?: Trip
  modes: { id: string; label: string }[]
  showHours: boolean
  showModes: boolean
  onChange: (trip: Trip) => void
  onCopy?: () => void
}) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-extrabold">{title}</p>
      <div>
        <p className="font-bold">Combien de fois par semaine ?</p>
        <div className="mt-2 flex w-full gap-1">
          {WEEK_BUTTONS.map((count) => (
            <button
              key={count}
              type="button"
              aria-pressed={trip.perWeek === count}
              onClick={() => onChange({ ...trip, perWeek: count })}
              className={`inline-flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-full border px-0.5 font-bold whitespace-nowrap ${
                count === '+ de 7' ? 'flex-[1.7] text-sm' : 'text-base'
              } ${trip.perWeek === count ? 'border-pine bg-pine text-paper' : 'border-line bg-paper text-ink'}`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
      {showHours ? (
        <Reveal className="grid gap-3">
          <div>
            <p className="font-bold">Quels jours et quels horaires ?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <Chip key={day.id} selected={Boolean(trip.days[day.id])} label={day.label} onClick={() => onChange(toggleDay(trip, day.id))} />
              ))}
            </div>
          </div>
          {onCopy ? (
            <Button variant="secondary" onClick={onCopy}>
              Reprendre les mêmes horaires
            </Button>
          ) : null}
        </Reveal>
      ) : null}
      {showHours
        ? DAYS.map((day) =>
            trip.days[day.id] ? (
              <Reveal key={day.id}>
                <DayGrid day={day.id} label={day.label} trip={trip} hint={hint} onChange={onChange} />
              </Reveal>
            ) : null,
          )
        : null}
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

function DayGrid({
  day,
  label,
  trip,
  hint,
  onChange,
}: {
  day: DayId
  label: string
  trip: Trip
  hint?: Trip
  onChange: (trip: Trip) => void
}) {
  function change(direction: 'aller' | 'retour', picks: SlotPickList) {
    const current = trip.days[day] ?? { aller: [], retour: [] }
    onChange({ ...trip, days: { ...trip.days, [day]: { ...current, [direction]: picks } } })
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-line bg-card px-3 py-3">
      <p className="font-extrabold">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <SlotColumn
          title="Aller"
          picks={trip.days[day]?.aller ?? []}
          hinted={hint?.days[day]?.aller ?? []}
          onToggle={(slot) => change('aller', toggleSlot(trip.days[day]?.aller ?? [], slot))}
          onFlexible={(slot) => change('aller', toggleFlexible(trip.days[day]?.aller ?? [], slot))}
        />
        <SlotColumn
          title="Retour"
          picks={trip.days[day]?.retour ?? []}
          hinted={hint?.days[day]?.retour ?? []}
          onToggle={(slot) => change('retour', toggleSlot(trip.days[day]?.retour ?? [], slot))}
          onFlexible={(slot) => change('retour', toggleFlexible(trip.days[day]?.retour ?? [], slot))}
        />
      </div>
    </div>
  )
}

type SlotPickList = { slot: SlotId; flexible: boolean }[]

function SlotColumn({
  title,
  picks,
  hinted,
  onToggle,
  onFlexible,
}: {
  title: string
  picks: SlotPickList
  hinted: SlotPickList
  onToggle: (slot: SlotId) => void
  onFlexible: (slot: SlotId) => void
}) {
  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-bold text-muted">{title}</p>
      {SLOTS.map((slot) => {
        const selected = picks.some((pick) => pick.slot === slot.id)
        const flexible = picks.some((pick) => pick.slot === slot.id && pick.flexible)
        const marked = !selected && hinted.some((pick) => pick.slot === slot.id)
        return (
          <div key={slot.id} className="grid gap-1">
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(slot.id)}
              className={`min-h-10 rounded-xl border px-2 text-left text-xs font-bold ${
                selected ? 'border-pine bg-pine text-paper' : marked ? 'border-line bg-mist text-ink' : 'border-line bg-paper text-ink'
              }`}
            >
              {slot.label}
            </button>
            {selected ? (
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <input type="checkbox" checked={flexible} onChange={() => onFlexible(slot.id)} className="size-4 accent-pine" />
                Flexible
              </label>
            ) : null}
          </div>
        )
      })}
    </div>
  )
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

