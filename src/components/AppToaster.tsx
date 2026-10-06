import { Toaster } from 'sonner'
import { useThemeStore } from '../stores/themeStore'

export function AppToaster() {
  const theme = useThemeStore((s) => s.theme)
  return <Toaster theme={theme} position="bottom-right" richColors />
}
