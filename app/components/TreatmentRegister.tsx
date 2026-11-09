import { useState, type ReactNode } from 'react'
import { Reveal } from './Reveal'

const treatments: { id: string; title: string; fiche?: ReactNode }[] = [
  {
    id: 'enquete',
    title: 'Enquête sur les besoins de mobilité',
    fiche: <MobilitySurveyFiche />,
  },
  {
    id: 'foyers',
    title: 'Gestion des foyers et organisation de l’enquête',
    fiche: <HouseholdFiche />,
  },
  {
    id: 'contacts',
    title: 'Communication du collectif',
    fiche: <CommunicationFiche />,
  },
]

export function TreatmentRegister() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="grid gap-3">
      <article className="grid gap-3 rounded-[28px] border border-line bg-card px-4 py-4 text-base leading-relaxed">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          Registre des activités de traitement des données personnelles
        </h2>
        <p>
          <span className="font-extrabold">Responsable</span> : Collectif Mobilité Haut-Doubs représenté par Raphaël
          Robbe, 11 Grande Rue, 25160 Labergement-Sainte-Marie,{' '}
          <a href="mailto:contact@enquete-mobilite-haut-doubs.fr" className="font-bold text-leaf">
            contact@enquete-mobilite-haut-doubs.fr
          </a>
          .
        </p>
        <p>
          <span className="font-extrabold">Date de mise à jour</span> : 9 novembre 2026
        </p>
        <p>
          Ce registre recense les traitements de données personnelles récoltées lors de l’enquête sur les besoins de
          mobilité <em>de</em> et <em>vers</em> Pontarlier.
        </p>
        <h3 className="font-extrabold">Traitements recensés</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Enquête et analyse des besoins de mobilité</li>
          <li>Gestion des foyers et organisation de l’enquête</li>
          <li>Communication du Collectif Mobilité Haut-Doubs</li>
        </ol>
      </article>
      {treatments.map((treatment) => {
        const expanded = open === treatment.id
        return (
          <div key={treatment.id} className="grid gap-3">
            {treatment.fiche ? (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : treatment.id)}
                className={`rounded-[28px] border bg-card px-4 py-4 text-left font-extrabold leading-snug ${
                  expanded ? 'border-pine' : 'border-line'
                }`}
              >
                {treatment.title}
              </button>
            ) : (
              <h3 className="rounded-[28px] border border-line bg-card px-4 py-4 font-extrabold leading-snug">
                {treatment.title}
              </h3>
            )}
            {expanded && treatment.fiche ? (
              <Reveal>
                <article className="rounded-[28px] border border-line bg-card px-4 py-4">{treatment.fiche}</article>
              </Reveal>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function Updated() {
  return <p className="text-sm font-semibold text-muted">Dernière mise à jour : 9 novembre 2026</p>
}

function Controller() {
  return (
    <p>
      Collectif Mobilité Haut-Doubs représenté par Raphaël Robbe, 11 Grande Rue, 25160 Labergement-Sainte-Marie,{' '}
      <a href="mailto:contact@enquete-mobilite-haut-doubs.fr" className="font-bold text-leaf">
        contact@enquete-mobilite-haut-doubs.fr
      </a>
      .
    </p>
  )
}

function Transfers() {
  return (
    <p>
      Les données sont enregistrées dans Google Sheets. Google indique que certaines données peuvent être stockées ou
      traitées dans des pays où ses infrastructures ou sous-traitants sont implantés. Les conditions contractuelles de
      Google encadrent ces éventuels transferts.
    </p>
  )
}

function CommunicationFiche() {
  return (
    <div className="grid gap-3 text-base leading-relaxed">
      <p className="font-extrabold">Fiche de registre – Communication du collectif</p>
      <h3 className="font-extrabold">Responsable du traitement</h3>
      <Controller />
      <h3 className="font-extrabold">Finalité</h3>
      <p>Envoyer aux personnes qui l’ont accepté des informations et actualités du Collectif Mobilité Haut-Doubs.</p>
      <h3 className="font-extrabold">Personnes concernées</h3>
      <p>Personnes ayant demandé à recevoir les communications du collectif.</p>
      <h3 className="font-extrabold">Données traitées</h3>
      <p>Adresse e-mail ; preuve et date de l’accord pour recevoir les communications.</p>
      <h3 className="font-extrabold">Destinataires</h3>
      <p>Membres du collectif chargés de la communication. Google, en tant que fournisseur de Google Sheets.</p>
      <h3 className="font-extrabold">Durée de conservation</h3>
      <p>Jusqu’au retrait de l’accord ou à la fin des activités du collectif.</p>
      <h3 className="font-extrabold">Transferts hors Union européenne</h3>
      <Transfers />
      <h3 className="font-extrabold">Sécurité</h3>
      <p>Accès au fichier limité aux bénévoles chargés de la communication et protégé par un compte avec mot de passe.</p>
      <Updated />
    </div>
  )
}

function MobilitySurveyFiche() {
  return (
    <div className="grid gap-3 text-base leading-relaxed">
      <p className="font-extrabold">Fiche de registre – Enquête sur les besoins de mobilité</p>
      <h3 className="font-extrabold">Responsable du traitement</h3>
      <Controller />
      <h3 className="font-extrabold">Finalité</h3>
      <p>
        Recueillir et analyser les besoins de déplacements vers Pontarlier afin de produire des résultats statistiques
        et de les présenter aux collectivités et autorités compétentes.
      </p>
      <h3 className="font-extrabold">Personnes concernées</h3>
      <p>Membres des foyers interrogés, adultes et mineurs.</p>
      <h3 className="font-extrabold">Données traitées</h3>
      <p>
        Réponses au questionnaire concernant la composition du foyer, les caractéristiques générales des répondants,
        leurs déplacements, leurs habitudes et leurs besoins de mobilité. Les réponses sont associées à un code et ne
        comportent pas directement les noms ni les coordonnées des répondants.
      </p>
      <h3 className="font-extrabold">Destinataires</h3>
      <p>
        Bénévoles chargés de l’analyse ; collectivités et autorités destinataires des résultats agrégés. Google, en tant
        que fournisseur de Google Sheets.
      </p>
      <h3 className="font-extrabold">Durée de conservation</h3>
      <p>Deux ans après la fin de l’enquête, puis suppression ou anonymisation des données individuelles.</p>
      <h3 className="font-extrabold">Transferts hors Union européenne</h3>
      <Transfers />
      <h3 className="font-extrabold">Sécurité</h3>
      <p>
        Accès au fichier limité aux bénévoles qui en ont besoin et protégé par un compte avec mot de passe. Les fichiers
        contenant les identités et les coordonnées sont séparés des réponses.
      </p>
      <Updated />
    </div>
  )
}

function HouseholdFiche() {
  return (
    <div className="grid gap-3 text-base leading-relaxed">
      <h3 className="font-extrabold">Responsable du traitement</h3>
      <Controller />
      <h3 className="font-extrabold">Finalité</h3>
      <p>
        Organiser les visites d’enquête, identifier les foyers à rencontrer et assurer le suivi pratique des visites et
        des éventuelles relances.
      </p>
      <h3 className="font-extrabold">Personnes concernées</h3>
      <p>Foyers sélectionnés pour l’enquête et personnes contactées dans ce cadre.</p>
      <h3 className="font-extrabold">Données traitées</h3>
      <p>
        Nom, prénom, adresse du foyer, numéro de téléphone lorsqu’il est communiqué, code du foyer, informations de
        suivi des visites et coordonnées géographiques du lieu de l’enquête.
      </p>
      <h3 className="font-extrabold">Destinataires</h3>
      <p>
        Bénévoles chargés de réaliser et d’organiser les visites. Google, en tant que fournisseur de Google Sheets.
      </p>
      <h3 className="font-extrabold">Durée de conservation</h3>
      <p>Deux ans après la fin de l’enquête, puis suppression des coordonnées et des informations de suivi.</p>
      <h3 className="font-extrabold">Transferts hors Union européenne</h3>
      <p>
        Les données sont enregistrées dans Google Sheets. Certaines données peuvent être stockées ou traitées hors de
        l’Union européenne dans le cadre des services de Google.
      </p>
      <h3 className="font-extrabold">Sécurité</h3>
      <p>
        Accès au fichier limité aux bénévoles chargés de l’organisation des visites et protégé par un compte avec mot de
        passe.
      </p>
      <Updated />
    </div>
  )
}
