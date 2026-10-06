import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { dominantScript } from '../../lib/promptLanguage'
import { buildCompletionContext } from '../../lib/aiProviders/completionContext'
import { translateImagePromptToEnglish } from '../../services/ai/translateImagePrompt'
import { useSettingsStore } from '../../stores/settingsStore'
import type { AiProvider } from '../../schemas'

type Props = {
  resolvedPrompt: string
  provider?: AiProvider
  className?: string
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

export function ImagePromptGeneratorBar({ resolvedPrompt, provider: providerProp, className }: Props) {
  const settings = useSettingsStore()
  const provider = providerProp ?? settings.activeProvider
  const [englishText, setEnglishText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const trimmed = resolvedPrompt.trim()
  const looksEnglish = trimmed.length > 0 && dominantScript(trimmed) === 'latin'

  useEffect(() => {
    setEnglishText(null)
  }, [resolvedPrompt])

  const runTranslate = useCallback(async () => {
    if (!trimmed) {
      toast.error('Сначала заполните переменные или текст промпта')
      return
    }
    setLoading(true)
    try {
      const ctx = buildCompletionContext(settings, provider)
      const { text, usedMock, alreadyEnglish } = await translateImagePromptToEnglish(trimmed, {
        provider,
        model: settings.defaultModels[provider],
        apiKey: ctx.apiKey,
        openAiBaseUrl: ctx.openAiBaseUrl,
        useMockWhenNoKey: settings.useMockWhenNoKey,
      })
      setEnglishText(text)
      if (alreadyEnglish) toast.message('Текст уже на английском')
      else if (usedMock) toast.message('Mock-перевод — для точного результата подключите API')
      else toast.success('Перевод готов')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось перевести')
    } finally {
      setLoading(false)
    }
  }, [provider, settings, trimmed])

  const copyForGenerator = useCallback(async () => {
    const payload = englishText?.trim() || (looksEnglish ? trimmed : '')
    if (!payload) {
      toast.error('Сначала переведите prompt на английский')
      return
    }
    try {
      await copyText(payload)
      toast.success('Скопировано для Midjourney / SD / DALL·E')
    } catch {
      toast.error('Не удалось скопировать в буфер')
    }
  }, [englishText, looksEnglish, trimmed])

  if (!trimmed) return null

  const displayEn = englishText ?? (looksEnglish ? trimmed : null)

  if (looksEnglish && !englishText) {
    return (
      <div className={`rounded-lg border border-border bg-surface p-3 ${className ?? ''}`}>
        <p className="text-xs text-text-muted mb-2">
          Preview уже на английском — это и есть текст для Midjourney / SD / DALL·E. Отдельный перевод не
          нужен.
        </p>
        <Button type="button" variant="secondary" className="text-xs py-1.5" onClick={() => void copyForGenerator()}>
          Копировать preview в генератор
        </Button>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border border-border bg-surface-elevated p-3 space-y-3 ${className ?? ''}`}>
      <div className="space-y-1">
        <span className="text-sm font-medium text-text">Копия для генератора (английский)</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <strong className="font-medium text-text">Preview</strong> — итог с подставленными {'{{переменными}}'}{' '}
          на языке шаблона (русский или English).{' '}
          <strong className="font-medium text-text">Этот блок</strong> — только если нужен{' '}
          <em>отдельный</em> английский текст для Midjourney / Stable Diffusion / DALL·E: перевод через AI и
          копирование одной кнопкой.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" className="text-xs py-1.5" disabled={loading} onClick={() => void runTranslate()}>
          {loading ? 'Перевод…' : 'Перевести preview на английский'}
        </Button>
        <Button
          type="button"
          className="text-xs py-1.5"
          disabled={!displayEn}
          onClick={() => void copyForGenerator()}
        >
          Копировать английский текст
        </Button>
      </div>
      {displayEn ? (
        <pre className="rounded border border-border bg-surface p-2 text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-auto">
          {displayEn}
        </pre>
      ) : (
        <p className="text-xs text-text-muted">
          Нажмите «Перевести preview на английский» — здесь появится версия для вставки в генератор.
        </p>
      )}
    </div>
  )
}
