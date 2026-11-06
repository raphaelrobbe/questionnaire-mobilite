export function formatWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}
