import { Input } from '../../components/ui/Input'
import { CodeField } from '../../components/CodeField'
import {
  REVIEW_FOCUS_AREAS,
  REVIEW_FRAMEWORKS,
  REVIEW_LANGUAGES,
} from '../../lib/codeReviewPresets'
import type { PromptVariable } from '../../schemas'

type Props = {
  variables: PromptVariable[]
  values: Record<string, string>
  onValuesChange: (values: Record<string, string>) => void
}

function hasVar(variables: PromptVariable[], name: string) {
  return variables.some((v) => v.name === name)
}

function getVal(values: Record<string, string>, variables: PromptVariable[], name: string) {
  const v = variables.find((x) => x.name === name)
  return values[name] ?? v?.defaultValue ?? ''
}

export function CodeReviewWorkspace({ variables, values, onValuesChange }: Props) {
  const set = (name: string, value: string) => onValuesChange({ ...values, [name]: value })

  const focusRaw = getVal(values, variables, 'focus')
  const focusSet = new Set(
    focusRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )

  const toggleFocus = (label: string) => {
    const next = new Set(focusSet)
    if (next.has(label)) next.delete(label)
    else next.add(label)
    set('focus', [...next].join(', '))
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-muted">
        Заполните контекст и вставьте код — значения подставятся в шаблон промпта на вкладке «Тест».
        Шаблон текста редактируется на вкладке «Шаблон промпта».
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hasVar(variables, 'language') && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Язык</span>
            <select
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
              value={getVal(values, variables, 'language')}
              onChange={(e) => set('language', e.target.value)}
            >
              {REVIEW_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </label>
        )}

        {hasVar(variables, 'framework') && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Стек / фреймворк</span>
            <select
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
              value={getVal(values, variables, 'framework')}
              onChange={(e) => set('framework', e.target.value)}
            >
              {REVIEW_FRAMEWORKS.map((fw) => (
                <option key={fw} value={fw}>
                  {fw}
                </option>
              ))}
            </select>
          </label>
        )}

        {hasVar(variables, 'file_path') && (
          <Input
            label="Файл / путь"
            placeholder="src/components/Button.tsx"
            value={getVal(values, variables, 'file_path')}
            onChange={(e) => set('file_path', e.target.value)}
          />
        )}
      </div>

      {hasVar(variables, 'focus') && (
        <div>
          <div className="text-sm text-text-muted mb-2">Фокус ревью</div>
          <div className="flex flex-wrap gap-2">
            {REVIEW_FOCUS_AREAS.map(({ label }) => {
              const active = focusSet.has(label)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleFocus(label)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? 'border-primary bg-primary-muted text-primary'
                      : 'border-border text-text-muted hover:border-primary/40'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {hasVar(variables, 'code') && (
        <CodeField
          label="Код для ревью"
          value={getVal(values, variables, 'code')}
          onChange={(v) => set('code', v)}
          placeholder="Вставьте diff или фрагмент файла…"
          minRows={16}
        />
      )}

      {hasVar(variables, 'context') && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-muted">Контекст (задача, PR, ограничения)</span>
          <textarea
            className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm min-h-[100px] resize-y focus:border-primary"
            value={getVal(values, variables, 'context')}
            onChange={(e) => set('context', e.target.value)}
            placeholder="Например: hotfix перед релизом, нельзя менять публичный API"
          />
        </label>
      )}
    </div>
  )
}
