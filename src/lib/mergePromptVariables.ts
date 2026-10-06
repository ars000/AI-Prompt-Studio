import { inferVariableFormat } from './variableFormat'
import { parseVariablesFromBody } from './variables'
import type { PromptVariable } from '../schemas'

/** Сохраняет метаданные переменных из оптимизатора, синхронизируя с {{именами}} в body */
export function mergePromptVariables(body: string, declared: PromptVariable[]): PromptVariable[] {
  const names = parseVariablesFromBody(body)
  const byName = new Map(declared.map((v) => [v.name, v]))
  const inBody = names.map(
    (name) =>
      byName.get(name) ?? {
        name,
        description: '',
        defaultValue: '',
        format: inferVariableFormat(name),
      },
  )
  for (const v of declared) {
    if (!names.includes(v.name)) inBody.push(v)
  }
  return inBody
}
