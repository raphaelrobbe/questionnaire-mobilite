import { questionText } from '~/common/questionnaire'
import { MODE_REASONS, setModeNote, toggleModeReason, type Answers } from '~/common/survey'
import { choiceClass, fieldClass } from './fill'

export function ModeReasonsStep({ answers, onChange }: { answers: Answers; onChange: (patch: Partial<Answers>) => void }) {
  const reasons = answers.modeReasons
  const chosen = reasons.selected.length > 0
  const none = reasons.selected.includes('aucune')
  const some = reasons.selected.some((id) => id !== 'aucune')

  return (
    <div className="mt-4 grid gap-4">
      <div className="grid gap-2">
        {MODE_REASONS.map((reason) => {
          const selected = reasons.selected.includes(reason.value)
          const disabled = !selected && (reason.value === 'aucune' ? some : none)
          return (
            <button
              key={reason.value}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              className={`min-h-14 w-full rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted ${choiceClass(selected, 'many', chosen)}`}
              onClick={() => onChange({ modeReasons: toggleModeReason(reasons, reason.value) })}
            >
              {reason.label}
            </button>
          )
        })}
      </div>
      <label className="grid gap-2">
        <span className="font-bold">{questionText('reasons-note')}</span>
        <input
          value={reasons.note}
          maxLength={160}
          placeholder="Préciser"
          className={`min-h-14 w-full rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(reasons.note.trim()), true)}`}
          onChange={(event) => onChange({ modeReasons: setModeNote(reasons, event.target.value) })}
        />
      </label>
    </div>
  )
}
