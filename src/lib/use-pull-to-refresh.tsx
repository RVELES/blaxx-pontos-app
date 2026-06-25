// usePullToRefresh — só ativa em mobile (touch). Detecta swipe vertical
// no topo da janela e dispara o callback ao soltar acima do threshold.
//
// Filosofia: nada de scroll-jacking. Se o usuário já scrollou pra dentro
// do conteúdo, ignora. Se ainda está no topo (scrollY === 0), captura.
import { useCallback, useEffect, useRef, useState } from 'react'

const THRESHOLD_PX = 64
const MAX_PULL_PX = 110

export interface PullState {
  /** 0..1 — quão "puxado" está; usar pra animar o indicador. */
  progress: number
  /** True enquanto a refresh callback está executando. */
  refreshing: boolean
}

export function usePullToRefresh(onRefresh: () => Promise<void> | void): PullState {
  const [progress, setProgress] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  // Evita re-disparar enquanto a callback ainda roda
  const lock = useRef(false)

  const trigger = useCallback(async () => {
    if (lock.current) return
    lock.current = true
    setRefreshing(true)
    try { await onRefresh() } finally {
      setRefreshing(false)
      setProgress(0)
      lock.current = false
    }
  }, [onRefresh])

  useEffect(() => {
    // Só faz sentido com touch — desktop ignora (usa F5 ou o botão de refresh).
    if (typeof window === 'undefined' || !('ontouchstart' in window)) return

    function onStart(e: TouchEvent) {
      if (window.scrollY > 0 || lock.current) return
      startY.current = e.touches[0]?.clientY ?? null
    }

    function onMove(e: TouchEvent) {
      if (startY.current === null) return
      const dy = (e.touches[0]?.clientY ?? 0) - startY.current
      if (dy <= 0) { setProgress(0); return }
      // Resistência: o pull fica mais difícil conforme avança
      const eased = Math.min(MAX_PULL_PX, dy * 0.6)
      setProgress(eased / THRESHOLD_PX)
      if (dy > 12) e.preventDefault?.()  // evita scroll-bounce iOS
    }

    function onEnd() {
      if (startY.current === null) { setProgress(0); return }
      const fired = progress >= 1
      startY.current = null
      if (fired) void trigger()
      else setProgress(0)
    }

    // passive:false em touchmove pra poder preventDefault sem warning
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [progress, trigger])

  return { progress, refreshing }
}

/** Indicador visual — coloque uma vez no Shell ou na rota que usa o hook. */
export function PullToRefreshIndicator({ state }: { state: PullState }) {
  const { progress, refreshing } = state
  if (progress === 0 && !refreshing) return null
  const ready = progress >= 1 || refreshing
  return (
    <div
      className="blx-ptr"
      style={{
        opacity: Math.min(1, progress * 1.4),
        transform: `translateY(${Math.min(MAX_PULL_PX, progress * THRESHOLD_PX) - 30}px) rotate(${progress * 360}deg)`,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <circle
          cx="12" cy="12" r="9"
          stroke="currentColor"
          strokeWidth="2.4"
          fill="none"
          strokeDasharray={`${Math.PI * 18 * Math.min(1, progress)} ${Math.PI * 18}`}
          strokeLinecap="round"
          transform="rotate(-90 12 12)"
        />
        {ready && (
          <path
            d="M9 12l2.5 2.5L16 9.5"
            stroke="currentColor"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  )
}
