import { toast } from 'sonner'
import { Button } from './ui/Button'

type Props = {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minRows?: number
}

function countLines(text: string) {
  if (!text) return 0
  return text.split('\n').length
}

export function CodeField({ label, value, onChange, placeholder, minRows = 14 }: Props) {
  const lines = countLines(value)
  const chars = value.length

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChange(text)
      toast.success('Код вставлен из буфера')
    } catch {
      toast.error('Не удалось прочитать буфер обмена')
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm min-h-0">
      {label && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-text-muted">{label}</span>
          <span className="text-xs text-text-muted font-mono">
            {lines} строк · {chars} симв.
          </span>
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        rows={minRows}
        className="rounded-lg border border-border bg-[#0d0d0f] px-3 py-2 text-text font-mono text-xs leading-relaxed min-h-[280px] resize-y focus:border-primary tab-size-2"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" className="text-xs py-1.5" onClick={() => void paste()}>
          Вставить из буфера
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-xs py-1.5"
          onClick={() => onChange('')}
          disabled={!value}
        >
          Очистить
        </Button>
      </div>
    </div>
  )
}
