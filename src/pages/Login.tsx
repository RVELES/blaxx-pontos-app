// Login — port fiel de blaxx_exe/renderer/screens/login.html (inclui 2FA in-place).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Session, BlaxxAPI, toast, ApiError, type LoginResponse } from '../lib/api-client'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Estado do desafio 2FA (substitui o form quando mfa_required).
  const [challenge, setChallenge] = useState<LoginResponse | null>(null)
  const [code, setCode] = useState('')
  const [mfaErr, setMfaErr] = useState('')
  const [mfaSubmitting, setMfaSubmitting] = useState(false)

  // Se já logado, vai direto pro dashboard (espelha redirectIfLoggedIn()).
  useEffect(() => {
    if (Session.isLoggedIn()) navigate('/dashboard', { replace: true })
  }, [navigate])

  function finishLogin(token: string, user: NonNullable<LoginResponse['user']>) {
    Session.set({ token, user })
    toast('Bem-vindo, ' + (user.name || '').split(' ')[0], 'success')
    setTimeout(() => navigate('/dashboard', { replace: true }), 400)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = await BlaxxAPI.login(email.trim(), password)
      if (data?.mfa_required) {
        setChallenge(data)
        setSubmitting(false)
        return
      }
      if (data.token && data.user) finishLogin(data.token, data.user)
    } catch (err) {
      const e2 = err as ApiError
      if (e2.code === 'email_not_verified') {
        // O envio do código de verificação exige sessão autenticada
        // (/auth/verify-email/send é @login_required), então não dá para
        // disparar daqui — a tela /validacao cuida disso após o login.
        toast('Confirme seu e-mail para entrar.', 'error', 3500)
        setTimeout(() => navigate('/validacao'), 1500)
      } else {
        toast(e2.message || 'Credenciais inválidas', 'error')
      }
      setSubmitting(false)
    }
  }

  async function onSubmitMfa() {
    setMfaErr('')
    if (!/^\d{6}$/.test(code.trim())) {
      setMfaErr('Código de 6 dígitos.')
      return
    }
    setMfaSubmitting(true)
    try {
      const r = await BlaxxAPI.login2fa(challenge!.mfa_challenge_token!, code.trim())
      if (r.token && r.user) finishLogin(r.token, r.user)
    } catch (err) {
      const c = (err as ApiError).code
      if (c === 'wrong_code') setMfaErr('Código incorreto. Confira o SMS.')
      else if (c === 'code_expired' || c === 'challenge_expired')
        setMfaErr('Código expirado. Volte e tente novamente.')
      else setMfaErr((err as ApiError).message || 'Falha ao validar.')
      setMfaSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Acesse sua carteira"
      title="Bem-vindo de volta"
      lead="Entre para acompanhar seus pontos, campanhas ativas e resgates."
    >
      <div className="card elevated">
          {!challenge ? (
            <>
              <span className="eyebrow">Entrar</span>
              <h3>Acesse sua carteira</h3>
              <p className="subtitle">Use o e-mail ou CPF cadastrado.</p>

              <form onSubmit={onSubmit} autoComplete="on">
                <div className="field">
                  <label htmlFor="email">E-mail ou CPF</label>
                  <input
                    id="email"
                    type="text"
                    placeholder="voce@email.com"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="password">Senha</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn primary lg block" disabled={submitting}>
                  {submitting ? 'Entrando…' : 'Entrar'}
                </button>
              </form>

              <div className="row between mt-6">
                <a className="btn link" onClick={() => navigate('/recuperar-senha')}>
                  Esqueci a senha
                </a>
                <a className="btn link" onClick={() => navigate('/cadastro')}>
                  Criar conta
                </a>
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow">Verificação em duas etapas</span>
              <h3>Insira o código</h3>
              <p className="subtitle">
                Enviamos um código por SMS para{' '}
                <strong>{challenge.mfa_phone_hint || 'seu telefone'}</strong>. O código expira em
                alguns minutos.
              </p>
              <div className="field">
                <label htmlFor="mfa-code">Código de 6 dígitos</label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && onSubmitMfa()}
                  style={{ fontSize: 24, letterSpacing: '0.4em', textAlign: 'center', fontWeight: 700 }}
                  autoFocus
                />
              </div>
              <button
                className="btn primary lg block"
                onClick={onSubmitMfa}
                disabled={mfaSubmitting}
              >
                {mfaSubmitting ? 'Validando…' : 'Validar e entrar'}
              </button>
              <div className="center-text mt-6">
                <a
                  className="btn link"
                  onClick={() => {
                    setChallenge(null)
                    setCode('')
                    setMfaErr('')
                  }}
                >
                  Voltar e tentar outra conta
                </a>
              </div>
              {mfaErr && (
                <p style={{ color: '#ff6b6b', textAlign: 'center', fontSize: 13, marginTop: 8 }}>
                  {mfaErr}
                </p>
              )}
            </>
          )}
      </div>

      <p className="muted center-text mt-6" style={{ fontSize: 12 }}>
        Ao entrar você aceita os{' '}
        <a className="btn link" style={{ display: 'inline' }} onClick={() => navigate('/termos')}>
          termos de uso
        </a>
        .
      </p>
    </AuthLayout>
  )
}
