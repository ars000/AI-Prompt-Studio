import { useEffect, useId, useRef, useState } from 'react'
import type { Collection } from '../schemas'

type Props = {
  collections: Collection[]
  value: string[]
  onChange: (ids: string[]) => void
  className?: string
}

const controlClass =
  'app-select-trigger rounded-lg border border-border bg-surface-elevated px-3 py-2 h-[42px] w-full text-left text-sm text-text truncate'

export function CollectionsMultiSelect({
  collections,
  value,
  onChange,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selectedNames = value
    .map((id) => collections.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[]

  const summary =
    selectedNames.length === 0
      ? 'Не выбрано'
      : selectedNames.length <= 2
        ? selectedNames.join(', ')
        : `${selectedNames.length} коллекции`

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div ref={rootRef} className={`relative flex flex-col gap-1.5 text-sm min-w-[180px] ${className}`}>
      <span className="text-text-muted leading-tight">Коллекции</span>
      <button
        type="button"
        className={controlClass}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        {summary}
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-auto rounded-lg border border-border bg-surface-elevated py-1 shadow-xl"
        >
          {collections.length === 0 ? (
            <p className="px-3 py-2 text-xs text-text-muted">Коллекций пока нет</p>
          ) : (
            collections.map((c) => {
              const checked = value.includes(c.id)
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                  />
                  <span className="truncate">{c.name}</span>
                </label>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
