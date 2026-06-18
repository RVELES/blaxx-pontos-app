// App shell autenticado — dark sidebar, context-based topbar, SVG Heroicons.
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Session, BlaxxAPI, logout } from '../lib/api-client'

// ─── Topbar context ──────────────────────────────────────────────────────────

interface PageMeta { eyebrow: string; title: string }
interface TopbarCtxValue { meta: PageMeta; setMeta: (m: PageMeta) => void }

const TopbarCtx = createContext<TopbarCtxValue>({
  meta: { eyebrow: '', title: '' },
  setMeta: () => {},
})

// ─── SVG icon helpers (Heroicons 24px outline) ───────────────────────────────

function Icon({ path, size = 20 }: { path: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={path} />
    </svg>
  )
}

// Heroicons outline paths
const ICONS = {
  home:          'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  creditCard:    'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
  identification:'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0zm1.5 0A4.125 4.125 0 014.875 13.5H15v-.375c0-2.278-1.847-4.125-4.125-4.125H7.5a4.125 4.125 0 01-3 .375',
  chartBar:      'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  shoppingCart:  'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  paperAirplane: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5',
  arrowPath:     'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
  building:      'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
  gift:          'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1012 10.125A2.625 2.625 0 0012 4.875zM12 10.125v10.875M12 10.125a2.625 2.625 0 000-5.25m0 5.25a2.625 2.625 0 010-5.25M3 13.5l8.954-3.954M20.25 12l-8.25 3M3.75 9.75h16.5v4.5H3.75V9.75z',
  megaphone:     'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
  arrowsRL:      'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  chartPie:      'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z',
  lightBulb:     'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18',
  user:          'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  shieldCheck:   'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  logout:        'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
  bell:          'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  giftTopbar:    'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1012 10.125A2.625 2.625 0 0012 4.875zM12 10.125v10.875M3.75 9.75h16.5v1.5H3.75V9.75z',
  magnify:       'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z',
}

// ─── Nav items ───────────────────────────────────────────────────────────────

interface NavEntry {
  to: string
  iconKey: keyof typeof ICONS
  label: string
  section?: string
}

const NAV: NavEntry[] = [
  { to: '/dashboard',      iconKey: 'home',         label: 'Início' },
  { to: '/carteira',       iconKey: 'creditCard',    label: 'Carteira' },
  { to: '/cartao',         iconKey: 'identification',label: 'Cartão Blaxx' },
  { to: '/extrato',        iconKey: 'chartBar',      label: 'Extrato' },
  { to: '/comprar-pontos', iconKey: 'shoppingCart',  label: 'Comprar pontos',    section: 'OPERAÇÕES' },
  { to: '/enviar-pontos',  iconKey: 'paperAirplane', label: 'Enviar pontos' },
  { to: '/vender-pontos',  iconKey: 'arrowPath',     label: 'Resgatar cashback' },
  { to: '/parceiros',      iconKey: 'building',      label: 'Parceiros',         section: 'PROGRAMA' },
  { to: '/resgates',       iconKey: 'gift',          label: 'Resgates' },
  { to: '/campanhas',      iconKey: 'megaphone',     label: 'Campanhas' },
  { to: '/exchange',       iconKey: 'arrowsRL',      label: 'Exchange',          section: 'MUNDO' },
  { to: '/viagens',        iconKey: 'paperAirplane', label: 'Viagens' },
  { to: '/relatorios',     iconKey: 'chartPie',      label: 'Relatórios' },
  { to: '/intelligence',   iconKey: 'lightBulb',     label: 'Intelligence' },
  { to: '/perfil',         iconKey: 'user',          label: 'Perfil',            section: 'CONTA' },
  { to: '/seguranca',      iconKey: 'shieldCheck',   label: 'Segurança' },
]

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const items: JSX.Element[] = []
  NAV.forEach((n) => {
    if (n.section) {
      items.push(
        <div className="section-label" key={'sec-' + n.section}>
          {n.section}
        </div>,
      )
    }
    items.push(
      <NavLink
        key={n.to}
        to={n.to}
        className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
      >
        <span className="icon">
          <Icon path={ICONS[n.iconKey]} size={18} />
        </span>
        <span>{n.label}</span>
      </NavLink>,
    )
  })

  return (
    <aside className="sidebar">
      <div className="logo logo-blaxx">
        <img className="brand-logo" src="/blaxx-logo-dark.png" alt="BLAXX Pontos" />
      </div>
      {items}
      <div
        className="nav-item"
        style={{ marginTop: 'auto' }}
        onClick={handleLogout}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleLogout()}
      >
        <span className="icon">
          <Icon path={ICONS.logout} size={18} />
        </span>
        <span>Sair</span>
      </div>
      <div className="sidebar-footer">Créditos promocionais · uso restrito</div>
    </aside>
  )
}

// ─── Visual Topbar (rendered by Shell) ───────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function VisualTopbar() {
  const { meta } = useContext(TopbarCtx)
  const user = Session.user()
  const firstName = user?.name?.split(' ')[0] || ''
  const [unread, setUnread] = useState(0)
  const [tierLabel, setTierLabel] = useState('Black')
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    BlaxxAPI.notificationsUnreadCount()
      .then((r) => alive && setUnread(r?.count || 0))
      .catch(() => {})
    BlaxxAPI.card()
      .then((r) => alive && r?.tier?.label && setTierLabel(r.tier.label))
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const initials = (user?.name || '?')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const defaultTitle = `${greeting()}, ${firstName} 👋`
  const displayTitle = meta.title || defaultTitle

  return (
    <div className="topbar">
      {/* LEFT: greeting / page title */}
      <div className="greeting">
        <h2 className="topbar-title">{displayTitle}</h2>
        {meta.eyebrow && <span className="topbar-eyebrow">{meta.eyebrow}</span>}
      </div>

      {/* CENTER: search bar */}
      <div className="search-bar-wrap">
        <div className="search-bar">
          <span className="search-icon">
            <Icon path={ICONS.magnify} size={16} />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por parceiros, campanhas, produtos..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate('/parceiros')
            }}
            readOnly
            onClick={() => navigate('/parceiros')}
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </div>

      {/* RIGHT: actions */}
      <div className="actions">
        <button
          className="topbar-icon topbar-gift"
          onClick={() => navigate('/resgates')}
          title="Resgates"
          aria-label="Resgates"
        >
          <Icon path={ICONS.giftTopbar} size={20} />
        </button>
        <button
          className="topbar-icon notif-btn"
          onClick={() => navigate('/central-notificacoes')}
          title="Notificações"
          aria-label="Notificações"
        >
          <Icon path={ICONS.bell} size={20} />
          {unread > 0 && (
            <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>
          )}
        </button>
        <div
          className="user-chip"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/perfil')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/perfil')}
          title={user?.name}
        >
          <div className="avatar">{initials}</div>
          <div className="user-meta">
            <span className="user-name">{firstName || 'Você'}</span>
            <span className="user-level">{tierLabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Topbar "title setter" — keeps existing page API intact ──────────────────

interface TopbarProps {
  eyebrow?: string
  title?: string
  children?: React.ReactNode
}

/**
 * Pages call <Topbar eyebrow="..." title="..." /> exactly as before.
 * This component now writes into context and renders nothing itself —
 * the visual topbar is rendered once by Shell, above <Outlet />.
 */
export function Topbar({ eyebrow = '', title = '' }: TopbarProps) {
  const { setMeta } = useContext(TopbarCtx)
  const prevRef = useRef<string>('')
  const key = eyebrow + '||' + title

  if (prevRef.current !== key) {
    prevRef.current = key
    // Synchronous context update during render (safe: same render cycle, no extra commit)
    setMeta({ eyebrow, title })
  }

  // Also fire in an effect to handle StrictMode double-invoke / edge cases
  useEffect(() => {
    setMeta({ eyebrow, title })
  }, [eyebrow, title, setMeta])

  return null
}

/** Hook alternative: `usePageTitle('My Page', 'Section')` */
export function usePageTitle(title: string, eyebrow = '') {
  const { setMeta } = useContext(TopbarCtx)
  useEffect(() => {
    setMeta({ title, eyebrow })
  }, [title, eyebrow, setMeta])
}

// ─── WhatsApp FAB ────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '5511924706095'
function WhatsAppFab() {
  const href =
    'https://wa.me/' +
    WHATSAPP_NUMBER +
    '?text=' +
    encodeURIComponent('Olá! Preciso de ajuda com a Blaxx Pontos.')
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Falar no WhatsApp"
      aria-label="Falar no WhatsApp"
      style={{
        position: 'fixed',
        right: 22,
        bottom: 22,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: '#25D366',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,.28)',
        zIndex: 900,
        textDecoration: 'none',
      }}
    >
      <svg width="30" height="30" viewBox="0 0 32 32" fill="#fff" aria-hidden="true">
        <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.3.7 4.5 1.9 6.4L4 29l7.9-2.1c1.8 1 3.9 1.5 6.1 1.5 6.6 0 12-5.3 12-11.9C30 8.3 24.6 3 18 3h-2zm0 2.4c5.5 0 9.9 4.3 9.9 9.5S21.5 24.4 16 24.4c-2 0-3.9-.6-5.5-1.6l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1.1-1.7-1.7-3.6-1.7-5.6 0-5.2 4.5-9.5 10-9.5zm-4.8 5c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.3 1.4 3.5c.2.2 2.4 3.8 6 5.2 3 1.2 3.6 1 4.3.9.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.2-.4-.3-.8-.5-.4-.2-2.2-1.1-2.6-1.2-.3-.1-.6-.2-.8.2-.2.3-.9 1.2-1.1 1.4-.2.2-.4.2-.7.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.3 0-.5.2-.7l.5-.6c.2-.2.2-.4.4-.6.1-.2.1-.4 0-.6-.1-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6h-.7z" />
      </svg>
    </a>
  )
}

// ─── Shell ───────────────────────────────────────────────────────────────────

/** Layout com sidebar + topbar + área principal. */
export default function Shell() {
  const [meta, setMeta] = useState<PageMeta>({ eyebrow: '', title: '' })

  // Pinta o <body> de escuro enquanto o shell logado está montado, para que a
  // área de overscroll (rubber-band) e qualquer página mais curta que a
  // viewport não revelem o fundo claro. Reverte ao sair (páginas públicas).
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = '#080B0E'
    return () => {
      document.body.style.background = prev
    }
  }, [])

  return (
    <TopbarCtx.Provider value={{ meta, setMeta }}>
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <VisualTopbar />
          <Outlet />
        </main>
        <WhatsAppFab />
      </div>
    </TopbarCtx.Provider>
  )
}
