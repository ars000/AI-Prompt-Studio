import type { AiProvider } from '../schemas'
import type { ModelCatalog, ModelCatalogEntry, ModelTier } from './modelCatalogTypes'
import { catalogIds } from './modelCatalogTypes'

/** Запасной список, если ключ не задан или API models недоступен */
export const FALLBACK_MODELS: Record<AiProvider, string[]> = {
  mock: ['mock-gpt'],
  openrouter: [
    'openai/gpt-4o-mini',
    'google/gemini-2.0-flash-001',
    'anthropic/claude-3.5-haiku',
  ],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'],
  openai_compatible: ['llama3.2', 'gpt-4o-mini', 'mistral'],
}

export type { ModelCatalog, ModelCatalogEntry }

export type ModelOptionGroup = {
  tier: ModelTier
  label: string
  ids: string[]
}

const TIER_LABELS: Record<ModelTier, string> = {
  free: 'Бесплатные / $0',
  paid: 'Платные',
  unknown: 'Без метки тарифа',
}

function entriesForProvider(provider: AiProvider, catalog: ModelCatalog): ModelCatalogEntry[] {
  if (provider === 'mock') return []
  return catalog[provider] ?? []
}

function fallbackEntries(provider: AiProvider): ModelCatalogEntry[] {
  return FALLBACK_MODELS[provider].map((id) => ({ id, tier: 'unknown' as const }))
}

export function getModelEntries(
  provider: AiProvider,
  catalog: ModelCatalog,
  extraIds: string[] = [],
): ModelCatalogEntry[] {
  if (provider === 'mock') {
    return FALLBACK_MODELS.mock.map((id) => ({ id, tier: 'unknown' }))
  }

  const fromApi = entriesForProvider(provider, catalog)
  const base = fromApi.length > 0 ? fromApi : fallbackEntries(provider)
  const byId = new Map(base.map((e) => [e.id, e]))

  for (const id of extraIds.filter(Boolean)) {
    if (!byId.has(id)) byId.set(id, { id, tier: 'unknown' })
  }

  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
}

export function getModelOptions(
  provider: AiProvider,
  catalog: ModelCatalog,
  extraIds: string[] = [],
): string[] {
  return catalogIds(getModelEntries(provider, catalog, extraIds))
}

export function getModelOptionGroups(
  provider: AiProvider,
  catalog: ModelCatalog,
  extraIds: string[] = [],
): ModelOptionGroup[] {
  const entries = getModelEntries(provider, catalog, extraIds)
  const order: ModelTier[] = ['free', 'paid', 'unknown']
  const groups: ModelOptionGroup[] = []

  for (const tier of order) {
    const ids = entries.filter((e) => e.tier === tier).map((e) => e.id)
    if (ids.length === 0) continue
    groups.push({ tier, label: TIER_LABELS[tier], ids })
  }

  return groups
}

export function pickDefaultModel(
  provider: AiProvider,
  preferred: string,
  catalog: ModelCatalog,
): string {
  if (provider === 'mock') return preferred

  const fromApi = entriesForProvider(provider, catalog)
  if (fromApi.length > 0) {
    if (fromApi.some((e) => e.id === preferred)) return preferred
    const free = fromApi.filter((e) => e.tier === 'free').map((e) => e.id)
    if (free.length > 0) return free[0]!
    return fromApi[0]!.id
  }

  const fallback = FALLBACK_MODELS[provider]
  if (fallback.includes(preferred)) return preferred
  return fallback[0] ?? preferred
}

export function countModelsByTier(catalog: ModelCatalogEntry[]) {
  return {
    free: catalog.filter((e) => e.tier === 'free').length,
    paid: catalog.filter((e) => e.tier === 'paid').length,
    unknown: catalog.filter((e) => e.tier === 'unknown').length,
  }
}
