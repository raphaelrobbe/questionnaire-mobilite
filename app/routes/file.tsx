import { Navigate } from '@remix-run/react'
import { pageTitle } from '~/common/meta'

export const meta = pageTitle('Accueil · Enquête mobilité Haut-Doubs')

export default function FileRoute() {
  return <Navigate to="/" replace />
}
