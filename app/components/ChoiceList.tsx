import { toggleFriction, type Answers, type Question, type QuestionId } from '~/common/survey'

export function ChoiceList({
  question,
  answers,
  onAnswers,
  onNext,
}: {
  question: Question
  answers: Answers
  onAnswers: (patch: Partial<Answers>) => void
  onNext: () => void
}) {
  if (question.kind === 'scale') {
    return (
      <div role="radiogroup" aria-label={question.title} className="mt-6">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: question.max - question.min + 1 }, (_, index) => {
            const value = String(question.min + index)
            const selected = answers.score === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onAnswers({ score: value })}
                className={`min-h-16 rounded-2xl border text-xl font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${
                  selected ? 'border-pine bg-pine text-paper' : 'border-line bg-card text-ink'
                }`}
              >
                {value}
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between gap-4 text-sm font-semibold text-muted">
          <span>{question.minLabel}</span>
          <span className="text-right">{question.maxLabel}</span>
        </div>
      </div>
    )
  }

  if (question.kind === 'text') {
    const value = textOf(question.id, answers)
    const shared = {
      id: 'reponse',
      value,
      maxLength: question.maxLength,
      placeholder: question.placeholder,
      autoComplete: 'off' as const,
      autoCorrect: 'off' as const,
      spellCheck: true,
      onChange: (event: { target: { value: string } }) => onAnswers(textPatch(question.id, event.target.value)),
      className:
        'mt-6 w-full rounded-2xl border border-line bg-card px-4 py-4 text-base text-ink outline-none focus:border-leaf',
    }
    return question.multiline ? (
      <textarea {...shared} rows={5} />
    ) : (
      <input
        {...shared}
        enterKeyHint="next"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onNext()
          }
        }}
      />
    )
  }

  return (
    <fieldset className="mt-6 grid gap-2">
      <legend className="sr-only">{question.title}</legend>
      {question.options.map((option) => {
        const selected = question.kind === 'multi' ? answers.frictions.includes(option.value) : singleOf(question.id, answers) === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              if (question.kind === 'multi') onAnswers({ frictions: toggleFriction(answers.frictions, option.value) })
              else onAnswers(singlePatch(question.id, option.value))
            }}
            className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${
              selected ? 'border-pine bg-mist text-pine-deep' : 'border-line bg-card text-ink'
            }`}
          >
            <span>{option.label}</span>
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                selected ? 'border-pine bg-pine text-paper' : 'border-line bg-card'
              }`}
              aria-hidden="true"
            >
              {selected ? (
                <svg viewBox="0 0 16 16" className="size-3.5">
                  <path d="M3 8.5 6.2 12 13 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : null}
            </span>
          </button>
        )
      })}
      {question.id === 'mode' && answers.mode === 'autre' ? (
        <label className="mt-2 block">
          <span className="text-sm font-bold text-muted">Précisez le mode</span>
          <input
            value={answers.modePrecision}
            maxLength={160}
            autoComplete="off"
            onChange={(event) => onAnswers({ modePrecision: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-line bg-card px-4 py-4 text-base outline-none focus:border-leaf"
          />
        </label>
      ) : null}
      {question.id === 'frictions' && answers.frictions.includes('autre') ? (
        <label className="mt-2 block">
          <span className="text-sm font-bold text-muted">Précisez la gêne</span>
          <input
            value={answers.frictionPrecision}
            maxLength={160}
            autoComplete="off"
            onChange={(event) => onAnswers({ frictionPrecision: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-line bg-card px-4 py-4 text-base outline-none focus:border-leaf"
          />
        </label>
      ) : null}
    </fieldset>
  )
}

function singleOf(id: QuestionId, answers: Answers): string {
  switch (id) {
    case 'age':
      return answers.age
    case 'mode':
      return answers.mode
    case 'trips':
      return answers.trips
    case 'purpose':
      return answers.purpose
    case 'duration':
      return answers.duration
    case 'priority':
      return answers.priority
    case 'recontact':
      return answers.recontact
    default:
      return ''
  }
}

function singlePatch(id: QuestionId, value: string): Partial<Answers> {
  switch (id) {
    case 'age':
      return { age: value }
    case 'mode':
      return { mode: value }
    case 'trips':
      return { trips: value }
    case 'purpose':
      return { purpose: value }
    case 'duration':
      return { duration: value }
    case 'priority':
      return { priority: value }
    case 'recontact':
      return { recontact: value }
    default:
      return {}
  }
}

function textOf(id: QuestionId, answers: Answers): string {
  switch (id) {
    case 'habitation':
      return answers.habitation
    case 'comment':
      return answers.comment
    case 'contact':
      return answers.contact
    default:
      return ''
  }
}

function textPatch(id: QuestionId, value: string): Partial<Answers> {
  switch (id) {
    case 'habitation':
      return { habitation: value }
    case 'comment':
      return { comment: value }
    case 'contact':
      return { contact: value }
    default:
      return {}
  }
}
