export type ModelTier = 'free' | 'paid' | 'unknown'

export type ModelCatalogEntry = {
  id: string
  tier: ModelTier
}

export type ModelCatalog = {
  openrouter: ModelCatalogEntry[]
  groq: ModelCatalogEntry[]
  anthropic: ModelCatalogEntry[]
  openai_compatible: ModelCatalogEntry[]
}

export const emptyModelCatalog: ModelCatalog = {
  openrouter: [],
  groq: [],
  anthropic: [],
  openai_compatible: [],
}

export function catalogIds(entries: ModelCatalogEntry[]): string[] {
  return entries.map((e) => e.id)
}

/** Старый persist: string[] → entries */
export function normalizeCatalogProvider(
  items: ModelCatalogEntry[] | string[] | undefined,
): ModelCatalogEntry[] {
  if (!items?.length) return []
  if (typeof items[0] === 'string') {
    return (items as string[]).map((id) => ({ id, tier: 'unknown' as const }))
  }
  return items as ModelCatalogEntry[]
}
