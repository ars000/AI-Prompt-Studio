import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <p className="text-6xl font-bold text-primary/80 tabular-nums">404</p>
      <h1 className="text-xl font-semibold text-text mt-4">Страница не найдена</h1>
      <p className="text-sm text-text-muted mt-2 leading-relaxed">
        Такого адреса нет в приложении. Проверьте ссылку или вернитесь в библиотеку промптов.
      </p>
      <Link to="/" className="mt-6">
        <Button>На главную</Button>
      </Link>
    </div>
  )
}
