// Indique e ganhe — port fiel de indique.html (código de indicação + copiar).
import { toast } from '../lib/api-client'
import { Topbar } from '../components/Shell'

const REFERRAL_CODE = 'BLAXX-A7K3'

export default function Indique() {
  function copy() {
    navigator.clipboard.writeText(REFERRAL_CODE).then(() => toast('Código copiado'))
  }

  return (
    <>
      <Topbar eyebrow="Indique e ganhe" title="Indicações" />
      <div className="main center" style={{ minHeight: '60vh' }}>
        <div className="card elevated center-text" style={{ maxWidth: 480 }}>
          <span className="eyebrow">Indique e ganhe</span>
          <h2>Seu código</h2>
          <div className="card lime mt-4">
            <div className="mono" style={{ fontSize: 24, letterSpacing: '0.1em', fontWeight: 700 }}>
              {REFERRAL_CODE}
            </div>
          </div>
          <p className="subtitle mt-4">
            Você ganha 1.000 pts a cada amigo que se cadastrar e fizer a 1ª compra.
          </p>
          <button className="btn primary" onClick={copy}>
            Copiar código
          </button>
        </div>
      </div>
    </>
  )
}
