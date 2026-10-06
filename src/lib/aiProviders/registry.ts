import type { AiProvider, Settings } from '../../schemas'
import type { AiProviderDefinition, CatalogProvider } from './types'

export const AI_PROVIDER_DEFINITIONS: AiProviderDefinition[] = [
  {
    id: 'mock',
    label: 'Mock',
    shortHint: 'Локальная симуляция без сети и API-ключей',
    transport: 'mock',
    needsApiKey: false,
    supportsModelCatalog: false,
    defaultModel: 'mock-gpt',
    showInSettings: false,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    shortHint: 'Один ключ — доступ к GPT, Claude, Gemini, Llama, Mistral и др.',
    transport: 'openai-chat',
    needsApiKey: true,
    supportsModelCatalog: true,
    defaultModel: 'openai/gpt-4o-mini',
    settingsKey: 'openRouterKey',
    chatCompletionsUrl: 'https://openrouter.ai/api/v1/chat/completions',
    extraHeaders: {},
    showInSettings: true,
  },
  {
    id: 'groq',
    label: 'Groq',
    shortHint: 'Очень быстрый inference для open-weight моделей (нужен ключ Groq)',
    transport: 'openai-chat',
    needsApiKey: true,
    supportsModelCatalog: true,
    defaultModel: 'llama-3.3-70b-versatile',
    settingsKey: 'groqKey',
    chatCompletionsUrl: 'https://api.groq.com/openai/v1/chat/completions',
    showInSettings: true,
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    shortHint: 'Официальный API Claude (ключ console.anthropic.com)',
    transport: 'anthropic-messages',
    needsApiKey: true,
    supportsModelCatalog: true,
    defaultModel: 'claude-sonnet-4-20250514',
    settingsKey: 'anthropicKey',
    showInSettings: true,
  },
  {
    id: 'openai_compatible',
    label: 'OpenAI-compatible',
    shortHint: 'OpenAI, Ollama, LM Studio, Mistral, NVIDIA NIM — свой Base URL',
    transport: 'openai-chat',
    needsApiKey: false,
    supportsModelCatalog: true,
    defaultModel: 'llama3.2',
    settingsKey: 'openaiCompatibleKey',
    showInSettings: true,
  },
]

const byId = new Map<AiProvider, AiProviderDefinition>(
  AI_PROVIDER_DEFINITIONS.map((d) => [d.id, d]),
)

export function getProviderDefinition(id: AiProvider): AiProviderDefinition {
  const def = byId.get(id)
  if (!def) throw new Error(`Unknown provider: ${id}`)
  return def
}

export function listSelectableProviders(): AiProviderDefinition[] {
  return AI_PROVIDER_DEFINITIONS
}

export function listSettingsProviders(): AiProviderDefinition[] {
  return AI_PROVIDER_DEFINITIONS.filter((d) => d.showInSettings)
}

export function listCatalogProviders(): CatalogProvider[] {
  return AI_PROVIDER_DEFINITIONS.filter(
    (d): d is AiProviderDefinition & { id: CatalogProvider } =>
      d.supportsModelCatalog && d.id !== 'mock',
  ).map((d) => d.id)
}

export function providerNeedsApiKey(id: AiProvider): boolean {
  return getProviderDefinition(id).needsApiKey
}

/** Есть ли всё нужное для реального запроса (не Mock) */
export function isProviderConfigured(settings: Settings, id: AiProvider): boolean {
  if (id === 'mock') return true
  if (id === 'openai_compatible') {
    return Boolean(settings.openaiCompatibleBaseUrl.trim())
  }
  return Boolean(getProviderApiKey(settings, id).trim())
}

/** OpenAI-compatible с пустым ключом (локальный Ollama) — ключ не обязателен */
export function providerRequiresKeyForRequest(id: AiProvider, settings: Settings): boolean {
  if (id === 'openai_compatible') {
    return Boolean(settings.openaiCompatibleKey.trim())
  }
  return getProviderDefinition(id).needsApiKey
}

export function getProviderApiKey(settings: Settings, id: AiProvider): string {
  const def = getProviderDefinition(id)
  if (!def.settingsKey) return ''
  return settings[def.settingsKey]
}

export const PROVIDER_NOTES = `Claude — напрямую (Anthropic) или через OpenRouter. GPT, Gemini, Grok, Mistral и др. — через OpenRouter или свой endpoint в «OpenAI-compatible» (OpenAI, Ollama, NIM…). Ключи задаются отдельно для каждого провайдера в блоке ниже.`
