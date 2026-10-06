import { getProviderDefinition } from '../../lib/aiProviders/registry'
import { dominantScript } from '../../lib/promptLanguage'
import { mockCompletionDelayMs } from '../../lib/mockTiming'
import type { AiProvider } from '../../schemas'
import { runWithFallback } from './runPrompt'

const TRANSLATE_SYSTEM = `You translate text into English for image generation models (Midjourney, Stable Diffusion, DALL·E, Flux).
Rules:
- Output ONLY the translated prompt text — no markdown, no quotes, no explanation.
- Preserve line breaks and section structure (Subject/Style/Lighting/Negative prompt labels in English).
- Keep aspect ratios, numbers, and model-specific tokens unchanged.
- Use natural, concise image-prompt English.`

export type TranslateImagePromptOptions = {
  provider: AiProvider
  model: string
  apiKey?: string
  openAiBaseUrl?: string
  useMockWhenNoKey: boolean
}

function shouldUseMockTranslate(options: TranslateImagePromptOptions): boolean {
  if (options.provider === 'mock') return true
  if (!options.useMockWhenNoKey) return false
  if (options.provider === 'openai_compatible') return !options.openAiBaseUrl?.trim()
  const def = getProviderDefinition(options.provider)
  return def.needsApiKey && !options.apiKey?.trim()
}

function stripModelWrapper(text: string): string {
  const t = text.trim()
  const fenced = t.match(/^```(?:\w*\n)?([\s\S]*?)```$/m)
  if (fenced?.[1]) return fenced[1].trim()
  return t.replace(/^\[Mock AI[^\]]*\][\s\S]*?---\n\n/s, '').trim() || t
}

/** Упрощённый mock: подписи секций + пометка, если кириллица осталась */
async function mockTranslateImagePrompt(text: string): Promise<string> {
  await new Promise((r) => setTimeout(r, mockCompletionDelayMs()))
  let out = text
    .replace(/^Объект:\s*/gim, 'Subject: ')
    .replace(/^Стиль:\s*/gim, 'Style: ')
    .replace(/^Освещение:\s*/gim, 'Lighting: ')
    .replace(/^Соотношение сторон:\s*/gim, 'Aspect ratio: ')
    .replace(/^Негативный промпт:\s*/gim, 'Negative prompt: ')
    .replace(/^Негатив:\s*/gim, 'Negative prompt: ')

  if (dominantScript(out) === 'cyrillic') {
    out = `${out}\n\n[Mock: подключите API в настройках — описательный текст не переведён автоматически]`
  }
  return out
}

export async function translateImagePromptToEnglish(
  promptText: string,
  options: TranslateImagePromptOptions,
): Promise<{ text: string; usedMock: boolean; alreadyEnglish: boolean }> {
  const trimmed = promptText.trim()
  if (!trimmed) {
    throw new Error('Нет текста для перевода')
  }
  if (dominantScript(trimmed) === 'latin') {
    return { text: trimmed, usedMock: false, alreadyEnglish: true }
  }

  if (shouldUseMockTranslate(options)) {
    return { text: await mockTranslateImagePrompt(trimmed), usedMock: true, alreadyEnglish: false }
  }

  const completion = await runWithFallback(
    {
      provider: options.provider,
      model: options.model,
      apiKey: options.apiKey,
      openAiBaseUrl: options.openAiBaseUrl,
      systemMessage: TRANSLATE_SYSTEM,
      userMessage: trimmed,
    },
    { useMockWhenNoKey: false },
  )

  const translated = stripModelWrapper(completion.content)
  if (!translated) {
    throw new Error('Пустой ответ перевода')
  }
  return {
    text: translated,
    usedMock: completion.provider === 'mock',
    alreadyEnglish: false,
  }
}
