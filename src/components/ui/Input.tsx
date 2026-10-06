import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string }

export function Input({ label, className = '', id, ...props }: Props) {
  const inputId = id ?? label?.replace(/\s+/g, '-').toLowerCase()
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && (
        <span className="text-text-muted leading-tight">{label}</span>
      )}
      <input
        id={inputId}
        className={`rounded-lg border border-border bg-surface-elevated px-3 py-2 text-text placeholder:text-text-muted/60 focus:border-primary ${className}`}
        {...props}
      />
    </label>
  )
}
