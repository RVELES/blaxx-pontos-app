import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ErrorBoundary } from './components/ErrorBoundary'
import ConsentBanner from './components/ConsentBanner'
import { bootThemeFromStorage } from './components/ThemeToggle'
import { initWebVitals } from './lib/web-vitals'
import './fonts.css'  // self-hosted Space Grotesk (antes do design system)
import './styles.css'
import './components/components.css'  // estilos dos componentes auxiliares

// Tema cedo, antes de qualquer render, pra evitar flash light→dark ou vice-versa.
bootThemeFromStorage()

// RUM-VITALS: dispara após o render inicial pra não atrapalhar o FCP.
// Pode rodar bem cedo — só registra observers; eventos chegam async.
initWebVitals()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ConsentBanner />
    </ErrorBoundary>
  </React.StrictMode>,
)
