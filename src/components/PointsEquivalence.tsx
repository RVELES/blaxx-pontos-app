// "Pontos viram…" — tag dinâmica sob o saldo. Mostra equivalências reais
// (PIX, noite Marriott, voo SP→RJ, etc.) e rotaciona suavemente.
// Storytelling > número seco: usuário entende o valor sem precisar abrir o
// catálogo. Referência: Amex MR ("R$X em pontos = noite em hotel premium").
import { useEffect, useMemo, useState } from 'react'

// 1 ponto BlaXx ≈ R$ 0,09 conforme FAQ pública (Home.tsx → blaxx-home.css).
// Mantemos a tabela aqui para evitar mais um fetch — calibrar quando o backend
// expor /exchange/rate.
const RATE_BRL_PER_PT = 0.09

// "Coisas" que o usuário pode comprar. Custo aproximado em BRL → divide pelo
// rate pra saber quantos pontos por unidade. Ordem importa só pra rotação.
type Thing = { emoji: string; label: string; brl: number }
const THINGS: Thing[] = [
  { emoji: '💸', label: 'em Pix',             brl: 0   },  // caso especial: cashback 1:1
  { emoji: '🏨', label: 'noite Marriott',     brl: 380 },
  { emoji: '✈️', label: 'voo SP → RJ',        brl: 280 },
  { emoji: '🍽️', label: 'jantar a dois',      brl: 220 },
  { emoji: '🎬', label: 'sessões de cinema',  brl: 40  },
  { emoji: '🚖', label: 'corridas Uber',      brl: 35  },
  { emoji: '☕', label: 'cafés especiais',    brl: 18  },
]

interface Props {
  balancePts: number
  balanceBrl?: number  // se já vier do /wallet/, evita recomputar
  /** Quantas equivalências rodam ao mesmo tempo (default 1). */
  visibleCount?: number
  className?: string
}

export default function PointsEquivalence({
  balancePts,
  balanceBrl,
  visibleCount = 1,
  className,
}: Props) {
  // Calcula equivalências quantizadas (ex.: "3 noites", "12 voos") só pras
  // que o usuário consegue pagar com o saldo atual; ignora as outras.
  const pieces = useMemo(() => {
    const out: string[] = []
    const brl = balanceBrl ?? balancePts * RATE_BRL_PER_PT
    // 1) Pix sempre que tiver saldo positivo
    if (brl > 0.5) {
      out.push(
        '💸 ' +
          brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) +
          ' em Pix',
      )
    }
    // 2) Itens com custo > 0 — divide e mostra quantidade (mínimo 1)
    for (const t of THINGS) {
      if (t.brl <= 0) continue
      const ptsPorUnidade = Math.ceil(t.brl / RATE_BRL_PER_PT)
      const qt = Math.floor(balancePts / ptsPorUnidade)
      if (qt >= 1) {
        out.push(`${t.emoji} ${qt.toLocaleString('pt-BR')} ${t.label}`)
      }
    }
    return out
  }, [balancePts, balanceBrl])

  // Rotação: troca de equivalência a cada 3s (respeitando reduced motion).
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (pieces.length <= visibleCount) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return  // não rotaciona se usuário pediu menos movimento
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % pieces.length),
      3200,
    )
    return () => window.clearInterval(id)
  }, [pieces.length, visibleCount])

  if (pieces.length === 0) return null

  // Slice circular com `visibleCount` itens a partir de idx
  const showing: string[] = []
  for (let k = 0; k < Math.min(visibleCount, pieces.length); k++) {
    showing.push(pieces[(idx + k) % pieces.length])
  }

  return (
    <div
      className={'blx-equiv ' + (className || '')}
      aria-live="polite"
      title="O que seus pontos viram"
    >
      <span className="blx-equiv__lead">≈</span>
      {showing.map((s, i) => (
        <span key={i} className="blx-equiv__chip">
          {s}
        </span>
      ))}
    </div>
  )
}
