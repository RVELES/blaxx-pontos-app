// Extrato — port fiel de blaxx_exe/renderer/screens/extrato.html (filtros locais + refetch por limite).
import { useEffect, useMemo, useState } from 'react'
import { Topbar } from '../components/Shell'
import { BlaxxAPI, asTxArray, fmtDateTime, fmtNumber, type Transaction } from '../lib/api-client'
import EmptyState from '../components/EmptyState'

const TYPE_LABEL: Record<string, string> = {
  purchase: 'Compra de pontos',
  transfer_in: 'Recebido',
  transfer_out: 'Enviado',
  redeem: 'Resgate',
  refund: 'Estorno',
  bonus: 'Bônus',
}

function statusChip(s: string): string {
  if (s === 'confirmed') return 'success'
  if (s === 'reversed') return 'danger'
  return 'warning'
}

export default function Extrato() {
  const [all, setAll] = useState<Transaction[]>([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [limit, setLimit] = useState('50')
  const [status, setStatus] = useState<'loading' | 'ok' | string>('loading')

  // Refetch quando muda o limite (precisa ir ao backend).
  useEffect(() => {
    let alive = true
    setStatus('loading')
    ;(async () => {
      try {
        const t = await BlaxxAPI.transactions(Number(limit))
        if (!alive) return
        setAll(asTxArray(t))
        setStatus('ok')
      } catch (e) {
        if (alive) setStatus((e as Error).message)
      }
    })()
    return () => {
      alive = false
    }
  }, [limit])

  // Filtro local (sem refetch) por busca e tipo.
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return all.filter((x) => {
      if (type && x.type !== type) return false
      if (q && !(x.description || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [all, search, type])

  const countLabel =
    filtered.length === all.length
      ? `${all.length} transações`
      : `${filtered.length} de ${all.length} transações`

  return (
    <>
      <Topbar eyebrow="Movimentações" title="Extrato" />

      <div className="card">
        <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="search"
            placeholder="Buscar por descrição…"
            autoComplete="off"
            style={{ flex: 1, minWidth: 200 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={{ minWidth: 200 }}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="purchase">Compra de pontos</option>
            <option value="transfer_in">Recebido</option>
            <option value="transfer_out">Enviado</option>
            <option value="redeem">Resgate</option>
            <option value="refund">Estorno</option>
            <option value="bonus">Bônus</option>
          </select>
          <select
            style={{ minWidth: 120 }}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          >
            <option value="50">50 últimas</option>
            <option value="100">100 últimas</option>
            <option value="200">200 últimas</option>
            <option value="500">500 últimas</option>
          </select>
        </div>
        <div className="muted mt-2" style={{ fontSize: 12 }}>
          {status === 'loading' ? '—' : countLabel}
        </div>
      </div>

      <div className="card mt-6">
        {status === 'loading' ? (
          'Carregando…'
        ) : status !== 'ok' ? (
          <p className="muted" style={{ textAlign: 'center', padding: 24, color: '#ff6b6b' }}>
            Falha ao carregar: {status}
          </p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Nada por aqui ainda"
            description="Quando você tiver transações que casam com o filtro, elas aparecem nesta lista."
            size="sm"
          />
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
              {filtered.map((x) => (
                <tr key={x.id}>
                  <td>
                    <span className={'chip ' + (x.amount_pts > 0 ? 'success' : '')}>
                      {TYPE_LABEL[x.type] || x.type}
                    </span>
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
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {fmtDateTime(x.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
