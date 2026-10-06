type Props = { children: React.ReactNode; className?: string }

export function Badge({ children, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-primary-muted px-2 py-0.5 text-xs text-primary ${className}`}
    >
      {children}
    </span>
  )
}
