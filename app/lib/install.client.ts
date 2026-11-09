import { useEffect, useState } from 'react'

type InstallPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallWindow = Window & { __qmInstall?: InstallPrompt }

function runningInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return true
  return window.matchMedia('(display-mode: standalone), (display-mode: window-controls-overlay)').matches
}

function savedPrompt(): InstallPrompt | null {
  return (window as InstallWindow).__qmInstall ?? null
}

function clearSavedPrompt(): void {
  delete (window as InstallWindow).__qmInstall
}

export function installHint(): string {
  const ua = navigator.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (ios) return 'Dans Safari, touchez Partager, puis « Sur l’écran d’accueil ».'
  return 'Dans le menu du navigateur, choisissez « Installer l’application ».'
}

export function useInstall(): { show: boolean; hint: string | null; install: () => Promise<void> } {
  const [show, setShow] = useState(false)
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone), (display-mode: window-controls-overlay)')
    const read = () => setShow(!runningInstalled())
    read()
    setPromptEvent(savedPrompt())
    const onPrompt = (event: Event) => {
      event.preventDefault()
      const prompt = event as InstallPrompt
      ;(window as InstallWindow).__qmInstall = prompt
      setPromptEvent(prompt)
    }
    const onInstalled = () => {
      clearSavedPrompt()
      setPromptEvent(null)
      setHint(null)
      setShow(false)
    }
    media.addEventListener('change', read)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      media.removeEventListener('change', read)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    const prompt = promptEvent ?? savedPrompt()
    setHint(null)
    if (!prompt) {
      setHint(installHint())
      return
    }
    clearSavedPrompt()
    setPromptEvent(null)
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === 'accepted') setShow(false)
  }

  return { show, hint, install }
}
