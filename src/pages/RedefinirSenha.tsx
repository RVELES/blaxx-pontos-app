// Redefinir senha — port fiel de redefinir-senha.html (token via querystring, força de senha).
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError, Session, toast } from '../lib/api-client'
import { STRENGTH_COLORS, passwordStrength } from '../lib/password'
import AuthLayout from '../components/AuthLayout'

const DEFAULT_HINT = 'Use maiúscula, minúscula, número e caractere especial.'

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const strength = useMemo(() => passwordStrength(password), [password])
  const strengthText = !password
    ? DEFAULT_HINT
    : 'Senha ' + strength.label + (strength.hints.length ? ' — falta: ' + strength.hints.join(', ') : ' ✓')
  const strengthColor = password ? STRENGTH_COLORS[Math.max(0, strength.score - 1)] : undefined

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!strength.ok) {
      toast('A senha precisa ter no mínimo 7 caracteres.', 'error', 3200)
      return
    }
    if (password !== passwordConfirm) {
      toast('Senhas não conferem.', 'error')
      return
    }
    setSubmitting(true)
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { token, password, password_confirm: passwordConfirm },
      })
      toast('Senha redefinida! Faça login.', 'success', 2500)
      Session.clear()
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      const code = (err as ApiError).code
      let msg = (err as ApiError).message || 'Falha ao redefinir senha'
      if (code === 'token_expired') msg = 'Link expirado. Solicite um novo.'
      else if (code === 'token_used') msg = 'Link já utilizado.'
      else if (code === 'invalid_token') msg = 'Link inválido.'
      toast(msg, 'error', 3500)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Nova senha"
      title="Quase lá"
      lead="Escolha uma senha forte para proteger sua carteira de pontos Blaxx."
    >
      <div className="card elevated">
          <span className="eyebrow">Redefinição</span>
          <h3>Escolha uma nova senha</h3>
          <p className="subtitle" style={!token ? { color: '#ff6b6b' } : undefined}>
            {token
              ? 'Defina uma nova senha forte. O link tem validade limitada.'
              : 'Link inválido. Solicite um novo em "Esqueci minha senha".'}
          </p>

          {token && (
            <form onSubmit={onSubmit} autoComplete="on">
              <div className="field">
                <label htmlFor="password">Nova senha (mín. 7 caracteres)</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={7}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="hint" style={strengthColor ? { color: strengthColor } : undefined}>
                  {strengthText}
                </span>
              </div>
              <div className="field">
                <label htmlFor="password-confirm">Confirmar senha</label>
                <input
                  id="password-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </div>
              <button type="submit" className="btn primary lg block" disabled={submitting}>
                {submitting ? 'Salvando…' : 'Redefinir senha'}
              </button>
            </form>
          )}

        <div className="center-text mt-6">
          <a className="btn link" onClick={() => navigate('/login')}>
            Voltar para o login
          </a>
        </div>
      </div>
    </AuthLayout>
  )
}
