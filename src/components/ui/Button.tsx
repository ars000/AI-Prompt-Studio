import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-zinc-900 hover:bg-primary-hover font-medium shadow-sm disabled:opacity-50',
  secondary:
    'bg-surface-elevated border border-border text-text hover:border-primary/50 disabled:opacity-50',
  ghost: 'text-text-muted hover:text-text hover:bg-subtle-hover disabled:opacity-50',
  danger: 'bg-red-600/90 text-white hover:bg-red-600 disabled:opacity-50',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
