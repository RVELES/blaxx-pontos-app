// Resgatar pontos (cashback) — port fiel de vender-pontos.html.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Shell'
import { BlaxxAPI, fmtBRL, toast } from '../lib/api-client'

export default function VenderPontos() {
  const navigate = useNavigate()
  const [points, setPoints] = useState('')
  const [quote, setQuote] = useState('Equivalente a R$ —')

  // Cotação ao vivo (espelha updateQuote: backend só cota a partir de 2.500 pts).
  useEffect(() => {
    const v = parseInt(points || '0', 10)
    if (v < 2500) {
      setQuote('Mínimo 2.500 pts')
      return
    }
    let alive = true
    BlaxxAPI.redeemQuote(v)
      .then((q) => alive && setQuote(`Equivalente a ${fmtBRL(q.amount_brl)} · ${q.rate}`))
      .catch(() => alive && setQuote('Erro na cotação'))
    return () => {
      alive = false
    }
  }, [points])

  function next() {
    const v = parseInt(points || '0', 10)
    if (v < 2500) return toast('Mínimo 2.500 pts', 'error')
    if (v > 100000) return toast('Máximo 100.000 pts/dia', 'error')
    sessionStorage.setItem('blaxx_redeem', JSON.stringify({ points: v }))
    navigate('/resgate-pix')
  }

  return (
    <>
      <Topbar eyebrow="Resgate" title="Resgatar pontos" />

      <div className="grid cols-2" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <div className="card">
          <span className="eyebrow">Cashback via PIX</span>
          <h3>Resgatar pontos</h3>
          <p className="subtitle">
            1 pt = R$ 0,09 · disponível após 6 meses de programa · VIPs sem limite diário.
          </p>

          <div className="field">
            <label>Quantos pontos resgatar?</label>
            <input
              type="number"
              min={1}
              step={1}
              placeholder="1000"
              autoComplete="off"
              inputMode="numeric"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
            <span className="hint">{quote}</span>
          </div>

          <button className="btn primary lg block" onClick={next}>
            Continuar
          </button>
        </div>

        <div className="card lime">
          <span className="eyebrow">Como funciona</span>
          <h3 style={{ marginBottom: 8 }}>Resgate seguro</h3>
          <p style={{ color: 'var(--gray-800)', fontSize: 14 }}>
            Em produção, validamos sua chave PIX via DICT do Banco Central e confirmamos que o
            titular da chave é você. Se o payout falhar por qualquer motivo, os pontos voltam à sua
            carteira automaticamente (Transaction REFUND).
          </p>
          <div className="divider"></div>
          <span className="eyebrow">Limites</span>
          <p style={{ color: 'var(--gray-800)', fontSize: 14, margin: 0 }}>
            • Conversão: 1 pt = R$ 0,09
            <br />• Máximo diário: R$ 100.000 (= 1.111.111 pts)
            <br />• Usuários VIP: sem limite diário
            <br />• Carência: 6 meses após cadastro
          </p>
        </div>
      </div>
    </>
  )
}
