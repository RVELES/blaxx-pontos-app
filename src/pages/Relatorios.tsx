// Relatórios — resumo do patrimônio. Saldo/R$/nível/lifetime são REAIS
// (/wallet, /card); o gráfico de evolução é showcase.
import { useEffect, useState } from 'react'
import { Topbar } from '../components/Shell'
import { BlaxxAPI, fmtBRL, fmtNumber, type CardState, type Wallet } from '../lib/api-client'

const DEMO = { fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' as const, color: '#7a9e00', background: 'rgba(89,253,39,.14)', border: '1px solid rgba(89,253,39,.4)', padding: '3px 8px', borderRadius: 999 }

export default function Relatorios() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [card, setCard] = useState<CardState | null>(null)
  useEffect(() => {
    BlaxxAPI.wallet().then(setWallet).catch(() => {})
    BlaxxAPI.card().then(setCard).catch(() => {})
  }, [])

  return (
    <>
      <Topbar eyebrow="Mundo Blaxx" title="Relatórios" />

      <div className="grid cols-3">
        <div className="card metric"><span className="label">Saldo atual</span><div className="value">{wallet ? fmtNumber(wallet.balance_pts) : '—'}</div><div className="muted" style={{ fontSize: 12, marginTop: 6 }}>pontos</div></div>
        <div className="card metric"><span className="label">Valor estimado</span><div className="value">{wallet ? fmtBRL(wallet.balance_brl_equiv) : 'R$ —'}</div><div className="muted" style={{ fontSize: 12, marginTop: 6 }}>em resgates</div></div>
        <div className="card metric"><span className="label">Acumulado (vitalício)</span><div className="value">{card ? fmtNumber(card.lifetime_points) : '—'}</div><div className="muted" style={{ fontSize: 12, marginTop: 6 }}>nível {card?.tier?.label ?? '—'}</div></div>
      </div>

      <div className="card mt-8" style={{ position: 'relative' }}>
        <span style={{ ...DEMO, position: 'absolute', top: 16, right: 16 }}>demo</span>
        <div className="section-head"><h3>Evolução de pontos (12 meses)</h3></div>
        <svg viewBox="0 0 600 180" style={{ width: '100%', height: 180 }} preserveAspectRatio="none">
          <path d="M10 150 C70 130 110 140 160 100 S250 70 300 95 S400 130 450 70 S540 40 590 22" fill="none" stroke="#59FD27" strokeWidth="4" strokeLinecap="round" />
          <path d="M10 150 C70 130 110 140 160 100 S250 70 300 95 S400 130 450 70 S540 40 590 22 L590 180 L10 180 Z" fill="rgba(89,253,39,.12)" />
        </svg>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Gráfico ilustrativo. Exportação CSV/PDF e relatório fiscal entrarão com a base histórica completa.</p>
      </div>

      <div className="grid cols-2 mt-8">
        <div className="card"><div className="section-head"><h3>Resumo de pontos</h3></div>
          <div className="tile-list">
            <div className="tile-row"><div className="tile-emoji">↘</div><div className="tile-body"><div className="tile-title">Acumulado</div><div className="tile-sub">créditos vitalícios</div></div><div className="tile-meta">{card ? '+' + fmtNumber(card.lifetime_points) : '—'}</div></div>
            <div className="tile-row"><div className="tile-emoji">💳</div><div className="tile-body"><div className="tile-title">Saldo disponível</div><div className="tile-sub">pronto p/ usar</div></div><div className="tile-meta">{wallet ? fmtNumber(wallet.balance_pts) : '—'}</div></div>
            <div className="tile-row"><div className="tile-emoji">⏳</div><div className="tile-body"><div className="tile-title">Pendentes</div><div className="tile-sub">em processamento</div></div><div className="tile-meta">{wallet ? fmtNumber(wallet.pending_pts) : '—'}</div></div>
          </div>
        </div>
        <div className="card" style={{ position: 'relative' }}>
          <span style={{ ...DEMO, position: 'absolute', top: 16, right: 16 }}>demo</span>
          <div className="section-head"><h3>Exportar</h3></div>
          <p className="muted">Relatórios mensal e anual, em CSV ou PDF, com resumo de pontos, cashback e transações.</p>
          <div className="row mt-6" style={{ gap: 10 }}><button className="btn ghost" disabled>CSV (em breve)</button><button className="btn ghost" disabled>PDF (em breve)</button></div>
        </div>
      </div>
    </>
  )
}
