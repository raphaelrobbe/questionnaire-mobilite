/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEETS_WEBAPP_URL?: string
  readonly VITE_ADMIN_WEBAPP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'cloudflare:sockets' {
  export interface SocketAddress {
    hostname: string
    port: number
  }
  export interface SocketOptions {
    secureTransport?: 'off' | 'on' | 'starttls'
  }
  export interface Socket {
    readable: ReadableStream<Uint8Array>
    writable: WritableStream<Uint8Array>
    close(): Promise<void>
  }
  export function connect(address: string | SocketAddress, options?: SocketOptions): Socket
}
