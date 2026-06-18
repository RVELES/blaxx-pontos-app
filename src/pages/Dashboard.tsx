// Dashboard — "Command Center" premium.
// Dados REAIS: /wallet (saldo, R$), /card (nível, progresso), /partners,
// /campaigns, /wallet/transactions. Seções sem fonte de dados (Exchange,
// Rewards Map, Wealth Score, Intelligence) são showcase, marcadas "demo".
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const LIME = '#C7F11A'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

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
      if (p.status === 'fulfilled') setPartners((p.value.items || []).slice(0, 6))
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
  const monthIn = useMemo(
    () => txs.filter((t) => t.amount_pts > 0).reduce((s, t) => s + t.amount_pts, 0),
    [txs],
  )

  const balancePts = wallet?.balance_pts ?? 0
  const balanceBrl = wallet?.balance_brl_equiv ?? 0
  const pendingPts = wallet?.pending_pts ?? 0
  const tier = card?.tier
  const nextTier = card?.next_tier
  const progress = card?.progress_pct ?? 0
  const toNext = card?.points_to_next ?? 0
  const lifetime = card?.lifetime_points ?? 0

  // Marketplace de experiências = parceiros reais (top), com estética premium.
  const showcasePartners = partners.slice(0, 3)

  // Cotações ilustrativas (sem fonte no backend) — claramente "demo".
  const exchange = [
    { k: 'S', name: 'SMILES', buy: '0,021', sell: '0,024' },
    { k: 'L', name: 'LIVELO', buy: '0,034', sell: '0,037' },
    { k: 'A', name: 'AZUL', buy: '0,019', sell: '0,022' },
    { k: 'T', name: 'LATAM PASS', buy: '0,023', sell: '0,026' },
  ]

  return (
    <div className="cc">
      <Topbar eyebrow="Bem-vindo ao Command Center" title={`${greeting()}, ${firstName} 👋`} />

      <div className="cc-grid">
        {/* ============ COLUNA PRINCIPAL ============ */}
        <div className="cc-stack">
          {/* HERO — patrimônio (REAL) */}
          <article className="cc-panel cc-hero">
            <div className="cc-hero-row">
              <div>
                <div className="cc-label">Patrimônio em Rewards 👁</div>
                <div className="cc-balance">
                  {loading ? '—' : fmtNumber(balancePts)} <span>pts</span>
                </div>
                <div className="cc-money">≈ {loading ? 'R$ —' : fmtBRL(balanceBrl)}</div>
                <div className="cc-hero-sub">
                  {pendingPts > 0 ? `${fmtNumber(pendingPts)} pts em processamento` : 'Nenhum ponto pendente'}
                </div>
              </div>
              <div className="cc-chart">
                <svg viewBox="0 0 500 180" preserveAspectRatio="none">
                  <path
                    d="M20 140 C80 105, 95 120, 130 88 S195 70, 220 88 S280 130, 320 80 S390 48, 470 20"
                    fill="none"
                    stroke={LIME}
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 140 C80 105, 95 120, 130 88 S195 70, 220 88 S280 130, 320 80 S390 48, 470 20 L470 180 L20 180 Z"
                    fill="rgba(199,241,26,.15)"
                  />
                </svg>
                <div className="cc-gain">
                  +{fmtNumber(monthIn)}
                  <br />
                  <small>pts este mês</small>
                </div>
              </div>
            </div>
            <div className="cc-quick">
              <button className="cc-q primary" onClick={() => navigate('/comprar-pontos')}>
                <i>🛒</i>Comprar
              </button>
              <button className="cc-q" onClick={() => navigate('/enviar-pontos')}>
                <i>✈</i>Transferir
              </button>
              <button className="cc-q" onClick={() => navigate('/vender-pontos')}>
                <i>⇄</i>Resgatar
              </button>
              <button className="cc-q" onClick={() => navigate('/parceiros')}>
                <i>🎁</i>Parceiros
              </button>
            </div>
          </article>

          {/* OPORTUNIDADE — showcase */}
          <article className="cc-panel cc-opportunity">
            <div className="cc-demo">demo</div>
            <div className="cc-label">
              Oportunidade detectada <span className="cc-pill">🔥 EXCLUSIVO</span>
            </div>
            <h2>
              LATAM PASS
              <br />
              <span className="cc-lime">Bônus 85%</span>
            </h2>
            <p>
              Potencial ganho:
              <br />
              <b className="cc-lime" style={{ fontSize: 22 }}>
                + 122.000 pontos
              </b>
            </p>
            <button className="cc-cta" onClick={() => navigate('/parceiros')}>
              Explorar parceiros
            </button>
          </article>

          {/* MARKETPLACE DE EXPERIÊNCIAS — parceiros REAIS */}
          <article className="cc-panel cc-market">
            <div className="cc-section-head">
              <h3>Marketplace de experiências</h3>
              <a className="cc-lime" onClick={() => navigate('/parceiros')}>
                Ver tudo →
              </a>
            </div>
            {showcasePartners.length === 0 ? (
              <p className="cc-muted">Carregando parceiros…</p>
            ) : (
              <div className="cc-exps">
                {showcasePartners.map((p) => (
                  <button
                    className="cc-exp"
                    key={p.id}
                    onClick={() => navigate('/detalhe-parceiro?id=' + encodeURIComponent(p.id))}
                  >
                    <div className="cc-exp-emoji">{p.logo_emoji || '🎁'}</div>
                    <div className="cc-exp-body">
                      <strong>{p.name}</strong>
                      <span>{p.accrual_rule || p.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </article>

          {/* REWARDS MAP — showcase */}
          <article className="cc-panel cc-map">
            <div className="cc-demo">demo</div>
            <div className="cc-section-head">
              <h3>Rewards Map™</h3>
              <span className="cc-lime">Em breve</span>
            </div>
            <div className="cc-map-canvas">
              <div className="cc-legend">
                <span>🟢 Parceiros</span>
                <span>🔵 Promoções</span>
                <span>🟣 Hotéis</span>
                <span>🟠 Cias aéreas</span>
              </div>
            </div>
          </article>
        </div>

        {/* ============ COLUNA LATERAL ============ */}
        <div className="cc-stack">
          {/* NÍVEIS BLAXX — REAL */}
          <article className="cc-panel cc-levels">
            <div className="cc-section-head">
              <h3>Níveis Blaxx</h3>
              <a className="cc-lime" onClick={() => navigate('/cartao')}>
                Cartão →
              </a>
            </div>
            <div
              className="cc-level-card"
              style={tier ? { background: tier.color, color: tier.text_color } : undefined}
            >
              <h2>{tier ? tier.label.toUpperCase() : '—'}</h2>
              <small>{lifetime > 0 ? `${fmtNumber(lifetime)} pts acumulados` : 'Programa de pontos'}</small>
            </div>
            <div className="cc-prog-head">
              <small>
                {nextTier ? `Progresso para ${nextTier.label}` : 'Nível máximo atingido'}
              </small>
              <b>{progress}%</b>
            </div>
            <div className="cc-progress">
              <span style={{ width: progress + '%' }} />
            </div>
            {nextTier && (
              <p className="cc-muted" style={{ marginTop: 10 }}>
                Faltam {fmtNumber(toNext)} pts para {nextTier.label}.
              </p>
            )}
          </article>

          {/* TRANSFERIR — REAL (CTA) */}
          <article className="cc-panel cc-transfer">
            <h3>Transferir pontos</h3>
            <p className="cc-muted">Envie pontos a outro cliente Blaxx, sem taxa.</p>
            <div className="cc-transfer-balance">
              <small>Saldo disponível</small>
              <div className="cc-transfer-amount">
                {fmtNumber(balancePts)} <span>pts</span>
              </div>
            </div>
            <button className="cc-send" onClick={() => navigate('/enviar-pontos')}>
              Enviar agora →
            </button>
          </article>

          {/* WEALTH SCORE — showcase */}
          <article className="cc-panel cc-score">
            <div className="cc-demo">demo</div>
            <h3>Rewards Wealth Score™</h3>
            <div className="cc-ring">
              <div className="cc-ring-inner">
                <div>
                  <b>8.9</b>
                  <br />
                  <span>/10</span>
                </div>
              </div>
            </div>
            <h2 className="cc-lime">Elite</h2>
            <p className="cc-muted">Indicador ilustrativo de performance no programa.</p>
          </article>

          {/* EXCHANGE — showcase */}
          <article className="cc-panel cc-exchange">
            <div className="cc-demo">demo</div>
            <div className="cc-section-head">
              <h3>Rewards Exchange™</h3>
              <span className="cc-lime">Ilustrativo</span>
            </div>
            {exchange.map((c) => (
              <div className="cc-row" key={c.name}>
                <div className="cc-coin">
                  <span className="cc-icon">{c.k}</span>
                  <div>
                    <b>{c.name}</b>
                    <small>Compra {c.buy}</small>
                  </div>
                </div>
                <div className="cc-price">
                  <small>Venda {c.sell}</small>
                  <span className="cc-spark">⌁⌁</span>
                </div>
              </div>
            ))}
          </article>
        </div>
      </div>

      {/* ============ FAIXA INFERIOR ============ */}
      <div className="cc-bottom">
        {/* CAMPANHAS — REAL */}
        <article className="cc-panel cc-light cc-pad">
          <div className="cc-section-head">
            <h3>Campanhas ativas</h3>
            <a className="cc-link" onClick={() => navigate('/campanhas')}>
              Ver todas →
            </a>
          </div>
          {campaigns.length === 0 ? (
            <p className="cc-muted">Nenhuma campanha ativa no momento.</p>
          ) : (
            <div className="cc-tiles">
              {campaigns.map((c) => (
                <div className="cc-tile" key={c.id} onClick={() => navigate('/campanhas')}>
                  <div className="cc-tile-emoji">🎯</div>
                  <div className="cc-tile-body">
                    <div className="cc-tile-title">{c.name}</div>
                    <div className="cc-tile-sub">{c.description || c.mechanic || 'Campanha ativa'}</div>
                  </div>
                  <div className="cc-tile-meta">+{fmtNumber(c.reward_pts)}</div>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* ÚLTIMAS MOVIMENTAÇÕES — REAL */}
        <article className="cc-panel cc-light cc-pad">
          <div className="cc-section-head">
            <h3>Últimas movimentações</h3>
            <a className="cc-link" onClick={() => navigate('/extrato')}>
              Ver extrato →
            </a>
          </div>
          {loading ? (
            <p className="cc-muted">Carregando…</p>
          ) : txs.length === 0 ? (
            <p className="cc-muted">Nenhuma movimentação ainda.</p>
          ) : (
            <div className="cc-tiles">
              {txs.slice(0, 5).map((t) => (
                <div className="cc-tile" key={t.id}>
                  <div className="cc-tile-emoji">{t.amount_pts > 0 ? '↘' : '↗'}</div>
                  <div className="cc-tile-body">
                    <div className="cc-tile-title">{t.description || t.type}</div>
                    <div className="cc-tile-sub">{t.type}</div>
                  </div>
                  <div className={'cc-tile-meta ' + (t.amount_pts > 0 ? 'pos' : 'neg')}>
                    {t.amount_pts > 0 ? '+' : ''}
                    {fmtNumber(t.amount_pts)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* INTELLIGENCE — showcase */}
        <article className="cc-panel cc-light cc-pad cc-intel">
          <div className="cc-demo dark">demo</div>
          <h3>Intelligence Center™</h3>
          <div className="cc-mini">
            <span className="cc-icon">S</span>
            <div>
              <small>Melhor transferência hoje</small>
              <b>SMILES +80%</b>
              <small>Prazo: 48 horas</small>
            </div>
          </div>
          <div className="cc-mini">
            <span className="cc-icon">✈</span>
            <div>
              <small>Melhor resgate</small>
              <b>Business Class</b>
              <small>São Paulo → Londres</small>
            </div>
          </div>
          <p className="cc-muted" style={{ fontSize: 12, marginTop: 4 }}>
            Recomendações ilustrativas — em breve com dados reais.
          </p>
        </article>
      </div>

      <p className="cc-disclaimer">
        Pontos são créditos promocionais — não são moeda, depósito ou investimento. Seções marcadas
        “demo” são ilustrativas e ainda não refletem dados reais.
      </p>

      <style>{CSS}</style>
    </div>
  )
}

const CSS = `
.cc { --lime:${LIME}; --blk:#070A0C; --panel-d:#0E1318; --line:rgba(255,255,255,.10);
  --ink:#E6E8EB; --muted:#9aa3ad; }
.cc a { cursor:pointer; }
.cc-grid { display:grid; grid-template-columns: minmax(0,1.55fr) minmax(320px,.9fr); gap:20px; margin-top:18px; }
.cc-stack { display:flex; flex-direction:column; gap:20px; }
.cc-panel { position:relative; border-radius:24px; overflow:hidden; box-shadow:0 20px 60px rgba(7,10,12,.12); }
.cc-demo { position:absolute; top:14px; right:14px; z-index:3; font-size:10px; font-weight:800; letter-spacing:.08em;
  text-transform:uppercase; color:var(--lime); background:rgba(199,241,26,.12); border:1px solid rgba(199,241,26,.35);
  padding:3px 9px; border-radius:999px; }
.cc-demo.dark { color:#46d36a; background:rgba(70,211,106,.12); border-color:rgba(70,211,106,.32); }
.cc-label { font-weight:800; font-size:15px; color:#fff; }
.cc-lime { color:var(--lime); font-weight:800; }
.cc h1.cc-lime, .cc h2.cc-lime, .cc h3.cc-lime { color:var(--lime); }
.cc-muted { color:var(--muted); }
.cc-section-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
.cc-section-head h3 { margin:0; font-size:17px; }

/* HERO */
.cc-hero { padding:28px; color:#fff;
  background:radial-gradient(circle at 84% 24%, rgba(199,241,26,.22), transparent 26%), linear-gradient(140deg,#06080A,#0D1217); }
.cc-hero-row { display:grid; grid-template-columns:1fr .9fr; gap:18px; align-items:center; }
.cc-balance { font-size:46px; font-weight:900; letter-spacing:-2px; margin:18px 0 4px; line-height:1; }
.cc-balance span { font-size:17px; font-weight:700; color:#cdd3d8; letter-spacing:0; }
.cc-money { color:var(--lime); font-size:22px; font-weight:800; }
.cc-hero-sub { color:#9aa3ad; font-size:13px; margin-top:8px; }
.cc-chart { height:140px; position:relative; }
.cc-chart svg { width:100%; height:100%; }
.cc-gain { position:absolute; right:8px; top:54px; color:var(--lime); font-weight:900; text-align:right; line-height:1.1; }
.cc-gain small { color:#9aa3ad; font-weight:600; font-size:11px; }
.cc-quick { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:22px; }
.cc-q { border:0; border-radius:15px; height:74px; background:#fff; color:#111; font-weight:800; font-size:13px;
  box-shadow:0 12px 24px rgba(0,0,0,.18); cursor:pointer; transition:transform .16s ease; }
.cc-q:hover { transform:translateY(-3px); }
.cc-q.primary { background:var(--lime); }
.cc-q i { display:block; font-size:21px; margin-bottom:6px; font-style:normal; }

/* OPORTUNIDADE */
.cc-opportunity { min-height:230px; padding:30px; color:#fff;
  background:linear-gradient(120deg, rgba(7,10,12,.96), rgba(7,10,12,.55)), linear-gradient(135deg,#1a1030,#0b1230); }
.cc-opportunity h2 { font-size:30px; margin:22px 0 6px; line-height:1.05; }
.cc-pill { display:inline-flex; align-items:center; background:#6d35b9; color:#fff; border-radius:999px;
  font-weight:800; font-size:11px; padding:6px 11px; margin-left:8px; }
.cc-cta { border:0; background:var(--lime); color:#111; font-weight:900; border-radius:13px; padding:14px 32px;
  margin-top:18px; cursor:pointer; transition:transform .16s ease; }
.cc-cta:hover { transform:translateY(-2px); }

/* MARKETPLACE */
.cc-market { padding:24px; background:#06080A; color:#fff; }
.cc-exps { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.cc-exp { text-align:left; border:1px solid var(--line); border-radius:18px; padding:16px; background:rgba(255,255,255,.03);
  cursor:pointer; transition:transform .18s ease, border-color .18s ease; color:#fff; }
.cc-exp:hover { transform:translateY(-4px); border-color:rgba(199,241,26,.4); }
.cc-exp-emoji { font-size:34px; }
.cc-exp-body strong { display:block; font-size:15px; margin-top:10px; }
.cc-exp-body span { color:var(--lime); font-weight:800; font-size:12px; }

/* MAP */
.cc-map { padding:22px; background:#06080A; color:#fff; }
.cc-map-canvas { height:230px; border-radius:18px; position:relative; overflow:hidden;
  background:radial-gradient(circle at 22% 42%, rgba(199,241,26,.7), transparent 2.3%),
    radial-gradient(circle at 50% 36%, rgba(199,241,26,.65), transparent 3%),
    radial-gradient(circle at 72% 50%, rgba(199,241,26,.5), transparent 2.5%),
    radial-gradient(circle at 39% 64%, rgba(199,241,26,.32), transparent 2%),
    linear-gradient(135deg,#151a1f,#06080A); }
.cc-legend { position:absolute; left:18px; bottom:16px; display:flex; gap:10px; flex-wrap:wrap; }
.cc-legend span { background:rgba(0,0,0,.6); border:1px solid var(--line); border-radius:999px; padding:7px 11px;
  font-size:12px; font-weight:700; }

/* LEVELS */
.cc-levels { padding:22px; background:var(--panel-d); border:1px solid var(--line); color:#fff; }
.cc-levels h3, .cc-transfer h3 { margin:0; }
.cc-level-card { height:120px; border-radius:18px; color:#fff; padding:20px; margin:14px 0;
  background:radial-gradient(circle at 80% 40%, rgba(199,241,26,.2), transparent 24%), linear-gradient(135deg,#101318,#010101); }
.cc-level-card h2 { margin:0; font-size:30px; letter-spacing:-1px; }
.cc-level-card small { opacity:.8; }
.cc-prog-head { display:flex; justify-content:space-between; align-items:center; }
.cc-progress { height:10px; background:rgba(255,255,255,.12); border-radius:999px; overflow:hidden; margin-top:6px; }
.cc-progress span { display:block; height:100%; background:var(--lime); transition:width 1s cubic-bezier(.16,1,.3,1); }

/* TRANSFER */
.cc-transfer { padding:22px; background:var(--panel-d); border:1px solid var(--line); color:#fff; }
.cc-transfer-balance { background:rgba(255,255,255,.04); border:1px solid var(--line); border-radius:16px; padding:14px 16px; margin:14px 0; }
.cc-transfer-balance small { color:var(--muted); }
.cc-transfer-amount { font-size:28px; font-weight:900; letter-spacing:-1px; }
.cc-transfer-amount span { font-size:14px; color:var(--muted); }
.cc-send { width:100%; height:52px; border:0; border-radius:14px; background:var(--lime); color:#111; font-weight:900;
  cursor:pointer; transition:transform .16s ease; }
.cc-send:hover { transform:translateY(-2px); }

/* SCORE */
.cc-score { padding:24px; text-align:center; color:#fff;
  background:linear-gradient(140deg,#07090b,#11151a); border:1px solid var(--line); }
.cc-score h3 { margin:0 0 6px; }
.cc-ring { width:180px; height:180px; border-radius:50%; margin:16px auto;
  background:conic-gradient(var(--lime) 0 89%, rgba(199,241,26,.22) 89% 100%); display:grid; place-items:center; }
.cc-ring-inner { width:136px; height:136px; border-radius:50%; background:#07090b; display:grid; place-items:center; }
.cc-ring b { font-size:48px; }
.cc-score h2 { margin:6px 0; }

/* EXCHANGE */
.cc-exchange { padding:22px; color:#fff; background:linear-gradient(140deg,#07090b,#11151a); border:1px solid var(--line); }
.cc-row { display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--line); padding:13px 0; }
.cc-row:last-child { border-bottom:0; }
.cc-coin { display:flex; align-items:center; gap:12px; }
.cc-icon { width:34px; height:34px; border-radius:10px; display:grid; place-items:center;
  background:linear-gradient(135deg,var(--lime),#7bd900); color:#111; font-weight:900; }
.cc-coin small, .cc-price small { display:block; color:#cfd5db; font-size:12px; }
.cc-price { text-align:right; }
.cc-spark { color:var(--lime); font-weight:900; }

/* BOTTOM */
.cc-bottom { display:grid; grid-template-columns:1.1fr 1.1fr .8fr; gap:20px; margin-top:20px; }
.cc-light { background:var(--panel-d); border:1px solid var(--line); color:var(--ink); }
.cc-pad { padding:22px; }
.cc-link { color:#fff; font-weight:700; font-size:13px; }
.cc-tiles { display:flex; flex-direction:column; gap:8px; }
.cc-tile { display:flex; align-items:center; gap:12px; padding:12px; border-radius:14px; cursor:pointer;
  transition:background .16s ease; }
.cc-tile:hover { background:rgba(255,255,255,.05); }
.cc-tile-emoji { width:38px; height:38px; border-radius:11px; display:grid; place-items:center; font-size:18px;
  background:rgba(255,255,255,.07); }
.cc-tile-body { flex:1; min-width:0; }
.cc-tile-title { font-weight:700; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cc-tile-sub { color:var(--muted); font-size:12px; }
.cc-tile-meta { font-weight:800; font-size:13px; }
.cc-tile-meta.pos { color:#46d36a; } .cc-tile-meta.neg { color:#ff6b6b; }
.cc-intel .cc-mini { display:flex; gap:12px; align-items:center; background:rgba(255,255,255,.03); border:1px solid var(--line); border-radius:16px;
  padding:13px; margin-top:10px; }
.cc-intel .cc-mini small { display:block; color:var(--muted); font-size:11px; }
.cc-intel .cc-mini b { font-size:15px; }
.cc-intel .cc-icon { background:linear-gradient(135deg,var(--lime),#7bd900); }

.cc-disclaimer { color:var(--muted); font-size:12px; margin:20px 2px 0; line-height:1.5; }

@media (max-width: 1100px) {
  .cc-grid { grid-template-columns:1fr; }
  .cc-bottom { grid-template-columns:1fr; }
  .cc-hero-row { grid-template-columns:1fr; }
  .cc-exps { grid-template-columns:1fr; }
}
@media (max-width: 560px) {
  .cc-quick { grid-template-columns:repeat(2,1fr); }
  .cc-metrics { grid-template-columns:1fr; }
  .cc-balance { font-size:38px; }
}
`
