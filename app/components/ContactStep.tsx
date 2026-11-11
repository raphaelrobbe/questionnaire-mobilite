import { COLLECTIF_CONSENT, PHONE_CONSENT } from '~/common/consent'
import { CollectifLink } from './CollectifLink'
import { isEmail, respondentPhone, type Answers } from '~/common/survey'
import { choiceClass, fieldClass } from './fill'
import { Reveal } from './Reveal'

export function ContactStep({
  answers,
  onChange,
}: {
  answers: Answers
  onChange: (patch: Partial<Answers>) => void
}) {
  return (
    <div className="mt-6 grid gap-8">
      <div className="grid gap-4 rounded-[28px] border border-line bg-card p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={answers.recontact === 'oui'}
            onChange={(event) =>
              onChange({
                recontact: event.target.checked ? 'oui' : 'non',
                recontactText: event.target.checked ? PHONE_CONSENT : '',
              })
            }
            className="mt-1 size-5 accent-pine"
          />
          <span className="min-w-0 font-bold">
            {answers.recontact === 'oui' && answers.recontactText ? answers.recontactText : PHONE_CONSENT}
          </span>
        </label>
        {answers.recontact === 'oui' ? (
          <Reveal>
            <PhoneField value={answers.phone} onChange={(phone) => onChange({ phone })} />
          </Reveal>
        ) : null}
      </div>
      <div className="grid gap-4 rounded-[28px] border border-line bg-card p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={answers.collectif}
            onChange={(event) =>
              onChange({
                collectif: event.target.checked,
                collectifText: event.target.checked ? COLLECTIF_CONSENT : '',
              })
            }
            className="mt-1 size-5 accent-pine"
          />
          <span className="min-w-0 font-bold">
            J’accepte de recevoir occasionnellement par courrier électronique des informations du <CollectifLink /> concernant
            ses actions, les avancées du projet de mobilité et les éventuelles réunions publiques
          </span>
        </label>
        {answers.collectif ? (
          <Reveal>
            <EmailField value={answers.email} onChange={(email) => onChange({ email })} />
          </Reveal>
        ) : null}
      </div>
      <fieldset className="grid gap-3">
        <legend className="text-base font-extrabold">Souhaitez-vous devenir enquêteur à votre tour ?</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['oui', 'Oui'],
              ['non', 'Non'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={answers.enqueteur === id}
              className={`min-h-11 rounded-2xl px-4 text-sm font-extrabold ${choiceClass(answers.enqueteur === id, 'one', answers.enqueteur !== '')}`}
              onClick={() => onChange({ enqueteur: id })}
            >
              {label}
            </button>
          ))}
        </div>
        {answers.enqueteur === 'oui' ? (
          <Reveal>
            <div className="grid gap-4">
              <p className="text-base leading-relaxed">
                Vous serez recontacté très prochainement pour en discuter et vous mettre en route, en particulier pour une très courte formation.
              </p>
              {answers.recontact !== 'oui' || !answers.collectif ? (
                <>
                  {answers.recontact !== 'oui' && !answers.collectif ? (
                    <p className="text-base text-muted">Un seul contact suffit, le téléphone ou l’adresse mail.</p>
                  ) : null}
                  {answers.recontact !== 'oui' ? (
                    <PhoneField
                      value={answers.phone}
                      optional={contactOptional(answers)}
                      onChange={(phone) => onChange({ phone })}
                    />
                  ) : null}
                  {!answers.collectif ? (
                    <EmailField
                      value={answers.email}
                      optional={contactOptional(answers)}
                      onChange={(email) => onChange({ email })}
                    />
                  ) : null}
                </>
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </fieldset>
    </div>
  )
}

function contactOptional(answers: Answers): boolean {
  return answers.recontact === 'oui' || answers.collectif || Boolean(respondentPhone(answers.phone)) || isEmail(answers.email)
}

function PhoneField({ value, onChange, optional = false }: { value: string; onChange: (value: string) => void; optional?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="font-bold">Numéro de téléphone</span>
      <input
        value={value}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={40}
        placeholder="06 12 34 56 78"
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-14 rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(value.trim()), optional)}`}
      />
    </label>
  )
}

function EmailField({ value, onChange, optional = false }: { value: string; onChange: (value: string) => void; optional?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="font-bold">Adresse mail</span>
      <input
        value={value}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={120}
        placeholder="prenom@exemple.fr"
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-14 rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(value.trim()), optional)}`}
      />
    </label>
  )
}
