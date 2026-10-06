import { optimizerResultSchema, type OptimizerResult } from '../schemas'

export function extractJsonFromModelText(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) return text.slice(start, end + 1)

  return text.trim()
}

export function parseOptimizerResult(text: string): OptimizerResult {
  const raw = extractJsonFromModelText(text)
  const json: unknown = JSON.parse(raw)
  return optimizerResultSchema.parse(json)
}
