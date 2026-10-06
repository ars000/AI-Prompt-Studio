import type { OptimizerResult } from '../schemas'

const KEY = 'ai-prompt-studio-optimizer-session'

export type OptimizerSession = {
  rawRequest: string
  refineBody?: string
  result: OptimizerResult
  fromPromptId?: string
  savedAt: string
}

export function loadOptimizerSession(): OptimizerSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as OptimizerSession
  } catch {
    return null
  }
}

export function saveOptimizerSession(session: OptimizerSession) {
  sessionStorage.setItem(KEY, JSON.stringify(session))
}

export function clearOptimizerSession() {
  sessionStorage.removeItem(KEY)
}
