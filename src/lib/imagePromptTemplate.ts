import type { PromptVariable } from '../schemas'
import { isEnglishLanguageHint, type PromptTextLanguageValue } from './promptLanguage'

export const IMAGE_PROMPT_VARIABLE_HINTS: { name: string; descriptionRu: string }[] = [
  { name: 'subject', descriptionRu: 'Главный объект / сцена' },
  { name: 'style', descriptionRu: 'Стиль' },
  { name: 'lighting', descriptionRu: 'Освещение' },
  { name: 'aspect_ratio', descriptionRu: 'Соотношение сторон' },
  { name: 'negative', descriptionRu: 'Негативный промпт' },
]

export function defaultImagePromptBody(language: PromptTextLanguageValue | string): string {
  if (isEnglishLanguageHint(language) || language === 'английском') {
    return `Subject: {{subject}}
Style: {{style}}
Lighting: {{lighting}}
Aspect ratio: {{aspect_ratio}}
Negative prompt: {{negative}}`
  }
  return `Объект: {{subject}}
Стиль: {{style}}
Освещение: {{lighting}}
Соотношение сторон: {{aspect_ratio}}
Негативный промпт: {{negative}}`
}

export function defaultImagePromptVariables(language: PromptTextLanguageValue | string) {
  const en = isEnglishLanguageHint(language) || language === 'английском'
  return IMAGE_PROMPT_VARIABLE_HINTS.map(({ name, descriptionRu }) => ({
    name,
    description: descriptionRu,
    defaultValue:
      name === 'subject'
        ? en
          ? 'portrait of a cat astronaut'
          : 'портрет кота-космонавта'
        : name === 'style'
          ? en
            ? 'cinematic, highly detailed'
            : 'кинематографичный, детализированный'
          : name === 'lighting'
            ? en
              ? 'soft rim light'
              : 'мягкий контровой свет'
            : name === 'aspect_ratio'
              ? '16:9'
              : en
                ? 'blurry, low quality'
                : 'размытие, низкое качество',
    format: 'text' as const,
  }))
}

const LIGHTING_RE =
  /(?:soft|diffused|dramatic|rim|natural|overcast|studio)[^.]*(?:light|lighting|sky)[^.]*\.?/i
const STYLE_RE =
  /(?:realistic|photorealistic|cinematic|highly detailed|high detail|illustration|anime|oil painting)[^.]*\.?/i
const NEGATIVE_RE = /(?:avoid|no|without|negative)[^.]*\.?/i

/** Сплошной prompt → секции с {{переменными}}; смысл сохраняется в defaultValue */
export function structurePlainImagePrompt(
  plain: string,
  language: PromptTextLanguageValue | string,
): { body: string; variables: PromptVariable[] } {
  const trimmed = plain.trim()
  const body = defaultImagePromptBody(language)
  let variables = defaultImagePromptVariables(language)

  if (!trimmed) {
    return { body, variables }
  }

  let subject = trimmed
  let style = ''
  let lighting = ''
  let negative = ''

  const lightingMatch = trimmed.match(LIGHTING_RE)
  if (lightingMatch) {
    lighting = lightingMatch[0].trim().replace(/\.$/, '')
    subject = subject.replace(lightingMatch[0], ' ').replace(/\s+/g, ' ').trim()
  }

  const styleMatch = trimmed.match(STYLE_RE)
  if (styleMatch) {
    style = styleMatch[0].trim().replace(/\.$/, '')
    subject = subject.replace(styleMatch[0], ' ').replace(/\s+/g, ' ').trim()
  }

  const negativeMatch = trimmed.match(NEGATIVE_RE)
  if (negativeMatch) {
    negative = negativeMatch[0].trim().replace(/\.$/, '')
    subject = subject.replace(negativeMatch[0], ' ').replace(/\s+/g, ' ').trim()
  }

  subject = subject.replace(/\s+/g, ' ').trim() || trimmed

  variables = variables.map((v) => {
    if (v.name === 'subject') return { ...v, defaultValue: subject }
    if (v.name === 'style' && style) return { ...v, defaultValue: style }
    if (v.name === 'lighting' && lighting) return { ...v, defaultValue: lighting }
    if (v.name === 'negative' && negative) return { ...v, defaultValue: negative }
    return v
  })

  return { body, variables }
}
