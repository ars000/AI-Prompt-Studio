import { getProviderDefinition } from '../../lib/aiProviders/registry'
import { resolveOpenAiChatUrl } from '../../lib/aiProviders/resolveEndpoint'
import type { AiProvider } from '../../schemas'
import { anthropicComplete } from './anthropicCompatible'
import { mockComplete } from './mockProvider'
import { chatComplete } from './openaiCompatible'
import type { CompletionRequest, CompletionResult } from './types'
import { AiProviderError } from './types'

export async function runCompletion(req: CompletionRequest): Promise<CompletionResult> {
  const def = getProviderDefinition(req.provider)

  switch (def.transport) {
    case 'mock':
      return mockComplete(req)
    case 'anthropic-messages':
      return anthropicComplete(req)
    case 'openai-chat': {
      const endpoint = resolveOpenAiChatUrl(req.provider, req.openAiBaseUrl)
      const extra: Record<string, string> = { ...(def.extraHeaders ?? {}) }
      if (req.provider === 'openrouter') {
        extra['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : ''
        extra['X-Title'] = 'AI Prompt Studio'
      }
      return chatComplete(req, endpoint, req.provider, extra, {
        apiKeyOptional: req.provider === 'openai_compatible',
      })
    }
    default:
      return mockComplete(req)
  }
}

function isKeyOrConfigMissing(req: CompletionRequest): boolean {
  if (req.provider === 'openai_compatible') {
    return !req.openAiBaseUrl?.trim()
  }
  const def = getProviderDefinition(req.provider)
  return def.needsApiKey && !req.apiKey?.trim()
}

export async function runWithFallback(
  req: CompletionRequest,
  options: { useMockWhenNoKey: boolean; fallbackProvider?: AiProvider },
): Promise<CompletionResult> {
  if (isKeyOrConfigMissing(req)) {
    if (options.useMockWhenNoKey) {
      return mockComplete({ ...req, provider: 'mock', model: 'mock-gpt' })
    }
    throw new AiProviderError(
      req.provider === 'openai_compatible' ? 'Base URL is missing' : 'API key is missing',
      req.provider,
    )
  }

  try {
    return await runCompletion(req)
  } catch (err) {
    if (options.useMockWhenNoKey && req.provider !== 'mock') {
      const mock = await mockComplete({ ...req, provider: 'mock', model: 'mock-gpt' })
      return {
        ...mock,
        content: `⚠️ Ошибка ${req.provider}: ${err instanceof Error ? err.message : String(err)}\n\n---\n\n${mock.content}`,
      }
    }
    throw err
  }
}
