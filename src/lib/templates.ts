import { defaultImagePromptBody, defaultImagePromptVariables } from './imagePromptTemplate'
import type { PromptKind, PromptVariable } from '../schemas'

export type PromptTemplate = {
  id: string
  title: string
  kind: PromptKind
  body: string
  variables: PromptVariable[]
  tags: string[]
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'translate',
    title: 'Перевод текста',
    kind: 'text',
    body: `Переведи следующий текст на {{language}}. Сохрани тон и стиль оригинала.

Текст:
{{text}}`,
    variables: [
      { name: 'language', description: 'Целевой язык', defaultValue: 'английский' },
      { name: 'text', description: 'Исходный текст', defaultValue: '' },
    ],
    tags: ['translation', 'text'],
  },
  {
    id: 'code-review',
    title: 'Code review',
    kind: 'code',
    body: `Ты senior-разработчик. Проведи code review.

**Язык:** {{language}}
**Стек:** {{framework}}
**Файл:** {{file_path}}
**Фокус:** {{focus}}

## Контекст
{{context}}

## Код для ревью
\`\`\`{{language}}
{{code}}
\`\`\`

Дай структурированный ответ: краткое резюме, критичные проблемы, замечания по фокусу ({{focus}}), конкретные правки (с фрагментами кода), что сделано хорошо.`,
    variables: [
      { name: 'language', description: 'Язык программирования', defaultValue: 'TypeScript', format: 'text' },
      { name: 'framework', description: 'Стек / фреймворк', defaultValue: 'React', format: 'text' },
      { name: 'file_path', description: 'Путь к файлу', defaultValue: 'src/example.ts', format: 'text' },
      {
        name: 'focus',
        description: 'На что обратить внимание',
        defaultValue: 'Баги, Безопасность, Читаемость',
        format: 'text',
      },
      { name: 'context', description: 'Контекст PR / задачи', defaultValue: '', format: 'multiline' },
      { name: 'code', description: 'Код или diff', defaultValue: '', format: 'code' },
    ],
    tags: ['code', 'review'],
  },
  {
    id: 'image-prompt',
    title: 'Image prompt skeleton',
    kind: 'image',
    body: defaultImagePromptBody('английском'),
    variables: defaultImagePromptVariables('английском'),
    tags: ['image', 'midjourney'],
  },
  {
    id: 'summarize',
    title: 'Краткое резюме',
    kind: 'text',
    body: `Сделай краткое резюме (не более {{max_words}} слов) следующего текста:

{{text}}`,
    variables: [
      { name: 'max_words', description: 'Лимит слов', defaultValue: '100' },
      { name: 'text', description: 'Текст', defaultValue: '' },
    ],
    tags: ['summary', 'text'],
  },
  {
    id: 'unit-test',
    title: 'Генерация unit-тестов',
    kind: 'code',
    body: `Напиши unit-тесты для {{framework}} на {{test_runner}}.

Функция / компонент:
{{code}}

Покрой edge cases и назови describe/it блоки понятно.`,
    variables: [
      { name: 'framework', description: 'Фреймворк', defaultValue: 'TypeScript' },
      { name: 'test_runner', description: 'Test runner', defaultValue: 'Vitest' },
      { name: 'code', description: 'Код для тестов', defaultValue: '' },
    ],
    tags: ['code', 'tests'],
  },
]
