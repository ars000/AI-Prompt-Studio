import { mockCompletionDelayMs } from '../../lib/mockTiming'
import type { CompletionRequest, CompletionResult } from './types'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function mockComplete(req: CompletionRequest): Promise<CompletionResult> {
  const start = performance.now()
  await delay(mockCompletionDelayMs())

  const preview = req.userMessage.slice(0, 400)
  const content = `[Mock AI — ${req.model}]

Это симулированный ответ. Реальный провайдер не вызывался.

---
**Подставленный промпт:**
${preview}${req.userMessage.length > 400 ? '…' : ''}

---
*Подключите OpenRouter или Groq в настройках для живых ответов.*`

  return {
    content,
    latencyMs: Math.round(performance.now() - start),
    model: req.model,
    provider: 'mock',
    usage: { promptTokens: Math.ceil(req.userMessage.length / 4), completionTokens: 120 },
  }
}
