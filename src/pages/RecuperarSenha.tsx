// Recuperar senha — port fiel de recuperar-senha.html (mensagem sempre genérica por segurança).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BlaxxAPI, toast } from '../lib/api-client'
import AuthLayout from '../components/AuthLayout'

const GENERIC = 'Se o e-mail existir, você receberá um link em alguns minutos'

export default function RecuperarSenha() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const d = (await BlaxxAPI.forgotPassword(email.trim().toLowerCase())) as { message?: string }
      toast(d?.message || GENERIC, 'success', 3200)
    } catch {
      // Nunca revela se o e-mail existe.
      toast(GENERIC, 'success', 3200)
    } finally {
      setSubmitting(false)
      setTimeout(() => navigate('/login'), 1800)
    }
  }

  return (
    <AuthLayout
      eyebrow="Recuperação de senha"
      title="Vamos te ajudar a voltar"
      lead="Digite o e-mail cadastrado e enviaremos um link seguro para criar uma nova senha."
    >
      <div className="card elevated">
          <span className="eyebrow">Recuperação</span>
          <h3>Reenviaremos para o seu e-mail</h3>
          <p className="subtitle">Digite o e-mail cadastrado para receber instruções.</p>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>E-mail</label>
              <input
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="btn primary lg block" type="submit" disabled={submitting}>
              {submitting ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        <div className="center-text mt-6">
          <a className="btn link" onClick={() => navigate('/login')}>
            Voltar para o login
          </a>
        </div>
      </div>
    </AuthLayout>
  )
}
