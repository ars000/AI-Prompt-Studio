import type { CatalogProvider } from '../../lib/aiProviders/types'
import { resolveOpenAiModelsUrl } from '../../lib/aiProviders/resolveEndpoint'
import type { ModelCatalogEntry, ModelTier } from '../../lib/modelCatalogTypes'

type OpenRouterModel = {
  id?: string
  pricing?: {
    prompt?: string
    completion?: string
    request?: string
  }
}

type ModelsResponse = {
  data?: OpenRouterModel[]
  error?: { message?: string }
}

function parsePrice(value: string | undefined): number {
  if (value === undefined || value === '') return NaN
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : NaN
}

export function classifyOpenRouterModel(model: OpenRouterModel): ModelTier {
  const id = model.id ?? ''
  if (id.includes(':free') || id.endsWith('-free')) return 'free'

  const prompt = parsePrice(model.pricing?.prompt)
  const completion = parsePrice(model.pricing?.completion)
  const request = parsePrice(model.pricing?.request)

  const prices = [prompt, completion, request].filter((n) => !Number.isNaN(n))
  if (prices.length === 0) return 'unknown'
  if (prices.every((n) => n === 0)) return 'free'
  return 'paid'
}

/** Groq API не отдаёт цены; модели с ключом обычно на free tier с rate limit */
function classifyGroqModel(_id: string): ModelTier {
  return 'free'
}

async function fetchOpenRouterModels(apiKey: string): Promise<ModelCatalogEntry[]> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const body = (await res.json()) as ModelsResponse
  if (!res.ok) {
    throw new Error(body.error?.message ?? `HTTP ${res.status}`)
  }

  const byId = new Map<string, ModelCatalogEntry>()
  for (const m of body.data ?? []) {
    if (!m.id) continue
    byId.set(m.id, { id: m.id, tier: classifyOpenRouterModel(m) })
  }

  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
}

async function fetchGroqModels(apiKey: string): Promise<ModelCatalogEntry[]> {
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const body = (await res.json()) as ModelsResponse
  if (!res.ok) {
    throw new Error(body.error?.message ?? `HTTP ${res.status}`)
  }

  const ids = (body.data ?? [])
    .map((m) => m.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  return [...new Set(ids)]
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({ id, tier: classifyGroqModel(id) }))
}

async function fetchOpenAiCompatibleModels(
  apiKey: string,
  baseUrl: string,
): Promise<ModelCatalogEntry[]> {
  const url = resolveOpenAiModelsUrl(baseUrl)
  const headers: Record<string, string> = {}
  if (apiKey.trim()) headers.Authorization = `Bearer ${apiKey}`

  const res = await fetch(url, { headers })
  const body = (await res.json()) as ModelsResponse
  if (!res.ok) {
    throw new Error(body.error?.message ?? `HTTP ${res.status}`)
  }

  const ids = (body.data ?? [])
    .map((m) => m.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  return [...new Set(ids)]
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({ id, tier: 'unknown' as const }))
}

type AnthropicModelsResponse = {
  data?: { id?: string; display_name?: string }[]
  error?: { message?: string }
}

async function fetchAnthropicModels(apiKey: string): Promise<ModelCatalogEntry[]> {
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
  })
  const body = (await res.json()) as AnthropicModelsResponse
  if (!res.ok) {
    throw new Error(body.error?.message ?? `HTTP ${res.status}`)
  }

  const ids = (body.data ?? [])
    .map((m) => m.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  return [...new Set(ids)]
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({ id, tier: 'paid' as const }))
}

export async function fetchProviderModels(
  provider: CatalogProvider,
  apiKey: string,
  openaiCompatibleBaseUrl?: string,
): Promise<ModelCatalogEntry[]> {
  if (provider === 'openai_compatible') {
    if (!openaiCompatibleBaseUrl?.trim()) {
      throw new Error('Base URL is missing')
    }
    return fetchOpenAiCompatibleModels(apiKey, openaiCompatibleBaseUrl)
  }

  if (!apiKey.trim()) {
    throw new Error('API key is missing')
  }

  if (provider === 'openrouter') {
    return fetchOpenRouterModels(apiKey)
  }

  if (provider === 'anthropic') {
    return fetchAnthropicModels(apiKey)
  }

  return fetchGroqModels(apiKey)
}
