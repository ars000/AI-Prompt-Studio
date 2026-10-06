import { useState } from 'react'
import type { OptimizerMeta } from '../../schemas'

type Props = {
  meta: OptimizerMeta
}

export function OptimizerInsightPanel({ meta }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <section className="rounded-xl border border-primary/25 bg-primary-muted/30 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Контекст оптимизатора</span>
        <span className="text-text-muted text-xs">
          {new Date(meta.optimizedAt).toLocaleString('ru-RU')}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 text-sm border-t border-primary/20">
          <div>
            <div className="text-text-muted text-xs mb-1">Исходный запрос</div>
            <p className="text-text whitespace-pre-wrap">{meta.rawRequest}</p>
          </div>
          <div>
            <div className="text-text-muted text-xs mb-1">Что улучшено</div>
            <p className="text-text-muted">{meta.explanation}</p>
          </div>
          {meta.tips.length > 0 && (
            <ul className="text-text-muted list-disc pl-5 space-y-1">
              {meta.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
