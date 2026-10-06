import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

/** Внутренний отступ страницы; ширина задаётся в Layout (max-w-6xl). */
export function PageShell({ children, className = 'space-y-6' }: Props) {
  return <div className={`w-full min-w-0 pb-8 ${className}`.trim()}>{children}</div>
}
