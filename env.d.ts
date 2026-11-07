/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEETS_WEBAPP_URL?: string
  readonly VITE_ADMIN_WEBAPP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
