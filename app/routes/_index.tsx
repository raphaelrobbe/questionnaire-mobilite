import type { MetaFunction } from '@remix-run/node'
import { HomeScreen } from '~/components/HomeScreen'

export const meta: MetaFunction = () => [{ title: 'Accueil · Enquête mobilité' }]

export default function Index() {
  return <HomeScreen />
}
