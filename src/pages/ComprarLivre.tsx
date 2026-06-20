// Comprar pontos · valor livre — usa o MESMO fluxo dinâmico do pacote:
// POST /pix/charge { amount_brl } gera QR dinâmico via provider e a tela
// /pagamento-pix renderiza o QR + simular pagamento. Conversão 1 pt = R$ 0,09.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, BlaxxAPI, fmtNumber } from '../lib/api-client'
import { Topbar } from '../components/Shell'

const CENTS_PER_POINT = 9

function parseInputAmount(str: string): number {
  const clean = String(str || '').replace(/[^\d,.-]/g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isFinite(n) && n > 0 ? n : 0
}

export default function ComprarLivre() {
  const navigate = useNavigate()
  const [amountStr, setAmountStr] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const amount = parseInputAmount(amountStr)
  const points = Math.floor(Math.round(amount * 100) / CENTS_PER_POINT)
  const canCreate = amount >= 10

  async function createCharge() {
    setError('')
    if (amount < 10) {
      setError('Valor mínimo: R$ 10,00')
      return
    }
    setCreating(true)
    try {
      const charge = await BlaxxAPI.pixCharge({ amount_brl: amount })
      sessionStorage.setItem('blaxx_charge', JSON.stringify(charge))
      navigate('/pagamento-pix')
    } catch (e) {
      const err = e as ApiError
      if (err.status === 401) return // handler global cuida do logout
      setError(err.message || 'Falha ao gerar o PIX. Tente novamente.')
      setCreating(false)
    }
  }

  return (
    <>
      <Topbar eyebrow="Comprar pontos" title="Valor livre" />
      <div className="center-wrap" style={{ maxWidth: 720 }}>
        <h2 style={{ marginBottom: 4 }}>Comprar pontos via PIX</h2>
        <p className="muted" style={{ marginBottom: 24 }}>
          Valor livre — você define quanto pagar. Conversão: 1 ponto = R$ 0,09.
        </p>

        <div className="card mb-6">
          <h3 style={{ marginBottom: 12 }}>Quanto você quer comprar?</h3>
          <input
            className="amount-input"
            type="text"
            inputMode="decimal"
            placeholder="R$ 0,00"
            autoComplete="off"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canCreate && !creating) createCharge()
            }}
            style={{
              fontSize: 32,
              fontWeight: 800,
              padding: '14px 18px',
              width: '100%',
              textAlign: 'center',
            }}
          />
          <p className="muted" style={{ textAlign: 'center', margin: '12px 0' }}>
            você vai receber{' '}
            <strong style={{ color: 'var(--blaxx-black)', fontSize: 24 }}>
              {fmtNumber(points)} pts
            </strong>
          </p>
          <button
            className="btn primary lg block"
            disabled={!canCreate || creating}
            onClick={createCharge}
          >
            {creating ? 'Gerando PIX…' : 'Gerar QR Code de pagamento'}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              background: 'rgba(220,38,38,0.12)',
              color: 'var(--negative)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </>
  )
}
