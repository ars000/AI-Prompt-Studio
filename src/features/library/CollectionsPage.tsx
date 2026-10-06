import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { promptIdsInCollection } from '../../lib/collectionSync'
import { usePromptStore } from '../../stores/promptStore'
import { PageShell } from '../../components/layout/PageShell'

export function CollectionsPage() {
  const collections = usePromptStore((s) => s.collections)
  const prompts = usePromptStore((s) => s.prompts)
  const createCollection = usePromptStore((s) => s.createCollection)
  const updateCollection = usePromptStore((s) => s.updateCollection)
  const deleteCollection = usePromptStore((s) => s.deleteCollection)
  const exportCollection = usePromptStore((s) => s.exportCollection)

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const handleCreate = () => {
    if (!name.trim()) return
    createCollection(name.trim(), desc.trim())
    setName('')
    setDesc('')
  }

  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-semibold">Коллекции</h1>
        <p className="text-sm text-text-muted mt-1">Группируйте промпты для экспорта и совместной работы.</p>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <h2 className="font-medium">Новая коллекция</h2>
        <Input label="Название" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Описание" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Button onClick={handleCreate}>Создать</Button>
      </div>

      <ul className="space-y-3">
        {Object.values(collections).length === 0 && (
          <li className="text-text-muted text-sm">Коллекций пока нет.</li>
        )}
        {Object.values(collections).map((c) => {
          const memberIds = promptIdsInCollection(c.id, prompts)
          return (
          <li key={c.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h3 className="font-medium">{c.name}</h3>
                {c.description && <p className="text-sm text-text-muted">{c.description}</p>}
                <p className="text-xs text-text-muted mt-2">{memberIds.length} промптов</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="secondary"
                  className="text-xs"
                  onClick={() => {
                    setEditId(c.id)
                    setEditName(c.name)
                    setEditDesc(c.description)
                  }}
                >
                  Изменить
                </Button>
                <Button
                  variant="secondary"
                  className="text-xs"
                  onClick={() => {
                    const bundle = exportCollection(c.id)
                    if (bundle) downloadJson(bundle, `${c.name}-export.json`)
                  }}
                >
                  Экспорт JSON
                </Button>
                <Button variant="ghost" className="text-xs text-red-400" onClick={() => setDeleteId(c.id)}>
                  Удалить
                </Button>
              </div>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {memberIds.length === 0 ? (
                <li className="text-xs text-text-muted">
                  Нет промптов — назначьте коллекцию в редакторе промта.
                </li>
              ) : (
                memberIds.map((pid) => {
                  const p = prompts[pid]
                  if (!p) return null
                  return (
                    <Link
                      key={pid}
                      to={`/prompts/${pid}`}
                      className="text-xs rounded-md border border-border px-2 py-1 hover:border-primary/50"
                    >
                      {p.title}
                    </Link>
                  )
                })
              )}
            </ul>
          </li>
          )
        })}
      </ul>

      <Modal
        open={!!editId}
        title="Редактировать коллекцию"
        onClose={() => setEditId(null)}
        footer={
          <Button
            onClick={() => {
              if (editId) updateCollection(editId, { name: editName, description: editDesc })
              setEditId(null)
            }}
          >
            Сохранить
          </Button>
        }
      >
        <div className="space-y-3">
          <Input label="Название" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Input label="Описание" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={!!deleteId}
        title="Удалить коллекцию?"
        onClose={() => setDeleteId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteId) deleteCollection(deleteId)
                setDeleteId(null)
              }}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">Промпты не удаляются, только связь с коллекцией.</p>
      </Modal>
    </PageShell>
  )
}
