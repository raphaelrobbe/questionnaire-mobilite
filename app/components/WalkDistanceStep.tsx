import { WALK_DISTANCES, setWalkDistance, setWalkMapSkipped, setWalkNearby, setWalkNote, setWalkPoint, type Answers } from '~/common/survey'
import { choiceClass, fieldClass } from './fill'
import { Reveal } from './Reveal'
import { StopMap } from './StopMap'

export function WalkDistanceStep({ answers, onChange }: { answers: Answers; onChange: (patch: Partial<Answers>) => void }) {
  const distance = answers.walkDistance
  const chosen = Boolean(distance.choice)

  return (
    <div className="mt-4 grid gap-6">
      <div>
        <h2 className="text-xl font-extrabold leading-snug">
          Quelle distance seriez-vous prêt(e) à parcourir à pied entre votre domicile (ou le lieu où vous vous rendez) et un
          arrêt de transport en commun ?
        </h2>
        <p className="mt-2 text-base text-muted">Une seule réponse.</p>
        <div className="mt-4 grid gap-2">
          {WALK_DISTANCES.map((item) => {
            const selected = distance.choice === item.value
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={selected}
                className={`min-h-14 w-full rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug ${choiceClass(selected, 'one', chosen)}`}
                onClick={() => onChange({ walkDistance: setWalkDistance(distance, item.value) })}
              >
                {item.label}
              </button>
            )
          })}
        </div>
        <label className="mt-4 grid gap-2">
          <span className="font-bold">Préciser</span>
          <input
            value={distance.note}
            maxLength={160}
            placeholder="Préciser"
            className={`min-h-14 w-full rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(distance.note.trim()), true)}`}
            onChange={(event) => onChange({ walkDistance: setWalkNote(distance, event.target.value) })}
          />
        </label>
      </div>
      {distance.choice ? (
        <Reveal>
          <h2 className="text-xl font-extrabold leading-snug">Existe-t-il déjà un arrêt satisfaisant près de votre domicile ?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(['oui', 'non'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={distance.nearby === value}
                className={`min-h-14 rounded-2xl px-3 text-base font-extrabold ${choiceClass(distance.nearby === value, 'one', Boolean(distance.nearby))}`}
                onClick={() => onChange({ walkDistance: setWalkNearby(distance, value) })}
              >
                {value === 'oui' ? 'Oui' : 'Non'}
              </button>
            ))}
          </div>
          {distance.nearby ? (
            <Reveal className="mt-5">
              {distance.nearby === 'non' ? (
                <h2 className="mb-3 text-xl font-extrabold leading-snug">Où verriez-vous un arrêt de transport près de chez vous ?</h2>
              ) : null}
              <StopMap
                adresse={answers.adresse}
                commune={answers.commune}
                mode={distance.nearby === 'oui' ? 'stops' : 'click'}
                latitude={distance.latitude}
                longitude={distance.longitude}
                onPick={(latitude, longitude) => onChange({ walkDistance: setWalkPoint(distance, latitude, longitude) })}
              />
              <label className="mt-3 flex min-h-11 items-start gap-3">
                <input
                  type="checkbox"
                  checked={distance.mapSkipped}
                  onChange={(event) => onChange({ walkDistance: setWalkMapSkipped(distance, event.target.checked) })}
                  className="mt-1 size-5 accent-pine"
                />
                <span className="font-bold">La carte ne s’affiche pas ou la personne ne souhaite pas répondre</span>
              </label>
            </Reveal>
          ) : null}
        </Reveal>
      ) : null}
    </div>
  )
}
