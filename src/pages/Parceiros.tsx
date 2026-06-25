// Parceiros Blaxx — redesign premium (Nubank/XP/Livelo/Apple-like).
// Dados reais: /card (nível, progresso), /wallet/ (saldo, R$), /partners/ (grid).
// Favoritos via localStorage. Busca instantânea, filtros em pills, banner carrossel,
// painel de métricas, grid responsivo (5/3/1) e rodapé de benefícios.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BlaxxAPI, Session, CardState, Wallet, Partner } from '../lib/api-client'

const LIME = '#59FD27'
const FAV_KEY = 'blaxx_fav_partners'

const fmtN = (n: number) => Number(n || 0).toLocaleString('pt-BR')
const fmtBRL = (n: number) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function loadFavs(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'))
  } catch {
    return new Set()
  }
}
function saveFavs(s: Set<string>) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...s]))
  } catch {
    /* storage indisponível */
  }
}

// Categorias “amigáveis” → mantém as primeiras pills sempre visíveis.
const PRIMARY_CATS = ['Viagens', 'Tecnologia', 'Moda', 'Casa', 'Supermercado', 'Saúde']

export default function Parceiros() {
  const navigate = useNavigate()
  const user = Session.user()

  const [card, setCard] = useState<CardState | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [all, setAll] = useState<Partner[]>([])
  const [cats, setCats] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('') // '' = Todos | '__fav__' = Favoritos | nome categoria
  const [favs, setFavs] = useState<Set<string>>(loadFavs)
  const [showAllCats, setShowAllCats] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [c, w, p, k] = await Promise.allSettled([
        BlaxxAPI.card(),
        BlaxxAPI.wallet(),
        BlaxxAPI.partners(),
        BlaxxAPI.partnerCategories(),
      ])
      if (!alive) return
      if (c.status === 'fulfilled') setCard(c.value)
      if (w.status === 'fulfilled') setWallet(w.value)
      if (p.status === 'fulfilled') setAll(p.value.items || [])
      if (k.status === 'fulfilled') setCats(k.value.items || [])
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [])

  function toggleFav(id: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    setFavs((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveFavs(next)
      return next
    })
  }

  // ---- Filtragem (busca instantânea + categoria/favoritos) ----
  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((p) => {
      if (cat === '__fav__' && !favs.has(p.id)) return false
      if (cat && cat !== '__fav__' && p.category !== cat) return false
      if (q && !(p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)))
        return false
      return true
    })
  }, [all, cat, query, favs])

  // ---- Banner: slides a partir de parceiros reais (ou destaque vazio) ----
  const slides = useMemo(() => all.slice(0, Math.min(4, all.length)), [all])
  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000)
    return () => clearInterval(t)
  }, [slides.length])

  // ---- Pills de categoria ----
  const orderedCats = useMemo(() => {
    const present = new Set(cats)
    const primary = PRIMARY_CATS.filter((c) => present.has(c))
    const rest = cats.filter((c) => !primary.includes(c))
    return [...primary, ...rest]
  }, [cats])
  const visibleCats = showAllCats ? orderedCats : orderedCats.slice(0, 6)

  // ---- Métricas ----
  const balance = wallet?.balance_pts ?? card?.balance_pts ?? 0
  const brl = wallet?.balance_brl_equiv ?? 0
  const pending = wallet?.pending_pts ?? 0
  const tierLabel = card?.tier?.label ?? '—'
  const tierColor = card?.tier?.color ?? '#0B0B0C'
  const nextLabel = card?.next_tier?.label ?? null
  const toNext = card?.points_to_next ?? 0
  const progress = card?.progress_pct ?? (nextLabel ? 0 : 100)

  return (
    <div className="pz">
      <style>{CSS}</style>

      {/* Header */}
      <header className="pz-head">
        <div>
          <span className="pz-eyebrow">Programa de pontos</span>
          <h1 className="pz-title">Parceiros Blaxx</h1>
          <p className="pz-sub">Milhares de parceiros para você acumular ainda mais pontos.</p>
        </div>
        <div className="pz-head-actions">
          <button className="pz-icon" title="Notificações" onClick={() => navigate('/central-notificacoes')}>🔔</button>
          <button className="pz-icon" title="Ajuda" onClick={() => navigate('/perfil')}>❔</button>
          <div className="pz-avatar" title={user?.name || ''}>
            {(user?.name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
          </div>
        </div>
      </header>

      {/* Métricas */}
      <section className="pz-metrics" aria-label="Resumo da conta">
        {loading ? (
          [0, 1, 2, 3, 4].map((i) => <div key={i} className="pz-mcard pz-skel" />)
        ) : (
          <>
            <MetricCard label="Saldo atual" value={`${fmtN(balance)} pts`} cta="Ver carteira →" onCta={() => navigate('/carteira')} />
            <MetricCard label="Valor estimado" value={fmtBRL(brl)} cta="Resgatar agora →" onCta={() => navigate('/vender-pontos')} accent />
            <MetricCard label="Pontos pendentes" value={`${fmtN(pending)} pts`} note={pending > 0 ? 'Liberam em até 7 dias' : 'Nada pendente'} warn={pending > 0} />
            <MetricCard label="Nível atual" value={tierLabel.toUpperCase()} dot={tierColor} cta="Ver benefícios →" onCta={() => navigate('/cartao')} />
            <MetricCard
              label="Progresso"
              value={`${progress}%`}
              note={nextLabel ? `Faltam ${fmtN(toNext)} pts para ${nextLabel}` : 'Nível máximo atingido'}
              progress={progress}
            />
          </>
        )}
      </section>

      {/* Banner carrossel */}
      {!loading && slides.length > 0 && (
        <section className="pz-banner-wrap">
          <div className="pz-banner" onClick={() => navigate('/detalhe-parceiro?id=' + slides[slide].id)} role="button">
            <div className="pz-banner-copy">
              <span className="pz-banner-tag">Destaque da semana</span>
              <h2 className="pz-banner-name">{slides[slide].name}</h2>
              <p className="pz-banner-rule">{slides[slide].accrual_rule || 'Acumule pontos a cada compra'}</p>
              <span className="pz-banner-btn">Ir para {slides[slide].name} →</span>
            </div>
            <div className="pz-banner-logo">{slides[slide].logo_emoji || '◆'}</div>
          </div>
          {slides.length > 1 && (
            <>
              <button className="pz-arrow pz-arrow-l" onClick={(e) => { e.stopPropagation(); setSlide((s) => (s - 1 + slides.length) % slides.length) }} aria-label="Anterior">‹</button>
              <button className="pz-arrow pz-arrow-r" onClick={(e) => { e.stopPropagation(); setSlide((s) => (s + 1) % slides.length) }} aria-label="Próximo">›</button>
              <div className="pz-dots">
                {slides.map((_, i) => (
                  <button key={i} className={'pz-dot' + (i === slide ? ' on' : '')} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Busca + favoritos */}
      <section className="pz-searchbar">
        <div className="pz-search">
          <span className="pz-search-ico">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar parceiro ou loja"
            aria-label="Buscar parceiro"
          />
        </div>
        <button className={'pz-fav-btn' + (cat === '__fav__' ? ' on' : '')} onClick={() => setCat(cat === '__fav__' ? '' : '__fav__')}>
          ♡ Meus favoritos
        </button>
      </section>

      {/* Filtros */}
      <section className="pz-filters">
        <button className={'pz-pill' + (cat === '' ? ' on' : '')} onClick={() => setCat('')}>Todos</button>
        <button className={'pz-pill' + (cat === '__fav__' ? ' on' : '')} onClick={() => setCat('__fav__')}>Favoritos</button>
        {visibleCats.map((c) => (
          <button key={c} className={'pz-pill' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>
        ))}
        {orderedCats.length > 6 && (
          <button className="pz-pill pz-pill-more" onClick={() => setShowAllCats((v) => !v)}>
            {showAllCats ? 'Menos ▲' : 'Mais ▼'}
          </button>
        )}
      </section>

      {/* Grid */}
      {loading ? (
        <section className="pz-grid">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="pz-pcard pz-skel" />)}
        </section>
      ) : items.length === 0 ? (
        <div className="pz-empty">Nenhum parceiro encontrado{query ? ` para “${query}”` : ''}.</div>
      ) : (
        <section className="pz-grid">
          {items.map((p, i) => (
            <article
              key={p.id}
              className="pz-pcard"
              style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              onClick={() => navigate('/detalhe-parceiro?id=' + p.id)}
              role="button"
            >
              <button
                className={'pz-heart' + (favs.has(p.id) ? ' on' : '')}
                onClick={(e) => toggleFav(p.id, e)}
                aria-label={favs.has(p.id) ? 'Remover favorito' : 'Favoritar'}
              >
                {favs.has(p.id) ? '♥' : '♡'}
              </button>
              <div className="pz-logo">{p.logo_emoji || '◯'}</div>
              <div className="pz-pname">{p.name}</div>
              <div className="pz-pcat">{p.category}</div>
              {p.accrual_rule && <div className="pz-prate">{p.accrual_rule}</div>}
              <button className="pz-buy" onClick={(e) => { e.stopPropagation(); navigate('/detalhe-parceiro?id=' + p.id) }}>
                Comprar →
              </button>
            </article>
          ))}
        </section>
      )}

      {/* Rodapé de benefícios */}
      <section className="pz-benefits">
        <Benefit icon="📈" title="Acumule mais" text="Compre nas melhores lojas e acumule até 12 pts por real." />
        <Benefit icon="💵" title="Cashback" text="Receba parte do valor de volta em pontos." />
        <Benefit icon="⭐" title="Parceiros exclusivos" text="Benefícios reservados para clientes Black." />
        <Benefit icon="🔒" title="Segurança" text="Ambiente protegido e monitorado de ponta a ponta." />
      </section>
    </div>
  )
}

// ---- Subcomponentes ----
function MetricCard(props: {
  label: string
  value: string
  cta?: string
  onCta?: () => void
  note?: string
  warn?: boolean
  accent?: boolean
  dot?: string
  progress?: number
}) {
  return (
    <div className={'pz-mcard' + (props.accent ? ' accent' : '')}>
      <div className="pz-mlabel">
        {props.dot && <span className="pz-mdot" style={{ background: props.dot }} />}
        {props.label}
      </div>
      <div className={'pz-mvalue' + (props.warn ? ' warn' : '')}>{props.value}</div>
      {typeof props.progress === 'number' && (
        <div className="pz-bar"><div className="pz-bar-fill" style={{ width: `${props.progress}%` }} /></div>
      )}
      {props.note && <div className={'pz-mnote' + (props.warn ? ' warn' : '')}>{props.note}</div>}
      {props.cta && <button className="pz-mcta" onClick={props.onCta}>{props.cta}</button>}
    </div>
  )
}

function Benefit({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="pz-bcard">
      <div className="pz-bico">{icon}</div>
      <div className="pz-btitle">{title}</div>
      <div className="pz-btext">{text}</div>
    </div>
  )
}

// ---- Estilos (scoped sob .pz) ----
const CSS = `
.pz{--lime:${LIME};--ink:#1A1A1A;--blk:#050505;--gray:#F6F7F8;--line:#ECEEF1;
  font-family:Inter,-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif;
  color:var(--ink);max-width:1280px}
.pz button{font-family:inherit;cursor:pointer;border:none;background:none}
@keyframes pzfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pzshimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
.pz-skel{background:linear-gradient(90deg,#eef0f2 25%,#f7f8fa 37%,#eef0f2 63%);
  background-size:800px 100%;animation:pzshimmer 1.4s infinite linear;border:none!important}

/* Header */
.pz-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px}
.pz-eyebrow{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8A8F98}
.pz-title{font-size:32px;font-weight:700;letter-spacing:-.02em;margin:6px 0 4px}
.pz-sub{font-size:14px;color:#6B7280;margin:0}
.pz-head-actions{display:flex;align-items:center;gap:10px}
.pz-icon{width:42px;height:42px;border-radius:14px;background:var(--gray);font-size:17px;
  display:grid;place-items:center;transition:.2s}
.pz-icon:hover{background:#ECEEF1;transform:translateY(-1px)}
.pz-avatar{width:42px;height:42px;border-radius:14px;background:var(--blk);color:var(--lime);
  display:grid;place-items:center;font-weight:700;font-size:14px}

/* Métricas */
.pz-metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:22px}
.pz-mcard{background:#fff;border:1px solid var(--line);border-radius:20px;padding:18px 18px 16px;
  min-height:128px;display:flex;flex-direction:column;animation:pzfade .4s both;
  transition:transform .2s,box-shadow .2s}
.pz-mcard:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(5,5,5,.06)}
.pz-mcard.accent{background:linear-gradient(160deg,#0B0B0C,#16170f);border-color:#16170f}
.pz-mcard.accent .pz-mlabel,.pz-mcard.accent .pz-mnote{color:#9aa0a6}
.pz-mcard.accent .pz-mvalue{color:var(--lime)}
.pz-mcard.accent .pz-mcta{color:var(--lime)}
.pz-mlabel{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8A8F98;
  display:flex;align-items:center;gap:6px}
.pz-mdot{width:10px;height:10px;border-radius:50%;display:inline-block}
.pz-mvalue{font-size:26px;font-weight:700;letter-spacing:-.02em;margin-top:8px;line-height:1.1}
.pz-mvalue.warn{color:#C2410C}
.pz-mnote{font-size:12px;color:#6B7280;margin-top:6px}
.pz-mnote.warn{color:#C2410C;font-weight:600}
.pz-mcta{font-size:12.5px;font-weight:600;color:var(--ink);margin-top:auto;padding-top:10px;text-align:left}
.pz-mcta:hover{color:#000;text-decoration:underline}
.pz-bar{height:7px;border-radius:99px;background:#ECEEF1;overflow:hidden;margin-top:10px}
.pz-bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--lime),#a9d400);
  transition:width 1s cubic-bezier(.22,1,.36,1)}

/* Banner */
.pz-banner-wrap{position:relative;margin-bottom:24px}
.pz-banner{height:180px;border-radius:24px;overflow:hidden;display:flex;align-items:center;
  justify-content:space-between;padding:0 40px;cursor:pointer;
  background:radial-gradient(120% 160% at 100% 0%,rgba(89,253,39,.22),transparent 55%),
    linear-gradient(110deg,#050505 40%,#101206);transition:transform .25s}
.pz-banner:hover{transform:translateY(-2px)}
.pz-banner-copy{max-width:62%}
.pz-banner-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:var(--lime);background:rgba(89,253,39,.12);padding:5px 12px;border-radius:99px}
.pz-banner-name{color:#fff;font-size:30px;font-weight:700;letter-spacing:-.02em;margin:12px 0 4px}
.pz-banner-rule{color:#C9CDD2;font-size:14px;margin:0 0 14px}
.pz-banner-btn{display:inline-block;background:var(--lime);color:#0a0a0a;font-weight:700;font-size:13.5px;
  padding:11px 20px;border-radius:99px;transition:.2s}
.pz-banner:hover .pz-banner-btn{box-shadow:0 8px 24px rgba(89,253,39,.32)}
.pz-banner-logo{font-size:96px;line-height:1;filter:drop-shadow(0 12px 28px rgba(0,0,0,.4))}
.pz-arrow{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;
  background:rgba(255,255,255,.14);color:#fff;font-size:22px;display:grid;place-items:center;backdrop-filter:blur(6px)}
.pz-arrow:hover{background:rgba(255,255,255,.26)}
.pz-arrow-l{left:14px}.pz-arrow-r{right:14px}
.pz-dots{position:absolute;bottom:14px;left:40px;display:flex;gap:7px}
.pz-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.35);transition:.2s}
.pz-dot.on{background:var(--lime);width:22px;border-radius:99px}

/* Busca */
.pz-searchbar{display:flex;gap:12px;margin-bottom:18px}
.pz-search{flex:1;height:56px;background:#fff;border:1px solid var(--line);border-radius:18px;
  display:flex;align-items:center;padding:0 18px;gap:10px;transition:.2s}
.pz-search:focus-within{border-color:var(--ink);box-shadow:0 0 0 4px rgba(5,5,5,.05)}
.pz-search-ico{font-size:16px;opacity:.6}
.pz-search input{flex:1;border:none;outline:none;background:none;font-size:15px;color:var(--ink)}
.pz-fav-btn{height:56px;padding:0 22px;border-radius:18px;background:#fff;border:1px solid var(--line);
  font-weight:600;font-size:14px;color:var(--ink);transition:.2s;white-space:nowrap}
.pz-fav-btn:hover{border-color:var(--ink)}
.pz-fav-btn.on{background:var(--blk);color:var(--lime);border-color:var(--blk)}

/* Filtros */
.pz-filters{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:22px}
.pz-pill{padding:9px 16px;border-radius:99px;background:#fff;border:1px solid var(--line);
  font-size:13.5px;font-weight:600;color:#4B5563;transition:.18s}
.pz-pill:hover{border-color:#0a0a0a;color:#0a0a0a;transform:translateY(-1px)}
.pz-pill.on{background:var(--lime);border-color:var(--lime);color:#0a0a0a}
.pz-pill-more{color:#8A8F98}

/* Grid */
.pz-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-bottom:34px}
.pz-pcard{position:relative;background:#fff;border:1px solid var(--line);border-radius:20px;
  padding:22px 18px 18px;display:flex;flex-direction:column;align-items:center;text-align:center;
  animation:pzfade .4s both;transition:transform .22s,box-shadow .22s,border-color .22s}
.pz-pcard:hover{transform:scale(1.03);box-shadow:0 16px 40px rgba(5,5,5,.1);border-color:transparent}
.pz-heart{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;
  background:var(--gray);font-size:15px;color:#9aa0a6;display:grid;place-items:center;transition:.18s}
.pz-heart:hover{background:#ECEEF1}
.pz-heart.on{color:#E5484D;background:rgba(229,72,77,.1)}
.pz-logo{width:64px;height:64px;border-radius:18px;background:var(--gray);display:grid;place-items:center;
  font-size:32px;margin-bottom:12px}
.pz-pname{font-weight:700;font-size:15px;letter-spacing:-.01em}
.pz-pcat{font-size:12px;color:#9aa0a6;margin-top:2px}
.pz-prate{margin-top:10px;font-size:11.5px;font-weight:700;letter-spacing:.02em;color:#5f7a10;
  background:rgba(89,253,39,.18);padding:5px 11px;border-radius:99px}
.pz-buy{margin-top:14px;width:100%;padding:11px;border-radius:13px;background:var(--blk);color:#fff;
  font-weight:600;font-size:13.5px;transition:.2s}
.pz-buy:hover{background:#000;box-shadow:0 8px 22px rgba(5,5,5,.22)}
.pz-empty{padding:48px;text-align:center;color:#9aa0a6;background:#fff;border:1px solid var(--line);
  border-radius:20px;margin-bottom:34px}

/* Benefícios */
.pz-benefits{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:8px}
.pz-bcard{background:var(--gray);border-radius:20px;padding:22px}
.pz-bico{font-size:24px}
.pz-btitle{font-weight:700;font-size:15px;margin:10px 0 4px}
.pz-btext{font-size:13px;color:#6B7280;line-height:1.5}

/* Responsivo */
@media(max-width:1100px){
  .pz-metrics{grid-template-columns:repeat(3,1fr)}
  .pz-grid{grid-template-columns:repeat(3,1fr)}
  .pz-benefits{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:760px){
  .pz-title{font-size:26px}
  .pz-metrics{grid-template-columns:1fr 1fr}
  .pz-grid{grid-template-columns:1fr}
  .pz-banner{padding:0 24px}.pz-banner-name{font-size:24px}.pz-banner-logo{font-size:64px}
  .pz-banner-copy{max-width:70%}
  .pz-searchbar{flex-direction:column}.pz-fav-btn{height:50px}
  .pz-benefits{grid-template-columns:1fr}
}
`
