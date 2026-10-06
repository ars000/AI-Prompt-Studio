import { Button } from '../../components/ui/Button'
import {
  defaultImagePromptBody,
  defaultImagePromptVariables,
  structurePlainImagePrompt,
} from '../../lib/imagePromptTemplate'
import { dominantScript } from '../../lib/promptLanguage'
import { parseVariablesFromBody } from '../../lib/variables'
import type { PromptVariable } from '../../schemas'

type Props = {
  body: string
  variables: PromptVariable[]
  onApplyTemplate: (body: string, variables: PromptVariable[]) => void
}

export function ImagePromptEditorHints({ body, variables, onApplyTemplate }: Props) {
  const namesInBody = parseVariablesFromBody(body)
  const declaredNames = variables.map((v) => v.name)
  const orphanInBody = namesInBody.filter((n) => !declaredNames.includes(n))
  const missingInBody = declaredNames.filter((n) => !namesInBody.includes(n))
  const hasNoPlaceholders = namesInBody.length === 0

  const langHint = dominantScript(body) === 'latin' ? 'английском' : 'русском'

  return (
    <div className="rounded-lg border border-border bg-surface p-3 space-y-2 text-sm">
      <p className="text-text-muted text-xs leading-relaxed">
        Меняемые фразы задаются только как <code className="text-primary font-mono">{`{{имя}}`}</code>{' '}
        — подписи секций («Объект:», «Subject:») могут быть на любом языке, а на месте значения всегда
        двойные скобки.
      </p>

      {namesInBody.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted">В шаблоне:</span>
          {namesInBody.map((name) => (
            <code
              key={name}
              className="text-xs font-mono text-primary bg-primary-muted/30 border border-primary/20 rounded px-1.5 py-0.5"
            >
              {`{{${name}}}`}
            </code>
          ))}
        </div>
      ) : (
        <p className="text-xs text-amber-200/90">
          В тексте нет {'{{переменных}}'} — preview показывает тот же текст без подстановки; вкладка
          «Переменные» не связана с шаблоном.
        </p>
      )}

      {orphanInBody.length > 0 && (
        <p className="text-xs text-amber-200/90">
          В тексте есть {orphanInBody.map((n) => `{{${n}}}`).join(', ')}, но их нет в списке переменных
          — сохраните версию или отредактируйте тело ещё раз.
        </p>
      )}

      {missingInBody.length > 0 && namesInBody.length > 0 && (
        <p className="text-xs text-text-muted">
          В списке переменных есть лишние: {missingInBody.map((n) => `{{${n}}}`).join(', ')} — их нет в
          теле промпта.
        </p>
      )}

      {hasNoPlaceholders && (
        <div className="flex flex-wrap gap-2">
          {body.trim() && (
            <Button
              type="button"
              className="text-xs py-1.5"
              onClick={() => {
                const structured = structurePlainImagePrompt(body, langHint)
                onApplyTemplate(structured.body, structured.variables)
              }}
            >
              Разложить этот текст на {'{{переменные}}'}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            className="text-xs py-1.5"
            onClick={() =>
              onApplyTemplate(defaultImagePromptBody(langHint), defaultImagePromptVariables(langHint))
            }
          >
            Пустой каркас с {'{{переменными}}'}
          </Button>
        </div>
      )}
    </div>
  )
}
