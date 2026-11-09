import { Navigate } from '@remix-run/react'
import type { MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => [{ title: 'Accueil · Enquête mobilité' }]

export default function FileRoute() {
  return <Navigate to="/" replace />
}
