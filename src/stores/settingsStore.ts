import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getProviderApiKey } from '../lib/aiProviders/registry'
import type { CatalogProvider } from '../lib/aiProviders/types'
import { pickDefaultModel } from '../lib/providerModels'
import { emptyModelCatalog, normalizeCatalogProvider, type ModelCatalog } from '../lib/modelCatalogTypes'
import { fetchProviderModels } from '../services/ai/listModels'
import type { AiProvider, Settings } from '../schemas'

const defaultSettings: Settings = {
  activeProvider: 'mock',
  openRouterKey: '',
  groqKey: '',
  anthropicKey: '',
  openaiCompatibleKey: '',
  openaiCompatibleBaseUrl: 'http://localhost:11434',
  defaultModels: {
    mock: 'mock-gpt',
    openrouter: 'openai/gpt-4o-mini',
    groq: 'llama-3.3-70b-versatile',
    anthropic: 'claude-sonnet-4-20250514',
    openai_compatible: 'llama3.2',
  },
  useMockWhenNoKey: true,
}

type SettingsState = Settings & {
  modelCatalog: ModelCatalog
  modelCatalogUpdatedAt: Partial<Record<CatalogProvider, string>>
  setActiveProvider: (p: AiProvider) => void
  setOpenRouterKey: (key: string) => void
  setGroqKey: (key: string) => void
  setAnthropicKey: (key: string) => void
  setOpenaiCompatibleKey: (key: string) => void
  setOpenaiCompatibleBaseUrl: (url: string) => void
  setProviderApiKey: (provider: CatalogProvider, value: string) => void
  setDefaultModel: (provider: AiProvider, model: string) => void
  setUseMockWhenNoKey: (v: boolean) => void
  refreshModelCatalog: (provider: CatalogProvider) => Promise<number>
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      modelCatalog: { ...emptyModelCatalog },
      modelCatalogUpdatedAt: {},

      setActiveProvider: (activeProvider) => set({ activeProvider }),
      setOpenRouterKey: (openRouterKey) => set({ openRouterKey }),
      setGroqKey: (groqKey) => set({ groqKey }),
      setAnthropicKey: (anthropicKey) => set({ anthropicKey }),
      setOpenaiCompatibleKey: (openaiCompatibleKey) => set({ openaiCompatibleKey }),
      setOpenaiCompatibleBaseUrl: (openaiCompatibleBaseUrl) => set({ openaiCompatibleBaseUrl }),
      setProviderApiKey: (provider, value) => {
        if (provider === 'openrouter') set({ openRouterKey: value })
        else if (provider === 'groq') set({ groqKey: value })
        else if (provider === 'anthropic') set({ anthropicKey: value })
        else if (provider === 'openai_compatible') set({ openaiCompatibleKey: value })
      },
      setDefaultModel: (provider, model) =>
        set((s) => ({
          defaultModels: { ...s.defaultModels, [provider]: model },
        })),
      setUseMockWhenNoKey: (useMockWhenNoKey) => set({ useMockWhenNoKey }),

      refreshModelCatalog: async (provider) => {
        const state = get()
        const apiKey = getProviderApiKey(state, provider)
        const entries = await fetchProviderModels(
          provider,
          apiKey,
          provider === 'openai_compatible' ? state.openaiCompatibleBaseUrl : undefined,
        )
        const now = new Date().toISOString()
        set((s) => {
          const modelCatalog = { ...s.modelCatalog, [provider]: entries }
          const preferred = s.defaultModels[provider]
          const nextDefault = pickDefaultModel(provider, preferred, modelCatalog)
          return {
            modelCatalog,
            modelCatalogUpdatedAt: { ...s.modelCatalogUpdatedAt, [provider]: now },
            defaultModels:
              nextDefault !== preferred
                ? { ...s.defaultModels, [provider]: nextDefault }
                : s.defaultModels,
          }
        })
        return entries.length
      },

      resetSettings: () =>
        set({
          ...defaultSettings,
          modelCatalog: { ...emptyModelCatalog },
          modelCatalogUpdatedAt: {},
        }),
    }),
    {
      name: 'ai-prompt-studio-settings',
      version: 4,
      migrate: (persisted: unknown, version) => {
        const state = persisted as SettingsState & {
          modelCatalog?: Partial<ModelCatalog & { openrouter?: unknown; groq?: unknown }>
        }
        const raw = state.modelCatalog ?? { ...emptyModelCatalog }
        const modelCatalog: ModelCatalog = {
          openrouter: normalizeCatalogProvider(raw.openrouter),
          groq: normalizeCatalogProvider(raw.groq),
          anthropic: normalizeCatalogProvider(raw.anthropic),
          openai_compatible: normalizeCatalogProvider(raw.openai_compatible),
        }

        const merged: SettingsState = {
          ...defaultSettings,
          ...state,
          modelCatalog,
          modelCatalogUpdatedAt: state.modelCatalogUpdatedAt ?? {},
        }

        if (version < 4) {
          merged.anthropicKey = state.anthropicKey ?? ''
          merged.openaiCompatibleKey = state.openaiCompatibleKey ?? ''
          merged.openaiCompatibleBaseUrl =
            state.openaiCompatibleBaseUrl ?? defaultSettings.openaiCompatibleBaseUrl
          merged.defaultModels = {
            ...defaultSettings.defaultModels,
            ...state.defaultModels,
          }
        }

        return merged
      },
    },
  ),
)
