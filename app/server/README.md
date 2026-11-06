# Réservé aux loaders et actions Remix quand `ssr` sera réactivé dans `vite.config.ts`. Ne pas importer depuis un module client.

Le client poste aujourd'hui directement au script Google. Le jour d'un serveur, une action dans `app/routes/` appellera `submitResponse` (`app/service/responses.server.ts`) et le téléphone n'enverra plus que vers `/api/reponses`.
