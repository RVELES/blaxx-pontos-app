// Dashboard premium — "BlaXx Command Center".
// Patrimônio (REAL: /wallet), nível/progresso (REAL: /card), parceiros
// (REAL: /partners), campanhas (REAL: /campaigns), movimentações (REAL).
// Módulos sem fonte de dados (gráfico temporal, Exchange, Score, Oportunidade,
// Intelligence) são SHOWCASE ilustrativo, marcados "demo" — dados fictícios de
// homologação, nunca reais.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { Topbar } from '../components/Shell'
import {
  BlaxxAPI,
  Session,
  asTxArray,
  fmtBRL,
  fmtNumber,
  type Campaign,
  type CardState,
  type Partner,
  type Transaction,
  type Wallet,
} from '../lib/api-client'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const LIME = '#7CFF00'

// ─── helpers ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** Série pseudo-aleatória determinística que sobe até `end` (ilustrativa). */
function genSeries(n: number, end: number, startFactor: number): number[] {
  const out: number[] = []
  let v = end * startFactor
  let s = (n * 9301 + 49297) % 233280
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  for (let i = 0; i < n; i++) {
    const pull = (end - v) / (n - i)
    v = Math.max(end * 0.12, v + pull + (rnd() - 0.42) * end * 0.025)
    out.push(Math.round(v))
  }
  out[n - 1] = end
  return out
}

function pct(v: number): string {
  const sign = v >= 0 ? '+' : ''
  return sign + v.toFixed(1).replace('.', ',') + '%'
}

const PERIODS = [
  { k: '7D', n: 7, start: 0.96 },
  { k: '30D', n: 30, start: 0.84 },
  { k: '90D', n: 90, start: 0.68 },
  { k: '1Y', n: 12, start: 0.46 },
  { k: 'ALL', n: 24, start: 0.26 },
] as const

// Glow sob a linha do gráfico.
const glowPlugin = {
  id: 'limeGlow',
  beforeDatasetsDraw(chart: ChartJS) {
    const { ctx } = chart
    ctx.save()
    ctx.shadowColor = 'rgba(124,255,0,.45)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 7
  },
  afterDatasetsDraw(chart: ChartJS) {
    chart.ctx.restore()
  },
}

// ─── ícones inline (premium) ─────────────────────────────────────────────────

function Svg({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
const P = {
  cart: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  send: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5',
  redeem: 'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1012 10.125A2.625 2.625 0 0012 4.875zM12 10.125v10.875M3.75 9.75h16.5v1.5H3.75z',
  store: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z',
  bolt: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  spark: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z',
  trophy: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0',
  globe: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
  arrowR: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3',
}

// ─── animação ────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.05, ease: EASE },
  }),
}

// ─── gráfico de patrimônio (showcase) ────────────────────────────────────────

function PatrimonioChart({ end }: { end: number }) {
  const [pk, setPk] = useState<(typeof PERIODS)[number]['k']>('30D')
  const cfg = PERIODS.find((p) => p.k === pk)!
  const series = useMemo(() => genSeries(cfg.n, end, cfg.start), [cfg, end])

  const data = {
    labels: series.map((_, i) => String(i + 1)),
    datasets: [
      {
        data: series,
        borderColor: LIME,
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: LIME,
        pointHoverBorderColor: '#0A0D12',
        pointHoverBorderWidth: 2,
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const { ctx: c, chartArea } = ctx.chart
          if (!chartArea) return 'rgba(124,255,0,.14)'
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          g.addColorStop(0, 'rgba(124,255,0,.34)')
          g.addColorStop(0.55, 'rgba(124,255,0,.08)')
          g.addColorStop(1, 'rgba(124,255,0,0)')
          return g
        },
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10,13,18,.96)',
        borderColor: 'rgba(124,255,0,.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: false,
        titleColor: '#9CA3AF',
        bodyColor: '#fff',
        bodyFont: { weight: 700 as const, size: 14 },
        callbacks: {
          title: () => '',
          label: (c: { parsed: { y: number | null } }) => fmtNumber(c.parsed.y ?? 0) + ' pts',
        },
      },
    },
    scales: {
      x: { display: false, grid: { display: false } },
      y: { display: false, grid: { display: false }, beginAtZero: false },
    },
  }

  return (
    <div className="dx-chart-wrap">
      <div className="dx-chart-head">
        <div className="dx-chart-title">
          Evolução do patrimônio <span className="dx-demo">demo</span>
        </div>
        <div className="dx-periods">
          {PERIODS.map((p) => (
            <button
              key={p.k}
              className={'dx-period' + (p.k === pk ? ' on' : '')}
              onClick={() => setPk(p.k)}
            >
              {p.k}
            </button>
          ))}
        </div>
      </div>
      <div className="dx-chart">
        <Line data={data} options={options} plugins={[glowPlugin]} />
      </div>
    </div>
  )
}

// ─── countdown (oportunidade) ────────────────────────────────────────────────

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target - now)
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const pad = (x: number) => String(x).padStart(2, '0')
  return { d, h: pad(h), m: pad(m), s: pad(s) }
}

// ─── dados ilustrativos (homologação · fictícios) ────────────────────────────

const EXCHANGE = [
  { code: 'SM', name: 'Smiles', cls: 'g1', buy: '0,0210', sell: '0,0240', spread: '12,5%', vol: '1,2M', chg: 3.2 },
  { code: 'LV', name: 'Livelo', cls: 'g2', buy: '0,0340', sell: '0,0370', spread: '8,1%', vol: '2,8M', chg: 1.4 },
  { code: 'AZ', name: 'TudoAzul', cls: 'g3', buy: '0,0190', sell: '0,0220', spread: '13,6%', vol: '860K', chg: -0.8 },
  { code: 'LA', name: 'Latam Pass', cls: 'g4', buy: '0,0230', sell: '0,0260', spread: '11,5%', vol: '1,9M', chg: 2.1 },
  { code: 'TP', name: 'TAP Miles&Go', cls: 'g5', buy: '0,0280', sell: '0,0320', spread: '12,5%', vol: '540K', chg: -1.1 },
  { code: 'AA', name: 'AAdvantage', cls: 'g6', buy: '0,0410', sell: '0,0460', spread: '10,9%', vol: '430K', chg: 4.6 },
]

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [card, setCard] = useState<CardState | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [w, c, p, cm, t] = await Promise.allSettled([
        BlaxxAPI.wallet(),
        BlaxxAPI.card(),
        BlaxxAPI.partners(),
        BlaxxAPI.campaigns(),
        BlaxxAPI.transactions(6),
      ])
      if (!alive) return
      if (w.status === 'fulfilled') setWallet(w.value)
      if (c.status === 'fulfilled') setCard(c.value)
      if (p.status === 'fulfilled') setPartners((p.value.items || []).slice(0, 4))
      if (cm.status === 'fulfilled') setCampaigns((cm.value.items || []).slice(0, 3))
      if (t.status === 'fulfilled') setTxs(asTxArray(t.value).slice(0, 6))
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [])

  const user = Session.user()
  const firstName = (user?.name || '').split(' ')[0] || 'Cliente'

  const balancePts = wallet?.balance_pts ?? 0
  const balanceBrl = wallet?.balance_brl_equiv ?? 0
  const pendingPts = wallet?.pending_pts ?? 0
  const tier = card?.tier
  const nextTier = card?.next_tier
  const progress = card?.progress_pct ?? 0
  const toNext = card?.points_to_next ?? 0
  const lifetime = card?.lifetime_points ?? 0

  // valor de referência p/ a curva (placeholder enquanto carrega)
  const chartEnd = balancePts || 16888

  // variação 30 dias (derivada da curva ilustrativa)
  const var30 = useMemo(() => {
    const s = genSeries(30, chartEnd, 0.84)
    return ((s[s.length - 1] - s[0]) / s[0]) * 100
  }, [chartEnd])

  const cd = useCountdown(useMemo(() => Date.now() + (2 * 86400 + 14 * 3600 + 22 * 60) * 1000, []))

  const topPartner = partners[0]

  return (
    <div className="dx">
      {/* limpa o cabeçalho de página — o hero carrega a saudação */}
      <Topbar eyebrow="" title="" />

      {/* ============ HERO ============ */}
      <motion.section className="dx-hero" variants={reveal} initial="hidden" animate="show" custom={0}>
        <div className="dx-hero-glow" />
        <div className="dx-hero-grid">
          {/* PATRIMÔNIO */}
          <div className="dx-patri">
            <div className="dx-greet">{greeting()}, {firstName}.</div>
            <div className="dx-eyebrow">Patrimônio BlaXx</div>
            <div className="dx-balance">
              {loading ? '—' : fmtNumber(balancePts)} <span>pts</span>
            </div>
            <div className="dx-equiv">≈ {loading ? 'R$ —' : fmtBRL(balanceBrl)}</div>
            <div className="dx-var">
              <span className={'dx-var-pill ' + (var30 >= 0 ? 'up' : 'down')}>
                {var30 >= 0 ? '▲' : '▼'} {pct(var30)}
              </span>
              <span className="dx-var-cap">últimos 30 dias</span>
            </div>
            <div className="dx-mini-stats">
              <div>
                <small>Em processamento</small>
                <b>{fmtNumber(pendingPts)} pts</b>
              </div>
              <div>
                <small>Acumulado total</small>
                <b>{fmtNumber(lifetime || balancePts)} pts</b>
              </div>
            </div>
          </div>

          {/* NÍVEL / PROGRESSO (Amex-style) */}
          <div className="dx-level">
            <div className="dx-level-card" style={tier ? { background: tier.color, color: tier.text_color } : undefined}>
              <div className="dx-level-row">
                <span className="dx-level-chip">NÍVEL</span>
                <Svg d={P.trophy} size={20} />
              </div>
              <div className="dx-level-name">{tier ? tier.label.toUpperCase() : '—'}</div>
              <div className="dx-level-sub">{tier?.perks || 'Programa de fidelidade BlaXx'}</div>
            </div>
            <div className="dx-prog">
              <div className="dx-prog-head">
                <span>{nextTier ? `Progresso para ${nextTier.label}` : 'Nível máximo'}</span>
                <b>{progress}%</b>
              </div>
              <div className="dx-prog-track">
                <motion.div
                  className="dx-prog-fill"
                  initial={{ width: 0 }}
                  animate={{ width: progress + '%' }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
                />
              </div>
              <div className="dx-prog-foot">
                {nextTier ? (
                  <>Faltam <b>{fmtNumber(toNext)} pts</b> para {nextTier.label}</>
                ) : (
                  'Você atingiu o nível máximo do programa.'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICO */}
        <PatrimonioChart end={chartEnd} />
      </motion.section>

      {/* ============ CTAs ============ */}
      <motion.div className="dx-ctas" variants={reveal} initial="hidden" animate="show" custom={1}>
        {[
          { d: P.cart, t: 'Comprar Pontos', s: 'Recarregue via PIX', to: '/comprar-pontos', primary: true },
          { d: P.send, t: 'Transferir', s: 'Envie sem taxa', to: '/enviar-pontos' },
          { d: P.redeem, t: 'Resgatar', s: 'Converta em cashback', to: '/vender-pontos' },
          { d: P.store, t: 'Marketplace', s: 'Parceiros & ofertas', to: '/parceiros' },
        ].map((c) => (
          <motion.button
            key={c.t}
            className={'dx-cta' + (c.primary ? ' primary' : '')}
            onClick={() => navigate(c.to)}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="dx-cta-ic"><Svg d={c.d} size={24} /></span>
            <span className="dx-cta-t">{c.t}</span>
            <span className="dx-cta-s">{c.s}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* ============ OPORTUNIDADE EXCLUSIVA ============ */}
      <motion.section className="dx-opp" variants={reveal} initial="hidden" animate="show" custom={2}>
        <div className="dx-opp-glow" />
        <span className="dx-demo abs">demo</span>
        <div className="dx-opp-body">
          <div className="dx-opp-tag"><Svg d={P.bolt} size={14} /> OPORTUNIDADE EXCLUSIVA</div>
          <h2 className="dx-opp-title">Smiles · Bônus de <span>85%</span></h2>
          <p className="dx-opp-desc">
            Transfira pontos para a Smiles com bônus turbo. Janela limitada — estimativa de
            valorização do seu patrimônio em milhas.
          </p>
          <div className="dx-opp-metrics">
            <div><small>ROI estimado</small><b className="up">+38,4%</b></div>
            <div><small>Potencial de ganho</small><b className="lime">+122.000 pts</b></div>
            <div><small>Encerra em</small><b className="mono">{cd.d}d {cd.h}:{cd.m}:{cd.s}</b></div>
          </div>
          <button className="dx-opp-cta" onClick={() => navigate('/exchange')}>
            Aproveitar oportunidade <Svg d={P.arrowR} size={18} />
          </button>
        </div>
        <div className="dx-opp-coin">
          <div className="dx-coin-3d">
            <span>B</span>
          </div>
        </div>
      </motion.section>

      {/* ============ GRID PRINCIPAL ============ */}
      <div className="dx-cols">
        {/* COLUNA ESQUERDA */}
        <div className="dx-col">
          {/* EXCHANGE (trading desk) */}
          <motion.section className="dx-card dx-exch" variants={reveal} initial="hidden" animate="show" custom={3}>
            <div className="dx-card-head">
              <div className="dx-card-title">
                BlaXx Exchange <span className="dx-demo">demo</span>
              </div>
              <span className="dx-live"><i /> mercado simulado</span>
            </div>
            <div className="dx-exch-scroll">
              <table className="dx-exch-tbl">
                <thead>
                  <tr>
                    <th>Ativo</th><th>Compra</th><th>Venda</th><th>Spread</th><th>Volume</th><th>24h</th>
                  </tr>
                </thead>
                <tbody>
                  {EXCHANGE.map((e) => (
                    <tr key={e.code} onClick={() => navigate('/exchange')}>
                      <td>
                        <div className="dx-asset">
                          <span className={'dx-asset-ic ' + e.cls}>{e.code}</span>
                          <b>{e.name}</b>
                        </div>
                      </td>
                      <td className="mono">{e.buy}</td>
                      <td className="mono">{e.sell}</td>
                      <td className="mono dim">{e.spread}</td>
                      <td className="mono dim">{e.vol}</td>
                      <td className={'mono ' + (e.chg >= 0 ? 'up' : 'down')}>
                        {e.chg >= 0 ? '▲' : '▼'} {pct(e.chg)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* MARKETPLACE (App Store style) */}
          <motion.section className="dx-card dx-mkt" variants={reveal} initial="hidden" animate="show" custom={4}>
            <div className="dx-card-head">
              <div className="dx-card-title">Marketplace de parceiros</div>
              <a className="dx-see" onClick={() => navigate('/parceiros')}>Ver tudo →</a>
            </div>
            {partners.length === 0 ? (
              <p className="dx-muted">Carregando parceiros…</p>
            ) : (
              <div className="dx-mkt-grid">
                {partners.map((p, i) => (
                  <motion.button
                    key={p.id}
                    className="dx-mkt-card"
                    whileHover={{ y: -4 }}
                    onClick={() => navigate('/detalhe-parceiro?id=' + encodeURIComponent(p.id))}
                  >
                    <div className="dx-mkt-top">
                      <span className="dx-mkt-logo">{p.logo_emoji || '🎁'}</span>
                      <span className="dx-mkt-cat">{p.category}</span>
                    </div>
                    <div className="dx-mkt-name">{p.name}</div>
                    <div className="dx-mkt-rule">{p.accrual_rule || 'Acumule pontos BlaXx'}</div>
                    <div className="dx-mkt-foot">
                      <span className="dx-stars">{'★★★★★'.slice(0, 5)}</span>
                      <span className="dx-rating">{(4.6 + (i % 3) * 0.1).toFixed(1).replace('.', ',')}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.section>
        </div>

        {/* COLUNA DIREITA */}
        <div className="dx-col">
          {/* SCORE BLAXX */}
          <motion.section className="dx-card dx-score" variants={reveal} initial="hidden" animate="show" custom={3}>
            <span className="dx-demo abs">demo</span>
            <div className="dx-card-title">Score BlaXx</div>
            <div className="dx-gauge">
              <div className="dx-gauge-ring">
                <div className="dx-gauge-inner">
                  <b>8.9</b>
                  <small>/ 10</small>
                </div>
              </div>
            </div>
            <div className="dx-score-tag">Elite</div>
            <div className="dx-score-stats">
              <div><small>Média do mercado</small><b>6.4</b></div>
              <div><small>Seu ranking</small><b>#1.284</b></div>
              <div><small>Percentil</small><b className="lime">Top 8%</b></div>
            </div>
          </motion.section>

          {/* INTELLIGENCE CENTER */}
          <motion.section className="dx-card dx-intel" variants={reveal} initial="hidden" animate="show" custom={4}>
            <span className="dx-demo abs">demo</span>
            <div className="dx-card-title">
              <Svg d={P.spark} size={16} /> Intelligence Center
            </div>
            <p className="dx-muted dx-intel-sub">Insights automáticos para maximizar seu patrimônio.</p>
            {[
              { ic: P.bolt, t: 'Melhor arbitragem', v: 'Livelo → Smiles', s: 'Spread favorável +42%' },
              { ic: P.send, t: 'Melhor transferência', v: 'Smiles +85%', s: 'Janela: 48 horas' },
              { ic: P.store, t: 'Melhor cashback', v: 'Magalu · 12%', s: 'Em pontos BlaXx' },
              { ic: P.shield, t: 'Melhor cartão', v: 'BlaXx Black', s: '4 pts por R$ gasto' },
              { ic: P.globe, t: 'Melhor parceiro', v: topPartner?.name || 'Latam Travel', s: 'Alta conversão' },
            ].map((it) => (
              <div className="dx-insight" key={it.t}>
                <span className="dx-insight-ic"><Svg d={it.ic} size={16} /></span>
                <div className="dx-insight-body">
                  <small>{it.t}</small>
                  <b>{it.v}</b>
                </div>
                <span className="dx-insight-sub">{it.s}</span>
              </div>
            ))}
            <div className="dx-econ">
              <span>Economia estimada no mês</span>
              <b className="lime">{fmtBRL(312)}</b>
            </div>
          </motion.section>
        </div>
      </div>

      {/* ============ BOTTOM: campanhas + movimentações ============ */}
      <div className="dx-bottom">
        <motion.section className="dx-card" variants={reveal} initial="hidden" animate="show" custom={5}>
          <div className="dx-card-head">
            <div className="dx-card-title">Campanhas ativas</div>
            <a className="dx-see" onClick={() => navigate('/campanhas')}>Ver todas →</a>
          </div>
          {campaigns.length === 0 ? (
            <p className="dx-muted">Nenhuma campanha ativa no momento.</p>
          ) : (
            <div className="dx-list">
              {campaigns.map((c) => (
                <div className="dx-row" key={c.id} onClick={() => navigate('/campanhas')}>
                  <span className="dx-row-ic"><Svg d={P.bolt} size={18} /></span>
                  <div className="dx-row-body">
                    <b>{c.name}</b>
                    <small>{c.description || c.mechanic || 'Campanha ativa'}</small>
                  </div>
                  <span className="dx-row-meta lime">+{fmtNumber(c.reward_pts)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section className="dx-card" variants={reveal} initial="hidden" animate="show" custom={6}>
          <div className="dx-card-head">
            <div className="dx-card-title">Últimas movimentações</div>
            <a className="dx-see" onClick={() => navigate('/extrato')}>Ver extrato →</a>
          </div>
          {loading ? (
            <p className="dx-muted">Carregando…</p>
          ) : txs.length === 0 ? (
            <p className="dx-muted">Nenhuma movimentação ainda.</p>
          ) : (
            <div className="dx-list">
              {txs.slice(0, 5).map((t) => (
                <div className="dx-row" key={t.id}>
                  <span className={'dx-row-ic ' + (t.amount_pts > 0 ? 'pos' : 'neg')}>
                    {t.amount_pts > 0 ? '↘' : '↗'}
                  </span>
                  <div className="dx-row-body">
                    <b>{t.description || t.type}</b>
                    <small>{t.type}</small>
                  </div>
                  <span className={'dx-row-meta ' + (t.amount_pts > 0 ? 'up' : 'down')}>
                    {t.amount_pts > 0 ? '+' : ''}{fmtNumber(t.amount_pts)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      <p className="dx-disc">
        Pontos são créditos promocionais — não são moeda, depósito ou investimento. Ambiente de
        homologação: dados são fictícios. Módulos marcados “demo” (gráfico temporal, Exchange, Score,
        Oportunidade, Intelligence) são ilustrativos e ainda não refletem dados reais.
      </p>

      <style>{CSS}</style>
    </div>
  )
}

// ─── estilos ─────────────────────────────────────────────────────────────────

const CSS = `
.dx { --lime:${LIME}; --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14);
  --srf:#0A0D12; --srf2:#121722; --muted:#9CA3AF; --dim:#6B7280; }
.dx a { cursor:pointer; }
.dx .mono { font-family:var(--font-mono); }
.dx .lime { color:var(--lime); }
.dx .up { color:#00FF88; } .dx .down { color:#FF4D4D; }
.dx-muted { color:var(--muted); }
.dx-demo { font-size:9px; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
  color:var(--lime); background:rgba(124,255,0,.1); border:1px solid rgba(124,255,0,.3);
  padding:2px 7px; border-radius:999px; vertical-align:middle; }
.dx-demo.abs { position:absolute; top:16px; right:16px; z-index:4; }

.dx-card { position:relative; background:var(--srf); border:1px solid var(--line);
  border-radius:22px; padding:22px; box-shadow:var(--shadow); }
.dx-card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.dx-card-title { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:800;
  font-family:var(--font-body); letter-spacing:-.01em; color:#fff; }
.dx-card-title svg { color:var(--lime); }
.dx-see { color:var(--muted); font-weight:700; font-size:13px; transition:color .15s; }
.dx-see:hover { color:var(--lime); }

/* ── HERO ── */
.dx-hero { position:relative; overflow:hidden; border-radius:26px; padding:30px;
  background:linear-gradient(150deg,#0B0F14,#070A0E 60%); border:1px solid var(--line);
  box-shadow:var(--shadow-lg); }
.dx-hero-glow { position:absolute; top:-120px; right:-80px; width:380px; height:380px; pointer-events:none;
  background:radial-gradient(circle, rgba(124,255,0,.22), transparent 62%); filter:blur(8px); }
.dx-hero-grid { position:relative; display:grid; grid-template-columns:1.35fr 1fr; gap:26px; }
.dx-greet { color:var(--muted); font-size:14px; font-weight:600; margin-bottom:14px; }
.dx-eyebrow { font-size:11px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--lime); }
.dx-balance { font-size:54px; font-weight:900; letter-spacing:-2.5px; line-height:1; margin:8px 0 6px; color:#fff; }
.dx-balance span { font-size:18px; font-weight:700; color:var(--muted); letter-spacing:0; }
.dx-equiv { font-size:22px; font-weight:800; color:var(--lime); }
.dx-var { display:flex; align-items:center; gap:10px; margin-top:14px; }
.dx-var-pill { display:inline-flex; align-items:center; gap:5px; font-weight:800; font-size:13px;
  padding:5px 11px; border-radius:999px; }
.dx-var-pill.up { color:#00FF88; background:rgba(0,255,136,.12); }
.dx-var-pill.down { color:#FF4D4D; background:rgba(255,77,77,.12); }
.dx-var-cap { color:var(--dim); font-size:12px; font-weight:600; }
.dx-mini-stats { display:flex; gap:26px; margin-top:22px; }
.dx-mini-stats small { display:block; color:var(--dim); font-size:11px; font-weight:600; letter-spacing:.04em; }
.dx-mini-stats b { font-size:16px; font-weight:800; color:#fff; }

.dx-level { display:flex; flex-direction:column; gap:14px; }
.dx-level-card { border-radius:18px; padding:18px; color:#fff; min-height:118px;
  background:radial-gradient(circle at 82% 20%, rgba(255,255,255,.14), transparent 40%), linear-gradient(135deg,#1c2128,#0a0d12);
  border:1px solid var(--line2); box-shadow:inset 0 1px 0 rgba(255,255,255,.08); }
.dx-level-row { display:flex; align-items:center; justify-content:space-between; opacity:.85; }
.dx-level-chip { font-size:10px; font-weight:800; letter-spacing:.18em; }
.dx-level-name { font-size:30px; font-weight:900; letter-spacing:-1px; margin-top:14px; line-height:1; }
.dx-level-sub { font-size:12px; opacity:.8; margin-top:6px; }
.dx-prog { background:rgba(255,255,255,.03); border:1px solid var(--line); border-radius:16px; padding:15px 16px; }
.dx-prog-head { display:flex; align-items:center; justify-content:space-between; font-size:13px; color:var(--muted); font-weight:600; }
.dx-prog-head b { color:#fff; font-size:15px; font-weight:800; }
.dx-prog-track { height:9px; border-radius:999px; background:rgba(255,255,255,.08); overflow:hidden; margin:10px 0 9px; }
.dx-prog-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#7CFF00,#7CFF00);
  box-shadow:0 0 12px rgba(124,255,0,.6); }
.dx-prog-foot { font-size:12px; color:var(--muted); }
.dx-prog-foot b { color:#fff; }

/* ── CHART ── */
.dx-chart-wrap { margin-top:22px; border-top:1px solid var(--line); padding-top:18px; }
.dx-chart-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.dx-chart-title { font-size:13px; font-weight:700; color:var(--muted); display:flex; gap:8px; align-items:center; }
.dx-periods { display:flex; gap:4px; background:rgba(255,255,255,.04); border:1px solid var(--line);
  border-radius:11px; padding:3px; }
.dx-period { border:0; background:transparent; color:var(--muted); font-weight:700; font-size:12px;
  padding:6px 11px; border-radius:8px; cursor:pointer; transition:all .15s; }
.dx-period:hover { color:#fff; }
.dx-period.on { background:var(--lime); color:#0A0D12; }
.dx-chart { height:200px; position:relative; }

/* ── CTAs ── */
.dx-ctas { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:18px; }
.dx-cta { display:flex; flex-direction:column; align-items:flex-start; gap:4px; text-align:left;
  padding:20px; border-radius:20px; cursor:pointer; background:var(--srf); border:1px solid var(--line);
  transition:border-color .2s, box-shadow .2s, background .2s; }
.dx-cta:hover { border-color:rgba(124,255,0,.4); box-shadow:var(--glow-lime); background:var(--srf2); }
.dx-cta-ic { width:48px; height:48px; border-radius:14px; display:grid; place-items:center; margin-bottom:8px;
  background:rgba(124,255,0,.1); color:var(--lime); border:1px solid rgba(124,255,0,.22); }
.dx-cta.primary { background:linear-gradient(135deg, rgba(124,255,0,.16), rgba(124,255,0,.04));
  border-color:rgba(124,255,0,.4); }
.dx-cta.primary .dx-cta-ic { background:var(--lime); color:#0A0D12; border-color:transparent; }
.dx-cta-t { font-size:16px; font-weight:800; color:#fff; }
.dx-cta-s { font-size:12px; color:var(--muted); }

/* ── OPORTUNIDADE ── */
.dx-opp { position:relative; overflow:hidden; margin-top:18px; border-radius:24px; padding:30px;
  display:grid; grid-template-columns:1fr auto; align-items:center; gap:20px;
  background:linear-gradient(120deg,#08120b,#0a0d12 55%,#0d1410);
  border:1px solid rgba(0,255,136,.22); box-shadow:0 24px 60px rgba(0,0,0,.5), 0 0 50px rgba(0,255,136,.08); }
.dx-opp-glow { position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(circle at 78% 50%, rgba(0,255,136,.18), transparent 45%); }
.dx-opp-body { position:relative; z-index:2; max-width:640px; }
.dx-opp-tag { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:800;
  letter-spacing:.14em; color:#00FF88; background:rgba(0,255,136,.12); border:1px solid rgba(0,255,136,.3);
  padding:5px 12px; border-radius:999px; }
.dx-opp-title { font-size:32px; font-weight:900; letter-spacing:-1px; margin:14px 0 8px; color:#fff; }
.dx-opp-title span { color:#00FF88; }
.dx-opp-desc { color:var(--muted); font-size:14px; max-width:520px; margin:0 0 18px; }
.dx-opp-metrics { display:flex; gap:30px; margin-bottom:20px; flex-wrap:wrap; }
.dx-opp-metrics small { display:block; color:var(--dim); font-size:11px; font-weight:600; letter-spacing:.04em; }
.dx-opp-metrics b { font-size:20px; font-weight:900; letter-spacing:-.5px; }
.dx-opp-metrics b.mono { font-size:18px; }
.dx-opp-cta { display:inline-flex; align-items:center; gap:8px; border:0; cursor:pointer;
  background:linear-gradient(135deg,#7CFF00,#7CFF00); color:#08130a; font-weight:900; font-size:14px;
  padding:14px 24px; border-radius:14px; transition:transform .15s, box-shadow .15s; }
.dx-opp-cta:hover { transform:translateY(-2px); box-shadow:0 12px 30px rgba(124,255,0,.35); }
.dx-opp-coin { position:relative; z-index:2; }
.dx-coin-3d { width:130px; height:130px; border-radius:50%; display:grid; place-items:center;
  font-family:var(--font-display); font-size:60px; font-weight:900; color:#08130a;
  background:radial-gradient(circle at 32% 28%, #E6FF7A, #7CFF00 45%, #6db000 100%);
  box-shadow:0 18px 50px rgba(124,255,0,.45), inset 0 6px 14px rgba(255,255,255,.5), inset 0 -10px 18px rgba(0,0,0,.3);
  transform:rotate(-12deg); animation:dx-float 4s ease-in-out infinite; }
@keyframes dx-float { 0%,100%{transform:translateY(0) rotate(-12deg);} 50%{transform:translateY(-10px) rotate(-8deg);} }

/* ── GRID ── */
.dx-cols { display:grid; grid-template-columns:1.5fr 1fr; gap:18px; margin-top:18px; }
.dx-col { display:flex; flex-direction:column; gap:18px; }

/* ── EXCHANGE ── */
.dx-live { display:inline-flex; align-items:center; gap:6px; color:var(--muted); font-size:12px; font-weight:600; }
.dx-live i { width:7px; height:7px; border-radius:50%; background:#00FF88; box-shadow:0 0 8px #00FF88;
  animation:dx-pulse 1.6s ease-in-out infinite; }
@keyframes dx-pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }
.dx-exch-scroll { overflow-x:auto; }
.dx-exch-tbl { width:100%; border-collapse:collapse; }
.dx-exch-tbl th { text-align:right; font-size:10px; letter-spacing:.1em; text-transform:uppercase;
  color:var(--dim); font-weight:700; padding:0 0 10px; }
.dx-exch-tbl th:first-child { text-align:left; }
.dx-exch-tbl td { text-align:right; padding:11px 0; border-top:1px solid var(--line); font-size:13px; font-weight:700; color:#fff; }
.dx-exch-tbl tbody tr { cursor:pointer; transition:background .15s; }
.dx-exch-tbl tbody tr:hover td { background:rgba(255,255,255,.02); }
.dx-exch-tbl td:first-child { text-align:left; }
.dx-exch-tbl td.dim { color:var(--muted); font-weight:600; }
.dx-asset { display:flex; align-items:center; gap:10px; }
.dx-asset-ic { width:30px; height:30px; border-radius:9px; display:grid; place-items:center; font-size:11px;
  font-weight:900; color:#0A0D12; }
.dx-asset-ic.g1 { background:linear-gradient(135deg,#FF7A00,#FFB347); }
.dx-asset-ic.g2 { background:linear-gradient(135deg,#FF2D8E,#FF7AC0); }
.dx-asset-ic.g3 { background:linear-gradient(135deg,#00B4FF,#7AD9FF); }
.dx-asset-ic.g4 { background:linear-gradient(135deg,#E10600,#FF6B66); }
.dx-asset-ic.g5 { background:linear-gradient(135deg,#00C46A,#5BE8A0); }
.dx-asset-ic.g6 { background:linear-gradient(135deg,#9B59FF,#C79BFF); }

/* ── MARKETPLACE ── */
.dx-mkt-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.dx-mkt-card { text-align:left; cursor:pointer; padding:16px; border-radius:18px;
  background:rgba(255,255,255,.025); border:1px solid var(--line); transition:border-color .2s, background .2s; }
.dx-mkt-card:hover { border-color:rgba(124,255,0,.35); background:var(--srf2); }
.dx-mkt-top { display:flex; align-items:center; justify-content:space-between; }
.dx-mkt-logo { font-size:30px; }
.dx-mkt-cat { font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
  color:var(--muted); background:rgba(255,255,255,.05); padding:3px 8px; border-radius:999px; }
.dx-mkt-name { font-size:15px; font-weight:800; color:#fff; margin-top:12px; }
.dx-mkt-rule { font-size:12px; color:var(--lime); font-weight:700; margin-top:3px; }
.dx-mkt-foot { display:flex; align-items:center; gap:6px; margin-top:12px; }
.dx-stars { color:var(--gold,#FFD700); font-size:12px; letter-spacing:1px; }
.dx-rating { color:var(--muted); font-size:12px; font-weight:700; }

/* ── SCORE ── */
.dx-score { text-align:center; }
.dx-gauge { display:grid; place-items:center; margin:14px 0 6px; }
.dx-gauge-ring { width:168px; height:168px; border-radius:50%; display:grid; place-items:center;
  background:conic-gradient(#7CFF00 0 89%, rgba(124,255,0,.14) 89% 100%);
  box-shadow:0 0 40px rgba(124,255,0,.22); }
.dx-gauge-inner { width:128px; height:128px; border-radius:50%; background:#0A0D12; display:flex;
  flex-direction:column; align-items:center; justify-content:center; gap:2px; border:1px solid var(--line); }
.dx-gauge-inner b { font-size:46px; font-weight:900; letter-spacing:-2px; color:#fff; line-height:1; }
.dx-gauge-inner small { color:var(--muted); font-size:13px; font-weight:700; }
.dx-score-tag { display:inline-block; font-weight:900; letter-spacing:.1em; color:var(--lime);
  background:rgba(124,255,0,.1); border:1px solid rgba(124,255,0,.3); padding:5px 16px; border-radius:999px; }
.dx-score-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:18px;
  border-top:1px solid var(--line); padding-top:16px; }
.dx-score-stats small { display:block; color:var(--dim); font-size:11px; font-weight:600; }
.dx-score-stats b { font-size:17px; font-weight:900; color:#fff; }

/* ── INTELLIGENCE ── */
.dx-intel-sub { font-size:12.5px; margin:-6px 0 14px; }
.dx-insight { display:flex; align-items:center; gap:12px; padding:11px 0; border-top:1px solid var(--line); }
.dx-insight:first-of-type { border-top:0; }
.dx-insight-ic { width:34px; height:34px; flex-shrink:0; border-radius:10px; display:grid; place-items:center;
  color:var(--lime); background:rgba(124,255,0,.08); border:1px solid rgba(124,255,0,.2); }
.dx-insight-body { flex:1; min-width:0; }
.dx-insight-body small { display:block; color:var(--dim); font-size:11px; font-weight:600; }
.dx-insight-body b { font-size:14px; font-weight:800; color:#fff; }
.dx-insight-sub { font-size:11px; color:var(--muted); text-align:right; font-weight:600; max-width:110px; }
.dx-econ { display:flex; align-items:center; justify-content:space-between; margin-top:14px; padding:14px 16px;
  border-radius:14px; background:rgba(0,255,136,.06); border:1px solid rgba(0,255,136,.2); }
.dx-econ span { color:var(--muted); font-size:13px; font-weight:600; }
.dx-econ b { font-size:20px; font-weight:900; letter-spacing:-.5px; }

/* ── BOTTOM ── */
.dx-bottom { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:18px; }
.dx-list { display:flex; flex-direction:column; }
.dx-row { display:flex; align-items:center; gap:13px; padding:12px 6px; border-radius:12px; cursor:pointer;
  transition:background .15s; }
.dx-row:hover { background:rgba(255,255,255,.03); }
.dx-row-ic { width:40px; height:40px; flex-shrink:0; border-radius:12px; display:grid; place-items:center;
  font-size:18px; color:var(--lime); background:rgba(124,255,0,.08); border:1px solid rgba(124,255,0,.18); }
.dx-row-ic.pos { color:#00FF88; background:rgba(0,255,136,.08); border-color:rgba(0,255,136,.2); }
.dx-row-ic.neg { color:#FF4D4D; background:rgba(255,77,77,.08); border-color:rgba(255,77,77,.2); }
.dx-row-body { flex:1; min-width:0; }
.dx-row-body b { display:block; font-size:14px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dx-row-body small { color:var(--muted); font-size:12px; }
.dx-row-meta { font-weight:900; font-size:14px; white-space:nowrap; }

.dx-disc { color:var(--dim); font-size:11.5px; line-height:1.6; margin:24px 2px 0; }

/* ── responsivo ── */
@media (max-width:1100px) {
  .dx-cols { grid-template-columns:1fr; }
  .dx-hero-grid { grid-template-columns:1fr; }
}
@media (max-width:760px) {
  .dx-ctas { grid-template-columns:1fr 1fr; }
  .dx-bottom { grid-template-columns:1fr; }
  .dx-balance { font-size:42px; }
  .dx-opp { grid-template-columns:1fr; }
  .dx-opp-coin { display:none; }
  .dx-mkt-grid { grid-template-columns:1fr; }
}
`
