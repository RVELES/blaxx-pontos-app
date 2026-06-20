// Comprar pontos — port fiel de comprar-pontos.html.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Shell'
import { BlaxxAPI, fmtBRL, fmtNumber, normalizePackages, toast, type PixPackage } from '../lib/api-client'

export default function ComprarPontos() {
  const navigate = useNavigate()
  const [pkgs, setPkgs] = useState<PixPackage[] | null>(null)

  useEffect(() => {
    let alive = true
    BlaxxAPI.pixPackages()
      .then((r) => alive && setPkgs(normalizePackages(r)))
      .catch((e) => toast('Erro: ' + (e as Error).message, 'error'))
    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <Topbar eyebrow="Compra de pontos" title="Comprar pontos" />

      <div className="card lime mb-6">
        <span className="eyebrow">Pacotes de pontos</span>
        <h3 style={{ marginBottom: 4 }}>Escolha um pacote</h3>
        <p className="muted" style={{ color: 'var(--gray-800)' }}>
          Pague via PIX e os pontos são creditados em segundos. Validade 24 meses.
        </p>
      </div>

      <div
        className="card elevated mb-6"
        style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <span className="eyebrow">Sem pacote</span>
          <h3 style={{ margin: '4px 0' }}>Prefere escolher o valor?</h3>
          <p className="muted" style={{ margin: 0 }}>
            Compre pontos com valor livre — você define quanto pagar. Conversão: 1 ponto = R$ 0,09.
          </p>
        </div>
        <button className="btn primary" onClick={() => navigate('/comprar-livre')}>
          Comprar valor livre
        </button>
      </div>

      <div className="grid cols-4">
        {!pkgs ? (
          'Carregando…'
        ) : (
          pkgs.map((p) => (
            <div className="card elevated" key={p.key}>
              <span className="eyebrow">{p.label || p.key}</span>
              <div
                className="display"
                style={{ fontFamily: 'var(--font-display)', fontSize: 38, color: 'var(--blaxx-black)' }}
              >
                {fmtNumber(p.points)}
                <span style={{ fontSize: 14, color: 'var(--gray-600)', fontFamily: 'var(--font-body)' }}>
                  {' '}
                  pts
                </span>
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                por <strong style={{ color: 'var(--blaxx-black)' }}>{fmtBRL(p.price_brl)}</strong>
              </div>
              <div className="divider"></div>
              <ul
                style={{
                  paddingLeft: 18,
                  margin: 0,
                  color: 'var(--gray-600)',
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                <li>Crédito imediato após PIX</li>
                <li>Validade 24 meses</li>
                <li>Cashback liberado em 6 meses</li>
              </ul>
              <button
                className="btn primary block mt-6"
                onClick={() => navigate('/checkout?pkg=' + p.key)}
              >
                Pagar com PIX
              </button>
            </div>
          ))
        )}
      </div>
    </>
  )
}
