import type { PromptVariable } from '../schemas'

export type VariableFormat = 'text' | 'code' | 'multiline'

const CODE_NAMES = new Set(['code', 'diff', 'patch', 'snippet'])
const MULTILINE_NAMES = new Set(['context', 'description', 'text', 'question', 'notes', 'requirements'])

export function inferVariableFormat(name: string): VariableFormat {
  if (CODE_NAMES.has(name)) return 'code'
  if (MULTILINE_NAMES.has(name)) return 'multiline'
  return 'text'
}

export function resolveVariableFormat(v: PromptVariable): VariableFormat {
  if (v.format) return v.format
  return inferVariableFormat(v.name)
}
