import type { TextareaHTMLAttributes } from 'react'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }

export function Textarea({ label, className = '', ...props }: Props) {
  return (
    <label className="flex flex-col gap-1.5 text-sm flex-1 min-h-0">
      {label && <span className="text-text-muted">{label}</span>}
      <textarea
        className={`rounded-lg border border-border bg-surface-elevated px-3 py-2 text-text font-mono text-sm min-h-[120px] resize-y focus:border-primary ${className}`}
        {...props}
      />
    </label>
  )
}
