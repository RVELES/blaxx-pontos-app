// Saldo insuficiente — port fiel de saldo-insuficiente.html.
import { useNavigate } from 'react-router-dom'

export default function SaldoInsuficiente() {
  const navigate = useNavigate()
  return (
    <div className="main center" style={{ minHeight: '70vh' }}>
      <div className="card elevated center-text" style={{ maxWidth: 480 }}>
        <div className="success-tick" style={{ background: 'var(--negative)', color: '#fff' }}>
          !
        </div>
        <span className="eyebrow">Atenção</span>
        <h2>Saldo insuficiente</h2>
        <p className="subtitle">Você não tem pontos suficientes para essa operação.</p>
        <div className="row mt-6" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => navigate('/comprar-pontos')}>
            Comprar pontos
          </button>
          <button className="btn ghost" onClick={() => navigate('/carteira')}>
            Voltar à carteira
          </button>
        </div>
      </div>
    </div>
  )
}
