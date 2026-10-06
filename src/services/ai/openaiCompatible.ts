import type { AiProvider } from '../../schemas'
import type { CompletionRequest, CompletionResult } from './types'
import { AiProviderError } from './types'

type ChatResponse = {
  choices?: { message?: { content?: string } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
  error?: { message?: string }
}

type ChatCompleteOptions = {
  /** Локальный Ollama и аналоги без Bearer */
  apiKeyOptional?: boolean
}

export async function chatComplete(
  req: CompletionRequest,
  endpoint: string,
  provider: AiProvider,
  extraHeaders: Record<string, string> = {},
  options: ChatCompleteOptions = {},
): Promise<CompletionResult> {
  const key = req.apiKey?.trim()
  if (!options.apiKeyOptional && !key) {
    throw new AiProviderError('API key is missing', provider)
  }

  const start = performance.now()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
  if (key) headers.Authorization = `Bearer ${key}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: req.model,
      messages: [
        ...(req.systemMessage
          ? [{ role: 'system' as const, content: req.systemMessage }]
          : []),
        { role: 'user' as const, content: req.userMessage },
      ],
    }),
  })

  const data = (await res.json()) as ChatResponse
  if (!res.ok) {
    throw new AiProviderError(
      data.error?.message ?? `HTTP ${res.status}`,
      provider,
    )
  }

  const content = data.choices?.[0]?.message?.content ?? ''
  return {
    content,
    latencyMs: Math.round(performance.now() - start),
    model: req.model,
    provider,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    },
  }
}
