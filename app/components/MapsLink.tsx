import { mapsDestination, type Answers } from '~/common/survey'
import { useSettings } from '~/hooks/useSettings'

export function MapsLink({
  answers,
  className = '',
  compact = false,
}: {
  answers: Pick<Answers, 'adresse' | 'commune'>
  className?: string
  compact?: boolean
}) {
  const settings = useSettings()
  const href = mapsDestination(answers, settings?.mapApp ?? 'google')
  if (!href) return null
  const size = compact ? 'font-bold text-leaf' : 'inline-flex min-h-11 items-center font-bold text-leaf'
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${size} ${className}`}>
      Lieu
    </a>
  )
}
