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

## Деплой на GitHub Pages

Репозиторий: **AI-Prompt-Studio**. После push в `main` workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) собирает приложение и публикует `dist/`.

1. На GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push в ветку `main` (или **Actions → Deploy to GitHub Pages → Run workflow**).
3. Сайт: `https://<ваш-логин>.github.io/AI-Prompt-Studio/`

Локальная проверка сборки как на Pages:

```bash
set VITE_BASE_PATH=/AI-Prompt-Studio/
npm run build
npm run preview
```

Несуществующие маршруты внутри приложения показывают страницу **404**; для прямых ссылок на GitHub Pages в артефакт копируется `404.html` (тот же SPA, что и `index.html`).

Альтернатива: `npm run build` без `VITE_BASE_PATH` и выкладка `dist/` на Vercel / Netlify (корневой домен, `base` не нужен).

## Брендинг

Основной цвет интерфейса: `#fca30c`.
