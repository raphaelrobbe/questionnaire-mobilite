import type { MetaFunction } from '@remix-run/node'
import { QueueScreen } from '~/components/QueueScreen'

export const meta: MetaFunction = () => [{ title: 'File d’envoi · Enquête mobilité' }]

export default function FileRoute() {
  return <QueueScreen />
}
