// Central de notificações — port fiel de central-notificacoes.html (lista + marcar lida(s)).
import { useCallback, useEffect, useState } from 'react'
import { BlaxxAPI, Notification, fmtDateTime, toast } from '../lib/api-client'
import { Topbar } from '../components/Shell'

function bgFor(type?: string): string {
  switch (type) {
    case 'purchase':
    case 'campaign':
    case 'voucher':
    case 'transfer_in':
      return 'var(--blaxx-lime)'
    case 'expiration':
      return 'var(--warning)'
    case 'system':
    default:
      return 'var(--blaxx-black)'
  }
}
function fgFor(type?: string): string {
  return bgFor(type) === 'var(--blaxx-lime)' ? 'var(--blaxx-black)' : 'var(--blaxx-lime)'
}

export default function CentralNotificacoes() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const d = await BlaxxAPI.notifications()
      setItems(d.items || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function markRead(id: string) {
    try {
      await BlaxxAPI.notificationRead(id)
    } catch {
      /* silencioso */
    }
    load()
  }

  async function readAll() {
    try {
      await BlaxxAPI.notificationsReadAll()
      toast('Marcadas como lidas', 'success')
      load()
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  return (
    <>
      <Topbar eyebrow="Central" title="Notificações" />
      <div className="card">
        <div className="row between mb-4">
          <div>
            <span className="eyebrow">Avisos</span>
            <h3 style={{ margin: 0 }}>Suas notificações</h3>
          </div>
          <button className="btn ghost" onClick={readAll}>
            Marcar todas como lidas
          </button>
        </div>

        {error ? (
          <p className="muted">Erro: {error}</p>
        ) : loading ? (
          <p className="muted">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="muted">Sem notificações por enquanto.</p>
        ) : (
          <div className="col">
            {items.map((n) => (
              <div
                key={n.id}
                className="row"
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  ...(n.is_read ? {} : { background: 'rgba(124,255,0,0.06)' }),
                }}
                onClick={() => markRead(n.id)}
              >
                <div
                  className="avatar"
                  style={{ background: bgFor(n.type), color: fgFor(n.type), flexShrink: 0 }}
                >
                  {n.icon || '!'}
                </div>
                <div style={{ flex: 1 }}>
                  <strong>
                    {n.title}
                    {n.is_read ? '' : ' •'}
                  </strong>
                  <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
                    {n.body || ''}
                  </p>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: 11 }}>
                    {fmtDateTime(n.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
