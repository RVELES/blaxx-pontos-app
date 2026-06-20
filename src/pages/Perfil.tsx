// Perfil — port fiel de perfil.html (dados pessoais + ações de conta).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BlaxxAPI, User } from '../lib/api-client'
import { Topbar } from '../components/Shell'

export default function Perfil() {
  const navigate = useNavigate()
  const [me, setMe] = useState<User | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const d = (await BlaxxAPI.me()) as User & { user?: User }
        setMe(d.user || d)
      } catch (e) {
        setError((e as Error).message)
      }
    })()
  }, [])

  return (
    <>
      <Topbar eyebrow="Você" title="Perfil" />
      <div className="grid cols-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <span className="eyebrow">Dados pessoais</span>
          <h3>Seu perfil</h3>
          <div className="mt-4">
            {error ? (
              <p className="muted">{error}</p>
            ) : !me ? (
              <p className="muted">…</p>
            ) : (
              <>
                <div className="row between">
                  <span className="muted">Nome</span>
                  <strong>{me.name}</strong>
                </div>
                <div className="row between mt-2">
                  <span className="muted">E-mail</span>
                  <strong>{me.email}</strong>
                </div>
                <div className="row between mt-2">
                  <span className="muted">CPF</span>
                  <strong>{me.cpf}</strong>
                </div>
                <div className="row between mt-2">
                  <span className="muted">Chave PIX</span>
                  <strong>{me.pix_key || 'não cadastrada'}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <span className="eyebrow">Conta</span>
          <h3>Ações</h3>
          <button className="btn ghost block mt-4" onClick={() => navigate('/seguranca')}>
            Segurança e senha
          </button>
          <button className="btn ghost block mt-3" onClick={() => navigate('/indique')}>
            Indique e ganhe
          </button>
          <button className="btn ghost block mt-3" onClick={() => navigate('/termos')}>
            Termos e privacidade
          </button>
          <div className="divider"></div>
          <button
            className="btn ghost block"
            style={{ color: 'var(--negative)', borderColor: 'var(--negative)' }}
            onClick={() => navigate('/excluir-conta')}
          >
            Excluir conta (LGPD)
          </button>
        </div>
      </div>
    </>
  )
}
