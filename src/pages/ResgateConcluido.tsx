// Resgate concluído — port fiel de resgate-concluido.html (trata payout falho → estorno).
import { useNavigate } from 'react-router-dom'
import { fmtBRL, fmtNumber, type RedeemResult } from '../lib/api-client'
import Confetti from '../components/Confetti'

export default function ResgateConcluido() {
  const navigate = useNavigate()
  const r: RedeemResult = JSON.parse(sessionStorage.getItem('blaxx_redeem_result') || '{}')
  const failed = r.status === 'failed'
  // PAYOUT_MODE=manual: o resgate fica "processing" (débito retido, PIX sai
  // em até 1 dia útil). Sem festa nem "PIX enviado" — o dinheiro ainda não saiu.
  const processing = r.status === 'processing'
  const celebrate = !failed && !processing

  return (
    <div className="main center" style={{ minHeight: '70vh' }}>
      {/* Celebração lime só quando o PIX realmente saiu (status paid). */}
      {celebrate && <Confetti />}
      <div className="card elevated center-text" style={{ maxWidth: 520 }}>
        <div className="success-tick" style={!celebrate ? { background: 'var(--warning)' } : undefined}>
          {failed ? '↺' : processing ? '⏱' : '✓'}
        </div>
        <span className="eyebrow">{failed ? 'Estorno automático' : processing ? 'Em processamento' : 'Resgate aprovado'}</span>
        <h2>{failed ? 'Payout falhou' : processing ? 'Resgate em processamento' : 'PIX enviado!'}</h2>
        <p className="subtitle">
          {failed
            ? 'Os pontos foram devolvidos à sua carteira (Transaction REFUND).'
            : processing
            ? 'Seu PIX será transferido em até 1 dia útil. Acompanhe pelo extrato.'
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
            <span className={'chip ' + (failed ? 'danger' : processing ? 'warning' : 'success')}>{r.status || '—'}</span>
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
