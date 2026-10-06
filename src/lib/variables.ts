const VARIABLE_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g

/** Одинарные {name} → {{name}}; уже двойные не трогаем */
export function normalizeVariablePlaceholders(body: string): string {
  return body.replace(/(?<!\{)\{([a-zA-Z_][a-zA-Z0-9_]*)\}(?!\})/g, '{{$1}}')
}

export function parseVariablesFromBody(body: string): string[] {
  const names = new Set<string>()
  for (const match of body.matchAll(VARIABLE_REGEX)) {
    names.add(match[1]!)
  }
  return [...names].sort()
}

export function substituteVariables(
  body: string,
  values: Record<string, string>,
): string {
  return body.replace(VARIABLE_REGEX, (_, name: string) => {
    if (name in values) return values[name]!
    return `{{${name}}}`
  })
}

export { VARIABLE_REGEX }
