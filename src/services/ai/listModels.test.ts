import { describe, expect, it } from 'vitest'
import { classifyOpenRouterModel } from './listModels'

describe('classifyOpenRouterModel', () => {
  it('detects :free suffix', () => {
    expect(classifyOpenRouterModel({ id: 'google/gemini-2.0-flash-exp:free' })).toBe('free')
  })

  it('detects zero pricing', () => {
    expect(
      classifyOpenRouterModel({
        id: 'some/model',
        pricing: { prompt: '0', completion: '0' },
      }),
    ).toBe('free')
  })

  it('detects paid pricing', () => {
    expect(
      classifyOpenRouterModel({
        id: 'openai/gpt-4o',
        pricing: { prompt: '0.000002', completion: '0.000008' },
      }),
    ).toBe('paid')
  })
})
