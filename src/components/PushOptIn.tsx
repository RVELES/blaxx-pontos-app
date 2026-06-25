// Prompt suave de opt-in pra Web Push. Aparece como sheet no canto inferior
// direito (acima do HelpFAB) após 2ª visita E permission==='default' E
// VAPID configurada. Se usuário recusar, marca dismiss permanente.
import { useEffect, useState } from 'react'
import {
  bumpVisitCounter,
  dismissPushPrompt,
  registerServiceWorker,
  shouldShowPushPrompt,
  subscribePush,
} from '../lib/push-web'
import { api, toast } from '../lib/api-client'

export default function PushOptIn() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // Registra SW logo no mount (idempotente — navigator.serviceWorker.register
    // resolve com a registration existente se já tiver).
    void registerServiceWorker()
    // Conta visita. Não bloqueia.
    bumpVisitCounter()
    // Decide se mostra (assíncrono — depende do estado do SW).
    void shouldShowPushPrompt().then((show) => setOpen(show))
  }, [])

  async function enable() {
    setBusy(true)
    try {
      const sub = await subscribePush()
      if (!sub) {
        toast('Permissão recusada — tudo bem, voltamos depois.', 'success')
        dismissPushPrompt()
        setOpen(false)
        return
      }
      // Manda pro backend; o endpoint /push/subscribe pode ainda não existir
      // (gated por VAPID_PRIVATE_KEY no servidor). Tratar 404 como "ok local".
      try {
        await api('/push/subscribe', { method: 'POST', body: sub })
        toast('Notificações ativadas. Você vai receber só o que importa.', 'success')
      } catch (e) {
        const err = e as { status?: number }
        if (err.status === 404 || err.status === 503) {
          toast('Notificações ativadas no dispositivo. Servidor ainda em preparo.', 'success')
        } else {
          throw e
        }
      }
      setOpen(false)
    } catch (e) {
      toast('Não consegui ativar agora. Tente em Segurança → Notificações.', 'error')
    } finally {
      setBusy(false)
    }
  }

  function dismiss() {
    dismissPushPrompt()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="blx-push" role="dialog" aria-label="Ativar notificações">
      <div className="blx-push__icon" aria-hidden>🔔</div>
      <div className="blx-push__body">
        <strong>Receber avisos importantes?</strong>
        <p>Saldo creditado, resgate aprovado, campanhas. Você escolhe — pode desligar a hora que quiser.</p>
      </div>
      <div className="blx-push__actions">
        <button className="blx-push__btn ghost" onClick={dismiss} disabled={busy}>Agora não</button>
        <button className="blx-push__btn primary" onClick={enable} disabled={busy}>
          {busy ? 'Ativando…' : 'Ativar'}
        </button>
      </div>
    </div>
  )
}
