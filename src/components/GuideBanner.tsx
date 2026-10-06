import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Button } from './ui/Button'

const STORAGE_KEY = 'ai-prompt-studio-guide-banner-dismissed'

export function GuideBanner() {
  const [hidden, setHidden] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')

  if (hidden) return null

  return (
    <div className="rounded-xl border border-primary/30 bg-primary-muted/50 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="text-sm">
        <span className="font-medium text-text">Новый здесь?</span>{' '}
        <span className="text-text-muted">
          Откройте краткую инструкцию: зачем приложение, быстрый старт и основные фишки.
        </span>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link to="/guide">
          <Button variant="primary" className="text-xs py-1.5">
            Как пользоваться
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="text-xs py-1.5"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, '1')
            setHidden(true)
          }}
        >
          Скрыть
        </Button>
      </div>
    </div>
  )
}
