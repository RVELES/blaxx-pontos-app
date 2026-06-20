// Validação de e-mail — fluxo de CÓDIGO de 6 dígitos (autenticado).
//
// O backend não usa link com token: ele envia um código numérico de 6 dígitos
// por e-mail e o confirma via POST /auth/verify-email { code }, ambos exigindo
// sessão logada (g.current_user). O reenvio é POST /auth/verify-email/send.
// (A versão antiga chamava /auth/resend-verification, que não existe → 404 no
// preflight CORS → "Failed to fetch" ao finalizar o PIX.)
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError, BlaxxAPI, Session, toast } from '../lib/api-client'
import AuthLayout from '../components/AuthLayout'

type Kind = '' | 'ok' | 'err' | 'warn'

export default function Validacao() {
  const navigate = useNavigate()
  const loggedIn = Session.isLoggedIn()
  const userEmail = Session.user()?.email ?? ''

  const [title, setTitle] = useState('Confirmar e-mail')
  const [msg, setMsg] = useState('Enviamos um código de 6 dígitos para o seu e-mail.')
  const [kind, setKind] = useState<Kind>('warn')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const sentOnce = useRef(false)

  // Ao abrir logado e ainda não verificado, dispara o envio de um código novo
  // para que o usuário receba algo na caixa de entrada sem clicar em nada.
  useEffect(() => {
    if (!loggedIn || sentOnce.current) return
    sentOnce.current = true
    ;(async () => {
      try {
        await BlaxxAPI.sendVerifyEmail()
        setMsg(`Enviamos um código de 6 dígitos para ${userEmail || 'o seu e-mail'}.`)
      } catch (err) {
        const e = err as ApiError
        // Já verificado: segue o fluxo normalmente.
        if (e.status === 400 && /verificad/i.test(e.message || '')) {
          finishVerified('Seu e-mail já está confirmado.')
          return
        }
        // 429 = rate limit de reenvio; mantém a tela, usuário pode digitar o
        // código que já recebeu.
        if (e.status !== 429) {
          setMsg('Não foi possível enviar o código agora. Tente reenviar abaixo.')
          setKind('err')
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn])

  function finishVerified(message: string) {
    // Atualiza a sessão local para destravar os gates de e-mail (banners e
    // bloqueios de compra/envio/resgate dependem disto no cliente).
    const u = Session.user()
    if (u) Session.setUser({ ...u, is_email_verified: true })
    setTitle('E-mail confirmado!')
    setMsg(message)
    setKind('ok')
    toast('E-mail confirmado. Você já pode concluir a operação.', 'success', 3000)
    // Volta para a tela anterior (ex.: comprar pontos / checkout PIX).
    setTimeout(() => navigate(-1), 1500)
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    const c = code.trim()
    if (!/^\d{6}$/.test(c)) {
      toast('Digite o código de 6 dígitos.', 'error', 2500)
      return
    }
    setVerifying(true)
    try {
      await api('/auth/verify-email', { method: 'POST', body: { code: c } })
      finishVerified('Redirecionando…')
    } catch (err) {
      const e = err as ApiError
      const data = (e.data || {}) as { attempts_left?: number }
      if (typeof data.attempts_left === 'number') {
        toast(`Código incorreto. Tentativas restantes: ${data.attempts_left}.`, 'error', 3000)
      } else {
        toast(e.message || 'Falha ao validar o código.', 'error', 3000)
      }
    } finally {
      setVerifying(false)
    }
  }

  async function onResend() {
    setResending(true)
    try {
      await BlaxxAPI.sendVerifyEmail()
      toast('Novo código enviado para o seu e-mail.', 'success', 3000)
      setKind('warn')
      setMsg(`Enviamos um novo código para ${userEmail || 'o seu e-mail'}.`)
    } catch (err) {
      const e = err as ApiError
      if (e.status === 429) {
        toast('Aguarde alguns instantes antes de reenviar.', 'error', 3000)
      } else if (e.status === 400 && /verificad/i.test(e.message || '')) {
        finishVerified('Seu e-mail já está confirmado.')
      } else {
        toast(e.message || 'Falha ao reenviar o código.', 'error', 3000)
      }
    } finally {
      setResending(false)
    }
  }

  const titleColor =
    kind === 'ok' ? '#a4d65e' : kind === 'err' ? '#ff6b6b' : kind === 'warn' ? '#ffb74d' : undefined

  return (
    <AuthLayout
      eyebrow="Confirmação de e-mail"
      title="Só mais um passo"
      lead="Confirme seu e-mail para ativar sua carteira e concluir operações financeiras."
    >
      <div className="card elevated">
        <span className="eyebrow">Validação</span>
        <h3 style={titleColor ? { color: titleColor } : undefined}>{title}</h3>
        <p className="subtitle">{msg}</p>

        {!loggedIn ? (
          <>
            <p className="subtitle" style={{ marginTop: 18 }}>
              Para confirmar seu e-mail, entre na sua conta. O código de 6 dígitos
              foi enviado no cadastro e pode ser reenviado depois do login.
            </p>
            <button className="btn primary lg block mt-4" onClick={() => navigate('/login')}>
              Ir para o login
            </button>
          </>
        ) : (
          <form onSubmit={onVerify} autoComplete="one-time-code">
            <div className="field" style={{ marginTop: 18 }}>
              <label htmlFor="code">Código de 6 dígitos</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="\d{6}"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  fontSize: 26,
                  letterSpacing: '0.4em',
                  textAlign: 'center',
                  fontWeight: 700,
                }}
                required
              />
            </div>
            <button type="submit" className="btn primary lg block" disabled={verifying}>
              {verifying ? 'Validando…' : 'Validar e continuar'}
            </button>
            <button
              type="button"
              className="btn ghost block mt-2"
              onClick={onResend}
              disabled={resending}
            >
              {resending ? 'Reenviando…' : 'Reenviar código'}
            </button>
          </form>
        )}

        <div className="row between mt-6">
          <a className="btn link" onClick={() => navigate('/dashboard')}>
            Ir para o início
          </a>
          <a className="btn link" onClick={() => navigate('/login')}>
            Trocar de conta
          </a>
        </div>
      </div>
    </AuthLayout>
  )
}
