// Termos e privacidade — port fiel de termos.html (conteúdo regulatório/LGPD estático).
import { useNavigate } from 'react-router-dom'

export default function Termos() {
  const navigate = useNavigate()
  return (
    <div className="main center" style={{ minHeight: '100vh' }}>
      <div className="center-wrap" style={{ maxWidth: 680 }}>
        <div className="card">
          <span className="eyebrow">Documentação</span>
          <h2>Termos e privacidade</h2>
          <p className="muted">Versão 1.0 · maio/2026</p>
          <div className="divider"></div>

          <h3>1. Natureza dos pontos</h3>
          <p>
            Os pontos Blaxx são créditos promocionais nominativos de uso restrito dentro do
            programa. Não constituem moeda, depósito, investimento ou criptoativo, e não geram
            direito a saque em dinheiro ou transferência para conta bancária.
          </p>

          <h3>2. Validade</h3>
          <p>
            Pontos ganhos em parceiros têm validade de 12 meses. Pontos comprados têm validade de
            24 meses. Pontos de campanha seguem o regulamento da campanha. O consumo é FIFO: o lote
            mais antigo é debitado primeiro.
          </p>

          <h3>3. Resgate</h3>
          <p>
            O resgate via PIX é classificado como cashback e fica disponível 6 meses após o
            cadastro inicial. Limites diários se aplicam.
          </p>

          <h3>4. LGPD</h3>
          <p>
            Coletamos seus dados com finalidade declarada e base legal explícita. Você pode
            solicitar acesso, correção, exclusão e portabilidade a qualquer momento via Perfil →
            Privacidade.
          </p>

          <button className="btn primary mt-6" onClick={() => navigate(-1)}>
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
