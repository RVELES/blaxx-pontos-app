// Status público — sem RequireAuth. Reflete saúde do backend canônico via
// GET /health (uptime + status). Componentes individuais são heurísticos
// (até termos um endpoint /status detalhado, partimos do princípio de que
// se o /health está ok, o resto está operacional).
import { useEffect, useState } from 'react'
import ThemeToggle from '../components/ThemeToggle'

type Health =
  | { status: 'ok'; service: string; uptime_s: number; timestamp: string }
  | null

interface ComponentStatus {
  name: string
  description: string
  state: 'operational' | 'degraded' | 'down' | 'unknown'
}

function fmtUptime(s: number): string {
  if (s < 60) return `${s} s`
  if (s < 3600) return `${Math.floor(s / 60)} min`
  if (s < 86400) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return `${h}h ${m}min`
  }
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  return `${d}d ${h}h`
}

// Tomamos a mesma URL do backend que o api-client usa, mas batemos
// direto em /health (rota pública, sem auth, fora do prefixo /api).
const BACKEND =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') ||
  'https://blaxx-pontos-exe.onrender.com'

export default function Status() {
  const [health, setHealth] = useState<Health>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [pingMs, setPingMs] = useState<number | null>(null)

  async function fetchHealth() {
    setLoading(true)
    setError('')
    const t0 = performance.now()
    try {
      const res = await fetch(BACKEND + '/health', { credentials: 'omit' })
      const data = (await res.json()) as Health
      setHealth(data)
      setPingMs(Math.round(performance.now() - t0))
    } catch (e) {
      setError((e as Error).message || 'falha ao consultar /health')
      setHealth(null)
      setPingMs(Math.round(performance.now() - t0))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const id = window.setInterval(fetchHealth, 60_000) // refresh 1x/min
    return () => window.clearInterval(id)
  }, [])

  const overall: 'ok' | 'degraded' | 'down' = error
    ? 'down'
    : pingMs !== null && pingMs > 1500
      ? 'degraded'
      : health?.status === 'ok'
        ? 'ok'
        : 'degraded'

  const components: ComponentStatus[] = [
    {
      name: 'API · Backend canônico',
      description: 'Endpoints REST (auth, carteira, parceiros, resgate).',
      state: error ? 'down' : 'operational',
    },
    {
      name: 'Autenticação',
      description: 'Login, cadastro, recuperação de senha, 2FA.',
      state: error ? 'down' : 'operational',
    },
    {
      name: 'Pagamentos PIX',
      description: 'Compra e resgate em homologação (provider MOCK).',
      state: error ? 'down' : 'operational',
    },
    {
      name: 'Notificações',
      description: 'E-mail e in-app. SMS via Twilio (gated por credencial).',
      state: error ? 'down' : 'operational',
    },
    {
      name: 'App Web (Netlify)',
      description: 'SPA + PWA estática + CDN global.',
      state: 'operational',
    },
  ]

  const overallLabel = {
    ok: 'Tudo operando',
    degraded: 'Instabilidade detectada',
    down: 'Indisponível',
  }[overall]

  const overallColor = {
    ok: { bg: '#1A2230', fg: '#59FD27' },
    degraded: { bg: '#3D2B05', fg: '#FACC15' },
    down: { bg: '#3D0A0A', fg: '#FCA5A5' },
  }[overall]

  return (
    <div className="blx-status">
      <ThemeToggle />
      <header className="blx-status__head">
        <span className="blx-status__eyebrow">STATUS PÚBLICO</span>
        <h1>BlaXx Rewards</h1>
        <p className="blx-status__sub">
          Saúde dos sistemas em tempo real. Atualiza a cada minuto.
        </p>
      </header>

      <section
        className="blx-status__overall"
        style={{ background: overallColor.bg, color: overallColor.fg }}
      >
        <div className={`blx-status__dot blx-status__dot--${overall}`} aria-hidden />
        <div>
          <strong>{overallLabel}</strong>
          {pingMs !== null && (
            <span className="blx-status__ping">
              · resposta {pingMs} ms{health ? ` · uptime ${fmtUptime(health.uptime_s)}` : ''}
            </span>
          )}
          {loading && <span className="blx-status__ping"> · checando…</span>}
        </div>
      </section>

      <section className="blx-status__list" aria-label="Componentes">
        {components.map((c) => (
          <article key={c.name} className="blx-status__item">
            <div
              className={`blx-status__dot blx-status__dot--${
                c.state === 'operational'
                  ? 'ok'
                  : c.state === 'degraded'
                    ? 'degraded'
                    : c.state === 'down'
                      ? 'down'
                      : 'unknown'
              }`}
              aria-hidden
            />
            <div className="blx-status__item-body">
              <strong>{c.name}</strong>
              <span>{c.description}</span>
            </div>
            <span className="blx-status__state">
              {{
                operational: 'Operacional',
                degraded: 'Degradado',
                down: 'Indisponível',
                unknown: '—',
              }[c.state]}
            </span>
          </article>
        ))}
      </section>

      <footer className="blx-status__foot">
        <a
          href="https://wa.me/5511924706095?text=Olá! Encontrei um problema no BlaXx."
          target="_blank"
          rel="noopener noreferrer"
        >
          Reportar um problema no WhatsApp →
        </a>
        <span>
          Backend: {BACKEND.replace(/^https?:\/\//, '')}
        </span>
      </footer>
    </div>
  )
}
