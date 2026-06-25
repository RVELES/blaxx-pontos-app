// Web Push — registra service worker e oferece opt-in suave.
// Gated: só pede permissão se VITE_VAPID_PUBLIC_KEY estiver setada E for a
// 2ª+ visita (evita o anti-padrão de pop-up imediato). A subscription é
// enviada pra /push/subscribe no backend, que precisa de VAPID_PRIVATE_KEY
// pra de fato disparar pushes — sem credencial, o fluxo fica em prontidão.

const VAPID_PUB = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || ''
const VISIT_KEY = 'blaxx_visit_count'
const PUSH_PROMPT_DISMISSED = 'blaxx_push_dismissed'

/** Converte VAPID base64url → Uint8Array (formato exigido pelo PushManager). */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    // sw.js está em /public — Vite copia pra raiz do build.
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch (err) {
    console.warn('[push] SW register falhou:', err)
    return null
  }
}

/** Incrementa contador de visita; usado pra atrasar o prompt de push. */
export function bumpVisitCounter(): number {
  try {
    const n = (Number(localStorage.getItem(VISIT_KEY)) || 0) + 1
    localStorage.setItem(VISIT_KEY, String(n))
    return n
  } catch {
    return 1
  }
}

export interface PushReadiness {
  /** SW registrado e API suportada. */
  ready: boolean
  /** VAPID disponível (env var setada). */
  configured: boolean
  /** Estado da permission do usuário. */
  permission: NotificationPermission | 'unsupported'
  /** True se já existe subscription ativa. */
  subscribed: boolean
}

export async function getPushReadiness(): Promise<PushReadiness> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ready: false, configured: false, permission: 'unsupported', subscribed: false }
  }
  const reg = await navigator.serviceWorker?.getRegistration()
  let subscribed = false
  if (reg) {
    const sub = await reg.pushManager.getSubscription()
    subscribed = !!sub
  }
  return {
    ready: !!reg,
    configured: !!VAPID_PUB,
    permission: Notification.permission,
    subscribed,
  }
}

/** Pede permissão e cria subscription. Devolve a subscription serializável
 *  pra mandar ao backend (/push/subscribe). Retorna null se cancelado/erro. */
export async function subscribePush(): Promise<PushSubscriptionJSON | null> {
  if (!VAPID_PUB) {
    console.warn('[push] VITE_VAPID_PUBLIC_KEY ausente — fluxo desligado.')
    return null
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return null
  // applicationServerKey precisa ser BufferSource com ArrayBuffer (não SAB).
  // Copiamos pra um ArrayBuffer fresh pra satisfazer o tipo no lib.dom mais novo.
  const keyBytes = urlBase64ToUint8Array(VAPID_PUB)
  const keyBuf = keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBuf,
  })
  return sub.toJSON()
}

export function dismissPushPrompt() {
  try { localStorage.setItem(PUSH_PROMPT_DISMISSED, String(Date.now())) } catch { /* noop */ }
}
export function wasPushDismissed(): boolean {
  try { return !!localStorage.getItem(PUSH_PROMPT_DISMISSED) } catch { return false }
}

/** Heurística de quando mostrar o prompt suave do BlaXx:
 *  - SW registrado
 *  - VAPID configurada (env)
 *  - permission ainda em "default" (não negada nem aceita)
 *  - 2ª+ visita
 *  - usuário não dismissou prompt antes
 */
export async function shouldShowPushPrompt(): Promise<boolean> {
  const r = await getPushReadiness()
  if (!r.ready || !r.configured) return false
  if (r.permission !== 'default') return false
  if (wasPushDismissed()) return false
  const visits = Number(localStorage.getItem(VISIT_KEY) || 0)
  return visits >= 2
}
