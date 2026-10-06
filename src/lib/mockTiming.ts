/** Искусственная задержка Mock, чтобы UI успел показать loading (не имитирует сеть). */
export const MOCK_COMPLETION_DELAY_MS = { min: 80, max: 180 } as const

export function mockCompletionDelayMs(): number {
  const { min, max } = MOCK_COMPLETION_DELAY_MS
  return min + Math.random() * (max - min)
}
