import { Link, useLocation } from '@remix-run/react'
import type { ReactNode } from 'react'
import { isAdminSession } from '~/common/config'
import { useOnline } from '~/hooks/useOnline'
import { useOutbox } from '~/hooks/useOutbox'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { Mark } from './Mark'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/file', label: 'File' },
  { to: '/reglages', label: 'Réglages' },
]

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const online = useOnline()
  const settings = useSettings()
  const lists = useSheetLists()
  const { rows } = useOutbox()
  const nav = settings && isAdminSession(lists.interviewers, settings.interviewer) ? [...links, { to: '/admin', label: 'Admin' }] : links
  const interviewing = location.pathname === '/entretien'
  const waiting = rows?.filter((row) => row.status === 'pending' || row.status === 'error').length ?? 0

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-full focus:bg-card focus:px-4 focus:py-2 focus:font-bold"
      >
        Aller au contenu
      </a>
      <header className="border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3">
          <Mark />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold leading-none tracking-tight">Mobilité</p>
            <p className="mt-1 text-sm font-semibold text-muted">Enquête de terrain</p>
          </div>
          {!online ? (
            <p className="rounded-full bg-clay-bg px-3 py-1 text-sm font-bold text-clay">Hors réseau</p>
          ) : null}
        </div>
        {interviewing ? (
          <div className="mx-auto flex w-full max-w-lg px-4 pb-3">
            <Link to="/" className="text-sm font-bold text-leaf">
              Accueil
            </Link>
          </div>
        ) : (
          <nav className="mx-auto flex w-full max-w-lg gap-1 px-3 pb-3" aria-label="Sections">
            {nav.map((link) => {
              const active = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  prefetch="intent"
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-bold ${
                    active ? 'bg-pine text-paper' : 'text-muted hover:bg-mist hover:text-ink'
                  }`}
                >
                  {link.label}
                  {link.to === '/file' && waiting > 0 ? (
                    <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-paper text-pine' : 'bg-clay-bg text-clay'}`}>
                      {waiting}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        )}
      </header>
      <main id="contenu" className="mx-auto w-full max-w-lg px-4 pb-16 pt-4">
        {children}
      </main>
    </div>
  )
}
