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

## Brancher les deux tableurs

Deux fichiers Drive, deux scripts. Aucun des deux n’ouvre l’autre.

1. Tableur public, une feuille **Réponses**. Elle pourra être rendue publique. L’identité d’une fiche y est le code à 8 caractères. Extensions → Apps Script, ouvert depuis ce tableur. Coller `scripts/google-apps-script/reponses/Code.gs`.
2. Tableur privé. Feuilles **Enquêteurs**, **Communes** et **Adresses mail**. Coller `scripts/google-apps-script/admin/Code.gs` dans le script de ce tableur-là.
3. Pour chaque script : Déployer → Nouveau déploiement → Application Web.
   - Exécuter en tant que : Moi
   - Qui a accès : Tout le monde
4. Copier les deux URL qui se terminent par `/exec`. Ce ne sont pas les liens des tableurs.
5. En local, `.env` : `VITE_SHEETS_WEBAPP_URL` pour le script public, `VITE_ADMIN_WEBAPP_URL` pour le script privé. Relancer l’application. Pour GitHub Pages, les deux noms en secrets du dépôt. Dans Réglages : Tester la connexion.
6. Faire un entretien. La ligne apparaît dans **Réponses**. Si une adresse mail est donnée, elle est écrite dans **Adresses mail**, avec le même code, et pas dans Réponses.

Une enquête ne démarre que si le couple enquêteur + identifiant d’appareil est autorisé. La feuille Enquêteurs a trois colonnes : « Prénom Nom », « Identifiants appareils autorisés » et « Admin ». La cellule d’identifiants vaut `[]` (personne), un identifiant seul, ou `[id1, id2]`. L’enquêteur copie son identifiant dans Réglages et l’envoie à l’administrateur. Si Admin vaut `oui` et que cet appareil est déjà autorisé pour lui, l’écran Administration permet d’ajouter ou de retirer des identifiants. Le premier administrateur s’ajoute à la main dans le tableur.

Google ne renvoie pas d’accusé de réception au navigateur. Après le premier entretien test, ouvrez l’onglet Réponses. Les envois suivants portent la mention « Envoyée ».

Sans l’URL du script privé, les fiches déjà gardées restent dans la file, mais une nouvelle enquête ne peut pas démarrer : la liste des appareils autorisés est illisible.

## Déroulé d’un entretien

Accueil → Nouvelle personne. Un texte à lire, puis une question par écran, puis la relecture. On peut noter la position du lieu d’enquête. « Pause » garde le brouillon. « Personne suivante » en ouvre un autre.

L’enquêteur est choisi dans la feuille Enquêteurs du tableur admin, colonne « Prénom Nom ». Son appareil doit être listé sur la même ligne. Les questions commencent par la commune de résidence (Pontarlier, puis la feuille Communes, colonne « Nom commune »), les personnes du foyer, les véhicules, puis le recontact et les informations du Collectif Mobilités du Haut-Doubs. La suite du questionnaire viendra ensuite.

## Fichiers

```
app/common/     questionnaire, validation, colonnes du tableur
app/lib/        file IndexedDB, brouillon, envoi navigateur
app/service/    le même envoi, côté Node, pour un futur serveur
app/server/     emplacement des futures actions Remix
app/routes/     accueil, entretien, file, réglages, administration
scripts/google-apps-script/reponses/Code.gs
scripts/google-apps-script/admin/Code.gs
```

Le client et `submitResponse` envoient deux JSON distincts. `kind: response` va au script public : `headers` et `row`, sans adresse. `kind: mail` va au script privé : le code, l’adresse, le recontact et le collectif. Le script privé refuse l’adresse si l’appareil n’est pas autorisé pour l’enquêteur. Le script public ne connaît pas cette liste. Un second envoi du même code ne crée pas une seconde ligne. Tant que le questionnaire n’est pas en service, un changement de colonnes remplace la feuille Réponses. La feuille Adresses mail n’est pas vidée.

## Le jour où il y a un serveur

Dans `vite.config.ts`, repasser `ssr` à `true`. Ajouter une action Remix, par exemple `app/routes/api.reponses.ts`, qui appelle `submitResponse` dans `app/service/responses.server.ts`. L’URL du script vit alors dans l’environnement du serveur, plus dans le téléphone. Une valeur `/api/reponses` dans `VITE_SHEETS_WEBAPP_URL` est déjà acceptée. Ce chemin lit le JSON de retour et peut marquer la fiche « Confirmée ». Aujourd’hui le téléphone ne le peut pas : le script Google répond, mais le navigateur n’a pas le droit de lire la réponse. Un second essai du même code ne réécrit pas la ligne.
