// Conquistas — grid de badges com 12 itens em 5 categorias. Estado deriva
// puramente de wallet+card+transactions (BlaxxAPI já existente). Quando o
// backend expuser /badges (persistência + push ao desbloquear), trocamos
// o `evaluate()` por um fetch.
import { useEffect, useMemo, useState } from 'react'
import { BlaxxAPI, asTxArray, type Wallet, type CardState, type Transaction } from '../lib/api-client'
import { Topbar } from '../components/Shell'
import { evaluate, type BadgeState } from '../lib/badges'
import EmptyState from '../components/EmptyState'

export default function Conquistas() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [card, setCard] = useState<CardState | null>(null)
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [w, c, t] = await Promise.allSettled([
        BlaxxAPI.wallet(),
        BlaxxAPI.card(),
        BlaxxAPI.transactions(60),
      ])
      if (!alive) return
      if (w.status === 'fulfilled') setWallet(w.value)
      if (c.status === 'fulfilled') setCard(c.value)
      if (t.status === 'fulfilled') setTxs(asTxArray(t.value))
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  const states = useMemo(() => evaluate({ wallet, card, txs }), [wallet, card, txs])
  const unlocked = states.filter((s) => s.unlocked).length
  const total = states.length

  // Agrupa por categoria mantendo a ordem do catálogo
  const groups: Record<string, BadgeState[]> = {}
  states.forEach((s) => {
    if (!groups[s.def.group]) groups[s.def.group] = []
    groups[s.def.group].push(s)
  })

  return (
    <>
      <Topbar eyebrow="Sua jornada" title="Conquistas" />
      <section className="blx-ach__hero">
        <div>
          <span className="blx-status__eyebrow">CONQUISTAS</span>
          <h2 style={{ margin: '4px 0 6px' }}>
            {unlocked} <span style={{ opacity: 0.55, fontSize: '0.7em' }}>/ {total}</span>
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Cada marco vira badge. Use os pontos pra desbloquear os próximos.
          </p>
        </div>
        <div className="blx-ach__ring" aria-hidden>
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(15,20,25,0.08)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="28" fill="none" stroke="var(--blaxx-lime, #59FD27)"
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(unlocked / total) * (2 * Math.PI * 28)} ${2 * Math.PI * 28}`}
              transform="rotate(-90 32 32)"
            />
          </svg>
        </div>
      </section>

      {loading && (
        <p className="muted" style={{ marginTop: 16 }}>Carregando suas conquistas…</p>
      )}

      {!loading && states.length === 0 && (
        <EmptyState
          icon="🎯"
          title="Sem conquistas calculadas ainda"
          description="Faça sua primeira compra ou indicação pra ver o primeiro badge."
        />
      )}

      {!loading && Object.entries(groups).map(([group, items]) => (
        <section key={group} className="blx-ach__group">
          <h3 className="blx-ach__grouphead">{group}</h3>
          <div className="blx-ach__grid">
            {items.map((s) => (
              <article
                key={s.def.key}
                className={'blx-ach__card' + (s.unlocked ? ' is-unlocked' : '')}
                title={s.def.description}
              >
                <div className="blx-ach__emoji" aria-hidden>{s.def.emoji}</div>
                <strong>{s.def.label}</strong>
                <span className="blx-ach__desc">{s.def.description}</span>
                {!s.unlocked && (
                  <div className="blx-ach__bar" aria-hidden>
                    <span style={{ width: `${s.progress * 100}%` }} />
                  </div>
                )}
                <span className="blx-ach__hint">{s.hint}</span>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
