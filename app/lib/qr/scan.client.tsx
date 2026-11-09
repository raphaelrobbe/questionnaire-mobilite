import { useEffect, useRef, useState } from 'react'

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

function detectorCtor(): BarcodeDetectorCtor | null {
  const candidate = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
  return typeof candidate === 'function' ? candidate : null
}

export function QrScanner({ onResult, onClose }: { onResult: (value: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onResultRef = useRef(onResult)
  const [message, setMessage] = useState<string | null>(null)
  onResultRef.current = onResult

  useEffect(() => {
    const Ctor = detectorCtor()
    if (!Ctor || !navigator.mediaDevices?.getUserMedia) {
      setMessage('Ce téléphone ne lit pas les QR-codes.')
      return
    }
    let stopped = false
    let stream: MediaStream | null = null
    let frame = 0
    let detector: BarcodeDetectorLike
    try {
      detector = new Ctor({ formats: ['qr_code'] })
    } catch {
      setMessage('Ce téléphone ne lit pas les QR-codes.')
      return
    }

    async function loop() {
      if (stopped) return
      const video = videoRef.current
      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          const codes = await detector.detect(video)
          const value = codes.find((code) => code.rawValue)?.rawValue
          if (value && !stopped) {
            stopped = true
            cancelAnimationFrame(frame)
            stream?.getTracks().forEach((track) => track.stop())
            onResultRef.current(value)
            return
          }
        } catch {
          /* L’image n’est pas encore lisible. */
        }
      }
      if (!stopped) frame = requestAnimationFrame(() => void loop())
    }

    navigator.mediaDevices
      .getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' } } })
      .then((next) => {
        if (stopped) {
          next.getTracks().forEach((track) => track.stop())
          return
        }
        stream = next
        const video = videoRef.current
        if (!video) return
        video.srcObject = next
        return video.play()
      })
      .then(() => {
        if (!stopped) frame = requestAnimationFrame(() => void loop())
      })
      .catch(() => {
        if (!stopped) setMessage('L’appareil photo n’est pas disponible.')
      })

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <div className="fixed inset-0 z-30 grid content-end bg-ink/80 p-4">
      <div className="mx-auto grid w-full max-w-lg gap-3">
        <video ref={videoRef} className="aspect-square w-full rounded-[28px] bg-ink object-cover" playsInline muted />
        <p className="text-center text-sm font-bold text-paper">
          {message ?? 'Présentez le QR-code de l’appareil.'}
        </p>
        <button type="button" className="min-h-12 rounded-2xl bg-paper text-base font-bold text-ink" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}
