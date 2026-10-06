import { describe, expect, it } from 'vitest'
import {
  buildImageOptimizerLanguageBlock,
  isEnglishLanguageHint,
  normalizePromptTextLanguage,
  resolveImagePromptLanguage,
  shouldWarnImageNonEnglish,
} from './promptLanguage'

describe('promptLanguage', () => {
  it('detects english hints', () => {
    expect(isEnglishLanguageHint('английском')).toBe(true)
    expect(isEnglishLanguageHint('English')).toBe(true)
    expect(isEnglishLanguageHint('русском')).toBe(false)
  })

  it('warns for non-english image language', () => {
    expect(shouldWarnImageNonEnglish('русском')).toBe(true)
    expect(shouldWarnImageNonEnglish('английском')).toBe(false)
  })

  it('resolves language from image target', () => {
    expect(resolveImagePromptLanguage('en_generators', 'русском')).toBe('английском')
    expect(resolveImagePromptLanguage('custom', 'украинською')).toBe('русском')
  })

  it('normalizes prompt text language to ru or en', () => {
    expect(normalizePromptTextLanguage('english')).toBe('английском')
    expect(normalizePromptTextLanguage('русском')).toBe('русском')
  })

  it('builds image block with matching language rule', () => {
    const ru = buildImageOptimizerLanguageBlock('русском')
    expect(ru).toContain('defaultValue')
    expect(ru).toContain('русском')
    const en = buildImageOptimizerLanguageBlock('английском')
    expect(en).toContain('строго на английском')
  })
})
