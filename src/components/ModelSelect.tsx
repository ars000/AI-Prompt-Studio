import type { AiProvider } from '../schemas'
import { getModelOptionGroups, getModelOptions } from '../lib/providerModels'
import type { ModelCatalog } from '../lib/modelCatalogTypes'

type Props = {
  provider: AiProvider
  catalog: ModelCatalog
  value: string
  onChange: (model: string) => void
  extraOptionIds?: string[]
  className?: string
  label?: string
  /** Скрывает подписи под селектом — для плотных тулбаров */
  compact?: boolean
  /** Подсказки под полем (в тулбарах отключайте, чтобы выровнять соседние кнопки по селекту) */
  showFooterHints?: boolean
  groupByTier?: boolean
}

export function ModelSelect({
  provider,
  catalog,
  value,
  onChange,
  extraOptionIds = [],
  className = '',
  label = 'Модель',
  compact = false,
  showFooterHints = true,
  groupByTier = true,
}: Props) {
  const options = getModelOptions(provider, catalog, [value, ...extraOptionIds])
  const groups = getModelOptionGroups(provider, catalog, [value, ...extraOptionIds])
  const showGroups = groupByTier && provider !== 'mock' && groups.length > 1

  const selected = options.includes(value) ? value : options[0] ?? value

  const usingFallback = provider !== 'mock' && (catalog[provider]?.length ?? 0) === 0

  return (
    <div className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="text-text-muted leading-tight">{label}</span>
      <select
        className="rounded-lg border border-border bg-surface-elevated px-3 py-2 min-w-[180px] max-w-full h-[42px]"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {showGroups
          ? groups.map((g) => (
              <optgroup key={g.tier} label={g.label}>
                {g.ids.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
      </select>
      {showFooterHints && !compact && usingFallback && (
        <span className="text-xs text-amber-400/90">
          Показан типовой список. Загрузите модели с API в настройках по вашему ключу.
        </span>
      )}
      {showFooterHints &&
        !compact &&
        !usingFallback &&
        provider === 'openrouter' &&
        catalog.openrouter.length > 0 && (
        <span className="text-xs text-text-muted">
          OpenRouter: бесплатные — pricing $0 или суффикс :free (актуальность по вашему аккаунту).
        </span>
      )}
      {showFooterHints && !compact && !usingFallback && provider === 'groq' && catalog.groq.length > 0 && (
        <span className="text-xs text-text-muted">
          Groq: все модели из API помечены как free tier (лимиты запросов по ключу).
        </span>
      )}
      {showFooterHints &&
        !compact &&
        !usingFallback &&
        provider === 'anthropic' &&
        catalog.anthropic.length > 0 && (
          <span className="text-xs text-text-muted">Anthropic Claude — официальный API.</span>
        )}
      {showFooterHints &&
        !compact &&
        !usingFallback &&
        provider === 'openai_compatible' &&
        catalog.openai_compatible.length > 0 && (
          <span className="text-xs text-text-muted">Модели с вашего OpenAI-compatible endpoint.</span>
        )}
    </div>
  )
}
