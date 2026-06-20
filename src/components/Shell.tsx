// App shell premium — glass header (Logo · Busca Global · Notificações ·
// Mensagens · Carteira · Perfil), sidebar elegante com indicador animado
// (Framer Motion layoutId) e área principal rolável. SVG Heroicons.
import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Session, BlaxxAPI, logout, fmtNumber } from '../lib/api-client'
import { BlaxxBrand } from './BlaxxBrand'

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
  wallet:        'M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3',
  chartBar:      'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  shoppingCart:  'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  paperAirplane: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5',
  arrowPath:     'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
  building:      'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
  gift:          'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1012 10.125A2.625 2.625 0 0012 4.875zM12 10.125v10.875M12 10.125a2.625 2.625 0 000-5.25m0 5.25a2.625 2.625 0 010-5.25M3 13.5l8.954-3.954M20.25 12l-8.25 3M3.75 9.75h16.5v4.5H3.75V9.75z',
  megaphone:     'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
  arrowsRL:      'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  globe:         'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
  chartPie:      'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z',
  lightBulb:     'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18',
  user:          'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  cog:           'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.077-.124.072-.044.146-.087.22-.128.331-.183.581-.495.644-.869l.213-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  logout:        'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
  bell:          'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  chat:          'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
  magnify:       'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z',
  grid:          'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  close:         'M6 18L18 6M6 6l12 12',
}

// ─── Nav items (agrupados) ───────────────────────────────────────────────────

interface NavEntry {
  to: string
  iconKey: keyof typeof ICONS
  label: string
  section?: string
}

const NAV: NavEntry[] = [
  { to: '/dashboard',      iconKey: 'home',          label: 'Dashboard' },
  { to: '/carteira',       iconKey: 'wallet',        label: 'Carteira' },
  { to: '/cartao',         iconKey: 'creditCard',    label: 'Cartão BlaXx' },
  { to: '/extrato',        iconKey: 'chartBar',      label: 'Extrato' },
  { to: '/comprar-pontos', iconKey: 'shoppingCart',  label: 'Comprar pontos',    section: 'OPERAÇÕES' },
  { to: '/enviar-pontos',  iconKey: 'paperAirplane', label: 'Transferências' },
  { to: '/vender-pontos',  iconKey: 'arrowPath',     label: 'Resgatar cashback' },
  { to: '/parceiros',      iconKey: 'building',      label: 'Marketplace' },
  { to: '/resgates',       iconKey: 'gift',          label: 'Resgates',          section: 'PROGRAMA' },
  { to: '/campanhas',      iconKey: 'megaphone',     label: 'Campanhas' },
  { to: '/exchange',       iconKey: 'arrowsRL',      label: 'Exchange' },
  { to: '/viagens',        iconKey: 'globe',         label: 'Viagens',           section: 'MUNDO' },
  { to: '/relatorios',     iconKey: 'chartPie',      label: 'Relatórios' },
  { to: '/intelligence',   iconKey: 'lightBulb',     label: 'Intelligence' },
  { to: '/perfil',         iconKey: 'user',          label: 'Perfil',            section: 'CONTA' },
  { to: '/seguranca',      iconKey: 'cog',           label: 'Configurações' },
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
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.span
                layoutId="navActivePill"
                className="nav-active-pill"
                transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              />
            )}
            <span className="icon">
              <Icon path={ICONS[n.iconKey]} size={18} />
            </span>
            <span>{n.label}</span>
          </>
        )}
      </NavLink>,
    )
  })

  return (
    <aside className="sidebar">
      <div className="logo logo-blaxx" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} aria-label="BlaXx">
        <BlaxxBrand markSize={30} fontSize={23} />
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

// ─── Header glass (Logo · Busca · Notificações · Mensagens · Carteira · Perfil) ─

const WHATSAPP_NUMBER = '5511924706095'

function GlassHeader() {
  const user = Session.user()
  const firstName = user?.name?.split(' ')[0] || 'Você'
  const [unread, setUnread] = useState(0)
  const [tierLabel, setTierLabel] = useState('Membro')
  const [balance, setBalance] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    BlaxxAPI.notificationsUnreadCount()
      .then((r) => alive && setUnread(r?.count || 0))
      .catch(() => {})
    BlaxxAPI.card()
      .then((r) => alive && r?.tier?.label && setTierLabel(r.tier.label))
      .catch(() => {})
    BlaxxAPI.wallet()
      .then((r) => alive && setBalance(r?.balance_pts ?? 0))
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const initials = (user?.name || '?')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const msgHref =
    'https://wa.me/' + WHATSAPP_NUMBER + '?text=' +
    encodeURIComponent('Olá! Preciso de ajuda com a BlaXx.')

  function runSearch() {
    navigate('/parceiros' + (query.trim() ? '?q=' + encodeURIComponent(query.trim()) : ''))
  }

  return (
    <header className="bx-header">
      {/* LOGO */}
      <div className="bx-header-logo" onClick={() => navigate('/dashboard')} role="button" aria-label="Ir para o início">
        <BlaxxBrand markSize={26} fontSize={19} />
      </div>

      {/* BUSCA GLOBAL */}
      <div className="bx-search">
        <span className="ic" style={{ display: 'grid', placeItems: 'center' }}>
          <Icon path={ICONS.magnify} size={17} />
        </span>
        <input
          type="text"
          placeholder="Buscar parceiros, campanhas, resgates…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          aria-label="Busca global"
        />
        <kbd className="kbd">⌘K</kbd>
      </div>

      {/* AÇÕES */}
      <div className="bx-actions">
        {/* Notificações */}
        <button
          className="bx-icon-btn"
          onClick={() => navigate('/central-notificacoes')}
          title="Notificações"
          aria-label="Notificações"
        >
          <Icon path={ICONS.bell} size={20} />
          {unread > 0 && <span className="bx-badge">{unread > 99 ? '99+' : unread}</span>}
        </button>

        {/* Mensagens (suporte) */}
        <a
          className="bx-icon-btn"
          href={msgHref}
          target="_blank"
          rel="noopener noreferrer"
          title="Mensagens / Suporte"
          aria-label="Mensagens"
        >
          <Icon path={ICONS.chat} size={20} />
        </a>

        {/* Carteira (saldo) */}
        <div
          className="bx-wallet-chip"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/carteira')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/carteira')}
          title="Carteira BlaXx"
        >
          <span className="ic"><Icon path={ICONS.wallet} size={18} /></span>
          <div className="v">
            {balance == null ? '—' : fmtNumber(balance)}
            <small>pts BlaXx</small>
          </div>
        </div>

        {/* Perfil */}
        <div
          className="bx-profile"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/perfil')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/perfil')}
          title={user?.name}
        >
          <div className="bx-avatar">{initials}</div>
          <div className="nm">
            <b>{firstName}</b>
            <span>{tierLabel}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Cabeçalho de página (rola sob o header) ─────────────────────────────────

function PageHeading() {
  const { meta } = useContext(TopbarCtx)
  if (!meta.title) return null
  return (
    <motion.div
      className="page-head"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      {meta.eyebrow && <span className="eyebrow">{meta.eyebrow}</span>}
      <h1>{meta.title}</h1>
    </motion.div>
  )
}

// ─── Topbar "title setter" — mantém a API das páginas existentes ─────────────

interface TopbarProps {
  eyebrow?: string
  title?: string
  children?: React.ReactNode
}

/**
 * Páginas chamam <Topbar eyebrow="..." title="..." /> exatamente como antes.
 * Escreve no contexto e não renderiza nada — o cabeçalho de página é exibido
 * por Shell (PageHeading), abaixo do header glass.
 */
export function Topbar({ eyebrow = '', title = '' }: TopbarProps) {
  const { setMeta } = useContext(TopbarCtx)

  // Atualiza o contexto na fase de commit (antes da pintura) — evita o
  // warning "Cannot update a component while rendering a different component"
  // e elimina o flash do título da página anterior.
  useLayoutEffect(() => {
    setMeta({ eyebrow, title })
  }, [eyebrow, title, setMeta])

  return null
}

/** Hook alternativo: `usePageTitle('My Page', 'Section')` */
export function usePageTitle(title: string, eyebrow = '') {
  const { setMeta } = useContext(TopbarCtx)
  useLayoutEffect(() => {
    setMeta({ title, eyebrow })
  }, [title, eyebrow, setMeta])
}

// ─── WhatsApp FAB ────────────────────────────────────────────────────────────

function WhatsAppFab() {
  const href =
    'https://wa.me/' +
    WHATSAPP_NUMBER +
    '?text=' +
    encodeURIComponent('Olá! Preciso de ajuda com a BlaXx.')
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-fab"
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
        boxShadow: '0 8px 24px rgba(0,0,0,.4)',
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

// ─── Navegação mobile: bottom tab bar + sheet "Mais" ─────────────────────────

const TAB_ITEMS: { to: string; iconKey: keyof typeof ICONS; label: string }[] = [
  { to: '/dashboard', iconKey: 'home',       label: 'Início' },
  { to: '/carteira',  iconKey: 'wallet',     label: 'Carteira' },
  { to: '/cartao',    iconKey: 'creditCard', label: 'Cartão' },
  { to: '/parceiros', iconKey: 'building',   label: 'Mercado' },
]

/**
 * Navegação mobile premium (estilo Apple Wallet / Nubank / Revolut): uma bottom
 * tab bar fixa com os destinos principais + um botão "Mais" que abre um sheet
 * deslizante com o menu completo agrupado. Oculta no desktop via CSS — a sidebar
 * volta a aparecer acima de 860px.
 */
function MobileNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const user = Session.user()
  const firstName = user?.name?.split(' ')[0] || 'Você'
  const initials = (user?.name || '?')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Trava o scroll do body e fecha no Esc enquanto o sheet está aberto.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  // Lista agrupada (reaproveita NAV) para o sheet.
  const sheetItems: JSX.Element[] = []
  NAV.forEach((n) => {
    if (n.section) {
      sheetItems.push(
        <div className="bx-sheet-sec" key={'ss-' + n.section}>{n.section}</div>,
      )
    }
    sheetItems.push(
      <NavLink
        key={'sl-' + n.to}
        to={n.to}
        className={({ isActive }) => 'bx-sheet-link' + (isActive ? ' active' : '')}
        onClick={() => setOpen(false)}
      >
        <span className="icon"><Icon path={ICONS[n.iconKey]} size={20} /></span>
        <span>{n.label}</span>
      </NavLink>,
    )
  })

  return (
    <>
      <nav className="bx-tabbar" aria-label="Navegação">
        {TAB_ITEMS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => 'bx-tab' + (isActive ? ' active' : '')}
          >
            <span className="bx-tab-ic"><Icon path={ICONS[t.iconKey]} size={22} /></span>
            <span className="bx-tab-lb">{t.label}</span>
          </NavLink>
        ))}
        <button
          className={'bx-tab' + (open ? ' active' : '')}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="bx-tab-ic"><Icon path={ICONS.grid} size={22} /></span>
          <span className="bx-tab-lb">Mais</span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="bx-sheet-backdrop"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="bx-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Menu completo"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <div className="bx-sheet-grip" />
              <div className="bx-sheet-head">
                <div className="bx-sheet-user">
                  <div className="bx-avatar">{initials}</div>
                  <div>
                    <b>{firstName}</b>
                    <span>Menu completo</span>
                  </div>
                </div>
                <button className="bx-sheet-x" onClick={() => setOpen(false)} aria-label="Fechar menu">
                  <Icon path={ICONS.close} size={20} />
                </button>
              </div>
              <div className="bx-sheet-body">
                {sheetItems}
                <button className="bx-sheet-link logout" onClick={handleLogout}>
                  <span className="icon"><Icon path={ICONS.logout} size={20} /></span>
                  <span>Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Shell ───────────────────────────────────────────────────────────────────

/** Layout com sidebar + header glass + área principal. */
export default function Shell() {
  const [meta, setMeta] = useState<PageMeta>({ eyebrow: '', title: '' })

  // Pinta o <body> de escuro enquanto o shell logado está montado, para que a
  // área de overscroll (rubber-band) e páginas mais curtas que a viewport não
  // revelem o fundo claro. Reverte ao sair (páginas públicas).
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = '#050505'
    return () => {
      document.body.style.background = prev
    }
  }, [])

  return (
    <TopbarCtx.Provider value={{ meta, setMeta }}>
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <GlassHeader />
          <div className="main-content">
            <PageHeading />
            <Outlet />
          </div>
        </main>
        <MobileNav />
        <WhatsAppFab />
      </div>
    </TopbarCtx.Provider>
  )
}
