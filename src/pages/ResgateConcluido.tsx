// Resgate concluído — port fiel de resgate-concluido.html (trata payout falho → estorno).
import { useNavigate } from 'react-router-dom'
import { fmtBRL, fmtNumber, type RedeemResult } from '../lib/api-client'

export default function ResgateConcluido() {
  const navigate = useNavigate()
  const r: RedeemResult = JSON.parse(sessionStorage.getItem('blaxx_redeem_result') || '{}')
  const failed = r.status === 'failed'

  return (
    <div className="main center" style={{ minHeight: '70vh' }}>
      <div className="card elevated center-text" style={{ maxWidth: 520 }}>
        <div className="success-tick" style={failed ? { background: 'var(--warning)' } : undefined}>
          {failed ? '↺' : '✓'}
        </div>
        <span className="eyebrow">{failed ? 'Estorno automático' : 'Resgate aprovado'}</span>
        <h2>{failed ? 'Payout falhou' : 'PIX enviado!'}</h2>
        <p className="subtitle">
          {failed
            ? 'Os pontos foram devolvidos à sua carteira (Transaction REFUND).'
            : 'Recurso disponível na sua conta em até 30 segundos.'}
        </p>
        <div className="card lime mt-4">
          <div className="row between">
            <span>Valor</span>
            <strong>{fmtBRL(r.amount_brl)}</strong>
          </div>
          <div className="row between mt-2">
            <span>Pontos debitados</span>
            <strong>{fmtNumber(r.points_debited || 0)} pts</strong>
          </div>
          <div className="row between mt-2">
            <span>End-to-End ID</span>
            <span className="mono">{r.end_to_end_id || '—'}</span>
          </div>
          <div className="row between mt-2">
            <span>Status</span>
            <span className={'chip ' + (failed ? 'danger' : 'success')}>{r.status || '—'}</span>
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
