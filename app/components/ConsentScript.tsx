import { Link } from '@remix-run/react'
import { useEffect, useId, useRef, useState } from 'react'

const COLLECTIF = [
  'Le Collectif Mobilité Haut-Doubs est un collectif local de dialogue, de coopération et d’initiative. Il réunit, autour d’enjeux d’intérêt commun liés aux mobilités sur le territoire du Haut-Doubs, frontalier avec la Suisse, des associations, des collectifs, des organisations diverses auxquelles sont rattachés des citoyens, ainsi que, selon les besoins, des personnes ressources, experts ou habitants intéressés.',
  'Le collectif n’est ni un parti politique, ni une institution, ni une entreprise, ni une association déclarée. Il constitue un cadre souple de travail collectif, de mise en discussion, de production d’idées, d’organisation d’actions et de circulation d’informations.',
]

export function ConsentScript() {
  return (
    <div className="mt-3 grid gap-3 text-lg leading-snug">
      <p>Bonjour,</p>
      <CollectifIntro />
      <p>Vous avez été tiré au sort sur les listes électorales.</p>
      <p>
        Nous souhaitons notamment savoir comment les habitants du Haut-Doubs réalisent tous leurs déplacements, quelles
        difficultés ils rencontrent, mais aussi lesquels ils pourraient effectuer plus facilement si des transports en
        commun réguliers, directs et avec des horaires adaptés, étaient mis en place.
      </p>
      <p>
        L’enquête porte sur l’ensemble des membres de votre foyer, adultes comme mineurs. Nous allons donc vous poser
        quelques questions sur les habitudes et les besoins de déplacement des différentes personnes qui y vivent.
      </p>
      <p className="font-extrabold">À quoi serviront les réponses ?</p>
      <p>
        Les réponses seront analysées par le Collectif Mobilité Haut-Doubs et les résultats de cette analyse seront présentés aux collectivités
        et autorités publiques compétentes afin de leur faire connaître précisément les besoins de la population et
        d’étudier les solutions de transport possibles.
      </p>
      <p>Cette enquête est menée dans un but d’intérêt général, sans objectif commercial.</p>
      <p className="font-extrabold">Comment les informations seront-elles protégées ?</p>
      <p>
        Les réponses au questionnaire seront enregistrées sous un code alphanumérique.
      </p>
      <p>
        Les données personnelles (nom, prénom, adresse postale) apparaîtront dans un fichier séparé des réponses, à
        accès limité aux responsables de l’enquête et supprimé une fois les analyses effectuées ou après deux ans
        maximum. Ce fichier permettra de relier le code au foyer sollicité pour d’éventuels besoins ultérieurs relatifs
        au suivi de l’enquête. Il comportera également une adresse et un numéro de téléphone, seulement si vous
        souhaitez les communiquer en fin d’enquête.
      </p>
      <p>
        Les résultats présentés à l’extérieur ne permettront pas de vous identifier. Aucune liste nominative ni réponse
        individuelle identifiable ne sera publiée.
      </p>
      <p>
        Vous pouvez refuser de participer ou interrompre l’entretien à tout moment, sans avoir à vous justifier.
      </p>
      <p>
        Si vous souhaitez obtenir des précisions sur l’utilisation de vos données ou exercer vos droits, vous pouvez
        contacter :
      </p>
      <p>
        Responsable de l’enquête et des données : Raphaël ROBBE
        <br />
        Contact : contact@enquete-mobilite-haut-doubs.fr
      </p>
      <p className="font-extrabold">Acceptez-vous de participer à cette enquête ?</p>
    </div>
  )
}

function CollectifIntro() {
  const [open, setOpen] = useState(false)
  const noteId = useId()
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onPointer(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={box}>
      <p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={noteId}
          className="font-extrabold text-pine underline decoration-leaf decoration-2 underline-offset-[0.2em]"
          onClick={() => setOpen((value) => !value)}
        >
          Le Collectif Mobilité Haut-Doubs
        </button>{' '}
        réalise une enquête auprès des habitants du Haut-Doubs afin de mieux connaître leurs besoins en déplacements
        locaux (de/vers Pontarlier et communes proches).
      </p>
      {open ? (
        <div
          id={noteId}
          role="note"
          className="relative z-20 mt-3 rounded-2xl border border-line bg-card px-4 py-3 text-left text-base font-medium leading-relaxed text-ink shadow-lg before:absolute before:-top-2 before:left-8 before:size-4 before:rotate-45 before:border-l before:border-t before:border-line before:bg-card"
        >
          {COLLECTIF.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="mt-3 first:mt-0">
              {paragraph}
            </p>
          ))}
          <Link to="/collectif" className="mt-3 inline-flex min-h-11 items-center font-extrabold text-leaf">
            En savoir plus
          </Link>
        </div>
      ) : null}
    </div>
  )
}
