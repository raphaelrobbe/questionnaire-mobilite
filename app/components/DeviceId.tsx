import { useEffect, useState, type ReactNode } from 'react'
import { copyText } from '~/lib/settings.client'
import { Button } from './Button'

export function DeviceIdPanel({ deviceId, leading }: { deviceId: string; leading?: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyNotice, setCopyNotice] = useState(0)
  const [copyError, setCopyError] = useState(false)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [qrBusy, setQrBusy] = useState(false)
  const [qrError, setQrError] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 10_000)
    return () => window.clearTimeout(timer)
  }, [copied, copyNotice])

  async function copyDeviceId() {
    setCopyError(false)
    const ok = await copyText(deviceId)
    setCopied(ok)
    setCopyError(!ok)
    if (ok) setCopyNotice((current) => current + 1)
  }

  async function showQr() {
    if (!deviceId || qrBusy) return
    if (qrSvg) {
      setQrSvg(null)
      return
    }
    setQrBusy(true)
    setQrError(false)
    try {
      const { deviceQrSvg } = await import('~/lib/qr/draw.client')
      setQrSvg(deviceQrSvg(deviceId))
    } catch {
      setQrError(true)
    } finally {
      setQrBusy(false)
    }
  }

  return (
    <>
      <div className="mt-3 flex items-center gap-2">
        <p className={`min-w-0 flex-1 font-mono text-sm ${visible ? 'break-all' : 'tracking-[0.35em] text-muted'}`}>
          {visible ? deviceId || '…' : '••••••••'}
        </p>
        <Button variant="secondary" className="w-auto shrink-0 px-3" disabled={!deviceId} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
          {visible ? 'Masquer' : 'Voir'}
        </Button>
      </div>
      <div className="mt-3 flex gap-2">
        {leading}
        <Button variant="secondary" className="min-w-0 flex-1 px-2" disabled={!deviceId} onClick={() => void copyDeviceId()}>
          {copied ? 'Identifiant copié' : 'Copier l’identifiant'}
        </Button>
        <Button variant="secondary" className="min-w-0 flex-1 px-2" disabled={!deviceId || qrBusy} aria-pressed={Boolean(qrSvg)} onClick={() => void showQr()}>
          QR-code
        </Button>
      </div>
      {qrSvg ? (
        <div
          className="mx-auto mt-4 w-56 [&_svg]:h-auto [&_svg]:w-full"
          role="img"
          aria-label="QR-code de l’identifiant"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      ) : null}
      {qrError ? <p className="mt-2 text-sm font-semibold text-clay">Le QR-code n’a pas pu être affiché.</p> : null}
      {copyError ? <p className="mt-2 text-sm font-semibold text-clay">La copie a échoué.</p> : null}
    </>
  )
}
