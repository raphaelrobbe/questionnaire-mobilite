import { Link } from '@remix-run/react'
import { pageTitle } from '~/common/meta'
import { buttonClass } from '~/components/Button'

export const meta = pageTitle('Page introuvable · Enquête mobilité Haut-Doubs')

export default function NotFound() {
  return (
    <div className="grid gap-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Cette page n’existe pas</h1>
      <p className="text-muted">L’accueil et les réglages sont dans le menu.</p>
      <Link to="/" className={buttonClass('primary')}>
        Retour à l’accueil
      </Link>
    </div>
  )
}
