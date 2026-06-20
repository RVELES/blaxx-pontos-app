// Envio concluído — port fiel de envio-concluido.html.
import { useNavigate } from 'react-router-dom'
import { fmtNumber, type TransferReceipt } from '../lib/api-client'

export default function EnvioConcluido() {
  const navigate = useNavigate()
  const r: TransferReceipt = JSON.parse(sessionStorage.getItem('blaxx_receipt') || '{}')
  const t: { to?: string; amount_pts?: number } = JSON.parse(
    sessionStorage.getItem('blaxx_transfer') || '{}',
  )

  return (
    <div className="main center" style={{ minHeight: '70vh' }}>
      <div className="card elevated center-text" style={{ maxWidth: 520 }}>
        <div className="success-tick">✓</div>
        <span className="eyebrow">Comprovante</span>
        <h2>Pontos enviados!</h2>
        <div className="card lime mt-4 center-text">
          <div className="row between">
            <span>Para</span>
            <strong>{t.to || '—'}</strong>
          </div>
          <div className="row between mt-2">
            <span>Valor</span>
            <strong>{fmtNumber(r.amount_pts || t.amount_pts || 0)} pts</strong>
          </div>
          <div className="row between mt-2">
            <span>Comprovante</span>
            <span className="mono">{r.receipt_code || '—'}</span>
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
