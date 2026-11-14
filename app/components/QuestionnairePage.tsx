import { QUESTIONNAIRE, type Question } from '~/common/questionnaire'

export function QuestionnairePage() {
  return (
    <article className="questionnaire grid gap-8">
      <header>
        <h1 className="print-only print-keep text-3xl font-extrabold leading-tight tracking-tight">
          Questionnaire de l’enquête mobilité Haut-Doubs
        </h1>
        <div className="no-print flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Le questionnaire</h1>
          <button
            type="button"
            aria-label="Télécharger le PDF"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-pine hover:bg-mist"
            onClick={() => window.print()}
          >
            <Printer />
          </button>
        </div>
      </header>
      {QUESTIONNAIRE.map((part) => (
        <section key={part.id} className="grid gap-3">
          <h2 className="print-keep text-2xl font-extrabold leading-tight tracking-tight">{part.title}</h2>
          {part.note ? <p className="print-keep text-base leading-relaxed text-muted">{part.note}</p> : null}
          <QuestionList questions={part.questions} />
        </section>
      ))}
    </article>
  )
}

function Choices({ choices, inline, apart = 0 }: { choices: readonly string[]; inline?: boolean; apart?: number }) {
  const split = inline ? choices.length : Math.max(0, choices.length - apart)
  const main = choices.slice(0, split)
  const tail = choices.slice(split)
  return (
    <>
      {main.length ? (
        inline ? (
          <ul className="mt-1 text-sm leading-relaxed">
            {main.map((choice, index) => (
              <li key={choice} className="inline">
                {index > 0 ? <span className="text-muted"> · </span> : null}
                {choice}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-1 grid list-disc gap-1 pl-4 text-sm leading-snug">
            {main.map((choice) => (
              <li key={choice}>{choice}</li>
            ))}
          </ul>
        )
      ) : null}
      {tail.length ? (
        <ul className="choice-apart mt-4 grid list-disc gap-4 pl-4 text-sm leading-snug">
          {tail.map((choice) => (
            <li key={choice}>{choice}</li>
          ))}
        </ul>
      ) : null}
    </>
  )
}

function QuestionList({ questions }: { questions: readonly Question[] }) {
  return (
    <ol className="grid list-decimal gap-4 pl-5 marker:font-extrabold marker:text-pine">
      {questions.map((question) => (
        <li key={question.id} className="pl-1">
          {question.when ? <p className="print-keep text-sm font-bold text-clay">Posée si {question.when}</p> : null}
          <p className="print-keep font-extrabold leading-snug">{question.ask}</p>
          {question.note ? <p className="print-keep mt-1 text-sm leading-relaxed text-muted">{question.note}</p> : null}
          {question.choices?.length ? <Choices choices={question.choices} inline={question.inline} apart={question.apart} /> : null}
          {question.each ? (
            <div className="mt-3">
              <p className="print-keep text-sm font-bold leading-relaxed">{question.each.intro}</p>
              <QuestionList questions={question.each.questions} />
            </div>
          ) : null}
          {question.children?.length ? (
            <div className="mt-3 border-l border-line pl-3">
              <QuestionList questions={question.children} />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  )
}

function Printer() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  )
}
