import { describe, expect, it } from 'vitest'
import { rebuildCollectionPromptIds, promptIdsInCollection } from './collectionSync'

describe('collectionSync', () => {
  it('rebuilds promptIds from prompt.collectionIds', () => {
    const collections = {
      c1: { id: 'c1', name: 'A', description: '', promptIds: [] as string[] },
    }
    const prompts = {
      p1: {
        id: 'p1',
        title: 'T',
        kind: 'text' as const,
        body: '',
        variables: [],
        tags: [],
        collectionIds: ['c1'],
        currentVersionId: 'v1',
        createdAt: '',
        updatedAt: '',
      },
    }
    const next = rebuildCollectionPromptIds(collections, prompts)
    expect(next.c1!.promptIds).toEqual(['p1'])
    expect(promptIdsInCollection('c1', prompts)).toEqual(['p1'])
  })
})
