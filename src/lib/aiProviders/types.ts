import type { AiProvider } from '../../schemas'

/** Как отправляется запрос к API */
export type ProviderTransport = 'mock' | 'openai-chat' | 'anthropic-messages'

export type ProviderSettingsField =
  | 'openRouterKey'
  | 'groqKey'
  | 'anthropicKey'
  | 'openaiCompatibleKey'

export type AiProviderDefinition = {
  id: AiProvider
  label: string
  shortHint: string
  transport: ProviderTransport
  needsApiKey: boolean
  /** Загрузка списка моделей с API (нужен ключ / base URL) */
  supportsModelCatalog: boolean
  defaultModel: string
  settingsKey?: ProviderSettingsField
  /** Для transport openai-chat с фиксированным хостом */
  chatCompletionsUrl?: string
  extraHeaders?: Record<string, string>
  /** Показывать отдельную секцию в настройках */
  showInSettings: boolean
}

export type CatalogProvider = Exclude<AiProvider, 'mock'>
