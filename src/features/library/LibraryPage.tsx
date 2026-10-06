import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { usePromptStore } from '../../stores/promptStore'
import { PROMPT_TEMPLATES } from '../../lib/templates'
import type { PromptKind } from '../../schemas'
import { GuideBanner } from '../../components/GuideBanner'
import { PageShell } from '../../components/layout/PageShell'

const kindLabels: Record<PromptKind, string> = {
  text: 'Текст',
  code: 'Код',
  image: 'Изображение',
}

export function LibraryPage() {
  const navigate = useNavigate()
  const prompts = usePromptStore((s) => s.prompts)
  const collections = usePromptStore((s) => s.collections)
  const versions = usePromptStore((s) => s.versions)
  const createPrompt = usePromptStore((s) => s.createPrompt)
  const createFromTemplate = usePromptStore((s) => s.createFromTemplate)
  const duplicatePrompt = usePromptStore((s) => s.duplicatePrompt)
  const deletePrompt = usePromptStore((s) => s.deletePrompt)

  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<PromptKind | 'all'>('all')
  const [collectionFilter, setCollectionFilter] = useState<string>('all')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return Object.values(prompts)
      .filter((p) => {
        if (kindFilter !== 'all' && p.kind !== kindFilter) return false
        if (collectionFilter !== 'all' && !p.collectionIds.includes(collectionFilter)) return false
        if (!q) return true
        const hay = [p.title, p.body, ...p.tags].join(' ').toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [prompts, search, kindFilter, collectionFilter])

  const versionCount = (promptId: string) =>
    Object.values(versions).filter((v) => v.promptId === promptId).length

  const handleNewBlank = () => {
    const id = createPrompt({
      title: 'Новый промпт',
      kind: 'text',
      body: 'Привет! Ответь на {{question}}',
      variables: [
        { name: 'question', description: '', defaultValue: 'вопрос пользователя' },
      ],
      tags: [],
    })
    navigate(`/prompts/${id}`)
  }

  return (
    <PageShell>
      <GuideBanner />
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Библиотека промптов</h1>
          <p className="text-text-muted text-sm mt-1">
            Создавайте, версионируйте и тестируйте промпты с переменными.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/optimizer">
            <Button variant="secondary">Оптимизатор</Button>
          </Link>
          <Button variant="secondary" onClick={() => setTemplateOpen(true)}>
            Из шаблона
          </Button>
          <Button onClick={handleNewBlank}>Новый промпт</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          label="Поиск"
          placeholder="Название, тег, текст…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-muted">Тип</span>
          <select
            className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as PromptKind | 'all')}
          >
            <option value="all">Все</option>
            <option value="text">Текст</option>
            <option value="code">Код</option>
            <option value="image">Изображение</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-muted">Коллекция</span>
          <select
            className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
          >
            <option value="all">Все</option>
            {Object.values(collections).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-text-muted">
          Промптов не найдено. Создайте новый или выберите шаблон.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-border bg-surface-elevated/50 p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <Link to={`/prompts/${p.id}`} className="font-medium hover:text-primary">
                  {p.title}
                </Link>
                <Badge>{kindLabels[p.kind]}</Badge>
              </div>
              <p className="text-sm text-text-muted line-clamp-2 font-mono">{p.body}</p>
              <div className="flex flex-wrap gap-1">
                {p.tags.map((t) => (
                  <span key={t} className="text-xs text-text-muted">
                    #{t}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted mt-auto">
                <span>{versionCount(p.id)} версий</span>
                <span>{new Date(p.updatedAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" className="flex-1 text-xs py-1.5" onClick={() => navigate(`/prompts/${p.id}`)}>
                  Открыть
                </Button>
                <Button
                  variant="ghost"
                  className="text-xs py-1.5"
                  onClick={() => {
                    const id = duplicatePrompt(p.id)
                    if (id) navigate(`/prompts/${id}`)
                  }}
                >
                  Копия
                </Button>
                <Button variant="ghost" className="text-xs py-1.5 text-red-400" onClick={() => setDeleteId(p.id)}>
                  Удалить
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={templateOpen} title="Шаблоны" onClose={() => setTemplateOpen(false)}>
        <ul className="space-y-2 max-h-[60vh] overflow-auto">
          {PROMPT_TEMPLATES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="w-full rounded-lg border border-border px-3 py-2 text-left hover:border-primary/50"
                onClick={() => {
                  const id = createFromTemplate(t)
                  setTemplateOpen(false)
                  navigate(`/prompts/${id}`)
                }}
              >
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-text-muted">{t.tags.join(' · ')}</div>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={!!deleteId}
        title="Удалить промпт?"
        onClose={() => setDeleteId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteId) deletePrompt(deleteId)
                setDeleteId(null)
              }}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">Действие необратимо. Версии и история прогонов будут удалены.</p>
      </Modal>
    </PageShell>
  )
}
