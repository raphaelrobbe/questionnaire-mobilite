import { AGE_BANDS, DRIVE_OPTIONS, MAX_PEOPLE, addPerson, asksAutonomie, changePerson, removePerson, type Person } from '~/common/survey'
import { Button } from './Button'
import { choiceClass } from './fill'
import { Reveal } from './Reveal'

export function HouseholdStep({ people, onChange }: { people: Person[]; onChange: (people: Person[]) => void }) {
  return (
    <div className="mt-6 grid gap-4">
      {people.map((person, index) => (
        <Reveal key={index}>
        <fieldset className="grid gap-3 rounded-[28px] border border-line bg-card px-4 py-4">
          <legend className="px-1 font-extrabold">Personne {index + 1}</legend>
          <div>
            <p className="text-sm font-bold text-muted">Tranche d’âge</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGE_BANDS.map((option) => (
                <Chip
                  key={option.value}
                  selected={person.age === option.value}
                  chosen={Boolean(person.age)}
                  label={option.label}
                  onClick={() => onChange(changePerson(people, index, { age: option.value }))}
                />
              ))}
            </div>
          </div>
          {person.age !== '' && person.age !== '0-14' ? (
            <Reveal>
              <div>
                <p className="text-sm font-bold text-muted">Conduite</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DRIVE_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      selected={person.drive === option.value}
                      chosen={Boolean(person.drive)}
                      label={option.label}
                      onClick={() => onChange(changePerson(people, index, { drive: option.value }))}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          ) : null}
          {asksAutonomie(person) ? (
            <Reveal>
            <label className="flex min-h-11 items-start gap-3">
              <input
                type="checkbox"
                checked={person.manqueAutonomie}
                onChange={(event) => onChange(changePerson(people, index, { manqueAutonomie: event.target.checked }))}
                className="mt-1 size-5 accent-pine"
              />
              <span className="font-bold">Lié à un manque d’autonomie</span>
            </label>
            </Reveal>
          ) : null}
          {people.length > 1 ? (
            <Button variant="ghost" className="w-auto justify-self-start px-0" onClick={() => onChange(removePerson(people, index))}>
              Retirer cette personne
            </Button>
          ) : null}
        </fieldset>
        </Reveal>
      ))}
      <Button variant="secondary" disabled={people.length >= MAX_PEOPLE} onClick={() => onChange(addPerson(people))}>
        Ajouter une personne
      </Button>
    </div>
  )
}

function Chip({ selected, chosen, label, onClick }: { selected: boolean; chosen: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 rounded-full px-3 text-sm font-bold ${choiceClass(selected, 'one', chosen)}`}
    >
      {label}
    </button>
  )
}
