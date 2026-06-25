// Home — landing pública premium, porta React NATIVA (sem iframe).
// O markup (shell) e o CSS são importados como texto e injetados no próprio
// DOM da SPA; o motor (CONFIG + globo d3) roda a partir de /blaxx-home.js,
// com d3/topojson/world-atlas VENDORIZADOS em /vendor (zero dependência de CDN).
// CTAs (top.location) levam às rotas reais da SPA (/login, /cadastro).
import { useEffect } from 'react'
import shellHtml from '../home/blaxx-home.shell.html?raw'
import homeCss from '../home/blaxx-home.css?raw'
import { BlaxxAPI } from '../lib/api-client'

export default function Home() {
  useEffect(() => {
    // CSS da landing (escopado por id, removido ao desmontar)
    const style = document.createElement('style')
    style.id = 'blaxx-home-css'
    style.textContent = homeCss
    document.head.appendChild(style)

    let cancelled = false
    const injected: HTMLScriptElement[] = []
    const load = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement('script')
        s.src = src
        s.async = false // preserva ordem: d3 → topojson → engine
        s.dataset.blaxxHome = '1'
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('falha ao carregar ' + src))
        document.body.appendChild(s)
        injected.push(s)
      })

    // Deixa a pintura do hero (texto + CTAs) acontecer ANTES de baixar 30+ KB
    // de d3/topojson — o globo é decoração, não bloqueia first-paint.
    // requestIdleCallback espera o browser ficar ocioso; fallback setTimeout
    // para Safari (que ainda não implementa). Também checa prefers-reduced-motion:
    // se o usuário pediu menos movimento, salta o globo inteiro.
    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const startLoad = () => {
      if (cancelled || reducedMotion) return
      ;(async () => {
        try {
          await load('/vendor/d3.min.js')
          await load('/vendor/topojson-client.min.js')
          if (!cancelled) await load('/blaxx-home.js')
        } catch (e) {
          // sem o globo, o resto da página continua funcionando
          console.error('[home] assets do globo:', e)
        }
      })()
    }
    const idleId =
      typeof (window as any).requestIdleCallback === 'function'
        ? (window as any).requestIdleCallback(startLoad, { timeout: 1500 })
        : (window.setTimeout(startLoad, 200) as unknown as number)

    return () => {
      cancelled = true
      if (typeof (window as any).cancelIdleCallback === 'function') {
        try { (window as any).cancelIdleCallback(idleId) } catch { /* noop */ }
      } else {
        window.clearTimeout(idleId)
      }
      style.remove()
      injected.forEach((s) => s.remove())
    }
  }, [])

  // Saldo real do hero: quando há sessão, sobrepõe o número de exibição com o
  // saldo da carteira (reflete pontos creditados após compra PIX). Reaplica em
  // alguns ticks para vencer o engine do globo, que seta o valor demo ao carregar.
  useEffect(() => {
    let stop = false
    const timers: ReturnType<typeof setTimeout>[] = []
    BlaxxAPI.wallet()
      .then((w) => {
        if (stop || !w) return
        const apply = () => {
          const hb = document.getElementById('heroBalance')
          if (hb) hb.textContent = Number(w.balance_pts || 0).toLocaleString('pt-BR')
          const hp = document.getElementById('heroBalancePix')
          if (hp)
            hp.textContent =
              '≈ ' +
              Number(w.balance_brl_equiv || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }) +
              ' disponíveis em Pix'
        }
        apply()
        timers.push(setTimeout(apply, 600), setTimeout(apply, 1600))
      })
      .catch(() => {
        /* deslogado / API indisponível → mantém o número demo do shell */
      })
    return () => {
      stop = true
      timers.forEach(clearTimeout)
    }
  }, [])

  return <div className="blaxx-home-root" dangerouslySetInnerHTML={{ __html: shellHtml }} />
}
