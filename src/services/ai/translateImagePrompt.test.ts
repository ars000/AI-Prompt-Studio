import { describe, expect, it } from 'vitest'
import { translateImagePromptToEnglish } from './translateImagePrompt'

describe('translateImagePromptToEnglish', () => {
  it('returns latin text unchanged', async () => {
    const { text, alreadyEnglish } = await translateImagePromptToEnglish('Subject: red fox', {
      provider: 'mock',
      model: 'mock-gpt',
      useMockWhenNoKey: true,
    })
    expect(alreadyEnglish).toBe(true)
    expect(text).toBe('Subject: red fox')
  })

  it('mock translates section labels', async () => {
    const { text, usedMock } = await translateImagePromptToEnglish(
      'Объект: портрет кота\nСтиль: кино',
      {
        provider: 'mock',
        model: 'mock-gpt',
        useMockWhenNoKey: true,
      },
    )
    expect(usedMock).toBe(true)
    expect(text).toContain('Subject:')
    expect(text).toContain('Style:')
  })
})
