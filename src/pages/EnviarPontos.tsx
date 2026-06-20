// Enviar pontos — port fiel de enviar-pontos.html.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Shell'
import { toast } from '../lib/api-client'

export default function EnviarPontos() {
  const navigate = useNavigate()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  function next() {
    const t = to.trim()
    const amt = parseInt(amount || '0', 10)
    if (!t) return toast('Informe o destinatário', 'error')
    if (amt < 100) return toast('Mínimo 100 pts', 'error')
    if (amt > 50000) return toast('Máximo 50.000 pts/dia', 'error')
    sessionStorage.setItem(
      'blaxx_transfer',
      JSON.stringify({ to: t, amount_pts: amt, message: message.trim() }),
    )
    navigate('/confirmar-envio')
  }

  return (
    <>
      <Topbar eyebrow="Envio P2P" title="Enviar pontos" />

      <div className="grid cols-2" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <div className="card">
          <span className="eyebrow">Presente para alguém</span>
          <h3>Enviar pontos</h3>
          <p className="subtitle">Mínimo 100 pts · máximo 50.000 pts por dia.</p>

          <div className="field">
            <label>Destinatário (e-mail ou CPF)</label>
            <input
              type="text"
              placeholder="lucas@blaxx.com ou 987.654.321-00"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Quantos pontos?</label>
            <input
              type="number"
              min={100}
              max={50000}
              step={100}
              placeholder="2000"
              autoComplete="off"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Mensagem (opcional)</label>
            <input
              type="text"
              maxLength={140}
              placeholder="Obrigado!"
              autoComplete="off"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button className="btn primary lg block" onClick={next}>
            Continuar
          </button>
        </div>

        <div className="card lime">
          <span className="eyebrow">Como funciona</span>
          <h3 style={{ marginBottom: 8 }}>Transferência atômica</h3>
          <p style={{ color: 'var(--gray-800)', fontSize: 14 }}>
            O envio acontece numa única transação no ledger: ou os pontos saem de você e entram no
            destinatário ao mesmo tempo, ou nada acontece. Em caso de falha, seu saldo é preservado
            integralmente.
          </p>
          <div className="divider"></div>
          <span className="eyebrow">Limites</span>
          <p style={{ color: 'var(--gray-800)', fontSize: 14, margin: 0 }}>
            • Mínimo: 100 pts
            <br />• Máximo diário: 50.000 pts
            <br />• Os pontos preservam a validade original
          </p>
        </div>
      </div>
    </>
  )
}
