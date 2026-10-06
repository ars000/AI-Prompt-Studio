import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { newId } from '../lib/id'
import { parseVariablesFromBody } from '../lib/variables'
import { inferVariableFormat } from '../lib/variableFormat'
import { mergePromptVariables } from '../lib/mergePromptVariables'
import type {
  Collection,
  ExportBundle,
  OptimizerMeta,
  OptimizerResult,
  Prompt,
  PromptVariable,
  PromptVersion,
  TestRun,
} from '../schemas'
import { rebuildCollectionPromptIds } from '../lib/collectionSync'
import type { PromptTemplate } from '../lib/templates'

const MAX_TEST_RUNS = 100

function syncVariables(body: string, existing: PromptVariable[]): PromptVariable[] {
  const names = parseVariablesFromBody(body)
  const byName = new Map(existing.map((v) => [v.name, v]))
  return names.map(
    (name) =>
      byName.get(name) ?? {
        name,
        description: '',
        defaultValue: '',
        format: inferVariableFormat(name),
      },
  )
}

function createPromptWithVersion(
  partial: Pick<Prompt, 'title' | 'kind' | 'body' | 'variables' | 'tags'> & {
    collectionIds?: string[]
    optimizerMeta?: OptimizerMeta
  },
  initialVersionMessage = 'Initial version',
): { prompt: Prompt; version: PromptVersion } {
  const now = new Date().toISOString()
  const promptId = newId()
  const versionId = newId()
  const version: PromptVersion = {
    id: versionId,
    promptId,
    body: partial.body,
    variablesSnapshot: partial.variables,
    message: initialVersionMessage,
    label: 'v1',
    createdAt: now,
  }
  const prompt: Prompt = {
    id: promptId,
    title: partial.title,
    kind: partial.kind,
    body: partial.body,
    variables: partial.variables,
    tags: partial.tags,
    collectionIds: partial.collectionIds ?? [],
    currentVersionId: versionId,
    createdAt: now,
    updatedAt: now,
    ...(partial.optimizerMeta ? { optimizerMeta: partial.optimizerMeta } : {}),
  }
  return { prompt, version }
}

function buildOptimizerMeta(rawRequest: string, result: OptimizerResult): OptimizerMeta {
  return {
    rawRequest,
    explanation: result.explanation,
    tips: result.tips,
    optimizedAt: new Date().toISOString(),
  }
}

function payloadFromOptimizer(rawRequest: string, result: OptimizerResult) {
  const variables = mergePromptVariables(result.body, result.variables)
  const tags = [...new Set([...result.tags, 'optimized'])]
  return {
    title: result.title,
    kind: result.kind,
    body: result.body,
    variables,
    tags,
    optimizerMeta: buildOptimizerMeta(rawRequest, result),
  }
}

const demo = createPromptWithVersion({
  title: 'Приветственный промпт',
  kind: 'text',
  body: 'Ответь пользователю на {{language}}. Вопрос: {{question}}',
  variables: [
    { name: 'language', description: 'Язык ответа', defaultValue: 'русском' },
    { name: 'question', description: 'Вопрос', defaultValue: 'Что такое промпт?' },
  ],
  tags: ['demo'],
})

type MergeStrategy = 'skip' | 'replace' | 'copy'

type PromptState = {
  prompts: Record<string, Prompt>
  versions: Record<string, PromptVersion>
  collections: Record<string, Collection>
  testRuns: TestRun[]
  hydrated: boolean
  createPrompt: (
    data: Pick<Prompt, 'title' | 'kind' | 'body' | 'variables' | 'tags'> & {
      collectionIds?: string[]
      optimizerMeta?: OptimizerMeta
    },
    options?: { versionMessage?: string },
  ) => string
  applyOptimizerResult: (
    rawRequest: string,
    result: OptimizerResult,
    mode: 'create' | 'update',
    targetPromptId?: string,
  ) => string | null
  createFromTemplate: (template: PromptTemplate, collectionId?: string) => string
  updatePromptDraft: (
    id: string,
    patch: Partial<
      Pick<Prompt, 'title' | 'kind' | 'body' | 'tags' | 'variables' | 'collectionIds' | 'optimizerMeta'>
    >,
  ) => void
  saveVersion: (id: string, message: string) => void
  restoreVersion: (promptId: string, versionId: string) => void
  duplicatePrompt: (id: string) => string | null
  deletePrompt: (id: string) => void
  createCollection: (name: string, description?: string) => string
  updateCollection: (id: string, patch: Partial<Pick<Collection, 'name' | 'description' | 'promptIds'>>) => void
  deleteCollection: (id: string) => void
  addTestRun: (run: Omit<TestRun, 'id' | 'createdAt'>) => void
  getVersionsForPrompt: (promptId: string) => PromptVersion[]
  exportAll: () => ExportBundle
  exportCollection: (collectionId: string) => ExportBundle | null
  importBundle: (bundle: ExportBundle, strategy: MergeStrategy) => void
  clearAllData: () => void
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      prompts: { [demo.prompt.id]: demo.prompt },
      versions: { [demo.version.id]: demo.version },
      collections: {},
      testRuns: [],
      hydrated: false,

      createPrompt: (data, options) => {
        const variables = data.optimizerMeta
          ? mergePromptVariables(data.body, data.variables)
          : syncVariables(data.body, data.variables)
        const { prompt, version } = createPromptWithVersion(
          { ...data, variables },
          options?.versionMessage ?? 'Initial version',
        )
        set((s) => {
          const prompts = { ...s.prompts, [prompt.id]: prompt }
          return {
            prompts,
            versions: { ...s.versions, [version.id]: version },
            collections: rebuildCollectionPromptIds(s.collections, prompts),
          }
        })
        return prompt.id
      },

      applyOptimizerResult: (rawRequest, result, mode, targetPromptId) => {
        const payload = payloadFromOptimizer(rawRequest, result)
        const versionNote = `Оптимизатор: ${result.explanation.slice(0, 160)}${result.explanation.length > 160 ? '…' : ''}`

        if (mode === 'update' && targetPromptId) {
          const existing = get().prompts[targetPromptId]
          if (!existing) return null
          get().updatePromptDraft(targetPromptId, {
            title: payload.title,
            kind: payload.kind,
            body: payload.body,
            variables: payload.variables,
            tags: [...new Set([...existing.tags, ...payload.tags])],
            optimizerMeta: payload.optimizerMeta,
          })
          get().saveVersion(targetPromptId, versionNote)
          return targetPromptId
        }

        return get().createPrompt(
          {
            ...payload,
            collectionIds: [],
          },
          { versionMessage: 'Создано оптимизатором (v1)' },
        )
      },

      createFromTemplate: (template, collectionId) => {
        return get().createPrompt({
          title: template.title,
          kind: template.kind,
          body: template.body,
          variables: template.variables,
          tags: [...template.tags],
          collectionIds: collectionId ? [collectionId] : [],
        })
      },

      updatePromptDraft: (id, patch) => {
        set((s) => {
          const current = s.prompts[id]
          if (!current) return s
          const body = patch.body ?? current.body
          const variables =
            patch.variables ??
            (patch.body !== undefined ? syncVariables(body, current.variables) : current.variables)
          const updated: Prompt = {
            ...current,
            ...patch,
            body,
            variables,
            updatedAt: new Date().toISOString(),
          }
          const prompts = { ...s.prompts, [id]: updated }
          return {
            prompts,
            collections: rebuildCollectionPromptIds(s.collections, prompts),
          }
        })
      },

      saveVersion: (id, message) => {
        set((s) => {
          const current = s.prompts[id]
          if (!current) return s
          const existing = Object.values(s.versions).filter((v) => v.promptId === id)
          const versionId = newId()
          const version: PromptVersion = {
            id: versionId,
            promptId: id,
            body: current.body,
            variablesSnapshot: current.variables,
            message: message || 'Saved',
            label: `v${existing.length + 1}`,
            createdAt: new Date().toISOString(),
          }
          const updatedPrompt: Prompt = {
            ...current,
            currentVersionId: versionId,
            updatedAt: version.createdAt,
          }
          return {
            prompts: { ...s.prompts, [id]: updatedPrompt },
            versions: { ...s.versions, [versionId]: version },
          }
        })
      },

      restoreVersion: (promptId, versionId) => {
        const version = get().versions[versionId]
        if (!version || version.promptId !== promptId) return
        get().updatePromptDraft(promptId, {
          body: version.body,
          variables: version.variablesSnapshot,
        })
        get().saveVersion(promptId, `Restored from ${version.label}`)
      },

      duplicatePrompt: (id) => {
        const source = get().prompts[id]
        if (!source) return null
        return get().createPrompt({
          title: `${source.title} (копия)`,
          kind: source.kind,
          body: source.body,
          variables: source.variables.map((v) => ({ ...v })),
          tags: [...source.tags],
          collectionIds: [...source.collectionIds],
        })
      },

      deletePrompt: (id) => {
        set((s) => {
          const { [id]: _, ...prompts } = s.prompts
          const versions = Object.fromEntries(
            Object.entries(s.versions).filter(([, v]) => v.promptId !== id),
          )
          const collections = Object.fromEntries(
            Object.entries(s.collections).map(([cid, col]) => [
              cid,
              { ...col, promptIds: col.promptIds.filter((pid) => pid !== id) },
            ]),
          )
          const testRuns = s.testRuns.filter((r) => r.promptId !== id)
          return { prompts, versions, collections, testRuns }
        })
      },

      createCollection: (name, description = '') => {
        const id = newId()
        const col: Collection = { id, name, description, promptIds: [] }
        set((s) => ({ collections: { ...s.collections, [id]: col } }))
        return id
      },

      updateCollection: (id, patch) => {
        set((s) => {
          const current = s.collections[id]
          if (!current) return s
          return {
            collections: {
              ...s.collections,
              [id]: { ...current, ...patch },
            },
          }
        })
      },

      deleteCollection: (id) => {
        set((s) => {
          const { [id]: _, ...collections } = s.collections
          const prompts = Object.fromEntries(
            Object.entries(s.prompts).map(([pid, p]) => [
              pid,
              { ...p, collectionIds: p.collectionIds.filter((cid) => cid !== id) },
            ]),
          )
          return { collections, prompts }
        })
      },

      addTestRun: (run) => {
        const entry: TestRun = {
          ...run,
          id: newId(),
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          testRuns: [entry, ...s.testRuns].slice(0, MAX_TEST_RUNS),
        }))
      },

      getVersionsForPrompt: (promptId) => {
        return Object.values(get().versions)
          .filter((v) => v.promptId === promptId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      },

      exportAll: () => ({
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        collections: Object.values(get().collections),
        prompts: Object.values(get().prompts),
        versions: Object.values(get().versions),
      }),

      exportCollection: (collectionId) => {
        const col = get().collections[collectionId]
        if (!col) return null
        const prompts = Object.values(get().prompts).filter((p) =>
          p.collectionIds.includes(collectionId),
        )
        const promptSet = new Set(prompts.map((p) => p.id))
        const versions = Object.values(get().versions).filter((v) => promptSet.has(v.promptId))
        return {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          collections: [{ ...col, promptIds: prompts.map((p) => p.id) }],
          prompts,
          versions,
        }
      },

      importBundle: (bundle, strategy) => {
        set((s) => {
          let prompts = { ...s.prompts }
          let versions = { ...s.versions }
          let collections = { ...s.collections }

          if (strategy === 'copy') {
            const colRemap = new Map<string, string>()
            const promptRemap = new Map<string, string>()
            const versionRemap = new Map<string, string>()

            for (const col of bundle.collections) {
              colRemap.set(col.id, newId())
            }
            for (const p of bundle.prompts) {
              promptRemap.set(p.id, newId())
            }
            for (const v of bundle.versions) {
              versionRemap.set(v.id, newId())
            }

            for (const col of bundle.collections) {
              const id = colRemap.get(col.id)!
              collections[id] = {
                ...col,
                id,
                promptIds: col.promptIds
                  .map((pid) => promptRemap.get(pid))
                  .filter((x): x is string => !!x),
              }
            }

            for (const p of bundle.prompts) {
              const id = promptRemap.get(p.id)!
              prompts[id] = {
                ...p,
                id,
                collectionIds: p.collectionIds
                  .map((cid) => colRemap.get(cid))
                  .filter((x): x is string => !!x),
                currentVersionId: versionRemap.get(p.currentVersionId) ?? newId(),
              }
            }

            for (const v of bundle.versions) {
              const promptId = promptRemap.get(v.promptId)
              if (!promptId) continue
              const id = versionRemap.get(v.id)!
              versions[id] = { ...v, id, promptId }
            }

            return {
              prompts,
              versions,
              collections: rebuildCollectionPromptIds(collections, prompts),
            }
          }

          for (const col of bundle.collections) {
            if (strategy === 'skip' && collections[col.id]) continue
            collections[col.id] = col
          }

          for (const p of bundle.prompts) {
            if (strategy === 'skip' && prompts[p.id]) continue
            prompts[p.id] = p
          }

          for (const v of bundle.versions) {
            if (strategy === 'skip' && versions[v.id]) continue
            versions[v.id] = v
          }

          return {
            prompts,
            versions,
            collections: rebuildCollectionPromptIds(collections, prompts),
          }
        })
      },

      clearAllData: () =>
        set({
          prompts: {},
          versions: {},
          collections: {},
          testRuns: [],
        }),
    }),
    {
      name: 'ai-prompt-studio-data',
      version: 2,
      migrate: (persisted: unknown, version) => {
        const state = persisted as PromptState
        if (version < 2 && state.prompts && state.collections) {
          return {
            ...state,
            collections: rebuildCollectionPromptIds(state.collections, state.prompts),
          }
        }
        return state
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true
          state.collections = rebuildCollectionPromptIds(state.collections, state.prompts)
        }
      },
    },
  ),
)

export type { MergeStrategy }
