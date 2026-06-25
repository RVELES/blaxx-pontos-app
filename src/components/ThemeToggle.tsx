// Toggle de tema claro/escuro — usado APENAS nas rotas públicas (Home/Login/
// Cadastro/Status/Sitemap). Área autenticada permanece dark (regra de marca).
// Persiste em localStorage `blaxx_theme`; sem valor, segue `prefers-color-scheme`.
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const KEY = 'blaxx_theme'

function detect(): Theme {
  try {
    const saved = localStorage.getItem(KEY) as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* noop */ }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'dark'
}

function apply(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  // Atualiza theme-color do <meta> pra status bar mobile combinar.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#F4F4F0' : '#0A0A0A')
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => detect())

  useEffect(() => {
    apply(theme)
    try { localStorage.setItem(KEY, theme) } catch { /* noop */ }
  }, [theme])

  return (
    <button
      type="button"
      className="blx-theme"
      aria-label={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
      title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}

/** Helper pra aplicar o tema cedo (em <App> mount), evitando flash. */
export function bootThemeFromStorage() {
  apply(detect())
}
