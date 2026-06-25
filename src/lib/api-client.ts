// =======================================================================
// BlaXx · Cliente de API + Session (port fiel de
// blaxx_exe/renderer/assets/app.js — fonte de verdade: Windows).
// Mantém: resolução de base URL, Session em localStorage `blaxx_session`,
// wrapper api() com Bearer + handler global 401, helpers de formatação.
// =======================================================================

// ---------- Tipos (DTOs canônicos do backend) ----------
export interface User {
  id: string
  name: string
  email: string
  cpf?: string
  pix_key?: string
  phone?: string
  phone_verified?: boolean
  mfa_enabled?: boolean
  mfa_method?: string
  has_password?: boolean
  auth_provider?: string
  is_email_verified?: boolean
  is_admin?: boolean
  role?: string
  is_vip?: boolean
  created_at?: string
}

export interface AdminStats {
  total_users: number
  total_admins: number
  total_vips: number
  email_verified_users: number
  total_balance_pts: number
  volume_last_30d_by_type?: Record<string, number>
}

export interface AdminUser {
  id: string
  name: string
  email: string
  cpf?: string
  balance_pts: number
  role?: string
  is_vip?: boolean
  email_verified?: boolean
}

export interface AdminTx {
  created_at: string
  user_name?: string
  user_email?: string
  type: string
  description?: string
  amount_pts: number
}

export interface Paginated<T> {
  items: T[]
  total: number
}

export interface Notification {
  id: string
  type?: string
  icon?: string
  title: string
  body?: string
  is_read?: boolean
  created_at: string
}

export interface AuthSession {
  id: string
  device_name?: string
  ip_address?: string
  last_used_at?: string
  current?: boolean
}

export interface AccessLogItem {
  at?: string
  event: string
  device?: string
  ip?: string
}

export interface Wallet {
  balance_pts: number
  pending_pts: number
  balance_brl_equiv: number
}

export type TxType =
  | 'purchase' | 'transfer_in' | 'transfer_out'
  | 'redeem' | 'refund' | 'bonus'

export interface Transaction {
  id: string
  type: TxType | string
  amount_pts: number
  status: 'pending' | 'confirmed' | 'reversed' | string
  description: string
  created_at: string
}

export interface SessionData {
  token: string
  user: User
}

export interface LoginResponse {
  token?: string
  user?: User
  // 2FA pendente
  mfa_required?: boolean
  mfa_challenge_token?: string
  mfa_phone_hint?: string
  mfa_method?: string
}

export interface PixPackage {
  key: string
  label?: string
  points: number
  price_brl: number
}

export interface PixCharge {
  id: string
  br_code?: string
  qr_code_image?: string
  amount_brl: number
  points_to_credit?: number
  expires_at?: string
  status?: string
}

export interface TransferReceipt {
  amount_pts?: number
  receipt_code?: string
}

export interface RedeemQuote {
  amount_brl: number
  rate: string
}

export interface RedeemResult {
  amount_brl: number
  points_debited?: number
  end_to_end_id?: string
  status?: string
}

export interface Campaign {
  id: string
  name: string
  description?: string
  mechanic?: string
  reward_pts: number
  target_brl: number
  progress_brl?: number
  progress_pct?: number
  joined?: boolean
  completed_at?: string | null
}

export interface CustomCharge {
  id: string
  amount_brl: number
  br_code?: string
  qr_code_image?: string
  status?: 'pending' | 'confirming' | 'paid' | 'rejected' | 'expired' | string
}

export interface Benefit {
  id: string
  name: string
  description?: string
  category?: string
  cost_pts: number
  image_emoji?: string
  tag?: string
  partner_name?: string
  expires_in_days?: number
  stock?: number
}

export interface Partner {
  id: string
  name: string
  category: string
  description?: string
  logo_emoji?: string
  accrual_rule?: string
  benefits?: Benefit[]
}

export interface Voucher {
  id: string
  code: string
  benefit_name?: string
  points_spent: number
  expires_at: string
  status: 'active' | 'used' | string
}

// Níveis de cliente (loyalty tiers) + Cartão Blaxx / Apple Wallet
export interface Tier {
  key: string
  label: string
  min_points: number
  color: string
  text_color: string
  perks?: string
}

export interface CardState {
  member: { id: string; name: string }
  balance_pts: number
  lifetime_points: number
  tier: Tier
  next_tier: Tier | null
  points_to_next: number
  progress_pct: number
  tiers: Tier[]
  wallet_pass_available: boolean
}

// ---------- Resolução da base URL (espelha app.js) ----------
// Ordem: localStorage `blaxx_api_url` → VITE_API_BASE → produção Render.
const DEFAULT_API = 'https://blaxx-pontos-exe.onrender.com'

export function apiBase(): string {
  // Override via localStorage só em dev: em produção evita repontar a API
  // (ex.: via XSS/console) para um backend malicioso.
  if (import.meta.env.DEV) {
    try {
      const override = localStorage.getItem('blaxx_api_url')
      if (override) return override.replace(/\/+$/, '')
    } catch {
      /* storage indisponível */
    }
  }
  const env = (import.meta.env.VITE_API_BASE as string | undefined)
  return (env || DEFAULT_API).replace(/\/+$/, '')
}

// ---------- Session ----------
const SESSION_KEY = 'blaxx_session'

// SEC-1: o token JWT agora vive em cookie httpOnly `blaxx_session` (setado
// pelo backend, invisível pro JS). localStorage guarda APENAS metadados do
// usuário (nome, email, tier) pra UX rápida em renders iniciais. O
// `isLoggedIn()` agora confia na presença do `user` no storage — se o
// cookie estiver expirado/revogado, o /auth/me devolve 401 e o handler
// global limpa tudo.
export const Session = {
  get(): SessionData | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? (JSON.parse(raw) as SessionData) : null
    } catch {
      return null
    }
  },
  set(data: SessionData) {
    // Strip do token antes de salvar — o backend já setou cookie httpOnly.
    // (Defesa em profundidade: se algum caller passar token, a gente ignora
    //  pra evitar regredir pra XSS-exfilable.)
    const safe: SessionData = { ...data, token: '' }
    localStorage.setItem(SESSION_KEY, JSON.stringify(safe))
  },
  clear() {
    localStorage.removeItem(SESSION_KEY)
  },
  /** @deprecated SEC-1: cookie httpOnly cuida do auth. Retorna sempre null. */
  token(): string | null {
    return null
  },
  user(): User | null {
    return this.get()?.user ?? null
  },
  /** True se há `user` no storage. O cookie cuida da autenticação real. */
  isLoggedIn(): boolean {
    return !!this.user()
  },
  /** Atualiza apenas o usuário mantendo o resto (ex.: após /auth/me). */
  setUser(user: User) {
    const cur = this.get() || { token: '', user }
    this.set({ ...cur, user })
  },
}

// ---------- Erro de API ----------
export class ApiError extends Error {
  status: number
  data: unknown
  code?: string
  constructor(status: number, data: unknown, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.code = code
  }
}

// Endpoints de auth que NÃO devem disparar o logout global em 401
// (espelha a exceção do handler 401 do app.js).
const AUTH_EXEMPT_401 = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/login/2fa',
]

let onUnauthorized: (() => void) | null = null
/** Permite que a camada React registre o redirect de logout (router). */
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers)
  if (opts.body !== undefined && !(opts.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  // SEC-1: `credentials: 'include'` faz o navegador enviar o cookie httpOnly
  // `blaxx_session` que o backend setou no /auth/login. Sem isso, o cookie
  // é IGNORADO em requests cross-origin (Netlify SPA → Render backend).
  // Em paralelo, mantemos o header `Authorization` por compat caso o caller
  // passe via opts.headers (apps embarcados / testes).
  const res = await fetch(apiBase() + path, {
    ...opts,
    credentials: 'include',
    headers,
    body:
      opts.body === undefined
        ? undefined
        : opts.body instanceof FormData
          ? opts.body
          : JSON.stringify(opts.body),
  })

  const text = await res.text()
  let body: unknown = {}
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text }
    }
  }

  if (!res.ok) {
    const b = body as { error?: string; message?: string; code?: string }
    const msg = b.error || b.message || `HTTP ${res.status}`
    // Handler global de 401 (exceto endpoints de auth).
    if (res.status === 401 && !AUTH_EXEMPT_401.some((p) => path.startsWith(p))) {
      Session.clear()
      onUnauthorized?.()
    }
    throw new ApiError(res.status, body, msg, b.code)
  }
  return body as T
}

// ---------- Helpers de formatação (espelham app.js) ----------
export function fmtPts(n: number): string {
  return Number(n).toLocaleString('pt-BR') + ' pts'
}

export function fmtBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(v) || 0)
}

export function fmtDateTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso).slice(0, 16).replace('T', ' ')
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtNumber(n: number): string {
  return Number(n).toLocaleString('pt-BR')
}

// ---------- Toast (espelha toast() do app.js) ----------
export function toast(msg: string, kind: 'success' | 'error' | '' = '', ms = 2600) {
  const el = document.createElement('div')
  el.className = 'toast' + (kind ? ' ' + kind : '')
  el.textContent = msg
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.remove(), 220)
  }, ms)
}

// ---------- Logout (espelha logout() do app.js) ----------
export async function logout(): Promise<void> {
  try {
    await api('/auth/logout', { method: 'POST' })
  } catch {
    /* ignora erro de rede no logout */
  }
  Session.clear()
}

// ---------- Atalhos de endpoints canônicos ----------
export const BlaxxAPI = {
  // Auth
  login: (email: string, password: string) =>
    api<LoginResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  login2fa: (challenge_token: string, code: string) =>
    api<SessionData>('/auth/login/2fa', { method: 'POST', body: { challenge_token, code } }),
  // Google Sign-In: envia o id_token do Google Identity Services (+ nonce
  // anti-replay) e recebe o mesmo bundle de tokens do /auth/login.
  googleSignIn: (id_token: string, nonce?: string) =>
    api<LoginResponse>('/auth/google', {
      method: 'POST',
      body: nonce ? { id_token, nonce } : { id_token },
    }),
  register: (payload: Record<string, unknown>) =>
    api<SessionData>('/auth/register', { method: 'POST', body: payload }),
  me: () => api<User>('/auth/me'),
  forgotPassword: (email: string) =>
    api('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (payload: Record<string, unknown>) =>
    api('/auth/reset-password', { method: 'POST', body: payload }),
  // Reenvio do código de verificação. Requer sessão autenticada — o backend
  // identifica o usuário pelo token (g.current_user), não por e-mail no body.
  // (A rota antiga /auth/resend-verification não existe e causava "Failed to
  // fetch" por falha de preflight CORS 404.)
  sendVerifyEmail: () => api('/auth/verify-email/send', { method: 'POST' }),
  verifyEmail: (code: string) =>
    api('/auth/verify-email', { method: 'POST', body: { code } }),

  // Wallet
  wallet: () => api<Wallet>('/wallet/'),
  transactions: (limit = 10) =>
    api<{ transactions?: Transaction[]; items?: Transaction[] } | Transaction[]>(
      `/wallet/transactions?limit=${encodeURIComponent(limit)}`,
    ),

  // Cartão Blaxx + níveis (loyalty tiers) + Apple Wallet
  card: () => api<CardState>('/card/'),
  tiers: () => api<{ tiers: Tier[] }>('/card/tiers'),
  cardPassStatus: () => api<{ available: boolean }>('/card/pass/status'),

  // PIX / compra
  pixPackages: () =>
    api<Record<string, PixPackage> | PixPackage[]>('/pix/packages'),
  pixCharge: (payload: Record<string, unknown>) =>
    api<PixCharge>('/pix/charge', { method: 'POST', body: payload }),
  pixChargeStatus: (id: string) => api<PixCharge>(`/pix/charge/${encodeURIComponent(id)}`),
  pixSimulatePayment: (id: string) =>
    api('/pix/simulate-payment', { method: 'POST', body: { charge_id: id } }),
  // PIX valor livre (fluxo manual com confirmação admin)
  pixCustomCharge: (amount_brl: number) =>
    api<CustomCharge>('/pix/custom-charge', { method: 'POST', body: { amount_brl } }),
  pixClaimPaid: (id: string) =>
    api(`/pix/custom-charge/${encodeURIComponent(id)}/claim-paid`, { method: 'POST', body: {} }),
  pixMyCharges: () => api<{ items?: CustomCharge[] }>('/pix/my-charges'),

  // Transferência / resgate
  transfer: (payload: Record<string, unknown>) =>
    api<TransferReceipt>('/transfer/', { method: 'POST', body: payload }),
  redeemQuote: (points: number) =>
    api<RedeemQuote>(`/redeem/quote?points=${encodeURIComponent(points)}`),
  redeem: (payload: Record<string, unknown>) =>
    api<RedeemResult>('/redeem/', { method: 'POST', body: payload }),

  // Catálogo
  partners: () => api<{ items?: Partner[] }>('/partners/'),
  partnerCategories: () => api<{ items?: string[] }>('/partners/categories'),
  partner: (id: string) => api<Partner>('/partners/' + encodeURIComponent(id)),
  benefits: () => api<{ items?: Benefit[] }>('/benefits/'),
  benefit: (id: string) => api<Benefit>('/benefits/' + encodeURIComponent(id)),
  benefitRedeem: (id: string) =>
    api<Voucher>('/benefits/' + encodeURIComponent(id) + '/redeem', { method: 'POST' }),
  vouchers: () => api<{ items?: Voucher[] }>('/vouchers/'),
  voucher: (id: string) => api<Voucher>('/vouchers/' + encodeURIComponent(id)),

  // Campanhas
  campaigns: () => api<{ items?: Campaign[] }>('/campaigns/'),
  campaignJoin: (id: string) =>
    api(`/campaigns/${encodeURIComponent(id)}/join`, { method: 'POST' }),
  campaignProgress: (id: string, amount_brl: number) =>
    api<Campaign>(`/campaigns/${encodeURIComponent(id)}/progress`, {
      method: 'POST',
      body: { amount_brl },
    }),

  // Notificações
  notifications: () => api<{ items?: Notification[] }>('/notifications/'),
  notificationsUnreadCount: () =>
    api<{ count: number }>('/notifications/unread-count'),
  notificationRead: (id: string) =>
    api(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
  notificationsReadAll: () => api('/notifications/read-all', { method: 'POST' }),

  // Segurança / conta
  changePassword: (current_password: string, new_password: string) =>
    api('/auth/change-password', {
      method: 'POST',
      body: { current_password, new_password },
    }),
  addPhone: (phone: string) =>
    api<{ phone_masked?: string }>('/user/phone', { method: 'POST', body: { phone } }),
  verifyPhone: (code: string) =>
    api<{ user: User }>('/user/phone/verify', { method: 'POST', body: { code } }),
  removePhone: (password: string) =>
    api<{ user: User }>('/user/phone', { method: 'DELETE', body: { password } }),
  enable2faSms: () =>
    api<{ user: User }>('/user/2fa/sms/enable', { method: 'POST', body: {} }),
  disable2faSms: (password: string) =>
    api<{ user: User }>('/user/2fa/sms/disable', { method: 'POST', body: { password } }),
  sessions: () => api<{ sessions?: AuthSession[] }>('/user/sessions'),
  revokeSession: (id: string) =>
    api(`/user/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  revokeAllSessions: () =>
    api('/auth/sessions/revoke-all', { method: 'POST', body: {} }),
  accessLog: () => api<{ items?: AccessLogItem[] }>('/user/access-log'),

  // Admin
  adminStats: () => api<AdminStats>('/admin/stats'),
  adminUsers: (qs: string) => api<Paginated<AdminUser>>('/admin/users?' + qs),
  adminToggleVip: (id: string, is_vip: boolean) =>
    api(`/admin/users/${encodeURIComponent(id)}/vip`, { method: 'PATCH', body: { is_vip } }),
  adminTransactions: (qs: string) => api<Paginated<AdminTx>>('/admin/transactions?' + qs),
}

/**
 * Baixa o .pkpass assinado (Apple Wallet) com Bearer e dispara o download.
 * Lança ApiError 503 quando o Wallet ainda não está configurado no servidor —
 * a UI usa isso para mostrar "em breve". É binário, então não passa pelo api().
 */
export async function downloadCardPass(): Promise<void> {
  // SEC-1: cookie httpOnly cuida do auth (credentials: 'include').
  // Session.token() agora retorna null — mantido só por compat de tipos.
  const res = await fetch(apiBase() + '/card/pass', {
    credentials: 'include',
  })
  if (!res.ok) {
    let data: unknown = {}
    try {
      data = await res.json()
    } catch {
      /* corpo não-JSON */
    }
    const b = data as { error?: string; message?: string }
    throw new ApiError(res.status, data, b.error || b.message || `HTTP ${res.status}`, b.error)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cartao-blaxx.pkpass'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** O backend devolve pacotes como dict {key: {...}} ou array — normaliza para array. */
export function normalizePackages(
  resp: Record<string, PixPackage> | PixPackage[],
): PixPackage[] {
  if (Array.isArray(resp)) return resp
  return Object.entries(resp).map(([key, v]) => ({ ...(v as PixPackage), key }))
}

/** Normaliza qualquer formato de resposta de transações para um array. */
export function asTxArray(
  resp: { transactions?: Transaction[]; items?: Transaction[] } | Transaction[],
): Transaction[] {
  if (Array.isArray(resp)) return resp
  return resp.transactions || resp.items || []
}
