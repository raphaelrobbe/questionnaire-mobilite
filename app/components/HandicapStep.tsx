import { useEffect, useRef } from 'react'
import { questionNote, questionText } from '~/common/questionnaire'
import {
  HANDICAP_ADAPTATIONS,
  HANDICAP_ANSWERS,
  HANDICAP_CONCERN,
  HANDICAP_WHO,
  type Answers,
  type HandicapAdaptation,
  type HandicapWho,
} from '~/common/survey'
import { choiceClass, fieldClass } from './fill'

export function HandicapStep({ answers, onChange }: { answers: Answers; onChange: (patch: Partial<Answers>) => void }) {
  const chosen = answers.handicap !== ''
  const details = answers.handicap === 'oui'
  const typesReady =
    answers.handicapTypes.length > 0 && (!answers.handicapTypes.includes('autre') || Boolean(answers.handicapAutre.trim()))
  const whoReady = details && typesReady
  const peopleReady = whoReady && answers.handicapConcern === 'oui'
  const concernRef = useRef<HTMLFieldSetElement>(null)
  const peopleRef = useRef<HTMLFieldSetElement>(null)
  const concernShown = useRef(false)
  const peopleShown = useRef(false)

  useEffect(() => {
    if (!whoReady) {
      concernShown.current = false
      peopleShown.current = false
      return
    }
    if (concernShown.current) return
    concernShown.current = true
    scrollIntoView(concernRef.current)
  }, [whoReady])

  useEffect(() => {
    if (!peopleReady) {
      peopleShown.current = false
      return
    }
    if (peopleShown.current) return
    peopleShown.current = true
    scrollIntoView(peopleRef.current)
  }, [peopleReady])

  function toggleType(value: HandicapAdaptation) {
    const next = answers.handicapTypes.includes(value)
      ? answers.handicapTypes.filter((item) => item !== value)
      : [...answers.handicapTypes, value]
    onChange({ handicapTypes: next, handicapAutre: next.includes('autre') ? answers.handicapAutre : '' })
  }

  function toggleWho(value: HandicapWho) {
    const next = answers.handicapWho.includes(value)
      ? answers.handicapWho.filter((item) => item !== value)
      : [...answers.handicapWho, value]
    onChange({ handicapWho: next })
  }

  return (
    <div className="mt-4 grid gap-6">
      <fieldset>
        <legend className="text-base font-extrabold leading-snug">{questionText('handicap')}</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {HANDICAP_ANSWERS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={answers.handicap === item.value}
              className={`min-h-14 rounded-2xl px-2 py-3 text-center text-sm font-extrabold leading-snug ${choiceClass(answers.handicap === item.value, 'one', chosen)}`}
              onClick={() => onChange({ handicap: answers.handicap === item.value ? '' : item.value })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      {details ? (
        <fieldset>
          <legend className="text-base font-extrabold leading-snug">{questionText('handicap-types')}</legend>
          <p className="mt-1 text-base text-muted">{questionNote('handicap-types')}</p>
          <div className="mt-3 grid gap-2">
            {HANDICAP_ADAPTATIONS.map((item) => {
              const selected = answers.handicapTypes.includes(item.value)
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={selected}
                  className={`min-h-14 rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug ${choiceClass(selected, 'many', answers.handicapTypes.length > 0)}`}
                  onClick={() => toggleType(item.value)}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
          {answers.handicapTypes.includes('autre') ? (
            <label className="mt-3 grid gap-2">
              <span className="font-bold">{questionText('handicap-other')}</span>
              <input
                value={answers.handicapAutre}
                maxLength={160}
                onChange={(event) => onChange({ handicapAutre: event.target.value })}
                className={`min-h-14 rounded-2xl px-4 text-base outline-none focus:border-leaf ${fieldClass(Boolean(answers.handicapAutre.trim()), false)}`}
              />
            </label>
          ) : null}
        </fieldset>
      ) : null}

      {whoReady ? (
        <fieldset ref={concernRef}>
          <legend className="text-base font-extrabold leading-snug">{questionText('handicap-concern')}</legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {HANDICAP_CONCERN.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={answers.handicapConcern === item.value}
                className={`min-h-14 rounded-2xl px-3 py-3 text-center text-base font-extrabold ${choiceClass(answers.handicapConcern === item.value, 'one', Boolean(answers.handicapConcern))}`}
                onClick={() => onChange({ handicapConcern: answers.handicapConcern === item.value ? '' : item.value })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {peopleReady ? (
        <fieldset ref={peopleRef}>
          <legend className="sr-only">{questionText('handicap-who')}</legend>
          <p className="text-base text-muted">{questionNote('handicap-who')}</p>
          <div className="mt-3 grid gap-2">
            {HANDICAP_WHO.map((item) => {
              const selected = answers.handicapWho.includes(item.value)
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={selected}
                  className={`min-h-14 rounded-2xl px-4 py-3 text-left text-base font-bold leading-snug ${choiceClass(selected, 'many', answers.handicapWho.length > 0)}`}
                  onClick={() => toggleWho(item.value)}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </fieldset>
      ) : null}

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

function scrollIntoView(node: HTMLElement | null) {
  if (!node) return
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  const topBar = document.querySelector('[data-top-banner]')?.getBoundingClientRect().height ?? 0
  window.scrollTo({ top: Math.max(0, window.scrollY + node.getBoundingClientRect().top - topBar - 12), behavior })
}
