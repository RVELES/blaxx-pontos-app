// AuthLayout — moldura branded (split-screen) para todas as telas não logadas
// de autenticação (login, cadastro, recuperar/redefinir senha, validação).
// Painel esquerdo: marca + provas sociais sobre fundo preto com acento limão.
// Painel direito: o card do formulário (children).
import { Link } from 'react-router-dom'
import { BlaxxLockup } from './BlaxxBrand'

type Highlight = { ico: string; text: string }

const DEFAULT_HIGHLIGHTS: Highlight[] = [
  { ico: '✦', text: 'Carteira criada na hora, sem mensalidade' },
  { ico: '✈', text: 'Troque por vouchers, milhas e cashback no Pix' },
  { ico: '⚡', text: 'Pontos creditados em até 24h, sem mensalidade' },
]

export default function AuthLayout({
  children,
  eyebrow = 'Sua carteira de pontos',
  title = 'Bem-vindo à Blaxx',
  lead = 'Junte pontos no dia a dia e troque pelo que você quiser.',
  highlights = DEFAULT_HIGHLIGHTS,
}: {
  children: React.ReactNode
  eyebrow?: string
  title?: string
  lead?: string
  highlights?: Highlight[]
}) {
  return (
    <div className="auth">
      <style>{css}</style>

      {/* ---------- Painel de marca ---------- */}
      <aside className="auth__brandpane">
        <div className="auth__brandtop">
          <Link to="/" className="auth__home" aria-label="Voltar para a home">
            <span aria-hidden="true">←</span> Voltar ao site
          </Link>
          <BlaxxLockup className="auth__logo" height={132} tone="light" />
        </div>

        <div className="auth__brandbody">
          <span className="auth__eyebrow">{eyebrow}</span>
          <h2 className="auth__title">{title}</h2>
          <p className="auth__lead">{lead}</p>

          <ul className="auth__highlights">
            {highlights.map((h) => (
              <li key={h.text}>
                <span className="auth__hico" aria-hidden="true">{h.ico}</span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="auth__brandfoot">
          <span className="auth__stars">★★★★★</span>
          Mais de <b>1 milhão</b> de resgates realizados
        </div>
      </aside>

      {/* ---------- Painel do formulário ---------- */}
      <main className="auth__formpane">
        <div className="auth__formwrap">
          <Link to="/" className="auth__home auth__home--mobile" aria-label="Voltar para a home">
            <BlaxxLockup height={72} tone="dark" />
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}

const css = `
.auth { display: grid; grid-template-columns: 1.05fr 1fr; min-height: 100vh; background: var(--bg); }

/* Painel de marca (esquerda) */
.auth__brandpane {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 40px 48px; color: var(--blaxx-white);
  background:
    radial-gradient(120% 90% at 100% 0%, rgba(89,253,39,.16), transparent 55%),
    radial-gradient(90% 80% at 0% 100%, rgba(89,253,39,.10), transparent 50%),
    var(--blaxx-black);
}
.auth__brandpane::after {
  content: ''; position: absolute; right: -120px; bottom: -120px;
  width: 360px; height: 360px; border-radius: 50%;
  border: 1px solid rgba(89,253,39,.18);
}
.auth__brandtop { display: flex; flex-direction: column; gap: 28px; position: relative; z-index: 1; }
.auth__logo { align-self: flex-start; }
.auth__home {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  font-size: 13px; font-weight: 600; color: rgba(255,255,255,.7);
  text-decoration: none; transition: color .15s ease;
}
.auth__home:hover { color: var(--blaxx-lime); }

.auth__brandbody { position: relative; z-index: 1; max-width: 440px; }
.auth__eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 700;
  letter-spacing: .16em; text-transform: uppercase; color: var(--blaxx-lime);
}
.auth__title {
  font-family: var(--font-display); font-weight: 800; font-size: 40px;
  line-height: 1.06; letter-spacing: -.02em; margin: 14px 0 14px;
  color: var(--blaxx-white);
}
.auth__lead { font-size: 16px; line-height: 1.6; color: rgba(255,255,255,.72); margin: 0 0 30px; }
.auth__highlights { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.auth__highlights li {
  display: flex; align-items: center; gap: 12px;
  font-size: 14.5px; color: rgba(255,255,255,.9);
}
.auth__hico {
  flex: none; display: grid; place-items: center; width: 30px; height: 30px;
  border-radius: 9px; background: rgba(89,253,39,.14); color: var(--blaxx-lime);
  font-size: 15px;
}
.auth__brandfoot { position: relative; z-index: 1; font-size: 13px; color: rgba(255,255,255,.6); }
.auth__brandfoot b { color: var(--blaxx-white); }
.auth__stars { color: var(--blaxx-lime); letter-spacing: 2px; margin-right: 8px; }

/* Painel do formulário (direita) */
.auth__formpane { display: flex; align-items: center; justify-content: center; padding: 48px 24px; }
.auth__formwrap { width: 100%; max-width: 420px; }
.auth__home--mobile { display: none; justify-content: center; margin-bottom: 24px; }
.auth__home--mobile img { height: 72px; }

/* O card herdado dos formulários ganha respiro extra */
.auth__formwrap .card { width: 100%; }

/* Responsivo: esconde painel de marca, mostra logo no topo do form */
@media (max-width: 860px) {
  .auth { grid-template-columns: 1fr; }
  .auth__brandpane { display: none; }
  .auth__home--mobile { display: flex; }
}
`
