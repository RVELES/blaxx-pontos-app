// Excluir conta — port fiel de excluir-conta.html (LGPD · direito ao esquecimento).
// Mantém o comportamento da fonte: confirmação dupla obrigatória em produção.
import { useNavigate } from 'react-router-dom'
import { toast } from '../lib/api-client'

export default function ExcluirConta() {
  const navigate = useNavigate()
  return (
    <div className="main center" style={{ minHeight: '70vh' }}>
      <div className="card elevated center-text" style={{ maxWidth: 520 }}>
        <span className="eyebrow" style={{ color: 'var(--negative)' }}>
          LGPD · Direito ao esquecimento
        </span>
        <h2>Excluir conta</h2>
        <p className="subtitle">
          Esta ação anonimiza seus dados pessoais. O ledger é preservado por obrigação fiscal (sem
          identificar você).
        </p>
        <p className="muted" style={{ fontSize: 13 }}>
          Saldo restante de pontos será perdido. Não há reversão.
        </p>
        <div className="row mt-6" style={{ justifyContent: 'center' }}>
          <button className="btn ghost" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button
            className="btn ghost"
            style={{ color: 'var(--negative)', borderColor: 'var(--negative)' }}
            onClick={() => toast('Em produção: confirmação dupla obrigatória', 'error', 3000)}
          >
            Confirmar exclusão
          </button>
        </div>
      </div>
    </div>
  )
}
