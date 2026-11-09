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

La version construite (`bun run build`) est installable. Au premier lancement avec du réseau, le téléphone garde toutes les pages. Ensuite l’enquêteur peut rouvrir l’application et mener l’entretien sans réseau, une fois son nom retrouvé. Les fiches restent sur l’appareil et partent quand la connexion revient. Les communes viennent de la dernière lecture en ligne.

```bash
bun run test
bun run typecheck
bun run build
```

Le build statique est dans `build/client`. Sur le domaine, GitHub Pages le sert à la racine. Sans domaine, l’adresse `github.io` le sert dans le dossier du dépôt : le workflow reprend le chemin indiqué par GitHub.

## Brancher les deux tableurs

Deux fichiers Drive, deux scripts. Aucun des deux n’ouvre l’autre.

1. Tableur public, une feuille **Réponses**. Elle pourra être rendue publique. L’identité d’une fiche y est le code à 8 caractères. Extensions → Apps Script, ouvert depuis ce tableur. Coller `scripts/google-apps-script/reponses/Code.gs`.
2. Tableur privé. Feuilles **Enquêteurs**, **Communes** et **Enquêtés**. Coller `scripts/google-apps-script/admin/Code.gs` dans le script de ce tableur-là.
3. Pour chaque script : Déployer → Nouveau déploiement → Application Web.
   - Exécuter en tant que : Moi
   - Qui a accès : Tout le monde
4. Copier les deux URL qui se terminent par `/exec`. Ce ne sont pas les liens des tableurs.
5. En local, `.env` : `VITE_SHEETS_WEBAPP_URL` pour le script public, `VITE_ADMIN_WEBAPP_URL` pour le script privé. Relancer l’application. Pour GitHub Pages, les deux noms en secrets du dépôt. Dans Réglages : Tester la connexion.
6. Faire un entretien. La ligne apparaît dans **Réponses**. Le nom, l’adresse, le téléphone, la position et l’adresse mail sont écrits dans **Enquêtés**, avec le même code, et pas dans Réponses. La commune est dans les deux feuilles.

Tant que le nom n’a pas été retrouvé, l’accueil n’affiche que l’identifiant de l’appareil et un bouton Connexion. Connexion lit la feuille Enquêteurs du script privé. Si l’identifiant est sur une ligne, le nom de cette ligne est gardé sur le téléphone, et l’enquête peut ensuite se faire sans réseau. Cette lecture ne renvoie que ce nom et les communes. Elle renvoie toute la liste, avec les identifiants et les numéros, seulement quand l’identifiant appartient à un administrateur. La feuille a les colonnes « Prénom Nom », « Identifiants appareils autorisés », « Admin » et, dès qu’un enquêteur est ajouté depuis l’application, « Numéro de téléphone ». La cellule d’identifiants vaut `[]` (personne), un identifiant seul, ou `[id1, id2]`. L’enquêteur copie l’identifiant affiché et l’envoie à l’administrateur. Si Admin vaut `oui` et que cet appareil est déjà autorisé pour lui, l’écran Administration permet d’ajouter un enquêteur — le numéro est facultatif — puis d’ajouter ou de retirer des identifiants. Il faut coller la nouvelle version de `scripts/google-apps-script/admin/Code.gs` et redéployer ce script pour que l’ajout fonctionne. Le premier administrateur s’ajoute encore à la main dans le tableur.

Avant d’écrire une ligne, l’application redemande au script privé si l’identifiant est encore dans Enquêteurs. S’il n’y est plus, elle n’envoie ni la fiche ni l’adresse, elle retire le nom gardé, et la fiche reste sur le téléphone. Si le réseau ou le script ne répond pas, le nom reste et la fiche attend. Le script public ne fait pas ce contrôle : il ne voit pas la feuille Enquêteurs.

Le téléphone ne lit pas la réponse de l’envoi. Deux secondes après, il demande au script public si le code est dans Réponses, puis toutes les deux secondes, cinq fois en tout. Tant que le code n’est pas retrouvé, la fiche reste « Envoyée » : partie, sans garantie. Une fois le code retrouvé, elle passe « Enregistrée ». Il faut coller la nouvelle version de `scripts/google-apps-script/reponses/Code.gs` et redéployer ce script pour que cette lecture existe.

Sans l’URL du script privé, la connexion est impossible et une nouvelle enquête ne démarre pas. Les fiches déjà gardées restent dans la file.

## Déroulé d’un entretien

Accueil → Nouvelle personne. Plusieurs fiches peuvent être commencées et reprises dans la liste. Nom et prénom, commune, adresse, puis l’accord, une question par écran, puis la relecture. On peut noter la position du lieu d’enquête. « Pause » garde la fiche. « Personne suivante » en ouvre une autre.

Le nom affiché est celui retrouvé à la connexion, sur la ligne de la feuille Enquêteurs qui contient l’identifiant de l’appareil. Nom, prénom et adresse sont facultatifs. La commune est obligatoire. Le téléphone, facultatif, est demandé avec l’adresse mail : les espaces et le + sont gardés. La suite du questionnaire viendra ensuite.

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

Le client et `submitResponse` envoient deux JSON distincts. `kind: response` va au script public : `headers` et `row`, sans nom, adresse, téléphone ni coordonnées. `kind: mail` va au script privé, feuille Enquêtés : le code, le nom, la commune, l’adresse, le téléphone, la position, l’adresse mail, le recontact et le collectif. Le script privé refuse l’écriture si l’appareil n’est pas autorisé pour l’enquêteur. Le script public ne connaît pas cette liste. Un second envoi du même code ne crée pas une seconde ligne. Tant que le questionnaire n’est pas en service, un changement de colonnes remplace la feuille Réponses. La feuille Enquêtés n’est pas vidée.

## Le jour où il y a un serveur

Dans `vite.config.ts`, repasser `ssr` à `true`. Ajouter une action Remix, par exemple `app/routes/api.reponses.ts`, qui appelle `submitResponse` dans `app/service/responses.server.ts`. L’URL du script vit alors dans l’environnement du serveur, plus dans le téléphone. Une valeur `/api/reponses` dans `VITE_SHEETS_WEBAPP_URL` est déjà acceptée. Ce chemin lit le JSON de retour et peut marquer la fiche « Confirmée ». Aujourd’hui le téléphone ne le peut pas : le script Google répond, mais le navigateur n’a pas le droit de lire la réponse. Un second essai du même code ne réécrit pas la ligne.
