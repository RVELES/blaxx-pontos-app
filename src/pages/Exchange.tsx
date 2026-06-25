// Exchange — troca entre programas (showcase). Saldo disponível é REAL (/wallet).
import { useEffect, useState } from 'react'
import { Topbar } from '../components/Shell'
import { BlaxxAPI, fmtNumber, type Wallet } from '../lib/api-client'

const DEMO = { fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' as const, color: '#7a9e00', background: 'rgba(89,253,39,.14)', border: '1px solid rgba(89,253,39,.4)', padding: '3px 8px', borderRadius: 999 }

const QUOTES = [
  { k: 'S', name: 'Smiles', buy: '0,021', sell: '0,024' },
  { k: 'L', name: 'Livelo', buy: '0,034', sell: '0,037' },
  { k: 'A', name: 'Azul', buy: '0,019', sell: '0,022' },
  { k: 'T', name: 'LATAM Pass', buy: '0,023', sell: '0,026' },
  { k: 'E', name: 'Esfera', buy: '0,030', sell: '0,033' },
]

export default function Exchange() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  useEffect(() => {
    BlaxxAPI.wallet().then(setWallet).catch(() => {})
  }, [])

  return (
    <>
      <Topbar eyebrow="Mundo Blaxx" title="Rewards Exchange" />

      <div className="grid cols-3">
        <div className="balance-card">
          <div className="label">Disponível para trocar</div>
          <div className="amount" style={{ fontSize: 40, marginTop: 8 }}>
            {wallet ? fmtNumber(wallet.balance_pts) : '—'} <span style={{ fontSize: 16 }}>pts</span>
          </div>
          <div className="equiv">≈ {wallet ? wallet.balance_brl_equiv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ —'}</div>
        </div>
        <div className="card metric"><span className="label">Spread médio</span><div className="value">3,2%</div><div className="muted" style={{ fontSize: 12, marginTop: 6 }}>ilustrativo</div></div>
        <div className="card metric"><span className="label">Bônus do dia</span><div className="value" style={{ color: '#0a7d32' }}>+80%</div><div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Smiles · 48h</div></div>
      </div>

      <div className="card mt-8" style={{ position: 'relative' }}>
        <span style={{ ...DEMO, position: 'absolute', top: 16, right: 16 }}>demo</span>
        <div className="section-head"><h3>Cotações (compra · venda)</h3></div>
        <table className="blaxx">
          <thead><tr><th>Programa</th><th style={{ textAlign: 'right' }}>Compra</th><th style={{ textAlign: 'right' }}>Venda</th></tr></thead>
          <tbody>
            {QUOTES.map((q) => (
              <tr key={q.name}>
                <td><span className="tile-emoji" style={{ display: 'inline-grid', width: 30, height: 30, marginRight: 10, fontSize: 13 }}>{q.k}</span>{q.name}</td>
                <td style={{ textAlign: 'right' }}>{q.buy}</td>
                <td style={{ textAlign: 'right', color: '#0a7d32', fontWeight: 700 }}>{q.sell}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Cotações ilustrativas. A execução de ordens entrará com integração de parceiros.</p>
      </div>
    </>
  )
}
