import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-primary-muted text-primary font-medium' : 'text-text-muted hover:text-text hover:bg-white/5'
  }`

const navItems = [
  { to: '/', end: true, label: 'Библиотека' },
  { to: '/optimizer', label: 'Оптимизатор' },
  { to: '/collections', label: 'Коллекции' },
  { to: '/import-export', label: 'Импорт / экспорт' },
  { to: '/settings', label: 'Настройки' },
  { to: '/guide', label: 'Как пользоваться' },
] as const

export function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  return (
    <div className="flex h-full overflow-hidden">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          aria-label="Закрыть меню"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-56 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-zinc-900 font-bold text-sm">
            AI
          </span>
          <div className="min-w-0">
            <div className="font-semibold leading-tight truncate">Prompt Studio</div>
            <div className="text-xs text-text-muted">MVP</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : undefined}
              className={navLinkClass}
              onClick={() => setMobileNavOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 md:hidden">
          <button
            type="button"
            className="rounded-lg border border-border px-2 py-1 text-sm"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-expanded={mobileNavOpen}
          >
            Меню
          </button>
          <span className="font-semibold text-primary truncate">AI Prompt Studio</span>
        </header>
        <main className="app-main-scroll min-h-0 flex-1 p-4 sm:p-5 md:p-6">
          <div className="mx-auto w-full min-w-0 max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
