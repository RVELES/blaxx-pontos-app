// Catálogo de badges e função pura `evaluate(state)` que devolve o estado
// de cada badge (locked/progress/unlocked). Deriva tudo do que já temos
// (wallet, card, transactions) — não exige novo endpoint do backend.
// Quando o backend expuser /badges, substituímos por dados persistidos.

import type { Transaction, Wallet, CardState } from './api-client'

export type BadgeKey =
  | 'first-purchase'
  | 'balance-1k'
  | 'balance-10k'
  | 'balance-100k'
  | 'refer-1'
  | 'refer-5'
  | 'partners-5'
  | 'first-transfer'
  | 'first-redeem'
  | 'streak-week'
  | 'tier-prime'
  | 'tier-black'

export interface BadgeDef {
  key: BadgeKey
  label: string
  description: string
  emoji: string
  /** Categoria pra agrupar a UI. */
  group: 'Início' | 'Acúmulo' | 'Resgate' | 'Social' | 'Tier'
}

export interface BadgeState {
  def: BadgeDef
  unlocked: boolean
  /** 0..1 — para barrinha quando ainda não desbloqueou. */
  progress: number
  /** Texto curto explicando o que falta. */
  hint: string
}

export const BADGES: BadgeDef[] = [
  { key: 'first-purchase', label: 'Primeira compra', description: 'Comprou pontos pela primeira vez.', emoji: '🛒', group: 'Início' },
  { key: 'first-transfer', label: 'Enviei pra alguém', description: 'Enviou pontos pra outro BlaXx.',  emoji: '💌', group: 'Início' },
  { key: 'first-redeem',   label: 'Primeiro resgate', description: 'Trocou pontos por Pix.',           emoji: '💸', group: 'Início' },
  { key: 'balance-1k',     label: '1.000 pts',        description: 'Acumulou 1.000 pontos no total.',  emoji: '⭐', group: 'Acúmulo' },
  { key: 'balance-10k',    label: '10.000 pts',       description: 'Acumulou 10.000 pontos no total.', emoji: '🌟', group: 'Acúmulo' },
  { key: 'balance-100k',   label: '100.000 pts',      description: 'Acumulou 100k pontos — top 1%.',   emoji: '✨', group: 'Acúmulo' },
  { key: 'partners-5',     label: '5 parceiros',      description: 'Comprou em 5 parceiros distintos.', emoji: '🏬', group: 'Resgate' },
  { key: 'streak-week',    label: 'Semana ativa',     description: 'Uma transação por dia, 7 dias.',   emoji: '🔥', group: 'Resgate' },
  { key: 'refer-1',        label: '1 indicado',       description: 'Convidou 1 amigo que se cadastrou.', emoji: '🤝', group: 'Social' },
  { key: 'refer-5',        label: '5 indicados',      description: 'Convidou 5 amigos. CAC -25%.',     emoji: '🚀', group: 'Social' },
  { key: 'tier-prime',     label: 'BlaXx Prime',      description: 'Atingiu o tier Prime.',            emoji: '🥈', group: 'Tier' },
  { key: 'tier-black',     label: 'BlaXx Black',      description: 'Atingiu o tier Black.',            emoji: '🥇', group: 'Tier' },
]

interface EvalInput {
  wallet: Wallet | null
  card: CardState | null
  txs: Transaction[]
}

function pct(current: number, target: number) {
  if (target <= 0) return 1
  return Math.min(1, current / target)
}

export function evaluate({ wallet, card, txs }: EvalInput): BadgeState[] {
  const balance = wallet?.balance_pts ?? 0
  const lifetime =
    (card as unknown as { total_balance_pts?: number })?.total_balance_pts ?? balance
  const cardTier = (card as unknown as { tier_key?: string })?.tier_key || ''

  const types = txs.map((t) => (t.type || '').toLowerCase())
  const hasPurchase = types.some((t) => t.includes('purchase'))
  const hasTransfer = types.some((t) => t.includes('transfer_out') || t === 'transfer')
  const hasRedeem   = types.some((t) => t.includes('redeem') || t.includes('payout'))

  // Partners distintos — derivamos de campo `description`/`partner`/`merchant` se vier.
  const distinctPartners = new Set(
    txs
      .map((t) => (t as unknown as { partner_id?: string; merchant?: string }).partner_id || (t as unknown as { merchant?: string }).merchant || '')
      .filter(Boolean)
  ).size

  // Streak semana: aproximação — 7+ tx em 7 dias diferentes
  const distinctDays = new Set(
    txs
      .map((t) => (t.created_at || '').slice(0, 10))
      .filter(Boolean)
  ).size
  const streak = distinctDays >= 7

  // Indicações: backend não retorna esse contador hoje — heurística usa só
  // o cadastro mais antigo (proxy de "ativo há >X tempo"). Quando o backend
  // expuser referrals_count, substituímos aqui.
  const referralsCount = 0

  // tier_key conhecido: plus / prime / black / vip (string canônica do backend)
  const tier = cardTier.toLowerCase()
  const isPrime = tier === 'prime' || tier === 'black' || tier === 'vip'
  const isBlack = tier === 'black' || tier === 'vip'

  function make(key: BadgeKey, ok: boolean, p: number, hint: string): BadgeState {
    const def = BADGES.find((b) => b.key === key)!
    return { def, unlocked: ok, progress: ok ? 1 : Math.max(0, Math.min(1, p)), hint }
  }

  return [
    make('first-purchase', hasPurchase, hasPurchase ? 1 : 0, hasPurchase ? 'Conquistado' : 'Compre pontos pela primeira vez'),
    make('first-transfer', hasTransfer, hasTransfer ? 1 : 0, hasTransfer ? 'Conquistado' : 'Envie pontos pra outro BlaXx'),
    make('first-redeem',   hasRedeem,   hasRedeem   ? 1 : 0, hasRedeem   ? 'Conquistado' : 'Faça um resgate em PIX'),
    make('balance-1k',     lifetime >= 1_000,   pct(lifetime, 1_000),   lifetime >= 1_000   ? 'Conquistado' : `${Math.round(pct(lifetime, 1_000) * 100)}%`),
    make('balance-10k',    lifetime >= 10_000,  pct(lifetime, 10_000),  lifetime >= 10_000  ? 'Conquistado' : `${Math.round(pct(lifetime, 10_000) * 100)}%`),
    make('balance-100k',   lifetime >= 100_000, pct(lifetime, 100_000), lifetime >= 100_000 ? 'Conquistado' : `${Math.round(pct(lifetime, 100_000) * 100)}%`),
    make('partners-5',     distinctPartners >= 5, pct(distinctPartners, 5), distinctPartners >= 5 ? 'Conquistado' : `${distinctPartners}/5 parceiros`),
    make('streak-week',    streak, pct(distinctDays, 7), streak ? 'Conquistado' : `${distinctDays}/7 dias`),
    make('refer-1',        referralsCount >= 1, pct(referralsCount, 1), referralsCount >= 1 ? 'Conquistado' : 'Convide 1 amigo'),
    make('refer-5',        referralsCount >= 5, pct(referralsCount, 5), referralsCount >= 5 ? 'Conquistado' : `${referralsCount}/5 amigos`),
    make('tier-prime',     isPrime, isPrime ? 1 : 0, isPrime ? 'Conquistado' : 'Suba para o tier Prime'),
    make('tier-black',     isBlack, isBlack ? 1 : 0, isBlack ? 'Conquistado' : 'Suba para o tier Black'),
  ]
}
