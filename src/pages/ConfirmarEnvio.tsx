// Confirmar envio — port fiel de confirmar-envio.html.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BlaxxAPI, ApiError, fmtNumber, toast } from '../lib/api-client'

interface TransferDraft {
  to?: string
  amount_pts?: number
  message?: string
}

export default function ConfirmarEnvio() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const data: TransferDraft = JSON.parse(sessionStorage.getItem('blaxx_transfer') || '{}')

  async function confirm() {
    if (!password) return toast('Informe sua senha', 'error')
    setSubmitting(true)
    try {
      const r = await BlaxxAPI.transfer({ ...data, password })
      sessionStorage.setItem('blaxx_receipt', JSON.stringify(r))
      navigate('/envio-concluido')
    } catch (e) {
      const err = e as ApiError
      if (err.status === 402 || /saldo/i.test(err.message)) {
        navigate('/saldo-insuficiente')
      } else {
        toast(err.message, 'error', 3200)
        setSubmitting(false)
      }
    }
  }

  return (
    <div className="main center" style={{ minHeight: '70vh' }}>
      <div className="center-wrap">
        <div className="card elevated">
          <span className="eyebrow">Confirmação</span>
          <h3>Revise o envio</h3>
          <div className="card lime mt-4">
            <div className="row between">
              <span>Para</span>
              <strong>{data.to || '—'}</strong>
            </div>
            <div className="row between mt-2">
              <span>Valor</span>
              <strong>{fmtNumber(data.amount_pts || 0)} pts</strong>
            </div>
            {data.message && (
              <div className="row between mt-2">
                <span>Mensagem</span>
                <strong>"{data.message}"</strong>
              </div>
            )}
          </div>
          <div className="field mt-6">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirm()}
            />
          </div>
          <button className="btn primary lg block" onClick={confirm} disabled={submitting}>
            {submitting ? 'Enviando…' : 'Confirmar envio'}
          </button>
          <button className="btn link block mt-2" onClick={() => navigate('/enviar-pontos')}>
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
