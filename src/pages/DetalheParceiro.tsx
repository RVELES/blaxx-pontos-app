// Detalhe do parceiro — port fiel de detalhe-parceiro.html (regra de acúmulo + benefícios).
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BlaxxAPI, Partner, fmtNumber } from '../lib/api-client'
import { Topbar } from '../components/Shell'

export default function DetalheParceiro() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id')
  const [p, setP] = useState<Partner | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setError('Parceiro não informado.')
      return
    }
    ;(async () => {
      try {
        setP(await BlaxxAPI.partner(id))
      } catch (e) {
        setError((e as Error).message)
      }
    })()
  }, [id])

  return (
    <>
      <Topbar eyebrow="Detalhe" title="Parceiro" />
      {error ? (
        <p className="muted">Erro: {error}</p>
      ) : !p ? (
        <p className="muted">Carregando…</p>
      ) : (
        <>
          <div className="card mb-6">
            <div className="chip dark">{p.category}</div>
            <h2 style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 32 }}>{p.logo_emoji || '◯'}</span>
              {p.name}
            </h2>
            <p className="muted">{p.description || ''}</p>
            <div className="card lime mt-4">
              <span className="eyebrow">Regra de acúmulo</span>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--blaxx-black)',
                  marginTop: 4,
                }}
              >
                {p.accrual_rule || '—'}
              </div>
            </div>
          </div>

          <span className="eyebrow">Benefícios deste parceiro</span>
          <h3 className="mb-4">Resgate seus pontos</h3>
          {(p.benefits || []).length === 0 ? (
            <p className="muted">Nenhum benefício disponível.</p>
          ) : (
            <div className="grid cols-3">
              {p.benefits!.map((b) => (
                <div
                  key={b.id}
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/detalhe-beneficio?id=' + b.id)}
                >
                  <div style={{ fontSize: 32 }}>{b.image_emoji || '★'}</div>
                  <h3 style={{ margin: '6px 0' }}>{b.name}</h3>
                  <p className="muted" style={{ fontSize: 13 }}>
                    {b.description || ''}
                  </p>
                  <div className="row between mt-4">
                    <span className="chip success">{fmtNumber(b.cost_pts)} pts</span>
                    {b.tag && <span className="chip">{b.tag}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="btn ghost mt-6" onClick={() => navigate('/parceiros')}>
            ← Voltar
          </button>
        </>
      )}
    </>
  )
}
