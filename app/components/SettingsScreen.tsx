import { useEffect, useState } from 'react'
import { DeviceUnknown, isAdminSession } from '~/common/config'
import { classifyEndpoint, endpointMessage, type EndpointIssue } from '~/common/endpoint'
import { MAP_APPS } from '~/common/settings'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { flushOutbox } from '~/lib/outbox.client'
import { getDeviceId, updateSettings } from '~/lib/settings.client'
import { confirmInterviewer, probeEndpoint } from '~/lib/sheets.client'
import { Button } from './Button'
import { DeviceIdPanel } from './DeviceId'
import { InstallOffer } from './InstallOffer'
import { TestModeCard } from './TestMark'

export function SettingsScreen() {
  const settings = useSettings()
  const lists = useSheetLists()
  const [deviceId, setDeviceId] = useState('')
  const [probe, setProbe] = useState<'idle' | 'loading' | 'confirmed' | 'sent' | 'error'>('idle')
  const [probeMessage, setProbeMessage] = useState<string | null>(null)
  const [signedOut, setSignedOut] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  if (!settings) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture des réglages…</p>
  }

  const admin = isAdminSession(lists.interviewers, settings.interviewer)
  const hint = connectionHint(settings.endpoint, settings.adminEndpoint)

  async function connect() {
    if (!settings || !deviceId || connecting) return
    setConnecting(true)
    setConnectError(null)
    setSignedOut(false)
    try {
      if (!navigator.onLine) {
        setConnectError('La première vérification a besoin du réseau.')
        return
      }
      await confirmInterviewer(settings.adminEndpoint, deviceId)
      await flushOutbox()
    } catch (error) {
      setConnectError(
        error instanceof DeviceUnknown
          ? 'Cet appareil n’est pas autorisé. Contactez l’administrateur.'
          : 'La première vérification a besoin du réseau.',
      )
    } finally {
      setConnecting(false)
    }
  }

  async function testConnection() {
    setProbe('loading')
    setProbeMessage(null)
    try {
      const adminProbe = await probeEndpoint(settings?.adminEndpoint ?? '')
      const responses = await probeEndpoint(settings?.endpoint ?? '')
      const result = adminProbe === 'confirmed' && responses === 'confirmed' ? 'confirmed' : 'sent'
      setProbe(result)
      setProbeMessage(
        result === 'confirmed'
          ? 'Les deux scripts répondent.'
          : 'Les requêtes sont parties, mais le navigateur ne peut pas lire la réponse de Google. Faites un entretien test, puis ouvrez Réponses et Enquêtés.',
      )
    } catch (error) {
      setProbe('error')
      setProbeMessage(error instanceof Error ? error.message : 'Test impossible.')
    }
  }

  return (
    <div className="grid gap-4">
      {settings.interviewer.trim() ? null : (
        <>
          <Button disabled={connecting || !deviceId} onClick={() => void connect()}>
            {connecting ? 'Connexion…' : 'Connexion'}
          </Button>
          {connectError ? (
            <p role="status" className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">
              {connectError}
            </p>
          ) : null}
        </>
      )}
      <InstallOffer />
      <TestModeCard />

      <h2 className="text-3xl font-extrabold tracking-tight">Réglages</h2>

      <section className="rounded-[28px] border border-line bg-card px-4 py-4">
        <h2 className="font-extrabold">Lieux</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">Choisissez l’application qui ouvrira les plans.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MAP_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              aria-pressed={settings.mapApp === app.id}
              onClick={() => updateSettings({ mapApp: app.id })}
              className={`min-h-11 rounded-2xl px-3 text-sm font-extrabold ${settings.mapApp === app.id ? 'bg-pine text-white' : 'border border-line bg-paper'}`}
            >
              {app.label}
            </button>
          ))}
        </div>
      </section>

      {admin ? (
        <>
          <p className={`text-sm font-semibold ${hint.tone === 'warn' ? 'text-clay' : hint.tone === 'ok' ? 'text-leaf' : 'text-muted'}`}>{hint.text}</p>

          <Button variant="secondary" disabled={hint.tone !== 'ok' || probe === 'loading'} onClick={() => void testConnection()}>
            {probe === 'loading' ? 'Test…' : 'Tester la connexion'}
          </Button>
          {probeMessage ? (
            <p role="status" className={`text-sm font-semibold ${probe === 'error' ? 'text-danger' : 'text-pine'}`}>
              {probeMessage}
            </p>
          ) : null}
        </>
      ) : null}

      <section className="rounded-[28px] border border-line bg-card px-4 py-4">
        <h2 className="font-extrabold">Cet appareil</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Copiez cet identifiant et envoyez-le à l’administrateur. Il l’autorise pour votre nom.
        </p>
        <DeviceIdPanel
          deviceId={deviceId}
          leading={
            settings.interviewer.trim() ? (
              <Button
                variant="danger"
                className="min-w-0 flex-1 px-2"
                onClick={() => {
                  updateSettings({ interviewer: '' })
                  setSignedOut(true)
                }}
              >
                Déconnexion
              </Button>
            ) : null
          }
        />
        {signedOut ? (
          <p role="status" className="mt-2 text-sm font-semibold leading-relaxed text-pine">
            Déconnecté. Les fiches restent sur cet appareil. La connexion sera à refaire.
          </p>
        ) : null}
      </section>
    </div>
  )
}

function connectionIssue(reason: EndpointIssue, which: 'public' | 'privé'): string {
  if (reason === 'empty') return which === 'privé' ? 'Le tableur privé n’est pas branché.' : 'Le tableur public n’est pas branché.'
  return endpointMessage(reason)
}

function connectionHint(responses: string, admin: string): { tone: 'muted' | 'ok' | 'warn'; text: string } {
  const publicEndpoint = classifyEndpoint(responses)
  const privateEndpoint = classifyEndpoint(admin)
  if (publicEndpoint.ok && privateEndpoint.ok) {
    return {
      tone: 'ok',
      text: 'Les deux tableurs sont branchés. Les réponses partent vers le tableau public, les adresses vers le tableau privé.',
    }
  }
  if (!publicEndpoint.ok && !privateEndpoint.ok && publicEndpoint.reason === 'empty' && privateEndpoint.reason === 'empty') {
    return { tone: 'muted', text: 'Sans les deux scripts, les réponses restent sur l’appareil.' }
  }
  if (!privateEndpoint.ok) return { tone: 'warn', text: connectionIssue(privateEndpoint.reason, 'privé') }
  if (!publicEndpoint.ok) return { tone: 'warn', text: connectionIssue(publicEndpoint.reason, 'public') }
  return { tone: 'muted', text: 'Sans les deux scripts, les réponses restent sur l’appareil.' }
}
