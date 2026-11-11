/// <reference types="vitest/config" />
import { vitePlugin as remix } from '@remix-run/dev'
import { installGlobals } from '@remix-run/node'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { contactDevApi } from './app/server/contactPlugin'
import type { SmtpEnv } from './app/server/contact.server'

installGlobals()

const base = pagesBase(process.env.PAGES_BASE_PATH)

/** Chemin public du site. `/` sur le domaine, ou `/dépôt/` sur une adresse github.io. */
function pagesBase(value: string | undefined): string {
  const text = value?.trim()
  if (!text || text === '/') return '/'
  const withSlash = text.startsWith('/') ? text : `/${text}`
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const siteKey = process.env.TURNSTILE_SITE_KEY || fileEnv.TURNSTILE_SITE_KEY || ''
  const contactUrl = process.env.VITE_CONTACT_URL || fileEnv.VITE_CONTACT_URL || ''
  const smtp = smtpEnv(process.env, fileEnv)
  const plugins = [
    ...(process.env.VITEST
      ? []
      : [
          contactDevApi(smtp),
          remix({
            basename: base,
            ssr: false,
            future: {
              v3_lazyRouteDiscovery: true,
              v3_fetcherPersist: true,
              v3_relativeSplatPath: true,
              v3_throwAbortReason: true,
            },
          }),
        ]),
    tailwindcss(),
    tsconfigPaths(),
  ].flat()
  return {
  base,
  define: {
    __TURNSTILE_SITE_KEY__: JSON.stringify(siteKey),
    __CONTACT_URL__: JSON.stringify(contactUrl),
  },
  plugins,
  server: {
    port: 4317,
    strictPort: true,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/app/lib/qr/') || id.includes('/uqr/')) return 'qr'
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: process.env.DEPLOY_GATE === '1' ? ['scripts/reponse-non-autorisee.test.ts'] : ['app/**/*.test.ts'],
  },
  }
})

function smtpEnv(processEnv: NodeJS.ProcessEnv, fileEnv: Record<string, string>): SmtpEnv {
  const pick = (name: keyof SmtpEnv) => processEnv[name] || fileEnv[name] || ''
  return {
    SMTP_HOST: pick('SMTP_HOST'),
    SMTP_PORT: pick('SMTP_PORT'),
    SMTP_USER: pick('SMTP_USER'),
    SMTP_PASSWORD: pick('SMTP_PASSWORD'),
    SMTP_TO: pick('SMTP_TO'),
    TURNSTILE_SECRET_KEY: pick('TURNSTILE_SECRET_KEY'),
  }
}
