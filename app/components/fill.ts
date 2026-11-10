export type ChoiceRule = 'one' | 'many' | 'free' | 'free-one'
export type ChoiceFill = 'needed' | 'free' | 'plain'

/** Obligatoire vide : rose. Facultatif vide : vert. Une fois le choix fait, le fond spécial disparaît. */
export function choiceFill(rule: ChoiceRule, chosen: boolean): ChoiceFill {
  if (rule === 'free-one') return chosen ? 'plain' : 'free'
  if (rule === 'free' || (chosen && rule === 'many')) return 'free'
  if (!chosen) return 'needed'
  return 'plain'
}

export function idleClass(fill: ChoiceFill): string {
  if (fill === 'needed') return 'border border-line bg-rose-bg'
  if (fill === 'free') return 'border border-line bg-mist'
  return 'border border-line bg-paper'
}

export function fieldClass(filled: boolean, optional: boolean): string {
  if (filled) return idleClass('plain')
  return idleClass(optional ? 'free' : 'needed')
}

export function choiceClass(selected: boolean, rule: ChoiceRule, groupChosen: boolean): string {
  if (selected) return 'border border-pine bg-pine text-paper'
  return `${idleClass(choiceFill(rule, groupChosen))} text-ink`
}
