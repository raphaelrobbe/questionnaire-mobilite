import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-pine text-paper hover:bg-pine-deep',
  secondary: 'border border-line bg-card text-ink hover:bg-mist',
  ghost: 'bg-transparent text-pine hover:bg-mist',
  danger: 'border border-line bg-card text-danger hover:bg-danger-bg',
}

export function buttonClass(variant: Variant = 'primary', extra = ''): string {
  const width = /\bw-/.test(extra) ? '' : 'w-full'
  const padding = /\bpx-/.test(extra) ? '' : 'px-4'
  return [
    'inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl text-center text-base font-bold transition',
    width,
    padding,
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf',
    'disabled:cursor-not-allowed disabled:opacity-45',
    variants[variant],
    extra,
  ].join(' ')
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />
}
