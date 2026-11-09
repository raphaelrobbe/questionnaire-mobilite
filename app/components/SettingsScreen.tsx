import { useEffect, useState } from 'react'
import { classifyEndpoint, endpointMessage, type EndpointIssue } from '~/common/endpoint'
import { useSettings } from '~/hooks/useSettings'
import { copyText, getDeviceId } from '~/lib/settings.client'
import { probeEndpoint } from '~/lib/sheets.client'
import { Button } from './Button'

export function SettingsScreen() {
  const settings = useSettings()
  const [deviceId, setDeviceId] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [probe, setProbe] = useState<'idle' | 'loading' | 'confirmed' | 'sent' | 'error'>('idle')
  const [probeMessage, setProbeMessage] = useState<string | null>(null)

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  if (!settings) {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture des réglages…</p>
  }

  const hint = connectionHint(settings.endpoint, settings.adminEndpoint)

  async function testConnection() {
    setProbe('loading')
    setProbeMessage(null)
    try {
      const admin = await probeEndpoint(settings?.adminEndpoint ?? '')
      const responses = await probeEndpoint(settings?.endpoint ?? '')
      const result = admin === 'confirmed' && responses === 'confirmed' ? 'confirmed' : 'sent'
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

  async function copyDeviceId() {
    setCopyError(false)
    const ok = await copyText(deviceId)
    setCopied(ok)
    setCopyError(!ok)
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold tracking-tight">Réglages</h1>

      <p className={`text-sm font-semibold ${hint.tone === 'warn' ? 'text-clay' : hint.tone === 'ok' ? 'text-leaf' : 'text-muted'}`}>{hint.text}</p>

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
          Copiez cet identifiant et envoyez-le à l’administrateur. Il l’autorise pour votre nom.
        </p>
        <p className="mt-3 break-all font-mono text-sm">{deviceId || '…'}</p>
        <Button variant="secondary" className="mt-3" disabled={!deviceId} onClick={() => void copyDeviceId()}>
          {copied ? 'Identifiant copié' : 'Copier l’identifiant'}
        </Button>
        {copyError ? (
          <p className="mt-2 text-sm font-semibold text-clay">La copie a échoué. Sélectionnez l’identifiant ci-dessus et copiez-le.</p>
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
