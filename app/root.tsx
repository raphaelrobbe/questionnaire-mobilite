import type { LinksFunction, MetaFunction } from '@remix-run/node'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from '@remix-run/react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Shell } from '~/components/Shell'
import { warmOfflineCache } from '~/lib/pwa'
import { startAutoSync } from '~/lib/outbox.client'
import stylesheet from '~/tailwind.css?url'

export const meta: MetaFunction = () => [
  { title: 'Enquête mobilité' },
  {
    name: 'description',
    content: 'Enquête de terrain sur les déplacements. Les réponses partent dans un Google Sheet, ou restent sur le téléphone sans réseau.',
  },
]

export const links: LinksFunction = () => {
  const base = import.meta.env.BASE_URL
  return [
    { rel: 'stylesheet', href: stylesheet },
    { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png`, sizes: '180x180' },
    { rel: 'manifest', href: `${base}site.webmanifest` },
  ]
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#143d36" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Mobilité" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__qmInstall=e;});",
          }}
        />
        {import.meta.env.PROD ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){if(!('serviceWorker' in navigator))return;var b=${JSON.stringify(import.meta.env.BASE_URL)};navigator.serviceWorker.register(b+'sw.js',{scope:b,updateViaCache:'none'}).catch(function(){})})();`,
            }}
          />
        ) : null}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  useEffect(() => {
    warmOfflineCache()
    return startAutoSync()
  }, [])

  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}

export function HydrateFallback() {
  return (
    <p className="grid min-h-dvh place-items-center bg-paper font-sans text-lg font-bold text-ink">Ouverture de l’enquête…</p>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4 text-center text-ink">
      <div>
        <h1 className="text-xl font-extrabold">L’enquête a buté sur une erreur</h1>
        <p className="mt-2">Rechargez la page. Les fiches déjà gardées sur le téléphone sont toujours là.</p>
      </div>
    </main>
  )
}
