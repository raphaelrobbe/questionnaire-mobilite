import { useEffect, useRef, useState, type RefObject } from 'react'
import { communesOnOffer, filterCommunes, fold, PONTARLIER } from '~/common/config'
import { FRENCH_COMMUNITIES, frenchCommunityFor } from '~/common/frenchCommunes'
import { DOMICILE } from '~/common/journeys'
import { SWISS_SECTORS, swissSectorFor } from '~/common/swissCommunes'
import { choiceClass, fieldClass } from './fill'

const PLACE_PRESETS = [{ commune: 'Pontarlier', places: ['Lycée Xavier Marmier', 'Gare SNCF', 'Hôpital', 'Zone industrielle', 'Zone commerciale Hyper U', 'Centre-ville'] }]
const PLACE_COMMUNES = communesOnOffer(uniquePlaceNames([...FRENCH_COMMUNITIES, ...SWISS_SECTORS]))
const FRENCH_PLACE_COMMUNES = communesOnOffer(uniquePlaceNames(FRENCH_COMMUNITIES))

function uniquePlaceNames(groups: readonly { communes: readonly string[] }[]): string[] {
  const seen = new Set<string>()
  const list: string[] = []
  for (const group of groups) {
    for (const name of group.communes) {
      const key = fold(name)
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push(name)
    }
  }
  return list
}

function placesFor(commune: string): string[] {
  const key = fold(commune.trim())
  return PLACE_PRESETS.find((item) => fold(item.commune) === key)?.places ?? []
}

type PlaceBranch = 'pontarlier' | 'france' | 'suisse' | 'domicile'

/** À côté des communautés ou des secteurs : saisie libre, sans écrire dans le champ. */
const OTHER_GROUP = 'autre'

const PLACE_ROOTS: { id: PlaceBranch; label: string }[] = [
  { id: 'pontarlier', label: 'Pontarlier' },
  { id: 'france', label: 'France' },
  { id: 'suisse', label: 'Suisse' },
  { id: 'domicile', label: 'Domicile' },
]

function branchOf(value: string): PlaceBranch | null {
  const text = value.trim()
  if (!text) return null
  if (fold(text) === fold(DOMICILE)) return 'domicile'
  if (fold(text) === fold(PONTARLIER)) return 'pontarlier'
  if (frenchCommunityFor(text)) return 'france'
  if (swissSectorFor(text)) return 'suisse'
  return null
}

export function PlacePicker({
  label,
  value,
  place = '',
  domicile = true,
  suisse = true,
  detail = false,
  inputId,
  onChange,
}: {
  label: string
  value: string
  place?: string
  /** Le bouton Domicile n’existe que pour un trajet. */
  domicile?: boolean
  /** Les secteurs suisses. Inutile pour une commune d’inscription électorale. */
  suisse?: boolean
  /** Lieux connus et champ Préciser : seulement sur un trajet. */
  detail?: boolean
  inputId?: string
  onChange: (next: { value: string; place: string }) => void
}) {
  const [opened, setOpened] = useState<PlaceBranch | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingFocus = useRef(false)
  const committed = branchOf(value)
  const branch = committed ?? opened
  const roots = PLACE_ROOTS.filter((item) => (domicile || item.id !== 'domicile') && (suisse || item.id !== 'suisse'))
  const suggestions = suisse ? PLACE_COMMUNES : FRENCH_PLACE_COMMUNES
  const groups =
    branch === 'france'
      ? FRENCH_COMMUNITIES.map((item) => ({ id: item.label, label: item.label, communes: item.communes, note: undefined as string | undefined }))
      : branch === 'suisse'
        ? SWISS_SECTORS.map((item) => ({ id: item.sector, label: item.sector, communes: item.communes, note: item.note }))
        : []
  const knownGroup = branch === 'france' ? frenchCommunityFor(value)?.label : branch === 'suisse' ? swissSectorFor(value)?.sector : undefined
  const group = knownGroup ?? (branch === opened || committed ? groupId : null)
  const groupChoices = groups.length
    ? [...groups.map(({ id, label }) => ({ id, label })), { id: OTHER_GROUP, label: 'Autre' }]
    : []
  const current = groups.find((item) => item.id === group)
  const pickedCommune = current?.communes.find((name) => fold(name) === fold(value.trim()))
  const precisions = detail ? placesFor(value) : []
  const precision = precisions.find((item) => item === place.trim()) ?? null
  const chip = committed !== null && (domicile || committed !== 'domicile')

  function remember(next: PlaceBranch | null, nextGroup: string | null) {
    setOpened(next)
    setGroupId(nextGroup)
  }

  function commit(nextValue: string, nextPlace: string) {
    onChange({ value: nextValue, place: detail ? nextPlace : '' })
  }

  useEffect(() => {
    if (!pendingFocus.current || chip) return
    pendingFocus.current = false
    inputRef.current?.focus()
  }, [chip, group])

  function clearAll() {
    remember(null, null)
    commit('', '')
  }

  function chooseBranch(next: PlaceBranch) {
    if (branch === next) {
      clearAll()
      return
    }
    remember(next, null)
    if (next === 'pontarlier') commit(PONTARLIER, '')
    else if (next === 'domicile') commit(DOMICILE, '')
    else commit('', '')
  }

  function chooseGroup(id: string) {
    if (group === id) {
      remember(branch, null)
      if (committed) commit('', '')
      return
    }
    remember(branch, id)
    if (committed) commit('', '')
    if (id === OTHER_GROUP) pendingFocus.current = true
  }

  function chooseCommune(name: string) {
    remember(branch, group)
    commit(fold(value) === fold(name) ? '' : name, '')
  }

  return (
    <div className="mt-1 grid gap-1">
      {chip ? (
        <span className="inline-flex min-h-10 w-fit items-center rounded-xl bg-pine pl-3 text-sm font-extrabold text-white">
          {fold(value) === fold(DOMICILE) ? 'Domicile' : value}
          <button type="button" aria-label={`Retirer ${label}`} className="px-2 text-base leading-none" onClick={clearAll}>
            ×
          </button>
        </span>
      ) : (
        <CommuneInput
          inputRef={inputRef}
          id={inputId}
          label={label}
          communes={suggestions}
          value={value}
          onChange={(next) => {
            if (group !== OTHER_GROUP || branchOf(next)) remember(null, null)
            const preset = detail && placesFor(value).some((item) => item === place.trim())
            commit(next, preset ? '' : place)
          }}
        />
      )}
      {chip ? null : (
        <>
          <LevelButtons
            items={roots}
            selectedId={branch}
            required={!value.trim()}
            onPick={(id) => chooseBranch(id as PlaceBranch)}
          />
          {groupChoices.length ? (
            <LevelButtons
              items={groupChoices}
              selectedId={group}
              required={!pickedCommune && branch !== 'pontarlier'}
              onPick={chooseGroup}
            />
          ) : null}
          {current ? (
            current.communes.length ? (
              <LevelButtons
                items={current.communes.map((name) => ({ id: name, label: name }))}
                selectedId={pickedCommune ?? null}
                required
                onPick={chooseCommune}
              />
            ) : (
              <p className="text-sm font-semibold leading-snug text-muted">{current.note}</p>
            )
          ) : null}
        </>
      )}
      {precisions.length ? (
        <LevelButtons
          items={precisions.map((name) => ({ id: name, label: name }))}
          selectedId={precision}
          required={false}
          onPick={(name) => commit(value, place.trim() === name ? '' : name)}
        />
      ) : null}
      {detail ? (
        <label className="mt-1 block text-sm font-extrabold leading-tight">
          Préciser <span className="font-medium text-muted">(facultatif)</span>
          <input
            value={place}
            maxLength={80}
            aria-label="Préciser"
            className={`mt-1 min-h-10 w-full rounded-xl px-2 text-sm font-medium ${fieldClass(Boolean(place.trim()), true)}`}
            onChange={(event) => commit(value, event.target.value)}
          />
        </label>
      ) : null}
    </div>
  )
}

function CommuneInput({
  inputRef,
  id,
  label,
  communes,
  value,
  onChange,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  id?: string
  label: string
  communes: readonly string[]
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const matches = filterCommunes(communes, value, 8)
  const exact = matches.length === 1 && fold(matches[0]) === fold(value.trim())
  const show = open && value.trim().length > 0 && !exact

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        value={value}
        maxLength={120}
        role="combobox"
        aria-label={label}
        aria-expanded={show}
        aria-autocomplete="list"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={`min-h-10 w-full rounded-xl px-2 text-sm font-medium ${fieldClass(Boolean(value.trim()), false)}`}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setOpen(true)
          onChange(event.target.value)
        }}
      />
      {show ? (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-line bg-card py-1 shadow-sm">
          {matches.length ? (
            matches.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="min-h-10 w-full px-2 text-left text-sm font-bold"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(name)
                    setOpen(false)
                  }}
                >
                  {name}
                </button>
              </li>
            ))
          ) : (
            <li className="px-2 py-2 text-sm font-semibold text-clay">Aucune commune ne commence ainsi.</li>
          )}
        </ul>
      ) : null}
    </div>
  )
}

function LevelButtons({
  items,
  selectedId,
  required,
  onPick,
}: {
  items: { id: string; label: string }[]
  selectedId: string | null
  required: boolean
  onPick: (id: string) => void
}) {
  const shown = selectedId ? items.filter((item) => item.id === selectedId) : items
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((item) => {
        const selected = item.id === selectedId
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            className={`min-h-8 rounded-md px-1.5 py-1 text-left text-sm font-extrabold leading-tight ${choiceClass(selected, required ? 'one' : 'free-one', Boolean(selectedId))}`}
            onClick={() => onPick(item.id)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
