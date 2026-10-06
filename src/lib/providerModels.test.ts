import { describe, expect, it } from 'vitest'
import { getModelOptionGroups, getModelOptions, pickDefaultModel } from './providerModels'

const groqCatalog = {
  openrouter: [],
  groq: [
    { id: 'a-model', tier: 'free' as const },
    { id: 'only-one', tier: 'paid' as const },
  ],
  anthropic: [],
  openai_compatible: [],
}

describe('providerModels', () => {
  it('uses API catalog when present', () => {
    const opts = getModelOptions('groq', groqCatalog)
    expect(opts).toEqual(['a-model', 'only-one'])
  })

  it('falls back when catalog empty', () => {
    const opts = getModelOptions('groq', {
      openrouter: [],
      groq: [],
      anthropic: [],
      openai_compatible: [],
    })
    expect(opts.length).toBeGreaterThan(0)
  })

  it('pickDefaultModel prefers free when preferred missing', () => {
    const picked = pickDefaultModel('groq', 'missing-id', groqCatalog)
    expect(picked).toBe('a-model')
  })

  it('groups models by tier', () => {
    const groups = getModelOptionGroups('groq', groqCatalog)
    expect(groups.map((g) => g.tier)).toEqual(['free', 'paid'])
  })
})
