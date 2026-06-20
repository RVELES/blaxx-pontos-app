// Resgate PIX — port fiel de resgate-pix.html.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BlaxxAPI, fmtBRL, fmtNumber, toast, type RedeemQuote } from '../lib/api-client'

export default function ResgatePix() {
  const navigate = useNavigate()
  const [pixKey, setPixKey] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [quote, setQuote] = useState<RedeemQuote | null>(null)
  const data: { points?: number } = JSON.parse(sessionStorage.getItem('blaxx_redeem') || '{}')

  useEffect(() => {
    if (!data.points) return
    let alive = true
    BlaxxAPI.redeemQuote(data.points)
      .then((q) => alive && setQuote(q))
      .catch((e) => toast('Erro na cotação: ' + (e as Error).message, 'error'))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function confirm() {
    if (!pixKey.trim()) return toast('Informe sua chave PIX', 'error')
    if (!password) return toast('Informe a senha', 'error')
    setSubmitting(true)
    try {
      const r = await BlaxxAPI.redeem({ points: data.points, pix_key: pixKey.trim(), password })
      sessionStorage.setItem('blaxx_redeem_result', JSON.stringify(r))
      navigate('/resgate-concluido')
    } catch (e) {
      toast((e as Error).message, 'error', 3000)
      setSubmitting(false)
    }
  }

  return (
    <div className="main center" style={{ minHeight: '70vh' }}>
      <div className="center-wrap">
        <div className="card elevated">
          <span className="eyebrow">Chave PIX</span>
          <h3>Para qual chave enviar?</h3>
          <p className="subtitle">
            Em produção a chave precisa pertencer ao mesmo CPF do cadastro.
          </p>

          <div className="field">
            <label>Chave PIX (e-mail, CPF, telefone ou aleatória)</label>
            <input
              type="text"
              placeholder="seu@email.com"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
            />
            <span className="hint">
              Dica: chaves começando com <span className="mono">fail-</span> simulam falha de payout
            </span>
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="card lime">
            {quote ? (
              <>
                <div className="row between">
                  <span>Pontos</span>
                  <strong>{fmtNumber(data.points || 0)} pts</strong>
                </div>
                <div className="row between mt-2">
                  <span>Você recebe</span>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
                    {fmtBRL(quote.amount_brl)}
                  </strong>
                </div>
                <div className="row between mt-2">
                  <span>Cotação</span>
                  <span className="muted">{quote.rate}</span>
                </div>
              </>
            ) : (
              '…'
            )}
          </div>
          <button className="btn primary lg block mt-4" onClick={confirm} disabled={submitting}>
            {submitting ? 'Solicitando…' : 'Solicitar resgate'}
          </button>
          <button className="btn link block mt-2" onClick={() => navigate('/vender-pontos')}>
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
