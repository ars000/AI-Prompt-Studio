import type { Collection, Prompt } from '../schemas'

/** Синхронизирует collection.promptIds с prompt.collectionIds (источник истины — промт). */
export function rebuildCollectionPromptIds(
  collections: Record<string, Collection>,
  prompts: Record<string, Prompt>,
): Record<string, Collection> {
  const idsByCollection = new Map<string, string[]>()
  for (const col of Object.values(collections)) {
    idsByCollection.set(col.id, [])
  }

  for (const prompt of Object.values(prompts)) {
    for (const cid of prompt.collectionIds) {
      if (!idsByCollection.has(cid)) continue
      idsByCollection.get(cid)!.push(prompt.id)
    }
  }

  const next: Record<string, Collection> = {}
  for (const [id, col] of Object.entries(collections)) {
    const promptIds = idsByCollection.get(id) ?? []
    promptIds.sort()
    next[id] = { ...col, promptIds }
  }
  return next
}

export function promptIdsInCollection(
  collectionId: string,
  prompts: Record<string, Prompt>,
): string[] {
  return Object.values(prompts)
    .filter((p) => p.collectionIds.includes(collectionId))
    .map((p) => p.id)
    .sort()
}
