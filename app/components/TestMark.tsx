import { useNavigate } from '@remix-run/react'
import { updateSettings } from '~/lib/settings.client'

export function TestBanner() {
  const navigate = useNavigate()

  function disable() {
    updateSettings({ testMode: false })
    navigate('/')
  }

  return (
    <>
      <BannerRow />
      <div data-test-banner className="fixed inset-x-0 top-0 z-30 bg-test text-test-ink">
        <BannerRow onDisable={disable} />
      </div>
    </>
  )
}

function BannerRow({ onDisable }: { onDisable?: () => void }) {
  return (
    <div className={`px-4 py-1.5 ${onDisable ? '' : 'invisible'}`} aria-hidden={onDisable ? undefined : true}>
      <div className="mx-auto grid w-full max-w-lg grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span />
        <span className="text-center text-base font-extrabold tracking-wide">Mode test</span>
        {onDisable ? (
          <button
            type="button"
            onClick={onDisable}
            className="inline-flex min-h-9 items-center justify-center justify-self-end rounded-xl bg-test-ink px-3 text-sm font-extrabold text-test"
          >
            Désactiver
          </button>
        ) : (
          <span className="inline-flex min-h-9 items-center justify-self-end rounded-xl px-3 text-sm font-extrabold">Désactiver</span>
        )}
      </div>
    </div>
  )
}

export function TestChip() {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full bg-test px-2.5 text-xs font-extrabold text-test-ink">Mode test</span>
  )
}
