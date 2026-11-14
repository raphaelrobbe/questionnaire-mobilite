import { questionText } from '~/common/questionnaire'
import { MODE_BARRIERS, setModeBarrierNote, toggleModeBarrier, type Answers } from '~/common/survey'
import { choiceClass, fieldClass } from './fill'

export function ModeBarriersStep({ answers, onChange }: { answers: Answers; onChange: (patch: Partial<Answers>) => void }) {
  const barriers = answers.modeBarriers
  const chosen = barriers.selected.length > 0
  const none = barriers.selected.includes('aucun')
  const some = barriers.selected.some((id) => id !== 'aucun')

  function button(id: (typeof MODE_BARRIERS)[number]['value'], label: string) {
    const selected = barriers.selected.includes(id)
    const disabled = !selected && (id === 'aucun' ? some : none)
    return (
      <button
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        className={`min-h-14 w-full rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted ${choiceClass(selected, 'many', chosen)}`}
        onClick={() => onChange({ modeBarriers: toggleModeBarrier(barriers, id) })}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="mt-4 grid gap-4">
      <div className="grid gap-2">
        {MODE_BARRIERS.filter((barrier) => barrier.value !== 'aucun').map((barrier) => button(barrier.value, barrier.label))}
      </div>
      <div className="border-t border-line pt-4">
        {button('aucun', MODE_BARRIERS.find((barrier) => barrier.value === 'aucun')?.label ?? '')}
      </div>
      <label className="grid gap-2">
        <span className="font-bold">{questionText('barriers-note')}</span>
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
