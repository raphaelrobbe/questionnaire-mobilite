import { useEffect } from 'react'
import {
  DIFFICULTY_GROUPS,
  DIFFICULTY_ITEMS,
  DIFFICULTY_PACES,
  applySoleTrip,
  setDifficultyNote,
  setDifficultyTripPace,
  toggleDifficultyGroup,
  toggleDifficultyItem,
  toggleDifficultyTrip,
  type DifficultyGroup,
  type DifficultyKey,
  type DifficultyPace,
  type JourneyDifficulties,
} from '~/common/journeys'
import { choiceFill, fieldClass, idleClass, type ChoiceFill } from './fill'

export function TripDifficulties({
  trips,
  difficulties,
  onChange,
}: {
  trips: { id: string; label: string }[]
  difficulties: JourneyDifficulties
  onChange: (difficulties: JourneyDifficulties) => void
}) {
  const chosen = difficulties.groups.length > 0
  const none = difficulties.groups.includes('aucune')
  const some = difficulties.groups.some((id) => id !== 'aucune')
  const tripIds = trips.map((trip) => trip.id)
  const themes = DIFFICULTY_GROUPS.filter(
    (group): group is { id: Exclude<DifficultyGroup, 'aucune'>; label: string } => group.id !== 'aucune',
  )

  useEffect(() => {
    const next = applySoleTrip(difficulties, tripIds)
    if (next !== difficulties) onChange(next)
  }, [difficulties, onChange, tripIds])

  function emit(next: JourneyDifficulties) {
    onChange(applySoleTrip(next, tripIds))
  }

  function choosePace(key: DifficultyKey, tripId: string, pace: DifficultyPace) {
    const list = difficulties.trips[key] ?? []
    const link = list.find((trip) => trip.id === tripId)
    if (!link) {
      emit(setDifficultyTripPace(toggleDifficultyTrip(difficulties, key, tripId), key, tripId, pace))
      return
    }
    if (link.pace === pace) {
      emit(trips.length === 1 ? setDifficultyTripPace(difficulties, key, tripId, pace) : toggleDifficultyTrip(difficulties, key, tripId))
      return
    }
    emit(setDifficultyTripPace(difficulties, key, tripId, pace))
  }

  return (
    <div className="mt-4 grid gap-3">
      <fieldset>
        <legend className="text-base font-extrabold">Rencontrez-vous des difficultés lors de ces trajets ?</legend>
        <p className="mt-1 text-sm text-muted">Plusieurs réponses possibles. Ouvrez un thème, puis indiquez la fréquence.</p>
      </fieldset>
      {themes.map((group) => (
        <ThemeCard
          key={group.id}
          group={group.id}
          label={group.label}
          open={difficulties.groups.includes(group.id)}
          disabled={!difficulties.groups.includes(group.id) && none}
          idle={choiceFill('many', chosen)}
          trips={trips}
          difficulties={difficulties}
          onToggle={() => emit(toggleDifficultyGroup(difficulties, group.id))}
          onItem={(id) => emit(toggleDifficultyItem(difficulties, id))}
          onNote={(note) => emit(setDifficultyNote(difficulties, group.id, note))}
          onPace={(key, tripId, pace) => choosePace(key, tripId, pace)}
        />
      ))}
      <Choice
        pressed={none}
        disabled={!none && some}
        idle={choiceFill('many', chosen)}
        onClick={() => emit(toggleDifficultyGroup(difficulties, 'aucune'))}
      >
        Aucune difficulté particulière
      </Choice>
    </div>
  )
}

function ThemeCard({
  group,
  label,
  open,
  disabled,
  idle,
  trips,
  difficulties,
  onToggle,
  onItem,
  onNote,
  onPace,
}: {
  group: Exclude<DifficultyGroup, 'aucune'>
  label: string
  open: boolean
  disabled: boolean
  idle: ChoiceFill
  trips: { id: string; label: string }[]
  difficulties: JourneyDifficulties
  onToggle: () => void
  onItem: (id: (typeof DIFFICULTY_ITEMS)[number]['id']) => void
  onNote: (note: string) => void
  onPace: (key: DifficultyKey, tripId: string, pace: DifficultyPace) => void
}) {
  const items = DIFFICULTY_ITEMS.filter((item) => item.group === group)
  const picked = items.some((item) => difficulties.items.includes(item.id))
  return (
    <section className={open ? 'rounded-2xl border border-line bg-white' : ''}>
      <button
        type="button"
        aria-pressed={open}
        aria-expanded={open}
        disabled={disabled}
        className={`min-h-12 w-full px-3 text-left text-base font-extrabold leading-snug disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted ${open ? 'rounded-t-2xl bg-white' : `rounded-2xl ${idleClass(idle)}`}`}
        onClick={onToggle}
      >
        {label}
      </button>
      {open ? (
        <div className="grid gap-3 px-3 pb-3">
          {group === 'autres' ? (
            <OtherNote
              note={difficulties.notes.autres}
              trips={trips}
              selected={difficulties.trips.autres ?? []}
              onNote={onNote}
              onPace={(tripId, pace) => onPace('autres', tripId, pace)}
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                  const selected = difficulties.items.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      className={`min-h-11 rounded-2xl px-3 text-left text-sm font-extrabold leading-snug ${selected ? 'bg-pine text-white' : idleClass(choiceFill('many', picked))}`}
                      onClick={() => onItem(item.id)}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
              {items
                .filter((item) => difficulties.items.includes(item.id))
                .map((item) => {
                  const ready = !item.autre || Boolean(difficulties.notes[group].trim())
                  return (
                    <div key={item.id} className="rounded-xl bg-paper px-3 py-2">
                      <p className="text-sm font-extrabold">{item.label}</p>
                      {item.autre ? (
                        <input
                          value={difficulties.notes[group]}
                          maxLength={160}
                          aria-label="Préciser"
                          placeholder="Préciser"
                          className={`mt-2 min-h-11 w-full rounded-xl px-3 text-base font-medium ${fieldClass(Boolean(difficulties.notes[group].trim()), false)}`}
                          onChange={(event) => onNote(event.target.value)}
                        />
                      ) : null}
                      {ready ? (
                        <TripRows
                          trips={trips}
                          selected={difficulties.trips[item.id] ?? []}
                          onPace={(tripId, pace) => onPace(item.id, tripId, pace)}
                        />
                      ) : null}
                    </div>
                  )
                })}
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}

function OtherNote({
  note,
  trips,
  selected,
  onNote,
  onPace,
}: {
  note: string
  trips: { id: string; label: string }[]
  selected: { id: string; pace: DifficultyPace | '' }[]
  onNote: (note: string) => void
  onPace: (tripId: string, pace: DifficultyPace) => void
}) {
  return (
    <div>
      <textarea
        value={note}
        maxLength={160}
        rows={2}
        aria-label="Pouvez-vous préciser ?"
        placeholder="Pouvez-vous préciser ?"
        className={`w-full rounded-xl px-3 py-2 text-base font-medium ${fieldClass(Boolean(note.trim()), false)}`}
        onChange={(event) => onNote(event.target.value)}
      />
      {note.trim() ? <TripRows trips={trips} selected={selected} onPace={onPace} /> : null}
    </div>
  )
}

function TripRows({
  trips,
  selected,
  onPace,
}: {
  trips: { id: string; label: string }[]
  selected: { id: string; pace: DifficultyPace | '' }[]
  onPace: (tripId: string, pace: DifficultyPace) => void
}) {
  if (!trips.length) return <p className="mt-2 text-sm text-muted">Aucun trajet noté pour l’instant.</p>
  const answered = selected.some((trip) => trip.pace)
  if (trips.length === 1) {
    const trip = trips[0]
    const pace = selected.find((item) => item.id === trip?.id)?.pace ?? ''
    return (
      <div className="mt-2">
        <p className="text-sm font-bold text-muted">À quelle fréquence ?</p>
        <PaceButtons pace={pace} idle={paceIdle(pace, answered)} onPace={(next) => trip && onPace(trip.id, next)} />
      </div>
    )
  }
  return (
    <div className="mt-2 grid gap-3">
      <p className="text-sm font-bold text-muted">Sur quels trajets, et à quelle fréquence ?</p>
      {trips.map((trip) => {
        const pace = selected.find((item) => item.id === trip.id)?.pace ?? ''
        return (
          <div key={trip.id}>
            <p className="text-sm font-extrabold">{trip.label}</p>
            <PaceButtons pace={pace} idle={paceIdle(pace, answered)} onPace={(next) => onPace(trip.id, next)} />
          </div>
        )
      })}
    </div>
  )
}

function paceIdle(pace: DifficultyPace | '', answered: boolean): ChoiceFill {
  if (pace) return choiceFill('one', true)
  return choiceFill(answered ? 'free' : 'one', false)
}

function PaceButtons({ pace, idle, onPace }: { pace: DifficultyPace | ''; idle: ChoiceFill; onPace: (pace: DifficultyPace) => void }) {
  return (
    <div className="mt-1 grid grid-cols-3 gap-1">
      {DIFFICULTY_PACES.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={pace === item.id}
          className={`min-h-11 rounded-xl px-1 text-sm font-extrabold ${pace === item.id ? 'bg-pine text-white' : idleClass(idle)}`}
          onClick={() => onPace(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function Choice({
  pressed,
  idle,
  disabled = false,
  onClick,
  children,
}: {
  pressed: boolean
  idle: ChoiceFill
  disabled?: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      className={`min-h-12 w-full rounded-2xl px-3 text-left text-base font-extrabold leading-snug disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted ${pressed ? 'bg-pine text-white' : idleClass(idle)}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
