import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { exportBundleSchema } from '../../schemas'
import { usePromptStore, type MergeStrategy } from '../../stores/promptStore'
import { PageShell } from '../../components/layout/PageShell'

export function ImportExportPage() {
  const exportAll = usePromptStore((s) => s.exportAll)
  const importBundle = usePromptStore((s) => s.importBundle)
  const fileRef = useRef<HTMLInputElement>(null)
  const [strategy, setStrategy] = useState<MergeStrategy>('skip')

  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    const bundle = exportAll()
    downloadJson(bundle, `ai-prompt-studio-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success('Экспорт готов')
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const json: unknown = JSON.parse(text)
      const parsed = exportBundleSchema.safeParse(json)
      if (!parsed.success) {
        toast.error('Неверный формат JSON')
        return
      }
      importBundle(parsed.data, strategy)
      toast.success('Импорт завершён')
    } catch {
      toast.error('Не удалось прочитать файл')
    }
  }

  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-semibold">Импорт / экспорт</h1>
        <p className="text-sm text-text-muted mt-1">
          Делитесь коллекциями через JSON-файл (schemaVersion 1).
        </p>
      </div>

      <section className="rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-medium">Экспорт всей библиотеки</h2>
        <p className="text-sm text-text-muted">
          Включает промпты, версии и коллекции. API-ключи не экспортируются.
        </p>
        <Button onClick={handleExport}>Скачать JSON</Button>
      </section>

      <section className="rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-medium">Импорт</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-muted">Стратегия слияния</span>
          <select
            className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as MergeStrategy)}
          >
            <option value="skip">Пропустить дубликаты по id</option>
            <option value="replace">Заменить существующие</option>
            <option value="copy">Импорт как копия (новые id)</option>
          </select>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleImport(f)
            e.target.value = ''
          }}
        />
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          Загрузить JSON
        </Button>
      </section>
    </PageShell>
  )
}
