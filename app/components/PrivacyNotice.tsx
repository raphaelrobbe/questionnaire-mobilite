export function PrivacyNotice() {
  return (
    <article className="grid gap-3 text-base leading-relaxed">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">Protection des données personnelles</h2>
      <h3 className="font-extrabold">Responsable du traitement</h3>
      <p>
        L’enquête est organisée par le Collectif Mobilité Haut-Doubs, représenté par Raphaël Robbe. Pour toute question
        relative à vos données personnelles ou pour exercer vos droits, vous pouvez écrire à :{' '}
        <a href="mailto:contact@enquete-mobilite-haut-doubs.fr" className="font-bold text-leaf">
          contact@enquete-mobilite-haut-doubs.fr
        </a>
        .
      </p>
      <h3 className="font-extrabold">Pourquoi vos données sont-elles collectées ?</h3>
      <p>
        Les données recueillies servent à réaliser une enquête sur les besoins de déplacement des habitants du
        Haut-Doubs, à analyser les besoins actuels et potentiels en transports
        en commun et à présenter des résultats aux collectivités et autorités publiques compétentes.
      </p>
      <h3 className="font-extrabold">Quelles données sont utilisées ?</h3>
      <p>
        L’enquête peut recueillir des informations sur la composition du foyer, les tranches d’âge, les activités, les
        habitudes et les besoins de déplacement. Pour organiser les visites et assurer le suivi de l’enquête, la civilité, le nom,
        l’adresse et, lorsqu’il est communiqué, le numéro de téléphone peuvent également être conservés séparément des
        réponses. Le numéro de téléphone est utilisé uniquement pour les besoins de l’enquête.
      </p>
      <p>
        La localisation géographique du lieu de l’enquête (coordonnées GPS) peut aussi être enregistrée afin de situer
        les enquêtes et d’analyser les besoins de mobilité sur le territoire.
      </p>
      <p>
        La participation est facultative. Vous pouvez refuser de répondre à une question ou interrompre votre
        participation à tout moment.
      </p>
      <h3 className="font-extrabold">Comment vos réponses sont-elles protégées ?</h3>
      <p>
        Les réponses sont associées à un code et conservées séparément des informations permettant de vous identifier.
        Les résultats communiqués aux collectivités ou rendus publics sont présentés sous forme agrégée et ne permettent
        pas de vous identifier.
      </p>
      <p>
        Les coordonnées éventuellement communiquées pour recevoir des informations du Collectif sont facultatives et ne
        sont utilisées à cette fin qu’avec votre accord. Cet accord peut être retiré à tout moment.
      </p>
      <h3 className="font-extrabold">Cookies</h3>
      <p>
        L’application d’enquête ne dépose aucun cookie. Le formulaire de contact utilise Cloudflare Turnstile, qui peut
        en déposer un pour vérifier que le message n’est pas envoyé par un robot. Le brouillon, la file d’envoi et les
        réglages sont conservés dans la mémoire du téléphone uniquement parce que l’enquête en a besoin pour
        fonctionner. Aucune bannière d’acceptation n’est donc affichée. L’adresse et le message du formulaire sont
        transmis au collectif uniquement pour y répondre. Ils ne sont pas ajoutés aux réponses de l’enquête. Si un lien
        ouvre une page Google, par exemple pour situer une adresse, Google peut déposer ses propres cookies sur son
        site. Ces cookies ne sont pas ceux de l’enquête et ne sont pas nécessaires pour y répondre.
      </p>
      <h3 className="font-extrabold">Combien de temps les données sont-elles conservées ?</h3>
      <p>
        Les coordonnées utilisées pour organiser l’enquête sont supprimées lorsqu’elles ne sont plus nécessaires au
        suivi de celle-ci. Les réponses sont conservées sous une forme pseudonymisée pendant la période nécessaire à
        leur vérification et à leur analyse, puis anonymisées ou supprimées. Les coordonnées personnelles sont
        conservées jusqu’au retrait de votre accord et au plus tard pendant 2 ans.
      </p>
      <h3 className="font-extrabold">Quels sont vos droits ?</h3>
      <p>
        Conformément au RGPD et à la loi Informatique et Libertés, vous disposez, selon les conditions applicables, de
        droits d’accès, de rectification, d’effacement, de limitation et d’opposition au traitement de vos données. Vous
        pouvez également retirer à tout moment votre accord pour recevoir des informations du Collectif.
      </p>
      <p>
        Pour exercer vos droits :{' '}
        <a href="mailto:contact@enquete-mobilite-haut-doubs.fr" className="font-bold text-leaf">
          contact@enquete-mobilite-haut-doubs.fr
        </a>
        .
      </p>
      <p>
        Vous pouvez également adresser une réclamation à la Commission nationale de l’informatique et des libertés
        (CNIL) :{' '}
        <a href="https://www.cnil.fr" className="font-bold text-leaf" target="_blank" rel="noopener noreferrer">
          https://www.cnil.fr
        </a>
        .
      </p>
      <p className="text-sm font-semibold text-muted">Dernière mise à jour : 10 novembre 2026</p>
    </article>
  )
}
