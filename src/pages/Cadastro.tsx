// Criar conta — wizard de 3 telas (dados → senha → termos), rascunho em
// sessionStorage, máscara CPF, força de senha inline, gate de aceite LGPD.
// Login social (Google) foi removido — cadastro só por e-mail e senha.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BlaxxAPI, Session, toast } from '../lib/api-client'
import { STRENGTH_COLORS, maskCPF, passwordStrength } from '../lib/password'
import AuthLayout from '../components/AuthLayout'

const DRAFT_KEY = 'blaxx_signup_draft'
const DEFAULT_HINT = 'Use maiúscula, minúscula, número e caractere especial.'

const STEPS = ['Seus dados', 'Crie sua senha', 'Confirme e aceite'] as const

// E-mail básico (paridade com o backend _EMAIL_RX, sem ser exageradamente estrito)
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Cadastro() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0,1,2
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Se já logado, vai ao dashboard.
  useEffect(() => {
    if (Session.isLoggedIn()) navigate('/dashboard', { replace: true })
  }, [navigate])

  // Restaura rascunho (sem senha).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')
      if (saved) {
        setName(saved.name || '')
        setEmail(saved.email || '')
        setCpf(saved.cpf || '')
        setPixKey(saved.pix_key || '')
        setAccepted(!!saved.accepted)
      }
    } catch {
      /* sessionStorage indisponível */
    }
  }, [])

  // Persiste rascunho a cada mudança (senha nunca é salva).
  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ name, email, cpf, pix_key: pixKey, accepted }),
      )
    } catch {
      /* ignore */
    }
  }, [name, email, cpf, pixKey, accepted])

  const strength = useMemo(() => passwordStrength(password), [password])
  const strengthText = !password
    ? DEFAULT_HINT
    : 'Senha ' + strength.label + (strength.hints.length ? ' — falta: ' + strength.hints.join(', ') : ' ✓')
  const strengthColor = password ? STRENGTH_COLORS[Math.max(0, strength.score - 1)] : undefined

  // ---- Validações por etapa ----
  function validateStep0(): string | null {
    if (name.trim().length < 4 || name.trim().split(/\s+/).length < 2)
      return 'Informe seu nome completo (nome e sobrenome).'
    if (!EMAIL_RX.test(email.trim())) return 'E-mail inválido.'
    if (cpf.replace(/\D/g, '').length !== 11) return 'CPF incompleto.'
    return null
  }
  function validateStep1(): string | null {
    if (!strength.ok) return 'A senha precisa ter no mínimo 7 caracteres.'
    if (password !== passwordConfirm) return 'As senhas não conferem.'
    return null
  }

  function goNext() {
    const err = step === 0 ? validateStep0() : step === 1 ? validateStep1() : null
    if (err) {
      toast(err, 'error', 3200)
      return
    }
    setStep((s) => Math.min(2, s + 1))
  }
  function goBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Re-valida tudo na submissão final (defensivo).
    const err0 = validateStep0()
    if (err0) { setStep(0); toast(err0, 'error', 3200); return }
    const err1 = validateStep1()
    if (err1) { setStep(1); toast(err1, 'error', 3200); return }
    if (!accepted) {
      toast('Você precisa aceitar os termos para criar a conta.', 'error', 3200)
      return
    }
    setSubmitting(true)
    try {
      const data = await BlaxxAPI.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        cpf: cpf.replace(/\D/g, ''),
        pix_key: pixKey.trim(),
        password,
        password_confirm: passwordConfirm,
        accept_terms: true,
        accept_privacy: true,
        accept_lgpd: true,
        accept_terms_at: new Date().toISOString(),
      })
      sessionStorage.removeItem(DRAFT_KEY)
      if (data && data.token) {
        Session.set({ token: data.token, user: data.user })
        toast('Conta criada! Bem-vindo, ' + (data.user?.name || '').split(' ')[0], 'success')
        setTimeout(() => navigate('/dashboard'), 600)
      } else {
        toast('Conta criada! Verifique seu e-mail para ativar.', 'success', 3000)
        setTimeout(() => navigate('/validacao'), 1200)
      }
    } catch (err) {
      toast((err as Error).message || 'Falha no cadastro', 'error', 3200)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Cadastro grátis"
      title="Comece a acumular pontos"
      lead="Crie sua conta em menos de 2 minutos, sem mensalidade."
    >
      <div className="card elevated">
        <style>{wizardCss}</style>
        <span className="eyebrow">Cadastro · passo {step + 1} de 3</span>
        <h3>{STEPS[step]}</h3>

        {/* Stepper */}
        <div className="wz-steps" role="list">
          {STEPS.map((label, i) => (
            <div
              key={label}
              role="listitem"
              className={'wz-step' + (i === step ? ' is-active' : '') + (i < step ? ' is-done' : '')}
            >
              <span className="wz-dot">{i < step ? '✓' : i + 1}</span>
              <span className="wz-label">{label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} autoComplete="on">
          {/* ---------------- Passo 1: dados pessoais ---------------- */}
          {step === 0 && (
            <>
              <div className="field">
                <label htmlFor="name">Nome completo</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={3}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="cpf">CPF</label>
                <input
                  id="cpf"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                />
              </div>
            </>
          )}

          {/* ---------------- Passo 2: senha ---------------- */}
          {step === 1 && (
            <>
              <div className="field">
                <label htmlFor="password">Senha (mín. 7 caracteres)</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={7}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
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
            </>
          )}

          {/* ---------------- Passo 3: PIX + termos ---------------- */}
          {step === 2 && (
            <>
              <div className="field">
                <label htmlFor="pix_key">Chave PIX (opcional)</label>
                <input
                  id="pix_key"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="e-mail, telefone, CPF ou chave aleatória"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
                <span className="hint">Você pode adicionar depois nas configurações.</span>
              </div>

              {/* Resumo dos dados */}
              <div className="wz-summary">
                <div><span>Nome</span><b>{name || '—'}</b></div>
                <div><span>E-mail</span><b>{email || '—'}</b></div>
                <div><span>CPF</span><b>{cpf || '—'}</b></div>
              </div>

              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, margin: '18px 0 4px' }}
              >
                <input
                  type="checkbox"
                  id="accept-terms"
                  required
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  style={{ appearance: 'auto', WebkitAppearance: 'checkbox', marginTop: 3, padding: 0, border: 'none', flexShrink: 0, width: 18, height: 18, cursor: 'pointer', accentColor: '#59FD27' }}
                />
                <label htmlFor="accept-terms" style={{ fontSize: 13, lineHeight: 1.5, cursor: 'pointer', flex: 1 }}>
                  Li e aceito os{' '}
                  <a
                    className="btn link"
                    style={{ display: 'inline', padding: 0 }}
                    onClick={() => navigate('/termos')}
                  >
                    termos de uso e a política de privacidade (LGPD)
                  </a>
                  .
                </label>
              </div>
            </>
          )}

          {/* ---------------- Navegação ---------------- */}
          <div className="wz-nav">
            {step > 0 ? (
              <button type="button" className="btn ghost lg" onClick={goBack} disabled={submitting}>
                Voltar
              </button>
            ) : (
              <a className="btn link" onClick={() => navigate('/login')}>
                Já tenho conta
              </a>
            )}

            {step < 2 ? (
              <button type="button" className="btn primary lg" onClick={goNext}>
                Continuar
              </button>
            ) : (
              <button
                className="btn primary lg"
                type="submit"
                disabled={!accepted || submitting}
                style={{ opacity: accepted ? 1 : 0.55, cursor: accepted ? 'pointer' : 'not-allowed' }}
              >
                {submitting ? 'Criando...' : 'Criar conta'}
              </button>
            )}
          </div>
        </form>

        {step === 0 && (
          <div className="center-text mt-6">
            <a className="btn link" onClick={() => navigate('/login')}>
              Já tenho conta? Entrar
            </a>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

const wizardCss = `
.wz-steps { display: flex; gap: 8px; margin: 14px 0 20px; }
.wz-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; }
.wz-step .wz-dot {
  width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center;
  font-size: 13px; font-weight: 700; background: var(--gray-100, #eee);
  color: var(--text-muted, #888); border: 2px solid transparent; transition: all .2s ease;
}
.wz-step .wz-label { font-size: 11px; color: var(--text-muted, #999); text-align: center; font-weight: 600; }
.wz-step.is-active .wz-dot { background: var(--blaxx-lime, #59FD27); color: var(--blaxx-black, #0A0A0A); }
.wz-step.is-active .wz-label { color: var(--text, #111); }
.wz-step.is-done .wz-dot { background: var(--blaxx-black, #0A0A0A); color: var(--blaxx-lime, #59FD27); }
/* linha conectora */
.wz-step::after {
  content: ''; position: absolute; top: 15px; left: calc(50% + 18px); right: calc(-50% + 18px);
  height: 2px; background: var(--border, #e5e5e5); z-index: 0;
}
.wz-step:last-child::after { display: none; }
.wz-step.is-done::after { background: var(--blaxx-black, #0A0A0A); }

.wz-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 22px; }
.wz-nav .btn.primary.lg { min-width: 150px; }
.wz-nav .btn.ghost.lg {
  background: transparent; border: 1px solid var(--border, #ddd); color: var(--text, #111);
}

.wz-summary {
  margin-top: 8px; border: 1px solid var(--border, #e5e5e5); border-radius: var(--radius, 12px);
  padding: 12px 14px; display: grid; gap: 8px; background: var(--blaxx-lime-light, #F0FAD9);
}
.wz-summary > div { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
.wz-summary span { color: var(--text-muted, #777); }
.wz-summary b { color: var(--text, #111); font-weight: 700; max-width: 60%; text-align: right; word-break: break-word; }
`
