import { Link, useLocation } from '@remix-run/react'
import type { ReactNode } from 'react'
import { isAdminSession } from '~/common/config'
import { canUseSurvey } from '~/common/settings'
import { useOnline } from '~/hooks/useOnline'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { Mark } from './Mark'
import { TestBanner } from './TestMark'

const links = [{ to: '/', label: 'Accueil enquêteur' }]

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const online = useOnline()
  const settings = useSettings()
  const lists = useSheetLists()
  const nav = settings && isAdminSession(lists.interviewers, settings.interviewer) ? [...links, { to: '/admin', label: 'Admin' }] : []
  const interviewing = location.pathname === '/entretien'
  const onSettings = location.pathname === '/reglages'
  const onSite = location.pathname === '/site'
  const survey = Boolean(settings && canUseSurvey(settings))

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2 focus:font-bold"
      >
        Aller au contenu
      </a>
      <div data-top-banner className="sticky top-0 z-40">
        <p className="bg-clay px-3 py-1 text-center text-xs font-bold leading-tight text-paper">
          Site en cours de construction - Ne pas diffuser
        </p>
        {settings?.testMode ? <TestBanner /> : null}
      </div>
      {interviewing ? null : (
        <header data-site-header className="border-b border-line bg-card/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3">
            <Link to="/" className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl">
              <Mark />
              <span className="min-w-0">
                <span className="block text-base font-extrabold leading-tight tracking-tight text-ink">
                  La mobilité dans le Haut-Doubs
                </span>
                <span className="mt-1 block text-sm font-semibold text-muted">Enquête de terrain</span>
              </span>
            </Link>
            {!online ? (
              <p className="rounded-full bg-clay-bg px-3 py-1 text-sm font-bold text-clay">Hors réseau</p>
            ) : null}
            {survey ? (
              <Link
                to="/site"
                prefetch="intent"
                aria-label="Accueil du site"
                aria-current={onSite ? 'page' : undefined}
                className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full ${
                  onSite ? 'bg-pine text-paper' : 'text-pine hover:bg-mist'
                }`}
              >
                <House />
              </Link>
            ) : null}
            <Link
              to={onSettings ? '/' : '/reglages'}
              prefetch="intent"
              aria-label={onSettings ? 'Retour à l’accueil' : 'Réglages'}
              aria-current={onSettings ? 'page' : undefined}
              className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full ${
                onSettings ? 'bg-pine text-paper' : 'text-pine hover:bg-mist'
              }`}
            >
              <Gear />
            </Link>
          </div>
          {nav.length > 0 ? (
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
                  </Link>
                )
              })}
            </nav>
          ) : null}
        </header>
      )}
      <main id="contenu" className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-4 pt-4">
        {children}
      </main>
    </div>
  )
}

function House() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
    </svg>
  )
}

function Gear() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" fill="currentColor">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.48.41l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.49.49 0 0 0-.59.22L2.69 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.13.22.39.3.61.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.22.08.48 0 .61-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
    </svg>
  )
}
