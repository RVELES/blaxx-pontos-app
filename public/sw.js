// Service Worker BlaXx — esqueleto mínimo + handler de push.
// Hoje: passthrough de fetch (não cache nada — vamos calibrar com cuidado
// pra não criar inconsistência com saldo/transações). Quando VAPID estiver
// configurada (push-web.ts emite a subscription pro backend), `push` mostra
// notification system; `notificationclick` abre/foca a SPA na rota destino.
const VERSION = 'blaxx-sw-v1'

self.addEventListener('install', (event) => {
  // skipWaiting deixa SWs novos ativarem logo. Em produção, ponderar.
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Push notification — payload JSON do backend: {title, body, url, icon, tag}.
self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload = {}
  try { payload = event.data.json() } catch { payload = { title: 'BlaXx', body: event.data.text() } }
  const {
    title = 'BlaXx',
    body = '',
    url = '/',
    icon = '/blaxx-icon-192.png',
    tag = 'blaxx-default',
  } = payload
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/favicon.png',
      tag,
      data: { url },
    })
  )
})

// Clique em notificação → foca/abre a SPA na URL do payload.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) {
          c.focus()
          if ('navigate' in c) try { c.navigate(target) } catch { /* noop */ }
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    })
  )
})

// fetch passthrough — não cacheia nada por enquanto. Quando ligarmos cache
// runtime, será via Workbox (`workbox-strategies` — network-first pra /api/*).
self.addEventListener('fetch', () => { /* passthrough */ })
