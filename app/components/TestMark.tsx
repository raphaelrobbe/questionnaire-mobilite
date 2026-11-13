import { useNavigate } from '@remix-run/react'
import { recreateTestSamples, seedTestSamples, testSamplesSeeded } from '~/lib/draft.client'
import { useSettings } from '~/hooks/useSettings'
import { updateSettings } from '~/lib/settings.client'

export function TestModeCard() {
  const settings = useSettings()
  const navigate = useNavigate()
  if (!settings) return null

  return (
    <section className="rounded-[28px] border-2 border-test bg-test px-5 py-5 text-test-ink">
      <h1 className="text-2xl font-extrabold tracking-tight">Mode test</h1>
      <p className="mt-2 text-base font-semibold leading-snug">
        Sans identifiant autorisé, ce mode permet de tester le questionnaire en enregistrant les données dans un fichier spécifique de test.
      </p>
      <button
        type="button"
        aria-pressed={settings.testMode}
        onClick={() => {
          const enabling = !settings.testMode
          updateSettings({ testMode: enabling })
          if (enabling) seedTestSamples()
          navigate('/')
        }}
        className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-test-ink px-4 text-base font-extrabold text-test"
      >
        {settings.testMode ? 'Désactiver le mode test' : 'Activer le mode test'}
      </button>
      {settings.testMode && testSamplesSeeded() ? (
        <button
          type="button"
          onClick={() => {
            recreateTestSamples()
            navigate('/')
          }}
          className="mt-2 inline-flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-test-ink px-4 text-base font-extrabold"
        >
          Recréer les fiches de test
        </button>
      ) : null}
    </section>
  )
}

export function TestBanner() {
  const navigate = useNavigate()

  function disable() {
    updateSettings({ testMode: false })
    navigate('/')
  }

  return (
    <div data-test-banner className="bg-test text-test-ink">
      <BannerRow onDisable={disable} />
    </div>
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
