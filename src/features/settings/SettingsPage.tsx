import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ProviderSelect } from '../../components/ProviderSelect'
import {
  PROVIDER_NOTES,
  getProviderDefinition,
  isProviderConfigured,
  listSettingsProviders,
} from '../../lib/aiProviders/registry'
import { buildCompletionContext } from '../../lib/aiProviders/completionContext'
import type { CatalogProvider } from '../../lib/aiProviders/types'
import { PageShell } from '../../components/layout/PageShell'
import { useSettingsStore } from '../../stores/settingsStore'
import { usePromptStore } from '../../stores/promptStore'
import { runWithFallback } from '../../services/ai/runPrompt'
import type { AiProvider } from '../../schemas'
import { ProviderSettingsSection } from './ProviderSettingsSection'

function initialConfigureProvider(active: AiProvider): CatalogProvider {
  const def = getProviderDefinition(active)
  if (def.showInSettings && active !== 'mock') return active as CatalogProvider
  return 'openrouter'
}

export function SettingsPage() {
  const settings = useSettingsStore()
  const clearAllData = usePromptStore((s) => s.clearAllData)
  const refreshModelCatalog = useSettingsStore((s) => s.refreshModelCatalog)
  const [confirmClear, setConfirmClear] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loadingModels, setLoadingModels] = useState<CatalogProvider | null>(null)
  const [configureId, setConfigureId] = useState<CatalogProvider>(() =>
    initialConfigureProvider(settings.activeProvider),
  )

  const settingsProviders = listSettingsProviders()

  const activeDef = getProviderDefinition(settings.activeProvider)
  const activeReady = isProviderConfigured(settings, settings.activeProvider)

  const configuredSummary = useMemo(
    () =>
      settingsProviders
        .filter((p) => isProviderConfigured(settings, p.id))
        .map((p) => p.label),
    [settings, settingsProviders],
  )

  const loadModels = async (provider: CatalogProvider) => {
    setLoadingModels(provider)
    try {
      const count = await refreshModelCatalog(provider)
      toast.success(`${provider}: загружено ${count} моделей`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка загрузки моделей')
    } finally {
      setLoadingModels(null)
    }
  }

  const testConnection = async (provider: AiProvider) => {
    setTesting(true)
    try {
      const ctx = buildCompletionContext(settings, provider)
      await runWithFallback(
        {
          provider,
          model: settings.defaultModels[provider],
          apiKey: ctx.apiKey,
          openAiBaseUrl: ctx.openAiBaseUrl,
          userMessage: 'Reply with exactly: OK',
        },
        { useMockWhenNoKey: settings.useMockWhenNoKey },
      )
      toast.success(`${provider}: соединение OK`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setTesting(false)
    }
  }

  const configureDef = getProviderDefinition(configureId)

  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-semibold">Настройки</h1>
        <p className="text-sm text-text-muted mt-1">
          API-ключи хранятся только в localStorage этого браузера. Не коммитьте их в git.
        </p>
        <p className="text-xs text-text-muted mt-3 leading-relaxed">{PROVIDER_NOTES}</p>
      </div>

      <section className="rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-medium">ИИ-провайдеры</h2>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-muted">Провайдер по умолчанию (тест, оптимизатор)</span>
          <ProviderSelect
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2"
            value={settings.activeProvider}
            onChange={(p) => {
              settings.setActiveProvider(p)
              const def = getProviderDefinition(p)
              if (def.showInSettings) setConfigureId(p as CatalogProvider)
            }}
          />
        </label>

        <p className="text-xs text-text-muted leading-relaxed">
          {settings.activeProvider === 'mock'
            ? 'Mock не требует ключа — подходит для проверки UI и переменных.'
            : 'Провайдер по умолчанию только выбирает, куда слать запрос. Ключ или Base URL нужно указать отдельно в «Настроить подключение» для этого же провайдера.'}
        </p>

        {settings.activeProvider !== 'mock' && !activeReady && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
            Для <strong>{activeDef.label}</strong> ещё не настроен доступ
            {settings.activeProvider === 'openai_compatible' ? ' (нужен Base URL)' : ' (нужен API Key)'}.
            {settings.useMockWhenNoKey
              ? ' Пока включён Mock-fallback — тесты пойдут в заглушку, а не в выбранный провайдер.'
              : ' Тест и оптимизатор будут падать с ошибкой, пока не сохраните ключ ниже.'}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.useMockWhenNoKey}
            onChange={(e) => settings.setUseMockWhenNoKey(e.target.checked)}
          />
          Использовать Mock при отсутствии ключа или ошибке API
        </label>

        {configuredSummary.length > 0 && (
          <p className="text-xs text-text-muted">
            Настроено: {configuredSummary.join(', ')}. Ключи сохраняются отдельно для каждого провайдера.
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between pt-2">
          <label className="flex flex-col gap-1.5 text-sm flex-1 min-w-0">
            <span className="text-text-muted">Настроить подключение</span>
            <select
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2"
              value={configureId}
              onChange={(e) => setConfigureId(e.target.value as CatalogProvider)}
            >
              {settingsProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {settings.activeProvider !== 'mock' &&
            getProviderDefinition(settings.activeProvider).showInSettings && (
              <Button
                type="button"
                variant="ghost"
                className="text-xs text-primary shrink-0 sm:mb-0.5"
                onClick={() => setConfigureId(settings.activeProvider as CatalogProvider)}
              >
                ← провайдер по умолчанию
              </Button>
            )}
        </div>

        <p className="text-sm font-medium text-text">{configureDef.label}</p>

        <ProviderSettingsSection
          providerId={configureId}
          loadingModels={loadingModels}
          testing={testing}
          onLoadModels={loadModels}
          onTestConnection={testConnection}
        />
      </section>

      <section className="rounded-xl border border-red-900/50 p-6 space-y-3">
        <h2 className="font-medium text-red-400">Опасная зона</h2>
        <Button variant="danger" onClick={() => setConfirmClear(true)}>
          Очистить все данные
        </Button>
      </section>

      <Modal
        open={confirmClear}
        title="Очистить все данные?"
        onClose={() => setConfirmClear(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearAllData()
                settings.resetSettings()
                setConfirmClear(false)
                toast.success('Данные очищены')
              }}
            >
              Удалить всё
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          Промпты, версии, коллекции и история прогонов будут удалены из localStorage.
        </p>
      </Modal>
    </PageShell>
  )
}
