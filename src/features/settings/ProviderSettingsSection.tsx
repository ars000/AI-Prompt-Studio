import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ModelSelect } from '../../components/ModelSelect'
import { countModelsByTier } from '../../lib/providerModels'
import { getProviderApiKey, getProviderDefinition } from '../../lib/aiProviders/registry'
import type { CatalogProvider } from '../../lib/aiProviders/types'
import type { AiProvider } from '../../schemas'
import { useSettingsStore } from '../../stores/settingsStore'

type Props = {
  providerId: CatalogProvider
  loadingModels: CatalogProvider | null
  testing: boolean
  onLoadModels: (p: CatalogProvider) => void
  onTestConnection: (p: AiProvider) => void
}

function canLoadModels(providerId: CatalogProvider): boolean {
  const settings = useSettingsStore.getState()
  if (providerId === 'openai_compatible') {
    return Boolean(settings.openaiCompatibleBaseUrl.trim())
  }
  return Boolean(getProviderApiKey(settings, providerId).trim())
}

export function ProviderSettingsSection({
  providerId,
  loadingModels,
  testing,
  onLoadModels,
  onTestConnection,
}: Props) {
  const settings = useSettingsStore()
  const setProviderApiKey = useSettingsStore((s) => s.setProviderApiKey)
  const def = getProviderDefinition(providerId)
  const catalog = settings.modelCatalog[providerId]
  const updatedAt = settings.modelCatalogUpdatedAt[providerId]
  const keyValue = getProviderApiKey(settings, providerId)

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      <p className="text-sm text-text-muted">{def.shortHint}</p>

      {providerId === 'openai_compatible' && (
        <Input
          label="Base URL"
          placeholder="http://localhost:11434"
          value={settings.openaiCompatibleBaseUrl}
          onChange={(e) => settings.setOpenaiCompatibleBaseUrl(e.target.value)}
        />
      )}

      <Input
        label={providerId === 'openai_compatible' ? 'API Key (опционально)' : 'API Key'}
        type="password"
        autoComplete="off"
        value={keyValue}
        onChange={(e) => setProviderApiKey(providerId, e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <ModelSelect
            provider={providerId}
            catalog={settings.modelCatalog}
            value={settings.defaultModels[providerId]}
            onChange={(m) => settings.setDefaultModel(providerId, m)}
            label="Модель по умолчанию"
            extraOptionIds={[settings.defaultModels[providerId]]}
            showFooterHints={false}
            className="w-full min-w-0 sm:flex-1 sm:max-w-xl"
          />
          <Button
            variant="secondary"
            className="h-[42px] w-full shrink-0 whitespace-nowrap sm:w-auto"
            disabled={loadingModels === providerId || !canLoadModels(providerId)}
            onClick={() => onLoadModels(providerId)}
          >
            {loadingModels === providerId ? 'Загрузка…' : 'Загрузить модели с API'}
          </Button>
        </div>

        {!updatedAt && catalog.length === 0 && (
          <p className="text-xs text-amber-400/90">
            Показан типовой список. Загрузите модели с API после настройки доступа.
          </p>
        )}

        {providerId === 'openrouter' && catalog.length > 0 && (
          <p className="text-xs text-text-muted">
            OpenRouter: бесплатные — pricing $0 или суффикс :free (актуальность по вашему аккаунту).
          </p>
        )}
        {providerId === 'groq' && catalog.length > 0 && (
          <p className="text-xs text-text-muted">
            Groq: все модели из API помечены как free tier (лимиты запросов по ключу).
          </p>
        )}
        {providerId === 'anthropic' && catalog.length > 0 && (
          <p className="text-xs text-text-muted">Anthropic: список моделей с официального API.</p>
        )}
        {providerId === 'openai_compatible' && catalog.length > 0 && (
          <p className="text-xs text-text-muted">
            Список с {settings.openaiCompatibleBaseUrl.trim()}/v1/models
          </p>
        )}
      </div>

      {updatedAt && providerId === 'openrouter' && (() => {
        const c = countModelsByTier(catalog)
        return (
          <p className="text-xs text-text-muted">
            OpenRouter: {catalog.length} моделей — бесплатных {c.free}, платных {c.paid}, без метки{' '}
            {c.unknown}. Обновлено {new Date(updatedAt).toLocaleString('ru-RU')}.
          </p>
        )
      })()}

      {updatedAt && providerId !== 'openrouter' && (
        <p className="text-xs text-text-muted">
          {catalog.length} моделей в каталоге. Обновлено {new Date(updatedAt).toLocaleString('ru-RU')}.
        </p>
      )}

      <Button variant="secondary" disabled={testing} onClick={() => onTestConnection(providerId)}>
        Проверить соединение
      </Button>
    </div>
  )
}
