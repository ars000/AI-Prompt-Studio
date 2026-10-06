import type { AiProvider } from '../../schemas'
import { getProviderDefinition } from './registry'

export function resolveOpenAiChatUrl(
  provider: AiProvider,
  openaiCompatibleBaseUrl?: string,
): string {
  if (provider === 'openai_compatible') {
    const base = (openaiCompatibleBaseUrl ?? '').trim().replace(/\/+$/, '')
    if (!base) {
      throw new Error('Укажите Base URL для OpenAI-compatible провайдера в настройках')
    }
    return `${base}/v1/chat/completions`
  }

  const def = getProviderDefinition(provider)
  if (!def.chatCompletionsUrl) {
    throw new Error(`Provider ${provider} has no chat completions URL`)
  }
  return def.chatCompletionsUrl
}

export function resolveOpenAiModelsUrl(openaiCompatibleBaseUrl: string): string {
  const base = openaiCompatibleBaseUrl.trim().replace(/\/+$/, '')
  if (!base) throw new Error('Base URL is missing')
  return `${base}/v1/models`
}
