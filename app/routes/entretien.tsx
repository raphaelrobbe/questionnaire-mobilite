import type { MetaFunction } from '@remix-run/node'
import { Interview } from '~/components/Interview'

export const meta: MetaFunction = () => [{ title: 'Entretien · Enquête mobilité' }]

export default function Entretien() {
  return <Interview />
}
