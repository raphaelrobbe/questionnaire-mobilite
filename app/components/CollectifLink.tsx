import { Link } from '@remix-run/react'

export function CollectifLink({ className }: { className?: string }) {
  return (
    <Link
      to="/collectif"
      prefetch="intent"
      className={className ?? 'font-extrabold text-pine underline decoration-leaf decoration-2 underline-offset-[0.2em]'}
      onClick={(event) => event.stopPropagation()}
    >
      Collectif Mobilité Haut-Doubs
    </Link>
  )
}
