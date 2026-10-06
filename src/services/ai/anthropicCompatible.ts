import type { CompletionRequest, CompletionResult } from './types'
import { AiProviderError } from './types'

type AnthropicResponse = {
  content?: { type: string; text?: string }[]
  error?: { type?: string; message?: string }
  usage?: { input_tokens?: number; output_tokens?: number }
}

export async function anthropicComplete(req: CompletionRequest): Promise<CompletionResult> {
  if (!req.apiKey?.trim()) {
    throw new AiProviderError('API key is missing', 'anthropic')
  }

  const start = performance.now()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': req.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: 4096,
      ...(req.systemMessage ? { system: req.systemMessage } : {}),
      messages: [{ role: 'user', content: req.userMessage }],
    }),
  })

  const data = (await res.json()) as AnthropicResponse
  if (!res.ok) {
    throw new AiProviderError(
      data.error?.message ?? `HTTP ${res.status}`,
      'anthropic',
    )
  }

  const content =
    data.content
      ?.filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('') ?? ''

  return {
    content,
    latencyMs: Math.round(performance.now() - start),
    model: req.model,
    provider: 'anthropic',
    usage: {
      promptTokens: data.usage?.input_tokens,
      completionTokens: data.usage?.output_tokens,
    },
  }
}
