import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { optimizePrompt } from '../../services/ai/optimizePrompt'
import { useSettingsStore } from '../../stores/settingsStore'
import { usePromptStore } from '../../stores/promptStore'
import {
  clearOptimizerSession,
  loadOptimizerSession,
  saveOptimizerSession,
} from '../../lib/optimizerSession'
import type { OptimizerResult, PromptKind, PromptVariable } from '../../schemas'
import { buildCompletionContext } from '../../lib/aiProviders/completionContext'
import { ProviderSelect } from '../../components/ProviderSelect'
import type { AiProvider } from '../../schemas'
import { PageShell } from '../../components/layout/PageShell'
import {
  IMAGE_GENERATORS_ENGLISH_NOTE,
  IMAGE_PROMPT_TARGET_LABELS,
  PROMPT_TEXT_LANGUAGE_OPTIONS,
  normalizePromptTextLanguage,
  resolveImagePromptLanguage,
  shouldWarnImageNonEnglish,
  type ImagePromptTarget,
  type PromptTextLanguageValue,
} from '../../lib/promptLanguage'
import { substituteVariables } from '../../lib/variables'
import { ImagePromptGeneratorBar } from '../prompts/ImagePromptGeneratorBar'

type LocationState = {
  rawRequest?: string
  kindHint?: PromptKind
  refineBody?: string
  refineTitle?: string
  refineVariables?: PromptVariable[]
  fromPromptId?: string
}

export type PromptEditorNavigateState = {
  fromOptimizer?: boolean
  initialTab?: 'editor' | 'test' | 'variables' | 'review'
}

function cloneResult(r: OptimizerResult): OptimizerResult {
  return {
    ...r,
    variables: r.variables.map((v) => ({ ...v })),
    tags: [...r.tags],
    tips: [...r.tips],
  }
}

export function OptimizerPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state as LocationState | null) ?? {}

  const settings = useSettingsStore()
  const applyOptimizerResult = usePromptStore((s) => s.applyOptimizerResult)
  const [fromPromptId, setFromPromptId] = useState<string | undefined>(state.fromPromptId)
  const sourcePrompt = usePromptStore((s) => (fromPromptId ? s.prompts[fromPromptId] : undefined))

  const [rawRequest, setRawRequest] = useState('')
  const [kindHint, setKindHint] = useState<PromptKind | 'auto'>('auto')
  const [outputLanguage, setOutputLanguage] = useState('русском')
  const [imageTarget, setImageTarget] = useState<ImagePromptTarget>('en_generators')
  const [provider, setProvider] = useState<AiProvider>(settings.activeProvider)
  const [loading, setLoading] = useState(false)
  const [editable, setEditable] = useState<OptimizerResult | null>(null)
  const [usedMock, setUsedMock] = useState(false)
  const [refineBody, setRefineBody] = useState<string | undefined>()

  const refineTitle = state.refineTitle ?? sourcePrompt?.title
  const refineVariables = sourcePrompt?.variables ?? state.refineVariables
  const isRefineMode = Boolean(fromPromptId && refineBody?.trim())
  const showsImageFlow = kindHint === 'image' || editable?.kind === 'image'
  const effectiveOutputLanguage = useMemo(
    () =>
      showsImageFlow
        ? resolveImagePromptLanguage(imageTarget, outputLanguage)
        : outputLanguage,
    [showsImageFlow, imageTarget, outputLanguage],
  )
  const imageNonEnglish =
    showsImageFlow && imageTarget === 'custom' && shouldWarnImageNonEnglish(outputLanguage)

  const editableResolvedPreview = useMemo(() => {
    if (!editable) return ''
    const values = Object.fromEntries(editable.variables.map((v) => [v.name, v.defaultValue]))
    return substituteVariables(editable.body, values)
  }, [editable])

  useEffect(() => {
    if (imageTarget === 'en_generators') {
      setOutputLanguage('английском')
    }
  }, [imageTarget])

  useEffect(() => {
    const fromLibrary = Boolean(state.fromPromptId && state.refineBody?.trim())
    if (fromLibrary) {
      clearOptimizerSession()
      setFromPromptId(state.fromPromptId)
      setRawRequest(state.rawRequest?.trim() ?? '')
      setKindHint(state.kindHint ?? 'auto')
      setRefineBody(state.refineBody)
      setEditable(null)
      return
    }

    const session = loadOptimizerSession()
    if (session && !state.rawRequest) {
      setRawRequest(session.rawRequest)
      if (session.refineBody) setRefineBody(session.refineBody)
      if (session.fromPromptId) setFromPromptId(session.fromPromptId)
      setEditable(cloneResult(session.result))
      return
    }
    if (state.rawRequest) setRawRequest(state.rawRequest)
    if (state.kindHint) {
      setKindHint(state.kindHint)
      if (state.kindHint === 'image') setImageTarget('en_generators')
    }
    if (state.refineBody) setRefineBody(state.refineBody)
    if (state.fromPromptId) setFromPromptId(state.fromPromptId)
  }, [
    state.fromPromptId,
    state.rawRequest,
    state.kindHint,
    state.refineBody,
  ])

  useEffect(() => {
    if (!editable) return
    saveOptimizerSession({
      rawRequest,
      refineBody,
      result: editable,
      fromPromptId,
      savedAt: new Date().toISOString(),
    })
  }, [editable, rawRequest, refineBody, fromPromptId])

  const runOptimize = useCallback(async () => {
    const ctx = buildCompletionContext(settings, provider)
    if (!rawRequest.trim()) {
      toast.error('Опишите, что должен делать промпт')
      return
    }
    setLoading(true)
    setEditable(null)
    try {
      const { result: optimized, usedMock: mock } = await optimizePrompt(
        {
          rawRequest,
          kindHint,
          outputLanguage,
          imagePromptTarget: showsImageFlow ? imageTarget : undefined,
          refineExistingBody: refineBody,
          refineTitle,
          refineVariables,
        },
        {
          provider,
          model: settings.defaultModels[provider],
          apiKey: ctx.apiKey,
          openAiBaseUrl: ctx.openAiBaseUrl,
          useMockWhenNoKey: settings.useMockWhenNoKey,
        },
      )
      setEditable(cloneResult(optimized))
      setUsedMock(mock)
      if (mock && provider !== 'mock') toast.message('Использован локальный Mock (нет ключа или ошибка парсинга)')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка оптимизации')
    } finally {
      setLoading(false)
    }
  }, [
    kindHint,
    outputLanguage,
    imageTarget,
    showsImageFlow,
    provider,
    rawRequest,
    refineBody,
    refineTitle,
    refineVariables,
    settings,
  ])

  const goToPrompt = (id: string, kind: PromptKind) => {
    clearOptimizerSession()
    const nav: PromptEditorNavigateState = {
      fromOptimizer: true,
      initialTab: kind === 'code' ? 'editor' : 'test',
    }
    navigate(`/prompts/${id}`, { state: nav })
  }

  const applyCreate = () => {
    if (!editable) return
    const id = applyOptimizerResult(rawRequest, editable, 'create')
    if (!id) return
    toast.success('Промпт создан — откройте редактор и тест')
    goToPrompt(id, editable.kind)
  }

  const applyUpdate = () => {
    if (!editable || !fromPromptId) return
    const id = applyOptimizerResult(rawRequest, editable, 'update', fromPromptId)
    if (!id) {
      toast.error('Исходный промпт не найден')
      return
    }
    toast.success('Промпт обновлён (новая версия в истории)')
    goToPrompt(id, editable.kind)
  }

  const patchEditable = (patch: Partial<OptimizerResult>) => {
    setEditable((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const cancelRefine = () => {
    clearOptimizerSession()
    if (fromPromptId) {
      navigate(`/prompts/${fromPromptId}`)
      return
    }
    navigate('/')
  }

  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-semibold">Оптимизатор промптов</h1>
        <p className="text-sm text-text-muted mt-2">
          После оптимизации отредактируйте текст при необходимости и нажмите «Продолжить в редакторе» — промпт
          сохранится в библиотеку с пояснением и переменными.
        </p>
      </div>

      <div className="rounded-xl border border-border p-5 space-y-4">
        {isRefineMode && (
          <div className="text-xs text-text-muted rounded-lg border border-primary/30 bg-primary-muted/30 p-3">
            Улучшаем промпт из библиотеки:{' '}
            {sourcePrompt && fromPromptId ? (
              <Link to={`/prompts/${fromPromptId}`} className="text-primary hover:underline">
                «{sourcePrompt.title}»
              </Link>
            ) : refineTitle ? (
              `«${refineTitle}»`
            ) : (
              'без названия'
            )}
          </div>
        )}

        {isRefineMode && (
          <Textarea
            label="Текущий шаблон промпта (контекст для улучшения)"
            value={refineBody ?? ''}
            onChange={(e) => setRefineBody(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            spellCheck={false}
          />
        )}

        <Textarea
          label={isRefineMode ? 'Пожелания к улучшению' : 'Сырой запрос'}
          value={rawRequest}
          onChange={(e) => setRawRequest(e.target.value)}
          placeholder={
            isRefineMode
              ? 'Например: добавь секции, вынеси повторяющиеся части в {{переменные}}'
              : 'Например: хочу промпт для code review React-компонентов'
          }
          className="min-h-[120px] font-sans"
          spellCheck
        />

        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Тип</span>
            <select
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
              value={kindHint}
              onChange={(e) => setKindHint(e.target.value as PromptKind | 'auto')}
            >
              <option value="auto">Авто</option>
              <option value="text">Текст</option>
              <option value="code">Код / review</option>
              <option value="image">Изображение</option>
            </select>
          </label>
          {showsImageFlow && (
            <label className="flex flex-col gap-1.5 text-sm min-w-[220px]">
              <span className="text-text-muted">Целевой генератор</span>
              <select
                className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
                value={imageTarget}
                onChange={(e) => setImageTarget(e.target.value as ImagePromptTarget)}
              >
                {(Object.keys(IMAGE_PROMPT_TARGET_LABELS) as ImagePromptTarget[]).map((key) => (
                  <option key={key} value={key}>
                    {IMAGE_PROMPT_TARGET_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm min-w-[160px]">
            <span className="text-text-muted">
              {showsImageFlow ? 'Язык текста промпта' : 'Язык ответа AI'}
            </span>
            <select
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2 disabled:opacity-60"
              value={normalizePromptTextLanguage(
                showsImageFlow ? effectiveOutputLanguage : outputLanguage,
              )}
              onChange={(e) => setOutputLanguage(e.target.value as PromptTextLanguageValue)}
              disabled={showsImageFlow && imageTarget === 'en_generators'}
            >
              {PROMPT_TEXT_LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Провайдер</span>
            <ProviderSelect
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
              value={provider}
              onChange={setProvider}
            />
          </label>
        </div>

        {showsImageFlow && (
          <div
            className={`text-xs rounded-lg border p-3 space-y-1 ${
              imageNonEnglish
                ? 'border-amber-500/40 bg-amber-500/10 text-text'
                : 'border-border bg-surface text-text-muted'
            }`}
          >
            <p>{IMAGE_GENERATORS_ENGLISH_NOTE}</p>
            {imageTarget === 'custom' && imageNonEnglish && (
              <p>
                Шаблон будет на выбранном языке; перед генератором используйте «Перевести финальный
                prompt на EN» под preview.
              </p>
            )}
            {imageTarget === 'en_generators' && (
              <p>Оптимизатор сразу готовит шаблон и значения переменных на английском.</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void runOptimize()} disabled={loading}>
            {loading ? 'Оптимизация…' : 'Оптимизировать'}
          </Button>
          {fromPromptId && (
            <Button type="button" variant="secondary" onClick={cancelRefine} disabled={loading}>
              Отмена
            </Button>
          )}
        </div>
      </div>

      {editable && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{editable.kind}</Badge>
            {usedMock && <Badge className="bg-zinc-700 text-text-muted">Mock / fallback</Badge>}
            {editable.kind === 'image' && imageTarget === 'custom' && imageNonEnglish && (
              <Badge className="bg-amber-600/20 text-amber-200 border border-amber-500/30">
                Промпт не на EN — перевод перед генератором
              </Badge>
            )}
          </div>

          <section className="rounded-xl border border-border p-4 space-y-2">
            <h3 className="text-sm font-medium text-primary">Что улучшено</h3>
            <p className="text-sm text-text-muted">{editable.explanation}</p>
            {editable.tips.length > 0 && (
              <ul className="text-sm text-text-muted list-disc pl-5 space-y-1">
                {editable.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </section>

          <Input
            label="Название промпта"
            value={editable.title}
            onChange={(e) => patchEditable({ title: e.target.value })}
          />

          <Textarea
            label="Текст промпта (редактируемый перед сохранением)"
            value={editable.body}
            onChange={(e) => patchEditable({ body: e.target.value })}
            className="min-h-[220px] font-mono text-sm"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-sm text-text-muted mb-1.5">Было</h3>
              <pre className="rounded-lg border border-border bg-surface p-3 text-xs whitespace-pre-wrap max-h-[160px] overflow-auto">
                {refineBody?.trim() || rawRequest}
              </pre>
            </div>
            <div>
              <h3 className="text-sm text-text-muted mb-1.5">Preview</h3>
              <pre className="rounded-lg border border-border bg-surface p-3 text-xs font-mono whitespace-pre-wrap max-h-[160px] overflow-auto">
                {editableResolvedPreview}
              </pre>
            </div>
          </div>

          {editable.kind === 'image' && (
            <ImagePromptGeneratorBar resolvedPrompt={editableResolvedPreview} provider={provider} />
          )}

          {editable.variables.length > 0 && (
            <div>
              <h3 className="text-sm text-text-muted mb-2">Переменные (сохранятся в промпт)</h3>
              <ul className="rounded-lg border border-border divide-y divide-border text-sm">
                {editable.variables.map((v, i) => (
                  <li key={v.name} className="px-3 py-2 space-y-1">
                    <span className="font-mono text-primary">{`{{${v.name}}}`}</span>
                    <input
                      className="w-full rounded border border-border bg-surface-elevated px-2 py-1 text-xs"
                      value={v.defaultValue}
                      onChange={(e) => {
                        const variables = editable.variables.map((x, j) =>
                          j === i ? { ...x, defaultValue: e.target.value } : x,
                        )
                        patchEditable({ variables })
                      }}
                      placeholder="default"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-primary/30 bg-primary-muted/20 p-4 space-y-3">
            <p className="text-sm text-text">
              Следующий шаг: сохранить промпт в библиотеку и перейти к редактированию, переменным и тесту. Текст
              выше — тот же, что попадёт в шаблон.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={applyCreate}>
                {fromPromptId ? 'Создать новый промпт и открыть' : 'Продолжить в редакторе'}
              </Button>
              {fromPromptId && (
                <Button variant="secondary" onClick={applyUpdate}>
                  Обновить исходный промпт
                </Button>
              )}
              {fromPromptId && (
                <Button variant="secondary" onClick={cancelRefine}>
                  Отмена
                </Button>
              )}
              <Button variant="ghost" onClick={() => void runOptimize()}>
                Перегенерировать
              </Button>
              <Button
                variant="ghost"
                className="text-text-muted"
                onClick={() => {
                  clearOptimizerSession()
                  setEditable(null)
                  toast.message('Черновик оптимизатора очищен')
                }}
              >
                Сбросить результат
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
