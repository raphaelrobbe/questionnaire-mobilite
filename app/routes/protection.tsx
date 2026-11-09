import type { MetaFunction } from '@remix-run/node'
import { PrivacyScreen } from '~/components/PrivacyScreen'

export const meta: MetaFunction = () => [
  { title: 'Protection des données · Enquête mobilité' },
  { name: 'robots', content: 'noindex, nofollow' },
]

export default function Protection() {
  return <PrivacyScreen />
}
