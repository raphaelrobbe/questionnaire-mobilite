import { InterviewerGuide } from '~/components/InterviewerGuide'
import { pageTitle } from '~/common/meta'

export const meta = pageTitle('Guide de l’enquêteur · Enquête mobilité Haut-Doubs', [
  { name: 'robots', content: 'noindex, nofollow' },
])

export default function Enqueteur() {
  return <InterviewerGuide />
}
