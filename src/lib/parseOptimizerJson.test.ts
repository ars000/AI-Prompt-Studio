import { describe, expect, it } from 'vitest'
import { extractJsonFromModelText, parseOptimizerResult } from './parseOptimizerJson'

describe('parseOptimizerJson', () => {
  it('extracts JSON from fenced block', () => {
    const text = 'Here:\n```json\n{"title":"T","kind":"text","body":"Hi","variables":[],"tags":[],"explanation":"e","tips":[]}\n```'
    const raw = extractJsonFromModelText(text)
    expect(raw).toContain('"title":"T"')
  })

  it('parses valid optimizer payload', () => {
    const json = {
      title: 'Test',
      kind: 'text',
      body: 'Hello {{name}}',
      variables: [{ name: 'name', description: 'n', defaultValue: 'x' }],
      tags: ['t'],
      explanation: 'Because',
      tips: ['tip'],
    }
    const result = parseOptimizerResult(JSON.stringify(json))
    expect(result.title).toBe('Test')
    expect(result.body).toContain('{{name}}')
  })
})
