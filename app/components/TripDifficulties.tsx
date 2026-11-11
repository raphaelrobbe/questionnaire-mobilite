import {
  DIFFICULTY_GROUPS,
  DIFFICULTY_ITEMS,
  DIFFICULTY_PACES,
  setDifficultyNote,
  setDifficultyTripPace,
  toggleDifficultyGroup,
  toggleDifficultyItem,
  toggleDifficultyTrip,
  type DifficultyNoteKey,
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

  return (
    <fieldset className="mt-4">
      <legend className="text-base font-extrabold">Rencontrez-vous des difficultés lors de ces trajets ?</legend>
      <p className="mt-1 text-sm text-muted">Plusieurs réponses possibles.</p>
      <div className="mt-2 grid gap-2">
        {DIFFICULTY_GROUPS.map((group) => {
          const selected = difficulties.groups.includes(group.id)
          const disabled = !selected && (group.id === 'aucune' ? some : none)
          return (
            <div key={group.id}>
              <Choice
                pressed={selected}
                disabled={disabled}
                idle={choiceFill('many', chosen)}
                onClick={() => onChange(toggleDifficultyGroup(difficulties, group.id))}
              >
                {group.label}
              </Choice>
              {selected && group.id !== 'aucune' ? (
                <div className="mt-1 ml-4 grid gap-1">
                  {group.id === 'autres' ? (
                    <>
                      <textarea
                        value={difficulties.notes.autres}
                        maxLength={160}
                        rows={2}
                        aria-label="Pouvez-vous préciser ?"
                        placeholder="Pouvez-vous préciser ?"
                        className={`w-full rounded-xl px-3 py-2 text-sm font-medium ${fieldClass(Boolean(difficulties.notes.autres.trim()), false)}`}
                        onChange={(event) => onChange(setDifficultyNote(difficulties, 'autres', event.target.value))}
                      />
                      {difficulties.notes.autres.trim() ? (
                        <TripPaces
                          trips={trips}
                          selected={difficulties.trips.autres ?? []}
                          onToggle={(tripId) => onChange(toggleDifficultyTrip(difficulties, 'autres', tripId))}
                          onPace={(tripId, pace) => onChange(setDifficultyTripPace(difficulties, 'autres', tripId, pace))}
                        />
                      ) : null}
                    </>
                  ) : (
                    <Items group={group.id} trips={trips} difficulties={difficulties} onChange={onChange} />
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

function Items({
  group,
  trips,
  difficulties,
  onChange,
}: {
  group: Exclude<DifficultyNoteKey, 'autres'>
  trips: { id: string; label: string }[]
  difficulties: JourneyDifficulties
  onChange: (difficulties: JourneyDifficulties) => void
}) {
  const items = DIFFICULTY_ITEMS.filter((item) => item.group === group)
  const picked = items.some((item) => difficulties.items.includes(item.id))
  return (
    <>
      {items.map((item) => {
        const selected = difficulties.items.includes(item.id)
        const ready = !item.autre || Boolean(difficulties.notes[group].trim())
        return (
          <div key={item.id}>
            <Choice
              compact
              pressed={selected}
              idle={choiceFill('many', picked)}
              onClick={() => onChange(toggleDifficultyItem(difficulties, item.id))}
            >
              {item.label}
            </Choice>
            {selected ? (
              <div className="mt-1 ml-4 grid gap-1">
                {item.autre ? (
                  <input
                    value={difficulties.notes[group]}
                    maxLength={160}
                    aria-label="Préciser"
                    placeholder="Préciser"
                    className={`min-h-10 w-full rounded-xl px-3 text-sm font-medium ${fieldClass(Boolean(difficulties.notes[group].trim()), false)}`}
                    onChange={(event) => onChange(setDifficultyNote(difficulties, group, event.target.value))}
                  />
                ) : null}
                {ready ? (
                  <TripPaces
                    trips={trips}
                    selected={difficulties.trips[item.id] ?? []}
                    onToggle={(tripId) => onChange(toggleDifficultyTrip(difficulties, item.id, tripId))}
                    onPace={(tripId, pace) => onChange(setDifficultyTripPace(difficulties, item.id, tripId, pace))}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

function TripPaces({
  trips,
  selected,
  onToggle,
  onPace,
}: {
  trips: { id: string; label: string }[]
  selected: { id: string; pace: DifficultyPace | '' }[]
  onToggle: (tripId: string) => void
  onPace: (tripId: string, pace: DifficultyPace) => void
}) {
  const picked = selected.length > 0
  return (
    <div className="grid gap-1">
      {trips.length ? (
        trips.map((trip) => {
          const link = selected.find((item) => item.id === trip.id)
          return (
            <div key={trip.id}>
              <Choice compact pressed={Boolean(link)} idle={choiceFill('many', picked)} onClick={() => onToggle(trip.id)}>
                {trip.label}
              </Choice>
              {link ? (
                <div className="mt-1 ml-4">
                  <PaceButtons pace={link.pace} onPace={(pace) => onPace(trip.id, pace)} />
                </div>
              ) : null}
            </div>
          )
        })
      ) : (
        <p className="text-sm text-muted">Aucun trajet noté pour l’instant.</p>
      )}
    </div>
  )
}

function PaceButtons({ pace, onPace }: { pace: DifficultyPace | ''; onPace: (pace: DifficultyPace) => void }) {
  const idle = choiceFill('one', Boolean(pace))
  return (
    <div className="grid grid-cols-3 gap-1">
      {DIFFICULTY_PACES.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={pace === item.id}
          className={`h-8 rounded-md px-1 text-xs font-extrabold ${pace === item.id ? 'bg-pine text-white' : idleClass(idle)}`}
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
  compact = false,
  onClick,
  children,
}: {
  pressed: boolean
  idle: ChoiceFill
  disabled?: boolean
  compact?: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      className={`${compact ? 'min-h-9 rounded-xl px-2.5 text-[13px]' : 'min-h-11 rounded-2xl px-3 text-sm'} w-full text-left font-extrabold leading-snug disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted ${pressed ? 'bg-pine text-white' : idleClass(idle)}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
