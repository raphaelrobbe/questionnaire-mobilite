import { Fragment } from 'react'
import { questionNote, questionText } from '~/common/questionnaire'
import {
  ageLabel,
  LIFE_CHOICES,
  LIFE_LIKELIHOOD,
  setLifeLikelihood,
  setLifeNote,
  toggleLifeChoice,
  toggleLifePerson,
  type LifeLikelihood,
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
      <legend className="text-base font-extrabold leading-snug">{questionText('life-choices')}</legend>
      <p className="mt-1 text-base text-muted">{questionNote('life-choices')}</p>
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
                  likelihood={choices.likelihood[choice.value] ?? {}}
                  note={choices.notes[choice.value] ?? ''}
                  onPeople={(index) => onChange({ lifeChoices: toggleLifePerson(choices, choice.value as LifeChoiceDetail, index) })}
                  onLikelihood={(index, value) => onChange({ lifeChoices: setLifeLikelihood(choices, choice.value as LifeChoiceDetail, index, value) })}
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
  likelihood,
  note,
  onPeople,
  onLikelihood,
  onNote,
}: {
  people: Person[]
  selected: number[]
  likelihood: Partial<Record<number, LifeLikelihood>>
  note: string
  onPeople: (index: number) => void
  onLikelihood: (index: number, value: LifeLikelihood) => void
  onNote: (note: string) => void
}) {
  const idle = choiceFill('many', selected.length > 0)
  return (
    <div className="mt-1.5 grid w-full gap-1.5">
      <div className="grid items-center gap-x-1 gap-y-1 [grid-template-columns:minmax(0,max-content)_repeat(3,max-content)]">
      {people.map((person, index) => {
        const pressed = selected.includes(index)
        const stance = likelihood[index]
        const scaleIdle = choiceFill('one', Boolean(stance))
        return (
          <Fragment key={index}>
            <button
              type="button"
              aria-pressed={pressed}
              className={`min-h-7 w-max max-w-full justify-self-start truncate rounded-full px-2 text-left text-[11px] font-bold leading-none ${pressed ? 'bg-pine text-white' : `${idleClass(idle)} text-ink`}`}
              onClick={() => onPeople(index)}
            >
              {personLabel(person, index)}
            </button>
            {LIFE_LIKELIHOOD.map((item) =>
              pressed ? (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={stance === item.value}
                  className={`min-h-7 rounded-md px-1.5 text-[11px] font-bold leading-none whitespace-nowrap ${stance === item.value ? 'bg-pine text-white' : `${idleClass(scaleIdle)} text-ink`}`}
                  onClick={() => onLikelihood(index, item.value)}
                >
                  {item.label}
                </button>
              ) : (
                <span key={item.value} />
              ),
            )}
          </Fragment>
        )
      })}
      </div>
      <textarea
        value={note}
        maxLength={160}
        rows={2}
        aria-label="Préciser"
        placeholder="Préciser"
        className={`w-full resize-y rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-leaf ${fieldClass(Boolean(note.trim()), true)}`}
        onChange={(event) => onNote(event.target.value)}
      />
    </div>
  )
}

function personLabel(person: Person, index: number): string {
  const age = ageLabel(person.age)
  return age ? `Personne ${index + 1} · ${age}` : `Personne ${index + 1}`
}
