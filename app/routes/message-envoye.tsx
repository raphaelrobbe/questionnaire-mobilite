import { Link } from '@remix-run/react'
import { pageTitle } from '~/common/meta'
import { buttonClass } from '~/components/Button'

export const meta = pageTitle('Message envoyé · Enquête mobilité Haut-Doubs', [
  { name: 'robots', content: 'noindex, nofollow' },
])

export default function MessageSent() {
  return (
    <div className="-mx-4 -mt-4 flex flex-1 flex-col items-center justify-center bg-pine px-5 py-16 text-center text-paper">
      <p className="text-sm font-extrabold uppercase tracking-widest text-mist">Message envoyé</p>
      <h1 className="mx-auto mt-4 max-w-sm text-4xl font-extrabold leading-tight tracking-tight">
        Nous vous répondrons à cette adresse.
      </h1>
      <Link to="/" className={buttonClass('secondary', 'mt-20 w-auto max-w-xs bg-card')}>
        Retour à l’accueil
      </Link>
    </div>
  )
}
