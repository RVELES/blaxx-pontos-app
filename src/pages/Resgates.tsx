// Resgates — port fiel de resgates.html (abas: benefícios disponíveis / meus vouchers).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BlaxxAPI, Benefit, Voucher, fmtNumber } from '../lib/api-client'
import { Topbar } from '../components/Shell'

type View = 'all' | 'mine'

export default function Resgates() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('all')
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        if (view === 'all') {
          const d = await BlaxxAPI.benefits()
          setBenefits(d.items || [])
        } else {
          const d = await BlaxxAPI.vouchers()
          setVouchers(d.items || [])
        }
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [view])

  const statusChip = (s: string) =>
    'chip ' + (s === 'active' ? 'success' : s === 'used' ? '' : 'danger')

  return (
    <>
      <Topbar eyebrow="Resgates" title="Benefícios" />
      <span className="eyebrow">Marketplace de benefícios</span>
      <h3 className="mb-4">Troque seus pontos</h3>

      <div className="row mb-6" style={{ gap: 10 }}>
        <button
          className={'chip ' + (view === 'all' ? 'dark' : '')}
          style={{ cursor: 'pointer' }}
          onClick={() => setView('all')}
        >
          Disponíveis
        </button>
        <button
          className={'chip ' + (view === 'mine' ? 'dark' : '')}
          style={{ cursor: 'pointer' }}
          onClick={() => setView('mine')}
        >
          Meus vouchers
        </button>
      </div>

      {error ? (
        <p className="muted">Erro: {error}</p>
      ) : loading ? (
        <p className="muted">Carregando…</p>
      ) : view === 'all' ? (
        benefits.length === 0 ? (
          <p className="muted">Nenhum benefício disponível.</p>
        ) : (
          <div className="grid cols-3">
            {benefits.map((b) => (
              <div
                key={b.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/detalhe-beneficio?id=' + b.id)}
              >
                {b.tag && <span className="chip success">{b.tag}</span>}
                <div style={{ fontSize: 32, marginTop: 8 }}>{b.image_emoji || '★'}</div>
                <h3 style={{ margin: '6px 0' }}>{b.name}</h3>
                {b.partner_name && (
                  <p className="muted" style={{ fontSize: 12 }}>
                    {b.partner_name}
                  </p>
                )}
                <p className="muted" style={{ fontSize: 13 }}>
                  {b.description || ''}
                </p>
                <div className="row between mt-4">
                  <span
                    style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}
                  >
                    {fmtNumber(b.cost_pts)}{' '}
                    <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>pts</span>
                  </span>
                  <button className="btn primary" style={{ padding: '8px 14px', fontSize: 12 }}>
                    Resgatar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : vouchers.length === 0 ? (
        <p className="muted">
          Você ainda não tem vouchers. Resgate um benefício para começar.
        </p>
      ) : (
        <table className="blaxx">
          <thead>
            <tr>
              <th>Benefício</th>
              <th>Código</th>
              <th>Status</th>
              <th>Validade</th>
              <th style={{ textAlign: 'right' }}>Pontos</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id}>
                <td>{v.benefit_name || '—'}</td>
                <td className="mono">{v.code}</td>
                <td>
                  <span className={statusChip(v.status)}>{v.status}</span>
                </td>
                <td>{new Date(v.expires_at).toLocaleDateString('pt-BR')}</td>
                <td style={{ textAlign: 'right' }} className="amount-neg">
                  -{fmtNumber(v.points_spent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
