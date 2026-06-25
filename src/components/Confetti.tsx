// Confetti minimalista — partículas lime saindo do topo do hero e caindo.
// Sem dependência externa: 60 spans absolutos + keyframes CSS. Respeita
// prefers-reduced-motion (não renderiza nada) E a pref `celebrations` do
// usuário (CELEB-OPT). Auto-stop em 2.4s.
import { useEffect, useState } from 'react'
import { getPrefs } from '../lib/preferences'

interface Props {
  /** Quantas partículas. Default 60. */
  count?: number
  /** Duração (ms) antes de tirar do DOM. Default 2400. */
  durationMs?: number
  /** Paleta — default lime + tints. */
  colors?: string[]
}

const DEFAULT_COLORS = ['#59FD27', '#5AB800', '#D9FF66', '#FFFFFF', '#FFD700']

export default function Confetti({
  count = 60,
  durationMs = 2400,
  colors = DEFAULT_COLORS,
}: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // 2 sinais que cancelam celebrações: OS reduced-motion + opt-out do user.
    // Default da pref é true; só quem desliga manualmente nas configurações
    // não verá confetti.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || !getPrefs().celebrations) {
      setVisible(false)
      return
    }
    const t = window.setTimeout(() => setVisible(false), durationMs)
    return () => window.clearTimeout(t)
  }, [durationMs])

  if (!visible) return null

  return (
    <div className="blx-confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const color = colors[i % colors.length]
        const left = (i / count) * 100 + (Math.random() * 6 - 3)
        const delay = Math.random() * 0.4
        const dur = 1.6 + Math.random() * 0.9
        const rot = Math.random() * 360
        const drift = (Math.random() - 0.5) * 80
        const size = 6 + Math.random() * 6
        return (
          <span
            key={i}
            className="blx-confetti__piece"
            style={
              {
                left: `${left}%`,
                background: color,
                width: `${size}px`,
                height: `${size * 0.5}px`,
                ['--drift' as any]: `${drift}px`,
                ['--rot' as any]: `${rot}deg`,
                animation: `blx-confetti-fall ${dur}s cubic-bezier(0.2, 0.7, 0.4, 1) ${delay}s forwards`,
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
