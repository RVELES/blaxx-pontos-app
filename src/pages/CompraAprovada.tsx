// Compra aprovada — port fiel de compra-aprovada.html.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BlaxxAPI, fmtNumber } from '../lib/api-client'
import Confetti from '../components/Confetti'

export default function CompraAprovada() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState('—')

  useEffect(() => {
    let alive = true
    BlaxxAPI.wallet()
      .then((w) => alive && setBalance(fmtNumber(w.balance_pts) + ' pts'))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="main center" style={{ minHeight: '70vh' }}>
      <Confetti />
      <div className="card elevated center-text" style={{ maxWidth: 520 }}>
        <div className="success-tick">✓</div>
        <span className="eyebrow">Compra aprovada</span>
        <h2>Pontos creditados!</h2>
        <p className="subtitle">Sua carteira foi atualizada agora.</p>
        <div className="card lime mt-4">
          <div className="row between">
            <span>Novo saldo</span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{balance}</strong>
          </div>
        </div>
        <div className="row mt-6" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => navigate('/carteira')}>
            Ver carteira
          </button>
          <button className="btn ghost" onClick={() => navigate('/dashboard')}>
            Início
          </button>
        </div>
      </div>
    </div>
  )
}
