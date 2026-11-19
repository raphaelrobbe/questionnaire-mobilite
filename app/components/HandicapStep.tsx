import { questionNote, questionText } from '~/common/questionnaire'
import {
  HANDICAP_ADAPTATIONS,
  ageLabel,
  setHandicapAutre,
  toggleHandicapPerson,
  toggleHandicapType,
  type Answers,
  type Person,
} from '~/common/survey'
import { choiceClass, choiceFill, fieldClass, idleClass } from './fill'

export function HandicapStep({ answers, onChange }: { answers: Answers; onChange: (patch: Partial<Answers>) => void }) {
  return (
    <div className="mt-4 grid gap-6">
      <fieldset>
        <legend className="text-base font-extrabold leading-snug">{questionText('handicap')}</legend>
        <p className="mt-1 text-base text-muted">{questionNote('handicap')}</p>
        <div className="mt-3 grid gap-2">
          {HANDICAP_ADAPTATIONS.map((item) => {
            const selected = answers.handicapTypes.includes(item.value)
            return (
              <div key={item.value}>
                <button
                  type="button"
                  aria-pressed={selected}
                  className={`min-h-14 w-full rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug ${choiceClass(selected, 'free', true)}`}
                  onClick={() => onChange(toggleHandicapType(answers, item.value))}
                >
                  <span className="block">{item.label}</span>
                  {item.note ? <span className={`mt-1 block text-sm font-medium leading-snug ${selected ? 'opacity-80' : 'text-muted'}`}>{item.note}</span> : null}
                </button>
                {selected ? (
                  <div className="mt-2 ml-4 grid gap-2">
                    <p className="text-sm font-bold text-muted">{questionText('handicap-who')}</p>
                    <div className="flex flex-wrap gap-2">
                      {answers.people.map((person, index) => {
                        const pressed = answers.handicapPeople[item.value]?.includes(index) ?? false
                        const idle = choiceFill('many', (answers.handicapPeople[item.value]?.length ?? 0) > 0)
                        return (
                          <button
                            key={index}
                            type="button"
                            aria-pressed={pressed}
                            className={`min-h-11 rounded-2xl px-3 text-sm font-extrabold ${pressed ? 'bg-pine text-white' : `${idleClass(idle)} text-ink`}`}
                            onClick={() => onChange(toggleHandicapPerson(answers, item.value, index))}
                          >
                            {personCaption(person, index)}
                          </button>
                        )
                      })}
                    </div>
                    {item.value === 'autre' ? (
                      <label className="grid gap-2">
                        <span className="font-bold">{questionText('handicap-other')}</span>
                        <input
                          value={answers.handicapAutre}
                          maxLength={160}
                          onChange={(event) => onChange(setHandicapAutre(answers, event.target.value))}
                          className={`min-h-14 rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(answers.handicapAutre.trim()), false)}`}
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </fieldset>
      <label className="grid gap-2">
        <span className="text-base font-extrabold">Commentaires</span>
        <textarea
          value={answers.handicapComment}
          maxLength={400}
          rows={3}
          className={`w-full rounded-2xl px-4 py-3 text-base font-medium outline-none focus:border-leaf ${fieldClass(Boolean(answers.handicapComment.trim()), true)}`}
          onChange={(event) => onChange({ handicapComment: event.target.value })}
        />
      </label>
    </div>
  )
}

function personCaption(person: Person, index: number): string {
  const age = ageLabel(person.age)
  return age ? `Personne ${index + 1} · ${age}` : `Personne ${index + 1}`
}
