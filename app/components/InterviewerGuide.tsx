import { Link } from '@remix-run/react'
import { canUseSurvey } from '~/common/settings'
import { useSettings } from '~/hooks/useSettings'
import { buttonClass } from './Button'
import { PrivacyLink } from './PublicHome'

const DOCUMENTS = [
  {
    title: 'Avis de passage',
    text: 'À déposer dans la boîte aux lettres si la personne est absente.',
    href: '/ressources/avis_passage.pdf',
    file: 'avis-de-passage.pdf',
    label: 'Télécharger l’avis de passage',
  },
  {
    title: 'Accusé de réception',
    text: 'À remettre obligatoirement à chaque personne interrogée. Elle le conserve : la référence de sa fiche et les informations de contact y figurent.',
    href: '/ressources/accuse_reception.pdf',
    file: 'accuse-de-reception.pdf',
    label: 'Télécharger l’accusé de réception',
  },
] as const

export function InterviewerGuide() {
  const settings = useSettings()
  if (!settings) return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’enquête…</p>
  if (!canUseSurvey(settings)) {
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Guide de l’enquêteur</h1>
        <p className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">
          Connectez cet appareil depuis l’accueil, ou activez le mode test dans les réglages.
        </p>
        <Link to="/" className={buttonClass('secondary')}>
          Retour à l’accueil
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <article className="grid gap-4">
        <header>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Guide de l’enquêteur</h1>
          <p className="mt-3 text-base leading-relaxed">
            Merci d’être volontaire pour aider à réaliser cette grande enquête sur la mobilité des habitants du Haut-Doubs.
          </p>
          <p className="mt-3 text-base leading-relaxed">
            Votre rôle est essentiel : recueillir la parole des habitants de manière aussi fidèle et neutre que possible.
          </p>
        </header>

        <section className="rounded-[28px] border border-line bg-card px-5 py-5">
          <h2 className="text-xl font-extrabold">Avant de partir</h2>
          <p className="mt-3 leading-relaxed">
            Vous allez chez les habitants.{' '}
            <span className="font-extrabold">
              Imprimez ces deux documents en nombre suffisant avant de partir. Pré-remplissez votre nom et votre numéro de
              téléphone.
            </span>
          </p>
          <p className="mt-3 leading-relaxed">
            Munissez-vous d’un crayon pour ajouter le code correspondant au document que vous utiliserez.
          </p>
          {DOCUMENTS.map((document) => (
            <div key={document.href} className="mt-5">
              <h3 className="text-lg font-extrabold">{document.title}</h3>
              <p className="mt-2 leading-relaxed">{document.text}</p>
              <a href={document.href} download={document.file} className={`${buttonClass('secondary')} mt-3`}>
                <PdfMark />
                {document.label}
              </a>
            </div>
          ))}
          <p className="mt-5 leading-relaxed">
            Chaque visite fait l’objet d’une saisie dans l’interface « L’enquête n’a pas pu avoir lieu : pourquoi ? »
            (personne absente, adresse introuvable, etc.).
          </p>
        </section>

        <section className="rounded-[28px] border border-line bg-card px-5 py-5">
          <h2 className="text-xl font-extrabold">Personne absente</h2>
          <p className="mt-3 leading-relaxed">
            Si personne n’ouvre la porte mais qu’il y a une boîte aux lettres, remplir l’avis de passage et le déposer dans
            la boîte aux lettres.
          </p>
        </section>

        <section className="rounded-[28px] border border-line bg-card px-5 py-5">
          <h2 className="text-xl font-extrabold">Quelqu’un ouvre</h2>

          <h3 className="mt-4 text-lg font-extrabold">1. Présentez l’enquête</h3>
          <p className="mt-3 leading-relaxed">Expliquez simplement votre démarche :</p>
          <p className="mt-3 leading-relaxed">
            « Bonjour, nous réalisons une enquête sur les besoins de mobilité dans le Haut-Doubs. Je cherche [M. Jean
            Neymar], qui a été sélectionné par tirage au sort sur les listes électorales. »
          </p>
          <p className="mt-3 leading-relaxed">
            Attendez que la personne vous indique si elle est la personne recherchée ou si celle-ci est présente.
          </p>
          <p className="mt-4 leading-relaxed">
            <span className="font-extrabold">Si c’est la personne recherchée :</span>
          </p>
          <p className="mt-2 leading-relaxed">
            « Nous souhaitons vous interroger pour mieux connaître les déplacements des habitants, leurs difficultés et
            leurs besoins, afin d’informer les autorités et d’améliorer l’offre de transports en commun. Auriez-vous un peu
            de temps à me consacrer pour que nous puissions réaliser cette enquête ? Elle dure environ 20 minutes. »
          </p>
          <p className="mt-4 leading-relaxed">
            <span className="font-extrabold">Si ce n’est pas elle, mais que la personne recherchée est présente :</span>
          </p>
          <p className="mt-2 leading-relaxed">
            « Nous souhaitons l’interroger pour mieux connaître ses déplacements, ses difficultés et ses besoins. »
          </p>
          <p className="mt-4 leading-relaxed">
            <span className="font-extrabold">
              Si la personne recherchée n’est pas présente, ou si elle n’est pas disponible :
            </span>
          </p>
          <p className="mt-2 leading-relaxed">
            « Accepteriez-vous de faire cet entretien à un autre moment ? Si possible en face-à-face, mais c’est également
            possible par téléphone. »
          </p>
          <ul className="mt-3 grid list-disc gap-2 pl-5 leading-relaxed">
            <li>Si oui : fixer un rendez-vous. Si cela s’avère compliqué, laisser un avis de passage renseigné.</li>
            <li>Si non : expliquer que la représentativité de l’enquête repose sur le respect du tirage au sort.</li>
            <li>Si la personne refuse toujours : ne pas insister davantage.</li>
          </ul>

          <h3 className="mt-5 text-lg font-extrabold">
            2. Interrogez la personne tirée au sort ou un autre membre du foyer capable de répondre aux questions
          </h3>
          <ul className="mt-3 grid list-disc gap-2 pl-5 leading-relaxed">
            <li>Si d’autres membres sont présents et souhaitent participer aux réponses, c’est encore mieux.</li>
            <li>Les réponses concernent tous les membres du foyer, y compris les mineurs.</li>
            <li>Ne répondez jamais à la place des personnes et ne suggérez pas de réponses.</li>
          </ul>

          <h3 className="mt-5 text-lg font-extrabold">3. Restez neutre</h3>
          <p className="mt-3 leading-relaxed">
            L’objectif est de connaître les besoins réels, pas de convaincre les habitants de l’intérêt des transports en
            commun.
          </p>
          <ul className="mt-3 grid list-disc gap-2 pl-5 leading-relaxed">
            <li>Lisez les questions sans les reformuler de manière orientée.</li>
            <li>Ne portez aucun jugement sur les réponses.</li>
          </ul>

          <h3 className="mt-5 text-lg font-extrabold">4. Lisez tout ce qui est à l’écran</h3>
          <p className="mt-3 leading-relaxed">
            Lisez à voix haute tout le texte affiché, les questions comme les précisions. Ne sautez rien.
          </p>
          <p className="mt-3 leading-relaxed">
            <span className="font-extrabold">Tous les trajets comptent.</span> Il faut prendre en compte tous les trajets,
            même occasionnels ou courts, ou ceux faits pour une autre personne du foyer.
          </p>
          <p className="mt-3 leading-relaxed">Un code couleur guide les choix.</p>
          <ul className="mt-3 grid gap-2">
            <li className="rounded-2xl bg-rose-bg px-4 py-3 leading-relaxed">
              <span className="font-extrabold">Fond saumon :</span> un choix obligatoire n’a pas été fait. Le bouton Suivant
              n’est pas accessible.
            </li>
            <li className="rounded-2xl bg-mist px-4 py-3 leading-relaxed">
              <span className="font-extrabold">Fond vert clair :</span> ces choix sont toujours possibles.
            </li>
          </ul>
        </section>

        <section className="rounded-[28px] border border-line bg-card px-5 py-5">
          <h2 className="text-xl font-extrabold">Après l’entretien</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 leading-relaxed">
            <li>Vérifiez que les réponses ont bien été enregistrées.</li>
            <li>Remettez l’accusé de réception à chaque personne interrogée, avec son code et vos coordonnées.</li>
          </ul>
          <p className="mt-4 leading-relaxed">
            <span className="font-extrabold">Merci de votre implication !</span> La qualité de cette enquête repose sur la
            rigueur, l’écoute et la neutralité de chaque enquêteur.
          </p>
        </section>
      </article>
      <PrivacyLink />
    </div>
  )
}

function PdfMark() {
  return (
    <svg viewBox="0 0 36 20" className="h-5 w-9 shrink-0" aria-hidden="true">
      <rect width="36" height="20" rx="3" fill="currentColor" />
      <text x="18" y="14.2" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-paper)" fontFamily="sans-serif">
        PDF
      </text>
    </svg>
  )
}
