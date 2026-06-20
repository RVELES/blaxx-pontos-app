// Detalhe do benefício — port fiel de detalhe-beneficio.html (custo x saldo, resgate → voucher).
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BlaxxAPI, Benefit, Wallet, fmtNumber, toast } from '../lib/api-client'
import { Topbar } from '../components/Shell'

export default function DetalheBeneficio() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id')
  const [b, setB] = useState<Benefit | null>(null)
  const [w, setW] = useState<Wallet | null>(null)
  const [error, setError] = useState('')
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    if (!id) {
      setError('Benefício não informado.')
      return
    }
    ;(async () => {
      try {
        setB(await BlaxxAPI.benefit(id))
        setW(await BlaxxAPI.wallet())
      } catch (e) {
        setError((e as Error).message)
      }
    })()
  }, [id])

  async function onRedeem() {
    if (!id) return
    setRedeeming(true)
    try {
      const v = await BlaxxAPI.benefitRedeem(id)
      sessionStorage.setItem('blaxx_voucher', JSON.stringify(v))
      navigate('/detalhe-voucher?id=' + v.id)
    } catch (e) {
      toast((e as Error).message || 'Falha no resgate', 'error', 3000)
      setRedeeming(false)
    }
  }

  if (error) return (
    <>
      <Topbar eyebrow="Benefício" title="Detalhe" />
      <p className="muted">Erro: {error}</p>
    </>
  )
  if (!b || !w) return (
    <>
      <Topbar eyebrow="Benefício" title="Detalhe" />
      <p className="muted">Carregando…</p>
    </>
  )

  const canAfford = w.balance_pts >= b.cost_pts

  return (
    <>
      <Topbar eyebrow="Benefício" title="Detalhe" />
      <div className="grid cols-2" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <div className="card">
          <div style={{ fontSize: 64, marginBottom: 12 }}>{b.image_emoji || '★'}</div>
          {b.tag && <span className="chip success">{b.tag}</span>}
          <h2 style={{ marginTop: 8 }}>{b.name}</h2>
          {b.partner_name && (
            <p className="muted" style={{ marginTop: -8 }}>
              Parceiro: <strong>{b.partner_name}</strong>
            </p>
          )}
          <p style={{ marginTop: 12 }}>{b.description || ''}</p>
          <div className="divider"></div>
          <span className="eyebrow">Detalhes</span>
          <ul style={{ paddingLeft: 18, color: 'var(--gray-600)' }}>
            <li>Validade do voucher: {b.expires_in_days} dias</li>
            <li>Categoria: {b.category}</li>
            {(b.stock ?? -1) >= 0 && <li>Estoque: {b.stock} unidades</li>}
          </ul>
        </div>

        <div className="card lime">
          <span className="eyebrow">Custo</span>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 48,
              fontWeight: 700,
              color: 'var(--blaxx-black)',
              lineHeight: 1,
              margin: '8px 0',
            }}
          >
            {fmtNumber(b.cost_pts)}
            <span style={{ fontSize: 14, color: 'var(--gray-600)', fontFamily: 'var(--font-body)' }}>
              {' '}
              pts
            </span>
          </div>
          <div className="muted" style={{ fontSize: 13, color: 'var(--gray-800)' }}>
            Seu saldo: <strong>{fmtNumber(w.balance_pts)} pts</strong>
          </div>
          {canAfford ? (
            <button
              className="btn primary lg block mt-6"
              disabled={redeeming}
              onClick={onRedeem}
            >
              {redeeming ? 'Resgatando…' : 'Resgatar agora'}
            </button>
          ) : (
            <>
              <button className="btn primary lg block mt-6" disabled>
                Saldo insuficiente
              </button>
              <button
                className="btn ghost block mt-2"
                onClick={() => navigate('/comprar-pontos')}
              >
                Comprar pontos
              </button>
            </>
          )}
          <button className="btn link block mt-2" onClick={() => navigate('/resgates')}>
            Voltar ao catálogo
          </button>
        </div>
      </div>
    </>
  )
}
