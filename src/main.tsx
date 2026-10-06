import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppToaster } from './components/AppToaster'
import { initThemeFromStorage } from './lib/theme'
import { router } from './app/routes'
import './tailwind.css'
import './style.scss'

initThemeFromStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <AppToaster />
  </StrictMode>,
)
