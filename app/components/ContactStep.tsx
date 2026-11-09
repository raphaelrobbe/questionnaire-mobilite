import { wantsEmail, type Answers } from '~/common/survey'

export function ContactStep({
  answers,
  onChange,
}: {
  answers: Answers
  onChange: (patch: Partial<Answers>) => void
}) {
  return (
    <div className="mt-6 grid gap-4">
      <fieldset className="grid gap-2">
        <legend className="font-bold">Acceptez-vous d’être recontacté si les enquêteurs en ont besoin ?</legend>
        <div className="flex flex-wrap gap-2">
          <Choice selected={answers.recontact === 'oui'} label="Oui" onClick={() => onChange({ recontact: 'oui' })} />
          <Choice selected={answers.recontact === 'non'} label="Non" onClick={() => onChange({ recontact: 'non' })} />
        </div>
      </fieldset>
      <label className="flex min-h-14 items-start gap-3 rounded-2xl border border-line bg-card px-4 py-4">
        <input
          type="checkbox"
          checked={answers.collectif}
          onChange={(event) => onChange({ collectif: event.target.checked })}
          className="mt-1 size-5 accent-pine"
        />
        <span className="font-bold">J’accepte de recevoir les informations du Collectif Mobilités du Haut-Doubs.</span>
      </label>
      <label className="grid gap-2">
        <span className="font-bold">Numéro de téléphone</span>
        <input
          value={answers.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={40}
          placeholder="+33 6 12 34 56 78"
          onChange={(event) => onChange({ phone: event.target.value })}
          className="min-h-14 rounded-2xl border border-line bg-card px-4 text-base outline-none focus:border-leaf"
        />
        <span className="text-sm font-semibold text-muted">Facultatif. Les espaces et le + sont gardés.</span>
      </label>
      {wantsEmail(answers) ? (
        <label className="grid gap-2">
          <span className="font-bold">Adresse mail</span>
          <input
            value={answers.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={120}
            placeholder="prenom@exemple.fr"
            onChange={(event) => onChange({ email: event.target.value })}
            className="min-h-14 rounded-2xl border border-line bg-card px-4 text-base outline-none focus:border-leaf"
          />
          <span className="text-sm font-semibold text-muted">
            Elle est rangée avec le code de la fiche, dans le tableur qui n’est pas public.
          </span>
        </label>
      ) : null}
    </div>
  )
}

function Choice({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-14 flex-1 rounded-2xl border px-4 text-base font-bold ${
        selected ? 'border-pine bg-pine text-paper' : 'border-line bg-card text-ink'
      }`}
    >
      {label}
    </button>
  )
}
