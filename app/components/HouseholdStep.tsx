import { AGE_BANDS, DRIVE_OPTIONS, MAX_PEOPLE, addPerson, changePerson, removePerson, type Person } from '~/common/survey'
import { Button } from './Button'

export function HouseholdStep({ people, onChange }: { people: Person[]; onChange: (people: Person[]) => void }) {
  return (
    <div className="mt-6 grid gap-4">
      {people.map((person, index) => (
        <fieldset key={index} className="grid gap-3 rounded-[28px] border border-line bg-card px-4 py-4">
          <legend className="px-1 font-extrabold">Personne {index + 1}</legend>
          <div>
            <p className="text-sm font-bold text-muted">Tranche d’âge</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGE_BANDS.map((option) => (
                <Chip
                  key={option.value}
                  selected={person.age === option.value}
                  label={option.label}
                  onClick={() => onChange(changePerson(people, index, { age: option.value }))}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-muted">Conduite</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DRIVE_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  selected={person.drive === option.value}
                  label={option.label}
                  onClick={() => onChange(changePerson(people, index, { drive: option.value }))}
                />
              ))}
            </div>
          </div>
          {people.length > 1 ? (
            <Button variant="ghost" className="w-auto justify-self-start px-0" onClick={() => onChange(removePerson(people, index))}>
              Retirer cette personne
            </Button>
          ) : null}
        </fieldset>
      ))}
      <Button variant="secondary" disabled={people.length >= MAX_PEOPLE} onClick={() => onChange(addPerson(people))}>
        Ajouter une personne
      </Button>
    </div>
  )
}

function Chip({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3 text-sm font-bold ${
        selected ? 'border-pine bg-pine text-paper' : 'border-line bg-paper text-ink'
      }`}
    >
      {label}
    </button>
  )
}
