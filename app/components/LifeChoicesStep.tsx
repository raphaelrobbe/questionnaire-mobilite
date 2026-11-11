import {
  AGE_BANDS,
  LIFE_CHOICES,
  setLifeNote,
  toggleLifeChoice,
  toggleLifePerson,
  type Answers,
  type LifeChoiceDetail,
  type Person,
} from '~/common/survey'
import { choiceClass, choiceFill, fieldClass, idleClass } from './fill'

export function LifeChoicesStep({ answers, onChange }: { answers: Answers; onChange: (patch: Partial<Answers>) => void }) {
  const choices = answers.lifeChoices
  const chosen = choices.selected.length > 0
  const none = choices.selected.includes('non')
  const some = choices.selected.some((id) => id !== 'non')

  return (
    <fieldset className="mt-4">
      <legend className="text-base font-extrabold leading-snug">
        Si des transports en commun adaptés à vos besoins existaient, cela pourrait-il vous amener à faire des choix
        différents dans votre vie quotidienne ?
      </legend>
      <p className="mt-1 text-base text-muted">Plusieurs réponses possibles.</p>
      <div className="mt-3 grid gap-2">
        {LIFE_CHOICES.map((choice) => {
          const selected = choices.selected.includes(choice.value)
          const disabled = !selected && (choice.value === 'non' ? some : none)
          return (
            <div key={choice.value}>
              <button
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                className={`min-h-14 w-full rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted ${choiceClass(selected, 'many', chosen)}`}
                onClick={() => onChange({ lifeChoices: toggleLifeChoice(choices, choice.value) })}
              >
                {choice.label}
              </button>
              {selected && choice.value !== 'non' ? (
                <Detail
                  people={answers.people}
                  selected={choices.people[choice.value] ?? []}
                  note={choices.notes[choice.value] ?? ''}
                  onPeople={(index) => onChange({ lifeChoices: toggleLifePerson(choices, choice.value as LifeChoiceDetail, index) })}
                  onNote={(note) => onChange({ lifeChoices: setLifeNote(choices, choice.value as LifeChoiceDetail, note) })}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

function Detail({
  people,
  selected,
  note,
  onPeople,
  onNote,
}: {
  people: Person[]
  selected: number[]
  note: string
  onPeople: (index: number) => void
  onNote: (note: string) => void
}) {
  const idle = choiceFill('many', selected.length > 0)
  return (
    <div className="mt-2 ml-4 grid gap-2">
      <div className="flex flex-wrap gap-2">
        {people.map((person, index) => {
          const pressed = selected.includes(index)
          return (
            <button
              key={index}
              type="button"
              aria-pressed={pressed}
              className={`min-h-11 rounded-2xl px-3 text-sm font-extrabold ${pressed ? 'bg-pine text-white' : `${idleClass(idle)} text-ink`}`}
              onClick={() => onPeople(index)}
            >
              {personLabel(person, index)}
            </button>
          )
        })}
      </div>
      <input
        value={note}
        maxLength={160}
        aria-label="Préciser"
        placeholder="Préciser"
        className={`min-h-11 w-full rounded-xl px-3 text-sm font-medium outline-none focus:border-leaf ${fieldClass(Boolean(note.trim()), true)}`}
        onChange={(event) => onNote(event.target.value)}
      />
    </div>
  )
}

function personLabel(person: Person, index: number): string {
  const age = AGE_BANDS.find((band) => band.value === person.age)?.label
  return age ? `Personne ${index + 1} · ${age}` : `Personne ${index + 1}`
}
