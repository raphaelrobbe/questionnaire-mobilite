import { Link } from '@remix-run/react'
import { ContactForm } from './ContactForm'

const METHOD = [
  {
    title: 'Un tirage au sort',
    text: 'Les foyers enquêtés sont sélectionnés à partir des listes électorales, afin de constituer un échantillon aléatoire et de permettre une analyse à l’échelle de la population.',
  },
  {
    title: 'Tous les membres du foyer sont concernés',
    text: 'Nous cherchons à connaître les besoins de chacun, adultes comme mineurs, et pas seulement ceux de la personne initialement sélectionnée. Les personnes d’un même foyer n’ont pas les mêmes besoins, et elles partagent ou non les véhicules : on ne peut donc pas en interroger une sans tenir compte des autres.',
  },
  {
    title: 'Un questionnaire neutre',
    text: 'Les questions sont formulées sans orienter les réponses vers une solution particulière.',
  },
  {
    title: 'Une approche complète des déplacements',
    text: 'L’enquête prend en compte les différents motifs de déplacement, les habitudes actuelles et les moyens de transport utilisés.',
  },
  {
    title: 'Identifier les renoncements',
    text: 'L’enquête cherche aussi à identifier les déplacements auxquels les habitants renoncent faute de solution de transport adaptée : aller boire un verre ou dîner sans avoir à prendre le volant, consulter un spécialiste de santé, faire des achats, participer à une activité sportive ou associative, aller au cinéma, rendre visite à des proches ou simplement profiter d’une sortie. Autant de besoins qui restent invisibles tant qu’on ne prend pas la peine de les interroger.',
  },
]

export function PublicHome() {
  return (
    <div className="-mx-4 -mt-4 flex flex-1 flex-col">
      <section className="bg-pine px-5 py-10 text-paper">
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-mist">Collectif Mobilité Haut-Doubs</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
          Enquête sur les besoins de mobilité dans le Haut-Doubs
        </h1>
        <p className="mt-4 text-lg font-bold leading-snug text-mist">
          Comment se déplacent les habitants aujourd’hui ?
          <br />
          De quoi auraient-ils besoin demain ?
        </p>
      </section>

      <section className="bg-card px-5 py-8">
        <div className="grid gap-4 text-base leading-relaxed">
          <p>Le Haut-Doubs a besoin de solutions de mobilité adaptées à la réalité de ses habitants et de ses territoires.</p>
          <p>
            Travail, études, rendez-vous médicaux, courses, loisirs, visites : beaucoup prennent la voiture, faute de transports en commun.
            D’autres renoncent à certains déplacements ou limitent leurs choix de vie : emploi, logement, sorties… faute de pouvoir se
            déplacer facilement.
          </p>
          <p>
            Le <strong className="font-extrabold">Collectif Mobilité Haut-Doubs</strong> lance une enquête auprès des habitants pour mieux
            connaître ces besoins, dans l’ensemble du territoire.
          </p>
        </div>
        <p className="mt-6 rounded-2xl bg-mist px-4 py-4 text-base leading-relaxed">
          <strong className="font-extrabold">Notre objectif : </strong>
          apporter aux collectivités et aux pouvoirs publics des données concrètes, fiables et représentatives des besoins de la
          population, afin de leur donner les moyens de construire et de mettre en œuvre les politiques de mobilité nécessaires.
        </p>
      </section>

      <section className="bg-paper px-5 py-8">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">Une enquête fondée sur une méthodologie rigoureuse</h2>
        <p className="mt-3 text-base leading-relaxed">
          Pour produire des résultats utiles et crédibles, nous avons fait le choix d’une démarche structurée.
        </p>
        <ul className="mt-5 grid gap-3">
          {METHOD.map((item) => (
            <li key={item.title} className="rounded-2xl bg-card px-4 py-4">
              <h3 className="font-extrabold leading-snug">{item.title}</h3>
              <p className="mt-1 text-base leading-relaxed text-ink">{item.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-base leading-relaxed">
          Les résultats seront analysés de manière statistique et présentés sous forme agrégée, sans identifier les personnes
          interrogées.
        </p>
      </section>

      <section className="bg-leaf px-5 py-10 text-paper">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">Une enquête citoyenne, qui a besoin de vous !</h2>
        <div className="mt-4 grid gap-4 text-base leading-relaxed">
          <p>Pour aller à la rencontre des habitants, nous avons besoin de bénévoles prêts à participer aux enquêtes en porte-à-porte.</p>
          <p>
            Pas besoin d’être spécialiste des transports : il suffit d’être disponible, à l’écoute et de suivre le questionnaire, qui se
            remplit directement sur smartphone.
          </p>
          <p className="font-extrabold">
            Chaque foyer interrogé compte. Chaque réponse contribue à mieux faire connaître les besoins du territoire.
          </p>
          <p>Rejoignez-nous pour faire entendre la voix des habitants du Haut-Doubs !</p>
        </div>
        <ContactForm />
      </section>

      <PrivacyLink />
    </div>
  )
}

export function PrivacyLink() {
  return (
    <Link to="/protection" prefetch="intent" className="mt-auto flex min-h-11 items-end justify-center bg-paper pb-1 pt-8 text-sm font-bold text-leaf">
      Protection des données
    </Link>
  )
}
