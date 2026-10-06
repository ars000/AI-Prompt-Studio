import { getProviderDefinition } from '../../lib/aiProviders/registry'
import {
  buildImageOptimizerLanguageBlock,
  isEnglishLanguageHint,
  resolveImagePromptLanguage,
  shouldWarnImageNonEnglish,
  type ImagePromptTarget,
} from '../../lib/promptLanguage'
import { mockCompletionDelayMs } from '../../lib/mockTiming'
import type { AiProvider, PromptKind, PromptVariable } from '../../schemas'
import { parseOptimizerResult } from '../../lib/parseOptimizerJson'
import type { OptimizerResult } from '../../schemas'
import { runWithFallback } from './runPrompt'

export const OPTIMIZER_SYSTEM_PROMPT = `Ты эксперт по prompt engineering. Пользователь даёт сырой запрос на естественном языке.
Верни ТОЛЬКО один JSON-объект (без markdown вокруг, без комментариев) со структурой:
{
  "title": "краткое название промпта",
  "kind": "text" | "code" | "image",
  "body": "готовый промпт с переменными {{name}} в нужных местах",
  "variables": [
    { "name": "snake_case", "description": "...", "defaultValue": "...", "format": "text"|"code"|"multiline" (optional) }
  ],
  "tags": ["..."],
  "explanation": "2-4 предложения: что улучшено (роль, формат, переменные)",
  "tips": ["совет новичку 1", "совет 2"]
}
Правила:
- variables[].name должны совпадать с {{name}} в body
- для code review / кода kind=code, переменная code с format code
- для kind=image: body и variables[].defaultValue — на языке, указанном пользователем; variables[].description — на русском; язык body и defaultValue должен совпадать (не английские значения при русском шаблоне и наоборот)
- explanation и tips на русском
- body самодостаточен для LLM`

export type OptimizePromptInput = {
  rawRequest: string
  kindHint?: PromptKind | 'auto'
  outputLanguage?: string
  imagePromptTarget?: ImagePromptTarget
  refineExistingBody?: string
  refineTitle?: string
  refineVariables?: PromptVariable[]
}

function resolvedOutputLanguage(input: OptimizePromptInput): string | undefined {
  const kind = effectiveKindHint(input)
  if (kind === 'image' && input.imagePromptTarget) {
    return resolveImagePromptLanguage(input.imagePromptTarget, input.outputLanguage ?? '')
  }
  return input.outputLanguage
}

function effectiveKindHint(input: OptimizePromptInput): PromptKind | 'auto' | undefined {
  if (input.kindHint && input.kindHint !== 'auto') return input.kindHint
  if (/midjourney|stable diffusion|dall[-·]?e|flux|генерац.*(изображ|картин)|image prompt/i.test(input.rawRequest)) {
    return 'image'
  }
  return input.kindHint
}

function buildUserMessage(input: OptimizePromptInput): string {
  const kind = effectiveKindHint(input)
  const lang = resolvedOutputLanguage(input)
  const languageLine =
    kind === 'image' && lang
      ? buildImageOptimizerLanguageBlock(lang)
      : lang
        ? `Язык ответов модели по промпту: ${lang}`
        : ''

  const parts = [
    `Сырой запрос пользователя:\n${input.rawRequest.trim()}`,
    kind && kind !== 'auto' ? `Предпочтительный тип промпта: ${kind}` : '',
    languageLine,
    input.refineTitle ? `Название промпта в библиотеке: ${input.refineTitle}` : '',
    input.refineExistingBody
      ? `Текущий шаблон промпта (улучши его, не выбрасывай смысл):\n${input.refineExistingBody}`
      : '',
    input.refineVariables?.length
      ? `Текущие переменные:\n${input.refineVariables
          .map((v) => `- {{${v.name}}}: ${v.description || 'без описания'} (default: ${v.defaultValue || '—'})`)
          .join('\n')}`
      : '',
  ]
  return parts.filter(Boolean).join('\n\n')
}

function postProcessOptimizerResult(
  result: OptimizerResult,
  input: OptimizePromptInput,
): OptimizerResult {
  if (result.kind !== 'image') return result
  if (input.imagePromptTarget === 'en_generators') return result
  const lang = resolvedOutputLanguage(input)
  if (!lang?.trim()) return result
  if (!shouldWarnImageNonEnglish(lang)) return result

  const tip =
    'Перед отправкой в Midjourney / Stable Diffusion / DALL·E переведите итоговый prompt на английский — так результат обычно стабильнее.'
  if (result.tips.some((t) => /английск|Midjourney|DALL/i.test(t))) return result
  return { ...result, tips: [...result.tips, tip] }
}

export function mockOptimizerResult(input: OptimizePromptInput): OptimizerResult {
  const raw = input.rawRequest.trim()
  const existing = input.refineExistingBody?.trim()

  if (existing) {
    const title =
      input.refineTitle?.trim() ||
      raw.slice(0, 48) ||
      'Оптимизированный промпт'
    const kind =
      input.kindHint && input.kindHint !== 'auto'
        ? input.kindHint
        : /code review|ревью|review|```/i.test(existing)
          ? 'code'
          : 'text'

    const body =
      kind === 'text' && !/^ты |^you /i.test(existing)
        ? `Ты полезный assistant. Следуй инструкциям ниже.\n\n${existing}`
        : existing

    return {
      title,
      kind,
      body,
      variables:
        input.refineVariables?.length
          ? input.refineVariables.map((v) => ({ ...v }))
          : [],
      tags: ['optimized', 'refined'],
      explanation:
        'Mock: сохранён текст исходного промпта, добавлена явная роль там, где её не хватало. Подключите API для глубокой переработки.',
      tips: [
        'Проверьте переменные {{…}} в тексте после сохранения.',
        'Используйте «Обновить исходный промпт», чтобы не плодить дубликаты.',
      ],
    }
  }

  const isCode = /code review|ревью|review|код/i.test(raw) || input.kindHint === 'code'
  const isImage =
    input.kindHint === 'image' ||
    /midjourney|stable diffusion|dall|flux|генерац.*(изображ|картин)|image prompt/i.test(raw)

  if (isImage && !isCode) {
    const lang = resolvedOutputLanguage(input) ?? input.outputLanguage ?? 'английском'
    const en = isEnglishLanguageHint(lang)
    if (en) {
      return {
        title: raw.slice(0, 48) || 'Image prompt',
        kind: 'image',
        body: `Subject: {{subject}}
Style: {{style}}
Lighting: {{lighting}}
Aspect ratio: {{aspect_ratio}}
Negative prompt: {{negative}}`,
        variables: [
          { name: 'subject', description: 'Главный объект', defaultValue: 'portrait of a cat astronaut' },
          { name: 'style', description: 'Стиль', defaultValue: 'cinematic, highly detailed' },
          { name: 'lighting', description: 'Свет', defaultValue: 'soft rim light' },
          { name: 'aspect_ratio', description: 'Соотношение сторон', defaultValue: '16:9' },
          { name: 'negative', description: 'Negative prompt', defaultValue: 'blurry, low quality' },
        ],
        tags: ['image', 'optimized'],
        explanation:
          'Mock: структура subject / style / lighting / negative — типичный каркас для генераторов; текст на английском, как в большинстве моделей.',
        tips: [
          'Подставьте значения на вкладке «Переменные» и проверьте preview.',
          'Подключите API в настройках для персональной переработки под ваш запрос.',
        ],
      }
    }

    return {
      title: raw.slice(0, 48) || 'Промпт для изображения',
      kind: 'image',
      body: `Объект: {{subject}}
Стиль: {{style}}
Освещение: {{lighting}}
Соотношение сторон: {{aspect_ratio}}
Негативный промпт: {{negative}}`,
      variables: [
        { name: 'subject', description: 'Главный объект', defaultValue: 'портрет кота-космонавта' },
        { name: 'style', description: 'Стиль', defaultValue: 'кинематографичный, детализированный' },
        { name: 'lighting', description: 'Свет', defaultValue: 'мягкий контровой свет' },
        { name: 'aspect_ratio', description: 'Соотношение сторон', defaultValue: '16:9' },
        { name: 'negative', description: 'Негативный промпт', defaultValue: 'размытие, низкое качество' },
      ],
      tags: ['image', 'optimized'],
      explanation:
        'Mock: секции и значения переменных на выбранном языке; перед отправкой в генератор может понадобиться перевод на английский.',
      tips: [
        'Перед Midjourney / SD / DALL·E переведите итоговый prompt на английский — так результат обычно стабильнее.',
        'Проверьте preview на вкладке «Редактор» после сохранения.',
      ],
    }
  }

  if (isCode) {
    return {
      title: 'Code review (оптимизировано)',
      kind: 'code',
      body: `Ты senior-разработчик. Проведи code review.

**Язык:** {{language}}
**Стек:** {{framework}}
**Фокус:** {{focus}}

## Код
\`\`\`{{language}}
{{code}}
\`\`\`

Структура ответа: резюме → критичные проблемы → рекомендации → плюсы. Предлагай правки с фрагментами кода.`,
      variables: [
        { name: 'language', description: 'Язык', defaultValue: 'TypeScript', format: 'text' },
        { name: 'framework', description: 'Стек', defaultValue: 'React', format: 'text' },
        { name: 'focus', description: 'Фокус ревью', defaultValue: 'баги, безопасность, читаемость', format: 'text' },
        { name: 'code', description: 'Код для ревью', defaultValue: '', format: 'code' },
      ],
      tags: ['code', 'review', 'optimized'],
      explanation:
        'Добавлены роль, структура ответа, переменные для языка/стека и отдельное поле для кода — один шаблон на разные PR.',
      tips: [
        'Вставьте код на вкладке «Ревью» после сохранения.',
        'Сохраняйте новую версию промпта, когда меняете инструкции ревьюера.',
      ],
    }
  }

  return {
    title: raw.slice(0, 48) || 'Оптимизированный промпт',
    kind: 'text',
    body: `Ты полезный ассistant. Ответь на {{language}} языке.

Задача пользователя:
{{task}}

Формат ответа:
- краткое резюме
- основной ответ по пунктам
- при необходимости — пример

Ограничения: {{constraints}}`,
    variables: [
      {
        name: 'language',
        description: 'Язык ответа',
        defaultValue: resolvedOutputLanguage(input) || input.outputLanguage || 'русском',
        format: 'text',
      },
      { name: 'task', description: 'Суть задачи', defaultValue: raw, format: 'multiline' },
      { name: 'constraints', description: 'Ограничения', defaultValue: 'без воды, до 300 слов', format: 'text' },
    ],
    tags: ['optimized', 'text'],
    explanation:
      'Сырой запрос разбит на роль, задачу и формат ответа; повторяющиеся части вынесены в {{переменные}} для переиспользования.',
    tips: [
      'Проверьте preview подстановки на вкладке «Редактор».',
      'Запустите тест с Mock, затем подключите Groq/OpenRouter в настройках.',
    ],
  }
}

export type OptimizePromptOptions = {
  provider: AiProvider
  model: string
  apiKey?: string
  openAiBaseUrl?: string
  useMockWhenNoKey: boolean
}

function shouldUseMockOptimizer(options: OptimizePromptOptions): boolean {
  if (options.provider === 'mock') return true
  if (!options.useMockWhenNoKey) return false
  if (options.provider === 'openai_compatible') return !options.openAiBaseUrl?.trim()
  const def = getProviderDefinition(options.provider)
  return def.needsApiKey && !options.apiKey?.trim()
}

export async function optimizePrompt(
  input: OptimizePromptInput,
  options: OptimizePromptOptions,
): Promise<{ result: OptimizerResult; rawResponse: string; usedMock: boolean }> {
  if (shouldUseMockOptimizer(options)) {
    await new Promise((r) => setTimeout(r, mockCompletionDelayMs()))
    const result = postProcessOptimizerResult(mockOptimizerResult(input), input)
    return {
      result,
      rawResponse: JSON.stringify(result, null, 2),
      usedMock: true,
    }
  }

  try {
    const completion = await runWithFallback(
      {
        provider: options.provider,
        model: options.model,
        apiKey: options.apiKey,
        openAiBaseUrl: options.openAiBaseUrl,
        systemMessage: OPTIMIZER_SYSTEM_PROMPT,
        userMessage: buildUserMessage(input),
      },
      { useMockWhenNoKey: false },
    )

    try {
      const result = postProcessOptimizerResult(parseOptimizerResult(completion.content), input)
      return { result, rawResponse: completion.content, usedMock: completion.provider === 'mock' }
    } catch {
      const fallback = postProcessOptimizerResult(mockOptimizerResult(input), input)
      return {
        result: fallback,
        rawResponse: completion.content,
        usedMock: true,
      }
    }
  } catch (err) {
    const fallback = postProcessOptimizerResult(mockOptimizerResult(input), input)
    return {
      result: fallback,
      rawResponse: err instanceof Error ? err.message : String(err),
      usedMock: true,
    }
  }
}
