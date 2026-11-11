import { ContactForm } from './ContactForm'
import { PrivacyLink } from './PublicHome'

export function CollectifScreen() {
  return (
    <div className="-mx-4 -mt-4 flex flex-1 flex-col">
      <div className="grid gap-4 px-5 pt-6">
        <div className="flow-root">
          <img
            src="/ressources/logo_CMHD.png"
            alt="Logo du Collectif Mobilités Haut-Doubs"
            width={232}
            height={317}
            className="float-left mr-4 mb-3 h-auto w-36 sm:w-40"
          />
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Le Collectif Mobilité Haut-Doubs</h1>
          <p className="mt-3 text-lg font-extrabold leading-snug">
            Agir ensemble pour des mobilités plus accessibles, plus sûres et plus durables
          </p>
          <p className="mt-3 text-base leading-relaxed">
            Le <span className="font-extrabold">Collectif Mobilité Haut-Doubs</span> rassemble des associations, des
            collectifs, des citoyens et des acteurs engagés autour d’un objectif commun : améliorer les possibilités de
            déplacement dans le Haut-Doubs, territoire rural et frontalier confronté à d’importants enjeux de mobilité.
          </p>
          <p className="mt-3 text-base leading-relaxed">
            Face à la saturation de certains axes et au manque de solutions de transport adaptées, nous souhaitons
            contribuer à faire évoluer les déplacements sur le territoire, en tenant compte de la diversité des besoins
            et des réalités locales.
          </p>
        </div>

        <section className="rounded-[28px] border border-line bg-card px-5 py-5">
          <h2 className="text-xl font-extrabold">Nos objectifs</h2>
          <p className="mt-3 leading-relaxed">Nous agissons en faveur de mobilités :</p>
          <ul className="mt-3 grid list-disc gap-2 pl-5 leading-relaxed">
            <li>
              <span className="font-extrabold">Plus accessibles</span>, physiquement et financièrement, pour toutes et
              tous.
            </li>
            <li>
              <span className="font-extrabold">Plus sûres</span>, pour les déplacements du quotidien.
            </li>
            <li>
              <span className="font-extrabold">Plus durables</span>, en réduisant les impacts environnementaux des
              transports.
            </li>
            <li>
              <span className="font-extrabold">Plus cohérentes</span>, en faisant mieux fonctionner ensemble les
              différents modes de déplacement.
            </li>
          </ul>
          <p className="mt-3 leading-relaxed">
            Notre approche prend en compte l’ensemble des mobilités : marche, vélo, transports collectifs, covoiturage
            et déplacements en voiture individuelle.
          </p>
        </section>

        <section className="rounded-[28px] border border-line bg-card px-5 py-5">
          <h2 className="text-xl font-extrabold">Nos actions</h2>
          <p className="mt-3 leading-relaxed">
            Le collectif travaille à mieux comprendre les difficultés de déplacement et à faire émerger des solutions
            concrètes et réalistes.
          </p>
          <p className="mt-3 leading-relaxed">Pour cela, nous :</p>
          <ul className="mt-3 grid list-disc gap-2 pl-5 leading-relaxed">
            <li>
              <span className="font-extrabold">Rassemblons les initiatives et les acteurs locaux</span> qui souhaitent
              faire progresser les mobilités.
            </li>
            <li>
              <span className="font-extrabold">Partageons les informations et les connaissances</span> pour mieux
              comprendre les besoins et les problèmes du territoire.
            </li>
            <li>
              <span className="font-extrabold">Élaborons des propositions</span> fondées sur des constats documentés et
              adaptées aux réalités locales.
            </li>
            <li>
              <span className="font-extrabold">Dialoguons avec les élus et les collectivités</span> pour faire connaître
              les besoins des habitants et contribuer aux décisions publiques.
            </li>
            <li>
              <span className="font-extrabold">Coopérons avec les associations, les professionnels et les territoires voisins</span>, notamment sur les enjeux de mobilité en zone de montagne et de mobilité transfrontalière avec la Suisse.
            </li>
          </ul>
          <p className="mt-3 leading-relaxed">
            Nous souhaitons être une force de proposition et contribuer concrètement à l’évolution des politiques de
            mobilité dans les cinq communautés de communes du territoire du Pays du Haut-Doubs.
          </p>
        </section>

        <section className="rounded-[28px] border border-line bg-card px-5 py-5">
          <h2 className="text-xl font-extrabold">Nos valeurs</h2>
          <div className="mt-3 grid gap-3 leading-relaxed">
            <p>
              Le collectif est <span className="font-extrabold">indépendant et non partisan</span>. Il ne se rattache à
              aucun parti politique et agit dans un esprit de dialogue et de coopération.
            </p>
            <p>
              Ses membres défendent des principes de bienveillance, de non-discrimination, d’inclusion et de respect du
              travail de chacun.
            </p>
            <p>
              Nous croyons que l’amélioration des mobilités nécessite de croiser les expériences, de confronter les
              points de vue et de construire des réponses collectives.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-line bg-card px-5 py-5">
          <h2 className="text-xl font-extrabold">Qui peut participer ?</h2>
          <div className="mt-3 grid gap-3 leading-relaxed">
            <p>
              Le collectif réunit principalement des associations, des collectifs et des structures engagés sur les
              questions de mobilité.
            </p>
            <p>
              Les citoyens, habitants et personnes disposant d’une expertise particulière peuvent également participer
              aux échanges et contribuer aux réflexions.
            </p>
          </div>
        </section>
      </div>

      <section className="mt-8 bg-leaf px-5 py-8 text-paper">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          Vous souhaitez agir pour améliorer les mobilités dans le Haut-Doubs ?
        </h2>
        <p className="mt-4 text-base leading-relaxed">
          Vous pouvez prendre contact avec le collectif pour échanger, participer à ses travaux ou faire connaître vos
          initiatives.
        </p>
        <ContactForm box="collectif" />
      </section>
      <PrivacyLink />
    </div>
  )
}
