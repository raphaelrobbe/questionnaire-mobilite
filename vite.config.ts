/// <reference types="vitest/config" />
import { vitePlugin as remix } from '@remix-run/dev'
import { installGlobals } from '@remix-run/node'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

installGlobals()

const base = process.env.GITHUB_PAGES === 'true' ? '/questionnaire-mobilite/' : '/'

export default defineConfig({
  base,
  plugins: [
    ...(process.env.VITEST
      ? []
      : [
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
  ],
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
})
