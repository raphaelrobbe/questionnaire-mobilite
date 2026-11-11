import { WALK_DISTANCES, setWalkDistance, setWalkNote, type Answers } from '~/common/survey'
import { choiceClass, fieldClass } from './fill'

export function WalkDistanceStep({ answers, onChange }: { answers: Answers; onChange: (patch: Partial<Answers>) => void }) {
  const distance = answers.walkDistance
  const chosen = Boolean(distance.choice)

  return (
    <div className="mt-4 grid gap-4">
      <div className="grid gap-2">
        {WALK_DISTANCES.map((item) => {
          const selected = distance.choice === item.value
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={selected}
              className={`min-h-14 w-full rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug ${choiceClass(selected, 'one', chosen)}`}
              onClick={() => onChange({ walkDistance: setWalkDistance(distance, item.value) })}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <label className="grid gap-2">
        <span className="font-bold">Préciser</span>
        <input
          value={distance.note}
          maxLength={160}
          placeholder="Préciser"
          className={`min-h-14 w-full rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(distance.note.trim()), true)}`}
          onChange={(event) => onChange({ walkDistance: setWalkNote(distance, event.target.value) })}
        />
      </label>
    </div>
  )
}
