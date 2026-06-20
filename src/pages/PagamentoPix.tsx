// Pagamento PIX — port fiel de pagamento-pix.html (QR, copia-e-cola, countdown, simular pagamento).
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Shell'
import { BlaxxAPI, fmtBRL, fmtNumber, toast, type PixCharge } from '../lib/api-client'

export default function PagamentoPix() {
  const navigate = useNavigate()
  const [charge, setCharge] = useState<PixCharge | null>(null)
  const [exp, setExp] = useState('30 min')
  const [simulating, setSimulating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('blaxx_charge')
    const c = raw ? (JSON.parse(raw) as PixCharge) : null
    if (!c?.id) {
      toast('Cobrança não encontrada', 'error')
      setTimeout(() => navigate('/comprar-pontos'), 1200)
      return
    }
    setCharge(c)

    if (c.expires_at) {
      const end = new Date(c.expires_at).getTime()
      const tick = () => {
        const ms = end - Date.now()
        if (ms <= 0) {
          setExp('Expirado')
          return
        }
        const m = Math.floor(ms / 60000)
        const s = Math.floor((ms % 60000) / 1000)
        setExp(`${m}min ${String(s).padStart(2, '0')}s`)
        timerRef.current = setTimeout(tick, 1000)
      }
      tick()
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [navigate])

  // Polling de status: quando o pagamento é confirmado (webhook do provedor
  // OU confirmação manual do admin), a tela avança sozinha para a aprovação —
  // sem depender do botão "Simular". Sonda a cada 5s.
  useEffect(() => {
    const id = charge?.id
    if (!id) return
    let alive = true
    const poll = setInterval(async () => {
      try {
        const c = await BlaxxAPI.pixChargeStatus(id)
        if (!alive) return
        if (c?.status === 'paid') {
          clearInterval(poll)
          toast('Pagamento confirmado!', 'success')
          setTimeout(() => navigate('/compra-aprovada?id=' + id), 700)
        } else if (c?.status === 'rejected' || c?.status === 'expired') {
          clearInterval(poll)
          toast('Cobrança ' + (c.status === 'expired' ? 'expirada' : 'rejeitada') + '.', 'error')
        }
      } catch {
        /* erro transitório — tenta de novo no próximo tick */
      }
    }, 5000)
    return () => {
      alive = false
      clearInterval(poll)
    }
  }, [charge?.id, navigate])

  function copy() {
    navigator.clipboard.writeText(charge?.br_code || '').then(() => toast('Código copiado'))
  }

  async function simulate() {
    if (!charge) return
    setSimulating(true)
    try {
      await BlaxxAPI.pixSimulatePayment(charge.id)
      toast('Pagamento confirmado!', 'success')
      setTimeout(() => navigate('/compra-aprovada?id=' + charge.id), 700)
    } catch (e) {
      toast('Falha: ' + (e as Error).message, 'error')
      setSimulating(false)
    }
  }

  return (
    <>
      <Topbar eyebrow="Pagamento" title="Aguardando PIX" />

      <div className="grid cols-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card center-text">
          <span className="eyebrow">Escaneie</span>
          <h3>QR Code PIX</h3>
          {charge?.qr_code_image ? (
            <div className="qr-box mt-4" style={{ padding: 12 }}>
              <img
                src={charge.qr_code_image}
                alt="QR Code PIX"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div className="qr-box mt-4">
              {charge ? 'QR indisponível — use o copia-e-cola' : 'Gerando…'}
            </div>
          )}
          <p className="muted mt-4" style={{ fontSize: 13 }}>
            Abra o app do seu banco e aponte para o QR.
          </p>
        </div>

        <div className="card">
          <span className="eyebrow">Ou cole o código</span>
          <h3>PIX copia-e-cola</h3>
          <div className="copy-box mt-4">{charge?.br_code || '…'}</div>
          <button className="btn dark block mt-4" onClick={copy}>
            Copiar código
          </button>
          <div className="divider"></div>
          <div className="row between">
            <span>Valor</span>
            <strong>{charge ? fmtBRL(charge.amount_brl) : '—'}</strong>
          </div>
          <div className="row between mt-2">
            <span>Pontos</span>
            <strong>{charge ? fmtNumber(charge.points_to_credit || 0) + ' pts' : '—'}</strong>
          </div>
          <div className="row between mt-2">
            <span>Expira em</span>
            <strong>{exp}</strong>
          </div>
          <button className="btn primary block mt-6" onClick={simulate} disabled={simulating}>
            {simulating ? 'Confirmando…' : 'Simular pagamento (demo)'}
          </button>
          <p
            className="muted center-text mt-2"
            style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            Em produção: webhook do gateway credita automaticamente
          </p>
        </div>
      </div>
    </>
  )
}
