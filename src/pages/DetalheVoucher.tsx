// Detalhe do voucher — port fiel de detalhe-voucher.html (código emitido + copiar).
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BlaxxAPI, Voucher, fmtNumber, toast } from '../lib/api-client'

export default function DetalheVoucher() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id')
  const [v, setV] = useState<Voucher | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      return
    }
    ;(async () => {
      try {
        setV(await BlaxxAPI.voucher(id))
      } catch {
        setNotFound(true)
      }
    })()
  }, [id])

  function copy() {
    if (!v) return
    navigator.clipboard.writeText(v.code).then(() => toast('Código copiado'))
  }

  const statusChip = (s: string) =>
    'chip ' + (s === 'active' ? 'success' : s === 'used' ? '' : 'danger')

  return (
    <div className="main center" style={{ minHeight: '70vh' }}>
      <div className="center-wrap" style={{ maxWidth: 520 }}>
        <div className="card elevated center-text">
          <div className="success-tick">✦</div>
          <span className="eyebrow">Voucher emitido</span>
          <h2>{notFound ? 'Voucher não encontrado' : v ? v.benefit_name || 'Voucher Blaxx' : 'Carregando…'}</h2>

          {v && (
            <>
              <div className="card lime mt-4">
                <div
                  className="muted"
                  style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  Código
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.06em', marginTop: 6 }}
                >
                  {v.code}
                </div>
                <div className="muted mt-2" style={{ fontSize: 12 }}>
                  Apresente este código no parceiro.
                </div>
              </div>

              <table className="blaxx mt-6" style={{ fontSize: 13 }}>
                <tbody>
                  <tr>
                    <td className="muted">Pontos debitados</td>
                    <td style={{ textAlign: 'right' }}>{fmtNumber(v.points_spent)} pts</td>
                  </tr>
                  <tr>
                    <td className="muted">Validade</td>
                    <td style={{ textAlign: 'right' }}>
                      {new Date(v.expires_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                  <tr>
                    <td className="muted">Status</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={statusChip(v.status)}>{v.status}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <button className="btn dark block mt-6" onClick={copy}>
                Copiar código
              </button>
            </>
          )}

          <button className="btn ghost block mt-2" onClick={() => navigate('/resgates')}>
            Ver meus vouchers
          </button>
          <button className="btn link block mt-2" onClick={() => navigate('/dashboard')}>
            Início
          </button>
        </div>
      </div>
    </div>
  )
}
