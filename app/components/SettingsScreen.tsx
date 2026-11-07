import { useEffect, useState } from 'react'
import { endpointHint } from '~/common/endpoint'
import { useSettings } from '~/hooks/useSettings'
import { flushOutbox } from '~/lib/outbox.client'
import { getDeviceId, updateSettings } from '~/lib/settings.client'
import { probeEndpoint } from '~/lib/sheets.client'
import { Button } from './Button'

export function SettingsScreen() {
  const settings = useSettings()
  const [deviceId, setDeviceId] = useState('')
  const [probe, setProbe] = useState<'idle' | 'loading' | 'confirmed' | 'sent' | 'error'>('idle')
  const [probeMessage, setProbeMessage] = useState<string | null>(null)

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  if (!settings) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture des réglages…</p>
  }

  const hint = endpointHint(settings.endpoint)

  async function testConnection() {
    setProbe('loading')
    setProbeMessage(null)
    try {
      const result = await probeEndpoint(settings?.endpoint ?? '', settings?.token.trim() ?? '')
      setProbe(result)
      setProbeMessage(
        result === 'confirmed'
          ? 'Le script répond. Le tableur est prêt à recevoir une ligne.'
          : 'La requête est partie, mais le navigateur ne peut pas lire la réponse de Google. Faites un entretien test et ouvrez l’onglet Réponses.',
      )
    } catch (error) {
      setProbe('error')
      setProbeMessage(error instanceof Error ? error.message : 'Test impossible.')
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Réglages</h1>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Le prénom et le lieu sont recopiés sur chaque fiche. Ils restent sur cet appareil.
        </p>
      </div>

      <label className="grid gap-2">
        <span className="font-bold">Enquêteur</span>
        <input
          value={settings.interviewer}
          maxLength={80}
          autoComplete="off"
          placeholder="Prénom"
          onChange={(event) => updateSettings({ interviewer: event.target.value })}
          className="min-h-14 rounded-2xl border border-line bg-card px-4 text-base outline-none focus:border-leaf"
        />
      </label>

      <label className="grid gap-2">
        <span className="font-bold">Lieu d’enquête</span>
        <input
          value={settings.place}
          maxLength={120}
          autoComplete="off"
          placeholder="Ex. marché du samedi, place de la Halle"
          onChange={(event) => updateSettings({ place: event.target.value })}
          className="min-h-14 rounded-2xl border border-line bg-card px-4 text-base outline-none focus:border-leaf"
        />
      </label>

      <p className={`text-sm font-semibold ${hint.tone === 'warn' ? 'text-clay' : hint.tone === 'ok' ? 'text-leaf' : 'text-muted'}`}>{hint.text}</p>

      <label className="grid gap-2">
        <span className="font-bold">Jeton du script</span>
        <input
          value={settings.token}
          maxLength={200}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Vide si TOKEN n’est pas rempli dans le script"
          onChange={(event) => updateSettings({ token: event.target.value })}
          onBlur={() => {
            void flushOutbox()
          }}
          className="min-h-14 rounded-2xl border border-line bg-card px-4 text-base outline-none focus:border-leaf"
        />
        <span className="text-sm font-semibold text-muted">
          Facultatif. Le même mot que la constante TOKEN du script, si vous en avez mis un. Il n’est pas écrit dans le tableur.
        </span>
      </label>

      <Button variant="secondary" disabled={hint.tone !== 'ok' || probe === 'loading'} onClick={() => void testConnection()}>
        {probe === 'loading' ? 'Test…' : 'Tester la connexion'}
      </Button>
      {probeMessage ? (
        <p role="status" className={`text-sm font-semibold ${probe === 'error' ? 'text-danger' : 'text-pine'}`}>
          {probeMessage}
        </p>
      ) : null}

      <section className="rounded-[28px] border border-line bg-card px-4 py-4">
        <h2 className="font-extrabold">Cet appareil</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Identifiant recopié dans la colonne appareil, pour distinguer les téléphones. Il ne nomme pas la personne interrogée.
        </p>
        <p className="mt-3 break-all font-mono text-sm">{deviceId || '…'}</p>
      </section>
    </div>
  )
}
