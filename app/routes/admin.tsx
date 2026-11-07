import type { MetaFunction } from '@remix-run/node'
import { AdminScreen } from '~/components/AdminScreen'

export const meta: MetaFunction = () => [{ title: 'Administration · Enquête mobilité' }]

export default function Admin() {
  return <AdminScreen />
}
