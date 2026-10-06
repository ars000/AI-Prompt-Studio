import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { substituteVariables } from '../../lib/variables'
import { runWithFallback } from '../../services/ai/runPrompt'
import { useSettingsStore } from '../../stores/settingsStore'
import { usePromptStore } from '../../stores/promptStore'
import { ModelSelect } from '../../components/ModelSelect'
import { buildCompletionContext } from '../../lib/aiProviders/completionContext'
import { getProviderDefinition } from '../../lib/aiProviders/registry'
import type { CatalogProvider } from '../../lib/aiProviders/types'
import { ProviderSelect } from '../../components/ProviderSelect'
import { pickDefaultModel } from '../../lib/providerModels'
import { CODE_REVIEW_SYSTEM_PROMPT } from '../../lib/codeReviewPresets'
import type { AiProvider, Prompt } from '../../schemas'

type Props = {
  prompt: Prompt
  variableValues: Record<string, string>
}

export function TestPanel({ prompt, variableValues }: Props) {
  const settings = useSettingsStore()
  const refreshModelCatalog = useSettingsStore((s) => s.refreshModelCatalog)
  const addTestRun = usePromptStore((s) => s.addTestRun)
  const testRuns = usePromptStore((s) => s.testRuns)
  const runGeneration = useRef(0)

  const [provider, setProvider] = useState<AiProvider>(settings.activeProvider)
  const [model, setModel] = useState(settings.defaultModels[settings.activeProvider])
  const [customModel, setCustomModel] = useState('')
  const [showCustomModel, setShowCustomModel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ latencyMs: number; model: string; provider: AiProvider } | null>(
    null,
  )
  const [refreshingModels, setRefreshingModels] = useState(false)

  const providerDef = getProviderDefinition(provider)
  const catalogProvider = provider !== 'mock' ? (provider as CatalogProvider) : null

  const catalogUpdated = catalogProvider
    ? settings.modelCatalogUpdatedAt[catalogProvider]
    : undefined

  const catalogForProvider = catalogProvider ? settings.modelCatalog[catalogProvider] : []

  const usingFallbackCatalog =
    catalogProvider !== null &&
    providerDef.supportsModelCatalog &&
    catalogForProvider.length === 0

  const refreshModels = async () => {
    if (!catalogProvider || !providerDef.supportsModelCatalog) return
    setRefreshingModels(true)
    try {
      const count = await refreshModelCatalog(catalogProvider)
      const catalog = useSettingsStore.getState().modelCatalog
      setModel(pickDefaultModel(provider, model, catalog))
      toast.success(`Загружено моделей: ${count}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить модели')
    } finally {
      setRefreshingModels(false)
    }
  }

  const filled = useMemo(() => {
    const out: Record<string, string> = {}
    for (const v of prompt.variables) {
      out[v.name] = variableValues[v.name] ?? v.defaultValue
    }
    return out
  }, [prompt.variables, variableValues])

  const previewBody = substituteVariables(prompt.body, filled)

  const history = useMemo(
    () => testRuns.filter((r) => r.promptId === prompt.id).slice(0, 8),
    [testRuns, prompt.id],
  )

  const effectiveModel = customModel.trim() || model

  const run = useCallback(async () => {
    const generation = ++runGeneration.current
    const ctx = buildCompletionContext(settings, provider)
    setLoading(true)
    setResult(null)
    setMeta(null)
    try {
      const isCodeReview =
        prompt.kind === 'code' ||
        prompt.tags.includes('review') ||
        /code review|ревью/i.test(prompt.title)

      const res = await runWithFallback(
        {
          provider,
          model: effectiveModel,
          apiKey: ctx.apiKey,
          openAiBaseUrl: ctx.openAiBaseUrl,
          userMessage: previewBody,
          systemMessage: isCodeReview ? CODE_REVIEW_SYSTEM_PROMPT : undefined,
        },
        { useMockWhenNoKey: settings.useMockWhenNoKey },
      )
      if (generation !== runGeneration.current) return

      setResult(res.content)
      setMeta({ latencyMs: res.latencyMs, model: res.model, provider: res.provider })
      addTestRun({
        promptId: prompt.id,
        provider: res.provider,
        model: res.model,
        filledVariables: filled,
        response: res.content,
        latencyMs: res.latencyMs,
      })
      if (generation === runGeneration.current && res.provider === 'mock' && provider !== 'mock') {
        toast.message('Использован Mock (нет ключа или ошибка API)')
      }
    } catch (e) {
      if (generation === runGeneration.current) {
        toast.error(e instanceof Error ? e.message : 'Ошибка запуска')
      }
    } finally {
      if (generation === runGeneration.current) setLoading(false)
    }
  }, [
    addTestRun,
    effectiveModel,
    filled,
    previewBody,
    prompt.id,
    provider,
    settings,
  ])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        void run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run])

  const fieldLabelClass = 'text-text-muted leading-tight text-sm'
  const fieldControlClass =
    'rounded-lg border border-border bg-surface-elevated px-3 py-2 h-[42px]'

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-x-3 gap-y-3 items-stretch sm:items-end">
          <div className="flex flex-col gap-1.5 text-sm min-w-[140px]">
            <span className={fieldLabelClass}>Провайдер</span>
            <ProviderSelect
              className={fieldControlClass}
              value={provider}
              onChange={(p) => {
                setProvider(p)
                setModel(
                  pickDefaultModel(p, settings.defaultModels[p], settings.modelCatalog),
                )
              }}
            />
          </div>
          <ModelSelect
            compact
            provider={provider}
            catalog={settings.modelCatalog}
            value={model}
            onChange={setModel}
            extraOptionIds={[customModel.trim()]}
            className="w-full min-w-0 sm:min-w-[200px] sm:flex-1 sm:max-w-xl"
          />
          {catalogProvider && providerDef.supportsModelCatalog && (
            <div className="flex flex-col gap-1.5 text-sm">
              <span className={`${fieldLabelClass} invisible`} aria-hidden>
                Обновление
              </span>
              <Button
                variant="secondary"
                className="text-xs h-[42px] px-3 whitespace-nowrap"
                disabled={
                  refreshingModels ||
                  (provider === 'openai_compatible'
                    ? !settings.openaiCompatibleBaseUrl.trim()
                    : providerDef.needsApiKey && !buildCompletionContext(settings, provider).apiKey)
                }
                onClick={() => void refreshModels()}
                title={
                  catalogUpdated
                    ? `Последняя загрузка: ${new Date(catalogUpdated).toLocaleString('ru-RU')}`
                    : 'Загрузить актуальный список моделей по API-ключу'
                }
              >
                {refreshingModels ? '…' : 'Модели с API'}
              </Button>
            </div>
          )}
          <div className="flex w-full flex-col gap-1.5 text-sm sm:ml-auto sm:w-auto">
            <span className={`${fieldLabelClass} hidden sm:block invisible`} aria-hidden>
              Запуск
            </span>
            <Button className="h-[42px] w-full whitespace-nowrap sm:w-auto" onClick={run} disabled={loading}>
              {loading ? 'Запуск…' : 'Запустить (Ctrl+Enter)'}
            </Button>
          </div>
        </div>
        {usingFallbackCatalog && (
          <p className="text-xs text-amber-400/90">
            Показан типовой список моделей. Нажмите «Модели с API» или загрузите каталог в настройках.
          </p>
        )}
        {!usingFallbackCatalog &&
          catalogUpdated &&
          catalogProvider &&
          providerDef.supportsModelCatalog && (
            <p className="text-xs text-text-muted">
              Список моделей с API · обновлён{' '}
              {new Date(catalogUpdated).toLocaleString('ru-RU')}
            </p>
          )}
        {(showCustomModel || customModel.trim()) ? (
          <div className="max-w-xl space-y-1">
            <Input
              label="Свой id модели"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="например openai/gpt-4o-mini"
              className="h-[42px]"
            />
            <p className="text-xs text-text-muted">
              Используется вместо выбора в списке, если нужной модели там нет (новая или не
              попала в каталог).
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="text-xs text-primary hover:underline text-left"
            onClick={() => setShowCustomModel(true)}
          >
            Нужной модели нет в списке? Указать id вручную
          </button>
        )}
      </div>

      <div>
        <div className="text-xs text-text-muted mb-1">Подставленный промпт</div>
        <pre className="rounded-lg border border-border bg-surface p-3 text-xs font-mono whitespace-pre-wrap max-h-[160px] overflow-auto">
          {previewBody}
        </pre>
      </div>

      {meta && (
        <div className="flex flex-wrap gap-2 text-xs text-text-muted">
          <Badge>{meta.provider}</Badge>
          <Badge className="font-mono">{meta.model}</Badge>
          <span title="Время от запроса до полного ответа (без стриминга)">{meta.latencyMs} ms</span>
        </div>
      )}

      {result && (
        <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-surface-elevated/30">
          <div
            className={`p-4 prose prose-invert prose-sm max-w-none min-w-0 break-words [overflow-wrap:anywhere] [&_*]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_code]:break-words ${
              prompt.kind === 'code'
                ? 'prose-pre:bg-[#0d0d0f] prose-pre:border prose-pre:border-border'
                : ''
            }`}
          >
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Последние прогоны</h3>
          <ul className="space-y-2 max-h-[200px] overflow-auto text-xs">
            {history.map((r) => (
              <li key={r.id} className="rounded border border-border px-2 py-1.5">
                <span className="text-text-muted flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <span>{new Date(r.createdAt).toLocaleString('ru-RU')}</span>
                  <span>·</span>
                  <span>{r.provider}</span>
                  <span>·</span>
                  <span className="font-mono">{r.model}</span>
                  <span>·</span>
                  <span>{r.latencyMs} ms</span>
                </span>
                <button
                  type="button"
                  className="block text-left text-primary mt-0.5 truncate w-full"
                  onClick={() => setResult(r.response)}
                >
                  {r.response.slice(0, 120)}…
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
