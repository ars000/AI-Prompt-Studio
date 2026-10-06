import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { substituteVariables } from '../../lib/variables'
import { usePromptStore } from '../../stores/promptStore'
import { VariablesPanel } from './VariablesPanel'
import { VersionsPanel } from './VersionsPanel'
import { TestPanel } from '../test-run/TestPanel'
import { CodeReviewWorkspace } from './CodeReviewWorkspace'
import { CollectionsMultiSelect } from '../../components/CollectionsMultiSelect'
import { OptimizerInsightPanel } from './OptimizerInsightPanel'
import { defaultRefineRequest } from '../../lib/optimizerRefine'
import type { PromptEditorNavigateState } from '../optimizer/OptimizerPage'
import type { PromptKind } from '../../schemas'
import { PageShell } from '../../components/layout/PageShell'
import {
  IMAGE_GENERATORS_ENGLISH_NOTE,
  variableDefaultsMismatchBody,
} from '../../lib/promptLanguage'
import { ImagePromptGeneratorBar } from './ImagePromptGeneratorBar'

const fieldControlClass =
  'rounded-lg border border-border bg-surface-elevated px-3 py-2 h-[42px]'

type Tab = 'review' | 'editor' | 'variables' | 'versions' | 'test'

export function PromptEditorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const prompt = usePromptStore((s) => (id ? s.prompts[id] : undefined))
  const collections = usePromptStore((s) => s.collections)
  const updatePromptDraft = usePromptStore((s) => s.updatePromptDraft)
  const saveVersion = usePromptStore((s) => s.saveVersion)
  const restoreVersion = usePromptStore((s) => s.restoreVersion)
  const getVersionsForPrompt = usePromptStore((s) => s.getVersionsForPrompt)

  const [tab, setTab] = useState<Tab>('editor')
  const [versionMessage, setVersionMessage] = useState('')
  const [varValues, setVarValues] = useState<Record<string, string>>({})

  const versions = useMemo(
    () => (id ? getVersionsForPrompt(id) : []),
    [id, getVersionsForPrompt, prompt?.updatedAt],
  )

  const [showOptimizerBanner, setShowOptimizerBanner] = useState(false)

  useEffect(() => {
    if (!prompt) return
    const initial: Record<string, string> = {}
    for (const v of prompt.variables) {
      initial[v.name] = v.defaultValue
    }
    setVarValues(initial)

    const st = location.state as PromptEditorNavigateState | null
    if (st?.fromOptimizer && st.initialTab) {
      setTab(st.initialTab)
      setShowOptimizerBanner(true)
      navigate(location.pathname, { replace: true, state: {} })
      return
    }
    setShowOptimizerBanner(false)
    setTab(prompt.kind === 'code' ? 'review' : 'editor')
  }, [prompt?.id, location.pathname, location.state, navigate])

  const handleSaveVersion = useCallback(() => {
    if (!id) return
    saveVersion(id, versionMessage || 'Saved')
    setVersionMessage('')
    toast.success('Версия сохранена')
  }, [id, saveVersion, versionMessage])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveVersion()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSaveVersion, tab])

  if (!id || !prompt) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Промпт не найден.</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block">
          ← Библиотека
        </Link>
      </div>
    )
  }

  const preview = substituteVariables(
    prompt.body,
    Object.fromEntries(
      prompt.variables.map((v) => [v.name, varValues[v.name] ?? v.defaultValue]),
    ),
  )

  const isCodeWorkflow = prompt.kind === 'code'
  const imageVarLanguageMismatch =
    prompt.kind === 'image' && variableDefaultsMismatchBody(prompt.body, prompt.variables)

  const tabs: { id: Tab; label: string }[] = [
    ...(isCodeWorkflow ? [{ id: 'review' as const, label: 'Ревью' }] : []),
    { id: 'editor', label: isCodeWorkflow ? 'Шаблон промпта' : 'Редактор' },
    { id: 'variables', label: 'Переменные' },
    { id: 'versions', label: 'Версии' },
    { id: 'test', label: 'Тест' },
  ]

  return (
    <PageShell className="space-y-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="text-sm text-text-muted hover:text-primary">
          ← Библиотека
        </Link>
        <Button
          variant="secondary"
          className="text-xs py-1.5"
          onClick={() =>
            navigate('/optimizer', {
              state: {
                rawRequest: defaultRefineRequest(prompt.title),
                refineTitle: prompt.title,
                kindHint: prompt.kind,
                refineBody: prompt.body,
                refineVariables: prompt.variables,
                fromPromptId: id,
              },
            })
          }
        >
          Улучшить в оптимизаторе
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Input
          label="Название"
          value={prompt.title}
          onChange={(e) => updatePromptDraft(id, { title: e.target.value })}
          className="flex-1 min-w-[200px] h-[42px]"
        />
        <label className="flex flex-col gap-1.5 text-sm min-w-[120px]">
          <span className="text-text-muted leading-tight">Тип</span>
          <select
            className={fieldControlClass}
            value={prompt.kind}
            onChange={(e) =>
              updatePromptDraft(id, { kind: e.target.value as PromptKind })
            }
          >
            <option value="text">Текст</option>
            <option value="code">Код</option>
            <option value="image">Изображение</option>
          </select>
        </label>
        <CollectionsMultiSelect
          className="min-w-[180px] max-w-[240px]"
          collections={Object.values(collections)}
          value={prompt.collectionIds}
          onChange={(collectionIds) => updatePromptDraft(id, { collectionIds })}
        />
      </div>

      <Input
        label="Теги (через запятую)"
        value={prompt.tags.join(', ')}
        onChange={(e) =>
          updatePromptDraft(id, {
            tags: e.target.value
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
          })
        }
      />

      {prompt.optimizerMeta && <OptimizerInsightPanel meta={prompt.optimizerMeta} />}

      {showOptimizerBanner && (
        <div className="rounded-lg border border-primary/40 bg-primary-muted/40 px-4 py-3 text-sm flex flex-wrap justify-between gap-2">
          <span>
            Промпт из оптимизатора сохранён. Шаблон на вкладке «{isCodeWorkflow ? 'Шаблон промпта' : 'Редактор'}»,
            проверка — на «Тест».
          </span>
          <button
            type="button"
            className="text-primary text-xs hover:underline"
            onClick={() => setShowOptimizerBanner(false)}
          >
            Скрыть
          </button>
        </div>
      )}

      <div className="-mx-1 overflow-x-auto">
        <div className="flex min-w-min gap-1 border-b border-border px-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 sm:px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-text-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'review' && isCodeWorkflow && (
        <CodeReviewWorkspace
          variables={prompt.variables}
          values={varValues}
          onValuesChange={setVarValues}
        />
      )}

      {prompt.kind === 'image' && tab === 'editor' && (
        <div className="text-xs rounded-lg border border-border bg-surface p-3 text-text-muted">
          {IMAGE_GENERATORS_ENGLISH_NOTE}
        </div>
      )}

      {imageVarLanguageMismatch && (tab === 'editor' || tab === 'variables') && (
        <div className="text-xs rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-text">
          Значения переменных не совпадают по языку с текстом в редакторе — приведите «Значение по
          умолчанию» к тому же языку, что и шаблон, или перегенерируйте промпт в оптимизаторе.
        </div>
      )}

      {tab === 'editor' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea
            label={isCodeWorkflow ? 'Шаблон промпта (с {{переменными}})' : 'Тело промпта'}
            value={prompt.body}
            onChange={(e) => updatePromptDraft(id, { body: e.target.value })}
            className="min-h-[280px]"
            spellCheck={prompt.kind === 'text'}
          />
          <div>
            <div className="text-sm text-text-muted mb-1.5">Preview подстановки</div>
            <pre className="rounded-lg border border-border bg-surface p-3 text-sm font-mono whitespace-pre-wrap min-h-[280px] max-h-[480px] overflow-auto">
              {preview}
            </pre>
            {prompt.kind === 'image' && (
              <ImagePromptGeneratorBar resolvedPrompt={preview} className="mt-3" />
            )}
          </div>
        </div>
      )}

      {tab === 'variables' && (
        <VariablesPanel
          variables={prompt.variables}
          values={varValues}
          onValuesChange={setVarValues}
          onVariablesChange={(variables) => updatePromptDraft(id, { variables })}
        />
      )}

      {tab === 'versions' && (
        <VersionsPanel
          versions={versions}
          currentBody={prompt.body}
          onRestore={(versionId) => {
            restoreVersion(id, versionId)
            toast.success('Версия восстановлена')
          }}
        />
      )}

      {tab === 'test' && <TestPanel prompt={prompt} variableValues={varValues} />}

      <div className="flex flex-wrap gap-2 items-end border-t border-border pt-4">
        <Input
          label="Сообщение версии"
          value={versionMessage}
          onChange={(e) => setVersionMessage(e.target.value)}
          placeholder="Что изменилось?"
          className="flex-1 min-w-[200px]"
        />
        <Button variant="secondary" onClick={() => toast.success('Черновик сохранён локально')}>
          Черновик OK
        </Button>
        <Button onClick={handleSaveVersion}>Сохранить версию</Button>
      </div>
    </PageShell>
  )
}
