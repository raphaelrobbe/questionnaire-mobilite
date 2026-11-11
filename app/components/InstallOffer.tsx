import { useInstall } from '~/lib/install.client'

export function InstallOffer() {
  const offer = useInstall()
  if (!offer.show) return null
  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => void offer.install()}
        className="inline-flex min-h-9 w-fit items-center justify-center justify-self-end gap-1.5 rounded-full border border-line bg-card px-3 text-sm font-bold leading-tight text-ink hover:bg-mist"
      >
        <InstallIcon />
        Installer l’application
      </button>
      {offer.hint ? (
        <p role="status" className="text-sm font-semibold leading-relaxed text-muted">
          {offer.hint}
        </p>
      ) : null}
    </div>
  )
}

function InstallIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}
