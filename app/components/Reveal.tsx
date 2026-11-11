import { useEffect, useRef, type ReactNode } from 'react'
import { revealTarget } from '~/common/revealScroll'

let pending: HTMLElement[] = []
let queued = false
let skipFrames = 0

/** Ignore les blocs déjà présents au changement d’écran. */
export function holdRevealScroll() {
  skipFrames = 1
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      skipFrames = 0
    })
  })
}

function queueReveal(node: HTMLElement) {
  pending.push(node)
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    const nodes = pending.splice(0).filter((item) => item.isConnected)
    if (skipFrames > 0) return
    const topBar = document.querySelector('[data-top-banner]')?.getBoundingClientRect().height ?? 0
    const dock = document.querySelector('[data-dock]')?.getBoundingClientRect().height ?? 0
    const viewTop = topBar
    const viewBottom = window.innerHeight - dock
    const hidden = nodes
      .map((item) => ({ item, box: item.getBoundingClientRect() }))
      .filter(({ box }) => box.bottom > viewBottom + 8)
      .sort((left, right) => left.box.top - right.box.top)[0]
    if (!hidden) return
    const top = revealTarget({
      top: hidden.box.top,
      height: hidden.box.height,
      viewTop,
      viewBottom,
      scrollY: window.scrollY,
      maxScroll: document.documentElement.scrollHeight - window.innerHeight,
      below: document.documentElement.scrollHeight - (window.scrollY + hidden.box.bottom),
    })
    if (top === null) return
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    window.scrollTo({ top, behavior })
  })
}

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) queueReveal(ref.current)
  }, [])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
