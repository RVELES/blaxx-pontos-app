// Cartão Blaxx — níveis de cliente (loyalty tiers) + Apple Wallet (.pkpass).
// Mostra o cartão com o nível atual, progresso até o próximo nível, os 4
// níveis do programa e o botão "Adicionar à Apple Wallet" (habilitado só
// quando o servidor tem os certificados Pass Type ID configurados).
import { useEffect, useState } from 'react'
import { Topbar } from '../components/Shell'
import {
  BlaxxAPI,
  ApiError,
  downloadCardPass,
  fmtNumber,
  toast,
  type CardState,
} from '../lib/api-client'

export default function CartaoBlaxx() {
  const [card, setCard] = useState<CardState | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    let alive = true
    BlaxxAPI.card()
      .then((c) => alive && setCard(c))
      .catch((e) => toast('Falha ao carregar o cartão: ' + (e as Error).message, 'error'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  async function handleAddToWallet() {
    setAdding(true)
    try {
      await downloadCardPass()
      toast('Abrindo o cartão na Apple Wallet…', 'success')
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) {
        toast('Apple Wallet ainda não disponível — em breve.', '')
      } else {
        toast('Falha ao gerar o cartão: ' + (e as Error).message, 'error')
      }
    } finally {
      setAdding(false)
    }
  }

  const tier = card?.tier
  const walletAvailable = card?.wallet_pass_available

  return (
    <>
      <Topbar eyebrow="Seu cartão" title="Cartão Blaxx" />

      {loading ? (
        <p className="muted">Carregando…</p>
      ) : !card ? (
        <p className="muted">Não foi possível carregar o cartão.</p>
      ) : (
        <div className="grid cols-2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          {/* Cartão visual com a cor do nível atual — clicável vira pro verso */}
          <div className="col">
            <div
              className={'card-flip' + (flipped ? ' is-flipped' : '')}
              role="button"
              tabIndex={0}
              aria-pressed={flipped}
              aria-label={flipped ? 'Verso do cartão — clique para virar' : 'Frente do cartão — clique para ver o verso'}
              onClick={() => setFlipped((f) => !f)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setFlipped((f) => !f)
                }
              }}
            >
            <div
              className="balance-card card-flip__face card-flip__front"
              style={{
                background: tier?.color || '#0B0B0C',
                color: tier?.text_color || '#fff',
              }}
            >
              <div className="row between">
                <div className="label" style={{ color: tier?.text_color, opacity: 0.85 }}>
                  BlaXx
                </div>
                <div
                  className="chip"
                  style={{
                    background: 'rgba(255,255,255,.14)',
                    color: tier?.text_color,
                    border: '1px solid rgba(255,255,255,.25)',
                  }}
                >
                  {tier?.label}
                </div>
              </div>
              <div className="amount" style={{ marginTop: 18 }}>
                <span>{fmtNumber(card.balance_pts)}</span>
                <span className="unit" style={{ color: tier?.text_color }}>
                  pts
                </span>
              </div>
              <div className="equiv" style={{ color: tier?.text_color, opacity: 0.85 }}>
                {card.member.name} · ID {card.member.id}
              </div>

              {/* Progresso até o próximo nível */}
              {card.next_tier ? (
                <div style={{ marginTop: 18 }}>
                  <div
                    className="row between"
                    style={{ fontSize: 12, color: tier?.text_color, opacity: 0.9 }}
                  >
                    <span>Acumulado: {fmtNumber(card.lifetime_points)} pts</span>
                    <span>
                      Faltam {fmtNumber(card.points_to_next)} p/ {card.next_tier.label}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 99,
                      background: 'rgba(255,255,255,.22)',
                      marginTop: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${card.progress_pct}%`,
                        height: '100%',
                        borderRadius: 99,
                        background: tier?.text_color || '#fff',
                        transition: 'width .4s ease',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{ marginTop: 18, fontSize: 12, color: tier?.text_color, opacity: 0.9 }}
                >
                  Nível máximo · {fmtNumber(card.lifetime_points)} pts acumulados
                </div>
              )}
            </div>
            {/* VERSO — tier + perks listados + cardholder full + dica de flip */}
            <div
              className="balance-card card-flip__face card-flip__back"
              style={{
                background: tier?.color || '#0B0B0C',
                color: tier?.text_color || '#fff',
              }}
            >
              <div className="row between">
                <div className="label" style={{ color: tier?.text_color, opacity: 0.85 }}>
                  BlaXx · {tier?.label || '—'}
                </div>
                <div
                  className="chip"
                  style={{
                    background: 'rgba(255,255,255,.14)',
                    color: tier?.text_color,
                    border: '1px solid rgba(255,255,255,.25)',
                  }}
                >
                  MEMBRO
                </div>
              </div>

              <div style={{ marginTop: 18, fontSize: 12, opacity: 0.88, color: tier?.text_color }}>
                <div style={{ fontWeight: 800, marginBottom: 6, letterSpacing: 0.4, fontSize: 11, textTransform: 'uppercase' }}>
                  Benefícios do nível
                </div>
                {tier?.perks ? (
                  <ul className="card-flip__perks">
                    {tier.perks
                      .split(/[,·;]+/)
                      .map((p) => p.trim())
                      .filter(Boolean)
                      .slice(0, 6)
                      .map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0 }}>Programa de fidelidade BlaXx</p>
                )}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 18, fontSize: 12, opacity: 0.88 }}>
                <div style={{ color: tier?.text_color, opacity: 0.95, fontWeight: 700 }}>
                  {card.member.name}
                </div>
                <div style={{ color: tier?.text_color, opacity: 0.7, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11 }}>
                  ID {card.member.id}
                </div>
              </div>
            </div>
            </div>{/* /card-flip */}

            <button
              className="btn primary mt-6"
              style={{ width: '100%' }}
              disabled={adding || !walletAvailable}
              onClick={(e) => { e.stopPropagation(); handleAddToWallet() }}
              title={
                walletAvailable
                  ? 'Adicionar à Apple Wallet'
                  : 'Apple Wallet em breve'
              }
            >
              {adding
                ? 'Gerando…'
                : walletAvailable
                  ? ' Adicionar à Apple Wallet'
                  : 'Apple Wallet · em breve'}
            </button>
            {!walletAvailable && (
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                O cartão na carteira do iPhone será habilitado assim que o
                certificado da Apple for configurado no servidor.
              </p>
            )}
          </div>

          {/* Catálogo dos 4 níveis */}
          <div className="card">
            <span className="eyebrow">Programa de níveis</span>
            <h3 style={{ marginTop: 2 }}>Como você evolui</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              Seu nível é definido pelos pontos acumulados (vitalício) e nunca
              cai ao resgatar.
            </p>
            <div className="col" style={{ gap: 10, marginTop: 8 }}>
              {card.tiers.map((t) => {
                const active = t.key === tier?.key
                return (
                  <div
                    key={t.key}
                    className="row"
                    style={{
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: active
                        ? '1px solid var(--lime, #59FD27)'
                        : '1px solid rgba(255,255,255,.08)',
                      background: active ? 'rgba(89,253,39,.06)' : 'transparent',
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 99,
                        background: t.color,
                        border: '1px solid rgba(255,255,255,.3)',
                        flex: '0 0 auto',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div className="row between">
                        <strong>{t.label}</strong>
                        <span className="muted" style={{ fontSize: 12 }}>
                          {t.key === 'vip' ? 'Por convite' : `${fmtNumber(t.min_points)}+ pts`}
                        </span>
                      </div>
                      {t.perks && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {t.perks}
                        </div>
                      )}
                    </div>
                    {active && <span className="chip success">atual</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
