import type { AiProvider } from '../../schemas'

export type CompletionRequest = {
  provider: AiProvider
  model: string
  apiKey?: string
  /** Для openai_compatible — например http://localhost:11434 */
  openAiBaseUrl?: string
  userMessage: string
  systemMessage?: string
}

export type CompletionResult = {
  content: string
  latencyMs: number
  model: string
  provider: AiProvider
  usage?: { promptTokens?: number; completionTokens?: number }
}

export class AiProviderError extends Error {
  provider: AiProvider

  constructor(message: string, provider: AiProvider) {
    super(message)
    this.name = 'AiProviderError'
    this.provider = provider
  }
}
