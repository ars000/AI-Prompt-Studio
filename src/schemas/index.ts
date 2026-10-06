import { z } from 'zod'

export const promptKindSchema = z.enum(['text', 'code', 'image'])

export const variableFormatSchema = z.enum(['text', 'code', 'multiline'])

export const promptVariableSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  defaultValue: z.string().default(''),
  format: variableFormatSchema.optional(),
})

export const optimizerMetaSchema = z.object({
  rawRequest: z.string(),
  explanation: z.string(),
  tips: z.array(z.string()),
  optimizedAt: z.string(),
})

export const promptSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  kind: promptKindSchema,
  body: z.string(),
  variables: z.array(promptVariableSchema),
  tags: z.array(z.string()),
  collectionIds: z.array(z.string().uuid()),
  currentVersionId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
  optimizerMeta: optimizerMetaSchema.optional(),
})

export type OptimizerMeta = z.infer<typeof optimizerMetaSchema>

export const promptVersionSchema = z.object({
  id: z.string().uuid(),
  promptId: z.string().uuid(),
  body: z.string(),
  variablesSnapshot: z.array(promptVariableSchema),
  message: z.string(),
  label: z.string(),
  createdAt: z.string(),
})

export const collectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().default(''),
  promptIds: z.array(z.string().uuid()),
})

export const testRunSchema = z.object({
  id: z.string().uuid(),
  promptId: z.string().uuid(),
  provider: z.enum(['mock', 'openrouter', 'groq', 'anthropic', 'openai_compatible']),
  model: z.string(),
  filledVariables: z.record(z.string(), z.string()),
  response: z.string(),
  latencyMs: z.number(),
  createdAt: z.string(),
})

export const exportBundleSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  collections: z.array(collectionSchema),
  prompts: z.array(promptSchema),
  versions: z.array(promptVersionSchema),
})

export type VariableFormat = z.infer<typeof variableFormatSchema>
export type PromptKind = z.infer<typeof promptKindSchema>
export type PromptVariable = z.infer<typeof promptVariableSchema>
export type Prompt = z.infer<typeof promptSchema>
export type PromptVersion = z.infer<typeof promptVersionSchema>
export type Collection = z.infer<typeof collectionSchema>
export type TestRun = z.infer<typeof testRunSchema>
export type ExportBundle = z.infer<typeof exportBundleSchema>

export const aiProviderSchema = z.enum([
  'mock',
  'openrouter',
  'groq',
  'anthropic',
  'openai_compatible',
])

export type AiProvider = z.infer<typeof aiProviderSchema>

export const settingsSchema = z.object({
  activeProvider: aiProviderSchema,
  openRouterKey: z.string(),
  groqKey: z.string(),
  anthropicKey: z.string(),
  openaiCompatibleKey: z.string(),
  openaiCompatibleBaseUrl: z.string(),
  defaultModels: z.object({
    mock: z.string(),
    openrouter: z.string(),
    groq: z.string(),
    anthropic: z.string(),
    openai_compatible: z.string(),
  }),
  useMockWhenNoKey: z.boolean(),
})

export type Settings = z.infer<typeof settingsSchema>

/** Ответ AI-оптимизатора (без id — создаётся при сохранении в библиотеку) */
export const optimizerResultSchema = z.object({
  title: z.string().min(1),
  kind: promptKindSchema,
  body: z.string().min(1),
  variables: z.array(promptVariableSchema),
  tags: z.array(z.string()),
  explanation: z.string(),
  tips: z.array(z.string()).default([]),
})

export type OptimizerResult = z.infer<typeof optimizerResultSchema>
