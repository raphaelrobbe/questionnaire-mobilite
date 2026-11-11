import {
  MODE_CONDITION_GROUPS,
  MODE_CONDITIONS,
  setModeConditionNote,
  toggleModeCondition,
  type Answers,
  type ModeConditionId,
} from '~/common/survey'
import { choiceClass, fieldClass } from './fill'

const TAIL: ModeConditionId[] = ['autre', 'aucune']

export function ModeConditionsStep({ answers, onChange }: { answers: Answers; onChange: (patch: Partial<Answers>) => void }) {
  const conditions = answers.modeConditions
  const chosen = conditions.selected.length > 0
  const none = conditions.selected.includes('aucune')
  const some = conditions.selected.some((id) => id !== 'aucune')

  function button(id: ModeConditionId) {
    const label = MODE_CONDITIONS.find((item) => item.value === id)?.label ?? id
    const selected = conditions.selected.includes(id)
    const disabled = !selected && (id === 'aucune' ? some : none)
    return (
      <button
        key={id}
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        className={`min-h-14 w-full rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted ${choiceClass(selected, 'many', chosen)}`}
        onClick={() => onChange({ modeConditions: toggleModeCondition(conditions, id) })}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="mt-4 grid gap-5">
      {MODE_CONDITION_GROUPS.map((group) => (
        <div key={group.title}>
          <h2 className="text-lg font-extrabold">{group.title}</h2>
          <div className="mt-2 grid gap-2">{group.ids.map((id) => button(id))}</div>
        </div>
      ))}
      <div className="grid gap-2">{TAIL.map((id) => button(id))}</div>
      <label className="grid gap-2">
        <span className="font-bold">Préciser</span>
        <input
          value={conditions.note}
          maxLength={160}
          placeholder="Préciser"
          className={`min-h-14 w-full rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(conditions.note.trim()), true)}`}
          onChange={(event) => onChange({ modeConditions: setModeConditionNote(conditions, event.target.value) })}
        />
      </label>
    </div>
  )
}
