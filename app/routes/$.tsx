import { Link } from '@remix-run/react'
import type { MetaFunction } from '@remix-run/node'
import { buttonClass } from '~/components/Button'

export const meta: MetaFunction = () => [{ title: 'Page introuvable · Enquête mobilité' }]

export default function NotFound() {
  return (
    <div className="grid gap-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Cette page n’existe pas</h1>
      <p className="text-muted">L’entretien, la file et les réglages sont dans le menu.</p>
      <Link to="/" className={buttonClass('primary')}>
        Retour à l’accueil
      </Link>
    </div>
  )
}
