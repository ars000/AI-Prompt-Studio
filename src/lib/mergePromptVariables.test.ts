import { describe, expect, it } from 'vitest'
import { mergePromptVariables } from './mergePromptVariables'

describe('mergePromptVariables', () => {
  it('keeps declared metadata for names in body', () => {
    const body = 'Hello {{name}}'
    const vars = [{ name: 'name', description: 'd', defaultValue: 'x', format: 'text' as const }]
    const merged = mergePromptVariables(body, vars)
    expect(merged[0]?.defaultValue).toBe('x')
  })

  it('retains orphan declared vars not in body', () => {
    const body = '{{a}}'
    const vars = [
      { name: 'a', description: '', defaultValue: '1' },
      { name: 'b', description: 'extra', defaultValue: '2' },
    ]
    const merged = mergePromptVariables(body, vars)
    expect(merged.some((v) => v.name === 'b')).toBe(true)
  })
})
