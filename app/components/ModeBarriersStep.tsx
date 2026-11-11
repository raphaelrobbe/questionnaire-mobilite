import { MODE_BARRIERS, setModeBarrierNote, toggleModeBarrier, type Answers } from '~/common/survey'
import { choiceClass, fieldClass } from './fill'

export function ModeBarriersStep({ answers, onChange }: { answers: Answers; onChange: (patch: Partial<Answers>) => void }) {
  const barriers = answers.modeBarriers
  const chosen = barriers.selected.length > 0
  const none = barriers.selected.includes('aucun')
  const some = barriers.selected.some((id) => id !== 'aucun')

  return (
    <div className="mt-4 grid gap-4">
      <div className="grid gap-2">
        {MODE_BARRIERS.map((barrier) => {
          const selected = barriers.selected.includes(barrier.value)
          const disabled = !selected && (barrier.value === 'aucun' ? some : none)
          return (
            <button
              key={barrier.value}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              className={`min-h-14 w-full rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted ${choiceClass(selected, 'many', chosen)}`}
              onClick={() => onChange({ modeBarriers: toggleModeBarrier(barriers, barrier.value) })}
            >
              {barrier.label}
            </button>
          )
        })}
      </div>
      <label className="grid gap-2">
        <span className="font-bold">Préciser</span>
        <input
          value={barriers.note}
          maxLength={160}
          placeholder="Préciser"
          className={`min-h-14 w-full rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(barriers.note.trim()), true)}`}
          onChange={(event) => onChange({ modeBarriers: setModeBarrierNote(barriers, event.target.value) })}
        />
      </label>
    </div>
  )
}
