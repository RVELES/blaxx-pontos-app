// Segurança — port fiel de seguranca.html (trocar senha, telefone+2FA SMS, sessões, histórico).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AccessLogItem,
  ApiError,
  AuthSession,
  BlaxxAPI,
  Session,
  User,
  fmtDateTime,
  toast,
} from '../lib/api-client'
import { STRENGTH_COLORS, passwordStrength } from '../lib/password'
import { Topbar } from '../components/Shell'

const DEFAULT_HINT = 'Use maiúscula, minúscula, número e caractere especial.'

const EVENT_LABELS: Record<string, { lbl: string; cls: string }> = {
  'auth.login.success': { lbl: '✓ Login com sucesso', cls: 'ev-ok' },
  'auth.login.fail': { lbl: '✗ Tentativa (falha)', cls: 'ev-fail' },
  'auth.login.blocked': { lbl: '✗ Login bloqueado', cls: 'ev-fail' },
  'auth.logout': { lbl: '↩ Logout', cls: 'ev-info' },
  'auth.logout.all': { lbl: '↩ Logout de todas', cls: 'ev-info' },
  'user.password.changed': { lbl: '🔑 Senha alterada', cls: 'ev-ok' },
  'auth.reset_password.success': { lbl: '🔑 Senha redefinida', cls: 'ev-ok' },
  'user.mfa.enabled': { lbl: '🛡 2FA ativada', cls: 'ev-ok' },
  'user.mfa.disabled': { lbl: '🛡 2FA desativada', cls: 'ev-info' },
  'auth.mfa.challenge_success': { lbl: '🛡 2FA validada', cls: 'ev-ok' },
  'auth.mfa.challenge_fail': { lbl: '🛡 Falha em 2FA', cls: 'ev-fail' },
  'user.phone.verified': { lbl: '📱 Telefone verificado', cls: 'ev-ok' },
  'user.phone.removed': { lbl: '📱 Telefone removido', cls: 'ev-info' },
  'user.email.changed': { lbl: '✉ E-mail alterado', cls: 'ev-info' },
}

export default function Seguranca() {
  const navigate = useNavigate()
  const [me, setMe] = useState<User | null>(null)

  // Trocar senha
  const [cur, setCur] = useState('')
  const [nova, setNova] = useState('')
  const [conf, setConf] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [sendingFirst, setSendingFirst] = useState(false)
  const [sentFirst, setSentFirst] = useState(false)

  // Telefone / 2FA
  const [phone, setPhone] = useState('')
  const [phoneStatus, setPhoneStatus] = useState('')
  const [showVerify, setShowVerify] = useState(false)
  const [code, setCode] = useState('')
  const [sendingPhone, setSendingPhone] = useState(false)
  const [verifyingPhone, setVerifyingPhone] = useState(false)

  // Sessões / histórico
  const [sessions, setSessions] = useState<AuthSession[] | null>(null)
  const [accessLog, setAccessLog] = useState<AccessLogItem[] | null | 'error'>(null)

  const strength = useMemo(() => passwordStrength(nova), [nova])
  const strengthText = !nova
    ? DEFAULT_HINT
    : 'Senha ' +
      strength.label +
      (strength.hints.length ? ' — falta: ' + strength.hints.join(', ') : ' ✓')
  const strengthColor = nova ? STRENGTH_COLORS[Math.max(0, strength.score - 1)] : undefined

  const googleOnly =
    me != null && (me.has_password === false || (me.auth_provider === 'google' && !me.has_password))

  const loadMe = useCallback(async () => {
    try {
      const d = (await BlaxxAPI.me()) as User & { user?: User }
      const u = d.user || d
      setMe(u)
      if (u.phone) setPhone((p) => p || u.phone || '')
      const tok = Session.token()
      if (tok) Session.set({ token: tok, user: u })
    } catch {
      setMe(null)
    }
  }, [])

  const loadSessions = useCallback(async () => {
    try {
      const d = await BlaxxAPI.sessions()
      setSessions(d.sessions || [])
    } catch {
      setSessions([])
    }
  }, [])

  const loadAccessLog = useCallback(async () => {
    try {
      const d = await BlaxxAPI.accessLog()
      setAccessLog(d.items || [])
    } catch {
      setAccessLog('error')
    }
  }, [])

  useEffect(() => {
    loadMe()
    loadSessions()
    loadAccessLog()
  }, [loadMe, loadSessions, loadAccessLog])

  const mfaStatus = useMemo(() => {
    const u = me
    if (!u) return { cls: 'off', text: 'carregando…' }
    if (u.mfa_enabled && u.mfa_method === 'sms')
      return {
        cls: 'on',
        text: '● 2FA por SMS ativa — ***' + String(u.phone || '').slice(-4),
      }
    if (u.phone_verified) return { cls: 'pending', text: '○ Telefone verificado, 2FA desligada' }
    if (u.phone) return { cls: 'pending', text: '○ Telefone aguardando verificação' }
    return { cls: 'off', text: '○ Sem telefone' }
  }, [me])

  const statusChipStyle = (cls: string): React.CSSProperties => {
    const map: Record<string, [string, string]> = {
      on: ['rgba(164,214,94,0.15)', '#a4d65e'],
      off: ['rgba(255,107,107,0.15)', '#ff6b6b'],
      pending: ['rgba(255,183,77,0.15)', '#ffb74d'],
    }
    const [bg, color] = map[cls] || map.off
    return {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      background: bg,
      color,
    }
  }

  // ---- Trocar senha ----
  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordStrength(nova).ok) {
      toast('A senha precisa ter no mínimo 7 caracteres.', 'error')
      return
    }
    if (nova !== conf) {
      toast('Confirmação não confere.', 'error')
      return
    }
    setSavingPwd(true)
    try {
      await BlaxxAPI.changePassword(cur, nova)
      toast('Senha alterada. Faça login novamente.', 'success', 2500)
      Session.clear()
      setTimeout(() => navigate('/login'), 1500)
    } catch (e) {
      const err = e as ApiError
      if (err.status === 404) toast('Troca de senha indisponível neste servidor.', 'error', 3500)
      else toast(err.message || 'Falha ao trocar senha', 'error', 3500)
      setSavingPwd(false)
    }
  }

  async function sendFirstPassword() {
    const u = Session.user()
    if (!u || !u.email) {
      toast('Email não encontrado na sessão', 'error')
      return
    }
    setSendingFirst(true)
    try {
      await BlaxxAPI.forgotPassword(u.email)
      toast('Link enviado para ' + u.email + '. Confira sua caixa de entrada.', 'success', 4000)
      setSentFirst(true)
    } catch {
      toast('Falha ao enviar. Verifique sua conexão.', 'error')
      setSendingFirst(false)
    }
  }

  // ---- Telefone / 2FA ----
  async function submitPhone(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.replace(/\D/g, '').match(/^\d{10,15}$/)) {
      toast('Telefone inválido. Use (11) 99999-9999', 'error')
      return
    }
    setSendingPhone(true)
    try {
      const d = await BlaxxAPI.addPhone(phone)
      setPhoneStatus('Código enviado para ' + (d.phone_masked || phone) + '. Verifique seu SMS.')
      setShowVerify(true)
    } catch (e) {
      const err = e as ApiError
      if (err.status === 404) toast('Cadastro de telefone indisponível neste servidor.', 'error', 3500)
      else if (err.status === 429)
        toast(err.message + ' (' + ((err.data as { retry_in?: number })?.retry_in || '?') + 's)', 'error')
      else toast(err.message || 'Falha ao enviar SMS', 'error')
    } finally {
      setSendingPhone(false)
    }
  }

  async function submitVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      toast('Código de 6 dígitos', 'error')
      return
    }
    setVerifyingPhone(true)
    try {
      const d = await BlaxxAPI.verifyPhone(code)
      toast('Telefone verificado!', 'success')
      const tok = Session.token()
      if (tok) Session.set({ token: tok, user: d.user })
      setShowVerify(false)
      setPhoneStatus('Telefone verificado ✓')
      loadMe()
    } catch (e) {
      toast((e as ApiError).message || 'Código inválido', 'error')
    } finally {
      setVerifyingPhone(false)
    }
  }

  async function enable2FA() {
    if (!window.confirm('Ativar 2FA por SMS?')) return
    try {
      const d = await BlaxxAPI.enable2faSms()
      toast('2FA ativada', 'success')
      const tok = Session.token()
      if (tok) Session.set({ token: tok, user: d.user })
      loadMe()
    } catch (e) {
      toast((e as ApiError).message || 'Falha ao ativar', 'error')
    }
  }

  async function disable2FA() {
    const pwd = window.prompt('Para desativar a 2FA, confirme sua senha:')
    if (!pwd) return
    try {
      const d = await BlaxxAPI.disable2faSms(pwd)
      toast('2FA desativada', 'success')
      const tok = Session.token()
      if (tok) Session.set({ token: tok, user: d.user })
      loadMe()
    } catch (e) {
      toast((e as ApiError).message || 'Falha ao desativar', 'error')
    }
  }

  async function removePhone() {
    const pwd = window.prompt('Para remover o telefone, confirme sua senha:')
    if (!pwd) return
    try {
      const d = await BlaxxAPI.removePhone(pwd)
      toast('Telefone removido', 'success')
      const tok = Session.token()
      if (tok) Session.set({ token: tok, user: d.user })
      setPhone('')
      setShowVerify(false)
      setPhoneStatus('')
      loadMe()
    } catch (e) {
      toast((e as ApiError).message || 'Falha ao remover', 'error')
    }
  }

  // ---- Sessões ----
  async function revokeSession(id: string) {
    if (!window.confirm('Encerrar esta sessão?')) return
    try {
      await BlaxxAPI.revokeSession(id)
      toast('Sessão encerrada', 'success')
      loadSessions()
    } catch (e) {
      toast((e as ApiError).message || 'Falha', 'error')
    }
  }

  async function revokeAll() {
    if (!window.confirm('Encerrar todas as outras sessões?')) return
    try {
      await BlaxxAPI.revokeAllSessions()
      toast('Todas as sessões foram encerradas', 'success')
      Session.clear()
      navigate('/login')
    } catch (e) {
      toast((e as ApiError).message || 'Falha', 'error')
    }
  }

  return (
    <>
      <Topbar eyebrow="Conta" title="Segurança" />

      <div className="grid cols-2" style={{ gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Card: trocar senha */}
        <div className="card">
          <span className="eyebrow">Senha</span>
          <h3>{googleOnly ? 'Definir senha' : 'Trocar senha'}</h3>
          <p className="muted">
            {googleOnly
              ? 'Sua conta usa Google. Crie uma senha para também entrar por e-mail.'
              : 'Use uma senha forte e única para sua conta Blaxx.'}
          </p>

          {googleOnly ? (
            <div
              className="mt-4"
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'rgba(66,133,244,0.1)',
                border: '1px solid rgba(66,133,244,0.3)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: '#4285F4' }}>Sua conta entra via Google</strong>
              <br />
              Você ainda não tem senha local. Para também acessar via e-mail+senha (útil quando o
              Google estiver indisponível), envie um link de definição de senha para o seu e-mail.
              <br />
              <button
                type="button"
                className="btn primary mt-3"
                style={{ marginTop: 10 }}
                disabled={sendingFirst}
                onClick={sendFirstPassword}
              >
                {sentFirst ? '✓ Link enviado' : sendingFirst ? 'Enviando…' : 'Receber link para definir senha'}
              </button>
            </div>
          ) : (
            <form className="mt-4" autoComplete="on" onSubmit={changePassword}>
              <div className="field">
                <label htmlFor="senha-atual">Senha atual</label>
                <input
                  id="senha-atual"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={cur}
                  onChange={(e) => setCur(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="senha-nova">Nova senha</label>
                <input
                  id="senha-nova"
                  type="password"
                  autoComplete="new-password"
                  minLength={7}
                  required
                  value={nova}
                  onChange={(e) => setNova(e.target.value)}
                />
                <span className="hint" style={strengthColor ? { color: strengthColor } : undefined}>
                  {strengthText}
                </span>
              </div>
              <div className="field">
                <label htmlFor="senha-confirm">Confirmar nova senha</label>
                <input
                  id="senha-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={conf}
                  onChange={(e) => setConf(e.target.value)}
                />
              </div>
              <button type="submit" className="btn primary block" disabled={savingPwd}>
                {savingPwd ? 'Salvando…' : 'Atualizar senha'}
              </button>
            </form>
          )}
        </div>

        {/* Card: 2FA */}
        <div className="card">
          <span className="eyebrow">2FA</span>
          <h3>Autenticação em duas etapas</h3>
          <p className="muted">Código por SMS a cada novo dispositivo.</p>
          <div className="mt-4">
            <span style={statusChipStyle(mfaStatus.cls)}>{mfaStatus.text}</span>
          </div>

          <div className="mt-4">
            <form autoComplete="on" onSubmit={submitPhone}>
              <div className="field">
                <label htmlFor="bx-phone">Celular</label>
                <input
                  id="bx-phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {phoneStatus && <span className="hint">{phoneStatus}</span>}
              </div>
              <button type="submit" className="btn ghost block" disabled={sendingPhone}>
                {sendingPhone ? 'Enviando…' : 'Enviar código por SMS'}
              </button>
            </form>

            {showVerify && (
              <form className="mt-4" autoComplete="on" onSubmit={submitVerify}>
                <div className="field">
                  <label htmlFor="bx-phone-code">Código de 6 dígitos</label>
                  <input
                    id="bx-phone-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{
                      fontSize: 20,
                      letterSpacing: '0.3em',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  />
                </div>
                <button type="submit" className="btn primary block" disabled={verifyingPhone}>
                  {verifyingPhone ? 'Verificando…' : 'Verificar telefone'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-4" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {me?.phone_verified && !me?.mfa_enabled && (
              <button type="button" className="btn primary" onClick={enable2FA}>
                Ativar 2FA por SMS
              </button>
            )}
            {me?.mfa_enabled && (
              <button type="button" className="btn ghost" onClick={disable2FA}>
                Desativar 2FA
              </button>
            )}
            {me?.phone && (
              <button
                type="button"
                className="btn ghost"
                style={{ color: 'var(--negative)', borderColor: 'var(--negative)' }}
                onClick={removePhone}
              >
                Remover telefone
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sessões ativas */}
      <div className="card mt-6">
        <span className="eyebrow">Sessões</span>
        <h3>Dispositivos com login ativo</h3>
        <table className="blaxx mt-4" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>Dispositivo</th>
              <th>IP</th>
              <th>Última atividade</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions == null ? (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 18 }}>
                  Carregando…
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 18 }}>
                  Sem sessões ativas.
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.device_name || '—'}</strong>
                    {s.current && (
                      <span style={{ ...statusChipStyle('on'), marginLeft: 6 }}>esta</span>
                    )}
                  </td>
                  <td>{s.ip_address || '—'}</td>
                  <td>{s.last_used_at ? new Date(s.last_used_at).toLocaleString('pt-BR') : '—'}</td>
                  <td>
                    {!s.current && (
                      <button
                        className="btn ghost"
                        style={{ padding: '4px 10px', fontSize: 12, color: 'var(--negative)' }}
                        onClick={() => revokeSession(s.id)}
                      >
                        Encerrar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <button
          type="button"
          className="btn ghost mt-4"
          style={{ color: 'var(--negative)', borderColor: 'var(--negative)' }}
          onClick={revokeAll}
        >
          Encerrar todas as outras sessões
        </button>
      </div>

      {/* Histórico de acessos */}
      <div className="card mt-6">
        <span className="eyebrow">Histórico</span>
        <h3>Acessos e eventos de segurança</h3>
        <table className="blaxx mt-4" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Evento</th>
              <th>Dispositivo</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {accessLog === null ? (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 18 }}>
                  Carregando…
                </td>
              </tr>
            ) : accessLog === 'error' ? (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 18 }}>
                  Histórico indisponível
                </td>
              </tr>
            ) : accessLog.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 18 }}>
                  Sem eventos registrados.
                </td>
              </tr>
            ) : (
              accessLog.map((it, i) => {
                const meta = EVENT_LABELS[it.event] || { lbl: it.event, cls: 'ev-info' }
                const color =
                  meta.cls === 'ev-ok' ? '#a4d65e' : meta.cls === 'ev-fail' ? '#ff6b6b' : 'var(--gray-600)'
                return (
                  <tr key={i}>
                    <td>{it.at ? fmtDateTime(it.at) : '—'}</td>
                    <td>
                      <span style={{ color }}>{meta.lbl}</span>
                    </td>
                    <td>{it.device || '—'}</td>
                    <td>{it.ip || '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
