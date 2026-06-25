// Command Palette global — ⌘K (macOS) / Ctrl+K (Win/Linux).
// Padrão Apple HIG / Stripe / Linear: search + lista navegável por teclado,
// nunca por mouse-hover (evita jumpy UX). Atalhos Esc/↑/↓/Enter.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../lib/api-client'

interface Cmd {
  id: string
  label: string
  hint?: string
  /** Categoria visível como chip; agrupa visualmente. */
  group: 'Navegar' | 'Conta' | 'Ações'
  /** Pista pra fuzzy match — concatenamos com o label. */
  keywords?: string
  /** Ação a executar — função pode navegar, abrir link, copiar, etc. */
  action: () => void | Promise<void>
}

function buildCommands(navigate: (to: string) => void): Cmd[] {
  const go = (to: string) => () => navigate(to)
  return [
    // Navegar
    { id: 'nav-dashboard',    group: 'Navegar', label: 'Dashboard',          hint: '/dashboard',         action: go('/dashboard') },
    { id: 'nav-carteira',     group: 'Navegar', label: 'Carteira',           hint: '/carteira',          action: go('/carteira') },
    { id: 'nav-extrato',      group: 'Navegar', label: 'Extrato',            hint: '/extrato',           action: go('/extrato') },
    { id: 'nav-cartao',       group: 'Navegar', label: 'Cartão BlaXx',       hint: '/cartao',            action: go('/cartao') },
    { id: 'nav-parceiros',    group: 'Navegar', label: 'Parceiros',          hint: '/parceiros',         keywords: 'marketplace lojas',  action: go('/parceiros') },
    { id: 'nav-resgates',     group: 'Navegar', label: 'Resgates',           hint: '/resgates',          keywords: 'benefícios vouchers', action: go('/resgates') },
    { id: 'nav-campanhas',    group: 'Navegar', label: 'Campanhas',          hint: '/campanhas',         keywords: 'missões desafios',   action: go('/campanhas') },
    { id: 'nav-indique',      group: 'Navegar', label: 'Indique e ganhe',    hint: '/indique',           keywords: 'referral convite',    action: go('/indique') },
    { id: 'nav-conquistas',   group: 'Navegar', label: 'Conquistas',         hint: '/conquistas',        keywords: 'badges medals',       action: go('/conquistas') },
    { id: 'nav-relatorios',   group: 'Navegar', label: 'Relatórios',         hint: '/relatorios',        action: go('/relatorios') },
    { id: 'nav-status',       group: 'Navegar', label: 'Status público',     hint: '/status',            keywords: 'uptime saúde',        action: go('/status') },
    // Conta
    { id: 'nav-perfil',       group: 'Conta',   label: 'Perfil',             hint: '/perfil',            action: go('/perfil') },
    { id: 'nav-seguranca',    group: 'Conta',   label: 'Segurança',          hint: '/seguranca',         keywords: 'senha 2FA mfa',       action: go('/seguranca') },
    { id: 'nav-notif',        group: 'Conta',   label: 'Notificações',       hint: '/central-notificacoes', action: go('/central-notificacoes') },
    { id: 'nav-excluir',      group: 'Conta',   label: 'Excluir conta',      hint: '/excluir-conta',     keywords: 'deletar lgpd',        action: go('/excluir-conta') },
    // Ações
    {
      id: 'act-comprar',
      group: 'Ações', label: 'Comprar pontos', hint: 'fluxo de compra PIX',
      keywords: 'pix comprar',
      action: go('/comprar-pontos'),
    },
    {
      id: 'act-enviar',
      group: 'Ações', label: 'Enviar pontos', hint: 'transferir P2P',
      keywords: 'transferir',
      action: go('/enviar-pontos'),
    },
    {
      id: 'act-resgatar',
      group: 'Ações', label: 'Resgatar em PIX', hint: 'cashback',
      keywords: 'cashback resgate',
      action: go('/vender-pontos'),
    },
    {
      id: 'act-logout',
      group: 'Ações', label: 'Sair (logout)', hint: 'encerra a sessão',
      keywords: 'sign out exit',
      action: async () => { await logout(); navigate('/login') },
    },
  ]
}

function score(cmd: Cmd, q: string): number {
  if (!q) return 1
  const hay = (cmd.label + ' ' + (cmd.hint || '') + ' ' + (cmd.keywords || '')).toLowerCase()
  const needle = q.toLowerCase()
  if (hay.includes(needle)) {
    // Pontuação: prefixo do label > início de palavra > qualquer match
    if (cmd.label.toLowerCase().startsWith(needle)) return 3
    if (hay.split(/\s+/).some((w) => w.startsWith(needle))) return 2
    return 1
  }
  return 0
}

export default function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo(() => buildCommands(navigate), [navigate])
  const filtered = useMemo(() => {
    return commands
      .map((c) => ({ c, s: score(c, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.c.label.localeCompare(b.c.label))
      .map((x) => x.c)
  }, [commands, q])

  // Toggle global (⌘K / Ctrl+K). Esc fecha. ↑↓ navegam. Enter executa.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isOpenCombo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isOpenCombo) {
        e.preventDefault()
        setOpen((v) => !v)
        setQ('')
        setCursor(0)
        return
      }
      if (!open) return
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => Math.min(filtered.length - 1, c + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => Math.max(0, c - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = filtered[cursor]
        if (cmd) {
          setOpen(false)
          void cmd.action()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, cursor])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Reset cursor quando a query muda (não fica apontando pra um índice inválido).
  useEffect(() => { setCursor(0) }, [q])

  const execute = useCallback((cmd: Cmd) => {
    setOpen(false)
    void cmd.action()
  }, [])

  if (!open) return null

  // Agrupa por categoria pra exibição (mantém a ordem do filtrado).
  const groups: Record<string, Cmd[]> = {}
  filtered.forEach((c) => {
    if (!groups[c.group]) groups[c.group] = []
    groups[c.group].push(c)
  })

  // cursor global precisa virar (grupo, índice local) pra estilizar
  let runningIdx = 0

  return (
    <div
      className="blx-cmdk"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar comandos"
      onClick={() => setOpen(false)}
    >
      <div className="blx-cmdk__panel" onClick={(e) => e.stopPropagation()}>
        <div className="blx-cmdk__inputwrap">
          <span aria-hidden>⌘K</span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar página, ação ou parceiro…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Buscar"
          />
          <kbd className="blx-cmdk__esc">Esc</kbd>
        </div>
        <div className="blx-cmdk__list" role="listbox" aria-label="Resultados">
          {filtered.length === 0 ? (
            <div className="blx-cmdk__empty">Nada por aqui — tente "carteira" ou "pix".</div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} className="blx-cmdk__group">
                <div className="blx-cmdk__grouphead">{group}</div>
                {items.map((c) => {
                  const idx = runningIdx++
                  const active = idx === cursor
                  return (
                    <button
                      key={c.id}
                      role="option"
                      aria-selected={active}
                      className={'blx-cmdk__item' + (active ? ' is-active' : '')}
                      onMouseEnter={() => setCursor(idx)}
                      onClick={() => execute(c)}
                    >
                      <span className="blx-cmdk__label">{c.label}</span>
                      {c.hint && <span className="blx-cmdk__hint">{c.hint}</span>}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
