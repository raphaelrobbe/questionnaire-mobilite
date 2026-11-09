import { useNavigate } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { isAdminSession } from '~/common/config'
import { classifyEndpoint, endpointMessage, type EndpointIssue } from '~/common/endpoint'
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { getDeviceId, updateSettings } from '~/lib/settings.client'
import { probeEndpoint } from '~/lib/sheets.client'
import { Button } from './Button'
import { DeviceIdPanel } from './DeviceId'

export function SettingsScreen() {
  const settings = useSettings()
  const lists = useSheetLists()
  const navigate = useNavigate()
  const [deviceId, setDeviceId] = useState('')
  const [probe, setProbe] = useState<'idle' | 'loading' | 'confirmed' | 'sent' | 'error'>('idle')
  const [probeMessage, setProbeMessage] = useState<string | null>(null)
  const [signedOut, setSignedOut] = useState(false)

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  if (!settings) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture des réglages…</p>
  }

  const admin = isAdminSession(lists.interviewers, settings.interviewer)
  const hint = connectionHint(settings.endpoint, settings.adminEndpoint)

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
      <section className="rounded-[28px] border-2 border-test bg-test px-5 py-5 text-test-ink">
        <h1 className="text-2xl font-extrabold tracking-tight">Mode test</h1>
        <p className="mt-2 text-base font-semibold leading-snug">
          Sans identifiant autorisé, ce mode ouvre le questionnaire. Les réponses partent dans la feuille « Réponses TEST » du même tableur, et pas dans Réponses.
        </p>
        <button
          type="button"
          aria-pressed={settings.testMode}
          onClick={() => {
            updateSettings({ testMode: !settings.testMode })
            navigate('/')
          }}
          className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-test-ink px-4 text-base font-extrabold text-test"
        >
          {settings.testMode ? 'Désactiver le mode test' : 'Activer le mode test'}
        </button>
      </section>

      <h2 className="text-3xl font-extrabold tracking-tight">Réglages</h2>

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
