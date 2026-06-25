// Campanhas — port fiel de campanhas.html (participar, progresso, bônus ao concluir).
import { useCallback, useEffect, useState } from 'react'
import { BlaxxAPI, Campaign, fmtBRL, fmtNumber, toast } from '../lib/api-client'
import { Topbar } from '../components/Shell'
import EmptyState from '../components/EmptyState'

export default function Campanhas() {
  const [items, setItems] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const d = await BlaxxAPI.campaigns()
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

  async function join(id: string) {
    try {
      await BlaxxAPI.campaignJoin(id)
      toast('Você está participando!', 'success')
      load()
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  async function addDemo(id: string) {
    try {
      const r = await BlaxxAPI.campaignProgress(id, 100)
      if (r.completed_at) toast('Campanha concluída! Bônus creditado.', 'success', 3000)
      else toast(`Progresso: ${r.progress_pct}%`, 'success')
      load()
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  return (
    <>
      <Topbar eyebrow="Engajamento" title="Campanhas" />
      <span className="eyebrow">Promoções ativas</span>
      <h3 className="mb-6">Campanhas em andamento</h3>

      {error ? (
        <p className="muted">Erro: {error}</p>
      ) : loading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Nenhuma campanha ativa agora"
          description="Volte em breve — toda semana lançamos novas missões com pontos bônus."
        />
      ) : (
        <div className="grid cols-2">
          {items.map((c) => {
            const completed = c.completed_at != null
            const pct = c.progress_pct || 0
            return (
              <div className="card" key={c.id}>
                {completed ? (
                  <span className="chip success">Concluída</span>
                ) : c.joined ? (
                  <span className="chip success">Participando</span>
                ) : (
                  <span className="chip">Ativa</span>
                )}
                <h3 style={{ margin: '8px 0 4px' }}>{c.name}</h3>
                <p className="muted" style={{ fontSize: 13 }}>
                  {c.description || ''}
                </p>
                <div className="card lime mt-4">
                  <span className="eyebrow">Mecânica</span>
                  <div style={{ fontSize: 14, color: 'var(--gray-800)', marginTop: 4 }}>
                    {c.mechanic || ''}
                  </div>
                </div>
                {c.joined && (
                  <>
                    <div
                      style={{
                        height: 10,
                        background: 'var(--gray-200)',
                        borderRadius: 999,
                        marginTop: 14,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: pct + '%',
                          background: 'var(--blaxx-lime)',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      Progresso: {fmtBRL(c.progress_brl || 0)} de {fmtBRL(c.target_brl)} ({pct}%)
                    </p>
                  </>
                )}
                <div className="row between mt-4">
                  <span className="muted" style={{ fontSize: 12 }}>
                    Bônus ao concluir
                  </span>
                  <strong>{fmtNumber(c.reward_pts)} pts</strong>
                </div>
                {completed ? (
                  <button className="btn ghost block mt-4" disabled>
                    Concluída
                  </button>
                ) : c.joined ? (
                  <button className="btn primary block mt-4" onClick={() => addDemo(c.id)}>
                    Simular gasto de R$ 100 (demo)
                  </button>
                ) : (
                  <button className="btn primary block mt-4" onClick={() => join(c.id)}>
                    Participar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
