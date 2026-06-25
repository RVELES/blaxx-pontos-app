// Checkout — port fiel de checkout.html (gera cobrança PIX; trata gate de e-mail não verificado).
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Topbar } from '../components/Shell'
import {
  BlaxxAPI,
  ApiError,
  fmtBRL,
  fmtNumber,
  normalizePackages,
  toast,
  type PixPackage,
} from '../lib/api-client'

export default function Checkout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const pkgKey = params.get('pkg') || 'plus'
  const [pkg, setPkg] = useState<PixPackage | null>(null)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    let alive = true
    BlaxxAPI.pixPackages()
      .then((r) => {
        if (!alive) return
        const items = normalizePackages(r)
        setPkg(items.find((x) => x.key === pkgKey) || items[0] || null)
      })
      .catch((e) => toast('Erro: ' + (e as Error).message, 'error'))
    return () => {
      alive = false
    }
  }, [pkgKey])

  async function pay() {
    setPaying(true)
    try {
      const charge = await BlaxxAPI.pixCharge({ package: pkgKey })
      sessionStorage.setItem('blaxx_charge', JSON.stringify(charge))
      navigate('/pagamento-pix')
    } catch (e) {
      const err = e as ApiError
      const data = (err.data || {}) as { code?: string; error_code?: string }
      const msg = (err.message || '').toLowerCase()
      const isEmailGate =
        err.status === 403 &&
        (data.code === 'email_not_verified' ||
          data.error_code === 'email_not_verified' ||
          msg.includes('e-mail') ||
          msg.includes('email') ||
          msg.includes('verifique') ||
          msg.includes('confirme'))
      if (isEmailGate) {
        toast('Confirme seu e-mail para concluir a compra.', 'error', 3500)
        setTimeout(() => navigate('/validacao'), 1500)
      } else {
        toast('Erro ao gerar PIX: ' + err.message, 'error', 3000)
      }
      setPaying(false)
    }
  }

  return (
    <>
      <Topbar eyebrow="Checkout" title="Confirmar compra" />

      <div className="grid cols-2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <span className="eyebrow">Resumo</span>
          <h3>Confirme sua compra</h3>
          {!pkg ? (
            <div className="mt-4 muted">Carregando…</div>
          ) : (
            <div className="mt-4">
              <div className="row between">
                <span>Pacote</span>
                <strong>{pkg.label || pkg.key}</strong>
              </div>
              <div className="row between mt-2">
                <span>Pontos</span>
                <strong>{fmtNumber(pkg.points)} pts</strong>
              </div>
              <div className="row between mt-2">
                <span>Validade</span>
                <strong>24 meses</strong>
              </div>
              <div className="row between mt-4" style={{ fontSize: 18 }}>
                <span>Total</span>
                <strong
                  style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--blaxx-black)' }}
                >
                  {fmtBRL(pkg.price_brl)}
                </strong>
              </div>
            </div>
          )}
          <div className="divider"></div>
          <span className="eyebrow">Método de pagamento</span>
          <div className="row mt-2">
            <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="method" value="pix" defaultChecked /> PIX (instantâneo)
            </label>
          </div>
          <button className="btn primary lg block mt-6" onClick={pay} disabled={paying}>
            {paying ? 'Gerando…' : 'Gerar cobrança PIX'}
          </button>
        </div>

        <div className="card lime">
          <span className="eyebrow">Princípio regulatório</span>
          <h3 style={{ marginBottom: 8 }}>Pontos = créditos promocionais</h3>
          <p style={{ color: 'var(--gray-800)', fontSize: 14 }}>
            Esta compra credita pontos de uso restrito dentro do programa Blaxx, com validade de 24
            meses. Não há saque em dinheiro. Resgates por PIX ficam disponíveis 6 meses após o
            primeiro cadastro.
          </p>
        </div>
      </div>
    </>
  )
}
