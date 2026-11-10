import { PrivacyScreen } from '~/components/PrivacyScreen'
import { pageTitle } from '~/common/meta'

export const meta = pageTitle('Protection des données · Enquête mobilité Haut-Doubs', [
  { name: 'robots', content: 'noindex, nofollow' },
])

export default function Protection() {
  return <PrivacyScreen />
}
