import type { AiProvider, Settings } from '../../schemas'
import { getProviderApiKey } from './registry'

export function buildCompletionContext(
  settings: Settings,
  provider: AiProvider,
): { apiKey?: string; openAiBaseUrl?: string } {
  const apiKey = getProviderApiKey(settings, provider).trim()
  return {
    apiKey: apiKey || undefined,
    openAiBaseUrl:
      provider === 'openai_compatible' ? settings.openaiCompatibleBaseUrl.trim() : undefined,
  }
}
