import { useEffect, useId, useRef, useState } from 'react'
import { questionText } from '~/common/questionnaire'
import { AGE_BANDS, DRIVE_OPTIONS, MAX_PEOPLE, addPerson, ageLabel, asksAutonomie, asksElectoral, changePerson, isUnder15, personLine, removePerson, type Person } from '~/common/survey'
import { Button } from './Button'
import { choiceClass } from './fill'
import { PlacePicker } from './PlacePicker'
import { Reveal } from './Reveal'

export function HouseholdStep({
  people,
  commune,
  onChange,
}: {
  people: Person[]
  commune: string
  onChange: (people: Person[]) => void
}) {
  const [folded, setFolded] = useState<boolean[]>([])

  function toggle(index: number) {
    setFolded((current) => {
      const next = people.map((_, item) => current[item] === true)
      next[index] = !next[index]
      return next
    })
  }

  function add() {
    setFolded(people.map(() => true))
    onChange(addPerson(people))
  }

  function removeAt(index: number) {
    setFolded((current) => current.filter((_, item) => item !== index))
    onChange(removePerson(people, index))
  }

  return (
    <div className="mt-6 grid gap-4">
      {people.map((person, index) => (
        <PersonCard
          key={index}
          person={person}
          index={index}
          people={people}
          commune={commune}
          folded={people.length > 1 && folded[index] === true}
          onToggle={() => toggle(index)}
          onRemove={() => removeAt(index)}
          onChange={onChange}
        />
      ))}
      <Button variant="secondary" disabled={people.length >= MAX_PEOPLE} onClick={add}>
        Ajouter une personne
      </Button>
    </div>
  )
}

function PersonCard({
  person,
  index,
  people,
  commune,
  folded,
  onToggle,
  onRemove,
  onChange,
}: {
  person: Person
  index: number
  people: Person[]
  commune: string
  folded: boolean
  onToggle: () => void
  onRemove: () => void
  onChange: (people: Person[]) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const panelId = useId()
  const summary = personLine(person) || ageLabel(person.age)
  const several = people.length > 1
  return (
    <Reveal>
      <div className="relative rounded-[28px] border border-line bg-card">
        {several ? (
          <button
            type="button"
            aria-expanded={!folded}
            aria-controls={panelId}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-3 pr-12 text-left"
            onClick={onToggle}
          >
            <span className="shrink-0 font-extrabold">Personne {index + 1}</span>
            {folded && summary ? <span className="truncate text-sm font-medium text-muted">{summary}</span> : null}
          </button>
        ) : (
          <p className="px-4 pt-4 font-extrabold">Personne {index + 1}</p>
        )}
        {several ? (
          <RemovePerson
            confirming={confirming}
            onAsk={() => setConfirming(true)}
            onCancel={() => setConfirming(false)}
            onConfirm={onRemove}
          />
        ) : null}
        {folded ? null : (
        <div id={panelId} className={`grid gap-3 px-4 pb-4 ${several ? '' : 'pt-3'}`}>
        <div>
          <p className="text-sm font-bold text-muted">{questionText('age')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {AGE_BANDS.some((option) => option.value === person.age) || !person.age ? null : (
              <Chip compact selected chosen label={ageLabel(person.age)} onClick={() => undefined} />
            )}
            {AGE_BANDS.map((option) => (
              <Chip
                key={option.value}
                compact
                selected={person.age === option.value}
                chosen={Boolean(person.age)}
                label={option.label}
                onClick={() => onChange(changePerson(people, index, { age: option.value }))}
              />
            ))}
          </div>
        </div>
        {person.age !== '' && !isUnder15(person.age) ? (
          <Reveal>
            <div>
              <p className="text-sm font-bold text-muted">{questionText('drive')}</p>
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
              <span className="font-bold">{questionText('autonomy')}</span>
            </label>
          </Reveal>
        ) : null}
        {asksElectoral(person) ? (
          <Reveal>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-bold text-muted">{questionText('electoral')}</p>
                <WhyElectoral />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['oui', 'non'] as const).map((value) => (
                  <Chip
                    key={value}
                    selected={person.electoral === value}
                    chosen={Boolean(person.electoral)}
                    label={value === 'oui' ? 'Oui' : 'Non'}
                    onClick={() => onChange(changePerson(people, index, electoralPatch(person, value, commune)))}
                  />
                ))}
              </div>
              {person.electoral === 'oui' ? (
                <Reveal>
                  <div className="mt-3">
                    <p className="text-sm font-bold text-muted">{questionText('electoral-commune')}</p>
                    <PlacePicker
                      label="Commune d’inscription"
                      value={person.electoralCommune}
                      domicile={false}
                      suisse={false}
                      onChange={({ value }) => onChange(changePerson(people, index, { electoralCommune: value }))}
                    />
                  </div>
                </Reveal>
              ) : null}
            </div>
          </Reveal>
        ) : null}
        </div>
        )}
      </div>
    </Reveal>
  )
}

function RemovePerson({
  confirming,
  onAsk,
  onCancel,
  onConfirm,
}: {
  confirming: boolean
  onAsk: () => void
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Retirer cette personne"
        className="absolute right-3 top-0 flex h-8 w-8 items-center justify-center rounded-md text-xl font-bold leading-none text-ink"
        onClick={onAsk}
      >
        ×
      </button>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold">Retirer cette personne ?</p>
          <button type="button" className="h-8 rounded-md bg-danger px-2 text-sm font-extrabold text-white" onClick={onConfirm}>
            Retirer
          </button>
          <button type="button" className="h-8 rounded-md border border-line bg-paper px-2 text-sm font-extrabold" onClick={onCancel}>
            Annuler
          </button>
        </div>
      ) : null}
    </>
  )
}

function electoralPatch(person: Person, value: 'oui' | 'non', commune: string): Partial<Person> {
  const electoral = person.electoral === value ? '' : value
  return {
    electoral,
    electoralCommune: electoral === 'oui' ? person.electoralCommune || commune : '',
  }
}

function WhyElectoral() {
  const [open, setOpen] = useState(false)
  const noteId = useId()
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onPointer(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={box}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={noteId}
        className="text-sm font-extrabold text-pine underline decoration-leaf decoration-2 underline-offset-2"
        onClick={() => setOpen((value) => !value)}
      >
        Pourquoi cette question
      </button>
      {open ? (
        <div id={noteId} role="note" className="mt-2 rounded-2xl border border-line bg-card px-4 py-3 text-sm font-medium leading-relaxed">
          <p>
            Connaître le nombre de personnes inscrites dans chaque foyer et dans quelle commune nous permet de tenir compte des
            probabilités qu’un foyer soit sélectionné lors du tirage au sort.
          </p>
          <p className="mt-2">
            Ces informations serviront aux ajustements statistiques nécessaires pour que les résultats représentent au mieux
            l’ensemble de la population.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function Chip({
  selected,
  chosen,
  label,
  onClick,
  compact = false,
}: {
  selected: boolean
  chosen: boolean
  label: string
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full font-bold ${compact ? 'min-h-9 px-2.5 text-sm' : 'min-h-11 px-3 text-sm'} ${choiceClass(selected, 'one', chosen)}`}
    >
      {label}
    </button>
  )
}
