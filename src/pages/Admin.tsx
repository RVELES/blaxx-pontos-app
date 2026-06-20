// Admin — port fiel de admin.html + admin.js (KPIs, usuários paginados c/ filtros +
// toggle VIP, movimentações paginadas c/ filtro de tipo). Guard de papel === admin.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AdminStats,
  AdminTx,
  AdminUser,
  BlaxxAPI,
  Session,
  fmtNumber,
  logout,
  toast,
} from '../lib/api-client'

const USERS_LIMIT = 25
const TX_LIMIT = 50

function shortDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

type Tab = 'users' | 'transactions'

export default function Admin() {
  const navigate = useNavigate()
  const user = Session.user()
  const isAdmin = !!user && (user.role === 'admin' || user.is_admin === true)

  const [tab, setTab] = useState<Tab>('users')
  const [stats, setStats] = useState<AdminStats | null>(null)

  // Users
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [vipFilter, setVipFilter] = useState('')
  const [usersErr, setUsersErr] = useState('')
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Transactions
  const [txs, setTxs] = useState<AdminTx[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txPage, setTxPage] = useState(0)
  const [txType, setTxType] = useState('')
  const [txLoaded, setTxLoaded] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      setStats(await BlaxxAPI.adminStats())
    } catch {
      /* silencioso */
    }
  }, [])

  const loadUsers = useCallback(async () => {
    const params = [`limit=${USERS_LIMIT}`, `offset=${usersPage * USERS_LIMIT}`]
    if (search.trim()) params.push('q=' + encodeURIComponent(search.trim()))
    if (roleFilter) params.push('role=' + roleFilter)
    if (vipFilter) params.push('vip=' + vipFilter)
    try {
      const r = await BlaxxAPI.adminUsers(params.join('&'))
      setUsers(r.items)
      setUsersTotal(r.total)
      setUsersErr('')
    } catch (e) {
      setUsersErr((e as Error).message)
    }
  }, [usersPage, search, roleFilter, vipFilter])

  const loadTransactions = useCallback(async () => {
    const params = [`limit=${TX_LIMIT}`, `offset=${txPage * TX_LIMIT}`]
    if (txType) params.push('type=' + txType)
    try {
      const r = await BlaxxAPI.adminTransactions(params.join('&'))
      setTxs(r.items)
      setTxTotal(r.total)
      setTxLoaded(true)
    } catch {
      /* silencioso */
    }
  }, [txPage, txType])

  useEffect(() => {
    if (!isAdmin) return
    loadStats()
  }, [isAdmin, loadStats])

  useEffect(() => {
    if (!isAdmin) return
    loadUsers()
  }, [isAdmin, loadUsers])

  useEffect(() => {
    if (!isAdmin) return
    if (tab === 'transactions') loadTransactions()
  }, [isAdmin, tab, loadTransactions])

  // Busca com debounce → reseta página
  function onSearchChange(v: string) {
    setSearch(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => setUsersPage(0), 300)
  }

  async function toggleVip(u: AdminUser, next: boolean) {
    // Otimista: atualiza UI, reverte em erro.
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_vip: next } : x)))
    try {
      await BlaxxAPI.adminToggleVip(u.id, next)
      loadStats()
    } catch (e) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_vip: !next } : x)))
      toast('Falha ao atualizar VIP: ' + (e as Error).message, 'error', 3000)
    }
  }

  if (!isAdmin) {
    return (
      <div className="main center" style={{ minHeight: '100vh' }}>
        <div className="card elevated center-text" style={{ maxWidth: 460 }}>
          <span className="eyebrow" style={{ color: 'var(--negative)' }}>
            Acesso restrito
          </span>
          <h2>Apenas administradores</h2>
          <p className="subtitle">Esta área é exclusiva para contas com papel de administrador.</p>
          <button className="btn primary mt-4" onClick={() => navigate('/dashboard')}>
            Voltar ao dashboard
          </button>
        </div>
      </div>
    )
  }

  const usersInfo =
    'Mostrando ' +
    (users.length ? usersPage * USERS_LIMIT + 1 : 0) +
    '–' +
    (usersPage * USERS_LIMIT + users.length) +
    ' de ' +
    usersTotal
  const txInfo =
    'Mostrando ' +
    (txs.length ? txPage * TX_LIMIT + 1 : 0) +
    '–' +
    (txPage * TX_LIMIT + txs.length) +
    ' de ' +
    txTotal

  const totalVol = stats?.volume_last_30d_by_type
    ? Object.values(stats.volume_last_30d_by_type).reduce((a, b) => a + (b || 0), 0)
    : 0

  return (
    <div className="main" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 32, marginBottom: 4 }}>Painel do Administrador</h1>
          <p className="muted">Visão geral e gestão de usuários, transações e VIPs.</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            {(user?.name || '').split(' ')[0]}
          </span>
          <button className="btn ghost" onClick={() => navigate('/dashboard')}>
            Voltar
          </button>
          <button
            className="btn dark"
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, margin: '24px 0 28px' }}>
        {stats && (
          <>
            <Kpi label="Usuários" value={fmtNumber(stats.total_users)} subtitle="cadastrados no total" />
            <Kpi label="Admins" value={fmtNumber(stats.total_admins)} subtitle="com acesso ao painel" />
            <Kpi label="VIPs" value={fmtNumber(stats.total_vips)} subtitle="sem limite diário" />
            <Kpi label="E-mail verificado" value={fmtNumber(stats.email_verified_users)} subtitle="usuários ativos" />
            <Kpi label="Saldo total" value={fmtNumber(stats.total_balance_pts) + ' pts'} subtitle="pontos em circulação" />
            <Kpi label="Volume 30d" value={fmtNumber(totalVol) + ' pts'} subtitle="movimentado" />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="row" style={{ gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 18 }}>
        {(['users', 'transactions'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: tab === t ? 'var(--blaxx-black)' : 'var(--gray-600)',
              borderBottom: '2px solid ' + (tab === t ? 'var(--blaxx-lime)' : 'transparent'),
            }}
          >
            {t === 'users' ? 'Usuários' : 'Movimentações'}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
            <input
              type="search"
              placeholder="Buscar por nome, email ou CPF..."
              autoComplete="off"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)' }}
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                setUsersPage(0)
                setRoleFilter(e.target.value)
              }}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)' }}
            >
              <option value="">Todos os papéis</option>
              <option value="user">Apenas usuários</option>
              <option value="admin">Apenas admins</option>
            </select>
            <select
              value={vipFilter}
              onChange={(e) => {
                setUsersPage(0)
                setVipFilter(e.target.value)
              }}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)' }}
            >
              <option value="">Todos</option>
              <option value="true">Apenas VIPs</option>
              <option value="false">Não VIPs</option>
            </select>
          </div>

          <table className="blaxx">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>CPF</th>
                <th>Saldo</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>VIP</th>
              </tr>
            </thead>
            <tbody>
              {usersErr ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-600)' }}>
                    Erro ao carregar: {usersErr}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-600)' }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.role === 'admin' && <span className="chip dark">ADMIN</span>} {u.name}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.cpf || '—'}</td>
                    <td>{fmtNumber(u.balance_pts)} pts</td>
                    <td>
                      {u.is_vip && <span className="chip warning">VIP</span>}{' '}
                      {u.email_verified ? (
                        <span className="chip success">✓ verificado</span>
                      ) : (
                        <span className="chip danger">não verificado</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={!!u.is_vip}
                        onChange={(e) => toggleVip(u, e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#7CFF00' }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="row between mt-4" style={{ fontSize: 13, color: 'var(--gray-600)' }}>
            <span>{usersInfo}</span>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn ghost"
                disabled={usersPage === 0}
                onClick={() => setUsersPage((p) => Math.max(0, p - 1))}
              >
                ‹ Anterior
              </button>
              <button
                className="btn ghost"
                disabled={(usersPage + 1) * USERS_LIMIT >= usersTotal}
                onClick={() => setUsersPage((p) => p + 1)}
              >
                Próxima ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions tab */}
      {tab === 'transactions' && (
        <div>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <select
              value={txType}
              onChange={(e) => {
                setTxPage(0)
                setTxType(e.target.value)
              }}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)' }}
            >
              <option value="">Todos os tipos</option>
              <option value="purchase">Compra</option>
              <option value="transfer_in">Recebido</option>
              <option value="transfer_out">Enviado</option>
              <option value="redeem">Resgate</option>
              <option value="refund">Estorno</option>
              <option value="bonus">Bônus</option>
            </select>
          </div>

          <table className="blaxx">
            <thead>
              <tr>
                <th>Data</th>
                <th>Usuário</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'right' }}>Valor (pts)</th>
              </tr>
            </thead>
            <tbody>
              {!txLoaded ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-600)' }}>
                    Carregando…
                  </td>
                </tr>
              ) : txs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-600)' }}>
                    Nenhuma transação.
                  </td>
                </tr>
              ) : (
                txs.map((t, i) => {
                  const pos = t.amount_pts > 0
                  return (
                    <tr key={i}>
                      <td>{shortDate(t.created_at)}</td>
                      <td>
                        {t.user_name || '—'}
                        <br />
                        <small style={{ color: 'var(--gray-600)' }}>{t.user_email || ''}</small>
                      </td>
                      <td>{t.type}</td>
                      <td>{t.description || '—'}</td>
                      <td
                        style={{ textAlign: 'right', fontWeight: 700 }}
                        className={pos ? 'amount-pos' : 'amount-neg'}
                      >
                        {pos ? '+' : ''}
                        {fmtNumber(t.amount_pts)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          <div className="row between mt-4" style={{ fontSize: 13, color: 'var(--gray-600)' }}>
            <span>{txInfo}</span>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn ghost"
                disabled={txPage === 0}
                onClick={() => setTxPage((p) => Math.max(0, p - 1))}
              >
                ‹ Anterior
              </button>
              <button
                className="btn ghost"
                disabled={(txPage + 1) * TX_LIMIT >= txTotal}
                onClick={() => setTxPage((p) => p + 1)}
              >
                Próxima ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="card">
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--gray-600)',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--blaxx-black)', marginTop: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4 }}>{subtitle}</div>
    </div>
  )
}
