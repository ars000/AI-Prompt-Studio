export const REVIEW_LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C#',
  'SQL',
  'PHP',
  'Другой',
] as const

export const REVIEW_FRAMEWORKS = [
  'React',
  'Vue',
  'Angular',
  'Node.js',
  'Express',
  'Next.js',
  'Django',
  'FastAPI',
  'Spring',
  '.NET',
  'Без фреймворка',
] as const

export const REVIEW_FOCUS_AREAS = [
  { id: 'bugs', label: 'Баги' },
  { id: 'security', label: 'Безопасность' },
  { id: 'performance', label: 'Производительность' },
  { id: 'readability', label: 'Читаемость' },
  { id: 'tests', label: 'Тестируемость' },
  { id: 'types', label: 'Типизация' },
  { id: 'architecture', label: 'Архитектура' },
] as const

export const CODE_REVIEW_SYSTEM_PROMPT = `Ты опытный ревьюер кода. Отвечай на русском, если в запросе не указан другой язык.
Структура ответа в Markdown:
## Кратко
## Критично (блокеры)
## Замечания
## Рекомендации
## Плюсы
Для правок используй fenced code blocks с указанием языка.`
