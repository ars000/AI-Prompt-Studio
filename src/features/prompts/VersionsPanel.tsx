import * as Diff from 'diff'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import type { PromptVersion } from '../../schemas'

type Props = {
  versions: PromptVersion[]
  currentBody: string
  onRestore: (versionId: string) => void
}

export function VersionsPanel({ versions, currentBody, onRestore }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(versions[0]?.id ?? null)
  const selected = versions.find((v) => v.id === selectedId)

  const diffHtml = useMemo(() => {
    if (!selected) return null
    const parts = Diff.diffLines(selected.body, currentBody)
    return parts.map((part, i) => (
      <span
        key={i}
        className={
          part.added
            ? 'bg-green-500/20'
            : part.removed
              ? 'bg-red-500/20 line-through'
              : ''
        }
      >
        {part.value}
      </span>
    ))
  }, [selected, currentBody])

  if (versions.length === 0) {
    return <p className="text-sm text-text-muted">Нет сохранённых версий.</p>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <ul className="space-y-1 max-h-[400px] overflow-auto">
        {versions.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => setSelectedId(v.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                selectedId === v.id ? 'bg-primary-muted text-primary' : 'hover:bg-subtle-hover'
              }`}
            >
              <div className="font-medium">{v.label}</div>
              <div className="text-xs text-text-muted truncate">{v.message}</div>
              <div className="text-xs text-text-muted">
                {new Date(v.createdAt).toLocaleString('ru-RU')}
              </div>
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-3 min-w-0">
        {selected && (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium">{selected.label}</span>
              <Button variant="secondary" className="text-xs py-1" onClick={() => onRestore(selected.id)}>
                Восстановить как новую версию
              </Button>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Diff: выбранная версия → текущий черновик</div>
              <pre className="rounded-lg border border-border bg-surface p-3 text-xs font-mono whitespace-pre-wrap max-h-[320px] overflow-auto">
                {diffHtml}
              </pre>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Тело версии</div>
              <pre className="rounded-lg border border-border bg-surface p-3 text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-auto">
                {selected.body}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
