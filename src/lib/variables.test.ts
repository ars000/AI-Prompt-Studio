import { describe, expect, it } from 'vitest'
import { normalizeVariablePlaceholders, parseVariablesFromBody, substituteVariables } from './variables'

describe('parseVariablesFromBody', () => {
  it('extracts unique variable names', () => {
    expect(parseVariablesFromBody('{{language}} and {{framework}} {{language}}')).toEqual([
      'framework',
      'language',
    ])
  })
})

describe('normalizeVariablePlaceholders', () => {
  it('converts single braces to double', () => {
    expect(normalizeVariablePlaceholders('Объект: {subject}')).toBe('Объект: {{subject}}')
    expect(normalizeVariablePlaceholders('{{subject}}')).toBe('{{subject}}')
  })
})

describe('substituteVariables', () => {
  it('replaces placeholders', () => {
    const body = 'Hello {{name}} in {{lang}}'
    expect(substituteVariables(body, { name: 'World', lang: 'RU' })).toBe('Hello World in RU')
  })

  it('leaves unknown placeholders', () => {
    expect(substituteVariables('{{a}}', {})).toBe('{{a}}')
  })
})
