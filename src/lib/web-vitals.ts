// Coleta de Core Web Vitals nativa — sem dependência externa.
// Mede FCP, LCP, CLS, INP, TTFB via PerformanceObserver e devolve a métrica
// pro callback. Quando o cliente plugar Sentry/PostHog, o `report()` muda
// para enviar via fetch beacon; hoje só loga em console + bufferiza em
// localStorage pra inspeção (ex.: console: `JSON.parse(localStorage.blaxx_vitals)`).

export interface VitalSample {
  name: 'FCP' | 'LCP' | 'CLS' | 'INP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  path: string
  ua: string
  ts: number
}

// Thresholds do Google (web.dev/vitals). Usados pra colorir o rating.
const THRESH = {
  FCP:  [1800, 3000],
  LCP:  [2500, 4000],
  CLS:  [0.1,  0.25],
  INP:  [200,  500],
  TTFB: [800,  1800],
} as const

function rate(name: VitalSample['name'], v: number): VitalSample['rating'] {
  const [good, poor] = THRESH[name]
  if (v <= good) return 'good'
  if (v <= poor) return 'needs-improvement'
  return 'poor'
}

function report(s: VitalSample) {
  try {
    const KEY = 'blaxx_vitals'
    const raw = localStorage.getItem(KEY)
    const arr: VitalSample[] = raw ? JSON.parse(raw) : []
    arr.push(s)
    // Mantém só os últimos 50 — não vamos vazar storage.
    while (arr.length > 50) arr.shift()
    localStorage.setItem(KEY, JSON.stringify(arr))
  } catch {
    /* storage indisponível, segue */
  }
  if (import.meta.env.DEV) {
    const color = s.rating === 'good' ? '#22C55E' : s.rating === 'poor' ? '#EF4444' : '#FACC15'
    console.info(
      '%c[vitals] %s%c %s%c %s',
      'color:#6B7280',
      s.name,
      `color:${color};font-weight:bold`,
      s.rating,
      'color:inherit',
      `${Math.round(s.value * 100) / 100} ${s.name === 'CLS' ? '' : 'ms'}`,
    )
  }
}

function observe(type: 'largest-contentful-paint' | 'paint' | 'first-input' | 'layout-shift' | 'event' | 'navigation', cb: (entries: PerformanceEntryList) => void) {
  try {
    const obs = new PerformanceObserver((list) => cb(list.getEntries()))
    obs.observe({ type, buffered: true } as PerformanceObserverInit)
    return obs
  } catch {
    return null
  }
}

export function initWebVitals() {
  const path = location.pathname
  const ua = navigator.userAgent
  const stamp = (name: VitalSample['name'], value: number) =>
    report({ name, value, rating: rate(name, value), path, ua, ts: Date.now() })

  // TTFB — do navigation timing
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav) stamp('TTFB', nav.responseStart)
  } catch { /* noop */ }

  // FCP — primeira pintura de algo visível
  observe('paint', (entries) => {
    for (const e of entries) {
      if (e.name === 'first-contentful-paint') stamp('FCP', e.startTime)
    }
  })

  // LCP — maior elemento; reportamos o último observado antes de hidden.
  let lcp = 0
  observe('largest-contentful-paint', (entries) => {
    const e = entries[entries.length - 1]
    if (e) lcp = e.startTime
  })

  // CLS — soma de layout shifts sem input recente
  let cls = 0
  observe('layout-shift', (entries) => {
    for (const e of entries as unknown as { hadRecentInput: boolean; value: number }[]) {
      if (!e.hadRecentInput) cls += e.value
    }
  })

  // INP aproximado — pega o maior duration de eventos. Não é a fórmula exata
  // da spec (p98 sob carga), mas dá direção pro time saber se UI travou.
  let maxEventDuration = 0
  observe('event', (entries) => {
    for (const e of entries as unknown as { duration: number }[]) {
      if (e.duration > maxEventDuration) maxEventDuration = e.duration
    }
  })

  // No unload (ou pagehide), reporta o que tem
  function flushFinalMetrics() {
    if (lcp) stamp('LCP', lcp)
    stamp('CLS', cls)
    if (maxEventDuration) stamp('INP', maxEventDuration)
  }
  // pagehide é mais confiável que beforeunload em mobile/PWA
  window.addEventListener('pagehide', flushFinalMetrics, { once: true })
  // visibilitychange + hidden cobre tabs sendo trocadas
  document.addEventListener(
    'visibilitychange',
    () => { if (document.visibilityState === 'hidden') flushFinalMetrics() },
    { once: true },
  )
}
