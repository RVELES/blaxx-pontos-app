// Carteira — port fiel de blaxx_exe/renderer/screens/carteira.html.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Shell'
import {
  BlaxxAPI,
  asTxArray,
  fmtBRL,
  fmtDateTime,
  fmtNumber,
  toast,
  type Transaction,
  type Wallet,
} from '../lib/api-client'

function statusChip(s: string): string {
  if (s === 'confirmed') return 'success'
  if (s === 'reversed') return 'danger'
  return 'warning'
}

export default function Carteira() {
  const navigate = useNavigate()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const w = await BlaxxAPI.wallet()
        if (!alive) return
        setWallet(w)
        const t = await BlaxxAPI.transactions(10)
        if (!alive) return
        setTxs(asTxArray(t))
      } catch (e) {
        toast('Falha: ' + (e as Error).message, 'error')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <Topbar eyebrow="Sua carteira" title="Carteira" />

      <div className="grid cols-2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="balance-card">
          <div className="label">Saldo disponível</div>
          <div className="amount">
            <span>{wallet ? fmtNumber(wallet.balance_pts) : '—'}</span>
            <span className="unit">pts</span>
          </div>
          <div className="equiv">
            Equivalente a {wallet ? fmtBRL(wallet.balance_brl_equiv) : 'R$ —'} em cashback (após 6
            meses)
          </div>
          <div className="row mt-6">
            <button className="btn primary" onClick={() => navigate('/comprar-pontos')}>
              Comprar
            </button>
            <button
              className="btn ghost"
              style={{ borderColor: 'rgba(255,255,255,.18)', color: '#fff' }}
              onClick={() => navigate('/enviar-pontos')}
            >
              Enviar
            </button>
            <button
              className="btn ghost"
              style={{ borderColor: 'rgba(255,255,255,.18)', color: '#fff' }}
              onClick={() => navigate('/vender-pontos')}
            >
              Resgatar
            </button>
          </div>
        </div>

        <div className="col">
          <div className="card metric">
            <span className="label">Pontos pendentes</span>
            <div className="value">+{wallet ? fmtNumber(wallet.pending_pts || 0) : '—'}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              cobranças aguardando pagamento
            </div>
          </div>
          <div className="card metric">
            <span className="label">Validade próxima</span>
            <div className="value">12 meses</div>
            <div className="muted" style={{ fontSize: 12 }}>
              consumo FIFO: pontos mais antigos primeiro
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-8">
        <div className="row between mb-4">
          <div>
            <span className="eyebrow">Extrato</span>
            <h3 style={{ margin: 0 }}>Últimas movimentações</h3>
          </div>
          <a className="btn ghost" onClick={() => navigate('/extrato')}>
            Ver tudo
          </a>
        </div>
        {loading ? (
          <p className="muted">Carregando…</p>
        ) : txs.length === 0 ? (
          <p className="muted">Nenhuma transação ainda.</p>
        ) : (
          <table className="blaxx">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Pontos</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((x) => (
                <tr key={x.id}>
                  <td>
                    <span className={'chip ' + (x.amount_pts > 0 ? 'success' : '')}>{x.type}</span>
                  </td>
                  <td>{x.description || '—'}</td>
                  <td>
                    <span className={'chip ' + statusChip(x.status)}>{x.status}</span>
                  </td>
                  <td
                    style={{ textAlign: 'right' }}
                    className={x.amount_pts > 0 ? 'amount-pos' : 'amount-neg'}
                  >
                    {x.amount_pts > 0 ? '+' : ''}
                    {fmtNumber(x.amount_pts)}
                  </td>
                  <td className="muted">{fmtDateTime(x.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
