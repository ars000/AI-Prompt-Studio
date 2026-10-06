import { Input } from '../../components/ui/Input'
import { CodeField } from '../../components/CodeField'
import { resolveVariableFormat } from '../../lib/variableFormat'
import type { PromptVariable } from '../../schemas'

type Props = {
  variables: PromptVariable[]
  values: Record<string, string>
  onValuesChange: (values: Record<string, string>) => void
  onVariablesChange: (variables: PromptVariable[]) => void
  readOnlyMeta?: boolean
}

export function VariablesPanel({
  variables,
  values,
  onValuesChange,
  onVariablesChange,
  readOnlyMeta,
}: Props) {
  const updateVar = (index: number, patch: Partial<PromptVariable>) => {
    const next = variables.map((v, i) => (i === index ? { ...v, ...patch } : v))
    onVariablesChange(next)
  }

  const renderTestValue = (v: PromptVariable) => {
    const format = resolveVariableFormat(v)
    const value = values[v.name] ?? v.defaultValue

    if (format === 'code') {
      return (
        <CodeField
          label="Значение для теста"
          value={value}
          onChange={(text) => onValuesChange({ ...values, [v.name]: text })}
          minRows={10}
        />
      )
    }

    if (format === 'multiline') {
      return (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-muted">Значение для теста</span>
          <textarea
            className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm min-h-[100px] resize-y focus:border-primary"
            value={value}
            onChange={(e) => onValuesChange({ ...values, [v.name]: e.target.value })}
          />
        </label>
      )
    }

    return (
      <Input
        label="Значение для теста"
        value={value}
        onChange={(e) => onValuesChange({ ...values, [v.name]: e.target.value })}
      />
    )
  }

  return (
    <div className="space-y-3">
      {variables.length === 0 && (
        <p className="text-sm text-text-muted">
          Добавьте переменные в текст как {'{{name}}'} — они появятся здесь автоматически.
        </p>
      )}
      {variables.map((v, i) => (
        <div key={v.name} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-primary">{`{{${v.name}}}`}</span>
            <span className="text-xs text-text-muted rounded border border-border px-1.5 py-0.5">
              {resolveVariableFormat(v)}
            </span>
          </div>
          {!readOnlyMeta && (
            <>
              <Input
                label="Описание"
                value={v.description}
                onChange={(e) => updateVar(i, { description: e.target.value })}
              />
              {resolveVariableFormat(v) === 'code' ? (
                <CodeField
                  label="Значение по умолчанию"
                  value={v.defaultValue}
                  onChange={(text) => updateVar(i, { defaultValue: text })}
                  minRows={6}
                />
              ) : resolveVariableFormat(v) === 'multiline' ? (
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-text-muted">Значение по умолчанию</span>
                  <textarea
                    className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm min-h-[80px] resize-y"
                    value={v.defaultValue}
                    onChange={(e) => updateVar(i, { defaultValue: e.target.value })}
                  />
                </label>
              ) : (
                <Input
                  label="Значение по умолчанию"
                  value={v.defaultValue}
                  onChange={(e) => updateVar(i, { defaultValue: e.target.value })}
                />
              )}
            </>
          )}
          {renderTestValue(v)}
        </div>
      ))}
    </div>
  )
}
