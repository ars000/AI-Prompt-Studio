export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'ai-prompt-studio-theme'

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

/** Синхронизация с persist zustand до первого рендера React (меньше мигания). */
export function initThemeFromStorage() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { state?: { theme?: unknown } }
    const t = parsed.state?.theme
    if (t === 'light' || t === 'dark') applyTheme(t)
  } catch {
    /* ignore */
  }
}
