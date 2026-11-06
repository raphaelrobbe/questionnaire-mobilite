# Enquête mobilité

Questionnaire de terrain. L’enquêteur pose les questions sur le téléphone, une personne à la fois. Chaque fiche part dans un Google Sheet — c’est la base. Sans réseau, elle reste sur l’appareil et part dès que la connexion revient.

L’application tourne entièrement dans le navigateur. Aucun serveur à lancer. Les dossiers `app/server` et `app/service` sont déjà là pour le jour où un serveur devra confirmer les envois ou cacher l’adresse du script.

Même socle que les autres outils : Remix en mode client, Vite, React, TypeScript, Tailwind, Bun.

## Lancer

```bash
bun install
bun run dev
```

Puis ouvrir http://localhost:4317

```bash
bun run test
bun run typecheck
bun run build
```

Le build statique est dans `build/client`. Pour GitHub Pages, le workflow `.github/workflows/pages.yml` suppose un dépôt nommé `questionnaire-mobilite`.

## Brancher le tableur

1. Créer un Google Sheet, par exemple « Enquête mobilité ».
2. Extensions → Apps Script. Coller `scripts/google-apps-script/Code.gs`. Enregistrer.
   Le script doit être ouvert **depuis le tableur**. Sinon, renseigner `SHEET_ID` en tête du fichier.
3. Déployer → Nouveau déploiement → Application Web.
   - Exécuter en tant que : Moi
   - Qui a accès : Tout le monde
4. Copier l’URL qui se termine par `/exec`. Ce n’est pas le lien du tableur.
5. Dans l’app : Réglages → coller l’URL → Tester la connexion.
6. Faire un entretien. La ligne apparaît dans l’onglet **Réponses** (créé tout seul).

Toute personne qui a cette URL peut ajouter une ligne. Ne la publiez pas. Pour un garde-fou léger, mettez le même mot dans `TOKEN` du script et dans « Jeton du script ». Le jeton n’est pas écrit dans le tableur.

Google ne renvoie pas d’accusé de réception au navigateur. Après le premier entretien test, ouvrez l’onglet Réponses. Les envois suivants portent la mention « Envoyée ».

Sans URL, l’app reste utilisable : les fiches restent dans la file, sur le téléphone.

## Déroulé d’un entretien

Accueil → Nouvelle personne. Un texte à lire, puis une question par écran, puis la relecture. On peut noter la position du lieu d’enquête. « Pause » garde le brouillon. « Personne suivante » en ouvre un autre.

Les questions couvrent l’habitation, l’âge, le mode principal, le nombre de déplacements, le motif, la durée, les gênes, la priorité d’aménagement, une note, un commentaire, et un recontact facultatif.

## Fichiers

```
app/common/     questionnaire, validation, colonnes du tableur
app/lib/        file IndexedDB, brouillon, envoi navigateur
app/service/    le même envoi, côté Node, pour un futur serveur
app/server/     emplacement des futures actions Remix
app/routes/     accueil, entretien, file, réglages
scripts/google-apps-script/Code.gs
```

Le client et `submitResponse` construisent le même JSON (`kind`, `token`, `headers`, `row`). Les en-têtes du tableur suivent les noms de colonnes : si l’app en ajoute, le script les ajoute en bout de ligne sans décaler l’existant.

## Le jour où il y a un serveur

Dans `vite.config.ts`, repasser `ssr` à `true`. Ajouter une action Remix, par exemple `app/routes/api.reponses.ts`, qui appelle `submitResponse` dans `app/service/responses.server.ts`. L’URL du script et le jeton vivent alors dans l’environnement du serveur, plus dans le téléphone. Dans Réglages, l’adresse `/api/reponses` est déjà acceptée. Ce chemin lit le JSON de retour et peut marquer la fiche « Confirmée ». Aujourd’hui le téléphone ne le peut pas : le script Google répond, mais le navigateur n’a pas le droit de lire la réponse, et un second essai écrirait la ligne deux fois.
