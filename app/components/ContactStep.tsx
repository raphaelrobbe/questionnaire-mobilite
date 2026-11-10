import { COLLECTIF_CONSENT, PHONE_CONSENT } from '~/common/consent'
import type { Answers } from '~/common/survey'
import { fieldClass } from './fill'
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
                placeholder="06 12 34 56 78"
                onChange={(event) => onChange({ phone: event.target.value })}
                className={`min-h-14 rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(answers.phone.trim()), false)}`}
              />
            </label>
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
            {answers.collectif && answers.collectifText ? answers.collectifText : COLLECTIF_CONSENT}
          </span>
        </label>
        {answers.collectif ? (
          <Reveal>
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
                className={`min-h-14 rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(answers.email.trim()), false)}`}
              />
            </label>
          </Reveal>
        ) : null}
      </div>
    </div>
  )
}
