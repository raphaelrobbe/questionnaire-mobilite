import type { MetaFunction } from '@remix-run/node'
import { SettingsScreen } from '~/components/SettingsScreen'

export const meta: MetaFunction = () => [{ title: 'Réglages · Enquête mobilité' }]

export default function Reglages() {
  return <SettingsScreen />
}
