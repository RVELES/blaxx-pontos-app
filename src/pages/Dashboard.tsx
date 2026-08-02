// Dashboard premium — "BlaXx Command Center".
// Patrimônio (REAL: /wallet), nível/progresso (REAL: /card), parceiros
// (REAL: /partners), campanhas (REAL: /campaigns), movimentações (REAL).
// Todos os módulos desta tela consomem dados REAIS. Os que não tinham fonte
// foram removidos (gráfico gerado por genSeries, Exchange, Wealth Score,
// Intelligence Center) ou religados: a Oportunidade agora mostra a campanha
// ativa de maior recompensa e some quando não há campanha.
// Regra: nada de número inventado nesta tela — os selos "demo" que antes os
// identificavam foram retirados, então o dado precisa ser verdadeiro.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { Topbar } from '../components/Shell'
import PointsEquivalence from '../components/PointsEquivalence'
import BlaxxScore from '../components/BlaxxScore'
import { usePullToRefresh, PullToRefreshIndicator } from '../lib/use-pull-to-refresh'
import { evaluate as evalBadges } from '../lib/badges'
import {
  BlaxxAPI,
  Session,
  asTxArray,
  fmtNumber,
  type Campaign,
  type CardState,
  type Partner,
  type Transaction,
  type Wallet,
} from '../lib/api-client'

const LIME = '#59FD27'

// ─── helpers ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
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

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [card, setCard] = useState<CardState | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Carrega tudo em paralelo. Extraído pra reusar em pull-to-refresh.
  async function loadAll(silent = false) {
    if (!silent) setLoading(true)
    const [w, c, p, cm, t] = await Promise.allSettled([
      BlaxxAPI.wallet(),
      BlaxxAPI.card(),
      BlaxxAPI.partners(),
      BlaxxAPI.campaigns(),
      BlaxxAPI.transactions(6),
    ])
    if (w.status === 'fulfilled') setWallet(w.value)
    if (c.status === 'fulfilled') setCard(c.value)
    if (p.status === 'fulfilled') setPartners((p.value.items || []).slice(0, 4))
    if (cm.status === 'fulfilled') setCampaigns((cm.value.items || []).slice(0, 3))
    if (t.status === 'fulfilled') setTxs(asTxArray(t.value).slice(0, 6))
    if (!silent) setLoading(false)
  }
  useEffect(() => {
    let alive = true
    ;(async () => {
      await loadAll()
      if (!alive) return
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Pull-to-refresh — só ativa em mobile. Silent: não pisca skeletons.
  const ptr = usePullToRefresh(() => loadAll(true))

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
  // Entradas reais dos últimos 30 dias (extrato), no lugar da variação que
  // vinha da curva ilustrativa.
  const entradas30 = useMemo(() => {
    const corte = Date.now() - 30 * 86400000
    return txs
      .filter((t) => Number(t.amount_pts) > 0 && new Date(t.created_at).getTime() >= corte)
      .reduce((acc, t) => acc + Number(t.amount_pts), 0)
  }, [txs])


  // Campanha ativa de maior recompensa — alimenta o bloco de Oportunidade.
  const campanhaTop = useMemo(
    () => campaigns.filter((c) => c && c.name)
                   .slice()
                   .sort((a, b) => Number(b.reward_pts || 0) - Number(a.reward_pts || 0))[0],
    [campaigns],
  )

  return (
    <div className="dx">
      {/* limpa o cabeçalho de página — o hero carrega a saudação */}
      <Topbar eyebrow="" title="" />
      <PullToRefreshIndicator state={ptr} />

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
            {!loading && balancePts > 0 && (
              <PointsEquivalence
                balancePts={balancePts}
                balanceBrl={balanceBrl}
                visibleCount={2}
              />
            )}
            {/* Antes: variação de 30 dias derivada da curva ILUSTRATIVA — um
                número inventado apresentado como desempenho do cliente. Agora
                soma as entradas reais do extrato dentro da janela declarada. */}
            <div className="dx-var">
              <span className="dx-var-pill up">▲ {fmtNumber(entradas30)} pts</span>
              <span className="dx-var-cap">entraram nos últimos 30 dias</span>
            </div>
            <div className="dx-mini-stats">
              <div>
                <small>Disponível p/ resgate</small>
                <b>{fmtNumber(Math.max(0, balancePts - pendingPts))} pts</b>
              </div>
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

          {/* NÍVEL / PROGRESSO (Amex-style, refinado: brilho metálico + perks em chips) */}
          <div className="dx-level">
            <motion.div
              className="dx-level-card dx-level-card--shine"
              style={tier ? { background: tier.color, color: tier.text_color } : undefined}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <div className="dx-level-shine" aria-hidden />
              <div className="dx-level-row">
                <span className="dx-level-chip">NÍVEL</span>
                <Svg d={P.trophy} size={20} />
              </div>
              <div className="dx-level-name">{tier ? tier.label.toUpperCase() : '—'}</div>
              {tier?.perks ? (
                <ul className="dx-level-perks">
                  {tier.perks
                    .split(/[,·;]+/)
                    .map((p) => p.trim())
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                </ul>
              ) : (
                <div className="dx-level-sub">Programa de fidelidade BlaXx</div>
              )}
            </motion.div>
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
      </motion.section>

      {/* ============ BLAXX SCORE + CONQUISTAS — saúde de pontos + descoberta ============ */}
      <motion.section
        variants={reveal} initial="hidden" animate="show" custom={0.7}
        style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 14 }}
        className="dx-score-row"
      >
        <BlaxxScore wallet={wallet} card={card} txs={txs} />
        {(() => {
          const states = evalBadges({ wallet, card, txs })
          const unlocked = states.filter((s) => s.unlocked).length
          const next = states.find((s) => !s.unlocked)
          return (
            <button
              type="button"
              className="dx-tile-ach"
              onClick={() => navigate('/conquistas')}
              aria-label={`Ver conquistas — ${unlocked} de ${states.length}`}
            >
              <span className="dx-tile-ach__eyebrow">CONQUISTAS</span>
              <strong className="dx-tile-ach__big">
                {unlocked}<span>/{states.length}</span>
              </strong>
              {next ? (
                <span className="dx-tile-ach__next">
                  <span aria-hidden>{next.def.emoji}</span>
                  Próxima · <b>{next.def.label}</b>
                </span>
              ) : (
                <span className="dx-tile-ach__next">Todas conquistadas — 🎉</span>
              )}
              <span className="dx-tile-ach__cta">Ver tudo →</span>
            </button>
          )
        })()}
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
      {campanhaTop && (
      <motion.section className="dx-opp" variants={reveal} initial="hidden" animate="show" custom={2}>
        <div className="dx-opp-glow" />
        <div className="dx-opp-body">
          {/* Era "Smiles · Bônus 85% · ROI +38,4% · +122.000 pts" fixo no
              código — sem fonte de dados e, depois da remoção dos selos "demo",
              sem nada que o distinguisse do saldo real. Agora vem da campanha
              ativa de maior recompensa; sem campanha, a seção não renderiza. */}
          <div className="dx-opp-tag"><Svg d={P.bolt} size={14} /> CAMPANHA EM DESTAQUE</div>
          <h2 className="dx-opp-title">{campanhaTop.name}</h2>
          <p className="dx-opp-desc">
            {campanhaTop.description || 'Participe e ganhe pontos extras.'}
          </p>
          {Number(campanhaTop.reward_pts) > 0 && (
            <div className="dx-opp-metrics">
              <div><small>Recompensa</small><b className="lime">+{fmtNumber(Number(campanhaTop.reward_pts))} pts</b></div>
            </div>
          )}
          <button className="dx-opp-cta" onClick={() => navigate('/campanhas')}>
            Ver campanha <Svg d={P.arrowR} size={18} />
          </button>
        </div>
        <div className="dx-opp-coin">
          <div className="dx-coin-3d">
            <span>B</span>
          </div>
        </div>
      </motion.section>
      )}

      {/* ============ GRID PRINCIPAL ============ */}
      <div className="dx-cols">
        {/* COLUNA ESQUERDA */}
        <div className="dx-col">
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
.dx { --lime:${LIME}; --ink:#0A0B0E; --line:#0A0B0E;
  --srf:#FFFFFF; --srf2:#F4F4F0; --paper:#E8E6DD;
  --muted:#5B6058; --dim:#7A7F75; --pos:#1F7A12; --neg:#A83417;
  --hard:5px 5px 0 var(--ink); --hard-sm:3px 3px 0 var(--ink); }
.dx a { cursor:pointer; }
.dx .mono { font-family:var(--font-mono); }
.dx .lime { color:var(--pos); }
.dx .up { color:var(--pos); } .dx .down { color:var(--neg); }
.dx-muted { color:var(--muted); }

.dx-card { position:relative; background:var(--srf); border:3px solid var(--ink);
  border-radius:0; padding:22px; box-shadow:var(--hard); }
.dx-card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.dx-card-title { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:800;
  font-family:var(--font-display); text-transform:uppercase; letter-spacing:-.01em; color:var(--ink); }
.dx-card-title svg { color:var(--ink); }
.dx-see { color:var(--muted); font-weight:700; font-size:13px; transition:color .15s; }
.dx-see:hover { color:var(--ink); }

/* ── HERO ── */
.dx-hero { position:relative; overflow:hidden; border-radius:0; padding:30px;
  background:var(--srf); border:4px solid var(--ink);
  box-shadow:var(--hard); }
.dx-hero-glow { display:none; }
.dx-hero-grid { position:relative; display:grid; grid-template-columns:1.35fr 1fr; gap:26px; }
.dx-greet { color:var(--muted); font-size:14px; font-weight:600; margin-bottom:14px; }
.dx-eyebrow { font-size:11px; font-weight:800; letter-spacing:.16em; text-transform:uppercase;
  font-family:var(--font-mono); color:var(--muted); }
.dx-balance { font-family:var(--font-display); font-size:54px; font-weight:800; letter-spacing:-2.5px;
  line-height:1; margin:8px 0 6px; color:var(--ink); }
.dx-balance span { font-size:18px; font-weight:700; color:var(--muted); letter-spacing:0; }
.dx-var { display:flex; align-items:center; gap:10px; margin-top:14px; }
.dx-var-pill { display:inline-flex; align-items:center; gap:5px; font-weight:800; font-size:13px;
  padding:4px 10px; border-radius:0; border:2px solid var(--ink); }
.dx-var-pill.up { color:var(--ink); background:var(--lime); }
.dx-var-pill.down { color:#fff; background:var(--neg); }
.dx-var-cap { color:var(--dim); font-size:12px; font-weight:600; }
.dx-mini-stats { display:flex; gap:26px; margin-top:22px; }
.dx-mini-stats small { display:block; color:var(--dim); font-size:11px; font-weight:600; letter-spacing:.04em;
  font-family:var(--font-mono); }
.dx-mini-stats b { font-size:16px; font-weight:800; color:var(--ink); }

.dx-level { display:flex; flex-direction:column; gap:14px; }
.dx-level-card { border-radius:0; padding:18px; color:#F4F4F0; min-height:118px;
  background:var(--ink); border:3px solid var(--ink); box-shadow:var(--hard-sm); }
.dx-level-row { display:flex; align-items:center; justify-content:space-between; opacity:.9; }
.dx-level-chip { font-size:10px; font-weight:800; letter-spacing:.18em; font-family:var(--font-mono); }
.dx-level-name { font-family:var(--font-display); font-size:30px; font-weight:800; letter-spacing:-1px;
  margin-top:14px; line-height:1; color:var(--lime); }
.dx-level-sub { font-size:12px; opacity:.8; margin-top:6px; }
.dx-level-perks { list-style:none; margin:12px 0 0; padding:0; display:flex; flex-wrap:wrap; gap:6px; }
.dx-level-perks li { font-size:11px; font-weight:700; color:var(--ink); background:var(--lime);
  border:2px solid #F4F4F0; padding:2px 8px; }
.dx-prog { background:var(--srf); border:3px solid var(--ink); border-radius:0; padding:15px 16px; box-shadow:var(--hard-sm); }
.dx-prog-head { display:flex; align-items:center; justify-content:space-between; font-size:13px; color:var(--muted); font-weight:600; }
.dx-prog-head b { color:var(--ink); font-size:15px; font-weight:800; }
.dx-prog-track { height:16px; border-radius:0; background:#fff; border:3px solid var(--ink); overflow:hidden; margin:10px 0 9px; }
.dx-prog-fill { height:100%; border-radius:0; background:var(--lime); }
.dx-prog-foot { font-size:12px; color:var(--muted); }
.dx-prog-foot b { color:var(--ink); }

/* ── CHART ── */
.dx-chart-wrap { margin-top:22px; border-top:3px solid var(--ink); padding-top:18px; }
.dx-chart-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.dx-chart-title { font-size:13px; font-weight:700; color:var(--muted); display:flex; gap:8px; align-items:center; }
.dx-periods { display:flex; gap:4px; background:var(--srf); border:2px solid var(--ink);
  border-radius:0; padding:3px; }
.dx-period { border:0; background:transparent; color:var(--muted); font-weight:700; font-size:12px;
  padding:6px 11px; border-radius:0; cursor:pointer; transition:all .15s; }
.dx-period:hover { color:var(--ink); }
.dx-period.on { background:var(--lime); color:var(--ink); }
.dx-chart { height:200px; position:relative; }

/* ── CTAs ── */
.dx-ctas { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:18px; }
.dx-cta { display:flex; flex-direction:column; align-items:flex-start; gap:4px; text-align:left;
  padding:20px; border-radius:0; cursor:pointer; background:var(--srf); border:3px solid var(--ink);
  box-shadow:var(--hard-sm); transition:transform .08s, box-shadow .08s; }
.dx-cta:hover { transform:translate(-2px,-2px); box-shadow:4px 4px 0 var(--lime); }
.dx-cta-ic { width:48px; height:48px; border-radius:0; display:grid; place-items:center; margin-bottom:8px;
  background:var(--srf2); color:var(--ink); border:2px solid var(--ink); }
.dx-cta.primary { background:var(--lime); border-color:var(--ink); }
.dx-cta.primary .dx-cta-ic { background:var(--ink); color:var(--lime); border-color:var(--ink); }
.dx-cta-t { font-family:var(--font-display); font-size:16px; font-weight:800; text-transform:uppercase; color:var(--ink); }
.dx-cta-s { font-size:12px; color:var(--muted); }
.dx-cta.primary .dx-cta-s { color:var(--ink); opacity:.75; }

/* ── OPORTUNIDADE ── */
.dx-opp { position:relative; overflow:hidden; margin-top:18px; border-radius:0; padding:30px;
  display:grid; grid-template-columns:1fr auto; align-items:center; gap:20px;
  background:var(--ink); border:4px solid var(--ink); box-shadow:var(--hard); }
.dx-opp-glow { display:none; }
.dx-opp-body { position:relative; z-index:2; max-width:640px; }
.dx-opp-tag { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:800;
  letter-spacing:.14em; color:var(--ink); background:var(--lime); border:2px solid var(--lime);
  padding:5px 12px; border-radius:0; }
.dx-opp-title { font-family:var(--font-display); font-size:32px; font-weight:800; letter-spacing:-1px;
  margin:14px 0 8px; color:#F4F4F0; text-transform:uppercase; }
.dx-opp-title span { color:var(--lime); }
.dx-opp-desc { color:#b7bbb2; font-size:14px; max-width:520px; margin:0 0 18px; }
.dx-opp-metrics { display:flex; gap:30px; margin-bottom:20px; flex-wrap:wrap; }
.dx-opp-metrics small { display:block; color:#8a8f86; font-size:11px; font-weight:600; letter-spacing:.04em;
  font-family:var(--font-mono); }
.dx-opp-metrics b { font-size:20px; font-weight:900; letter-spacing:-.5px; color:#F4F4F0; }
.dx-opp-metrics b.up { color:var(--lime); }
.dx-opp-metrics b.lime { color:var(--lime); }
.dx-opp-metrics b.mono { font-size:18px; font-family:var(--font-mono); color:#F4F4F0; }
.dx-opp-cta { display:inline-flex; align-items:center; gap:8px; cursor:pointer;
  background:var(--lime); color:var(--ink); border:3px solid var(--lime); font-weight:900; font-size:14px;
  text-transform:uppercase; padding:13px 22px; border-radius:0; box-shadow:4px 4px 0 rgba(89,253,39,.35);
  transition:transform .1s, box-shadow .1s; }
.dx-opp-cta:hover { transform:translate(2px,2px); box-shadow:1px 1px 0 rgba(89,253,39,.35); }
.dx-opp-coin { position:relative; z-index:2; }
.dx-coin-3d { width:120px; height:120px; border-radius:0; display:grid; place-items:center;
  font-family:var(--font-display); font-size:60px; font-weight:900; color:var(--ink);
  background:var(--lime); border:3px solid #F4F4F0; box-shadow:6px 6px 0 rgba(89,253,39,.4);
  transform:rotate(-6deg); animation:dx-float 4s ease-in-out infinite; }
@keyframes dx-float { 0%,100%{transform:translateY(0) rotate(-6deg);} 50%{transform:translateY(-8px) rotate(-3deg);} }

/* ── GRID ── */
.dx-cols { display:grid; grid-template-columns:1.5fr 1fr; gap:18px; margin-top:18px; }
.dx-col { display:flex; flex-direction:column; gap:18px; }

/* ── EXCHANGE ── */
.dx-live { display:inline-flex; align-items:center; gap:6px; color:var(--muted); font-size:12px; font-weight:600; }
.dx-live i { width:8px; height:8px; border-radius:0; background:var(--lime); border:1px solid var(--ink);
  animation:dx-pulse 1.6s ease-in-out infinite; }
@keyframes dx-pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }
  color:var(--muted); font-family:var(--font-mono); font-weight:700; padding:0 0 10px; }
  font-weight:900; color:var(--ink); }

/* ── MARKETPLACE ── */
.dx-mkt-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.dx-mkt-card { text-align:left; cursor:pointer; padding:16px; border-radius:0;
  background:var(--srf); border:3px solid var(--ink); box-shadow:var(--hard-sm);
  transition:transform .08s, box-shadow .08s; }
.dx-mkt-card:hover { transform:translate(-2px,-2px); box-shadow:4px 4px 0 var(--lime); }
.dx-mkt-top { display:flex; align-items:center; justify-content:space-between; }
.dx-mkt-logo { font-size:30px; }
.dx-mkt-cat { font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
  color:var(--ink); background:var(--srf2); border:2px solid var(--ink); padding:3px 8px; border-radius:0; }
.dx-mkt-name { font-family:var(--font-display); font-size:15px; font-weight:800; color:var(--ink); margin-top:12px; text-transform:uppercase; }
.dx-mkt-rule { font-size:12px; color:var(--pos); font-weight:700; margin-top:3px; }
.dx-mkt-foot { display:flex; align-items:center; gap:6px; margin-top:12px; }
.dx-stars { color:var(--gold,#B8860B); font-size:12px; letter-spacing:1px; }
.dx-rating { color:var(--muted); font-size:12px; font-weight:700; }

/* ── SCORE ── */
.dx-score { text-align:center; }
.dx-gauge { display:grid; place-items:center; margin:14px 0 6px; }
.dx-gauge-ring { width:168px; height:168px; border-radius:50%; display:grid; place-items:center;
  background:conic-gradient(#59FD27 0 89%, #E8E6DD 89% 100%); border:3px solid var(--ink); }
.dx-gauge-inner { width:120px; height:120px; border-radius:50%; background:#fff; display:flex;
  flex-direction:column; align-items:center; justify-content:center; gap:2px; border:3px solid var(--ink); }
.dx-gauge-inner b { font-family:var(--font-display); font-size:44px; font-weight:800; letter-spacing:-2px; color:var(--ink); line-height:1; }
.dx-gauge-inner small { color:var(--muted); font-size:13px; font-weight:700; }
.dx-score-tag { display:inline-block; font-weight:900; letter-spacing:.1em; text-transform:uppercase; color:var(--ink);
  background:var(--lime); border:2px solid var(--ink); padding:5px 16px; border-radius:0; }
.dx-score-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:18px;
  border-top:3px solid var(--ink); padding-top:16px; }
.dx-score-stats small { display:block; color:var(--dim); font-size:11px; font-weight:600; }
.dx-score-stats b { font-size:17px; font-weight:900; color:var(--ink); }
.dx-score-stats b.lime { color:var(--pos); }

/* ── INTELLIGENCE ── */
.dx-intel-sub { font-size:12.5px; margin:-6px 0 14px; }
.dx-insight { display:flex; align-items:center; gap:12px; padding:11px 0; border-top:2px solid var(--srf2); }
.dx-insight:first-of-type { border-top:0; }
.dx-insight-ic { width:34px; height:34px; flex-shrink:0; border-radius:0; display:grid; place-items:center;
  color:var(--ink); background:var(--lime); border:2px solid var(--ink); }
.dx-insight-body { flex:1; min-width:0; }
.dx-insight-body small { display:block; color:var(--dim); font-size:11px; font-weight:600; }
.dx-insight-body b { font-size:14px; font-weight:800; color:var(--ink); }
.dx-insight-sub { font-size:11px; color:var(--muted); text-align:right; font-weight:600; max-width:110px; }
.dx-econ { display:flex; align-items:center; justify-content:space-between; margin-top:14px; padding:14px 16px;
  border-radius:0; background:var(--lime); border:2px solid var(--ink); }
.dx-econ span { color:var(--ink); font-size:13px; font-weight:600; }
.dx-econ b { font-size:20px; font-weight:900; letter-spacing:-.5px; color:var(--ink); }

/* ── BOTTOM ── */
.dx-bottom { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:18px; }
.dx-list { display:flex; flex-direction:column; }
.dx-row { display:flex; align-items:center; gap:13px; padding:12px 6px; border-radius:0; cursor:pointer;
  transition:background .15s; }
.dx-row:hover { background:var(--srf2); }
.dx-row-ic { width:40px; height:40px; flex-shrink:0; border-radius:0; display:grid; place-items:center;
  font-size:18px; color:var(--ink); background:var(--lime); border:2px solid var(--ink); }
.dx-row-ic.pos { color:var(--ink); background:var(--lime); border-color:var(--ink); }
.dx-row-ic.neg { color:#fff; background:var(--neg); border-color:var(--ink); }
.dx-row-body { flex:1; min-width:0; }
.dx-row-body b { display:block; font-size:14px; font-weight:700; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
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
