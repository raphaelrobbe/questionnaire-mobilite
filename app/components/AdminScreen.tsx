import { Link } from '@remix-run/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { fold, isAdminSession, normalizeDeviceId, normalizeEmail, normalizePhone } from '~/common/config'

const QrScanner = lazy(() => import('~/lib/qr/scan.client').then((mod) => ({ default: mod.QrScanner })))
import { useSettings } from '~/hooks/useSettings'
import { useSheetLists } from '~/hooks/useSheetLists'
import { fetchSheetLists, publishLists } from '~/lib/config.client'
import { getDeviceId } from '~/lib/settings.client'
import { buttonClass } from './Button'
import { fieldClass } from './fill'
import { DrawPanel } from './DrawPanel'
import { LetterDraft } from './LetterDraft'

export function AdminScreen() {
  const settings = useSettings()
  const lists = useSheetLists()
  const [deviceId, setDeviceId] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [personName, setPersonName] = useState('')
  const [personPhone, setPersonPhone] = useState('')
  const [personEmail, setPersonEmail] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmKey, setConfirmKey] = useState<string | null>(null)
  const [scannedId, setScannedId] = useState<string | null>(null)
  const [scanFor, setScanFor] = useState<string | null>(null)
  const [tab, setTab] = useState<'enqueteurs' | 'courrier' | 'tirage'>('enqueteurs')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  if (!settings || !deviceId || lists.status === 'loading') {
    return <p className="py-16 text-center text-lg font-bold text-muted">Ouverture de l’administration…</p>
  }

  if (lists.status === 'error' || !isAdminSession(lists.interviewers, settings.interviewer)) {
    const message =
      lists.status === 'error'
        ? lists.message || 'Listes indisponibles.'
        : 'L’administration est réservée à un enquêteur marqué Admin, sur un appareil déjà autorisé pour lui.'
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Administration</h1>
        <p className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">{message}</p>
        <Link to="/reglages" className={buttonClass('secondary')}>
          Ouvrir les réglages
        </Link>
      </div>
    )
  }

  const hidden = lists.interviewers.some((person) => person.devices === null)
  if (hidden) {
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Administration</h1>
        <p className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">
          Le script ne renvoie pas les identifiants. Mettez à jour le script du tableur, puis redéployez-le.
        </p>
      </div>
    )
  }

  async function apply(interviewer: string, action: 'add' | 'remove', target: string) {
    if (!settings || busy) return
    setBusy(`${action}:${interviewer}:${target}`)
    setNotice(null)
    try {
      const next = await fetchSheetLists(settings.adminEndpoint, {
        device: deviceId,
        who: settings.interviewer,
        action,
        interviewer,
        target,
      })
      publishLists(next)
      if (action === 'add') setDrafts((current) => ({ ...current, [interviewer]: '' }))
      setConfirmKey(null)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Modification impossible.')
    } finally {
      setBusy(null)
    }
  }

  async function createPerson() {
    if (!settings || busy) return
    const name = personName.trim().slice(0, 120)
    if (!name) {
      setNotice('Indiquez le prénom et le nom.')
      return
    }
    if (lists.interviewers.some((person) => fold(person.name) === fold(name))) {
      setNotice('Cet enquêteur est déjà dans la liste.')
      return
    }
    const phone = normalizePhone(personPhone)
    if (phone === null) {
      setNotice('Numéro illisible.')
      return
    }
    const email = normalizeEmail(personEmail)
    if (email === null) {
      setNotice('Adresse mail illisible.')
      return
    }
    setBusy('create')
    setNotice(null)
    try {
      const next = await fetchSheetLists(settings.adminEndpoint, {
        device: deviceId,
        who: settings.interviewer,
        action: 'create',
        interviewer: name,
        phone: phone || undefined,
        email: email || undefined,
      })
      publishLists(next)
      const created = next.interviewers.find((person) => fold(person.name) === fold(name))
      if (!created) {
        throw new Error('Le script n’a pas ajouté l’enquêteur. Mettez à jour le script du tableur, puis redéployez-le.')
      }
      if (email && created.email !== email) {
        setNotice('L’enquêteur est ajouté. L’adresse mail n’a pas été enregistrée. Mettez à jour le script du tableur, puis redéployez-le.')
      }
      if (scannedId) {
        try {
          const added = await fetchSheetLists(settings.adminEndpoint, {
            device: deviceId,
            who: settings.interviewer,
            action: 'add',
            interviewer: name,
            target: scannedId,
          })
          publishLists(added)
        } catch (error) {
          setPersonName('')
          setPersonPhone('')
          setPersonEmail('')
          setScannedId(null)
          const detail = error instanceof Error ? error.message : ''
          throw new Error(detail ? `L’enquêteur est ajouté. L’identifiant n’a pas été enregistré. ${detail}` : 'L’enquêteur est ajouté. Relisez le QR-code sur sa fiche.')
        }
      }
      setPersonName('')
      setPersonPhone('')
      setPersonEmail('')
      setScannedId(null)
      setConfirmKey(null)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Ajout impossible.')
    } finally {
      setBusy(null)
    }
  }

  function acceptScan(raw: string) {
    const target = scanFor
    setScanFor(null)
    const id = normalizeDeviceId(raw.trim())
    if (!target || !id) {
      setNotice('Ce QR-code ne contient pas un identifiant d’appareil.')
      return
    }
    if (lists.interviewers.some((person) => person.devices?.includes(id))) {
      setNotice('Cet identifiant est déjà autorisé.')
      return
    }
    if (target === 'create') {
      setScannedId(id)
      setNotice(null)
      nameRef.current?.focus()
      return
    }
    void apply(target, 'add', id)
  }

  function add(interviewer: string) {
    const target = normalizeDeviceId(drafts[interviewer] ?? '')
    if (!target) {
      setNotice('Identifiant illisible. Collez un seul identifiant.')
      return
    }
    const person = lists.interviewers.find((item) => item.name === interviewer)
    if (person?.devices?.includes(target)) {
      setNotice('Cet identifiant est déjà autorisé pour cet enquêteur.')
      return
    }
    void apply(interviewer, 'add', target)
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Administration</h1>
        <div className="mt-3 flex gap-1" role="tablist" aria-label="Administration">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'enqueteurs'}
            onClick={() => setTab('enqueteurs')}
            className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-sm font-bold ${
              tab === 'enqueteurs' ? 'bg-pine text-paper' : 'text-muted hover:bg-mist hover:text-ink'
            }`}
          >
            Enquêteurs
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'courrier'}
            onClick={() => setTab('courrier')}
            className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-center text-sm font-bold ${
              tab === 'courrier' ? 'bg-pine text-paper' : 'text-muted hover:bg-mist hover:text-ink'
            }`}
          >
            projet de courrier
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'tirage'}
            onClick={() => setTab('tirage')}
            className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-center text-sm font-bold leading-tight ${
              tab === 'tirage' ? 'bg-pine text-paper' : 'text-muted hover:bg-mist hover:text-ink'
            }`}
          >
            Tirage au sort
          </button>
        </div>
      </div>

      {tab === 'tirage' ? <DrawPanel /> : null}

      {tab === 'courrier' ? (
        <section className="grid gap-3" role="tabpanel">
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
            Demande de listes électorales à adresser à la préfecture du Doubs
          </h2>
          <LetterDraft />
        </section>
      ) : null}

      {tab === 'enqueteurs' ? (
        <p className="text-base leading-relaxed text-muted">
          Lisez le QR-code d’un appareil, ou collez son identifiant. Une cellule vide n’autorise aucun appareil.
        </p>
      ) : null}

      {tab === 'enqueteurs' && notice ? (
        <p className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold leading-relaxed text-clay">{notice}</p>
      ) : null}

      {tab === 'enqueteurs' ? (
      <>
      <section className="grid gap-2 rounded-2xl border border-line bg-card px-3 py-3">
        <h2 className="font-extrabold">Nouvel enquêteur</h2>
        <button
          type="button"
          className="min-h-11 rounded-xl text-left text-base font-bold text-leaf disabled:opacity-45"
          disabled={busy !== null}
          onClick={() => {
            setNotice(null)
            setScanFor('create')
          }}
        >
          Lire un QR-code
        </button>
        {scannedId ? (
          <p className="break-all font-mono text-xs leading-relaxed text-muted">
            Identifiant lu : {scannedId}. Indiquez le prénom et le nom, puis enregistrez.
          </p>
        ) : null}
        <input
          ref={nameRef}
          value={personName}
          maxLength={120}
          aria-label="Prénom Nom"
          autoCapitalize="words"
          placeholder="Prénom Nom"
          onChange={(event) => setPersonName(event.target.value)}
          className={`min-h-11 rounded-xl px-3 text-base outline-none focus:border-leaf ${fieldClass(Boolean(personName.trim()), false)}`}
        />
        <input
          value={personPhone}
          maxLength={40}
          aria-label="Numéro de téléphone"
          inputMode="tel"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Numéro de téléphone, facultatif"
          onChange={(event) => setPersonPhone(event.target.value)}
          className={`min-h-11 rounded-xl px-3 text-base outline-none focus:border-leaf ${fieldClass(Boolean(personPhone.trim()), true)}`}
        />
        <input
          value={personEmail}
          maxLength={120}
          type="email"
          inputMode="email"
          aria-label="Adresse mail"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Adresse mail, facultative"
          onChange={(event) => setPersonEmail(event.target.value)}
          className={`min-h-11 rounded-xl px-3 text-base outline-none focus:border-leaf ${fieldClass(Boolean(personEmail.trim()), true)}`}
        />
        <button
          type="button"
          className="min-h-11 rounded-xl text-base font-bold text-leaf disabled:opacity-45"
          disabled={busy !== null}
          onClick={() => void createPerson()}
        >
          {busy === 'create' ? '…' : 'Ajouter l’enquêteur'}
        </button>
      </section>

      <div className="grid gap-2">
        {lists.interviewers.map((person) => (
          <section key={person.name} className="grid gap-2 rounded-2xl border border-line bg-card px-3 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-extrabold">{person.name}</h2>
              {person.admin ? <p className="text-xs font-bold uppercase tracking-wide text-leaf">Admin</p> : null}
            </div>
            {person.phone ? <p className="text-sm font-semibold text-muted">{person.phone}</p> : null}
            {person.email ? <p className="break-all text-sm font-semibold text-muted">{person.email}</p> : null}
            {person.devices?.length ? (
              <ul className="grid">
                {person.devices.map((id) => {
                  const key = `${person.name}:${id}`
                  const confirming = confirmKey === key
                  return (
                    <li key={id} className="flex min-h-11 items-center gap-2">
                      <p className="min-w-0 flex-1 break-all font-mono text-xs leading-tight">{id}</p>
                      {confirming ? (
                        <span className="flex shrink-0 gap-3">
                          <button type="button" className="text-sm font-bold text-muted" onClick={() => setConfirmKey(null)}>
                            Annuler
                          </button>
                          <button
                            type="button"
                            className="text-sm font-bold text-danger"
                            disabled={busy !== null}
                            onClick={() => void apply(person.name, 'remove', id)}
                          >
                            Retirer
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="shrink-0 text-sm font-bold text-danger"
                          disabled={busy !== null}
                          onClick={() => {
                            setNotice(null)
                            setConfirmKey(key)
                          }}
                        >
                          Retirer
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                aria-label={`Lire un QR-code pour ${person.name}`}
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-line text-ink disabled:opacity-45"
                disabled={busy !== null}
                onClick={() => {
                  setNotice(null)
                  setScanFor(person.name)
                }}
              >
                <QrIcon />
              </button>
              <input
                value={drafts[person.name] ?? ''}
                maxLength={80}
                aria-label={`Ajouter un identifiant pour ${person.name}`}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Ajouter un identifiant"
                onChange={(event) => setDrafts((current) => ({ ...current, [person.name]: event.target.value }))}
                className={`min-h-11 min-w-0 flex-1 rounded-xl px-3 font-mono text-sm outline-none focus:border-leaf ${fieldClass(Boolean((drafts[person.name] ?? '').trim()), false)}`}
              />
              <button
                type="button"
                className="shrink-0 rounded-xl px-3 text-sm font-bold text-leaf disabled:opacity-45"
                disabled={busy !== null}
                onClick={() => add(person.name)}
              >
                {busy === `add:${person.name}:${normalizeDeviceId(drafts[person.name] ?? '') ?? ''}` ? '…' : 'Ajouter'}
              </button>
            </div>
          </section>
        ))}
      </div>
      </>
      ) : null}
      {tab === 'enqueteurs' && scanFor ? (
        <Suspense fallback={<p className="fixed inset-x-0 bottom-4 z-30 text-center text-sm font-bold text-paper">Ouverture de l’appareil photo…</p>}>
          <QrScanner onResult={acceptScan} onClose={() => setScanFor(null)} />
        </Suspense>
      ) : null}
    </div>
  )
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
      <path
        fill="currentColor"
        d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10-2h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm0 4h2v2h-2v-2z"
      />
    </svg>
  )
}
