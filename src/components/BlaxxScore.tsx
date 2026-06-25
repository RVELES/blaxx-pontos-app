// BlaXx Score — índice 0-100 que sintetiza "saúde de pontos" do usuário.
// Heurístico (sem ML), 4 fatores com peso igual. Quando o backend expuser
// /score, substituímos por dados reais.
import { useMemo } from 'react'
import type { Transaction, Wallet, CardState } from '../lib/api-client'

interface Props {
  wallet: Wallet | null
  card: CardState | null
  txs: Transaction[]
}

interface Factor {
  key: 'saldo' | 'frequencia' | 'parceiros' | 'expiracao'
  label: string
  value: number  // 0..100
  detail: string
}

function computeFactors({ wallet, card, txs }: Props): Factor[] {
  const balance = wallet?.balance_pts ?? 0
  const totalLifetime = (card as unknown as { total_balance_pts?: number })?.total_balance_pts ?? balance

  // Fator saldo (25%) — log-scale pra que pequenos saldos já recebam pontos.
  // Saldo 0 → 0, 10k → ~50, 100k+ → 100
  const fSaldo = Math.min(100, Math.round(Math.log10(Math.max(1, balance)) * 25))

  // Fator frequência (25%) — proxy: quantas tx nos últimos 6 (que é o que
  // BlaxxAPI.transactions(6) já fetcha). >= 5 = 100; 0 = 0.
  const recentCount = txs.filter((t) => t.amount_pts !== 0).length
  const fFreq = Math.min(100, Math.round((recentCount / 5) * 100))

  // Fator parceiros (25%) — % de tx de "purchase" (compras em parceiros)
  // sobre total de tx. >= 50% = 100; 0 = 0.
  const purchases = txs.filter((t) => (t.type || '').toLowerCase().includes('purchase')).length
  const ratio = txs.length > 0 ? purchases / txs.length : 0
  const fPart = Math.min(100, Math.round((ratio / 0.5) * 100))

  // Fator expiração (25%) — heurística inversa: assumimos que mais saldo
  // acumulado sem uso recente = risco. Se ratio recente/total < 0.05, score
  // baixa. Default: 100 (sem dados, sem risco).
  const burnRatio = totalLifetime > 0 ? recentCount / Math.max(1, txs.length) : 1
  const fExp = totalLifetime > 50_000 && burnRatio < 0.3
    ? Math.round(burnRatio * 200)
    : 100

  return [
    { key: 'saldo',      label: 'Saldo',        value: fSaldo, detail: balance.toLocaleString('pt-BR') + ' pts' },
    { key: 'frequencia', label: 'Frequência',   value: fFreq,  detail: recentCount + ' tx recentes' },
    { key: 'parceiros',  label: 'Parceiros',    value: fPart,  detail: Math.round(ratio * 100) + '% em compras' },
    { key: 'expiracao',  label: 'Vencimento',   value: fExp,   detail: fExp >= 80 ? 'sob controle' : 'usar logo' },
  ]
}

function adjective(score: number): { word: string; tone: 'good' | 'mid' | 'low' } {
  if (score >= 80) return { word: 'Saudável', tone: 'good' }
  if (score >= 50) return { word: 'OK', tone: 'mid' }
  return { word: 'Atenção', tone: 'low' }
}

export default function BlaxxScore({ wallet, card, txs }: Props) {
  const factors = useMemo(() => computeFactors({ wallet, card, txs }), [wallet, card, txs])
  const score = Math.round(factors.reduce((s, f) => s + f.value, 0) / factors.length)
  const adj = adjective(score)

  return (
    <div className="blx-score" role="region" aria-label="BlaXx Score">
      <div className="blx-score__head">
        <span className="blx-score__eyebrow">BLAXX SCORE™</span>
        <span className={`blx-score__chip blx-score__chip--${adj.tone}`}>{adj.word}</span>
      </div>
      <div className="blx-score__big" aria-live="polite">
        <strong>{score}</strong>
        <span>/100</span>
      </div>
      <ul className="blx-score__factors">
        {factors.map((f) => (
          <li key={f.key}>
            <div className="blx-score__row">
              <span className="blx-score__label">{f.label}</span>
              <span className="blx-score__detail">{f.detail}</span>
            </div>
            <div className="blx-score__bar" aria-hidden>
              <span
                className={`blx-score__fill blx-score__fill--${
                  f.value >= 80 ? 'good' : f.value >= 50 ? 'mid' : 'low'
                }`}
                style={{ width: `${f.value}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
