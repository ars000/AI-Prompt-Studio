/** Куда пойдёт промпт: EN-генераторы или свой язык в шаблоне */
export type ImagePromptTarget = 'en_generators' | 'custom'

export const IMAGE_PROMPT_TARGET_LABELS: Record<ImagePromptTarget, string> = {
  en_generators: 'Midjourney / SD / DALL·E (английский)',
  custom: 'Свой язык в шаблоне',
}

export const PROMPT_TEXT_LANGUAGE_OPTIONS = [
  { value: 'русском', label: 'Русский' },
  { value: 'английском', label: 'English' },
] as const

export type PromptTextLanguageValue = (typeof PROMPT_TEXT_LANGUAGE_OPTIONS)[number]['value']

export function normalizePromptTextLanguage(language: string): PromptTextLanguageValue {
  return isEnglishLanguageHint(language) ? 'английском' : 'русском'
}

export function resolveImagePromptLanguage(
  target: ImagePromptTarget,
  customLanguage: string,
): string {
  if (target === 'en_generators') return 'английском'
  return normalizePromptTextLanguage(customLanguage)
}

/** Пользовательский ввод «язык ответа / промпта» — свободная строка */
export function isEnglishLanguageHint(language: string): boolean {
  const s = language.trim().toLowerCase()
  if (!s) return false
  return s === 'en' || s === 'eng' || s.includes('english') || s.includes('англ')
}

/** Генераторы картинок в подсказках считаем English-first */
export const IMAGE_GENERATORS_ENGLISH_NOTE =
  'Midjourney, Stable Diffusion, DALL·E, Flux и большинство API генерации изображений надёжнее работают с промптом на английском. Русский (и другие языки) можно оставить в шаблоне для удобства — перед отправкой в генератор часто нужен перевод.'

export function shouldWarnImageNonEnglish(outputLanguage: string): boolean {
  return !isEnglishLanguageHint(outputLanguage)
}

function cyrillicLetterCount(text: string): number {
  return (text.match(/[\u0400-\u04FF]/g) ?? []).length
}

function latinLetterCount(text: string): number {
  return (text.match(/[a-zA-Z]/g) ?? []).length
}

/** Эвристика: в тексте преобладает кириллица или латиница */
export function dominantScript(text: string): 'cyrillic' | 'latin' | 'neutral' {
  const cyr = cyrillicLetterCount(text)
  const lat = latinLetterCount(text)
  if (cyr === 0 && lat === 0) return 'neutral'
  if (cyr >= lat * 1.2) return 'cyrillic'
  if (lat >= cyr * 1.2) return 'latin'
  return 'neutral'
}

export function variableDefaultsMismatchBody(
  body: string,
  variables: { defaultValue: string }[],
): boolean {
  const bodyScript = dominantScript(body)
  if (bodyScript === 'neutral') return false
  return variables.some((v) => {
    const val = v.defaultValue.trim()
    if (!val) return false
    const valScript = dominantScript(val)
    return valScript !== 'neutral' && valScript !== bodyScript
  })
}

export function buildImageOptimizerLanguageBlock(outputLanguage: string): string {
  const lang = outputLanguage.trim() || 'русском'
  const en = isEnglishLanguageHint(lang)
  return [
    'Тип промпта: image (генерация изображений).',
    `Язык текста промпта (поля body и variables[].defaultValue): ${lang}.`,
    en
      ? 'Пиши body и все defaultValue строго на английском (кроме имён переменных {{snake_case}}).'
      : `Пиши body (включая подписи секций) и все defaultValue на том же языке, что «${lang}» — не смешивай с английским без необходимости.`,
    'variables[].description оставь на русском (для UI редактора).',
    en
      ? ''
      : 'В tips добавь напоминание: перед Midjourney/SD/DALL·E финальный prompt лучше перевести на английский.',
  ]
    .filter(Boolean)
    .join('\n')
}
