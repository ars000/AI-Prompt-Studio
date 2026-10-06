import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { substituteVariables } from '../../lib/variables'
import { PageShell } from '../../components/layout/PageShell'

const EXAMPLE_BODY = `Ты дружелюбный помощник. Ответь на {{language}} языке, не более {{max_words}} слов.

Вопрос:
{{question}}`

const EXAMPLE_VARS = [
  { name: 'language', value: 'русском' },
  { name: 'max_words', value: '40' },
  { name: 'question', value: 'Что такое промпт и зачем его версионировать?' },
] as const

const EXAMPLE_FILLED = Object.fromEntries(EXAMPLE_VARS.map((v) => [v.name, v.value]))
const EXAMPLE_PROMPT_SENT = substituteVariables(EXAMPLE_BODY, EXAMPLE_FILLED)

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg border border-border bg-surface p-3 text-xs font-mono text-text whitespace-pre-wrap leading-relaxed overflow-x-auto">
      {children}
    </pre>
  )
}

function ExampleStep({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-zinc-900">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-medium text-text">{title}</p>
        {children}
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-surface-elevated/40 p-5 space-y-3">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      <div className="text-sm text-text-muted space-y-2 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-text">
        {children}
      </div>
    </section>
  )
}

export function GuidePage() {
  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-semibold">Как пользоваться</h1>
        <p className="text-sm text-text-muted mt-2">
          Краткая инструкция для новых пользователей AI Prompt Studio.
        </p>
      </div>

      <Section title="Для чего это приложение">
        <p>
          <strong>AI Prompt Studio</strong> — рабочая среда для создания, хранения и проверки
          промптов к языковым моделям. Вы собираете библиотеку шаблонов с переменными, фиксируете
          изменения в версиях, прогоняете промпты через AI (или Mock) и делитесь наборами через JSON.
        </p>
        <p>Все данные хранятся локально в вашем браузере — регистрация не нужна.</p>
      </Section>

      <Section title="Простой пример: от шаблона до ответа AI">
        <p>
          Представьте промпт «Краткий ответ на вопрос». Один текст — разные языки и вопросы за счёт
          переменных. Так же работает демо-промпт в вашей библиотеке.
        </p>

        <div className="space-y-5 pt-1">
          <ExampleStep n={1} title="Пишете промпт с переменными {{…}}">
            <CodeBlock>{EXAMPLE_BODY}</CodeBlock>
            <p>
              Имена <code className="text-primary">language</code>,{' '}
              <code className="text-primary">max_words</code>,{' '}
              <code className="text-primary">question</code> автоматически появятся на вкладке
              «Переменные».
            </p>
          </ExampleStep>

          <ExampleStep n={2} title="Задаёте значения для теста">
            <ul className="rounded-lg border border-border divide-y divide-border text-text">
              {EXAMPLE_VARS.map((v) => (
                <li key={v.name} className="flex flex-wrap gap-x-2 px-3 py-2 font-mono text-xs">
                  <span className="text-primary">{`{{${v.name}}}`}</span>
                  <span className="text-text-muted">→</span>
                  <span>{v.value}</span>
                </li>
              ))}
            </ul>
            <p>Справа на вкладке «Редактор» сразу виден preview с этими подстановками.</p>
          </ExampleStep>

          <ExampleStep n={3} title="В AI уходит уже готовый текст (без {{…}})">
            <CodeBlock>{EXAMPLE_PROMPT_SENT}</CodeBlock>
            <p>
              Именно эту строку отправляет вкладка «Тест» в Mock, OpenRouter или Groq. Вы проверяете
              формулировку до траты токенов.
            </p>
          </ExampleStep>

          <ExampleStep n={4} title="Сохраняете версию, когда довольны текстом">
            <p>
              Например, сначала <strong>v1</strong> — «добавил лимит слов», потом меняете тон и
              сохраняете <strong>v2</strong>. На вкладке «Версии» виден diff и можно откатиться —
              откат создаст <strong>v3</strong>, старые версии не пропадают.
            </p>
          </ExampleStep>
        </div>

        <p className="pt-2 border-t border-border">
          Попробуйте сами:{' '}
          <Link to="/" className="text-primary hover:underline">
            откройте демо-промпт «Приветственный промпт»
          </Link>{' '}
          в библиотеке или создайте копию из шаблона «Краткое резюме» — логика та же.
        </p>
      </Section>

      <Section title="Оптимизатор (для новичков)">
        <p>
          На странице <Link to="/optimizer" className="text-primary hover:underline">Оптимизатор</Link>{' '}
          опишите задачу — отредактируйте предложенный текст и нажмите{' '}
          <strong>«Продолжить в редакторе»</strong>. Промпт сохраняется в библиотеку с переменными, пояснением
          (блок «Контекст оптимизатора») и версией v1.
        </p>
        <p>
          Из редактора — <strong>«Улучшить в оптимизаторе»</strong>: можно{' '}
          <strong>обновить исходный промпт</strong> (новая версия в истории) или создать копию.
        </p>
      </Section>

      <Section title="Быстрый старт (5 шагов)">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <Link to="/optimizer" className="text-primary hover:underline">Оптимизатор</Link> или{' '}
            <Link to="/" className="text-primary hover:underline">Библиотека</Link> →{' '}
            <strong>«Новый промпт»</strong> / <strong>«Из шаблона»</strong>.
          </li>
          <li>
            В редакторе напишите текст и добавьте переменные в фигурных скобках, например{' '}
            <code className="rounded bg-surface px-1 text-primary">{'{{language}}'}</code> — они
            появятся на вкладке «Переменные».
          </li>
          <li>
            Нажмите <strong>«Сохранить версию»</strong>, когда хотите зафиксировать снимок (как
            commit в git).
          </li>
          <li>
            На вкладке <strong>«Тест»</strong> задайте значения переменных и нажмите «Запустить» —
            увидите ответ модели.
          </li>
          <li>
            В <Link to="/settings" className="text-primary hover:underline">Настройках</Link>{' '}
            при желании добавьте ключ OpenRouter или Groq; без ключа работает режим Mock.
          </li>
        </ol>
      </Section>

      <Section title="Разделы приложения">
        <ul>
          <li>
            <strong>Оптимизатор</strong> — сырой запрос → структурированный промпт → сохранение в библиотеку.
          </li>
          <li>
            <strong>Библиотека</strong> — список промптов, поиск, фильтры по типу и коллекции,
            дубликат и удаление.
          </li>
          <li>
            <strong>Коллекции</strong> — группы промптов для удобства и отдельного экспорта.
          </li>
          <li>
            <strong>Редактор промпта</strong> — вкладки: текст, переменные, история версий, тест.
          </li>
          <li>
            <strong>Импорт / экспорт</strong> — резервная копия или обмен JSON-файлом с коллегами.
          </li>
          <li>
            <strong>Настройки</strong> — провайдер AI, API-ключи, очистка данных.
          </li>
        </ul>
      </Section>

      <Section title="Code Review — отдельный сценарий">
        <p>
          Для промптов с типом <strong>Код</strong> (шаблон «Code review») есть вкладка{' '}
          <strong>«Ревью»</strong>: язык, стек, путь к файлу, чипы фокуса (безопасность, тесты…),
          большое поле кода с кнопкой «Вставить из буфера».
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Библиотека → «Из шаблона» → Code review.</li>
          <li>Вкладка «Ревью» — вставьте код, отметьте фокус.</li>
          <li>«Тест» — ответ приходит в Markdown с секциями (критично, рекомендации…).</li>
          <li>«Шаблон промпта» — меняйте инструкции ревьюера; версии фиксируют улучшения промпта.</li>
        </ol>
      </Section>

      <Section title="Фишки, которые стоит знать">
        <ul>
          <li>
            <strong>Переменные</strong> — один промпт для разных сценариев: язык, фреймворк, тема.
            Preview подстановки — на вкладке «Редактор» справа.
          </li>
          <li>
            <strong>Версии</strong> — timeline, diff с текущим черновиком, восстановление старой
            версии (создаётся новая запись, история не теряется).
          </li>
          <li>
            <strong>Шаблоны</strong> — перевод, code review, image prompt и другие готовые заготовки.
          </li>
          <li>
            <strong>Типы промпта</strong> — текст, код, изображение (для image удобно структурировать
            subject / style / negative prompt).
          </li>
          <li>
            <strong>Mock AI</strong> — бесплатный режим без API; включается по умолчанию и при ошибке
            или отсутствии ключа (настраивается).
          </li>
          <li>
            <strong>OpenRouter / Groq</strong> — живые ответы; модель можно выбрать из списка или
            указать свой ID.
          </li>
          <li>
            <strong>История прогонов</strong> — последние запуски на вкладке «Тест»; клик по строке
            показывает старый ответ.
          </li>
          <li>
            <strong>Экспорт коллекции</strong> — только нужная группа промптов, не вся библиотека.
          </li>
        </ul>
      </Section>

      <Section title="Горячие клавиши">
        <ul>
          <li>
            <strong>Ctrl+S</strong> (Cmd+S на Mac) — сохранить версию на странице промпта.
          </li>
          <li>
            <strong>Ctrl+Enter</strong> — запустить тест на вкладке «Тест».
          </li>
        </ul>
      </Section>

      <Section title="Советы по безопасности">
        <ul>
          <li>API-ключи хранятся только в localStorage этого браузера — не передавайте их другим.</li>
          <li>Регулярно делайте экспорт JSON как резервную копию.</li>
          <li>Очистка данных в настройках удаляет промпты без возможности восстановления.</li>
        </ul>
      </Section>

      <p className="text-center text-sm text-text-muted pt-2">
        <Link to="/" className="text-primary hover:underline">
          Перейти в библиотеку →
        </Link>
      </p>
    </PageShell>
  )
}
