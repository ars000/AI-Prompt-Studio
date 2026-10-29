# AI Prompt Studio

Веб-приложение для создания, версионирования и тестирования AI-промптов с переменными (`{{name}}`).

**Для разработчиков:** [docs/DEVELOPER.md](docs/DEVELOPER.md) — стек, архитектура и логика работы.

## Возможности

- Библиотека промптов (текст, код, image-шаблоны)
- Переменные с defaults и preview подстановки
- История версий, diff и restore
- **Оптимизатор** — сырой запрос → структурированный промпт → сохранение в библиотеку (v1)
- Тест через **Mock**, **OpenRouter** или **Groq**
- Коллекции, экспорт/импорт JSON
- Данные в **localStorage** (Zustand persist)

## Запуск

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
npm test
```

## API-ключи

1. Откройте **Настройки** в приложении.
2. Добавьте ключ [OpenRouter](https://openrouter.ai/) и/или [Groq](https://console.groq.com/).
3. Ключи хранятся только в вашем браузере. Не публикуйте их и не коммитьте в репозиторий.

Если ключа нет или запрос падает, включён fallback на **Mock** (см. настройку «Использовать Mock…»).

В **Настройках** или на вкладке **Тест** нажмите «Загрузить модели с API» — список подтягивается с OpenRouter/Groq по вашему ключу. OpenRouter: группы «Бесплатные / $0» и «Платные» по полю `pricing` и суффиксу `:free`. Groq: все модели из API помечены как free tier (лимиты по ключу).

## Git и публикация

- Feature-ветки — без деплоя; **push в `main`** → [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) → [prompts.ars000.ru](https://prompts.ars000.ru).
- Pages: **Settings → GitHub Actions**. Повтор деплоя: **Actions → Run workflow**.

Проверка prod-сборки локально:

```bash
npm run build:pages
npm run preview
```

Для прямых URL на Pages в артефакт копируется `404.html` (SPA fallback).

## Брендинг

Основной цвет интерфейса: `#fca30c`.
