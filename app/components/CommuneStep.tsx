import { useState } from 'react'
import { communesOnOffer, filterCommunes } from '~/common/config'

export function CommuneStep({
  communes,
  commune,
  onSelect,
}: {
  communes: string[]
  commune: string
  onSelect: (commune: string) => void
}) {
  const [query, setQuery] = useState('')
  const matches = filterCommunes(communesOnOffer(communes), query)

  return (
    <div className="mt-6 grid gap-3">
      {commune ? <p className="rounded-2xl bg-mist px-4 py-3 font-extrabold text-pine">Commune retenue : {commune}</p> : null}
      <label className="grid gap-2">
        <span className="font-bold">Filtrer</span>
        <input
          id="commune-filtre"
          value={query}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Filtrer la liste"
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-14 rounded-2xl border border-line bg-card px-4 text-base outline-none focus:border-leaf"
        />
      </label>
      {query.trim() && matches.length === 0 ? (
        <p className="text-sm font-semibold text-clay">Aucune commune de la liste ne commence ainsi.</p>
      ) : null}
      <ul className="grid max-h-[60vh] gap-2 overflow-auto">
        {matches.map((name) => {
          const selected = name === commune
          return (
            <li key={name}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(name)}
                className={`min-h-14 w-full rounded-2xl border px-4 text-left text-base font-bold ${
                  selected ? 'border-pine bg-pine text-paper' : 'border-line bg-card text-ink'
                }`}
              >
                {name}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
