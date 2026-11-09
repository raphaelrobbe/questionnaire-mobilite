export type RevealBox = {
  top: number
  height: number
  viewTop: number
  viewBottom: number
  scrollY: number
  maxScroll: number
  below: number
}

/** Null si le bloc est déjà visible. Sinon le haut, ou le bas de page s’il tient entier. */
export function revealTarget(box: RevealBox): number | null {
  const slack = 8
  if (box.top + box.height <= box.viewBottom + slack) return null
  const room = box.viewBottom - box.viewTop
  if (box.height <= room) {
    if (box.below <= room) return Math.max(0, box.maxScroll)
    return Math.max(0, Math.min(box.maxScroll, box.scrollY + box.top + box.height - box.viewBottom))
  }
  return Math.max(0, Math.min(box.maxScroll, box.scrollY + box.top - box.viewTop - slack))
}
