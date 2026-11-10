import { HomeScreen } from '~/components/HomeScreen'
import { pageTitle } from '~/common/meta'

export const meta = pageTitle('Accueil · Enquête mobilité Haut-Doubs')

export default function Index() {
  return <HomeScreen />
}
