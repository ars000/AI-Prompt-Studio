import { describe, expect, it } from 'vitest'
import { exportBundleSchema } from './index'

describe('exportBundleSchema', () => {
  it('accepts minimal valid bundle', () => {
    const result = exportBundleSchema.safeParse({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      collections: [],
      prompts: [],
      versions: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects wrong schema version', () => {
    const result = exportBundleSchema.safeParse({
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      collections: [],
      prompts: [],
      versions: [],
    })
    expect(result.success).toBe(false)
  })
})
