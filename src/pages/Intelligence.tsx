// Intelligence — recomendações (showcase). "Melhor uso do seu saldo" usa
// dados REAIS (/wallet, /card) para um sinal de verdade; o resto é demo.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Shell'
import { BlaxxAPI, fmtBRL, fmtNumber, type CardState, type Wallet } from '../lib/api-client'

const DEMO = { fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' as const, color: '#7a9e00', background: 'rgba(124,255,0,.14)', border: '1px solid rgba(124,255,0,.4)', padding: '3px 8px', borderRadius: 999 }

const SIGNALS = [
  { ico: 'S', t: 'Melhor transferência hoje', b: 'SMILES +80%', s: 'Prazo: 48 horas' },
  { ico: '✈', t: 'Melhor resgate', b: 'Business Class · GRU → LHR', s: 'Economia estimada R$ 6.500' },
  { ico: '↗', t: 'Oportunidades ativas', b: '12 ofertas', s: 'Ranqueadas por retorno e prazo' },
]

export default function Intelligence() {
  const navigate = useNavigate()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [card, setCard] = useState<CardState | null>(null)
  useEffect(() => {
    BlaxxAPI.wallet().then(setWallet).catch(() => {})
    BlaxxAPI.card().then(setCard).catch(() => {})
  }, [])

  const toNext = card?.next_tier ? card.points_to_next : 0

  return (
    <>
      <Topbar eyebrow="Mundo Blaxx" title="Intelligence Center" />

      {/* Sinal REAL baseado no saldo/nível do usuário */}
      <div className="card" style={{ background: 'linear-gradient(140deg,#06080A,#0D1217)', color: '#fff', border: 0 }}>
        <div className="label" style={{ color: 'rgba(255,255,255,.6)' }}>Melhor uso do seu saldo agora</div>
        {wallet ? (
          <>
            <h2 style={{ fontSize: 30, margin: '10px 0 6px' }}>
              {fmtNumber(wallet.balance_pts)} pts ≈ <span style={{ color: '#7CFF00' }}>{fmtBRL(wallet.balance_brl_equiv)}</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.7)', maxWidth: 560 }}>
              {card?.next_tier
                ? `Faltam ${fmtNumber(toNext)} pts para ${card.next_tier.label} — concentre acúmulo este mês para subir de nível.`
                : 'Seu saldo está pronto para resgate em Pix, milhas ou diárias. Veja a melhor rota nos parceiros.'}
            </p>
            <div className="row mt-6" style={{ gap: 10, flexWrap: 'wrap' }}>
              <button className="btn primary" onClick={() => navigate('/vender-pontos')}>Resgatar em Pix</button>
              <button className="btn ghost" style={{ borderColor: 'rgba(255,255,255,.2)', color: '#fff' }} onClick={() => navigate('/parceiros')}>Ver parceiros</button>
            </div>
          </>
        ) : (
          <p className="muted" style={{ color: 'rgba(255,255,255,.7)' }}>Carregando seu saldo…</p>
        )}
      </div>

      <div className="card mt-8" style={{ position: 'relative' }}>
        <span style={{ ...DEMO, position: 'absolute', top: 16, right: 16 }}>demo</span>
        <div className="section-head"><h3>Sinais do dia</h3></div>
        <div className="tile-list">
          {SIGNALS.map((s) => (
            <div className="tile-row" key={s.t}>
              <div className="tile-emoji">{s.ico}</div>
              <div className="tile-body"><div className="tile-title">{s.b}</div><div className="tile-sub">{s.t} · {s.s}</div></div>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Recomendações ilustrativas — o motor de oportunidades entrará com dados de mercado e parceiros.</p>
      </div>
    </>
  )
}
